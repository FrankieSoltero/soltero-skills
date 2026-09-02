// Executes ../workflows/swarm.mjs under stubbed Workflow-tool globals (agent, parallel,
// pipeline, phase, log, args) to check the behavior the skill relies on: every dispatch names
// a standard tier, the ceiling drops (and reports) excess dispatches, severity escalation
// widens the panel only where declared, serial writer lanes run one at a time, and {item}
// templating reaches the prompts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'workflows', 'swarm.mjs'), 'utf8');

function runWorkflow(args, behavior = {}) {
  const calls = [];
  const logs = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const agent = async (prompt, opts = {}) => {
    calls.push({ prompt, opts });
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 2));
    inFlight--;
    const label = opts.label || '';
    if (behavior.respond) {
      const custom = behavior.respond(prompt, opts);
      if (custom !== undefined) return custom;
    }
    if (label === 'scout') return { items: behavior.scoutItems || ['a.js', 'b.js'], summary: 'scouted' };
    if (label.startsWith('verify:')) return { refuted: false, reasoning: 'stands' };
    if (label === 'synthesize') return { outputPath: 'Docs/out.md', summary: 'written' };
    if (opts.schema && opts.schema.properties && opts.schema.properties.findings) {
      const item = prompt.match(/ITEM=(\S+)/)?.[1] || 'x';
      const sev = (behavior.severityFor && behavior.severityFor(item)) || 'low';
      return { findings: [{ ref: `${item}:1`, severity: sev, title: `finding in ${item}`, evidence: 'quoted' }] };
    }
    return { item: 'x', status: 'DONE', summary: 'ok', evidence: ['npm test → 1 passing'] };
  };
  const parallel = (thunks) => Promise.all(thunks.map((t) => Promise.resolve().then(t).catch(() => null)));
  const pipeline = async (items, ...stages) => Promise.all(items.map(async (it, i) => {
    let v = it;
    for (const s of stages) v = await s(v, it, i);
    return v;
  }));
  const context = vm.createContext({ args, agent, parallel, pipeline, phase: () => {}, log: (m) => logs.push(m), budget: { total: null, spent: () => 0, remaining: () => Infinity }, console, setTimeout, JSON, Math, Number, String, Array, Set, Map, Promise, Error, Infinity });
  const wrapped = '(async () => {\n' + source.replace(/^export /gm, '') + '\n})()';
  const script = new vm.Script(wrapped, { filename: 'swarm-wrapped.js' });
  return script.runInContext(context).then((result) => ({ result, calls, logs, maxInFlight }));
}

function spec(overrides = {}) {
  return {
    name: 'demo',
    shape: 'find',
    goal: 'demo goal',
    ceiling: { agents: 50 },
    scout: null,
    lanes: [{ key: 'find', model: 'sonnet', schema: 'findings', prompt: 'Look at ITEM={item} for problems.', items: ['a.js', 'b.js', 'c.js'] }],
    verify: { model: 'haiku', lenses: 1, escalate: { severities: ['high', 'critical'], lenses: 3 } },
    synth: { model: 'opus', outputPath: 'Docs/swarm-{name}-{date}.md' },
    ...overrides,
  };
}

test('every dispatch names a standard tier and the return accounts for them', async () => {
  const { result, calls } = await runWorkflow({ spec: spec(), root: '/tmp/x', date: '2026-09-02' });
  assert.ok(calls.length > 0);
  for (const c of calls) assert.ok(['opus', 'sonnet', 'haiku'].includes(c.opts.model), `${c.opts.label} model=${c.opts.model}`);
  // 3 finders + 3 single-lens verifies + 1 synth
  assert.equal(result.agentsSpent, 7);
  assert.deepEqual(JSON.parse(JSON.stringify(result.byTier)), { opus: 1, sonnet: 3, haiku: 3 });
  assert.equal(result.outputPath, 'Docs/out.md');
  assert.equal(result.confirmedCount, 3);
  assert.equal(result.dropped.length, 0);
  assert.match(calls.find((c) => c.opts.label === 'synthesize').prompt, /Docs\/swarm-demo-2026-09-02\.md/);
});

test('{item} templating reaches each fan-out prompt', async () => {
  const { calls } = await runWorkflow({ spec: spec(), root: '/tmp/x', date: '2026-09-02' });
  const finders = calls.filter((c) => c.opts.phase === 'Fan-out');
  assert.deepEqual(finders.map((c) => c.prompt.match(/ITEM=(\S+)/)[1]).sort(), ['a.js', 'b.js', 'c.js']);
  assert.ok(finders.every((c) => c.prompt.includes('/tmp/x')));
});

test('the ceiling drops excess dispatches and the summary says so', async () => {
  const { result, calls, logs } = await runWorkflow({ spec: spec({ ceiling: { agents: 4 } }), root: '/tmp/x', date: '2026-09-02' });
  assert.equal(calls.length, 4);
  assert.equal(result.agentsSpent, 4);
  assert.ok(result.dropped.length >= 1, 'dropped list must name what was not run');
  assert.ok(logs.some((l) => /Ceiling reached/.test(l)));
  // synth was dropped at the ceiling → fallback return carries the data and the partial flag
  assert.equal(result.outputPath, null);
  assert.match(result.summary, /PARTIAL COVERAGE/);
});

test('an unpinned or orchestrator-tier model throws before any dispatch', async () => {
  const bad = spec();
  bad.lanes[0].model = 'fable';
  await assert.rejects(runWorkflow({ spec: bad, root: '/tmp/x' }), /never the orchestrator tier/);
  const missing = spec({ synth: { outputPath: 'Docs/x.md' } });
  await assert.rejects(runWorkflow({ spec: missing, root: '/tmp/x' }), /synth/);
  const noCeiling = spec({ ceiling: undefined });
  await assert.rejects(runWorkflow({ spec: noCeiling, root: '/tmp/x' }), /ceiling/);
});

test('severity escalation widens the panel only for the declared severities', async () => {
  const { calls, result } = await runWorkflow(
    { spec: spec(), root: '/tmp/x', date: '2026-09-02' },
    { severityFor: (item) => (item === 'a.js' ? 'high' : 'low') }
  );
  const verifies = calls.filter((c) => c.opts.phase === 'Verify');
  const forA = verifies.filter((c) => c.prompt.includes('a.js:1')).length;
  const forB = verifies.filter((c) => c.prompt.includes('b.js:1')).length;
  assert.equal(forA, 3);
  assert.equal(forB, 1);
  assert.equal(result.agentsSpent, 3 + 3 + 1 + 1 + 1);
});

test('the escalated panel runs once per distinct finding title; repeats of the pattern get the base panel', async () => {
  const s = spec({ lanes: [{ key: 'find', model: 'sonnet', schema: 'findings', prompt: 'Look at ITEM={item} now.', items: ['a.js', 'b.js', 'c.js', 'd.js'] }] });
  const { calls, result } = await runWorkflow(
    { spec: s, root: '/tmp/x', date: '2026-09-02' },
    {
      severityFor: () => 'high',
      respond: (prompt, opts) => {
        if (opts.phase !== 'Fan-out') return undefined;
        const item = prompt.match(/ITEM=(\S+)/)[1];
        // a, b, c share one pattern title; d is a distinct pattern
        const title = item === 'd.js' ? 'distinct leak' : 'raw customer object in res.json';
        return { findings: [{ ref: `${item}:1`, severity: 'high', title, evidence: 'q' }] };
      },
    }
  );
  const verifies = calls.filter((c) => c.opts.phase === 'Verify');
  // pattern 1: 3 lenses once + 1 lens × 2 repeats; pattern 2: 3 lenses → 8
  assert.equal(verifies.length, 3 + 1 + 1 + 3);
  assert.equal(result.confirmedCount, 4);

  const every = spec({ verify: { model: 'haiku', lenses: 1, escalate: { severities: ['high'], lenses: 3 }, panelPerFinding: true }, lanes: s.lanes });
  const r2 = await runWorkflow({ spec: every, root: '/tmp/x' }, { severityFor: () => 'high', respond: (prompt, opts) => {
    if (opts.phase !== 'Fan-out') return undefined;
    const item = prompt.match(/ITEM=(\S+)/)[1];
    return { findings: [{ ref: `${item}:1`, severity: 'high', title: 'same', evidence: 'q' }] };
  } });
  assert.equal(r2.calls.filter((c) => c.opts.phase === 'Verify').length, 12);
});

test('a majority of refutations kills a finding; a single-lens refutation kills it too', async () => {
  const { result } = await runWorkflow(
    { spec: spec(), root: '/tmp/x', date: '2026-09-02' },
    {
      severityFor: (item) => (item === 'a.js' ? 'high' : 'low'),
      respond: (prompt, opts) => {
        if (!(opts.label || '').startsWith('verify:')) return undefined;
        if (prompt.includes('a.js:1')) return { refuted: !opts.label.includes('impact'), reasoning: 'x' }; // 2 of 3 refute
        if (prompt.includes('b.js:1')) return { refuted: true, reasoning: 'x' };
        return { refuted: false, reasoning: 'stands' };
      },
    }
  );
  assert.equal(result.confirmedCount, 1);
  assert.equal(result.refutedCount, 2);
});

test('a serial writer lane runs one item at a time; an isolated lane passes isolation through', async () => {
  const serial = spec({ verify: null, lanes: [{ key: 'w', model: 'opus', schema: 'result', writes: true, serial: true, prompt: 'Edit ITEM={item}.', items: ['a.js', 'b.js', 'c.js'] }] });
  const s = await runWorkflow({ spec: serial, root: '/tmp/x' });
  assert.equal(s.maxInFlight, 1);
  assert.equal(s.result.resultCount, 3);

  const iso = spec({ verify: null, lanes: [{ key: 'w', model: 'opus', schema: 'result', writes: true, isolation: 'worktree', prompt: 'Edit ITEM={item}.', items: ['a.js', 'b.js'] }] });
  const r = await runWorkflow({ spec: iso, root: '/tmp/x' });
  const writers = r.calls.filter((c) => c.opts.phase === 'Fan-out');
  assert.ok(writers.every((c) => c.opts.isolation === 'worktree'));
  assert.ok(r.maxInFlight >= 2);
});

test('scout items feed a lane and maxItems caps them with a logged drop', async () => {
  const s = spec({ scout: { model: 'haiku', prompt: 'list files' }, lanes: [{ key: 'find', model: 'sonnet', schema: 'findings', prompt: 'ITEM={item}', items: 'scout', maxItems: 2 }] });
  const { calls, logs, result } = await runWorkflow({ spec: s, root: '/tmp/x' }, { scoutItems: ['a.js', 'b.js', 'c.js', 'd.js'] });
  assert.equal(calls.filter((c) => c.opts.phase === 'Fan-out').length, 2);
  assert.ok(logs.some((l) => /capped to 2/.test(l)));
  assert.equal(result.byTier.haiku, 1 + 2);
});

test('a loop stops on a dry round and never exceeds maxRounds', async () => {
  let round = 0;
  const s = spec({ loop: { maxRounds: 3 }, ceiling: { agents: 100 } });
  const { calls, result } = await runWorkflow(
    { spec: s, root: '/tmp/x' },
    {
      respond: (prompt, opts) => {
        if (opts.phase !== 'Fan-out') return undefined;
        // round 1 finds; round 2 repeats the same keys (dry) → stop before round 3
        const item = prompt.match(/ITEM=(\S+)/)[1];
        return { findings: [{ ref: `${item}:1`, severity: 'low', title: `finding in ${item}`, evidence: 'q' }] };
      },
    }
  );
  const rounds = new Set(calls.filter((c) => c.opts.phase === 'Fan-out').map((c) => c.opts.label.match(/:r(\d)/)?.[1]));
  assert.deepEqual([...rounds].sort(), ['1', '2']);
  assert.equal(result.rounds, 2);
  assert.equal(result.confirmedCount, 3);
  void round;
});
