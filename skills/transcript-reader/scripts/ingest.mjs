#!/usr/bin/env node
// transcript-reader: deterministic ingest — normalize a meeting transcript and
// chunk it speaker-aware with overlap. No LLM anywhere in this file; Node stdlib only.
//
// Usage:
//   node ingest.mjs <transcript-file> [--outdir <dir>] [--chunk-size N] [--overlap N]
//
// Supported inputs: WebVTT (.vtt), SubRip (.srt), Zoom .txt exports, Google Meet
// doc-style exports, and plain speaker-labeled text ("[HH:MM:SS] Name: text",
// "HH:MM:SS Name: text", "Name (HH:MM:SS): text", or bare "Name: text").
//
// Outputs, in <outdir> (default: <input-dir>/<basename>-ingest/):
//   normalized.txt   one utterance per line: "[HH:MM:SS] Speaker: text" — line N is
//                    utterance N; citations are these line numbers (and timestamps).
//   chunks/chunk-NN.txt   overlapping speaker-aware chunks; every line carries its
//                    global normalized line number as "L<n> " so extractors can cite.
//   manifest.json    chunk map + stats + parse warnings.
// Prints the manifest JSON to stdout as well.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

// ---------- arg parsing ----------

function parseArgs(argv) {
  const opts = { chunkSize: 80, overlap: 12 };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--outdir') opts.outdir = argv[++i];
    else if (a === '--chunk-size') opts.chunkSize = Number(argv[++i]);
    else if (a === '--overlap') opts.overlap = Number(argv[++i]);
    else if (a.startsWith('--')) throw new Error(`unknown option: ${a}`);
    else positional.push(a);
  }
  if (positional.length !== 1) throw new Error('exactly one input file is required');
  if (!Number.isInteger(opts.chunkSize) || opts.chunkSize < 10) {
    throw new Error('--chunk-size must be an integer >= 10');
  }
  if (!Number.isInteger(opts.overlap) || opts.overlap < 0 || opts.overlap >= opts.chunkSize) {
    throw new Error('--overlap must be an integer >= 0 and < chunk-size');
  }
  opts.input = resolve(positional[0]);
  return opts;
}

// ---------- timestamp helpers ----------

// "1:02:03.500", "02:03,500", "02:03" -> "01:02:03" / "00:02:03"; null if invalid.
function normalizeTimestamp(raw) {
  if (!raw) return null;
  const m = String(raw).trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,]\d{1,3})?$/);
  if (!m) return null;
  const h = m[1] !== undefined ? Number(m[1]) : 0;
  const min = Number(m[2]);
  const s = Number(m[3]);
  if (min > 59 || s > 59) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(min)}:${pad(s)}`;
}

// ---------- format detection ----------

function detectFormat(content, file) {
  const ext = extname(file).toLowerCase();
  const head = content.slice(0, 2000);
  if (ext === '.vtt' || /^﻿?WEBVTT/.test(head)) return 'vtt';
  if (ext === '.srt' || /^﻿?\s*\d+\s*\r?\n\d{1,2}:\d{2}:\d{2}[.,]\d{3}\s*-->/.test(head)) return 'srt';
  return 'lines'; // Zoom txt, Google Meet doc export, and plain labeled text
}

// ---------- parsers -> [{ timestamp, speaker, text }] ----------

function parseCuePayload(payloadLines, warnings) {
  // Voice tag (<v Speaker>text</v>) or "Speaker: text" in the first payload line.
  const joined = payloadLines.join(' ').replace(/\s+/g, ' ').trim();
  const voice = joined.match(/^<v(?:\.[^ >]*)?\s+([^>]+)>\s*(.*)$/);
  if (voice) {
    return { speaker: voice[1].trim(), text: voice[2].replace(/<\/v>\s*$/, '').replace(/<[^>]+>/g, '').trim() };
  }
  const labeled = joined.match(/^([A-Z][\w.'-]*(?:\s+[A-Z][\w.'-]*){0,3}):\s+(.*)$/);
  if (labeled) return { speaker: labeled[1].trim(), text: labeled[2].replace(/<[^>]+>/g, '').trim() };
  if (/<[^>]+>/.test(joined)) warnings.push('cue contained markup with no recognizable voice tag; tags stripped');
  return { speaker: null, text: joined.replace(/<[^>]+>/g, '').trim() };
}

function parseVtt(content, warnings) {
  const utterances = [];
  const blocks = content.replace(/^﻿/, '').split(/\r?\n\r?\n+/);
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (!lines.length) continue;
    if (/^WEBVTT/.test(lines[0]) || /^(NOTE|STYLE|REGION)\b/.test(lines[0])) continue;
    let idx = 0;
    if (!lines[idx].includes('-->') && lines[idx + 1] && lines[idx + 1].includes('-->')) idx = 1; // cue id line
    const timing = lines[idx] && lines[idx].includes('-->') ? lines[idx] : null;
    if (!timing) { warnings.push(`skipped non-cue block: "${lines[0].slice(0, 60)}"`); continue; }
    const start = normalizeTimestamp(timing.split('-->')[0]);
    const payload = lines.slice(idx + 1);
    if (!payload.length) continue;
    const { speaker, text } = parseCuePayload(payload, warnings);
    if (text) utterances.push({ timestamp: start, speaker, text });
  }
  return utterances;
}

function parseSrt(content, warnings) {
  // SRT is VTT-shaped enough: numeric index line, comma-millisecond timings.
  return parseVtt(content.replace(/^﻿/, ''), warnings);
}

// Line-based parser: Zoom txt, Google Meet exports, plain labeled text.
const SPEAKER = "[A-Z][\\w.'-]*(?:\\s+[A-Z][\\w.'-]*){0,3}";
const LINE_PATTERNS = [
  // [00:12:42] Derek: text   |   [00:12:42] text
  { re: new RegExp(`^\\[(\\d{1,2}:\\d{2}(?::\\d{2})?(?:[.,]\\d{1,3})?)\\]\\s+(?:(${SPEAKER}):\\s+)?(.*)$`), map: (m) => ({ timestamp: m[1], speaker: m[2] ?? null, text: m[3] }) },
  // 00:12:42 Derek: text  (Zoom-style)
  { re: new RegExp(`^(\\d{1,2}:\\d{2}:\\d{2}(?:[.,]\\d{1,3})?)\\s+(${SPEAKER}):\\s+(.*)$`), map: (m) => ({ timestamp: m[1], speaker: m[2], text: m[3] }) },
  // Derek (00:12:42): text
  { re: new RegExp(`^(${SPEAKER})\\s+\\((\\d{1,2}:\\d{2}(?::\\d{2})?)\\):\\s+(.*)$`), map: (m) => ({ timestamp: m[2], speaker: m[1], text: m[3] }) },
  // Derek: text
  { re: new RegExp(`^(${SPEAKER}):\\s+(.*)$`), map: (m) => ({ timestamp: null, speaker: m[1], text: m[2] }) },
];

function parseLines(content, warnings) {
  const utterances = [];
  let pendingTimestamp = null; // Google Meet: bare timestamp line applies to following speakers
  let headerSkipped = 0;
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const bare = line.match(/^\(?(\d{1,2}:\d{2}(?::\d{2})?)\)?$/);
    if (bare) { pendingTimestamp = bare[1]; continue; }
    let matched = null;
    for (const p of LINE_PATTERNS) {
      const m = line.match(p.re);
      if (m) { matched = p.map(m); break; }
    }
    if (matched && matched.text) {
      utterances.push({
        timestamp: normalizeTimestamp(matched.timestamp ?? pendingTimestamp),
        speaker: matched.speaker ? matched.speaker.trim() : null,
        text: matched.text.trim(),
      });
    } else if (utterances.length) {
      utterances[utterances.length - 1].text += ` ${line}`; // wrapped continuation line
    } else {
      headerSkipped++; // pre-transcript header/title lines
    }
  }
  if (headerSkipped) warnings.push(`${headerSkipped} leading non-utterance line(s) treated as header and skipped`);
  return utterances;
}

// ---------- chunking ----------

// Speaker-aware: a chunk prefers to end where the NEXT utterance starts a new
// speaker turn, so one person's turn is not split mid-thought (searched backward
// up to `slack` lines from the target boundary). Chunks overlap by `overlap`
// utterances so cross-boundary references survive in at least one chunk.
function chunk(utterances, chunkSize, overlap) {
  const chunks = [];
  const n = utterances.length;
  const slack = Math.min(10, Math.floor(chunkSize / 4));
  let start = 0; // 0-based inclusive
  while (start < n) {
    let end = Math.min(start + chunkSize, n); // 0-based exclusive
    if (end < n) {
      for (let b = end; b > end - slack && b > start + 1; b--) {
        if (utterances[b].speaker !== null && utterances[b - 1].speaker !== null &&
            utterances[b].speaker !== utterances[b - 1].speaker) { end = b; break; }
      }
    }
    chunks.push({ startLine: start + 1, endLine: end }); // 1-based inclusive
    if (end >= n) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

// ---------- main ----------

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); }
  catch (e) { console.error(String(e.message ?? e)); process.exit(2); }

  let content;
  try { content = readFileSync(opts.input, 'utf8'); }
  catch (e) { console.error(`cannot read input: ${e.message}`); process.exit(2); }

  const warnings = [];
  const format = detectFormat(content, opts.input);
  const parser = format === 'vtt' ? parseVtt : format === 'srt' ? parseSrt : parseLines;
  const utterances = parser(content, warnings);
  if (!utterances.length) {
    console.error(`no utterances parsed from ${opts.input} (detected format: ${format})`);
    process.exit(1);
  }

  const base = basename(opts.input, extname(opts.input));
  const outdir = resolve(opts.outdir ?? join(dirname(opts.input), `${base}-ingest`));
  mkdirSync(join(outdir, 'chunks'), { recursive: true });

  const fmtLine = (u) =>
    `${u.timestamp ? `[${u.timestamp}] ` : ''}${u.speaker ? `${u.speaker}: ` : ''}${u.text}`;
  const normalizedPath = join(outdir, 'normalized.txt');
  writeFileSync(normalizedPath, utterances.map(fmtLine).join('\n') + '\n');

  const ranges = chunk(utterances, opts.chunkSize, opts.overlap);
  const chunks = ranges.map((r, i) => {
    const id = `chunk-${String(i + 1).padStart(2, '0')}`;
    const path = join(outdir, 'chunks', `${id}.txt`);
    const slice = utterances.slice(r.startLine - 1, r.endLine);
    writeFileSync(path, slice.map((u, j) => `L${r.startLine + j} ${fmtLine(u)}`).join('\n') + '\n');
    const inRange = slice.filter((u) => u.timestamp);
    return {
      id,
      path,
      startLine: r.startLine,
      endLine: r.endLine,
      startTimestamp: inRange.length ? inRange[0].timestamp : null,
      endTimestamp: inRange.length ? inRange[inRange.length - 1].timestamp : null,
      speakers: [...new Set(slice.map((u) => u.speaker).filter(Boolean))],
    };
  });

  const timestamped = utterances.filter((u) => u.timestamp);
  const manifest = {
    source: opts.input,
    format,
    utterances: utterances.length,
    speakers: [...new Set(utterances.map((u) => u.speaker).filter(Boolean))],
    firstTimestamp: timestamped.length ? timestamped[0].timestamp : null,
    lastTimestamp: timestamped.length ? timestamped[timestamped.length - 1].timestamp : null,
    untimestampedUtterances: utterances.length - timestamped.length,
    unlabeledUtterances: utterances.filter((u) => !u.speaker).length,
    chunkSize: opts.chunkSize,
    overlap: opts.overlap,
    normalizedPath,
    chunks,
    warnings,
  };
  const manifestPath = join(outdir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ manifestPath, ...manifest }, null, 2));
}

main();
