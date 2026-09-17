import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FORMATS,
  checkOutput,
  isFaststart,
  readPngSize,
  validateCaption,
  validateCarousel,
  validateVideo,
} from './check-output.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'check-output.mjs');

// ---------------------------------------------------------------- fixtures
// Everything is built inline: no binary fixtures, no ffmpeg, no ffprobe.

/** An `ffprobe -print_format json -show_streams -show_format` result. */
const probe = ({
  width = 1080,
  height = 1920,
  fps = '30/1',
  codec = 'h264',
  pix = 'yuv420p',
  duration = '15.0',
  audio = null,
} = {}) => ({
  streams: [
    { codec_type: 'video', codec_name: codec, pix_fmt: pix, width, height, r_frame_rate: fps },
    ...(audio ? [{ codec_type: 'audio', codec_name: audio }] : []),
  ],
  format: { duration: String(duration) },
});

/** A 16-byte top-level MP4 box: 8-byte header + 8 bytes of payload. */
const box = (type, payload = 8) => {
  const b = Buffer.alloc(8 + payload);
  b.writeUInt32BE(8 + payload, 0);
  b.write(type, 4, 'ascii');
  return b;
};
const mp4 = (...types) => Buffer.concat(types.map((t) => box(t)));

/** A 24-byte PNG head: signature + IHDR length/type + width/height. */
const png = (width, height) => {
  const b = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'ascii');
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
};

const caption = ({
  body = 'Ship day. Here is the thing we built.',
  hashtags = '#build #ship #demo',
  alt = 'A phone screen showing the app.',
  claims = '- 3 users tested it (source: notes.md)',
} = {}) =>
  `# Post\n\n## Caption\n\n${body}\n\n## Hashtags\n\n${hashtags}\n\n## Alt text\n\n${alt}\n\n## Claims\n\n${claims}\n`;

const codes = (r) => r.errors.map((e) => e.code);
const warnCodes = (r) => r.warnings.map((w) => w.code);

/** A throwaway out-dir seeded with the given files. */
const outDir = (files = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'ig-studio-'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
};

// process.execPath, not 'node': the ffprobe test blanks PATH, which would otherwise
// hide the node binary itself from the spawn.
const run = (args, env) => {
  try {
    return {
      code: 0,
      stdout: execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, ...env } }),
      stderr: '',
    };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
};

// ------------------------------------------------------------------ video

test('a valid reel probe produces no errors', () => {
  const r = validateVideo('reel', probe());
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(FORMATS.reel.width, 1080);
  assert.equal(FORMATS.reel.height, 1920);
  assert.equal(FORMATS.carousel.minSlides, 3);
  assert.equal(FORMATS.carousel.maxSlides, 10);
});

test('a landscape canvas on a reel is video.dimensions', () => {
  const r = validateVideo('reel', probe({ width: 1920, height: 1080 }));
  assert.deepEqual(codes(r), ['video.dimensions']);
  assert.match(r.errors[0].message, /1920x1080/);
  assert.deepEqual(codes(validateVideo('feed', probe({ width: 1080, height: 1350 }))), []);
});

test('any frame rate other than exactly 30 is video.fps', () => {
  assert.deepEqual(codes(validateVideo('reel', probe({ fps: '25/1' }))), ['video.fps']);
  assert.deepEqual(codes(validateVideo('reel', probe({ fps: '30000/1001' }))), ['video.fps']);
  assert.deepEqual(codes(validateVideo('reel', probe({ fps: '60/2' }))), []);
});

test('a reel shorter than 7s or longer than 30s is video.duration', () => {
  assert.deepEqual(codes(validateVideo('reel', probe({ duration: '6.9' }))), ['video.duration']);
  assert.deepEqual(codes(validateVideo('reel', probe({ duration: '30.1' }))), ['video.duration']);
  assert.deepEqual(codes(validateVideo('reel', probe({ duration: '7.0' }))), []);
  assert.deepEqual(codes(validateVideo('reel', probe({ duration: '30.0' }))), []);
});

test('a story file over 15s is video.duration', () => {
  assert.deepEqual(codes(validateVideo('story', probe({ duration: '15.2' }))), ['video.duration']);
  assert.deepEqual(codes(validateVideo('story', probe({ duration: '15.0' }))), []);
});

test('duration is read from format.duration, not from the stream', () => {
  const p = probe({ duration: '15.0' });
  p.streams[0].duration = '99.0';
  assert.deepEqual(codes(validateVideo('reel', p)), []);
  p.format.duration = '31.5';
  assert.deepEqual(codes(validateVideo('reel', p)), ['video.duration']);
});

test('a non-h264 codec is video.codec and a non-yuv420p pix_fmt is video.pixfmt', () => {
  assert.deepEqual(codes(validateVideo('reel', probe({ codec: 'hevc' }))), ['video.codec']);
  assert.deepEqual(codes(validateVideo('reel', probe({ pix: 'yuv444p' }))), ['video.pixfmt']);
});

test('an audio stream that is not aac is video.audio; aac and silence both pass', () => {
  assert.deepEqual(codes(validateVideo('reel', probe({ audio: 'mp3' }))), ['video.audio']);
  assert.deepEqual(codes(validateVideo('reel', probe({ audio: 'aac' }))), []);
  assert.deepEqual(codes(validateVideo('reel', probe())), []);
});

test('isFaststart is true only when the moov box precedes mdat', () => {
  assert.equal(isFaststart(mp4('ftyp', 'moov', 'mdat')), true);
  assert.equal(isFaststart(mp4('ftyp', 'mdat', 'moov')), false);
  assert.equal(isFaststart(mp4('ftyp', 'free', 'moov', 'mdat')), true);
  assert.equal(isFaststart(mp4('ftyp')), false); // no moov at all
  // size 1 => 64-bit largesize in the next 8 bytes
  const big = Buffer.alloc(16);
  big.writeUInt32BE(1, 0);
  big.write('mdat', 4, 'ascii');
  big.writeBigUInt64BE(16n, 8);
  assert.equal(isFaststart(Buffer.concat([box('ftyp'), big, box('moov')])), false);
  assert.equal(isFaststart(Buffer.concat([box('ftyp'), box('moov'), big])), true);
  // size 0 => the box runs to EOF
  const toEof = Buffer.alloc(16);
  toEof.write('mdat', 4, 'ascii');
  assert.equal(isFaststart(Buffer.concat([box('moov'), toEof])), true);
  assert.equal(isFaststart(Buffer.concat([toEof, box('moov')])), false);
});

// -------------------------------------------------------------------- png

test('readPngSize reads width and height from the IHDR header', () => {
  assert.deepEqual(readPngSize(png(1080, 1350)), { width: 1080, height: 1350 });
  assert.throws(() => readPngSize(Buffer.from('not an image at all!!')), /not a PNG/);
  assert.throws(() => readPngSize(png(1080, 1350).subarray(0, 20)), /not a PNG/);
});

// --------------------------------------------------------------- carousel

const slide = (n, width = 1080, height = 1350) => ({
  file: `slide-${String(n).padStart(2, '0')}.png`,
  width,
  height,
});
const slides = (n) => Array.from({ length: n }, (_, i) => slide(i + 1));

test('a carousel outside 3-10 slides is carousel.count', () => {
  assert.deepEqual(codes(validateCarousel(slides(2))), ['carousel.count']);
  assert.deepEqual(codes(validateCarousel(slides(11))), ['carousel.count']);
  assert.deepEqual(codes(validateCarousel(slides(3))), []);
  assert.deepEqual(codes(validateCarousel(slides(10))), []);
});

test('slide numbering that is not contiguous from slide-01 is carousel.sequence', () => {
  assert.deepEqual(codes(validateCarousel([slide(2), slide(3), slide(4)])), ['carousel.sequence']);
  assert.deepEqual(codes(validateCarousel([slide(1), slide(2), slide(4)])), ['carousel.sequence']);
  assert.deepEqual(codes(validateCarousel([slide(1), slide(2), slide(3)])), []);
});

test('a slide that is not 1080x1350 is carousel.dimensions', () => {
  const bad = [slide(1), slide(2, 1080, 1920), slide(3)];
  assert.deepEqual(codes(validateCarousel(bad)), ['carousel.dimensions']);
  assert.match(validateCarousel(bad).errors[0].message, /slide-02\.png/);
});

test('a slide with no readable size is carousel.unreadable and still counts toward the set', () => {
  const r = validateCarousel([slide(1), { file: 'slide-02.png' }, slide(3)]);
  assert.deepEqual(codes(r), ['carousel.unreadable']);
  assert.match(r.errors[0].message, /slide-02\.png/);
});

// ---------------------------------------------------------------- caption

test('a well-formed caption produces no errors and no warnings', () => {
  const r = validateCaption(caption());
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test('a caption body over 2200 characters is caption.length', () => {
  assert.deepEqual(codes(validateCaption(caption({ body: 'x'.repeat(2200) }))), []);
  assert.deepEqual(codes(validateCaption(caption({ body: 'x'.repeat(2201) }))), ['caption.length']);
});

test('a distinct hashtag count outside 3-5 is caption.hashtags', () => {
  assert.deepEqual(codes(validateCaption(caption({ hashtags: '#one #two' }))), ['caption.hashtags']);
  assert.deepEqual(
    codes(validateCaption(caption({ hashtags: '#a #b #c #d #e #f' }))),
    ['caption.hashtags'],
  );
  // repeats collapse: four tags, three distinct
  assert.deepEqual(codes(validateCaption(caption({ hashtags: '#a #a #b #c' }))), []);
  assert.deepEqual(codes(validateCaption(caption({ hashtags: '#a #b #c #d #e' }))), []);
});

test('a missing required section is caption.section', () => {
  const full = caption();
  for (const heading of ['## Caption', '## Hashtags', '## Alt text', '## Claims']) {
    const r = validateCaption(full.replace(heading, '## Something else'));
    assert.ok(codes(r).includes('caption.section'), `${heading} removal should be caption.section`);
    assert.ok(r.errors.some((e) => e.message.includes(heading)));
  }
});

test('placeholders are a caption.placeholder warning, never an error', () => {
  for (const marker of ['[CONFIRM: the launch date]', '[NEED: the real number]']) {
    const r = validateCaption(caption({ body: `Launch ${marker} today.` }));
    assert.deepEqual(codes(r), []);
    assert.deepEqual(warnCodes(r), ['caption.placeholder']);
    assert.match(r.warnings[0].message, /not post-ready/);
  }
});

// -------------------------------------------------------------- out-dir

const fakeProbe = (byFile) => (path) => {
  const name = path.split('/').pop();
  if (!(name in byFile)) throw new Error(`unexpected ffprobe call for ${name}`);
  return byFile[name];
};

const ok = () => mp4('ftyp', 'moov', 'mdat');
const reelProbes = { 'reel.mp4': probe(), 'reel-cover.jpg': probe({ width: 1080, height: 1920 }) };
const feedProbes = {
  'feed.mp4': probe({ width: 1080, height: 1350 }),
  'feed-cover.jpg': probe({ width: 1080, height: 1350 }),
};

test('reel and feed each carry their own cover and pass on their own', () => {
  const reelDir = outDir({ 'reel.mp4': ok(), 'reel-cover.jpg': Buffer.alloc(4), 'caption.md': caption() });
  assert.deepEqual(codes(checkOutput(reelDir, { format: 'reel', probe: fakeProbe(reelProbes) })), []);

  const feedDir = outDir({ 'feed.mp4': ok(), 'feed-cover.jpg': Buffer.alloc(4), 'caption.md': caption() });
  assert.deepEqual(codes(checkOutput(feedDir, { format: 'feed', probe: fakeProbe(feedProbes) })), []);
});

test('under --format all, reel and feed covers are checked against their own canvases', () => {
  const dir = outDir({
    'reel.mp4': ok(),
    'reel-cover.jpg': Buffer.alloc(4),
    'feed.mp4': ok(),
    'feed-cover.jpg': Buffer.alloc(4),
    'caption.md': caption(),
  });
  const r = checkOutput(dir, { format: 'all', probe: fakeProbe({ ...reelProbes, ...feedProbes }) });
  assert.deepEqual(r.formats, ['reel', 'feed']);
  assert.deepEqual(codes(r), []);
});

test('a reel with only the feed cover present is cover.missing, named per format', () => {
  const dir = outDir({ 'reel.mp4': ok(), 'feed-cover.jpg': Buffer.alloc(4), 'caption.md': caption() });
  const r = checkOutput(dir, { format: 'reel', probe: fakeProbe({ 'reel.mp4': probe() }) });
  assert.deepEqual(codes(r), ['cover.missing']);
  assert.match(r.errors[0].message, /reel-cover\.jpg/);
});

test('a reel cover on the wrong canvas is cover.dimensions', () => {
  const dir = outDir({ 'reel.mp4': ok(), 'reel-cover.jpg': Buffer.alloc(4), 'caption.md': caption() });
  const probes = { 'reel.mp4': probe(), 'reel-cover.jpg': probe({ width: 1080, height: 1350 }) };
  const r = checkOutput(dir, { format: 'reel', probe: fakeProbe(probes) });
  assert.deepEqual(codes(r), ['cover.dimensions']);
  assert.match(r.errors[0].message, /reel-cover\.jpg/);
});

test('a legacy cover.jpg is ignored: not an error, not a deliverable', () => {
  const dir = outDir({ 'reel.mp4': ok(), 'reel-cover.jpg': Buffer.alloc(4), 'cover.jpg': Buffer.alloc(4), 'caption.md': caption() });
  assert.deepEqual(codes(checkOutput(dir, { format: 'reel', probe: fakeProbe(reelProbes) })), []);
  // on its own it is not a deliverable at all
  assert.deepEqual(codes(checkOutput(outDir({ 'cover.jpg': Buffer.alloc(4) }), { format: 'all' })), [
    'output.empty',
  ]);
});

test('a reel whose mdat precedes moov is video.faststart', () => {
  const dir = outDir({
    'reel.mp4': mp4('ftyp', 'mdat', 'moov'),
    'reel-cover.jpg': Buffer.alloc(4),
    'caption.md': caption(),
  });
  assert.deepEqual(codes(checkOutput(dir, { format: 'reel', probe: fakeProbe(reelProbes) })), [
    'video.faststart',
  ]);
});

test('one corrupt slide is reported once and does not cascade into count or sequence', () => {
  const dir = outDir({
    'slide-01.png': png(1080, 1350),
    'slide-02.png': Buffer.from('this is not a png'),
    'slide-03.png': png(1080, 1350),
    'caption.md': caption(),
  });
  const r = checkOutput(dir, { format: 'carousel' });
  assert.deepEqual(codes(r), ['carousel.unreadable']);
  assert.match(r.errors[0].message, /slide-02\.png/);
});

test('story files outside 1-3 are story.count and a gap is story.sequence', () => {
  const ok = mp4('ftyp', 'moov', 'mdat');
  const storyProbe = probe({ duration: '10.0' });

  const four = outDir({
    'story-1.mp4': ok, 'story-2.mp4': ok, 'story-3.mp4': ok, 'story-4.mp4': ok, 'caption.md': caption(),
  });
  const p4 = fakeProbe(Object.fromEntries([1, 2, 3, 4].map((n) => [`story-${n}.mp4`, storyProbe])));
  assert.deepEqual(codes(checkOutput(four, { format: 'story', probe: p4 })), ['story.count']);

  const gap = outDir({ 'story-1.mp4': ok, 'story-3.mp4': ok, 'caption.md': caption() });
  const pg = fakeProbe({ 'story-1.mp4': storyProbe, 'story-3.mp4': storyProbe });
  assert.deepEqual(codes(checkOutput(gap, { format: 'story', probe: pg })), ['story.sequence']);

  const good = outDir({ 'story-1.mp4': ok, 'story-2.mp4': ok, 'caption.md': caption() });
  const pok = fakeProbe({ 'story-1.mp4': storyProbe, 'story-2.mp4': storyProbe });
  assert.deepEqual(codes(checkOutput(good, { format: 'story', probe: pok })), []);
});

test('an out-dir with deliverables but no caption.md is caption.missing', () => {
  const dir = outDir({ 'slide-01.png': png(1080, 1350), 'slide-02.png': png(1080, 1350), 'slide-03.png': png(1080, 1350) });
  assert.deepEqual(codes(checkOutput(dir, { format: 'carousel' })), ['caption.missing']);
});

test('--format all checks every format that has at least one file present', () => {
  const dir = outDir({
    'reel.mp4': mp4('ftyp', 'moov', 'mdat'),
    'reel-cover.jpg': Buffer.alloc(4),
    'slide-01.png': png(1080, 1350),
    'slide-02.png': png(1080, 1350),
    'slide-03.png': png(1080, 1350),
    'caption.md': caption(),
  });
  const p = fakeProbe({ 'reel.mp4': probe(), 'reel-cover.jpg': probe() });
  const r = checkOutput(dir, { format: 'all', probe: p });
  assert.deepEqual(r.formats, ['reel', 'carousel']);
  assert.deepEqual(codes(r), []);
});

test('an out-dir with no deliverables at all is output.empty', () => {
  const r = checkOutput(outDir({ 'notes.txt': 'hi' }), { format: 'all' });
  assert.deepEqual(codes(r), ['output.empty']);
});

// ------------------------------------------------------------------- cli

test('the CLI exits 2 on usage errors and on a missing out-dir', () => {
  assert.equal(run([]).code, 2);
  assert.equal(run([outDir(), '--format', 'tiktok']).code, 2);
  const gone = run([join(tmpdir(), 'ig-studio-does-not-exist-12345'), '--format', 'all']);
  assert.equal(gone.code, 2);
  assert.match(gone.stderr, /out-dir/);
});

test('the CLI runs when reached through a symlinked path', () => {
  // Regression: the entry-point guard compared import.meta.url to `file://${process.argv[1]}`.
  // Node resolves the main entry's symlinks but argv[1] keeps the symlinked spelling, so on
  // macOS (/tmp -> /private/tmp) the guard was false, main() never ran, and the validator
  // printed nothing and exited 0 — a silent pass from a tool whose whole job is to fail loudly.
  const link = join(mkdtempSync(join(tmpdir(), 'ig-studio-link-')), 'scripts');
  symlinkSync(here, link);

  let stdout = '';
  let code = 0;
  try {
    stdout = execFileSync(
      process.execPath,
      [join(link, 'check-output.mjs'), outDir(), '--format', 'all', '--json'],
      { encoding: 'utf8' },
    );
  } catch (e) {
    stdout = e.stdout ?? '';
    code = e.status;
  }

  assert.notEqual(stdout.trim(), '', 'the CLI printed nothing — main() never ran through the symlink');
  assert.match(stdout, /output\.empty/);
  assert.equal(code, 1);
});

test('the CLI exits 2 when ffprobe is not on PATH', () => {
  const dir = outDir({ 'reel.mp4': mp4('ftyp', 'moov', 'mdat'), 'caption.md': caption() });
  const r = run([dir, '--format', 'reel'], { PATH: join(tmpdir(), 'ig-studio-empty-path') });
  assert.equal(r.code, 2);
  assert.match(r.stderr, /ffprobe/);
});

test('the CLI exits 1 on an empty out-dir and 0 on a clean carousel', () => {
  assert.equal(run([outDir(), '--format', 'all']).code, 1);

  const dir = outDir({
    'slide-01.png': png(1080, 1350),
    'slide-02.png': png(1080, 1350),
    'slide-03.png': png(1080, 1350),
    'caption.md': caption(),
  });
  const ok = run([dir, '--format', 'carousel']);
  assert.equal(ok.code, 0);
  assert.match(ok.stdout, /OK/);

  const json = run([dir, '--format', 'carousel', '--json']);
  assert.equal(json.code, 0);
  assert.deepEqual(JSON.parse(json.stdout).errors, []);
});

test('the CLI still exits 0 when the only finding is a placeholder warning', () => {
  const dir = outDir({
    'slide-01.png': png(1080, 1350),
    'slide-02.png': png(1080, 1350),
    'slide-03.png': png(1080, 1350),
    'caption.md': caption({ body: 'Launch [CONFIRM: date] soon.' }),
  });
  const r = run([dir, '--format', 'carousel', '--json']);
  assert.equal(r.code, 0);
  const out = JSON.parse(r.stdout);
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.warnings.map((w) => w.code), ['caption.placeholder']);
});

test('the CLI exits 1 on a slide that is the wrong size', () => {
  const dir = outDir({
    'slide-01.png': png(1080, 1350),
    'slide-02.png': png(1080, 1920),
    'slide-03.png': png(1080, 1350),
    'caption.md': caption(),
  });
  const r = run([dir, '--format', 'carousel']);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /carousel\.dimensions/);
});
