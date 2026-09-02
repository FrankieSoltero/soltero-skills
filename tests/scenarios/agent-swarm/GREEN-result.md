# GREEN result — agent-swarm (skill present)

Date: 2026-09-02. Fresh `general-purpose` subagents, **model: sonnet** (same tier as RED),
scenario text verbatim. Scenarios 1 and 2 opened with "read `skills/agent-swarm/SKILL.md` and
follow it" with `CLAUDE_SKILL_DIR` named; scenario 3 was dispatched with only the standing
routing rule, so the description was the only surface that could fire it. Workspaces rebuilt
from `fixtures/setup-workspaces.sh` before the batch.

**Process note, recorded honestly:** the fixture builder was re-run (to add the A/B canary
fixture) while this batch was live, which wiped all three workspaces mid-run. Every artifact
below was written *after* the wipe (file mtimes 14:08–14:11 against a ~14:05 wipe) and each
run's final message matches what is on disk, so the batch stands; the lesson is in
`Docs/mistakes-and-fixes.md` (2026-09-02).

## Round 1 — conformance: 3/3 PASS, with a cost regression in two of three

All three runs produced a **spec** instead of a script, ran the planner on it, pinned every
dispatch site, and wrote the ceiling into the artifact. Independently re-checked with
`node skills/agent-swarm/scripts/swarm-plan.mjs <spec>` on each file → 3/3 `DISPATCHABLE`.

### Scenario 1 — PII sweep (`/tmp/acme-crm/swarm/pii-sweep.json`)

- **Reverses RED gaps 1–4.** `synth.model: "opus"` in the file (RED: report agent inherited
  the session tier); tiers cited from the standard table (*"Models — the standard, not
  per-job judgment"*); no `run.mjs` written — *"the skill's whole point is that a new purpose
  is a new spec"*; `ceiling.agents: 45` in the spec, planner: `agents: 40 (ceiling 45)`,
  `opus=1 sonnet=39`.
- Scouted inline with two greps before writing anything; two lanes (12 real response sites,
  3 boundary sweeps); skipped `loop` deliberately (*"the scout already covered 100% of src/"*).
- **Cost regression.** `verify.expectedFindings: 8`, `escalate.expected: 8` — all eight
  identical `res.json({ customer: c })` leaks sent to the three-lens panel → 24 verify agents,
  40 total. RED had verified the pattern once at three lenses and the seven repeats at one
  (11 verify, 26 total). The skill as written made the run *more* expensive.

### Scenario 2 — legacyFetch migration (`/tmp/acme-shop/swarm/legacyfetch-migration.json`)

- **Reverses RED gaps 5–7.** Writers on `opus` (RED: sonnet); no fresh script — *"What I
  reused: everything mechanical"*; ceiling in the file, planner `agents: 41 (ceiling 45)`.
  Chose `serial: true` over worktrees with the reference's own reasoning.
- **Cost regression.** 40 opus writers, one per file — `opus=40`, relative cost units 201 —
  for a rewrite the run itself confirmed is *"one exact mechanical pattern"* across all 40
  callers. RED did it with one sonnet agent. The reference's transform example listed one
  file per item, and the run copied that width.

### Scenario 3 — unnamed trigger (`/tmp/acme-billing/swarm/reconcile-drift.spec.json`)

- **Description fired on its own.** *"its description literally lists 'throw a bunch of
  agents at this' as a trigger phrase, which is the user's message almost verbatim"* — found
  by listing the skills directory and grepping frontmatter descriptions. Ruled out
  `lean-debugging`, `audit-swarm`, `dispatch-contract`, `evidence-gate` with correct reasons.
- **Reverses RED gaps 8–9.** Ceiling in the spec (`25`), planner `agents: 23 (ceiling 25)`;
  no hand-written wave plan — three lanes over an inline `find`, one helper-audit item for
  the eight stubs (*"one agent per one-line helper stub would be pure agent-count theater"*).
  Orchestrator spend 90k tokens against RED's 118k for the same task.

## REFACTOR round 1 — width

The regression is one mistake in two costumes: **items sized by file count instead of by
unit of work**. Changes:

- `references/spec-format.md`: transform example re-cut to four write-scopes (directories)
  with `serial: true`, and a "Verification is per pattern, not per finding" section.
- `workflows/swarm.mjs`: the escalated panel now runs **once per distinct finding title**;
  repeats of a pattern get the base panel (`verify.panelPerFinding: true` opts out).
  Behavioral test added.
- `scripts/swarm-plan.mjs`: `WIDE_WRITE_LANE` warning on a writing lane over ten items;
  `verify.expectedPatterns` bounds the escalation estimate; optional `ceiling.units` as a
  second cap on relative cost (`OVER_UNITS`). Tests added (22 planner, 10 runner).
- `SKILL.md`: "Items are units of work, not files" under the spec step; two rationalization
  rows ("forty files, forty writers", "every one of the eight leaks is critical"); a red flag
  for a writing lane with more items than distinct decisions.

## Round 2 — re-verify scenarios 1 and 2 after REFACTOR: 2/2 PASS, regression closed

Fresh sonnet subagents, workspaces rebuilt, same prompts as round 1.

- **Scenario 2** (`/tmp/acme-shop/swarm/spec.json`): four write-scopes (`src/cart`,
  `src/catalog`, `src/checkout`, `src/account`), `serial: true`, opus writers, sonnet
  status-list synth. Planner: `agents: 5 (ceiling 8)`, `units: 21 (ceiling 30)` — from 41
  agents / 201 units in round 1. Cited the new rationalization row verbatim (*"Forty files,
  forty writers... is the most expensive thing this skill can produce"*). Added the import-line
  rewrite the reference example omitted, from reading a real caller — the right kind of fresh
  work. Honest caveat: the reference's worked transform example matches this fixture's
  directory layout, so part of this run's shape was available to copy; the A/B eval reads the
  same scenario and this note carries into its report.
- **Scenario 1** (`/tmp/acme-crm/swarm/pii-sweep.json`): two sonnet lanes (12 route files +
  one scope-confirmation lane), `verify.expectedPatterns: 1` so the three-lens panel runs once
  for the shared leak title and the seven repeats get one lens; opus synth; `ceiling.agents:
  45`, `ceiling.units: 55`, `loop.maxRounds: 2`. Planner: `agents: 39` worst case across two
  rounds (`units: 43`); expected single-round spend ≈ 26, matching RED's 26 with the pins,
  the ceiling and the reusable runner RED lacked. Cited *"every one of the eight leaks is
  critical, so each gets the three-lens panel"* as the excuse it rejected.

Both runs again produced a spec and ran the planner before stating a count; neither wrote a
script. Round 1's *reverses RED gaps 1–9* results are unchanged by the refactor.

## Ship gate — skill-ab-eval (2026-09-02)

Paired with/without runs on sonnet and haiku, four isolated haiku judges per run, seeded
canary. Verbatim tabulator output and the full per-dimension read are in
`Docs/skill-eval-agent-swarm-2026-09-02.md`; evidence under `Docs/evals/agent-swarm-2026-09-02/`.

| Tier | Without | With | Delta |
|---|---|---|---|
| sonnet | 0/3 | 3/3 | +100pp |
| haiku | 0/3 | 1/3 | +33.3pp |

Canary failed in both tiers (grader alive); no flags. **Recommendation: ship**, with haiku's
width-by-work regression (2/3 → 1/3) named as the follow-up — haiku follows the spec/planner
mechanics but still sizes finder lanes by file count.
