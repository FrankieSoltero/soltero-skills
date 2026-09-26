import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPreflight } from './preflight.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'preflight.mjs');

const run = (args, script = cli) => {
  try {
    return { code: 0, stdout: execFileSync(process.execPath, [script, ...args], { encoding: 'utf8' }), stderr: '' };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
};

const SKILLS = [
  'hyperframes-core',
  'hyperframes-animation',
  'hyperframes-creative',
  'hyperframes-keyframes',
  'hyperframes-cli',
];

const HOME = '/home/u';
const CWD = '/work/p';

/** Every required skill installed under one root. */
const allIn = (root) => {
  const present = new Set(SKILLS.map((s) => `${root}/${s}/SKILL.md`));
  return (p) => present.has(p);
};

const healthy = (over = {}) => ({
  nodeVersion: 'v22.0.0',
  which: () => '/opt/homebrew/bin/bin',
  exists: allIn(`${HOME}/.claude/skills`),
  homeDir: HOME,
  cwd: CWD,
  ...over,
});

const byName = (result, name) => result.checks.find((c) => c.name === name);

test('everything present: ok, four checks, no fixes', () => {
  const r = runPreflight(healthy());
  assert.equal(r.ok, true);
  assert.equal(r.checks.length, 4);
  for (const c of r.checks) {
    assert.equal(c.ok, true, `${c.name} should pass`);
    assert.equal(c.fix, null, `${c.name} should carry no fix`);
  }
});

test('node older than 22 fails its check with the install fix', () => {
  const r = runPreflight(healthy({ nodeVersion: 'v20.11.0' }));
  assert.equal(r.ok, false);
  const node = byName(r, 'node');
  assert.equal(node.ok, false);
  assert.equal(node.fix, 'Install Node.js 22 or newer');
  assert.match(node.detail, /v20\.11\.0/);
  // The other three are unaffected.
  for (const name of ['ffmpeg', 'ffprobe', 'hyperframes-skills']) {
    assert.equal(byName(r, name).ok, true);
  }
});

test('a missing ffmpeg fails alone — ffprobe is evaluated independently', () => {
  const r = runPreflight(healthy({ which: (bin) => (bin === 'ffmpeg' ? null : '/usr/local/bin/ffprobe') }));
  assert.equal(r.ok, false);
  assert.equal(byName(r, 'ffmpeg').ok, false);
  assert.equal(byName(r, 'ffmpeg').fix, 'brew install ffmpeg');
  assert.equal(byName(r, 'ffprobe').ok, true);
  assert.equal(byName(r, 'ffprobe').fix, null);

  const other = runPreflight(healthy({ which: (bin) => (bin === 'ffprobe' ? null : '/usr/local/bin/ffmpeg') }));
  assert.equal(byName(other, 'ffmpeg').ok, true);
  assert.equal(byName(other, 'ffprobe').ok, false);
  assert.equal(byName(other, 'ffprobe').fix, 'brew install ffmpeg');
});

test('a partly installed skill set fails and names the missing skills', () => {
  const root = `${HOME}/.claude/skills`;
  const present = new Set(SKILLS.filter((s) => s !== 'hyperframes-cli').map((s) => `${root}/${s}/SKILL.md`));
  const r = runPreflight(healthy({ exists: (p) => present.has(p) }));
  assert.equal(r.ok, false);
  const skills = byName(r, 'hyperframes-skills');
  assert.equal(skills.ok, false);
  assert.match(skills.detail, /hyperframes-cli/);
  assert.doesNotMatch(skills.detail, /hyperframes-core/);
  assert.equal(skills.fix, 'npx hyperframes skills update');
});

test('skills split across the four roots count as installed (union)', () => {
  const present = new Set([
    `${HOME}/.claude/skills/hyperframes-core/SKILL.md`,
    `${CWD}/.claude/skills/hyperframes-animation/SKILL.md`,
    `${HOME}/.agents/skills/hyperframes-creative/SKILL.md`,
    `${CWD}/.agents/skills/hyperframes-keyframes/SKILL.md`,
    `${CWD}/.claude/skills/hyperframes-cli/SKILL.md`,
  ]);
  const r = runPreflight(healthy({ exists: (p) => present.has(p) }));
  assert.equal(byName(r, 'hyperframes-skills').ok, true);
  assert.equal(r.ok, true);
});

test('check order is fixed: node, ffmpeg, ffprobe, hyperframes-skills', () => {
  const order = ['node', 'ffmpeg', 'ffprobe', 'hyperframes-skills'];
  assert.deepEqual(runPreflight(healthy()).checks.map((c) => c.name), order);
  assert.deepEqual(
    runPreflight(healthy({ nodeVersion: 'v20.0.0', which: () => null, exists: () => false }))
      .checks.map((c) => c.name),
    order,
  );
});

test('an unknown flag exits 2 with usage on stderr and nothing on stdout', () => {
  const r = run(['--wat']);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /usage/i);
  assert.equal(r.stdout, '');
});

test('the script spawns no child process — the PATH lookup is a filesystem scan', () => {
  const src = readFileSync(cli, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /child_process|spawn|execFile|execSync|fork\(/);
  assert.match(code, /process\.env\.PATH/);
});

test('--json prints the result object and the exit code tracks ok', () => {
  const r = run(['--json']);
  const parsed = JSON.parse(r.stdout);
  assert.equal(typeof parsed.ok, 'boolean');
  assert.deepEqual(parsed.checks.map((c) => c.name), ['node', 'ffmpeg', 'ffprobe', 'hyperframes-skills']);
  assert.equal(r.code, parsed.ok ? 0 : 1);
});

test('run through a symlinked path, main() still runs — a silent exit 0 would read as PASS', () => {
  // macOS /tmp → /private/tmp: import.meta.url is the resolved path, argv[1] is not.
  const dir = mkdtempSync(join(tmpdir(), 'ig-preflight-'));
  const link = join(dir, 'scripts-link');
  symlinkSync(here, link, 'dir');
  const r = run(['--json'], join(link, 'preflight.mjs'));
  assert.notEqual(r.stdout.trim(), '', 'the script produced no output through a symlinked path');
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.checks.length, 4);
  assert.equal(r.code, parsed.ok ? 0 : 1);
});

test('node versions compare numerically, not as strings: v9.11.0 fails, v22.0.0 passes', () => {
  assert.equal(byName(runPreflight(healthy({ nodeVersion: 'v9.11.0' })), 'node').ok, false);
  assert.equal(byName(runPreflight(healthy({ nodeVersion: 'v22.0.0' })), 'node').ok, true);
});

test('the default output is a human-readable table naming every check', () => {
  const r = run([]);
  for (const name of ['node', 'ffmpeg', 'ffprobe', 'hyperframes-skills']) {
    assert.match(r.stdout, new RegExp(name));
  }
});
