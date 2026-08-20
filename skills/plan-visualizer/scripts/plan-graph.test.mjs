import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { analyzePlan, toMermaid, toMarkdown } from './plan-graph.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(here, '../../../tests/scenarios/plan-visualizer/fixtures');
const webhook = readFileSync(path.join(fixtures, '2026-08-18-webhook-delivery.md'), 'utf8');
const prose = readFileSync(path.join(fixtures, '2026-08-19-rate-limits-prose.md'), 'utf8');

const kinds = (r) => r.findings.map((f) => f.kind);
const byKind = (r, k) => r.findings.filter((f) => f.kind === k);

test('parses the dependency table: ids, files, deps, tiers', () => {
  const r = analyzePlan(webhook);
  assert.equal(r.tasks.length, 5);
  const t3 = r.tasks.find((t) => t.id === 3);
  assert.equal(t3.title, 'Dispatcher');
  assert.deepEqual(t3.dependsOn, [1]);
  assert.equal(t3.tier, 'judgment');
  assert.deepEqual(t3.tableFiles, ['src/webhooks/dispatcher.ts', 'tests/webhooks/dispatcher.test.ts']);
  assert.deepEqual(r.tasks.find((t) => t.id === 5).dependsOn, [1, 3]);
});

test('parses task blocks: block files, consumes refs, behavior rows, verify', () => {
  const r = analyzePlan(webhook);
  const t3 = r.tasks.find((t) => t.id === 3);
  assert.deepEqual(t3.consumesFrom, [1, 2]);
  assert.equal(t3.behaviorRows, 4);
  assert.match(t3.verify, /vitest run tests\/webhooks\/dispatcher\.test\.ts/);
  const t5 = r.tasks.find((t) => t.id === 5);
  assert.ok(t5.blockFiles.includes('src/routes/index.ts'));
});

test('derives waves from DECLARED deps only', () => {
  const r = analyzePlan(webhook);
  assert.deepEqual(r.waves, [[1, 2, 4], [3], [5]]);
});

test('flags consumes-without-dependency (Task 3 consumes Task 2, table says depends on 1)', () => {
  const f = byKind(analyzePlan(webhook), 'consumes-without-dependency');
  assert.equal(f.length, 1);
  assert.equal(f[0].task, 3);
  assert.equal(f[0].relatedTask, 2);
  assert.equal(f[0].severity, 'blocking');
  assert.match(f[0].evidence, /Consumes:/);
});

test('flags concurrent file overlap between unordered tasks (2 and 4 share src/config.ts)', () => {
  const f = byKind(analyzePlan(webhook), 'concurrent-file-overlap');
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].task, f[0].relatedTask].sort(), [2, 4]);
  assert.equal(f[0].file, 'src/config.ts');
  assert.equal(f[0].severity, 'blocking');
});

test('flags table/block file drift (Task 5 block modifies src/routes/index.ts, table omits it)', () => {
  const f = byKind(analyzePlan(webhook), 'file-drift');
  assert.equal(f.length, 1);
  assert.equal(f[0].task, 5);
  assert.equal(f[0].file, 'src/routes/index.ts');
});

test('flags missing risk tier (Task 5)', () => {
  const f = byKind(analyzePlan(webhook), 'missing-risk-tier');
  assert.deepEqual(f.map((x) => x.task), [5]);
});

test('does not invent findings the fixture does not contain', () => {
  const r = analyzePlan(webhook);
  assert.deepEqual(kinds(r).sort(), [
    'concurrent-file-overlap',
    'consumes-without-dependency',
    'file-drift',
    'missing-risk-tier',
  ]);
});

test('plan with no dependency table: no waves, blocking finding, tasks still listed', () => {
  const r = analyzePlan(prose);
  assert.equal(r.hasDependencyTable, false);
  assert.equal(r.waves, null);
  const f = byKind(r, 'no-dependency-table');
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, 'blocking');
  assert.equal(r.tasks.length, 5);
  assert.ok(r.tasks.every((t) => t.dependsOn.length === 0));
});

test('detects dangling dependency and cycle', () => {
  const plan = `# P\n\n## Task Dependency Table\n\n| Task | Files touched | Depends on | Risk tier |\n|---|---|---|---|\n| 1. A | \`a.ts\` | 2 | standard |\n| 2. B | \`b.ts\` | 1 | standard |\n| 3. C | \`c.ts\` | 9 | mechanical |\n`;
  const r = analyzePlan(plan);
  assert.equal(byKind(r, 'cycle').length, 1);
  assert.deepEqual(byKind(r, 'dangling-dependency').map((f) => [f.task, f.relatedTask]), [[3, 9]]);
});

test('mermaid: one node per task, declared edges solid, undeclared consumes dashed, tier classes', () => {
  const r = analyzePlan(webhook);
  const m = toMermaid(r);
  assert.match(m, /^flowchart LR/m);
  for (const id of [1, 2, 3, 4, 5]) assert.match(m, new RegExp(`T${id}\\[`));
  assert.match(m, /T1 --> T3/);
  assert.match(m, /T2 -\.->\|undeclared\| T3/);
  assert.match(m, /class T3 judgment/);
  assert.match(m, /class T4 mechanical/);
  assert.match(m, /class T5 untiered/);
  assert.match(m, /subgraph W1\["Wave 1 \(derived\)"\]/);
});

test('markdown render names every finding and labels waves as derived', () => {
  const r = analyzePlan(webhook);
  const md = toMarkdown(r, { planPath: 'docs/plans/2026-08-18-webhook-delivery.md' });
  assert.match(md, /```mermaid/);
  assert.match(md, /## Integrity findings \(4\)/);
  assert.match(md, /consumes-without-dependency/);
  assert.match(md, /derived.*executor/i);
  assert.match(md, /2026-08-18-webhook-delivery\.md/);
});

test('markdown render for a plan with zero findings says so', () => {
  const plan = `# P\n\n## Task Dependency Table\n\n| Task | Files touched | Depends on | Risk tier |\n|---|---|---|---|\n| 1. A | \`a.ts\` | — | standard |\n| 2. B | \`b.ts\` | 1 | mechanical |\n\n## Task 1: A\n\n**Files:**\n- Create: \`a.ts\`\n\n**Interfaces:**\n- Consumes: —\n- Produces: \`a(): void\`\n\n## Task 2: B\n\n**Files:**\n- Create: \`b.ts\`\n\n**Interfaces:**\n- Consumes: \`a\` (Task 1)\n- Produces: \`b(): void\`\n`;
  const r = analyzePlan(plan);
  assert.deepEqual(r.findings, []);
  assert.match(toMarkdown(r, { planPath: 'p.md' }), /## Integrity findings \(0\)/);
});
