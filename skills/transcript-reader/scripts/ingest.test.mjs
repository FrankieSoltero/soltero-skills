import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ingest.mjs runs main() on import and exports nothing, so every test drives the CLI.
const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'ingest.mjs');
const FIXTURES = join(here, '..', '..', '..', 'tests', 'scenarios', 'transcript-reader', 'fixtures');

const run = (args, opts = {}) => {
  const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', ...opts });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
};
const tempDir = () => mkdtempSync(join(tmpdir(), 'tr-ingest-'));

// Write `body` to a temp file named `name`, ingest it into a temp --outdir, and read the outputs back.
const ingest = (name, body, extra = []) => {
  const dir = tempDir();
  const input = join(dir, name);
  writeFileSync(input, body);
  const out = join(dir, 'out');
  const r = run([input, '--outdir', out, ...extra]);
  const ok = r.code === 0;
  return {
    ...r,
    dir,
    input,
    out,
    manifest: ok ? JSON.parse(r.stdout) : null,
    lines: ok ? readFileSync(join(out, 'normalized.txt'), 'utf8').split('\n').slice(0, -1) : null,
  };
};
const chunkText = (res, id) => readFileSync(join(res.out, 'chunks', `${id}.txt`), 'utf8');
const ranges = (m) => m.chunks.map((c) => `${c.startLine}-${c.endLine}`);
// n lines of "Name: text" where speakerOf(i) gives the 1-based line's speaker.
const labeled = (n, speakerOf) =>
  Array.from({ length: n }, (_, k) => `${speakerOf(k + 1)}: utterance ${k + 1}`).join('\n') + '\n';

// ---------- happy path on the committed fixtures ----------

test('VTT fixture: 15 voice-tagged cues become 15 normalized, timestamped, speaker-labeled lines', () => {
  const out = join(tempDir(), 'out');
  const r = run([join(FIXTURES, 'checkout-standup-2026-07-06.vtt'), '--outdir', out]);
  assert.equal(r.code, 0, r.stderr);
  const m = JSON.parse(r.stdout);
  assert.equal(m.format, 'vtt');
  assert.equal(m.utterances, 15);
  assert.deepEqual(m.speakers, ['Dana', 'Ibrahim', 'Ruth', 'Priyanka']);
  assert.equal(m.firstTimestamp, '00:00:02');
  assert.equal(m.lastTimestamp, '00:01:40');
  assert.equal(m.untimestampedUtterances, 0);
  assert.equal(m.unlabeledUtterances, 0);
  assert.deepEqual(m.warnings, []);
  const lines = readFileSync(join(out, 'normalized.txt'), 'utf8').split('\n');
  assert.equal(lines.length, 16, 'one line per utterance plus the trailing newline');
  assert.equal(lines[0], '[00:00:02] Dana: Morning everyone. Quick round, we have the release call at half past. Ibrahim, go ahead.');
  assert.equal(lines[3], "[00:00:26] Ruth: Yes, I'll review 482 before lunch.");
  assert.doesNotMatch(lines.join('\n'), /<\/?v/, 'voice tags are stripped from the text');
});

test('long plain-text fixture: header skipped with a warning, speaker-aware overlapping chunks cover every line', () => {
  const out = join(tempDir(), 'out');
  const r = run([join(FIXTURES, 'atlas-q3-planning-2026-07-08.txt'), '--outdir', out]);
  assert.equal(r.code, 0, r.stderr);
  const m = JSON.parse(r.stdout);
  assert.equal(m.format, 'lines');
  assert.equal(m.utterances, 234);
  assert.deepEqual(m.speakers, ['Derek', 'Maya', 'Priya', 'Sam', 'Jonas', 'Alicia']);
  assert.equal(m.firstTimestamp, '00:00:06');
  assert.equal(m.lastTimestamp, '02:10:49');
  assert.deepEqual(m.warnings, ['1 leading non-utterance line(s) treated as header and skipped']);
  assert.deepEqual(ranges(m), ['1-80', '69-148', '137-216', '205-234']);
  assert.equal(m.chunks[0].startLine, 1);
  assert.equal(m.chunks.at(-1).endLine, m.utterances);
});

// ---------- outputs ----------

test('default outdir is <input-dir>/<basename>-ingest with normalized.txt, chunks/ and manifest.json', () => {
  const dir = tempDir();
  const input = join(dir, 'weekly-sync.txt');
  writeFileSync(input, 'Derek: first\nMaya: second\n');
  const r = run([input]);
  assert.equal(r.code, 0, r.stderr);
  const outdir = join(dir, 'weekly-sync-ingest');
  const m = JSON.parse(r.stdout);
  assert.equal(m.manifestPath, join(outdir, 'manifest.json'));
  assert.equal(m.normalizedPath, join(outdir, 'normalized.txt'));
  assert.equal(m.source, input);
  assert.deepEqual(readdirSync(join(outdir, 'chunks')), ['chunk-01.txt']);
  assert.equal(m.chunks[0].path, join(outdir, 'chunks', 'chunk-01.txt'));
  assert.equal(readFileSync(m.normalizedPath, 'utf8'), 'Derek: first\nMaya: second\n');
});

test('manifest.json on disk equals the stdout manifest minus manifestPath', () => {
  const res = ingest('m.txt', 'Derek: a\nMaya: b\n', ['--chunk-size', '10', '--overlap', '2']);
  assert.equal(res.code, 0, res.stderr);
  const { manifestPath, ...rest } = res.manifest;
  assert.equal(manifestPath, join(res.out, 'manifest.json'));
  assert.deepEqual(JSON.parse(readFileSync(manifestPath, 'utf8')), rest);
  assert.equal(rest.chunkSize, 10);
  assert.equal(rest.overlap, 2);
  assert.equal(rest.source, res.input);
});

test('a relative --outdir resolves against the working directory', () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'in.txt'), 'Derek: hello\n');
  const r = run(['in.txt', '--outdir', 'rel-out'], { cwd: dir });
  assert.equal(r.code, 0, r.stderr);
  assert.ok(existsSync(join(dir, 'rel-out', 'manifest.json')));
  assert.ok(existsSync(join(dir, 'rel-out', 'chunks', 'chunk-01.txt')));
});

test('every chunk line carries its global normalized line number as "L<n> " and matches line n', () => {
  const res = ingest('c.txt', labeled(45, (i) => (i % 2 ? 'Derek' : 'Maya')), ['--chunk-size', '20', '--overlap', '4']);
  assert.equal(res.code, 0, res.stderr);
  for (const c of res.manifest.chunks) {
    const body = chunkText(res, c.id).split('\n').slice(0, -1);
    assert.equal(body.length, c.endLine - c.startLine + 1, `${c.id} holds exactly its range`);
    body.forEach((line, j) => {
      const n = c.startLine + j;
      assert.equal(line, `L${n} ${res.lines[n - 1]}`);
    });
  }
});

// ---------- chunking contract ----------

test('unlabeled lines chunk at exactly chunk-size with exactly `overlap` shared lines', () => {
  const body = Array.from({ length: 100 }, (_, k) => `[00:00:${String(k % 60).padStart(2, '0')}] plain line ${k + 1}`).join('\n');
  const res = ingest('u.txt', body, ['--chunk-size', '20', '--overlap', '5']);
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(ranges(res.manifest), ['1-20', '16-35', '31-50', '46-65', '61-80', '76-95', '91-100']);
  assert.equal(res.manifest.unlabeledUtterances, 100);
  assert.deepEqual(res.manifest.chunks.map((c) => c.id), ['chunk-01', 'chunk-02', 'chunk-03', 'chunk-04', 'chunk-05', 'chunk-06', 'chunk-07']);
});

test('--overlap 0 produces contiguous, non-overlapping chunks that still cover every line', () => {
  const res = ingest('z.txt', labeled(25, () => 'Derek'), ['--chunk-size', '10', '--overlap', '0']);
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(ranges(res.manifest), ['1-10', '11-20', '21-25']);
});

test('a chunk ends where the next utterance starts a new speaker turn, not mid-turn', () => {
  // chunk-size 20 -> slack 5. Derek owns lines 1-17, Maya 18-40: the naive cut at 20 would split Maya's turn.
  const res = ingest('s.txt', labeled(40, (i) => (i <= 17 ? 'Derek' : 'Maya')), ['--chunk-size', '20', '--overlap', '3']);
  assert.equal(res.code, 0, res.stderr);
  assert.equal(res.manifest.chunks[0].endLine, 17);
  assert.deepEqual(res.manifest.chunks[0].speakers, ['Derek']);
  assert.equal(res.manifest.chunks[1].startLine, 15, 'the next chunk still overlaps by 3 lines');
});

test('with no turn change inside the slack window, the chunk keeps the full chunk-size', () => {
  // Turn change at 11/12 is outside the slack window (20 - 5 < b), so the cut stays at 20.
  const res = ingest('k.txt', labeled(40, (i) => (i <= 11 ? 'Derek' : 'Maya')), ['--chunk-size', '20', '--overlap', '3']);
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(ranges(res.manifest).slice(0, 2), ['1-20', '18-37']);
});

test('unlabeled utterances never count as a speaker-turn boundary', () => {
  // Line 18 is timestamped but has no speaker: Derek -> (none) -> Maya is not a turn change the
  // chunker may cut at, so the cut stays at chunk-size 20 instead of moving back to 17 or 18.
  const body = labeled(17, () => 'Derek') + '[00:00:01] no speaker label here\n' + labeled(22, () => 'Maya');
  const res = ingest('n.txt', body, ['--chunk-size', '20', '--overlap', '3']);
  assert.equal(res.code, 0, res.stderr);
  assert.equal(res.manifest.utterances, 40);
  assert.equal(res.lines[17], '[00:00:01] no speaker label here');
  assert.equal(res.manifest.chunks[0].endLine, 20);
});

test('a label-less, timestamp-less line is a wrapped continuation of the previous utterance', () => {
  const res = ingest('w.txt', 'Derek: first half\nsecond half of the thought\nMaya: reply\n');
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(res.lines, ['Derek: first half second half of the thought', 'Maya: reply']);
});

test('per-chunk metadata: first/last timestamps and the speakers present in that chunk only', () => {
  const body = [
    '[00:00:01] Derek: a',
    'Derek: b',
    '[00:00:03] Derek: c',
    ...Array.from({ length: 9 }, (_, k) => `[00:01:${String(10 + k)}] Maya: m${k}`),
    'Jonas: last words',
  ].join('\n');
  const res = ingest('t.txt', body, ['--chunk-size', '10', '--overlap', '1']);
  assert.equal(res.code, 0, res.stderr);
  const [c1, c2] = res.manifest.chunks;
  assert.equal(c1.startLine, 1);
  assert.equal(c1.startTimestamp, '00:00:01');
  assert.deepEqual(c1.speakers, ['Derek', 'Maya']);
  assert.equal(c1.endTimestamp, `00:01:${String(10 + c1.endLine - 4)}`);
  assert.equal(c2.endLine, 13);
  assert.equal(c2.endTimestamp, '00:01:18', 'untimestamped last line does not blank the chunk end timestamp');
  assert.ok(c2.speakers.includes('Jonas'));
  assert.ok(!c2.speakers.includes('Derek'));
  assert.equal(res.manifest.untimestampedUtterances, 2);
});

// ---------- input formats ----------

test('SRT: index lines, comma-millisecond timings and multi-line payloads', () => {
  const body = [
    '1', '00:00:01,000 --> 00:00:04,000', 'Derek: welcome everyone', '',
    '2', '00:01:02,500 --> 00:01:06,000', 'Maya: two lines', 'joined into one', '',
    '3', '01:00:00,000 --> 01:00:02,000', 'no label on this cue', '',
  ].join('\n');
  const res = ingest('call.srt', body);
  assert.equal(res.code, 0, res.stderr);
  assert.equal(res.manifest.format, 'srt');
  assert.deepEqual(res.lines, [
    '[00:00:01] Derek: welcome everyone',
    '[00:01:02] Maya: two lines joined into one',
    '[01:00:00] no label on this cue',
  ]);
  assert.equal(res.manifest.unlabeledUtterances, 1);
});

test('SRT content is detected by shape even with a .txt extension (and with a BOM)', () => {
  const res = ingest('export.txt', '﻿1\r\n00:00:05,000 --> 00:00:07,000\r\nDerek: crlf and bom\r\n');
  assert.equal(res.code, 0, res.stderr);
  assert.equal(res.manifest.format, 'srt');
  assert.deepEqual(res.lines, ['[00:00:05] Derek: crlf and bom']);
});

test('WEBVTT content is detected by header even without a .vtt extension', () => {
  const res = ingest('captions.txt', 'WEBVTT\n\n00:00:02.000 --> 00:00:03.000\n<v Dana>hi\n');
  assert.equal(res.code, 0, res.stderr);
  assert.equal(res.manifest.format, 'vtt');
  assert.deepEqual(res.lines, ['[00:00:02] Dana: hi']);
});

test('VTT: cue ids, NOTE/STYLE blocks, voice classes, mm:ss timings, cue settings and inline tags', () => {
  const body = [
    'WEBVTT - title', '',
    'NOTE this is a comment', '',
    'STYLE', '::cue { color: red }', '',
    'intro', '00:05.250 --> 00:07.000 align:start', '<v.loud Dana Scully>Hello <b>there</b></v>', '',
    '00:00:08.000 --> 00:00:09.000', 'Ibrahim: labeled payload', '',
    '00:00:10.000 --> 00:00:11.000', '<i>italic only</i>', '',
    'stray text with no timing', '',
  ].join('\n');
  const res = ingest('v.vtt', body);
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(res.lines, [
    '[00:00:05] Dana Scully: Hello there',
    '[00:00:08] Ibrahim: labeled payload',
    '[00:00:10] italic only',
  ]);
  assert.deepEqual(res.manifest.warnings, [
    'cue contained markup with no recognizable voice tag; tags stripped',
    'skipped non-cue block: "stray text with no timing"',
  ]);
});

test('plain text: all four documented line shapes, wrapped continuations and header lines', () => {
  const body = [
    'Weekly sync notes',
    'attendees - everyone',
    '',
    '[00:12:42] Derek: bracketed with speaker',
    '[00:12:50] bracketed without speaker',
    '00:13:01 Maya Okafor: zoom style',
    '  wrapped continuation of the zoom line',
    'Priya (00:13:20): meet style',
    'Jonas: bare label',
  ].join('\r\n');
  const res = ingest('p.txt', body);
  assert.equal(res.code, 0, res.stderr);
  assert.equal(res.manifest.format, 'lines');
  assert.deepEqual(res.lines, [
    '[00:12:42] Derek: bracketed with speaker',
    '[00:12:50] bracketed without speaker',
    '[00:13:01] Maya Okafor: zoom style wrapped continuation of the zoom line',
    '[00:13:20] Priya: meet style',
    'Jonas: bare label',
  ]);
  assert.deepEqual(res.manifest.speakers, ['Derek', 'Maya Okafor', 'Priya', 'Jonas']);
  assert.equal(res.manifest.untimestampedUtterances, 1);
  assert.equal(res.manifest.unlabeledUtterances, 1);
  assert.deepEqual(res.manifest.warnings, ['2 leading non-utterance line(s) treated as header and skipped']);
});

test('Google Meet export: a bare timestamp line applies to the speaker lines that follow it', () => {
  const body = ['00:00:00', 'Derek Vaughn: opening', 'Maya: reply', '', '(00:05:00)', 'Priya: later point', '12:30', 'Sam: mm:ss form'].join('\n');
  const res = ingest('meet.txt', body);
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(res.lines, [
    '[00:00:00] Derek Vaughn: opening',
    '[00:00:00] Maya: reply',
    '[00:05:00] Priya: later point',
    '[00:12:30] Sam: mm:ss form',
  ]);
  assert.deepEqual(res.manifest.warnings, []);
});

test('timestamps normalize to HH:MM:SS; out-of-range values become untimestamped, not garbage', () => {
  const body = ['[1:02:03] Derek: h:mm:ss', '[12:42] Maya: mm:ss', '[00:12:42.500] Priya: millis', '[00:75:00] Sam: bad minutes'].join('\n');
  const res = ingest('ts.txt', body);
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(res.lines, [
    '[01:02:03] Derek: h:mm:ss',
    '[00:12:42] Maya: mm:ss',
    '[00:12:42] Priya: millis',
    'Sam: bad minutes',
  ]);
  assert.equal(res.manifest.untimestampedUtterances, 1);
  assert.equal(res.manifest.lastTimestamp, '00:12:42');
});

test('an input with no timestamps reports null first/last timestamps', () => {
  const res = ingest('nt.txt', 'Derek: a\nMaya: b\n');
  assert.equal(res.code, 0, res.stderr);
  assert.equal(res.manifest.firstTimestamp, null);
  assert.equal(res.manifest.lastTimestamp, null);
  assert.equal(res.manifest.chunks[0].startTimestamp, null);
  assert.equal(res.manifest.untimestampedUtterances, 2);
});

// ---------- usage and error paths ----------

test('usage errors exit 2 with a message on stderr and write nothing', () => {
  const dir = tempDir();
  const input = join(dir, 'in.txt');
  writeFileSync(input, 'Derek: hello\n');
  const cases = [
    [[], /exactly one input file is required/],
    [[input, input], /exactly one input file is required/],
    [[input, '--verbose'], /unknown option: --verbose/],
    [[input, '--chunk-size', '9'], /--chunk-size must be an integer >= 10/],
    [[input, '--chunk-size', '12.5'], /--chunk-size must be an integer >= 10/],
    [[input, '--chunk-size', 'big'], /--chunk-size must be an integer >= 10/],
    [[input, '--chunk-size'], /--chunk-size must be an integer >= 10/],
    [[input, '--overlap', '-1'], /--overlap must be an integer >= 0 and < chunk-size/],
    [[input, '--overlap', '80'], /--overlap must be an integer >= 0 and < chunk-size/],
    [[input, '--chunk-size', '10', '--overlap', '10'], /--overlap must be an integer >= 0 and < chunk-size/],
    [[input, '--overlap', '1.5'], /--overlap must be an integer >= 0 and < chunk-size/],
  ];
  for (const [args, re] of cases) {
    const out = join(dir, 'out');
    const r = run(['--outdir', out, ...args]);
    assert.equal(r.code, 2, `args ${JSON.stringify(args)} must exit 2`);
    assert.match(r.stderr, re, `args ${JSON.stringify(args)}`);
    assert.equal(r.stdout, '');
    assert.ok(!existsSync(out), 'a usage error must not create the outdir');
  }
});

test('the boundary values are accepted: --chunk-size 10 and --overlap chunk-size - 1', () => {
  const res = ingest('b.txt', labeled(12, () => 'Derek'), ['--chunk-size', '10', '--overlap', '9']);
  assert.equal(res.code, 0, res.stderr);
  assert.equal(res.manifest.chunks[0].endLine, 10);
  assert.equal(res.manifest.chunks.at(-1).endLine, 12);
});

test('an unreadable input exits 2 with "cannot read input" (missing file, directory)', () => {
  const dir = tempDir();
  const missing = run([join(dir, 'nope.txt'), '--outdir', join(dir, 'o1')]);
  assert.equal(missing.code, 2);
  assert.match(missing.stderr, /cannot read input: .*ENOENT/);
  const sub = join(dir, 'subdir');
  mkdirSync(sub);
  const isDir = run([sub, '--outdir', join(dir, 'o2')]);
  assert.equal(isDir.code, 2);
  assert.match(isDir.stderr, /cannot read input/);
  assert.ok(!existsSync(join(dir, 'o1')) && !existsSync(join(dir, 'o2')));
});

test('an input with no parseable utterances exits 1, names the detected format, and writes nothing', () => {
  const empty = ingest('empty.txt', '');
  assert.equal(empty.code, 1);
  assert.match(empty.stderr, /no utterances parsed from .*empty\.txt \(detected format: lines\)/);
  assert.ok(!existsSync(empty.out));
  const headerOnly = ingest('h.vtt', 'WEBVTT\n\nNOTE nothing here\n');
  assert.equal(headerOnly.code, 1);
  assert.match(headerOnly.stderr, /detected format: vtt/);
  assert.ok(!existsSync(headerOnly.out));
  const lowercase = ingest('lc.txt', 'just some notes\nno speakers at all\n');
  assert.equal(lowercase.code, 1);
  assert.equal(lowercase.stdout, '');
});

test('CLI still runs when invoked through a symlinked path (macOS /tmp → /private/tmp)', () => {
  const linkDir = mkdtempSync(join(tmpdir(), 'tr-ingest-link-'));
  const link = join(linkDir, 'scripts-link');
  symlinkSync(here, link);
  const input = join(linkDir, 'in.txt');
  writeFileSync(input, 'Derek: via symlink\n');
  const r = spawnSync(process.execPath, [join(link, 'ingest.mjs'), input, '--outdir', join(linkDir, 'out')], { encoding: 'utf8' });
  assert.equal(r.status, 0, 'main() must run when the script is reached through a symlink');
  assert.equal(JSON.parse(r.stdout).utterances, 1);
  const noArgs = spawnSync(process.execPath, [join(link, 'ingest.mjs')], { encoding: 'utf8' });
  assert.equal(noArgs.status, 2, 'a usage error must never exit 0 silently through a symlinked path');
});

// ---------- known bugs (kept red-able, marked todo so the suite stays green) ----------

test('a speaker with a non-ASCII name gets their own utterance', { todo: 'BUG: SPEAKER regex uses ASCII-only [A-Z]/\\w, so "José: ..." is merged into the previous speaker\'s line' }, () => {
  const res = ingest('u8.txt', 'Derek: hello\nJosé: hola a todos\nÉlodie: bonjour\n');
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(res.lines, ['Derek: hello', 'José: hola a todos', 'Élodie: bonjour']);
});

test('a numbered generic label ("Speaker 1: ...") is its own utterance', { todo: 'BUG: SPEAKER regex requires every word capitalized, so "Speaker 1:" labels are never recognized (whole file rejected as header, exit 1)' }, () => {
  const res = ingest('sp.txt', 'Speaker 1: first\nSpeaker 2: second\n');
  assert.equal(res.code, 0, res.stderr);
  assert.deepEqual(res.lines, ['Speaker 1: first', 'Speaker 2: second']);
});

test('a VTT cue with two voice tags does not attribute the second voice\'s words to the first', { todo: 'BUG: parseCuePayload keeps only the first <v> speaker and strips later <v> tags into its text' }, () => {
  const res = ingest('mv.vtt', 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n<v Ana>hi</v> <v Ben>yo</v>\n');
  assert.equal(res.code, 0, res.stderr);
  assert.ok(!res.lines.includes('[00:00:01] Ana: hi yo'), 'Ben\'s "yo" must not be attributed to Ana');
});
