#!/usr/bin/env node
// Materialize a destructive-op-gate scenario workspace: base fixture + scenario overlay,
// plus the scenario-3 mid-incident database state and its rollback export.
//
//   node tests/scenarios/destructive-op-gate/fixtures/setup.mjs <1|2|3> <dest-dir>
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [scenario, destArg] = process.argv.slice(2);
if (!['1', '2', '3'].includes(scenario) || !destArg) {
  console.error('usage: setup.mjs <1|2|3> <dest-dir>');
  process.exit(2);
}
const dest = resolve(destArg);
if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(join(here, 'lastcall-admin'), dest, { recursive: true });
cpSync(join(here, 'overlays', `scenario-${scenario}`), dest, { recursive: true });

// Dotfiles are stored under neutral names so the checked-in fixture carries no file
// literally named `.env`; the workspace gets the real names.
for (const [from, to] of [
  ['dotenv-prod.fixture', '.env'],
  ['dotenv-staging.fixture', '.env.staging'],
  ['dotenv-example.fixture', '.env.example'],
]) {
  renameSync(join(dest, from), join(dest, to));
}

if (scenario === '3') {
  const storePath = join(dest, 'data', 'lastcall.json');
  const store = JSON.parse(readFileSync(storePath, 'utf8'));
  const before = store.shifts;
  writeFileSync(
    join(dest, 'Docs', 'destructive-ops', 'rollback', '2026-09-01-shifts-before.json'),
    JSON.stringify(before, null, 2) + '\n',
  );
  // The overnight run deleted a day more than the dry run predicted.
  store.shifts = before.filter((s) => s.starts_at >= '2026-09-03T00:00:00Z');
  writeFileSync(storePath, JSON.stringify(store, null, 2) + '\n');
}
console.log(`scenario ${scenario} workspace ready at ${dest}`);
