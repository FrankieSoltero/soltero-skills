import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadStandard, DEFAULT_STANDARD, matchesPattern } from './standard.mjs';
import { makeHome, makeStaleRepo } from './test-fixture.mjs';

test('no user file: falls back to the bundled default and says so', () => {
  const home = makeHome();
  const repo = makeStaleRepo();
  const { standard, source, warnings } = loadStandard({ home, repo });
  assert.equal(source.user, null);
  assert.equal(standard.docsRoot, DEFAULT_STANDARD.docsRoot);
  assert.deepEqual(warnings, []);
});

test('user file wins over the default', () => {
  const home = makeHome({ withStandard: true, standard: { version: 1, docsRoot: 'documentation', entryDoc: { file: 'AGENTS.md', maxLines: 50 } } });
  const repo = makeStaleRepo();
  const { standard, source } = loadStandard({ home, repo });
  assert.equal(source.user, join(home, '.claude', 'docs-standard.json'));
  assert.equal(standard.docsRoot, 'documentation');
  assert.equal(standard.entryDoc.file, 'AGENTS.md');
  assert.equal(standard.entryDoc.maxLines, 50);
  // untouched keys still come from the default
  assert.ok(Array.isArray(standard.required) && standard.required.length > 0);
});

test('required paths follow docsRoot', () => {
  const home = makeHome({ withStandard: true, standard: { version: 1, docsRoot: 'docs' } });
  const repo = makeStaleRepo();
  const { standard } = loadStandard({ home, repo });
  assert.ok(standard.required.some((r) => r.file === 'docs/architecture.md'));
  assert.ok(!standard.required.some((r) => r.file.startsWith('Docs/')));
});

test('project override may change docsRoot/exclude/entry file and add required docs, never remove them', () => {
  const home = makeHome({ withStandard: true });
  const repo = makeStaleRepo();
  writeFileSync(join(repo, '.docs-standard.json'), JSON.stringify({
    docsRoot: 'docs', exclude: ['generated'], entryDoc: { file: 'AGENTS.md', maxLines: 10 },
    required: [{ file: 'docs/runbook.md' }], unverifiedMarker: '(nope)',
  }));
  const { standard, source, warnings } = loadStandard({ home, repo });
  assert.equal(source.project, join(repo, '.docs-standard.json'));
  assert.equal(standard.docsRoot, 'docs');
  assert.ok(standard.exclude.includes('generated') && standard.exclude.includes('node_modules'));
  assert.equal(standard.entryDoc.file, 'AGENTS.md');
  assert.equal(standard.entryDoc.maxLines, DEFAULT_STANDARD.entryDoc.maxLines, 'maxLines is not overridable per project');
  assert.ok(standard.required.some((r) => r.file === 'docs/runbook.md'));
  assert.ok(standard.required.some((r) => r.file === 'docs/architecture.md'));
  assert.equal(standard.unverifiedMarker, DEFAULT_STANDARD.unverifiedMarker);
  assert.ok(warnings.some((w) => /unverifiedMarker/.test(w)));
  assert.ok(warnings.some((w) => /maxLines/.test(w)));
});

test('malformed user JSON throws a typed error', () => {
  const home = makeHome();
  writeFileSync(join(home, '.claude', 'docs-standard.json'), '{ not json');
  const repo = makeStaleRepo();
  assert.throws(() => loadStandard({ home, repo }), /docs-standard.json/);
});

test('matchesPattern handles ** and * and basenames', () => {
  assert.ok(matchesPattern('docs/adr/0001.md', '**/adr/**'));
  assert.ok(matchesPattern('CHANGELOG.md', 'CHANGELOG.md'));
  assert.ok(matchesPattern('Docs/mistakes-and-fixes.md', '**/mistakes-and-fixes.md'));
  assert.ok(!matchesPattern('Docs/architecture.md', '**/adr/**'));
  assert.ok(matchesPattern('src/x.js', 'src/*.js'));
  assert.ok(!matchesPattern('src/a/x.js', 'src/*.js'));
});
