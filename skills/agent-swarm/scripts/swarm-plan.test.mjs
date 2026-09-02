import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { planSwarm, formatReport, TIERS, DEFAULT_WEIGHTS } from './swarm-plan.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'swarm-plan.mjs');

function findSpec(overrides = {}) {
  return {
    name: 'pii-sweep',
    shape: 'find',
    goal: 'Find PII returned without redact()',
    ceiling: { agents: 40 },
    scout: null,
    lanes: [
      {
        key: 'find-pii',
        model: 'sonnet',
        effort: 'low',
        prompt: 'Inspect {item} for PII returned without redact().',
        items: ['src/routes/route1.js', 'src/routes/route2.js', 'src/routes/route3.js', 'src/routes/route4.js'],
        schema: 'findings',
      },
    ],
    verify: { model: 'sonnet', lenses: 1, escalate: { severities: ['high', 'critical'], lenses: 3 } },
    synth: { model: 'opus', outputPath: 'Docs/swarm-pii-2026-09-02.md' },
    ...overrides,
  };
}

function codes(result) {
  return result.errors.map((e) => e.code);
}
function warnCodes(result) {
  return result.warnings.map((w) => w.code);
}

test('a valid find spec is dispatchable with tier counts and workflow mode', () => {
  const r = planSwarm(findSpec());
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, []);
  assert.equal(r.mode, 'workflow');
  // 4 finders + verify (4 findings × 1 lens + ceil(4×0.25)=1 escalated × 2 extra lenses) + 1 synth
  assert.equal(r.counts.byStage.scout, 0);
  assert.equal(r.counts.byStage.lanes, 4);
  assert.equal(r.counts.byStage.verify, 4 + 1 * 2);
  assert.equal(r.counts.byStage.synth, 1);
  assert.equal(r.counts.total, 4 + 6 + 1);
  assert.equal(r.counts.byTier.sonnet, 10);
  assert.equal(r.counts.byTier.opus, 1);
  assert.equal(r.counts.byTier.haiku, 0);
});

test('relative cost units use the default weights unless the spec overrides them', () => {
  const r = planSwarm(findSpec());
  const expected = 10 * DEFAULT_WEIGHTS.sonnet + 1 * DEFAULT_WEIGHTS.opus;
  assert.equal(r.units, Number(expected.toFixed(2)));
  const r2 = planSwarm(findSpec({ weights: { opus: 10, sonnet: 2, haiku: 1 } }));
  assert.equal(r2.units, 10 * 2 + 1 * 10);
});

test('a lane with no model is MODEL_MISSING; the orchestrator tier is MODEL_FORBIDDEN', () => {
  const noModel = findSpec();
  delete noModel.lanes[0].model;
  const r1 = planSwarm(noModel);
  assert.equal(r1.ok, false);
  assert.ok(codes(r1).includes('MODEL_MISSING'), codes(r1).join());
  assert.match(r1.errors.find((e) => e.code === 'MODEL_MISSING').where, /lanes\[0\]/);

  const fable = findSpec({ synth: { model: 'fable', outputPath: 'Docs/x.md' } });
  const r2 = planSwarm(fable);
  assert.ok(codes(r2).includes('MODEL_FORBIDDEN'));
  assert.match(r2.errors.find((e) => e.code === 'MODEL_FORBIDDEN').where, /synth/);

  const unknown = findSpec({ verify: { model: 'gpt-9', lenses: 1 } });
  assert.ok(codes(planSwarm(unknown)).includes('MODEL_FORBIDDEN'));
});

test('every dispatch site is checked for a model: scout, lanes, verify, synth', () => {
  const spec = findSpec({ scout: { prompt: 'list the route files' } });
  const r = planSwarm(spec);
  assert.ok(r.errors.some((e) => e.code === 'MODEL_MISSING' && /scout/.test(e.where)));
});

test('a missing or non-positive ceiling is CEILING_MISSING; exceeding it is OVER_CEILING', () => {
  assert.ok(codes(planSwarm(findSpec({ ceiling: undefined }))).includes('CEILING_MISSING'));
  assert.ok(codes(planSwarm(findSpec({ ceiling: { agents: 0 } }))).includes('CEILING_MISSING'));
  const r = planSwarm(findSpec({ ceiling: { agents: 5 } }));
  assert.ok(codes(r).includes('OVER_CEILING'));
  assert.match(r.errors.find((e) => e.code === 'OVER_CEILING').message, /11 > 5/);
});

test('a loop must declare maxRounds between 1 and 5, and rounds multiply the lane count', () => {
  assert.ok(codes(planSwarm(findSpec({ loop: {} }))).includes('LOOP_UNCAPPED'));
  assert.ok(codes(planSwarm(findSpec({ loop: { maxRounds: 50 } }))).includes('LOOP_UNCAPPED'));
  const r = planSwarm(findSpec({ loop: { maxRounds: 2 }, ceiling: { agents: 100 } }));
  assert.equal(r.ok, true);
  assert.equal(r.counts.byStage.lanes, 8);
});

test('synthesis to a file is required', () => {
  assert.ok(codes(planSwarm(findSpec({ synth: null }))).includes('SYNTH_MISSING'));
  assert.ok(codes(planSwarm(findSpec({ synth: { model: 'opus' } }))).includes('SYNTH_MISSING'));
});

test('a multi-item lane prompt must carry the {item} placeholder', () => {
  const spec = findSpec();
  spec.lanes[0].prompt = 'Inspect the routes for PII.';
  assert.ok(codes(planSwarm(spec)).includes('ITEM_PLACEHOLDER_MISSING'));
  spec.lanes[0].items = ['src/routes/route1.js'];
  assert.ok(!codes(planSwarm(spec)).includes('ITEM_PLACEHOLDER_MISSING'));
});

test('items may be an array, a count, or "scout" with an expectedItems estimate', () => {
  const counted = findSpec();
  counted.lanes[0].items = 6;
  assert.equal(planSwarm(counted).counts.byStage.lanes, 6);

  const scouted = findSpec({ scout: { model: 'haiku', prompt: 'list files' } });
  scouted.lanes[0].items = 'scout';
  const r1 = planSwarm(scouted);
  assert.ok(codes(r1).includes('ITEMS_UNKNOWN'));
  scouted.lanes[0].expectedItems = 12;
  const r2 = planSwarm(scouted);
  assert.ok(!codes(r2).includes('ITEMS_UNKNOWN'));
  assert.equal(r2.counts.byStage.scout, 1);
  assert.equal(r2.counts.byStage.lanes, 12);

  const noScout = findSpec();
  noScout.lanes[0].items = 'scout';
  noScout.lanes[0].expectedItems = 3;
  assert.ok(codes(planSwarm(noScout)).includes('ITEMS_UNKNOWN'));
});

test('writing lanes must be isolated or serial, and never share an item', () => {
  const spec = findSpec({ shape: 'transform', verify: null });
  spec.lanes[0].schema = 'result';
  spec.lanes[0].writes = true;
  assert.ok(codes(planSwarm(spec)).includes('WRITER_UNISOLATED'));
  spec.lanes[0].isolation = 'worktree';
  assert.ok(!codes(planSwarm(spec)).includes('WRITER_UNISOLATED'));
  delete spec.lanes[0].isolation;
  spec.lanes[0].serial = true;
  assert.ok(!codes(planSwarm(spec)).includes('WRITER_UNISOLATED'));

  spec.lanes.push({ ...spec.lanes[0], key: 'second', items: ['src/routes/route2.js', 'src/other.js'] });
  const r = planSwarm(spec);
  assert.ok(codes(r).includes('WRITER_OVERLAP'));
  assert.match(r.errors.find((e) => e.code === 'WRITER_OVERLAP').message, /route2\.js/);
});

test('a findings lane with no verify stage is FINDINGS_UNVERIFIED; result lanes need none', () => {
  assert.ok(codes(planSwarm(findSpec({ verify: null }))).includes('FINDINGS_UNVERIFIED'));
  const spec = findSpec({ verify: null, shape: 'understand' });
  spec.lanes[0].schema = 'result';
  assert.ok(!codes(planSwarm(spec)).includes('FINDINGS_UNVERIFIED'));
});

test('a fan-out of three or fewer agents recommends the Agent tool, not a Workflow', () => {
  const spec = findSpec({ verify: null, shape: 'understand' });
  spec.lanes[0].schema = 'result';
  spec.lanes[0].items = ['a.js', 'b.js'];
  const r = planSwarm(spec);
  assert.equal(r.ok, true);
  assert.equal(r.mode, 'agents');
  assert.ok(warnCodes(r).includes('SMALL_FANOUT'));
});

test('a flat three-lens panel with no severity escalation warns VERIFY_FLAT', () => {
  const r = planSwarm(findSpec({ verify: { model: 'sonnet', lenses: 3 }, ceiling: { agents: 100 } }));
  assert.equal(r.ok, true);
  assert.ok(warnCodes(r).includes('VERIFY_FLAT'));
  assert.equal(r.counts.byStage.verify, 12);
});

test('high effort on a wide lane warns EFFORT_HIGH_ON_FANOUT', () => {
  const spec = findSpec({ ceiling: { agents: 100 } });
  spec.lanes[0].effort = 'xhigh';
  spec.lanes[0].items = 8;
  assert.ok(warnCodes(planSwarm(spec)).includes('EFFORT_HIGH_ON_FANOUT'));
});

test('a writing lane wider than ten items warns WIDE_WRITE_LANE', () => {
  const spec = findSpec({ verify: null, shape: 'transform', ceiling: { agents: 100 } });
  spec.lanes[0].schema = 'result';
  spec.lanes[0].writes = true;
  spec.lanes[0].serial = true;
  spec.lanes[0].items = Array.from({ length: 40 }, (_, i) => `src/f${i}.js`);
  const r = planSwarm(spec);
  assert.equal(r.ok, true);
  assert.ok(warnCodes(r).includes('WIDE_WRITE_LANE'));
  spec.lanes[0].items = ['src/cart', 'src/catalog', 'src/checkout', 'src/account'];
  assert.ok(!warnCodes(planSwarm(spec)).includes('WIDE_WRITE_LANE'));
});

test('verify.expectedPatterns bounds how many findings escalate to the wide panel', () => {
  // 8 findings, all high: default escalation share → 2 escalated; expectedPatterns 1 → 1 escalated
  const spec = findSpec({ verify: { model: 'sonnet', lenses: 1, escalate: { severities: ['high'], lenses: 3, expected: 8 }, expectedFindings: 8 } });
  assert.equal(planSwarm(spec).counts.byStage.verify, 8 + 8 * 2);
  spec.verify.expectedPatterns = 1;
  assert.equal(planSwarm(spec).counts.byStage.verify, 8 + 1 * 2);
});

test('ceiling.units is an optional second ceiling on relative cost', () => {
  const r = planSwarm(findSpec({ ceiling: { agents: 40, units: 10 } }));
  assert.ok(codes(r).includes('OVER_UNITS'));
  assert.match(formatReport(r), /relative cost units: 15 \(ceiling 10\)/);
  assert.equal(planSwarm(findSpec({ ceiling: { agents: 40, units: 20 } })).ok, true);
});

test('verify.expectedFindings overrides the one-finding-per-item default', () => {
  const r = planSwarm(findSpec({ verify: { model: 'haiku', lenses: 1, expectedFindings: 2 } }));
  assert.equal(r.counts.byStage.verify, 2);
  assert.equal(r.counts.byTier.haiku, 2);
});

test('a malformed spec is reported, not thrown', () => {
  const r = planSwarm({ name: 'x' });
  assert.equal(r.ok, false);
  assert.ok(codes(r).includes('SPEC_MALFORMED'));
  assert.equal(planSwarm(null).ok, false);
});

test('TIERS excludes the orchestrator tier', () => {
  assert.deepEqual(TIERS, ['opus', 'sonnet', 'haiku']);
});

test('formatReport lists counts, errors and warnings in fixed lines', () => {
  const text = formatReport(planSwarm(findSpec({ ceiling: { agents: 5 } })));
  assert.match(text, /^VERDICT: NOT DISPATCHABLE/m);
  assert.match(text, /agents: 11 \(ceiling 5\)/);
  assert.match(text, /opus=1 sonnet=10 haiku=0/);
  assert.match(text, /OVER_CEILING/);
  const ok = formatReport(planSwarm(findSpec()));
  assert.match(ok, /^VERDICT: DISPATCHABLE \(mode: workflow\)/m);
});

test('CLI: exit 0 on a dispatchable spec, 1 on violations, 2 on unreadable or malformed input', () => {
  const dir = mkdtempSync(join(tmpdir(), 'swarm-plan-'));
  const good = join(dir, 'good.json');
  const bad = join(dir, 'bad.json');
  const junk = join(dir, 'junk.json');
  writeFileSync(good, JSON.stringify(findSpec()));
  writeFileSync(bad, JSON.stringify(findSpec({ ceiling: { agents: 2 } })));
  writeFileSync(junk, '{ not json');

  const r0 = spawnSync(process.execPath, [script, good], { encoding: 'utf8' });
  assert.equal(r0.status, 0, r0.stderr);
  assert.match(r0.stdout, /DISPATCHABLE/);

  const rj = spawnSync(process.execPath, [script, good, '--json'], { encoding: 'utf8' });
  assert.equal(rj.status, 0);
  const parsed = JSON.parse(rj.stdout);
  assert.equal(parsed.counts.total, 11);

  const r1 = spawnSync(process.execPath, [script, bad], { encoding: 'utf8' });
  assert.equal(r1.status, 1);
  assert.match(r1.stdout + r1.stderr, /OVER_CEILING/);

  const r2 = spawnSync(process.execPath, [script, junk], { encoding: 'utf8' });
  assert.equal(r2.status, 2);

  const r3 = spawnSync(process.execPath, [script, join(dir, 'missing.json')], { encoding: 'utf8' });
  assert.equal(r3.status, 2);

  const r4 = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(r4.status, 2);
});

test('CLI still runs when invoked through a symlinked path (macOS /tmp → /private/tmp)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'swarm-plan-link-'));
  const link = join(dir, 'scripts-link');
  symlinkSync(here, link);
  const bad = join(dir, 'bad.json');
  writeFileSync(bad, JSON.stringify(findSpec({ ceiling: { agents: 2 } })));
  const r = spawnSync(process.execPath, [join(link, 'swarm-plan.mjs'), bad], { encoding: 'utf8' });
  assert.equal(r.status, 1, 'a failing spec must exit 1 even via a symlinked script path');
  assert.match(r.stdout, /OVER_CEILING/);
});
