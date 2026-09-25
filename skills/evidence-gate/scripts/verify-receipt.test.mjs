import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeTreeHash, sha256Hex } from './receipt-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'verify-receipt.mjs');
const createCli = join(here, 'create-receipt.mjs');

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
};
const put = (repo, rel, body) => {
  mkdirSync(dirname(join(repo, rel)), { recursive: true });
  writeFileSync(join(repo, rel), body);
};
const makeRepo = (files = { 'src/a.mjs': 'export const a = 1;\n' }) => {
  const repo = mkdtempSync(join(tmpdir(), 'eg-verify-'));
  git(repo, 'init', '-q');
  for (const [rel, body] of Object.entries(files)) put(repo, rel, body);
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'init');
  return repo;
};
const RDIR = 'Docs/evidence/receipts';

/**
 * Write a contract-shaped receipt bound to the repo's CURRENT tree.
 * `overrides` replaces fields (undefined deletes); `output` is the stored output body.
 */
const writeReceipt = (repo, slug, { overrides = {}, output = 'ok\n', dir = RDIR, withOutputPath = true } = {}) => {
  const receipt = {
    claim: `claim ${slug}`,
    command: 'npm',
    args: ['test'],
    cwd: repo,
    exitCode: 0,
    outputDigest: 'sha256:' + sha256Hex(output),
    ...(withOutputPath ? { outputPath: `${slug}.output.txt` } : {}),
    treeHash: computeTreeHash(repo, dir),
    timestamp: new Date().toISOString(),
    producedBy: 'agent-1',
  };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete receipt[k]; else receipt[k] = v;
  }
  put(repo, `${dir}/${slug}.output.txt`, output);
  const path = join(repo, dir, `${slug}.json`);
  put(repo, `${dir}/${slug}.json`, JSON.stringify(receipt, null, 2) + '\n');
  return path;
};
const verify = (args, { cwd, script = cli } = {}) =>
  spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });

// ---- PASS ----
test('a valid receipt against the unchanged tree passes: exit 0, PASS line, GATE: PASS', () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'unit');
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^PASS {2}"claim unit" {2}\(unit\.json\)$/m);
  assert.match(r.stdout, /GATE: PASS — all checked receipts verify against the live tree\./);
});

test('end to end: a receipt from create-receipt.mjs verifies, then goes STALE after a one-line edit', () => {
  const repo = makeRepo();
  const env = { ...process.env };
  delete env.CLAUDE_SESSION_ID;
  const c = spawnSync(process.execPath, [createCli, '--claim', 'tests pass', '--produced-by', 'a', '--repo', repo,
    '--', process.execPath, '-e', 'console.log("ok")'], { encoding: 'utf8', env });
  assert.equal(c.status, 0, c.stderr);
  const p = join(repo, RDIR, 'tests-pass.json');
  assert.equal(verify(['--repo', repo, p]).status, 0);
  put(repo, 'src/a.mjs', 'export const a = 1; // just a comment\n');
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /STALE_TREE/);
});

test('a missing outputPath falls back to <receipt-basename>.output.txt', () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'fallback', { withOutputPath: false });
  assert.equal(verify(['--repo', repo, p]).status, 0);
  rmSync(join(repo, RDIR, 'fallback.output.txt'));
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /MISSING_OUTPUT: full output not found at .*fallback\.output\.txt/);
});

test('committing the receipts does not stale them — the receipts dir is excluded from the hash', () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'committed');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'receipts');
  assert.equal(verify(['--repo', repo, p]).status, 0);
});

test('documented v1 limit: a new untracked file does not stale a receipt', () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'untracked');
  put(repo, 'brand-new.mjs', 'x');
  assert.equal(verify(['--repo', repo, p]).status, 0);
});

// ---- each fail-closed verdict ----
test('STALE_TREE: an uncommitted edit to a tracked file fails the gate', () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'stale');
  put(repo, 'src/a.mjs', 'export const a = 2;\n');
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^FAIL {2}"claim stale"/m);
  assert.match(r.stdout, /STALE_TREE: receipt treeHash sha256:[0-9a-f]{64} != live tree sha256:[0-9a-f]{64}/);
  assert.match(r.stdout, /GATE: FAIL — do not advance the lifecycle/);
});

test('STALE_TREE: deleting a tracked file fails the gate', () => {
  const repo = makeRepo({ 'a.txt': 'a', 'b.txt': 'b' });
  const p = writeReceipt(repo, 'deleted');
  rmSync(join(repo, 'b.txt'));
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /STALE_TREE/);
});

test('OPEN_FINDING: a red receipt (exitCode != 0) fails the gate even on a fresh tree', () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'red', { overrides: { exitCode: 2 } });
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /OPEN_FINDING: exitCode 2/);
  assert.doesNotMatch(r.stdout, /STALE_TREE|INCOMPLETE|MISSING_OUTPUT|OUTPUT_DIGEST_MISMATCH/);
});

test('OUTPUT_DIGEST_MISMATCH: a tampered stored output fails the gate', () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'tampered', { output: '3 failing\n' });
  put(repo, `${RDIR}/tampered.output.txt`, 'all passing\n');
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /OUTPUT_DIGEST_MISMATCH: stored output != outputDigest/);
});

test('MISSING_OUTPUT: a receipt whose stored output is gone fails the gate', () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'noout');
  rmSync(join(repo, RDIR, 'noout.output.txt'));
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /MISSING_OUTPUT/);
});

test('INCOMPLETE: missing or mistyped fields fail the gate and short-circuit the other checks', () => {
  const repo = makeRepo();
  const p1 = writeReceipt(repo, 'nohash', { overrides: { treeHash: undefined } });
  const r1 = verify(['--repo', repo, p1]);
  assert.equal(r1.status, 1);
  assert.match(r1.stdout, /INCOMPLETE: missing field: treeHash/);
  assert.doesNotMatch(r1.stdout, /STALE_TREE/);
  const p2 = writeReceipt(repo, 'badexit', { overrides: { exitCode: '0' } });
  const r2 = verify(['--repo', repo, p2]);
  assert.equal(r2.status, 1);
  assert.match(r2.stdout, /INCOMPLETE: exitCode must be an integer/);
});

test('INCOMPLETE: unparseable JSON, a non-object, or a nonexistent receipt file fails the gate', () => {
  const repo = makeRepo();
  put(repo, `${RDIR}/broken.json`, '{ not json');
  put(repo, `${RDIR}/array.json`, '[]');
  const broken = verify(['--repo', repo, join(repo, RDIR, 'broken.json')]);
  assert.equal(broken.status, 1);
  assert.match(broken.stdout, /^FAIL {2}broken\.json {2}\(broken\.json\)$/m, 'label falls back to the filename');
  assert.match(broken.stdout, /INCOMPLETE: unreadable\/unparseable JSON/);
  const arr = verify(['--repo', repo, join(repo, RDIR, 'array.json')]);
  assert.equal(arr.status, 1);
  assert.match(arr.stdout, /INCOMPLETE: receipt is not a JSON object/);
  const none = verify(['--repo', repo, join(repo, 'nope.json')]);
  assert.equal(none.status, 1);
  assert.match(none.stdout, /INCOMPLETE: unreadable/);
});

test('INCOMPLETE: a mistyped optional outputPath is reported as a verdict, not a crash', {
  todo: 'BUG: a non-string outputPath throws an uncaught TypeError from path.join (verify-receipt.mjs:50-51), aborting the whole run with no GATE line',
}, () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'badpath', { overrides: { outputPath: 123 } });
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /FAIL/);
  assert.match(r.stdout, /GATE: FAIL/);
});

test('every failure of one receipt is listed, not just the first', () => {
  const repo = makeRepo();
  const p = writeReceipt(repo, 'many', { overrides: { exitCode: 1 } });
  rmSync(join(repo, RDIR, 'many.output.txt'));
  put(repo, 'src/a.mjs', 'changed');
  const r = verify(['--repo', repo, p]);
  assert.equal(r.status, 1);
  for (const v of ['MISSING_OUTPUT', 'STALE_TREE', 'OPEN_FINDING']) assert.match(r.stdout, new RegExp(v));
});

// ---- multiple receipts / --all ----
test('several receipt files: one failing receipt fails the gate while the others are still reported', () => {
  const repo = makeRepo();
  const good = writeReceipt(repo, 'good');
  const bad = writeReceipt(repo, 'bad', { overrides: { exitCode: 1 } });
  const r = verify(['--repo', repo, good, bad]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^PASS {2}"claim good"/m);
  assert.match(r.stdout, /^FAIL {2}"claim bad"/m);
});

test('--all verifies every receipt: a newer clean pass never masks a still-open earlier finding', () => {
  const repo = makeRepo();
  writeReceipt(repo, 'a-earlier-red', { overrides: { exitCode: 1 } });
  writeReceipt(repo, 'z-newer-green');
  const r = verify(['--repo', repo, '--all']);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /FAIL {2}"claim a-earlier-red"/);
  assert.match(r.stdout, /PASS {2}"claim z-newer-green"/);
  assert.match(r.stdout, /GATE: FAIL/);
});

test('--all passes when every receipt passes, and ignores non-.json files in the dir', () => {
  const repo = makeRepo();
  writeReceipt(repo, 'one');
  writeReceipt(repo, 'two');
  put(repo, `${RDIR}/notes.md`, 'not a receipt');
  const r = verify(['--repo', repo, '--all']);
  assert.equal(r.status, 0, r.stdout);
  assert.equal(r.stdout.match(/^PASS /gm)?.length, 2);
  assert.match(r.stdout, /GATE: PASS/);
});

test('--all honours --receipts-dir', () => {
  const repo = makeRepo();
  writeReceipt(repo, 'custom', { dir: 'ev' });
  const r = verify(['--repo', repo, '--all', '--receipts-dir', 'ev']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PASS {2}"claim custom"/);
});

test('--all with no receipts is NO_EVIDENCE (fail-closed): missing dir, empty dir, or only outputs', () => {
  const repo = makeRepo();
  const missing = verify(['--repo', repo, '--all']);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /GATE: FAIL — NO_EVIDENCE: no receipts under .* \(fail-closed\)/);
  mkdirSync(join(repo, RDIR), { recursive: true });
  assert.equal(verify(['--repo', repo, '--all']).status, 1);
  put(repo, `${RDIR}/x.output.txt`, 'orphan output');
  const onlyOutputs = verify(['--repo', repo, '--all']);
  assert.equal(onlyOutputs.status, 1);
  assert.match(onlyOutputs.stderr, /NO_EVIDENCE/);
});

test('--repo defaults to the current working directory', () => {
  const repo = makeRepo();
  writeReceipt(repo, 'cwd');
  const r = verify(['--all'], { cwd: repo });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

// ---- usage + environment errors ----
test('usage errors exit 2: no receipts and no --all, or an unknown option', () => {
  const repo = makeRepo();
  const none = verify(['--repo', repo]);
  assert.equal(none.status, 2);
  assert.match(none.stderr, /pass one or more receipt files, or --all/);
  const unknown = verify(['--repo', repo, '--bogus']);
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /unknown option: --bogus/);
});

test('a repo whose tree cannot be hashed fails closed (exit 1)', () => {
  const plain = mkdtempSync(join(tmpdir(), 'eg-verify-plain-'));
  put(plain, 'r.json', '{}');
  const r = verify(['--repo', plain, join(plain, 'r.json')]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /GATE: FAIL — cannot hash live tree/);
});

test('CLI still runs when invoked through a symlinked path (macOS /tmp → /private/tmp)', () => {
  const repo = makeRepo();
  const linkDir = mkdtempSync(join(tmpdir(), 'eg-verify-link-'));
  const link = join(linkDir, 'scripts-link');
  symlinkSync(here, link);
  const script = join(link, 'verify-receipt.mjs');
  const r = verify(['--repo', repo, '--all'], { script });
  assert.match(r.stderr, /NO_EVIDENCE/, 'main() must run when the script is reached through a symlink');
  assert.equal(r.status, 1, 'an empty gate must never exit 0 silently through a symlinked script path');
  writeReceipt(repo, 'linked');
  assert.equal(verify(['--repo', repo, '--all'], { script }).status, 0);
});
