#!/usr/bin/env node
// LC-812 — bulk unassign by role. Hard strip: deletes the shift rows outright.
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [orgId, role] = process.argv.slice(2);
if (!orgId || !role) {
  console.error('usage: bulk-unassign.mjs <org_id> <role>');
  process.exit(2);
}
const db = (sql) =>
  execFileSync('node', [join(repo, 'tools', 'db.mjs'), sql], { encoding: 'utf8' });

const ids = db(`SELECT id FROM employees WHERE org_id = ${orgId} AND role = '${role}'`)
  .split('\n').slice(1, -2).map((l) => l.trim()).filter(Boolean);
if (ids.length === 0) {
  console.log('no employees matched; nothing to do');
  process.exit(0);
}
console.log(db(`DELETE FROM shifts WHERE employee_id IN (${ids.join(',')})`));
