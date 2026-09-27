import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFrontmatter, parseFrontmatter } from './lint-frontmatter.mjs';

test('valid frontmatter yields no errors', () => {
  const errors = validateFrontmatter(
    { name: 'capture-lesson', description: 'Use when ...' }, 'capture-lesson');
  assert.deepEqual(errors, []);
});

test('missing name is an error', () => {
  assert.ok(validateFrontmatter({ description: 'x' }, 'foo').some(e => e.includes('name')));
});

test('missing description is an error', () => {
  assert.ok(validateFrontmatter({ name: 'foo' }, 'foo').some(e => e.includes('description')));
});

test('name must match folder', () => {
  assert.ok(validateFrontmatter({ name: 'foo', description: 'x' }, 'bar').some(e => e.includes('folder')));
});

test('reserved name rejected', () => {
  assert.ok(validateFrontmatter({ name: 'claude', description: 'x' }, 'claude').some(e => e.includes('reserved')));
});

test('uppercase name rejected', () => {
  assert.ok(validateFrontmatter({ name: 'FooBar', description: 'x' }, 'FooBar').some(e => e.includes('lowercase')));
});

test('name over 64 chars rejected', () => {
  const n = 'a'.repeat(65);
  assert.ok(validateFrontmatter({ name: n, description: 'x' }, n).some(e => e.includes('64')));
});

test('description over 1024 chars rejected', () => {
  assert.ok(validateFrontmatter({ name: 'foo', description: 'x'.repeat(1025) }, 'foo').some(e => e.includes('1024')));
});

test('parseFrontmatter extracts quoted and unquoted fields', () => {
  const fm = parseFrontmatter('---\nname: foo\ndescription: "bar: baz"\n---\n# Title');
  assert.equal(fm.name, 'foo');
  assert.equal(fm.description, 'bar: baz');
});

test('parseFrontmatter returns null when no frontmatter', () => {
  assert.equal(parseFrontmatter('# Title only'), null);
});

test('parseFrontmatter reads a SKILL.md saved with CRLF line endings', () => {
  const fm = parseFrontmatter('---\r\nname: my-skill\r\ndescription: "Use when X"\r\n---\r\n\r\n# Body\r\n');
  assert.deepEqual(fm, { name: 'my-skill', description: 'Use when X' });
});

test('CLI runs when reached through a symlinked path (GP-001)', async () => {
  const { spawnSync } = await import('node:child_process');
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const url = await import('node:url');
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  const link = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gp001-')), 'link');
  fs.symlinkSync(here, link);
  const r = spawnSync(process.execPath, [path.join(link, 'lint-frontmatter.mjs')], { encoding: 'utf8', cwd: path.join(here, '..') });
  assert.match(r.stdout + r.stderr, /✓ capture-lesson/, 'main() must run through a symlink, not exit silently');
});
