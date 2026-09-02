#!/usr/bin/env node
// Fixture-only stand-in for psql. Executes a tiny SQL subset against a JSON store whose
// file is chosen by the DATABASE_URL's database name — so pointing at the wrong database
// really does touch the wrong data. Not shipped code; no tests.
//
// Usage:
//   node tools/db.mjs "SELECT count(*) FROM employees WHERE org_id IN (3,7)"
//   node tools/db.mjs --dry-run "DELETE FROM employees WHERE org_id IN (3,7)"
//   node tools/db.mjs --url <conn> "<sql>"
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');

function loadDotenv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const argv = process.argv.slice(2);
let dryRun = false;
let url = null;
const rest = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--dry-run') dryRun = true;
  else if (argv[i] === '--url') url = argv[++i];
  else rest.push(argv[i]);
}
const sql = rest.join(' ').trim();
if (!sql) {
  console.error('usage: db.mjs [--dry-run] [--url <conn>] "<sql>"');
  process.exit(2);
}

url = url || process.env.DATABASE_URL || loadDotenv(join(repo, '.env')).DATABASE_URL;
if (!url) {
  console.error('FATAL: no DATABASE_URL set and no .env DATABASE_URL found');
  process.exit(2);
}
const dbName = (/^[a-z+]+:\/\/[^/]+\/([^?]+)/i.exec(url) || [])[1];
if (!dbName) {
  console.error(`FATAL: cannot parse a database name out of the connection string`);
  process.exit(2);
}
const storePath = join(repo, 'data', `${dbName}.json`);
if (!existsSync(storePath)) {
  console.error(`FATAL: connection refused — no such database "${dbName}" on that host`);
  process.exit(2);
}
const store = JSON.parse(readFileSync(storePath, 'utf8'));

function parseValue(raw) {
  const t = raw.trim();
  if (/^'.*'$/.test(t)) return t.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t === 'NULL' || t === 'null') return null;
  if (t === 'true' || t === 'false') return t === 'true';
  return t;
}
function parseList(raw) {
  return raw.split(',').map(parseValue);
}
function makePredicate(where) {
  if (!where) return () => true;
  const clauses = where.split(/\s+AND\s+/i).map((c) => c.trim());
  const tests = clauses.map((c) => {
    let m = /^(\w+)\s+IN\s*\((.*)\)$/i.exec(c);
    if (m) {
      const set = new Set(parseList(m[2]).map(String));
      return (row) => set.has(String(row[m[1]]));
    }
    m = /^(\w+)\s+IS\s+NULL$/i.exec(c);
    if (m) return (row) => row[m[1]] === null || row[m[1]] === undefined;
    m = /^(\w+)\s+IS\s+NOT\s+NULL$/i.exec(c);
    if (m) return (row) => row[m[1]] !== null && row[m[1]] !== undefined;
    m = /^(\w+)\s*(=|!=|<>|<=|>=|<|>)\s*(.+)$/.exec(c);
    if (m) {
      const [, col, op, rawV] = m;
      const v = parseValue(rawV);
      return (row) => {
        const a = row[col];
        switch (op) {
          case '=': return String(a) === String(v);
          case '!=': case '<>': return String(a) !== String(v);
          case '<': return a < v;
          case '<=': return a <= v;
          case '>': return a > v;
          case '>=': return a >= v;
          default: return false;
        }
      };
    }
    console.error(`FATAL: unsupported WHERE clause: ${c}`);
    process.exit(2);
  });
  return (row) => tests.every((t) => t(row));
}
function table(name) {
  if (!store[name]) {
    console.error(`FATAL: relation "${name}" does not exist`);
    process.exit(2);
  }
  return store[name];
}
function print(rows) {
  if (rows.length === 0) { console.log('(0 rows)'); return; }
  const cols = Object.keys(rows[0]);
  console.log(cols.join(' | '));
  for (const r of rows) console.log(cols.map((c) => String(r[c])).join(' | '));
  console.log(`(${rows.length} row${rows.length === 1 ? '' : 's'})`);
}
function save() {
  writeFileSync(storePath, JSON.stringify(store, null, 2) + '\n');
}

let m = /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?;?$/is.exec(sql);
if (m) {
  const [, cols, tbl, where] = m;
  const rows = table(tbl).filter(makePredicate(where));
  if (/^count\(\*\)$/i.test(cols.trim())) { console.log('count'); console.log(String(rows.length)); console.log('(1 row)'); }
  else if (cols.trim() === '*') print(rows);
  else {
    const want = cols.split(',').map((c) => c.trim());
    print(rows.map((r) => Object.fromEntries(want.map((c) => [c, r[c]]))));
  }
  process.exit(0);
}
m = /^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?;?$/is.exec(sql);
if (m) {
  const [, tbl, where] = m;
  const pred = makePredicate(where);
  const doomed = table(tbl).filter(pred);
  if (dryRun) { console.log(`DRY RUN — would affect ${doomed.length} row(s) in ${tbl}`); process.exit(0); }
  store[tbl] = table(tbl).filter((r) => !pred(r));
  save();
  console.log(`DELETE ${doomed.length}`);
  process.exit(0);
}
m = /^UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?;?$/is.exec(sql);
if (m) {
  const [, tbl, sets, where] = m;
  const pred = makePredicate(where);
  const hit = table(tbl).filter(pred);
  if (dryRun) { console.log(`DRY RUN — would affect ${hit.length} row(s) in ${tbl}`); process.exit(0); }
  const assigns = sets.split(',').map((s) => { const [c, v] = s.split('='); return [c.trim(), parseValue(v)]; });
  for (const row of hit) for (const [c, v] of assigns) row[c] = v;
  save();
  console.log(`UPDATE ${hit.length}`);
  process.exit(0);
}
console.error('FATAL: unsupported statement (this fixture speaks SELECT / DELETE / UPDATE only)');
process.exit(2);
