import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadSkills,
  closeMatches,
  findSkill,
  listBundledFiles,
  readSkillFile,
  resolveSkillsDir,
  assertSkillsDir,
} from '../dist/skills.js';

const repoSkills = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skills');

function tmpSkillsDir(skills) {
  const dir = mkdtempSync(join(tmpdir(), 'soltero-skills-'));
  for (const [name, content] of Object.entries(skills)) {
    mkdirSync(join(dir, name));
    writeFileSync(join(dir, name, 'SKILL.md'), content);
  }
  return dir;
}

const VALID = '---\nname: demo-skill\ndescription: Use when testing.\n---\n# Demo\n';

test('loads the real repo library with no warnings', () => {
  const index = loadSkills(repoSkills);
  assert.equal(index.skills.length, 50);
  assert.deepEqual(index.warnings, []);
  const leanTdd = findSkill(index, 'lean-tdd');
  assert.ok(leanTdd.body.includes('name: lean-tdd'));
  assert.ok(leanTdd.path.endsWith(join('skills', 'lean-tdd', 'SKILL.md')));
});

test('frontmatter parse failure omits the skill and surfaces a warning', () => {
  const dir = tmpSkillsDir({ 'good-one': VALID, 'broken-one': '# no frontmatter\n' });
  const index = loadSkills(dir);
  assert.deepEqual(index.skills.map(s => s.name), ['demo-skill']);
  assert.equal(index.warnings.length, 1);
  assert.ok(index.warnings[0].includes('broken-one'));
});

test('skill missing SKILL.md is omitted with a warning', () => {
  const dir = tmpSkillsDir({ 'good-one': VALID });
  mkdirSync(join(dir, 'empty-one'));
  const index = loadSkills(dir);
  assert.deepEqual(index.skills.map(s => s.name), ['demo-skill']);
  assert.ok(index.warnings[0].includes('empty-one'));
});

test('closeMatches finds prefix and substring matches', () => {
  const index = loadSkills(repoSkills);
  assert.ok(closeMatches(index, 'lean-td').includes('lean-tdd'));
  assert.ok(closeMatches(index, 'debug').includes('lean-debugging'));
  assert.deepEqual(closeMatches(index, 'zzz-no-such-thing'), []);
});

test('listBundledFiles excludes SKILL.md and recurses', () => {
  const files = listBundledFiles(join(repoSkills, 'build-mcp-server'));
  assert.ok(files.includes('reference.md'));
  assert.ok(files.includes('templates/server.ts'));
  assert.ok(!files.includes('SKILL.md'));
});

test('readSkillFile reads bundled files and blocks traversal', () => {
  const dir = join(repoSkills, 'build-mcp-server');
  assert.ok(readSkillFile(dir, 'reference.md').includes('Build MCP Server'));
  assert.equal(readSkillFile(dir, '../lean-tdd/SKILL.md'), null);
  assert.equal(readSkillFile(dir, '../../package.json'), null);
  assert.equal(readSkillFile(dir, 'no-such-file.md'), null);
});

test('resolveSkillsDir prefers SOLTERO_SKILLS_DIR', () => {
  assert.equal(resolveSkillsDir({ SOLTERO_SKILLS_DIR: '/tmp/x' }), '/tmp/x');
  assert.ok(resolveSkillsDir({}).endsWith('skills'));
});

test('assertSkillsDir fails fast on missing or non-directory paths', () => {
  assert.throws(() => assertSkillsDir('/definitely/not/here'), /not found/);
  assertSkillsDir(repoSkills); // does not throw
});
