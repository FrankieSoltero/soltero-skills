# Plan: reconcile-drift swarm

## Skill consulted

`agent-swarm`, loaded from `/Users/franciscosoltero/Desktop/Code/soltero-skills/skills/agent-swarm/SKILL.md`
(handed to me directly in the task, plus its `references/spec-format.md` for the spec schema
and worked examples, which I read at
`/Users/franciscosoltero/Desktop/Code/soltero-skills/skills/agent-swarm/references/spec-format.md`).
No other skill in the standing-rule directory claims "drift investigation across a small
Node service" more specifically — `audit-swarm` is for whole-repo security/legal audits,
`lean-debugging` is the single-agent debugging discipline, not a fan-out. `agent-swarm`'s own
description names exactly this trigger ("throw a bunch of agents at this... run a workflow on
this... swarm it") and the user said "swarmed" twice this week per the task brief, so this is
the skill of record.

## Scouting (done inline, no scout agent)

`find` and `wc -l` over the target tree (commands run this session, not delegated) show the
real money path is four small files plus one log:

- `src/jobs/reconcile.js` (13 lines) — computes drift, calls money helpers, posts to ledger
- `src/ledger/write.js` (4 lines) — posts and balances
- `src/lib/money.js` (4 lines) — `toCents`/`fromCents`/`applyRate`/`split`
- `bin/nightly.sh` (3 lines) — cron wrapper, invoked `5 2 * * *`
- `var/log/reconcile.log` (21 lines) — one drift reading per night, values cycling 1–4 cents

`grep -rn "helper" src/jobs src/ledger bin` and `grep -rln "helper[0-9]" . --include="*.js"`
(both run this session) confirm the eight `src/lib/helper{1..8}.js` files are one-line
identity stubs (`export const helperN = (x) => x;`) that nothing in the reconcile path
imports — they are noise, not part of the "rounding helpers" the user meant, and are excluded
from the work-list rather than turned into eight more agents.

This is the scouting step the skill requires *before* sizing the swarm ("Scout inline first
... A scout agent is for work-lists a command cannot produce; the baselines never needed
one") — no scout agent was dispatched or budgeted.

## Shape and spec

Shape: **find/review** — finders over the five real dimensions the user named (reconcile job,
ledger writes, rounding helpers, cron wrapper, logs), `findings` schema, severity-scaled
verify, one opus report. Spec written to `./reconcile-drift.json` (this directory), per the
skill's "the swarm is data, not code" rule — this is a new spec, not a new script.

Sizing: the user's message carries no explicit budget word ("quick" / "thorough" / a number),
so this falls in the spec-format sizing table's **unmarked** row: ceiling ≤ 25, items = the
inline work-list, escalate high/critical to the 3-lens panel. `ceiling.agents: 25`,
`ceiling.units: 40` were set from that row before any lane ran, not sized to match a result
the run happened to produce.

## Gate result (planner run, no dispatch)

```
$ node /Users/franciscosoltero/Desktop/Code/soltero-skills/skills/agent-swarm/scripts/swarm-plan.mjs swarm/reconcile-drift.json
VERDICT: DISPATCHABLE (mode: workflow)
agents: 15 (ceiling 25)
by tier: opus=1 sonnet=14 haiku=0
by stage: scout=0 lanes=5 verify=9 synth=1
relative cost units: 19 (ceiling 40)
```

This is the number that goes in the headline before any run: **15 agents estimated, ceiling
25, no `SMALL_FANOUT` warning** (the SMALL_FANOUT threshold is 3 agents total — 15 clears it,
so `mode: workflow` is correct and this does not collapse to a handful of direct `Agent`
calls). The estimate assumes ~1 finding per finder item (`verify.expectedFindings: 5`) with
about a quarter escalating to the 3-lens panel — the standard planner assumption, not a number
I chose to hit a target.

## Total agent count and model per dispatch

| Stage | Count | Model | Why this tier |
|---|---|---|---|
| Scout | 0 | — | Work-list came from `find`/`grep` this session; no scout agent needed |
| Fan-out (`inspect` lane) | 5 | **sonnet** | Grunt find-sweep — read one file/dimension, report drift-causing patterns with a quoted line. Not opus: no code is written or judged here, only located |
| Verify (skeptic panel) | up to 9 | **sonnet** (1 lens baseline; 3-lens panel only on findings the finder marks high/critical severity, and only once per distinct finding *title* — repeats of the same title get the base 1-lens pass, not a fresh panel) | Grunt/triage tier; the skill reserves opus for engineering, not for trying to break a finding |
| Synthesis | 1 | **opus** | The one agent that reads every surviving finding and has to reason about which is the actual root cause vs. a red herring, and write the report — the skill's synthesis tier is always opus, pinned, never "inherit" |
| **Total** | **15** | — | opus=1, sonnet=14, haiku=0 — no dispatch site is missing a model, and none runs on the orchestrator tier (this session's own tier), per the planner's `MODEL_MISSING`/`MODEL_FORBIDDEN` checks, which passed |

## How findings get checked before they're believed

Every finder result is `schema: "findings"` (ref / severity / title / evidence — a quoted
line, not a paraphrase). Findings are deduped by the runner before verification. Each surviving
finding gets at least one adversarial skeptic pass (`verify.lenses: 1`, sonnet) that actively
tries to refute it against the real file content — not a second read that agrees by default.
Anything the finder or the skeptic marks `high`/`critical` severity escalates to a 3-lens panel
(`verify.escalate`), run **once per distinct finding title** and reproduced at the base lens
for repeats of that same title (`panelPerFinding: false`) — so eight instances of one pattern
don't buy eight full panels, but one genuinely novel high-severity claim does. A finding that
the panel or the single lens refutes does not reach the synthesis agent or the report.

The synthesis agent (opus) then does the one piece of judgment the skill reserves for the top
tier here: rank the surviving, verified findings and name the single most likely root cause
with a one-line arithmetic proof, rather than the orchestrator (me) skimming raw agent output
and asserting a cause from memory.

## Where the result lands

`swarm/reconcile-drift-report-{date}.md` under this working directory — one file, one
synthesis agent writes it, the run returns its path plus a summary and the accounting
(`agentsSpent`, `byTier`, `dropped`). Nothing gets re-summarized in the orchestrator's own
context; the headline relayed to the user is the path plus the three required facts (agents
spent by tier vs. ceiling, the path, whether anything was dropped), not a restatement of the
findings themselves.

## What bounds the run

- `ceiling.agents: 25` — a hard cap in the spec, not a number in this prose file. The runner
  (`workflows/swarm.mjs`) re-checks it at every `dispatch()` call independent of the planner's
  estimate; once reached, further dispatches are dropped and *named* in `result.dropped`
  rather than silently skipped.
- `ceiling.units: 40` — the secondary relative-cost cap (opus weighted 5×, sonnet 1×, haiku
  0.3× by default); this run's estimate is 19, well under it, because only the single
  synthesis dispatch is opus.
- `loop.maxRounds: 1` — no follow-up round. Five items over one lane, on a codebase this size,
  does not need a second pass; a loop was not added just because the field exists.
- Every dispatch site in the spec (`lanes[0].model`, `verify.model`, `synth.model`) names a
  standard tier explicitly; the planner's `MODEL_MISSING`/`MODEL_FORBIDDEN` checks passed,
  meaning nothing in this run can silently inherit this session's own (most expensive)
  orchestrator tier.
- Verification volume is bounded by pattern, not by finding count: the escalated 3-lens panel
  runs once per distinct finding *title*, so a repeated pattern across files does not multiply
  the expensive path.

## A note on right-sizing, stated plainly

The user asked to "throw a bunch of agents at this" and has said "swarmed" twice this week
under standup pressure, which is the explicit opt-in the `Workflow` tool requires and the
reason this is being run as a swarm rather than declined. But the actual work-list this
session scouted is four small files (13+4+4+3 = 24 lines total) plus a 21-line log — not the
"everything" framing suggested, once the eight dead `helperN.js` stubs are excluded by
`grep`. The swarm here is real (15 agents, a genuine severity-scaled verify stage, a written
report) but deliberately not padded to look bigger than the problem: one lane over five true
dimensions, not one agent per file-that-exists, and no second loop round manufactured to
justify the word "swarm". Sizing came from the sizing table's "unmarked" row and the inline
scout, not from matching the user's enthusiasm.
