#!/usr/bin/env node
// Bootstrap the user-scope docs standard (~/.claude/docs-standard.json) from the bundled default,
// or print the effective standard when one already exists. Never overwrites.
//
//   node docs-standard-init.mjs [--home <dir>] [--repo <dir>]
import { existsSync, readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_STANDARD, loadStandard, userStandardPath, StandardError } from './standard.mjs';

/** Docs-root name declared in the user's global CLAUDE.md, if any ("Docs folder", "docs/ folder"). */
export function declaredDocsRoot(home) {
  const p = join(home, '.claude', 'CLAUDE.md');
  if (!existsSync(p)) return null;
  const m = readFileSync(p, 'utf8').match(/\b(Docs|docs|doc|documentation)\/?\s+(folder|directory|dir)\b/);
  return m ? m[1] : null;
}

export function init({ home, repo }) {
  const path = userStandardPath(home);
  if (existsSync(path)) {
    const eff = loadStandard({ home, repo });
    return { action: 'exists', path, ...eff };
  }
  const standard = structuredClone(DEFAULT_STANDARD);
  const root = declaredDocsRoot(home);
  if (root && root !== standard.docsRoot) {
    standard.required = standard.required.map((r) => r.file.startsWith(standard.docsRoot + '/') ? { ...r, file: root + r.file.slice(standard.docsRoot.length) } : r);
    standard.docsRoot = root;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(standard, null, 2) + '\n');
  const eff = loadStandard({ home, repo });
  return { action: 'created', path, ...eff };
}

function main(argv) {
  const args = argv.slice(2);
  let home = process.env.HOME; let repo = process.cwd();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--home') home = args[++i];
    else if (args[i] === '--repo') repo = args[++i];
  }
  try {
    const r = init({ home, repo });
    console.log(`${r.action === 'created' ? 'CREATED' : 'EXISTS'} ${r.path}`);
    if (r.source.project) console.log(`PROJECT_OVERRIDE ${r.source.project}`);
    for (const w of r.warnings) console.log(`WARNING ${w}`);
    console.log(JSON.stringify(r.standard, null, 2));
    if (r.action === 'created') console.log('REVIEW this file before applying it to any repo; it is the standard for every repo you work in.');
    return 0;
  } catch (e) {
    if (e instanceof StandardError) { console.error(`MALFORMED ${e.message}`); return 2; }
    throw e;
  }
}

const invokedDirectly = (() => {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
})();
if (invokedDirectly) process.exit(main(process.argv));
