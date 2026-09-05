import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { init } from './docs-standard-init.mjs';
import { makeHome, makeStaleRepo } from './test-fixture.mjs';

const here = dirname(fileURLToPath(import.meta.url));

test('creates the user-scope standard from the default when absent', () => {
  const home = makeHome();
  const repo = makeStaleRepo();
  const r = init({ home, repo });
  assert.equal(r.action, 'created');
  const p = join(home, '.claude', 'docs-standard.json');
  assert.ok(existsSync(p));
  const written = JSON.parse(readFileSync(p, 'utf8'));
  assert.equal(written.docsRoot, 'Docs');
  assert.ok(written.required.length >= 5);
});

test('docs root follows a lowercase "docs folder" declaration in the global CLAUDE.md', () => {
  const home = makeHome();
  writeFileSync(join(home, '.claude', 'CLAUDE.md'), '# S\n\n- keep a docs/ folder in each repo\n');
  const r = init({ home, repo: makeStaleRepo() });
  assert.equal(r.standard.docsRoot, 'docs');
});

test('existing file is never overwritten; reports the effective standard', () => {
  const home = makeHome({ withStandard: true, standard: { version: 1, docsRoot: 'documentation' } });
  const before = readFileSync(join(home, '.claude', 'docs-standard.json'), 'utf8');
  const r = init({ home, repo: makeStaleRepo() });
  assert.equal(r.action, 'exists');
  assert.equal(r.standard.docsRoot, 'documentation');
  assert.equal(readFileSync(join(home, '.claude', 'docs-standard.json'), 'utf8'), before);
});

test('CLI prints CREATED/EXISTS and exits 2 on malformed; runs through a symlink', () => {
  const linkDir = mkdtempSync(join(tmpdir(), 'ds-link-'));
  mkdirSync(join(linkDir, 'x'));
  symlinkSync(here, join(linkDir, 'x', 'scripts'));
  const bin = join(linkDir, 'x', 'scripts', 'docs-standard-init.mjs');
  const home = makeHome();
  const a = spawnSync('node', [bin, '--home', home, '--repo', makeStaleRepo()], { encoding: 'utf8' });
  assert.equal(a.status, 0);
  assert.match(a.stdout, /^CREATED /m);
  const b = spawnSync('node', [bin, '--home', home, '--repo', makeStaleRepo()], { encoding: 'utf8' });
  assert.equal(b.status, 0);
  assert.match(b.stdout, /^EXISTS /m);
  writeFileSync(join(home, '.claude', 'docs-standard.json'), 'nope');
  const c = spawnSync('node', [bin, '--home', home, '--repo', makeStaleRepo()], { encoding: 'utf8' });
  assert.equal(c.status, 2);
});
