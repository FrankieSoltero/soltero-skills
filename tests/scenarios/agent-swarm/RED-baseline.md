# RED baseline — agent-swarm (no skill)

Date: 2026-09-02. Fresh `general-purpose` subagents, **model: sonnet**, scenario text
verbatim, skill absent (it did not exist yet). Workspaces built by
`fixtures/setup-workspaces.sh`: `/tmp/acme-crm` (59 files under `src/`, 12 route handlers of
which 8 return raw customer PII), `/tmp/acme-shop` (40 `legacyFetch` callers, one smoke test),
`/tmp/acme-billing` (reconcile job, ledger writer, rounding helpers, cron wrapper, 21 nights
of drift logs). No scenario offers A/B/C options; every run is measured by the artifacts it
wrote under `<workspace>/swarm/` and its verbatim reasoning.

**Honest topline:** sonnet is a good swarm *sizer*. None of the three baselines fanned out one
agent per file, all three scouted before sizing, all three scaled verification and wrote the
result to a file. The observed failures sit one level down, and they are the ones the user
named as the usage burn: **every run authored a fresh purpose-specific workflow script** (278,
217 and — see scenario 3 — more lines, each with its own schemas, scout, verify and report
prompts, none reusable for the next purpose); **the model tier was re-derived per job** rather
than taken from the standard (code-writing on sonnet, synthesis on haiku, one synthesis
inheriting the orchestrator tier); and **every ceiling lived in prose** — "hard ceiling: 9
agents", "26 total, computed from evidence" — with nothing in the artifact that enforces it or
could be re-checked before dispatch. The skill must fix those, not the sizing judgment.

## Scenario 1 — "go wide, plenty of budget" PII sweep (`/tmp/acme-crm`)

- Read the repo first (12 route files are the real surface, 45 files are inert) and sized to
  the evidence: 26 agents (1 scout haiku, 13 finders sonnet, 11 verifiers sonnet, 1 report).
  Verbatim: *"'Go wide' got interpreted as wide enough to cover every place PII could actually
  leave the system … not as 'spend proportional to the budget available.'"* This is correct
  sizing and the skill must preserve it.
- **Gap 1 — one dispatch inherits the orchestrator tier.** `plan.md` on the report agent:
  *"sonnet (inherits session default; no override)"*. The scenario states the session runs on
  the top tier, so "inherits session default" is the most expensive model for the one agent
  that writes the whole report. `run.mjs` line 255: `agent(` with no `model` in its options —
  7 of 8 `agent()` calls pinned, the synthesis is not.
- **Gap 2 — tiers re-derived per job.** Verbatim: *"Report needs synthesis and severity
  framing, not novel reasoning, so it's not haiku; it's not novel architectural reasoning
  either, so it doesn't need opus."* Reasonable-sounding and different every time; the
  standard assigns synthesis to opus and the scan work to sonnet/haiku, and the run never
  consulted it. *"No agent uses opus."*
- **Gap 3 — a 278-line fresh script.** Four phases, five schemas, a `CANDIDATE_CAP`, a decoy
  sweep, an escalation branch — all hand-written for this one purpose, none of it reusable for
  the next sweep. The scenario's "last week a similar sweep" would have been another 278 lines.
- **Gap 4 — the bound is a per-phase constant, not a run ceiling.** `CANDIDATE_CAP = 20`
  bounds the Find fan-out only; verification is *"3 once per distinct pattern, 1 per repeat"*
  and scales with what Find returns. The stated 26 is an expectation, not a limit, and nothing
  would refuse a spec that exceeds it.
- Preserved and good: scout before fan-out, one agent for the 45 decoys, severity-scaled
  verification, dropped candidates logged, report to `Docs/`.

## Scenario 2 — third migration swarm this month (`/tmp/acme-shop`)

- Rejected the copy-the-last-swarm shortcut and scouted (grep → 40 byte-identical callers),
  then sized to 4 agents (1 transform, 2 verify, 1 report; expected 0 deviation handlers, ≤5
  possible). Verbatim: *"a real 40-writer swarm would be over-engineering a problem a single
  deterministic pass plus two verification reads already solves."* Correct, and preserved.
- **Gap 5 — code-writing on sonnet.** *"sonnet for the mechanical-but-real edit"* — the one
  agent that rewrites 40 source files runs on the grunt tier; the standard puts code-writing
  on opus. Report on haiku. Again per-job derivation, with the stated rationale *"no opus —
  nothing here is hard architecture"*.
- **Gap 6 — ceiling in prose only.** `plan.md`: *"Hard ceiling: 9 agents … If the run ever
  wants to exceed 9 agents it has left the scope of this plan and should stop and ask."*
  `grep -n -i -E "ceiling|cap|MAX|budget" run.mjs` → no hits. The script has a 5-file
  deviation circuit breaker but no agent count anywhere; the 9 exists only in the plan.
- **Gap 7 — a 217-line fresh script**, written from scratch *after* the user said the last one
  "cost more than the migration itself". Verbatim on reuse: *"What I reused instead: the
  general subagent toolkit (`agent()`, `parallel()`, …)"* — i.e. the runtime primitives, not
  any artifact. New schemas, new prompts, new phases. The next migration is another 217 lines.
- Preserved and good: single writer (no collision by construction), three tool-grounded
  verification signals, test-suite quirk surfaced honestly, `legacyFetch.js` left in scope for
  a later step.

## Scenario 3 — negative / trigger: "throw a bunch of agents at this" (`/tmp/acme-billing`)

- With no swarm skill in the tree, the standing routing rule sent the run to
  **`dispatch-contract`** (fan-out briefs) and **`lean-debugging`** (root cause before fix); it
  read `audit-swarm` for shape and explicitly declined it (*"its trigger is security/compliance
  audits via the Workflow tool, not a live arithmetic-bug investigation"*). So the trigger
  surface this scenario measures is empty in RED, by construction — what it records is what
  the neighbouring skills buy on their own.
- Read all 11 files itself (correct: no scout agent for a 40-line repo), found the real
  `split()` remainder drop and the `reconcile([])` contradiction in the cron wrapper, and
  organised six named hypotheses as Wave-1 investigators, 0–6 skeptics in Wave 2, one opus
  synthesis. Eight typed briefs, all passing `validate-brief.mjs`; every dispatch pinned
  (*"I pinned models per the standard table rather than reasoning per-job"*) — this is
  `dispatch-contract` working, and it shows the tier pins alone do not need a new skill.
- **Gap 8 — the ceiling is prose again.** `plan.md`: *"Hard cap: 15 agents, regardless of how
  many Wave-1 verdicts come back CONFIRMED."* `dispatches.md` is a hand-written sequence of
  eight `Agent(` calls with *"the orchestrator-side checks between waves"* in English; Wave 2's
  size is *"generated from whatever Wave 1 actually confirms"*. Nothing computes or enforces
  the 15 before dispatch, and nothing would report what the run dropped if it hit it.
- **Gap 9 — orchestration authored by hand, at orchestrator prices.** 582 lines across
  `dispatches.md` and eight briefs, ~118k tokens of the top-tier session, to arrange 9–13
  sonnet/haiku agents over 40 lines of code. The wave structure (fan-out → skeptic per
  confirmed claim → synthesis to a file) is exactly the universal runner's shape; here it was
  re-derived and re-typed in full.
- Preserved and good: inline scout, named falsifiable hypotheses, standard tiers via
  dispatch-contract, an integrity hash of the audited tree, results to one synthesis file,
  no fixes folded into diagnosis.

## What the skill must add (and must not touch)

Add: a spec artifact that carries the ceiling, the pins, the verify scaling and the synthesis
path in one checkable file; a planner that refuses an unpinned or orchestrator-tier dispatch
and prints the count per tier before anything runs; one universal runner so the next purpose
is a spec, not another 217–278-line script. Leave alone: the sizing judgment, the inline
scout, the refusal to fan out one agent per file — all three baselines already had those.
