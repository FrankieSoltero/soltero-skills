import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tabulate, toMarkdown, FLAG_CODES } from './paired-table.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'paired-table.mjs');
const fixtures = path.resolve(here, '../../../tests/scenarios/skill-ab-eval/fixtures/eval-lab/Docs/evals');
const load = (f) => JSON.parse(readFileSync(path.join(fixtures, f), 'utf8'));

const codes = (r) => r.flags.map((f) => f.code);
const has = (r, code) => codes(r).includes(code);

const run = (tier, scenario, arm, verdict, extra = {}) => ({ tier, scenario, arm, verdict, ...extra });

// A minimal healthy batch: two tiers, paired, real lift, canary fails without the skill.
function healthy() {
  const runs = [];
  for (const tier of ['sonnet', 'haiku']) {
    for (const sc of ['scenario-1', 'scenario-2']) {
      runs.push(run(tier, sc, 'without', 'fail'));
      runs.push(run(tier, sc, 'with', 'pass'));
    }
    runs.push(run(tier, 'canary-x', 'without', 'fail'));
  }
  return { skill: 'demo', date: '2026-09-01', canary: { scenario: 'canary-x' }, runs };
}

test('healthy batch: no flags, ship decision supported, per-tier delta computed', () => {
  const r = tabulate(healthy());
  assert.deepEqual(r.flags, []);
  assert.equal(r.shipDecisionSupported, true);
  assert.equal(r.tiers.length, 2);
  const sonnet = r.tiers.find((t) => t.tier === 'sonnet');
  assert.equal(sonnet.withPass, 2);
  assert.equal(sonnet.withoutPass, 0);
  assert.equal(sonnet.deltaPP, 100);
  assert.equal(r.canary.alive, true);
});

test('canary runs are excluded from the efficacy math', () => {
  const r = tabulate(healthy());
  // 2 scenarios per tier, not 3 - the canary must never pad a delta.
  assert.equal(r.tiers.find((t) => t.tier === 'sonnet').withoutTotal, 2);
  assert.equal(r.pairs.filter((p) => p.tier === 'sonnet').length, 2);
  assert.ok(!r.pairs.some((p) => p.scenario === 'canary-x'));
});

test('CANARY_PASSED when the canary passes without the skill, naming the tiers', () => {
  const input = healthy();
  input.runs.find((x) => x.scenario === 'canary-x' && x.tier === 'haiku').verdict = 'pass';
  const r = tabulate(input);
  assert.ok(has(r, 'CANARY_PASSED'));
  const f = r.flags.find((x) => x.code === 'CANARY_PASSED');
  assert.deepEqual(f.tiers, ['haiku']);
  assert.match(f.message, /void/);
  assert.equal(r.canary.alive, false);
  assert.equal(r.shipDecisionSupported, false);
});

test('CANARY_MISSING when no canary is declared', () => {
  const input = healthy();
  delete input.canary;
  const r = tabulate(input);
  assert.ok(has(r, 'CANARY_MISSING'));
  assert.equal(r.canary.scenario, null);
});

test('CANARY_MISSING when the canary has no without-arm run', () => {
  const input = healthy();
  input.runs = input.runs.filter((x) => x.scenario !== 'canary-x');
  const r = tabulate(input);
  assert.ok(has(r, 'CANARY_MISSING'));
});

test('CANARY_MISSING when the canary verdict is unknown (no usable liveness proof)', () => {
  const input = healthy();
  input.runs.find((x) => x.scenario === 'canary-x' && x.tier === 'sonnet').verdict = 'unknown';
  const r = tabulate(input);
  assert.ok(has(r, 'CANARY_MISSING'));
  assert.ok(!has(r, 'CANARY_PASSED'));
  assert.equal(r.canary.alive, false);
});

test('SINGLE_TIER when only one tier was measured', () => {
  const input = healthy();
  input.runs = input.runs.filter((x) => x.tier === 'sonnet');
  const r = tabulate(input);
  assert.ok(has(r, 'SINGLE_TIER'));
  assert.match(r.flags.find((f) => f.code === 'SINGLE_TIER').message, /per-tier fact/);
});

test('PAIR_INCOMPLETE when a scenario is missing an arm', () => {
  const input = healthy();
  input.runs = input.runs.filter((x) => !(x.tier === 'haiku' && x.scenario === 'scenario-2' && x.arm === 'without'));
  const r = tabulate(input);
  const f = r.flags.find((x) => x.code === 'PAIR_INCOMPLETE');
  assert.equal(f.tier, 'haiku');
  assert.equal(f.scenario, 'scenario-2');
  assert.equal(r.pairs.find((p) => p.tier === 'haiku' && p.scenario === 'scenario-2').without, null);
});

test('NO_LIFT flags only the tier where without >= with', () => {
  const input = healthy();
  // haiku regresses: without 2/2, with 0/2
  for (const x of input.runs) {
    if (x.tier !== 'haiku' || x.scenario === 'canary-x') continue;
    x.verdict = x.arm === 'without' ? 'pass' : 'fail';
  }
  const r = tabulate(input);
  const noLift = r.flags.filter((f) => f.code === 'NO_LIFT');
  assert.equal(noLift.length, 1);
  assert.equal(noLift[0].tier, 'haiku');
  assert.equal(noLift[0].deltaPP, -100);
});

test('NO_LIFT also fires on a tie (equal pass counts is not evidence of benefit)', () => {
  const input = healthy();
  for (const x of input.runs) if (x.scenario !== 'canary-x') x.verdict = 'pass';
  const r = tabulate(input);
  assert.equal(r.flags.filter((f) => f.code === 'NO_LIFT').length, 2);
  assert.equal(r.tiers.every((t) => t.deltaPP === 0), true);
});

test('NO_VARIANCE when every run in the batch passed', () => {
  const input = healthy();
  for (const x of input.runs) x.verdict = 'pass';
  const r = tabulate(input);
  assert.ok(has(r, 'NO_VARIANCE'));
});

test('JUDGE_DISAGREEMENT when a dimension abstains but the run was scored', () => {
  const input = healthy();
  const target = input.runs.find((x) => x.tier === 'sonnet' && x.scenario === 'scenario-1' && x.arm === 'with');
  target.dimensions = { 'root-cause': 'pass', evidence: 'unknown' };
  const r = tabulate(input);
  assert.ok(has(r, 'JUDGE_DISAGREEMENT'));
  assert.deepEqual(r.disagreements[0].dimensions, ['evidence']);
  assert.match(r.disagreements[0].reason, /abstained/);
});

test('JUDGE_DISAGREEMENT when a dimension fails but the run passed', () => {
  const input = healthy();
  const target = input.runs.find((x) => x.arm === 'with');
  target.dimensions = { 'root-cause': 'fail', evidence: 'pass' };
  const r = tabulate(input);
  assert.deepEqual(r.disagreements[0].dimensions, ['root-cause']);
});

test('JUDGE_DISAGREEMENT when every dimension passed but the run failed', () => {
  const input = healthy();
  const target = input.runs.find((x) => x.arm === 'without');
  target.dimensions = { 'root-cause': 'pass', evidence: 'pass' };
  const r = tabulate(input);
  assert.equal(r.disagreements.length, 1);
  assert.match(r.disagreements[0].reason, /every dimension passed/);
});

test('a run with dimensions consistent with its verdict raises nothing', () => {
  const input = healthy();
  input.runs.find((x) => x.arm === 'with').dimensions = { 'root-cause': 'pass', evidence: 'pass' };
  input.runs.find((x) => x.arm === 'without').dimensions = { 'root-cause': 'fail', evidence: 'pass' };
  assert.deepEqual(tabulate(input).flags, []);
});

test('unknown verdicts are counted, never folded into pass or fail', () => {
  const input = healthy();
  input.runs.find((x) => x.tier === 'sonnet' && x.scenario === 'scenario-1' && x.arm === 'with').verdict = 'unknown';
  const r = tabulate(input);
  const sonnet = r.tiers.find((t) => t.tier === 'sonnet');
  assert.equal(sonnet.unknowns, 1);
  assert.equal(sonnet.withPass, 1);
  assert.equal(sonnet.withTotal, 2);
  assert.equal(sonnet.withRate, 50);
});

test('malformed input is rejected rather than silently tabulated', () => {
  assert.throws(() => tabulate(null), /must be a JSON object/);
  assert.throws(() => tabulate({ runs: [] }), /non-empty array/);
  assert.throws(() => tabulate({ runs: [{ tier: 'a', scenario: 'b', arm: 'with' }] }), /verdict/);
  assert.throws(() => tabulate({ runs: [run('a', 'b', 'both', 'pass')] }), /arm must be/);
  assert.throws(() => tabulate({ runs: [run('a', 'b', 'with', 'maybe')] }), /verdict must be/);
  assert.throws(
    () => tabulate({ runs: [run('a', 'b', 'with', 'pass'), run('a', 'b', 'with', 'fail')] }),
    /duplicate run/,
  );
});

test('fixture: all-clean date-safety batch is caught by canary + variance flags', () => {
  const r = tabulate(load('date-safety-runs.json'));
  assert.ok(has(r, 'CANARY_PASSED'));
  assert.ok(has(r, 'NO_VARIANCE'));
  assert.equal(r.flags.filter((f) => f.code === 'NO_LIFT').length, 2);
  assert.equal(r.shipDecisionSupported, false);
});

test('fixture: cache-guard tier split flags haiku only, canary alive, judge disagreements found', () => {
  const r = tabulate(load('cache-guard-runs.json'));
  assert.equal(r.canary.alive, true);
  const noLift = r.flags.filter((f) => f.code === 'NO_LIFT');
  assert.equal(noLift.length, 1);
  assert.equal(noLift[0].tier, 'haiku');
  const sonnet = r.tiers.find((t) => t.tier === 'sonnet');
  const haiku = r.tiers.find((t) => t.tier === 'haiku');
  assert.equal(sonnet.deltaPP, 100);
  assert.ok(haiku.deltaPP < 0);
  assert.equal(r.disagreements.length, 2);
  assert.ok(!has(r, 'NO_VARIANCE'));
});

test('pooling the tiers would have hidden the haiku regression', () => {
  const r = tabulate(load('cache-guard-runs.json'));
  const sum = (k) => r.tiers.reduce((a, t) => a + t[k], 0);
  assert.equal(sum('withPass'), 4);
  assert.equal(sum('withoutPass'), 2);
  // Pooled the batch reads +33.3pp; per tier it is +100 and a regression.
  assert.ok(r.flags.some((f) => f.code === 'NO_LIFT' && f.tier === 'haiku'));
});

test('markdown renders the paired table, deltas, canary line and flags', () => {
  const md = toMarkdown(tabulate(load('cache-guard-runs.json')));
  assert.match(md, /\| Tier \| Scenario \| Without skill \| With skill \|/);
  assert.match(md, /\| sonnet \| scenario-1 \| fail \| pass \|/);
  assert.match(md, /### Per-tier delta/);
  assert.match(md, /failed as designed/);
  assert.match(md, /\*\*NO_LIFT\*\*/);
});

test('markdown states the no-flag case explicitly', () => {
  const md = toMarkdown(tabulate(healthy()));
  assert.match(md, /None\. No blocking flag stands/);
  assert.match(md, /None\./);
});

const cliStatus = (args) => {
  try {
    return { status: 0, stdout: execFileSync('node', [script, ...args], { stdio: 'pipe' }).toString() };
  } catch (e) {
    return { status: e.status, stdout: (e.stdout ?? '').toString(), stderr: (e.stderr ?? '').toString() };
  }
};

test('CLI exits 0 on a healthy batch and prints markdown with --md', () => {
  const tmp = path.join(mkdtempSync(path.join(tmpdir(), 'paired-table-')), 'healthy.json');
  writeFileSync(tmp, JSON.stringify(healthy()));
  const r = cliStatus([tmp, '--md']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /### Per-tier delta/);
});

test('CLI exits 1 when a flag is raised, and 2 on unreadable input', () => {
  assert.equal(cliStatus([path.join(fixtures, 'cache-guard-runs.json')]).status, 1);
  assert.equal(cliStatus([path.join(fixtures, 'does-not-exist.json')]).status, 2);
  assert.equal(cliStatus([]).status, 2);
});

test('FLAG_CODES is the complete published flag vocabulary', () => {
  assert.deepEqual([...FLAG_CODES].sort(), [
    'CANARY_MISSING',
    'CANARY_PASSED',
    'JUDGE_DISAGREEMENT',
    'NO_LIFT',
    'NO_VARIANCE',
    'PAIR_INCOMPLETE',
    'SINGLE_TIER',
  ]);
});
