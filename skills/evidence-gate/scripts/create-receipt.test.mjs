import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeTreeHash } from './receipt-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'create-receipt.mjs');

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
const makeRepo = (files = { 'src/a.mjs': 'export const a = 1;\n' }) => {
  const repo = mkdtempSync(join(tmpdir(), 'eg-create-'));
  git(repo, 'init', '-q');
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(repo, rel)), { recursive: true });
    writeFileSync(join(repo, rel), body);
  }
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'init');
  return repo;
};
// Never inherit a session id from the environment running the suite.
const baseEnv = () => {
  const env = { ...process.env };
  delete env.CLAUDE_SESSION_ID;
  return env;
};
const run = (args, { cwd, env = baseEnv(), script = cli } = {}) =>
  spawnSync(process.execPath, [script, ...args], { cwd, env, encoding: 'utf8' });
/** Node one-liner as the verification command: portable, no shell. */
const nodeCmd = (js) => ['--', process.execPath, '-e', js];
const receiptsDir = (repo) => join(repo, 'Docs', 'evidence', 'receipts');
const readReceipt = (repo, slug, dir = receiptsDir(repo)) => JSON.parse(readFileSync(join(dir, `${slug}.json`), 'utf8'));
const sha = (b) => 'sha256:' + createHash('sha256').update(b).digest('hex');

// ---- happy path ----
test('a passing command writes a complete receipt + stored output and exits 0', () => {
  const repo = makeRepo();
  const r = run(['--claim', 'Unit tests pass for ACME-4477', '--produced-by', 'agent-7', '--repo', repo,
    ...nodeCmd('process.stdout.write("all green\\n")')]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /receipt: .*unit-tests-pass-for-acme-4477\.json/);
  assert.match(r.stdout, /exitCode: 0 \(green\)/);

  const rc = readReceipt(repo, 'unit-tests-pass-for-acme-4477');
  assert.equal(rc.claim, 'Unit tests pass for ACME-4477');
  assert.equal(rc.command, process.execPath);
  assert.deepEqual(rc.args, ['-e', 'process.stdout.write("all green\\n")']);
  assert.equal(rc.cwd, repo);
  assert.equal(rc.exitCode, 0);
  assert.equal(rc.outputPath, 'unit-tests-pass-for-acme-4477.output.txt');
  const out = readFileSync(join(receiptsDir(repo), rc.outputPath));
  assert.equal(out.toString('utf8'), 'all green\n');
  assert.equal(rc.outputDigest, sha(out));
  assert.equal(rc.treeHash, computeTreeHash(repo));
  assert.match(rc.treeHash, /^sha256:[0-9a-f]{64}$/);
  assert.ok(!Number.isNaN(Date.parse(rc.timestamp)) && rc.timestamp === new Date(rc.timestamp).toISOString(),
    'timestamp is ISO-8601');
  assert.equal(rc.producedBy, 'agent-7');
});

test('the command runs in --repo, and the output digest covers stdout then stderr', () => {
  const repo = makeRepo();
  const r = run(['--claim', 'cwd check', '--produced-by', 'a', '--repo', repo,
    ...nodeCmd('process.stdout.write(process.cwd()+"\\n");process.stderr.write("warn\\n")')]);
  assert.equal(r.status, 0, r.stderr);
  const out = readFileSync(join(receiptsDir(repo), 'cwd-check.output.txt'), 'utf8');
  const [cwdLine, errLine] = out.split('\n');
  assert.equal(readFileSync(join(cwdLine, 'src/a.mjs'), 'utf8'), 'export const a = 1;\n', 'ran inside the repo');
  assert.equal(errLine, 'warn');
  assert.equal(readReceipt(repo, 'cwd-check').outputDigest, sha(Buffer.from(out)));
});

test('--repo defaults to the current working directory', () => {
  const repo = makeRepo();
  const r = run(['--claim', 'default repo', '--produced-by', 'a', ...nodeCmd('')], { cwd: repo });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(receiptsDir(repo), 'default-repo.json')));
});

test('--produced-by falls back to CLAUDE_SESSION_ID', () => {
  const repo = makeRepo();
  const r = run(['--claim', 'env id', '--repo', repo, ...nodeCmd('')],
    { env: { ...baseEnv(), CLAUDE_SESSION_ID: 'session-xyz' } });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readReceipt(repo, 'env-id').producedBy, 'session-xyz');
});

test('--receipts-dir writes elsewhere and excludes that dir from the tree hash', () => {
  const repo = makeRepo({ 'a.txt': 'a', 'ev/old.json': '{}' });
  const r = run(['--claim', 'custom dir', '--produced-by', 'a', '--repo', repo, '--receipts-dir', 'ev',
    ...nodeCmd('')]);
  assert.equal(r.status, 0, r.stderr);
  const rc = readReceipt(repo, 'custom-dir', join(repo, 'ev'));
  assert.equal(rc.treeHash, computeTreeHash(repo, 'ev'));
  assert.ok(!existsSync(receiptsDir(repo)), 'default dir untouched');
});

// ---- red receipts ----
test('a failing command still writes a red receipt and exits with the command\'s exit code', () => {
  const repo = makeRepo();
  const r = run(['--claim', 'tests pass', '--produced-by', 'a', '--repo', repo,
    ...nodeCmd('process.stderr.write("3 failing\\n");process.exit(3)')]);
  assert.equal(r.status, 3);
  assert.match(r.stdout, /exitCode: 3 \(RED — open finding, blocks the gate\)/);
  const rc = readReceipt(repo, 'tests-pass');
  assert.equal(rc.exitCode, 3);
  assert.equal(readFileSync(join(receiptsDir(repo), 'tests-pass.output.txt'), 'utf8'), '3 failing\n');
});

test('a command that cannot be spawned records exitCode 127 and the spawn error', () => {
  const repo = makeRepo();
  const r = run(['--claim', 'missing binary', '--produced-by', 'a', '--repo', repo,
    '--', 'definitely-not-a-real-binary-eg-xyz']);
  assert.equal(r.status, 127);
  const rc = readReceipt(repo, 'missing-binary');
  assert.equal(rc.exitCode, 127);
  assert.match(readFileSync(join(receiptsDir(repo), 'missing-binary.output.txt'), 'utf8'), /^spawn error: /);
});

test('a command killed by a signal counts as a failure (exitCode 1)', () => {
  const repo = makeRepo();
  const r = run(['--claim', 'killed', '--produced-by', 'a', '--repo', repo,
    ...nodeCmd('process.kill(process.pid, "SIGKILL")')]);
  assert.equal(r.status, 1);
  assert.equal(readReceipt(repo, 'killed').exitCode, 1);
});

test('the receipt file is deterministic per claim: a re-run overwrites it, other claims are untouched', () => {
  const repo = makeRepo();
  assert.equal(run(['--claim', 'Claim A', '--produced-by', 'a', '--repo', repo, ...nodeCmd('process.exit(1)')]).status, 1);
  assert.equal(run(['--claim', 'claim B', '--produced-by', 'a', '--repo', repo, ...nodeCmd('')]).status, 0);
  assert.equal(readReceipt(repo, 'claim-a').exitCode, 1, 'a green run of another claim never masks claim A');
  assert.equal(run(['--claim', 'claim a', '--produced-by', 'a', '--repo', repo, ...nodeCmd('')]).status, 0);
  assert.equal(readReceipt(repo, 'claim-a').exitCode, 0, 'only re-running claim A turns it green');
  assert.deepEqual(readdirSync(receiptsDir(repo)).sort(),
    ['claim-a.json', 'claim-a.output.txt', 'claim-b.json', 'claim-b.output.txt']);
});

test('the tree is hashed AFTER the command runs', () => {
  const repo = makeRepo({ 'a.txt': 'before\n' });
  const before = computeTreeHash(repo);
  const r = run(['--claim', 'mutating', '--produced-by', 'a', '--repo', repo,
    ...nodeCmd('require("fs").writeFileSync("a.txt","after\\n")')]);
  assert.equal(r.status, 0, r.stderr);
  const rc = readReceipt(repo, 'mutating');
  assert.notEqual(rc.treeHash, before);
  assert.equal(rc.treeHash, computeTreeHash(repo));
});

// ---- usage errors (exit 2) ----
test('usage errors exit 2 and write nothing', () => {
  const repo = makeRepo();
  const cases = [
    [['--produced-by', 'a', '--repo', repo, ...nodeCmd('')], /--claim is required/],
    [['--claim', 'x', '--produced-by', 'a', '--repo', repo], /no command given after --/],
    [['--claim', 'x', '--produced-by', 'a', '--repo', repo, '--'], /no command given after --/],
    [['--claim', 'x', '--repo', repo, ...nodeCmd('')], /--produced-by is required \(or set CLAUDE_SESSION_ID\)/],
    [['--claim', 'x', '--produced-by', 'a', '--repo', repo, '--bogus', ...nodeCmd('')], /unknown option before --: --bogus/],
    [['--claim', 'x', '--produced-by', 'a', '--repo', repo, 'npm', 'test'], /unknown option before --: npm/],
  ];
  for (const [args, msg] of cases) {
    const r = run(args);
    assert.equal(r.status, 2, `args ${JSON.stringify(args)}`);
    assert.match(r.stderr, msg);
  }
  assert.ok(!existsSync(receiptsDir(repo)), 'no receipt dir created by a usage error');
});

test('a claim with no alphanumerics is a usage error (exit 2) caught before the command runs', {
  todo: 'BUG: slugify() runs after spawnSync (create-receipt.mjs:67 vs :54), so the command executes and the script then crashes with an uncaught throw, exit 1',
}, () => {
  const repo = makeRepo();
  const marker = join(repo, 'ran.marker');
  const r = run(['--claim', '!!!', '--produced-by', 'a', '--repo', repo,
    ...nodeCmd(`require("fs").writeFileSync(${JSON.stringify(marker)}, "x")`)]);
  assert.equal(r.status, 2);
  assert.ok(!existsSync(marker), 'the verification command must not run for an invalid claim');
});

test('a non-git --repo fails and writes no receipt', () => {
  const plain = mkdtempSync(join(tmpdir(), 'eg-create-plain-'));
  const r = run(['--claim', 'no git', '--produced-by', 'a', '--repo', plain, ...nodeCmd('')]);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /git ls-tree failed/);
  assert.ok(!existsSync(join(receiptsDir(plain), 'no-git.json')));
});

test('CLI still runs when invoked through a symlinked path (macOS /tmp → /private/tmp)', () => {
  const repo = makeRepo();
  const linkDir = mkdtempSync(join(tmpdir(), 'eg-create-link-'));
  const link = join(linkDir, 'scripts-link');
  symlinkSync(here, link);
  const script = join(link, 'create-receipt.mjs');
  const red = run(['--claim', 'via link', '--produced-by', 'a', '--repo', repo, ...nodeCmd('process.exit(4)')], { script });
  assert.match(red.stdout, /exitCode: 4 \(RED/, 'main() must run when the script is reached through a symlink');
  assert.equal(red.status, 4, 'a red verification must never exit 0 through a symlinked script path');
  assert.equal(run(['--claim', 'via link', '--produced-by', 'a', '--repo', repo, ...nodeCmd('')], { script }).status, 0);
});
