#!/usr/bin/env node
// instagram-studio: validate a rendered output directory against the platform
// contract before anything is posted. Deterministic — it inspects files, never
// renders and never publishes.
//
// Usage:
//   node check-output.mjs <out-dir> --format reel|story|feed|carousel|all [--json]
//
// `all` checks every format for which at least one expected file exists.
// Exit codes: 0 no errors (warnings allowed), 1 any error, 2 usage error,
// out-dir missing, or ffprobe not installed.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The canvas/encoding contract, per format. Carousel slides are stills, so no fps/duration. */
export const FORMATS = Object.freeze({
  reel: Object.freeze({ width: 1080, height: 1920, fps: 30, minSec: 7, maxSec: 30 }),
  story: Object.freeze({ width: 1080, height: 1920, fps: 30, minSec: 0, maxSec: 15 }),
  feed: Object.freeze({ width: 1080, height: 1350, fps: 30, minSec: 7, maxSec: 30 }),
  carousel: Object.freeze({ width: 1080, height: 1350, minSlides: 3, maxSlides: 10 }),
});

const VIDEO_CODEC = 'h264';
const PIX_FMT = 'yuv420p';
const AUDIO_CODEC = 'aac';
const CAPTION_MAX = 2200;
const HASHTAG_MIN = 3;
const HASHTAG_MAX = 5;
const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;
const REQUIRED_SECTIONS = ['## Caption', '## Hashtags', '## Alt text', '## Claims'];
const PLACEHOLDERS = ['[CONFIRM:', '[NEED:'];
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const STORY_RE = /^story-(\d+)\.mp4$/;
const SLIDE_RE = /^slide-(\d+)\.png$/;
// Covers are per format, always: one file could not satisfy both canvases under
// `--format all`. A legacy `cover.jpg` is not an expected filename anywhere.
const COVERS = Object.freeze({ reel: 'reel-cover.jpg', feed: 'feed-cover.jpg' });

const report = () => ({ errors: [], warnings: [] });
const fail = (r, code, message) => r.errors.push({ code, message });
const warn = (r, code, message) => r.warnings.push({ code, message });
const spec = (format) => (typeof format === 'string' ? FORMATS[format] : format);

/**
 * Validate one video against its format's contract. `probe` is the parsed output of
 * `ffprobe -v error -print_format json -show_streams -show_format`. Faststart lives in
 * the file's box order, not in the probe, so it is checked separately by isFaststart.
 */
export function validateVideo(format, probe) {
  const want = spec(format);
  if (!want) throw new Error(`unknown format: ${format}`);
  const r = report();
  const streams = probe?.streams ?? [];
  const video = streams.find((s) => s.codec_type === 'video');
  if (!video) {
    fail(r, 'video.missing', 'no video stream in the file');
    return r;
  }

  if (video.width !== want.width || video.height !== want.height) {
    fail(r, 'video.dimensions', `canvas is ${video.width}x${video.height}, expected ${want.width}x${want.height}`);
  }

  const [num, den] = String(video.r_frame_rate ?? '').split('/');
  const fps = Number(den) ? Number(num) / Number(den) : NaN;
  if (fps !== want.fps) {
    fail(r, 'video.fps', `frame rate is ${video.r_frame_rate}, expected exactly ${want.fps}`);
  }

  // The container duration is authoritative; a stream's own duration can differ.
  const duration = parseFloat(probe?.format?.duration);
  if (!Number.isFinite(duration)) {
    fail(r, 'video.duration', 'format.duration was not reported by ffprobe');
  } else if (duration < want.minSec || duration > want.maxSec) {
    fail(r, 'video.duration', `duration is ${duration}s, expected ${want.minSec}-${want.maxSec}s`);
  }

  if (video.codec_name !== VIDEO_CODEC) {
    fail(r, 'video.codec', `codec is ${video.codec_name}, expected ${VIDEO_CODEC}`);
  }
  if (video.pix_fmt !== PIX_FMT) {
    fail(r, 'video.pixfmt', `pix_fmt is ${video.pix_fmt}, expected ${PIX_FMT}`);
  }

  for (const audio of streams.filter((s) => s.codec_type === 'audio')) {
    if (audio.codec_name !== AUDIO_CODEC) {
      fail(r, 'video.audio', `audio codec is ${audio.codec_name}, expected ${AUDIO_CODEC}`);
    }
  }
  return r;
}

/**
 * Walk the top-level MP4 boxes: true iff `moov` comes before `mdat` (what `+faststart`
 * produces). A box is a UInt32BE size plus a 4-byte ASCII type; size 1 means a UInt64BE
 * largesize follows, size 0 means the box runs to the end of the file.
 */
export function isFaststart(buffer) {
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > buffer.length) return false;
      size = Number(buffer.readBigUInt64BE(offset + 8));
      header = 16;
    } else if (size === 0) {
      size = buffer.length - offset;
    }
    if (type === 'moov') return true;
    if (type === 'mdat') return false;
    if (size < header) return false; // malformed: refuse to loop forever
    offset += size;
  }
  return false; // no moov box at all
}

/** Read width/height straight out of a PNG's IHDR header — no decoder needed. */
export function readPngSize(buffer) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('not a PNG');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/**
 * Validate the carousel as a set: how many slides, how they are numbered, how big they
 * are. A slide whose size could not be read is reported once as `carousel.unreadable`
 * and still counts toward the set, so one corrupt file cannot cascade into spurious
 * count/sequence errors.
 */
export function validateCarousel(slides) {
  const { width, height, minSlides, maxSlides } = FORMATS.carousel;
  const r = report();

  if (slides.length < minSlides || slides.length > maxSlides) {
    fail(r, 'carousel.count', `${slides.length} slide(s) found, expected ${minSlides}-${maxSlides}`);
  }

  const expected = slides.map((_, i) => `slide-${String(i + 1).padStart(2, '0')}.png`);
  const actual = slides.map((s) => s.file);
  if (expected.join(',') !== actual.join(',')) {
    fail(r, 'carousel.sequence', `slides must be numbered contiguously from slide-01.png, found ${actual.join(', ')}`);
  }

  for (const s of slides) {
    if (!Number.isInteger(s.width) || !Number.isInteger(s.height)) {
      fail(r, 'carousel.unreadable', `${s.file} is not a readable PNG`);
    } else if (s.width !== width || s.height !== height) {
      fail(r, 'carousel.dimensions', `${s.file} is ${s.width}x${s.height}, expected ${width}x${height}`);
    }
  }
  return r;
}

/** The body of a `## <name>` section: everything up to the next `## ` heading. */
function section(markdown, heading) {
  const lines = String(markdown).split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('## '));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();
}

/** Validate caption.md: required sections, caption length, hashtag count, placeholders. */
export function validateCaption(markdown) {
  const r = report();
  const text = String(markdown ?? '');

  for (const heading of REQUIRED_SECTIONS) {
    if (section(text, heading) === null) {
      fail(r, 'caption.section', `required section ${heading} is missing`);
    }
  }

  const body = section(text, '## Caption');
  if (body !== null && body.length > CAPTION_MAX) {
    fail(r, 'caption.length', `caption is ${body.length} characters, the limit is ${CAPTION_MAX}`);
  }

  const tags = section(text, '## Hashtags');
  if (tags !== null) {
    const distinct = new Set(tags.match(HASHTAG_RE) ?? []);
    if (distinct.size < HASHTAG_MIN || distinct.size > HASHTAG_MAX) {
      fail(r, 'caption.hashtags', `${distinct.size} distinct hashtag(s), expected ${HASHTAG_MIN}-${HASHTAG_MAX}`);
    }
  }

  const found = PLACEHOLDERS.filter((p) => text.includes(p));
  if (found.length) {
    warn(r, 'caption.placeholder', `unresolved ${found.join(' / ')} placeholder(s) — not post-ready until a human fills them in`);
  }
  return r;
}

/** Run ffprobe on one file and return its parsed JSON. */
function ffprobe(path) {
  let out;
  try {
    out = execFileSync(
      'ffprobe',
      ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', path],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    );
  } catch (e) {
    if (e.code === 'ENOENT') {
      const err = new Error('ffprobe was not found on PATH — install ffmpeg to validate video deliverables');
      err.ffprobeMissing = true;
      throw err;
    }
    throw new Error(`ffprobe failed on ${path}: ${String(e.stderr || e.message).trim()}`);
  }
  return JSON.parse(out);
}

const indexed = (files, re) =>
  files
    .map((f) => ({ file: f, n: Number(re.exec(f)?.[1]) }))
    .filter((x) => Number.isInteger(x.n))
    .sort((a, b) => a.n - b.n);

const merge = (into, from) => {
  into.errors.push(...from.errors);
  into.warnings.push(...from.warnings);
};

function checkVideoFile(r, dir, format, file, probe) {
  merge(r, validateVideo(format, probe(join(dir, file))));
  if (!isFaststart(readFileSync(join(dir, file)))) {
    fail(r, 'video.faststart', `${file} is not +faststart — the moov box must precede mdat`);
  }
}

/**
 * Check a rendered out-dir. `probe` is injectable so the behavior can be exercised
 * against recorded ffprobe output without ffmpeg installed.
 */
export function checkOutput(dir, { format = 'reel', probe = ffprobe } = {}) {
  const r = { ...report(), formats: [] };
  const files = readdirSync(dir).sort();
  const stories = indexed(files, STORY_RE);
  const slides = indexed(files, SLIDE_RE);

  const present = {
    reel: files.includes('reel.mp4'),
    story: stories.length > 0,
    feed: files.includes('feed.mp4'),
    carousel: slides.length > 0,
  };
  if (!Object.values(present).some(Boolean)) {
    fail(r, 'output.empty', `no deliverables found in ${dir} — nothing to validate`);
    return r;
  }

  r.formats = format === 'all'
    ? Object.keys(FORMATS).filter((f) => present[f])
    : [format];

  for (const f of r.formats) {
    if (f === 'reel' || f === 'feed') {
      const file = `${f}.mp4`;
      if (!files.includes(file)) {
        fail(r, 'video.missing', `${file} is missing from the out-dir`);
        continue;
      }
      checkVideoFile(r, dir, f, file, probe);
      const coverFile = COVERS[f];
      if (!files.includes(coverFile)) {
        fail(r, 'cover.missing', `${coverFile} is missing — every ${f} needs its own cover`);
      } else {
        const cover = probe(join(dir, coverFile)).streams?.find((s) => s.codec_type === 'video');
        const want = FORMATS[f];
        if (!cover || cover.width !== want.width || cover.height !== want.height) {
          fail(r, 'cover.dimensions', `${coverFile} is ${cover ? `${cover.width}x${cover.height}` : 'unreadable'}, expected ${want.width}x${want.height}`);
        }
      }
    } else if (f === 'story') {
      const max = 3;
      if (stories.length < 1 || stories.length > max || stories.some((s) => s.n < 1 || s.n > max)) {
        fail(r, 'story.count', `${stories.length} story file(s) found (${stories.map((s) => s.file).join(', ') || 'none'}), expected 1-${max} numbered story-1..story-${max}`);
      } else if (stories.some((s, i) => s.n !== i + 1)) {
        fail(r, 'story.sequence', `story files must be numbered contiguously from story-1.mp4, found ${stories.map((s) => s.file).join(', ')}`);
      }
      for (const s of stories) checkVideoFile(r, dir, 'story', s.file, probe);
    } else if (f === 'carousel') {
      // Every slide file stays in the list even when its header is unreadable: count and
      // sequence describe the set on disk, not the subset that happened to parse.
      const measured = slides.map((s) => {
        try {
          return { file: s.file, ...readPngSize(readFileSync(join(dir, s.file))) };
        } catch {
          return { file: s.file };
        }
      });
      merge(r, validateCarousel(measured));
    }
  }

  if (!files.includes('caption.md')) {
    fail(r, 'caption.missing', 'caption.md is missing from the out-dir');
  } else {
    merge(r, validateCaption(readFileSync(join(dir, 'caption.md'), 'utf8')));
  }
  return r;
}

function usage(msg) {
  const out = msg ? process.stderr : process.stdout;
  out.write(`${msg ? `${msg}\n` : ''}usage: check-output.mjs <out-dir> --format reel|story|feed|carousel|all [--json]\n`);
  return msg ? 2 : 0;
}

export function main(argv) {
  const o = { format: 'reel', json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') return usage('');
    if (a === '--json') o.json = true;
    else if (a === '--format') o.format = argv[++i];
    else if (a.startsWith('-')) return usage(`unknown option: ${a}`);
    else if (o.dir === undefined) o.dir = a;
    else return usage(`unexpected argument: ${a}`);
  }

  if (o.dir === undefined) return usage('an out-dir is required');
  if (o.format !== 'all' && !(o.format in FORMATS)) {
    return usage(`unknown format: ${o.format}`);
  }
  try {
    if (!statSync(o.dir).isDirectory()) return usage(`out-dir is not a directory: ${o.dir}`);
  } catch {
    return usage(`out-dir does not exist: ${o.dir}`);
  }

  let result;
  try {
    result = checkOutput(o.dir, { format: o.format });
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    return e.ffprobeMissing ? 2 : 1;
  }

  if (o.json) {
    process.stdout.write(`${JSON.stringify({ ok: result.errors.length === 0, ...result }, null, 2)}\n`);
  } else {
    process.stdout.write(`${result.errors.length ? 'FAIL' : 'OK'}: ${o.dir} [${result.formats.join(', ')}]\n`);
    for (const e of result.errors) process.stdout.write(`  error    ${e.code}  ${e.message}\n`);
    for (const w of result.warnings) process.stdout.write(`  warning  ${w.code}  ${w.message}\n`);
  }
  return result.errors.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
