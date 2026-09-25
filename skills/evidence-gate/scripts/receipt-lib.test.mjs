import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  DEFAULT_RECEIPTS_DIR, REQUIRED_FIELDS, checkCompleteness, computeTreeHash,
  listTrackedFiles, sha256Hex, slugify,
} from './receipt-lib.mjs';

// ---- fixtures: throwaway git repos under the OS temp dir, never inside this repo ----
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t',
  GIT_CONFIG_NOSYSTEM: '1',
};
const git = (repo, ...args) => {
  const r = spawnSync('git', ['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args],
    { cwd: repo, encoding: 'utf8', env: GIT_ENV });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout;
};
const put = (repo, rel, body) => {
  mkdirSync(dirname(join(repo, rel)), { recursive: true });
  writeFileSync(join(repo, rel), body);
};
/** A repo with `files` committed at HEAD. */
const makeRepo = (files) => {
  const repo = mkdtempSync(join(tmpdir(), 'eg-lib-'));
  git(repo, 'init', '-q');
  for (const [rel, body] of Object.entries(files)) put(repo, rel, body);
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'init');
  return repo;
};
/** Independent derivation of the normative treeHash algorithm in references/receipt-format.md. */
const expectedTreeHash = (repo, paths) => {
  const hex = (b) => createHash('sha256').update(b).digest('hex');
  const lines = [...paths].sort().map((p) => {
    let h;
    try { h = hex(readFileSync(join(repo, p))); } catch { h = 'MISSING'; }
    return `${p} ${h}`;
  });
  return 'sha256:' + hex(lines.join('\n'));
};

const completeReceipt = () => ({
  claim: 'unit tests pass for X',
  command: 'npm',
  args: ['test'],
  cwd: '/abs/repo',
  exitCode: 0,
  outputDigest: 'sha256:' + 'a'.repeat(64),
  treeHash: 'sha256:' + 'b'.repeat(64),
  timestamp: '2026-09-25T00:00:00.000Z',
  producedBy: 'agent-1',
});

// ---- constants ----
test('the default receipts dir and the required field list match the shared contract', () => {
  assert.equal(DEFAULT_RECEIPTS_DIR, 'Docs/evidence/receipts');
  assert.deepEqual([...REQUIRED_FIELDS].sort(), [
    'args', 'claim', 'command', 'cwd', 'exitCode', 'outputDigest', 'producedBy', 'timestamp', 'treeHash',
  ]);
  assert.ok(!REQUIRED_FIELDS.includes('outputPath'), 'outputPath is optional in the contract');
});

// ---- sha256Hex ----
test('sha256Hex returns the lowercase hex digest of strings and buffers', () => {
  assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256Hex(Buffer.from('abc')), sha256Hex('abc'));
});

// ---- slugify ----
test('slugify lowercases and collapses every run of non-alphanumerics to one dash', () => {
  assert.equal(slugify('Unit Tests PASS for ACME-4477!'), 'unit-tests-pass-for-acme-4477');
  assert.equal(slugify('a  /  b__c'), 'a-b-c');
});

test('slugify trims leading and trailing dashes', () => {
  assert.equal(slugify('  --hello world--  '), 'hello-world');
});

test('slugify caps the slug at 60 chars and never leaves a trailing dash after the cut', () => {
  const long = 'x'.repeat(100);
  assert.equal(slugify(long).length, 60);
  // Char 60 lands on a separator: the cut must not leave "…-".
  const edge = 'a'.repeat(59) + ' bbbb';
  const s = slugify(edge);
  assert.equal(s, 'a'.repeat(59));
  assert.ok(!s.endsWith('-'));
});

test('slugify is deterministic, so the same claim always maps to the same receipt file', () => {
  assert.equal(slugify('merge-ready: feat/x'), slugify('merge-ready: feat/x'));
  assert.equal(slugify('Merge Ready feat X'), slugify('merge-ready: feat/x'));
});

test('slugify throws on a claim with no alphanumerics instead of producing an empty filename', () => {
  assert.throws(() => slugify('!!! ???'), /empty slug/);
  assert.throws(() => slugify(''), /empty slug/);
});

test('slugify coerces non-string claims', () => {
  assert.equal(slugify(4477), '4477');
});

// ---- listTrackedFiles ----
test('listTrackedFiles returns HEAD\'s tracked files sorted, excluding the receipts dir', () => {
  const repo = makeRepo({
    'b.txt': 'b', 'a.txt': 'a', 'src/z.mjs': 'z',
    'Docs/evidence/receipts/old.json': '{}',
    'Docs/evidence/receipts-archive.txt': 'not inside the receipts dir',
  });
  put(repo, 'untracked.txt', 'u');
  assert.deepEqual(listTrackedFiles(repo), [
    'Docs/evidence/receipts-archive.txt', 'a.txt', 'b.txt', 'src/z.mjs',
  ]);
});

test('listTrackedFiles honours a custom receipts dir, with or without a trailing slash', () => {
  const repo = makeRepo({ 'a.txt': 'a', 'ev/r.json': '{}', 'Docs/evidence/receipts/x.json': '{}' });
  assert.deepEqual(listTrackedFiles(repo, 'ev'), ['Docs/evidence/receipts/x.json', 'a.txt']);
  assert.deepEqual(listTrackedFiles(repo, 'ev/'), ['Docs/evidence/receipts/x.json', 'a.txt']);
});

test('listTrackedFiles throws outside a git repo and in a repo with no commit', () => {
  const plain = mkdtempSync(join(tmpdir(), 'eg-lib-plain-'));
  assert.throws(() => listTrackedFiles(plain), /git ls-tree failed/);
  const empty = mkdtempSync(join(tmpdir(), 'eg-lib-empty-'));
  git(empty, 'init', '-q');
  assert.throws(() => listTrackedFiles(empty), /git ls-tree failed/);
});

// ---- computeTreeHash ----
test('computeTreeHash implements the normative algorithm and has the sha256: format', () => {
  const repo = makeRepo({ 'b.txt': 'bee\n', 'a.txt': 'ay\n', 'dir/c.txt': 'see\n' });
  const h = computeTreeHash(repo);
  assert.match(h, /^sha256:[0-9a-f]{64}$/);
  assert.equal(h, expectedTreeHash(repo, ['a.txt', 'b.txt', 'dir/c.txt']));
  assert.equal(computeTreeHash(repo), h, 'deterministic across calls');
});

test('an uncommitted edit to a tracked file changes the tree hash', () => {
  const repo = makeRepo({ 'a.txt': 'one\n' });
  const before = computeTreeHash(repo);
  put(repo, 'a.txt', 'one // just a comment\n');
  assert.notEqual(computeTreeHash(repo), before);
});

test('a tracked file missing from the worktree hashes as the literal MISSING', () => {
  const repo = makeRepo({ 'a.txt': 'a', 'gone.txt': 'g' });
  const before = computeTreeHash(repo);
  rmSync(join(repo, 'gone.txt'));
  const after = computeTreeHash(repo);
  assert.notEqual(after, before);
  assert.equal(after, expectedTreeHash(repo, ['a.txt', 'gone.txt']));
});

test('documented v1 limit: a new untracked file does not change the tree hash', () => {
  const repo = makeRepo({ 'a.txt': 'a' });
  const before = computeTreeHash(repo);
  put(repo, 'brand-new.txt', 'new');
  assert.equal(computeTreeHash(repo), before);
});

test('receipts (tracked or not) never invalidate the tree hash', () => {
  const repo = makeRepo({ 'a.txt': 'a', 'Docs/evidence/receipts/r.json': '{"v":1}' });
  const before = computeTreeHash(repo);
  put(repo, 'Docs/evidence/receipts/r.json', '{"v":2}');
  put(repo, 'Docs/evidence/receipts/new.json', '{}');
  assert.equal(computeTreeHash(repo), before);
  // ...but with a different receipts dir, that same tracked file counts.
  assert.notEqual(computeTreeHash(repo, 'elsewhere'), computeTreeHash(repo));
});

test('staging a new file changes the tree hash (receipt-format.md: "Committing (or staging) … closes this gap")', {
  todo: 'BUG: treeHash lists `git ls-tree HEAD`, so staged-but-uncommitted files are invisible; receipt-format.md:48 promises staging closes the gap',
}, () => {
  const repo = makeRepo({ 'a.txt': 'a' });
  const before = computeTreeHash(repo);
  put(repo, 'staged.txt', 'staged');
  git(repo, 'add', 'staged.txt');
  assert.notEqual(computeTreeHash(repo), before);
});

test('computeTreeHash propagates the git failure outside a repo', () => {
  const plain = mkdtempSync(join(tmpdir(), 'eg-lib-plain2-'));
  assert.throws(() => computeTreeHash(plain), /git ls-tree failed/);
});

// ---- checkCompleteness ----
test('a complete receipt has no problems, with or without the optional outputPath', () => {
  assert.deepEqual(checkCompleteness(completeReceipt()), []);
  assert.deepEqual(checkCompleteness({ ...completeReceipt(), outputPath: 'x.output.txt' }), []);
  assert.deepEqual(checkCompleteness({ ...completeReceipt(), exitCode: 2 }), [],
    'a red exit code is complete — it is a valid receipt of a failed run');
});

test('a non-object receipt is rejected outright', () => {
  for (const bad of [null, [], 'str', 42, undefined]) {
    assert.deepEqual(checkCompleteness(bad), ['receipt is not a JSON object'], `input ${JSON.stringify(bad)}`);
  }
});

test('every missing required field is reported by name', () => {
  for (const f of REQUIRED_FIELDS) {
    const r = completeReceipt();
    delete r[f];
    assert.deepEqual(checkCompleteness(r), [`missing field: ${f}`]);
  }
  assert.equal(checkCompleteness({}).length, REQUIRED_FIELDS.length);
});

test('mistyped fields are reported: args non-array, exitCode non-integer, string fields empty or non-string', () => {
  assert.deepEqual(checkCompleteness({ ...completeReceipt(), args: 'test' }), ['args must be an array']);
  assert.deepEqual(checkCompleteness({ ...completeReceipt(), exitCode: '0' }), ['exitCode must be an integer']);
  assert.deepEqual(checkCompleteness({ ...completeReceipt(), exitCode: 1.5 }), ['exitCode must be an integer']);
  assert.deepEqual(checkCompleteness({ ...completeReceipt(), exitCode: null }), ['exitCode must be an integer']);
  for (const f of ['claim', 'command', 'cwd', 'outputDigest', 'treeHash', 'timestamp', 'producedBy']) {
    assert.deepEqual(checkCompleteness({ ...completeReceipt(), [f]: '' }), [`${f} must be a non-empty string`]);
    assert.deepEqual(checkCompleteness({ ...completeReceipt(), [f]: 7 }), [`${f} must be a non-empty string`]);
  }
});

test('several problems are all reported, not just the first', () => {
  const r = { ...completeReceipt(), args: {}, exitCode: 'x' };
  delete r.treeHash;
  assert.deepEqual(checkCompleteness(r).sort(),
    ['args must be an array', 'exitCode must be an integer', 'missing field: treeHash']);
});

test('args elements must be strings (contract: "array of strings")', {
  todo: 'BUG: checkCompleteness only checks Array.isArray(args), so args like [1, null] pass as complete (receipt-lib.mjs:73)',
}, () => {
  assert.notDeepEqual(checkCompleteness({ ...completeReceipt(), args: [1, null] }), []);
});
