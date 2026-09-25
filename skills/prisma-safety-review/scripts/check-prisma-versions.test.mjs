import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'check-prisma-versions.mjs');
const dir = mkdtempSync(join(tmpdir(), 'prisma-versions-'));

let n = 0;
const pkgFile = (pkg) => {
  const p = join(dir, `package-${n++}.json`);
  writeFileSync(p, typeof pkg === 'string' ? pkg : JSON.stringify(pkg));
  return p;
};
const run = (args, opts = {}) => {
  const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', ...opts });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
};

test('identical exact versions pass with exit 0 and name the shared version', () => {
  const r = run([pkgFile({ dependencies: { prisma: '5.10.0', '@prisma/client': '5.10.0' } })]);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /✓ prisma and @prisma\/client both at 5\.10\.0\./);
  assert.equal(r.stderr, '');
});

test('the pair is found across dependencies and devDependencies', () => {
  const r = run([pkgFile({ dependencies: { '@prisma/client': '6.1.0' }, devDependencies: { prisma: '6.1.0' } })]);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /both at 6\.1\.0/);
});

test('leading range operators are stripped before comparing, so ^5.10.0 equals 5.10.0', () => {
  const caret = run([pkgFile({ dependencies: { prisma: '^5.10.0', '@prisma/client': '5.10.0' } })]);
  assert.equal(caret.code, 0);
  assert.match(caret.stdout, /both at 5\.10\.0\./);
  const mixed = run([pkgFile({ dependencies: { prisma: '~5.10.0', '@prisma/client': '>=5.10.0' } })]);
  assert.equal(mixed.code, 0);
});

test('a version mismatch fails with exit 1 and names both declared versions', () => {
  const r = run([pkgFile({ dependencies: { prisma: '5.10.0', '@prisma/client': '5.11.0' } })]);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /✗ Version mismatch: prisma=5\.10\.0 vs @prisma\/client=5\.11\.0/);
  assert.match(r.stderr, /Pin both to the SAME exact version/);
  assert.equal(r.stdout, '');
});

test('a range mismatch still fails after the operators are stripped', () => {
  const r = run([pkgFile({ dependencies: { prisma: '^5.10.0', '@prisma/client': '^5.10.1' } })]);
  assert.equal(r.code, 1);
  assert.match(r.stderr, /prisma=\^5\.10\.0 vs @prisma\/client=\^5\.10\.1/);
});

test('only one Prisma package present fails with exit 1, naming the missing one', () => {
  const noClient = run([pkgFile({ devDependencies: { prisma: '5.10.0' } })]);
  assert.equal(noClient.code, 1);
  assert.match(noClient.stderr, /Only one Prisma package is present \(prisma=5\.10\.0, @prisma\/client=missing\)/);
  const noCli = run([pkgFile({ dependencies: { '@prisma/client': '5.10.0' } })]);
  assert.equal(noCli.code, 1);
  assert.match(noCli.stderr, /\(prisma=missing, @prisma\/client=5\.10\.0\)/);
});

test('no Prisma dependencies at all is a skip with exit 0, not a failure', () => {
  const other = run([pkgFile({ dependencies: { express: '4.0.0' } })]);
  assert.equal(other.code, 0);
  assert.match(other.stdout, /No Prisma dependencies found — skipping\./);
  const bare = run([pkgFile({ name: 'x' })]);
  assert.equal(bare.code, 0);
  assert.match(bare.stdout, /No Prisma dependencies found/);
});

test('an unreadable or unparseable package.json exits 2, distinct from a mismatch', () => {
  const missing = join(dir, 'does-not-exist.json');
  const r = run([missing]);
  assert.equal(r.code, 2);
  assert.match(r.stderr, new RegExp(`Cannot read ${missing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`));
  const bad = run([pkgFile('{ "dependencies": ')]);
  assert.equal(bad.code, 2);
  assert.match(bad.stderr, /Cannot read .*: /);
});

test('with no argument it reads package.json from the working directory', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'prisma-versions-cwd-'));
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { prisma: '5.0.0', '@prisma/client': '5.1.0' } }));
  const r = run([], { cwd });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /Version mismatch/);
  const empty = mkdtempSync(join(tmpdir(), 'prisma-versions-empty-'));
  const none = run([], { cwd: empty });
  assert.equal(none.code, 2);
  assert.match(none.stderr, /Cannot read package\.json/);
});

test('CLI still runs when invoked through a symlinked path (macOS /tmp → /private/tmp)', () => {
  const linkDir = mkdtempSync(join(tmpdir(), 'prisma-versions-link-'));
  const link = join(linkDir, 'scripts-link');
  symlinkSync(here, link);
  const bad = pkgFile({ dependencies: { prisma: '5.10.0', '@prisma/client': '5.11.0' } });
  const r = spawnSync(process.execPath, [join(link, 'check-prisma-versions.mjs'), bad], { encoding: 'utf8' });
  assert.match(r.stderr, /Version mismatch/, 'the check must run when reached through a symlink');
  assert.equal(r.status, 1, 'a mismatch must never exit 0 silently through a symlinked script path');
});
