// run.mjs — the exact Workflow invocation for the reconcile-drift swarm.
//
// This is NOT a new workflow script. It is a record of the Workflow tool call this session
// would make, using the agent-swarm skill's universal runner unmodified:
//
//   ${CLAUDE_SKILL_DIR}/workflows/swarm.mjs
//   where CLAUDE_SKILL_DIR = /Users/franciscosoltero/Desktop/Code/soltero-skills/skills/agent-swarm
//
// Spec source: ./reconcile-drift.json (already gated — see plan.md for the swarm-plan.mjs
// verdict this spec produced before this call would be made).
//
// The call this session would issue, verbatim:
//
// Workflow({
//   scriptPath: "/Users/franciscosoltero/Desktop/Code/soltero-skills/skills/agent-swarm/workflows/swarm.mjs",
//   args: {
//     spec: /* contents of ./reconcile-drift.json, parsed, items already arrays */ {
//       "name": "reconcile-drift",
//       "shape": "find",
//       "goal": "Find where the nightly reconcile job's few-cents-per-night drift against the ledger comes from",
//       "ceiling": { "agents": 25, "units": 40 },
//       "scout": null,
//       "lanes": [
//         {
//           "key": "inspect",
//           "model": "sonnet",
//           "effort": "low",
//           "prompt": "Inspect {item} as part of the money path invoice -> reconcile -> ledger in this billing service (root {root}). Report every place this file could cause a small (1-5 cent) per-run drift between the computed total and what actually gets posted/logged: rounding/truncation/floor-division, remainder handling, off-by-one splits, type coercion, or a mismatch between what is computed and what is logged/posted. Quote the exact line. If this file is clean, say so plainly — do not invent a finding.",
//           "items": [
//             "src/jobs/reconcile.js",
//             "src/ledger/write.js",
//             "src/lib/money.js",
//             "bin/nightly.sh",
//             "var/log/reconcile.log"
//           ],
//           "schema": "findings",
//           "writes": false
//         }
//       ],
//       "verify": {
//         "model": "sonnet",
//         "lenses": 1,
//         "escalate": { "severities": ["high", "critical"], "lenses": 3 },
//         "expectedFindings": 5,
//         "expectedPatterns": 2,
//         "panelPerFinding": false
//       },
//       "synth": {
//         "model": "opus",
//         "outputPath": "swarm/reconcile-drift-report-{date}.md",
//         "prompt": "State the single most likely root cause of the drift first, with the exact line and a one-line proof (e.g. reconstruct one night's drift number from the code). Then list any secondary/contributing findings. Then a recommended fix. Note any file inspected that turned up nothing."
//       },
//       "loop": { "maxRounds": 1 }
//     },
//     root: "/tmp/ab-agent-swarm/ws-05",
//     date: "2026-09-02"
//   }
// })
//
// Per the task instructions for this run, the Workflow tool is NOT invoked. This file records
// the exact call that would be made, so the run is reproducible without re-deriving it.
