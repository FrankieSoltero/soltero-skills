import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, 'scan-prisma-antipatterns.mjs');

const CLEAN = 'No Promise.all-over-writes or in-loop query patterns found.';

// Each test gets its own directory so hits never leak between fixtures.
const fixture = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'prisma-scan-'));
  for (const [rel, body] of Object.entries(files)) {
    const p = join(root, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
  }
  return root;
};
const run = (args, opts = {}) => {
  const r = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', ...opts });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
};
const hitLines = (stdout) => stdout.split('\n').filter((l) => /: (POOL\/ATOMICITY|N\+1) — /.test(l));
const pad = (k) => Array.from({ length: k }, () => '// filler').join('\n');

test('Promise.all over per-row prisma writes is flagged at the Promise.all line, and still exits 0', () => {
  const root = fixture({
    'a.ts': ['const x = 1;', 'await Promise.all(rows.map((r) => prisma.user.update({ where: { id: r.id }, data: r })));'].join('\n'),
  });
  const r = run([root]);
  assert.equal(r.code, 0, 'the scanner is advisory and must always exit 0');
  const hits = hitLines(r.stdout);
  assert.equal(hits.length, 1);
  assert.equal(hits[0], `${join(root, 'a.ts')}:2: POOL/ATOMICITY — Promise.all over Prisma writes; wrap in one $transaction or batch (updateMany).`);
  assert.match(r.stdout, /\n1 potential issue\(s\) flagged \(heuristic — verify each\)\./);
});

test('Promise.allSettled and every write verb are covered', () => {
  for (const verb of ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany']) {
    const root = fixture({ 'w.js': `await Promise.allSettled(ids.map((id) => prisma.order.${verb}({ where: { id } })));\n` });
    const hits = hitLines(run([root]).stdout);
    assert.equal(hits.length, 1, `Promise.allSettled over prisma.order.${verb} must be flagged`);
    assert.match(hits[0], /:1: POOL\/ATOMICITY/);
  }
});

test('a write is looked for in the Promise.all line plus the next 9 lines, not beyond', () => {
  const inside = fixture({ 'in.ts': ['await Promise.all([', pad(8), '  prisma.user.delete({ where: { id } }),', ']);'].join('\n') });
  assert.equal(hitLines(run([inside]).stdout).length, 1, 'a write on line i+9 is inside the window');
  const outside = fixture({ 'out.ts': ['await Promise.all([', pad(9), '  prisma.user.delete({ where: { id } }),', ']);'].join('\n') });
  const r = run([outside]);
  assert.equal(hitLines(r.stdout).length, 0, 'a write on line i+10 is outside the window');
  assert.match(r.stdout, new RegExp(CLEAN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('Promise.all over non-Prisma work is not flagged', () => {
  const root = fixture({ 'ok.ts': 'await Promise.all(urls.map((u) => fetch(u)));\n' });
  const r = run([root]);
  assert.equal(r.code, 0);
  assert.equal(hitLines(r.stdout).length, 0);
  assert.ok(r.stdout.includes(CLEAN));
});

test('a per-row prisma read inside a for/while/forEach loop is flagged as N+1 at the loop line', () => {
  const root = fixture({
    'for.ts': ['// header', 'for (const id of ids) {', '  const u = await prisma.user.findUnique({ where: { id } });', '}'].join('\n'),
    'while.ts': ['while (cursor) {', '  const n = await prisma.post.count({ where: { cursor } });', '}'].join('\n'),
    'each.ts': ['ids.forEach(async (id) => {', '  await prisma.post.findFirst({ where: { id } });', '});'].join('\n'),
  });
  const r = run([root]);
  assert.equal(r.code, 0);
  const hits = hitLines(r.stdout).sort();
  assert.deepEqual(hits.map((h) => h.replace(root, '<root>').replace(/ — .*/, '')), [
    '<root>/each.ts:1: N+1',
    '<root>/for.ts:2: N+1',
    '<root>/while.ts:1: N+1',
  ]);
  assert.match(hits[0], /use include\/select or a single findMany where id in \[\.\.\.\]\./);
  assert.match(r.stdout, /\n3 potential issue\(s\) flagged/);
});

test('a read is looked for in the loop line plus the next 11 lines, not beyond', () => {
  const inside = fixture({ 'in.ts': ['for (const id of ids) {', pad(10), '  await prisma.user.findMany({ where: { id } });', '}'].join('\n') });
  assert.equal(hitLines(run([inside]).stdout).length, 1, 'a read on line i+11 is inside the window');
  const outside = fixture({ 'out.ts': ['for (const id of ids) {', pad(11), '  await prisma.user.findMany({ where: { id } });', '}'].join('\n') });
  assert.equal(hitLines(run([outside]).stdout).length, 0, 'a read on line i+12 is outside the window');
});

test('a loop with no prisma read, and a prisma read with no loop, are both clean', () => {
  const root = fixture({
    'loop.ts': 'for (const id of ids) {\n  total += id;\n}\n',
    'read.ts': 'const users = await prisma.user.findMany({ where: { id: { in: ids } } });\n',
  });
  const r = run([root]);
  assert.equal(hitLines(r.stdout).length, 0);
  assert.ok(r.stdout.includes(CLEAN));
});

test('only .ts .tsx .js .jsx .mjs .cjs files are scanned', () => {
  const bad = 'await Promise.all(rows.map((r) => prisma.user.create({ data: r })));\n';
  const root = fixture({
    'a.ts': bad, 'b.tsx': bad, 'c.js': bad, 'd.jsx': bad, 'e.mjs': bad, 'f.cjs': bad,
    'g.py': bad, 'h.md': bad, 'schema.prisma': bad, 'i.json': bad,
  });
  const hits = hitLines(run([root]).stdout).map((h) => h.split(':')[0].replace(`${root}/`, '')).sort();
  assert.deepEqual(hits, ['a.ts', 'b.tsx', 'c.js', 'd.jsx', 'e.mjs', 'f.cjs']);
});

test('node_modules, .git, dist, build, .next and coverage are skipped; other nested dirs are walked', () => {
  const bad = 'await Promise.all(rows.map((r) => prisma.user.upsert(r)));\n';
  const root = fixture({
    'node_modules/pkg/a.js': bad,
    '.git/hooks/a.js': bad,
    'dist/a.js': bad,
    'build/a.js': bad,
    '.next/a.js': bad,
    'coverage/a.js': bad,
    'src/deep/nested/real.ts': bad,
  });
  const hits = hitLines(run([root]).stdout);
  assert.equal(hits.length, 1);
  assert.ok(hits[0].startsWith(join(root, 'src/deep/nested/real.ts') + ':1:'));
});

test('with no paths it scans the current directory', () => {
  const root = fixture({ 'src/a.ts': 'for (const id of ids) { await prisma.user.findUnique({ where: { id } }); }\n' });
  const r = run([], { cwd: root });
  assert.equal(r.code, 0);
  const hits = hitLines(r.stdout);
  assert.equal(hits.length, 1);
  assert.match(hits[0], /^src\/a\.ts:1: N\+1/);
});

test('several paths, including a single file, are all scanned; a nonexistent path is ignored and still exits 0', () => {
  const a = fixture({ 'one.ts': 'await Promise.all(xs.map((x) => prisma.a.delete(x)));\n' });
  const b = fixture({ 'two.js': 'xs.map((x) => prisma.b.count(x));\n' });
  const r = run([a, join(b, 'two.js'), join(a, 'nope-does-not-exist')]);
  assert.equal(r.code, 0);
  assert.equal(r.stderr, '');
  const hits = hitLines(r.stdout);
  assert.equal(hits.length, 2);
  assert.ok(hits.some((h) => h.startsWith(`${join(a, 'one.ts')}:1: POOL/ATOMICITY`)));
  assert.ok(hits.some((h) => h.startsWith(`${join(b, 'two.js')}:1: N+1`)));
  const missingOnly = run([join(a, 'nope-does-not-exist')]);
  assert.equal(missingOnly.code, 0);
  assert.ok(missingOnly.stdout.includes(CLEAN));
});

test('CLI still runs when invoked through a symlinked path (macOS /tmp → /private/tmp)', () => {
  const linkDir = mkdtempSync(join(tmpdir(), 'prisma-scan-link-'));
  const link = join(linkDir, 'scripts-link');
  symlinkSync(here, link);
  const root = fixture({ 'a.ts': 'await Promise.all(rows.map((r) => prisma.user.update(r)));\n' });
  const r = spawnSync(process.execPath, [join(link, 'scan-prisma-antipatterns.mjs'), root], { encoding: 'utf8' });
  assert.match(r.stdout, /POOL\/ATOMICITY/, 'the scan must run when reached through a symlink');
  assert.equal(r.status, 0);
});
