// This is NOT a new 300-line workflow script. It is the exact invocation of the existing
// universal runner (agent-swarm's workflows/swarm.mjs) with this migration's spec.
// The only thing authored for this purpose is .soltero/swarm/legacyfetch-migration.json —
// which is itself copied near-verbatim from the worked "transform" example already checked
// into skills/agent-swarm/references/spec-format.md (that file ships a legacyFetch→httpClient
// spec as its reference example for exactly this shape).
//
// Gate already run and passed (see swarm/plan.md for full output):
//   $ node ${CLAUDE_SKILL_DIR}/scripts/swarm-plan.mjs .soltero/swarm/legacyfetch-migration.json
//   VERDICT: DISPATCHABLE (mode: workflow)
//   agents: 5 (ceiling 8)
//   by tier: opus=4 sonnet=1 haiku=0
//   by stage: scout=0 lanes=4 verify=0 synth=1
//   relative cost units: 21 (ceiling 30)
//
// The actual dispatch (NOT executed — per task instructions this run is not invoked):

import { readFileSync } from 'node:fs'

const CLAUDE_SKILL_DIR = '/Users/franciscosoltero/Desktop/Code/soltero-skills/skills/agent-swarm'
const root = '/tmp/ab-agent-swarm/ws-03'

const spec = JSON.parse(
  readFileSync(`${root}/.soltero/swarm/legacyfetch-migration.json`, 'utf8')
)

// This is the literal call — the Workflow tool, not a bespoke script — that would run the swarm:
//
// Workflow({
//   scriptPath: `${CLAUDE_SKILL_DIR}/workflows/swarm.mjs`,
//   args: {
//     spec,                    // parsed above, items already arrays (4 write-scopes)
//     root,                    // absolute path of the tree the writer agents operate in
//     date: '2026-09-02',      // from `date +%F`
//   },
// })
//
// spec.lanes[0] dispatches 4 agents, one per write-scope, model: "opus", serial: true:
//   1. item: "src/account"   (10 files: account1.js..account10.js)
//   2. item: "src/cart"      (10 files: cart1.js..cart10.js)
//   3. item: "src/catalog"   (10 files: catalog1.js..catalog10.js)
//   4. item: "src/checkout"  (10 files: checkout1.js..checkout10.js)
// Each writer, in turn (serial: true — the runner does not start scope N+1 until scope N
// returns), inside its own scope only:
//   - rewrites every `legacyFetch(url)` call site to `httpClient.get(url)` per the rule in
//     the lane prompt (derived from the actual call shape observed in this repo — see
//     swarm/plan.md "Migration rule" for the exact before/after)
//   - drops the now-dead `import { legacyFetch } ...` line
//   - runs `node --check` on every file it touched
//   - runs `npm test` from {root}
//   - returns a "result" schema object: { status: DONE | DONE_WITH_CONCERNS, summary, evidence }
//
// spec.synth dispatches 1 agent, model: "sonnet", after all 4 writers return:
//   - reads all 4 "result" objects
//   - writes swarm/legacyfetch-migration-2026-09-02.md listing any non-DONE scope first with
//     its concern, then the DONE scopes with their npm test evidence line, plus a migrated
//     vs. left-untouched call-site count
//   - the run returns { outputPath, summary, agentsSpent: {opus:4, sonnet:1}, byTier, dropped: [] }

console.log('This file documents the run; it is not executed by this task.')
