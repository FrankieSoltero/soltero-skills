// swarm/run.mjs
//
// Orchestration for the "pii-redact-sweep" swarm (find/review shape).
//
// This is deliberately NOT a bespoke Workflow script. Per soltero-skills:agent-swarm's core
// principle ("the swarm is data, not code — a new purpose is a new spec"), writing a fresh
// 200-300 line workflow here — new schemas, new scout, new verify loop, new report prompt —
// would be exactly the anti-pattern the skill exists to stop (the "third migration swarm of
// the month written from scratch"). The skill already ships a universal runner
// (skills/agent-swarm/workflows/swarm.mjs) that implements scout → fan-out → severity-scaled
// verify → synth generically, parameterized entirely by a spec.
//
// The orchestration IS the spec at ../.soltero/swarm/pii-redact-sweep.json, plus the call
// below. This file exists to record, verbatim, the exact Workflow tool invocation the
// orchestrator session makes — nothing here re-implements lanes, verification, or synthesis.
//
// Gate already run before this file was written (see swarm/plan.md for the full printout and
// swarm/plan-verdict.json for the raw output):
//
//   node ${CLAUDE_SKILL_DIR}/scripts/swarm-plan.mjs .soltero/swarm/pii-redact-sweep.json
//   → VERDICT: DISPATCHABLE (mode: workflow)
//     agents: 25 (ceiling 30)
//     by tier: opus=1 sonnet=24 haiku=0
//     by stage: scout=0 lanes=13 verify=11 synth=1
//     relative cost units: 29 (ceiling 40)
//     (zero errors, zero warnings)
//
// Scouting for this run was done inline by the orchestrator (grep/cat, not a scout agent) —
// see swarm/plan.md "How the work-list was built". The full route surface (12 files) and the
// rest of the tree (services/jobs/models/lib) were enumerated before any agent was costed.

import { readFileSync } from 'node:fs';

const specPath = new URL('../.soltero/swarm/pii-redact-sweep.json', import.meta.url);
const spec = JSON.parse(readFileSync(specPath, 'utf8'));

// This is the literal call this session makes to run the swarm. It is NOT executed as part of
// producing this artifact — the task instructions are explicit that no Workflow tool call and
// no Agent dispatch happens in this turn.
export const workflowCall = {
  scriptPath: '${CLAUDE_SKILL_DIR}/workflows/swarm.mjs', // soltero-skills/skills/agent-swarm/workflows/swarm.mjs — the universal runner, unmodified
  args: {
    spec,
    root: '/tmp/ab-agent-swarm/ws-01',
    date: '2026-09-02',
  },
};

// Equivalent to calling, from the orchestrator session:
//
//   Workflow({
//     scriptPath: `${CLAUDE_SKILL_DIR}/workflows/swarm.mjs`,
//     args: {
//       spec: <the object in .soltero/swarm/pii-redact-sweep.json, already planner-validated>,
//       root: "/tmp/ab-agent-swarm/ws-01",
//       date: "2026-09-02",
//     },
//   })
//
// The runner then, entirely from spec data:
//   1. Fan-out: dispatches spec.lanes[0] ("routes-check", sonnet, low effort) once per item —
//      the 12 files in src/routes/ — and spec.lanes[1] ("non-route-sweep", sonnet, low effort)
//      once for its single item (everything outside src/routes/). 13 agents, all sonnet.
//   2. Dedupes findings by ref+title, then runs spec.verify: a 1-lens skeptic pass on every
//      surviving finding, escalated to a 3-lens refute-or-confirm panel for high/critical
//      severities — but only on the FIRST occurrence of each distinct finding title
//      (verify.expectedPatterns: 1), since every expected leak shares one defect pattern
//      ("raw customer object returned without redact()"). Repeats of that title get the base
//      1-lens pass, not another 3-lens vote.
//   3. Synthesize: one opus agent writes spec.synth.outputPath
//      ("Docs/swarm-pii-redact-sweep-2026-09-02.md" under root) and returns its path + summary.
//   4. Every dispatch goes through the runner's ceiling-enforced wrapper: once 30 agents have
//      been spent, further dispatches are dropped and named in `dropped`, and the run's summary
//      is prefixed "PARTIAL COVERAGE" rather than silently reported as complete.
