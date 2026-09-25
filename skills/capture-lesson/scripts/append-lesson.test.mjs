import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'append-lesson.mjs');

// Pin the clock in the child so the dated heading is deterministic (no midnight flake).
const FAKE_NOW = '2026-03-04T05:06:07.000Z';
const preloadDir = mkdtempSync(join(tmpdir(), 'append-lesson-clock-'));
const preload = join(preloadDir, 'fake-clock.mjs');
writeFileSync(
  preload,
  [
    'const Real = Date;',
    'const FIXED = Real.parse(process.env.FAKE_NOW);',
    'globalThis.Date = class extends Real {',
    '  constructor(...a) { if (a.length) super(...a); else super(FIXED); }',
    '  static now() { return FIXED; }',
    '};',
  ].join('\n'),
);

const HEADER = '# Mistakes and Fixes\n\nA running log of bugs, root causes, fixes, and lessons.\n';
const REQUIRED = { '--symptom': 'Login 500s', '--cause': 'null session', '--fix': 'guard session', '--lesson': 'check nulls' };
const flags = (o) => Object.entries(o).flat();

const run = (args, opts = {}) => {
  const r = spawnSync(process.execPath, ['--import', pathToFileURL(preload).href, cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env, FAKE_NOW },
    ...opts,
  });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
};
const entry = ({ symptom, cause, fix, lesson, testIdea = '(none yet)' }) =>
  [
    `## 2026-03-04 — ${symptom}`,
    '',
    `- **Symptom:** ${symptom}`,
    `- **Root cause:** ${cause}`,
    `- **Fix:** ${fix}`,
    `- **Lesson:** ${lesson}`,
    `- **Regression test:** ${testIdea}`,
    '',
  ].join('\n');
const BASE = { symptom: 'Login 500s', cause: 'null session', fix: 'guard session', lesson: 'check nulls' };

test('creates the log with its header and one entry in the enforced format, making parent dirs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'append-lesson-'));
  const file = join(dir, 'deep', 'nested', 'log.md');
  const r = run([...flags(REQUIRED), '--test', 'tests/login.test.ts', '--file', file]);
  assert.equal(r.code, 0);
  assert.equal(r.stdout, `Appended lesson to ${file}\n`);
  assert.equal(readFileSync(file, 'utf8'), `${HEADER}\n${entry({ ...BASE, testIdea: 'tests/login.test.ts' })}`);
});

test('the heading is dated YYYY-MM-DD from the current clock', () => {
  const dir = mkdtempSync(join(tmpdir(), 'append-lesson-'));
  const file = join(dir, 'log.md');
  run([...flags(REQUIRED), '--file', file]);
  assert.match(readFileSync(file, 'utf8'), /^## \d{4}-\d{2}-\d{2} — Login 500s$/m);
  assert.match(readFileSync(file, 'utf8'), /^## 2026-03-04 — Login 500s$/m);
});

test('an omitted --test records "(none yet)"', () => {
  const dir = mkdtempSync(join(tmpdir(), 'append-lesson-'));
  const file = join(dir, 'log.md');
  assert.equal(run([...flags(REQUIRED), '--file', file]).code, 0);
  assert.match(readFileSync(file, 'utf8'), /^- \*\*Regression test:\*\* \(none yet\)$/m);
});

test('with no --file it writes Docs/mistakes-and-fixes.md under the working directory', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'append-lesson-cwd-'));
  const r = run(flags(REQUIRED), { cwd });
  assert.equal(r.code, 0);
  assert.equal(r.stdout, 'Appended lesson to Docs/mistakes-and-fixes.md\n');
  assert.equal(readFileSync(join(cwd, 'Docs', 'mistakes-and-fixes.md'), 'utf8'), `${HEADER}\n${entry(BASE)}`);
});

test('appending to an existing log keeps prior content, trims trailing whitespace, and separates with one blank line', () => {
  const dir = mkdtempSync(join(tmpdir(), 'append-lesson-'));
  const file = join(dir, 'log.md');
  const prior = '# My Log\n\n## 2020-01-01 — old thing\n\n- **Symptom:** old\n\n\n   \n';
  writeFileSync(file, prior);
  assert.equal(run([...flags(REQUIRED), '--file', file]).code, 0);
  assert.equal(readFileSync(file, 'utf8'), `${prior.trimEnd()}\n\n${entry(BASE)}`);
  // A second append stacks after the first, oldest first, with no header duplicated.
  const second = { symptom: 'Cron drift', cause: 'UTC vs local', fix: 'use UTC', lesson: 'pin tz' };
  assert.equal(
    run(['--symptom', second.symptom, '--cause', second.cause, '--fix', second.fix, '--lesson', second.lesson, '--file', file]).code,
    0,
  );
  const body = readFileSync(file, 'utf8');
  assert.equal(body, `${prior.trimEnd()}\n\n${entry(BASE)}\n${entry(second)}`);
  assert.equal(body.match(/^# /gm).length, 1);
});

test('each missing required flag is a usage error: exit 1, usage on stderr, nothing written', () => {
  for (const drop of Object.keys(REQUIRED)) {
    const dir = mkdtempSync(join(tmpdir(), 'append-lesson-'));
    const file = join(dir, 'log.md');
    const rest = Object.fromEntries(Object.entries(REQUIRED).filter(([k]) => k !== drop));
    const r = run([...flags(rest), '--file', file]);
    assert.equal(r.code, 1, `missing ${drop} must exit 1`);
    assert.match(r.stderr, /^Usage: append-lesson\.mjs --symptom S --cause C --fix F --lesson L \[--test T\] \[--file PATH\]/);
    assert.equal(r.stdout, '');
    assert.equal(existsSync(file), false, `missing ${drop} must not create the log`);
  }
});

test('an empty-string required value counts as missing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'append-lesson-'));
  const file = join(dir, 'log.md');
  const r = run([...flags({ ...REQUIRED, '--lesson': '' }), '--file', file]);
  assert.equal(r.code, 1);
  assert.equal(existsSync(file), false);
});

test('a required flag given with no value is a usage error, not a swallowed neighbour', { todo: 'BUG: arg() takes the next argv token even when it is another flag, so `--symptom --cause C` records symptom "--cause"' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'append-lesson-'));
  const file = join(dir, 'log.md');
  const r = run(['--symptom', '--cause', 'C', '--fix', 'F', '--lesson', 'L', '--file', file]);
  assert.equal(r.code, 1);
  assert.equal(existsSync(file), false);
});

test('a multi-line value cannot break the one-line heading of the enforced entry format', { todo: 'BUG: values are interpolated raw, so a newline in --symptom splits the "## YYYY-MM-DD — <symptom>" heading across lines' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'append-lesson-'));
  const file = join(dir, 'log.md');
  const r = run([...flags({ ...REQUIRED, '--symptom': 'first line\nsecond line' }), '--file', file]);
  const body = readFileSync(file, 'utf8');
  const heading = body.split('\n').find((l) => l.startsWith('## '));
  assert.ok(r.code !== 0 || heading.includes('second line'), 'either reject the value or keep the heading on one line');
});

test('CLI still runs when invoked through a symlinked path (macOS /tmp → /private/tmp)', () => {
  const linkDir = mkdtempSync(join(tmpdir(), 'append-lesson-link-'));
  const link = join(linkDir, 'scripts-link');
  symlinkSync(here, link);
  const file = join(linkDir, 'log.md');
  const r = spawnSync(process.execPath, [join(link, 'append-lesson.mjs'), ...flags(REQUIRED), '--file', file], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Appended lesson to/, 'the script must run when reached through a symlink');
  assert.match(readFileSync(file, 'utf8'), /- \*\*Lesson:\*\* check nulls/);
  const usage = spawnSync(process.execPath, [join(link, 'append-lesson.mjs')], { encoding: 'utf8' });
  assert.equal(usage.status, 1, 'a usage error must never exit 0 silently through a symlinked script path');
});
