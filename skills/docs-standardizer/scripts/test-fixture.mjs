// Shared test fixture builder: a miniature of tests/scenarios/docs-standardizer's acme-ledger.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function makeHome({ withStandard = false, standard = null } = {}) {
  const home = mkdtempSync(join(tmpdir(), 'ds-home-'));
  mkdirSync(join(home, '.claude'), { recursive: true });
  writeFileSync(join(home, '.claude', 'CLAUDE.md'), '# Standards\n\n- Create a Docs folder for every project.\n');
  if (withStandard) {
    writeFileSync(join(home, '.claude', 'docs-standard.json'), JSON.stringify(standard ?? { version: 1, docsRoot: 'Docs' }, null, 2));
  }
  return home;
}

function write(root, rel, content) {
  mkdirSync(join(root, rel, '..'), { recursive: true });
  writeFileSync(join(root, rel), content);
}

/** The stale fixture: wrong README, two docs roots, no entry doc. */
export function makeStaleRepo() {
  const repo = mkdtempSync(join(tmpdir(), 'ds-repo-'));
  write(repo, 'package.json', JSON.stringify({
    name: 'mini', type: 'module',
    scripts: { start: 'node src/app.js', test: 'node --test test/*.test.js', lint: 'eslint .', migrate: 'node scripts/migrate.js' },
  }));
  write(repo, 'Makefile', '.PHONY: dev test\ndev:\n\tnode --watch src/app.js\ntest:\n\tnpm test\n');
  write(repo, '.gitignore', 'node_modules/\nvar/\n');
  write(repo, 'README.md', [
    '# mini', '', '## Getting started', '', '```', 'npm install', 'npm run dev', '```', '',
    'Starts from `src/server.js` on port 3000. Config under `config/`.', '',
    '## Testing', '', 'Run `npm run test:unit`.', '', 'See `docs/SETUP.md` and `docs/ARCHITECTURE.md`.', '',
  ].join('\n'));
  write(repo, 'docs/SETUP.md', '# Setup\n\nRun `make dev`. DB at `./var/dev.sqlite`. Tests: `npm test`.\n');
  write(repo, 'docs/adr/0001-sqlite.md', '# ADR 0001\n\nUse SQLite via `src/db.js`; the old `src/pg.js` is gone.\n');
  write(repo, 'doc/notes.md', '# Notes\n\n- Rounding lives in `src/ledger/rounding.js`.\n');
  write(repo, 'src/app.js', 'export const app = 1;\n');
  write(repo, 'src/db.js', 'export const db = 1;\n');
  write(repo, 'src/ledger/rounding.js', 'export const r = 1;\n');
  write(repo, 'scripts/migrate.js', '');
  write(repo, 'test/a.test.js', '');
  write(repo, 'CHANGELOG.md', '# Changelog\n\n- removed `npm run dev` and `src/server.js`\n');
  return repo;
}

/** The standardized fixture: everything the default standard requires, all claims true. */
export function makeGoodRepo() {
  const repo = makeStaleRepo();
  // remove both lowercase roots FIRST: on a case-insensitive filesystem Docs/ and docs/ collide
  rmSync(join(repo, 'docs'), { recursive: true, force: true });
  rmSync(join(repo, 'doc'), { recursive: true, force: true });
  write(repo, 'README.md', '# mini\n\n## Getting started\n\n```\nnpm install\nnpm start\n```\n\nSee `Docs/README.md`.\n');
  write(repo, 'CLAUDE.md', [
    '# mini', '', '## Purpose', 'Ledger service.', '', '## Commands', '- `npm start`', '- `npm test`', '- `make dev`',
    '- `npm run deploy` (unverified)', '',
    '## Layout', '- `src/app.js` entry', '- `src/ledger/` posting', '', '## Where to look', '- rounding: `src/ledger/rounding.js`', '',
    '## Conventions', 'See `Docs/conventions.md`.', '', '## Docs', 'Index: `Docs/README.md`.', '',
  ].join('\n'));
  write(repo, 'AGENTS.md', '# Agents\n\nRead `CLAUDE.md`.\n');
  write(repo, 'Docs/README.md', [
    '# Docs', '', '- [architecture](architecture.md)', '- [conventions](conventions.md)', '- [decisions](decisions.md)',
    '- [mistakes-and-fixes](mistakes-and-fixes.md)', '- [open-questions](open-questions.md)',
    '- [setup](setup.md)', '- [adr 0001](adr/0001-sqlite.md)', '',
  ].join('\n'));
  write(repo, 'Docs/architecture.md', '# Architecture\n\n## Entry points\n`src/app.js`\n\n## Module map\n`src/ledger/`\n\n## Data flow\nx\n\n## Non-obvious mechanisms\nx\n');
  write(repo, 'Docs/conventions.md', '# Conventions\n\n## Declared\n- eslint\n\n## Observed\n- none\n');
  write(repo, 'Docs/decisions.md', '# Decisions\n\n- [ADR 0001](adr/0001-sqlite.md)\n');
  write(repo, 'Docs/mistakes-and-fixes.md', '# Mistakes and Fixes\n');
  write(repo, 'Docs/open-questions.md', '# Open questions\n');
  write(repo, 'Docs/setup.md', '# Setup\n\nRun `make dev`. Tests: `npm test`.\n');
  write(repo, 'Docs/adr/0001-sqlite.md', '# ADR 0001\n\nUse SQLite via `src/db.js`; the old `src/pg.js` is gone.\n');
  return repo;
}
