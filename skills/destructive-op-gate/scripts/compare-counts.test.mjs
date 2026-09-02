import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compare, extractCount, extractIds, idempotencyKey } from './compare-counts.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'compare-counts.mjs');
const dir = mkdtempSync(join(tmpdir(), 'dog-counts-'));
const file = (name, body) => {
  const p = join(dir, name);
  writeFileSync(p, body);
  return p;
};
const run = (args) => {
  try {
    return { code: 0, stdout: execFileSync('node', [cli, ...args], { encoding: 'utf8' }) };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
};

test('equal counts MATCH and exit 0; unequal counts MISMATCH and exit 1', () => {
  assert.equal(compare({ expectedCount: 131, actualCount: 131 }).verdict, 'MATCH');
  const m = compare({ expectedCount: 131, actualCount: 215 });
  assert.equal(m.verdict, 'MISMATCH');
  assert.match(m.notes[0], /\+84 row/);
  assert.equal(run(['--expected', '131', '--actual', '131']).code, 0);
  assert.equal(run(['--expected', '131', '--actual', '215']).code, 1);
});

test('a missing side is INDETERMINATE, not MATCH — absence never reads as agreement', () => {
  assert.equal(compare({ expectedCount: 131 }).verdict, 'INDETERMINATE');
  assert.equal(compare({}).verdict, 'INDETERMINATE');
  const r = run(['--expected', '131']);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /INDETERMINATE/);
});

test('counts are pulled out of real dry-run, psql tag, count(*) and row-footer output', () => {
  assert.equal(extractCount('DRY RUN — would affect 131 row(s) in shifts').count, 131);
  assert.equal(extractCount('DELETE 215\n').count, 215);
  assert.equal(extractCount('UPDATE 7\n').count, 7);
  assert.equal(extractCount('count\n83\n(1 row)\n').count, 83);
  assert.equal(extractCount('id | name\n1 | x\n2 | y\n(2 rows)\n').count, 2);
  assert.equal(extractCount('   96 \n').count, 96);
});

test('output with two different candidate counts is INDETERMINATE, never a guess', () => {
  const r = extractCount('DRY RUN — would affect 131 row(s) in shifts\nDELETE 215\n');
  assert.ok(r.error);
  assert.match(r.error, /more than one candidate row count \(131, 215\)/);
});

test('output with no count at all is INDETERMINATE', () => {
  assert.match(extractCount('ERROR: connection reset by peer\n').error, /no row count found/);
  const r = run(['--expected-file', file('e1.txt', 'boom\n'), '--actual-file', file('a1.txt', 'DELETE 3\n')]);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /INDETERMINATE/);
});

test('id sets compare by membership and name the extra and missing ids', () => {
  const r = compare({ expectedIds: ['1', '2', '3'], actualIds: ['1', '2', '4', '5'] });
  assert.equal(r.verdict, 'MISMATCH');
  assert.deepEqual(r.missing, ['3']);
  assert.deepEqual(r.extra, ['4', '5']);
});

test('equal id sets MATCH regardless of order and duplicates', () => {
  const r = compare({ expectedIds: ['3', '1', '2', '2'], actualIds: ['2', '3', '1'] });
  assert.equal(r.verdict, 'MATCH');
  assert.equal(r.expected, 3);
});

test('composite ids survive whole and # comment lines are ignored', () => {
  assert.deepEqual(
    extractIds('# orgs\norg:1\norg:2\n# employees\nemployee:1001\n'),
    ['org:1', 'org:2', 'employee:1001'],
  );
  assert.equal(compare({ expectedIds: ['org:1'], actualIds: ['org:1'] }).verdict, 'MATCH');
});

test('extractIds survives psql table output, headers, footers and json arrays', () => {
  assert.deepEqual(extractIds('id\n1005\n1007\n(2 rows)\n'), ['1005', '1007']);
  assert.deepEqual(extractIds('[ "a1", "a2" ]'), ['a1', 'a2']);
  assert.deepEqual(extractIds('id | name\n7 | Ana\n8 | Ben\n(2 rows)'), ['7', 'Ana', '8', 'Ben']);
});

test('the idempotency key is stable across order and duplicates, and varies with target and op', () => {
  const a = idempotencyKey('purge_shifts', ['3', '1', '2'], 'neon/lastcall');
  const b = idempotencyKey('purge_shifts', ['1', '2', '3', '3'], 'neon/lastcall');
  assert.equal(a, b);
  assert.notEqual(a, idempotencyKey('purge_shifts', ['1', '2', '3'], 'neon/lastcall_staging'));
  assert.notEqual(a, idempotencyKey('purge_employees', ['1', '2', '3'], 'neon/lastcall'));
  assert.notEqual(a, idempotencyKey('purge_shifts', ['1', '2', '4'], 'neon/lastcall'));
  assert.match(a, /^purge_shifts:[0-9a-f]{16}$/);
});

test('--op mints a key from an id set and refuses to mint one from a bare count', () => {
  const ids = file('ids.txt', 'id\n1\n2\n3\n(3 rows)\n');
  const same = file('ids2.txt', '3,2,1\n');
  const ok = run(['--expected-ids', ids, '--actual-ids', same, '--op', 'purge_shifts', '--target', 'neon/lastcall']);
  assert.equal(ok.code, 0);
  assert.match(ok.stdout, /key\s+purge_shifts:[0-9a-f]{16}/);
  const refused = run(['--expected', '3', '--actual', '3', '--op', 'purge_shifts']);
  assert.equal(refused.code, 0);
  assert.match(refused.stdout, /a row count cannot identify rows/);
});

test('pre-write shape: an enumeration compares by count against a dry run and mints the key', () => {
  const ids = file('pre-ids.txt', 'id\n5009\n5010\n5012\n(3 rows)\n');
  const dry = file('pre-dry.txt', 'DRY RUN — would affect 3 row(s) in shifts\n');
  const bad = file('pre-dry-bad.txt', 'DRY RUN — would affect 5 row(s) in shifts\n');
  const ok = run(['--expected-ids', ids, '--actual-file', dry, '--op', 'purge', '--target', 't']);
  assert.equal(ok.code, 0);
  assert.match(ok.stdout, /MATCH/);
  assert.match(ok.stdout, /key\s+purge:[0-9a-f]{16}/);
  const off = run(['--expected-ids', ids, '--actual-file', bad, '--op', 'purge', '--target', 't']);
  assert.equal(off.code, 1);
  assert.match(off.stdout, /MISMATCH/);
});

test('an enumeration with no actual side mints the key only, and needs --op to do so', () => {
  const ids = file('key-ids.txt', '1\n2\n3\n');
  const r = run(['--expected-ids', ids, '--op', 'purge', '--target', 't']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /KEY_ONLY/);
  assert.match(r.stdout, /no comparison performed/);
  // Same key whichever way it is reached, pre-write or post-write.
  const both = run(['--expected-ids', ids, '--actual-ids', ids, '--op', 'purge', '--target', 't']);
  const key = (out) => /(purge:[0-9a-f]{16})/.exec(out)[1];
  assert.equal(key(r.stdout), key(both.stdout));
  assert.equal(run(['--expected-ids', ids]).code, 2);
  assert.equal(run(['--actual-ids', ids, '--op', 'purge']).code, 2);
});

test('an unreadable or empty id file is INDETERMINATE, and one-sided id flags are a usage error', () => {
  const good = file('ids3.txt', '1\n2\n');
  const empty = file('ids4.txt', '(0 rows)\n');
  assert.equal(run(['--expected-ids', good, '--actual-ids', empty]).code, 1);
  assert.match(run(['--expected-ids', good, '--actual-ids', empty]).stdout, /INDETERMINATE/);
  assert.equal(run(['--expected-ids', good, '--actual-ids', join(dir, 'nope.txt')]).code, 1);
  assert.equal(run(['--expected', 'twelve', '--actual', '3']).code, 1);
});

test('--json emits the verdict, the sets and the key for a wrapper to consume', () => {
  const ids = file('ids5.txt', '1\n2\n3\n');
  const other = file('ids6.txt', '1\n2\n');
  const r = run(['--expected-ids', ids, '--actual-ids', other, '--op', 'op', '--json']);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.verdict, 'MISMATCH');
  assert.deepEqual(parsed.missing, ['3']);
  assert.match(parsed.key, /^op:[0-9a-f]{16}$/);
});
