import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, unlinkSync, mkdtempSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { verify } from './docs-verify.mjs';
import { makeHome, makeStaleRepo, makeGoodRepo } from './test-fixture.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const codes = (r) => r.findings.map((f) => f.code);

test('stale fixture: every gate fires', () => {
  const r = verify({ repo: makeStaleRepo(), home: makeHome() });
  const c = codes(r);
  assert.ok(c.includes('DOCS_ROOT_CLASH'));
  assert.ok(c.includes('DOCS_ROOT_CASE'), 'docs/ differs from the standard Docs/ by case only');
  assert.ok(c.includes('REQUIRED_MISSING'));
  assert.ok(c.includes('CMD_UNKNOWN'));
  assert.ok(c.includes('PATH_MISSING'));
  assert.equal(r.findings.filter((f) => f.code === 'CMD_UNKNOWN').length, 2);
  assert.equal(r.findings.filter((f) => f.code === 'PATH_MISSING').length, 3);
  // historical docs never produce claim findings
  assert.ok(!r.findings.some((f) => f.file === 'CHANGELOG.md'));
  assert.ok(!r.findings.some((f) => f.file.includes('adr/')));
  assert.equal(r.ok, false);
});

test('path claims are case-exact even on a case-insensitive filesystem', () => {
  const repo = makeGoodRepo();
  writeFileSync(join(repo, 'Docs', 'open-questions.md'), '# Open questions\n\nSee `docs/architecture.md` and `SRC/app.js`.\n');
  const r = verify({ repo, home: makeHome() });
  assert.equal(r.findings.filter((f) => f.code === 'PATH_MISSING').length, 2);
});

test('good fixture: green', () => {
  const r = verify({ repo: makeGoodRepo(), home: makeHome() });
  assert.deepEqual(r.findings, []);
  assert.equal(r.ok, true);
});

test('entry doc over budget, missing section, unreachable doc, entry split', () => {
  const repo = makeGoodRepo();
  const home = makeHome();
  writeFileSync(join(repo, 'CLAUDE.md'), '# x\n\n## Purpose\n' + 'line\n'.repeat(130));
  writeFileSync(join(repo, 'AGENTS.md'), '# totally different\n');
  writeFileSync(join(repo, 'Docs', 'orphan.md'), '# orphan\n');
  const r = verify({ repo, home });
  const c = codes(r);
  assert.ok(c.includes('ENTRY_OVER_BUDGET'));
  assert.ok(c.includes('SECTION_MISSING'));
  assert.ok(r.findings.some((f) => f.code === 'SECTION_MISSING' && f.file === 'CLAUDE.md' && /Commands/.test(f.message)));
  assert.ok(r.findings.some((f) => f.code === 'UNREACHABLE' && f.file === 'Docs/orphan.md'));
  assert.ok(c.includes('ENTRY_SPLIT'));
});

test('an @import line makes the mirror a pointer, not a split', () => {
  const repo = makeGoodRepo();
  writeFileSync(join(repo, 'AGENTS.md'), '# mini\n\n@CLAUDE.md\n');
  const r = verify({ repo, home: makeHome() });
  assert.ok(!codes(r).includes('ENTRY_SPLIT'));
});

test('a doc reachable in two hops (entry -> index -> doc) is reachable', () => {
  const r = verify({ repo: makeGoodRepo(), home: makeHome() });
  assert.ok(!codes(r).includes('UNREACHABLE'));
});

test('missing entry doc is REQUIRED_MISSING for the entry file too', () => {
  const repo = makeGoodRepo();
  unlinkSync(join(repo, 'CLAUDE.md'));
  const r = verify({ repo, home: makeHome() });
  assert.ok(r.findings.some((f) => f.code === 'REQUIRED_MISSING' && f.file === 'CLAUDE.md'));
});

test('CLI exit codes: 1 red, 0 green, 2 malformed standard; runs through a symlink', () => {
  const linkDir = mkdtempSync(join(tmpdir(), 'ds-link-'));
  mkdirSync(join(linkDir, 'x'));
  symlinkSync(here, join(linkDir, 'x', 'scripts'));
  const bin = join(linkDir, 'x', 'scripts', 'docs-verify.mjs');
  const red = spawnSync('node', [bin, makeStaleRepo(), '--home', makeHome()], { encoding: 'utf8' });
  assert.equal(red.status, 1);
  assert.match(red.stdout, /RED/);
  assert.match(red.stdout, /CMD_UNKNOWN README\.md:7 npm run dev/);
  const green = spawnSync('node', [bin, makeGoodRepo(), '--home', makeHome()], { encoding: 'utf8' });
  assert.equal(green.status, 0, green.stdout + green.stderr);
  assert.match(green.stdout, /GREEN/);
  const badHome = makeHome();
  writeFileSync(join(badHome, '.claude', 'docs-standard.json'), '{{');
  const mal = spawnSync('node', [bin, makeGoodRepo(), '--home', badHome], { encoding: 'utf8' });
  assert.equal(mal.status, 2);
});
