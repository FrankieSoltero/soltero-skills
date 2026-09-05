import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, symlinkSync, mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { tmpdir } from 'node:os';
import { inventory, extractClaims, renderMarkdown } from './docs-inventory.mjs';
import { makeHome, makeStaleRepo, makeGoodRepo } from './test-fixture.mjs';

const here = dirname(fileURLToPath(import.meta.url));

test('extractClaims: commands from inline code and shell fences, paths from inline code and links', () => {
  const md = [
    '# T', '', '```', 'npm install', 'npm run dev', '```', '', '```json', '{ "scripts": { "npm run fake": 1 } }', '```', '',
    'Use `make dev`, edit `src/app.js`, see [setup](docs/SETUP.md) and `config/`.',
    'Skip `src/plugins/*.js`, `<name>.md`, `--flag`, https://example.com/x.md and `acme@2`.',
    'Deploy with `npm run deploy` (unverified).',
  ].join('\n');
  const { commands, paths } = extractClaims(md, { unverifiedMarker: '(unverified)' });
  assert.deepEqual(commands.map((c) => c.claim), ['npm install', 'npm run dev', 'make dev']);
  assert.deepEqual(paths.map((p) => p.path), ['src/app.js', 'docs/SETUP.md', 'config']);
  assert.equal(commands.find((c) => c.claim === 'npm run dev').line, 5);
});

test('extractClaims: absence lines, explicit markers, bare extensions and runtime files are not claims', () => {
  const md = [
    'There is no `npm run dev` script; use `make dev`.',
    'The entry is `src/app.js`, **not** `src/server.js`.',
    'Migrations are `.sql` files under `migrations/`; copy `.env.example` to `.env`.',
    '`config/` was removed in 2.0.',
    'Deploy: `npm run deploy` (does not exist)',
    'Do not edit `src/generated.js` by hand.',
  ].join('\n');
  const { commands, paths } = extractClaims(md, { unverifiedMarker: '(unverified)', absentMarker: '(does not exist)' });
  assert.deepEqual(commands.map((c) => c.claim), []);
  assert.deepEqual(paths.map((p) => p.path), ['migrations', '.env.example', '.env', 'src/generated.js']);
});

test('extractClaims: URL paths and home paths are not claims; dotted suffixes are', () => {
  const md = 'POST `/entries` returns JSON; tests are `*.test.js` and `.test.js` files; see `~/.claude/docs-standard.json` and `.env.example`.';
  const { paths } = extractClaims(md);
  assert.deepEqual(paths.map((p) => p.path), ['.test.js', '.env.example']);
});

test('a dotted suffix resolves when any file ends with it', () => {
  const repo = makeGoodRepo();
  const { writeFileSync } = require('node:fs');
  writeFileSync(join(repo, 'Docs', 'open-questions.md'), '# Q\n\nTests are `.test.js` files.\nThere are no `.spec.ts` files (unverified).\nIs `.d.ts` output expected?\n');
  const inv = inventory({ repo, home: makeHome() });
  const q = inv.docs.find((d) => d.file === 'Docs/open-questions.md');
  assert.deepEqual(q.paths.map((p) => [p.path, p.status]), [['.test.js', 'ok'], ['.d.ts', 'missing']]);
});

test('inventory on the stale fixture: two roots, no entry doc, stale claims, coverage gaps', () => {
  const home = makeHome();
  const repo = makeStaleRepo();
  const inv = inventory({ repo, home });
  assert.deepEqual(inv.docsRoots.sort(), ['doc', 'docs']);
  assert.equal(inv.entryDoc.present, false);
  const readme = inv.docs.find((d) => d.file === 'README.md');
  assert.equal(readme.kind, 'entry');
  const bad = readme.commands.filter((c) => c.status === 'missing').map((c) => c.claim);
  assert.deepEqual(bad, ['npm run dev', 'npm run test:unit']);
  const badPaths = readme.paths.filter((p) => p.status === 'missing').map((p) => p.path);
  assert.deepEqual(badPaths, ['src/server.js', 'config', 'docs/ARCHITECTURE.md']);
  // gitignored runtime path is not a claim
  const setup = inv.docs.find((d) => d.file === 'docs/SETUP.md');
  assert.ok(!setup.paths.some((p) => p.path.includes('var/')));
  assert.equal(setup.commands.every((c) => c.status === 'ok'), true);
  // historical docs carry claims but they are informational
  const changelog = inv.docs.find((d) => d.file === 'CHANGELOG.md');
  assert.equal(changelog.historical, true);
  const adr = inv.docs.find((d) => d.file === 'docs/adr/0001-sqlite.md');
  assert.equal(adr.kind, 'adr');
  assert.equal(adr.historical, true);
  // command evidence
  assert.deepEqual(Object.keys(inv.commandEvidence.npm).sort(), ['lint', 'migrate', 'start', 'test']);
  assert.deepEqual(inv.commandEvidence.make.sort(), ['dev', 'test']);
  // coverage
  const cov = Object.fromEntries(inv.coverage.map((c) => [c.file, c.status]));
  assert.equal(cov['README.md'], 'present');
  assert.equal(cov['Docs/architecture.md'], 'missing');
  assert.equal(inv.summary.staleClaims, 5);
  assert.equal(inv.summary.requiredPresent, 1);
  assert.equal(inv.summary.requiredTotal, 7);
});

test('bare basenames resolve anywhere in the tree; nested paths must resolve exactly', () => {
  const repo = makeGoodRepo();
  const home = makeHome();
  const { writeFileSync } = require('node:fs');
  writeFileSync(join(repo, 'Docs', 'open-questions.md'), '# Q\n\nIs `rounding.js` still the only rounder? Is `ledger/` a package? What about `nope.js` and `src/nope.js`?\n');
  const inv = inventory({ repo, home });
  const q = inv.docs.find((d) => d.file === 'Docs/open-questions.md');
  assert.deepEqual(q.paths.map((p) => [p.path, p.status]), [['rounding.js', 'ok'], ['ledger', 'ok'], ['nope.js', 'missing'], ['src/nope.js', 'missing']]);
});

test('inventory on the good fixture: one root, entry doc present, zero stale claims', () => {
  const home = makeHome();
  const repo = makeGoodRepo();
  const inv = inventory({ repo, home });
  assert.deepEqual(inv.docsRoots, ['Docs']);
  assert.equal(inv.entryDoc.present, true);
  assert.equal(inv.entryDoc.lines > 0, true);
  assert.equal(inv.summary.staleClaims, 0);
  assert.equal(inv.summary.requiredPresent, 7);
  const entry = inv.docs.find((d) => d.file === 'CLAUDE.md');
  assert.ok(!entry.commands.some((c) => c.claim === 'npm run deploy'), 'marked-unverified claim is skipped');
});

test('renderMarkdown lists roots, coverage and stale claims', () => {
  const inv = inventory({ repo: makeStaleRepo(), home: makeHome() });
  const md = renderMarkdown(inv);
  assert.match(md, /Docs roots: `doc`, `docs`/);
  assert.match(md, /README\.md:7 .*npm run dev/);
  assert.match(md, /Docs\/architecture\.md.*missing/);
});

test('CLI: --json prints parseable JSON, runs through a symlinked path', () => {
  const repo = makeStaleRepo();
  const home = makeHome();
  const linkDir = mkdtempSync(join(tmpdir(), 'ds-link-'));
  mkdirSync(join(linkDir, 'x'));
  symlinkSync(here, join(linkDir, 'x', 'scripts'));
  const out = execFileSync('node', [join(linkDir, 'x', 'scripts', 'docs-inventory.mjs'), repo, '--home', home, '--json'], { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  assert.equal(parsed.summary.staleClaims, 5);
});
