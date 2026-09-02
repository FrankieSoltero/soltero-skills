# Swarm plan — pii-redact-sweep

Goal: find every API response that returns customer PII (email, phone, SSN, date of birth)
without going through `redact()` first, and hand the compliance lead a report by end of day.

Spec: `.soltero/swarm/pii-redact-sweep.json` (shape: `find`). Planner verdict:
`swarm/plan-verdict.json` (also reproduced below). Orchestration call: `swarm/run.mjs`.

## How the work-list was built

Scouted inline, no scout agent, before costing anything:

```
grep -rl "redact" src              → src/lib/redact.js, route3, route6, route9, route12
grep -rlE "res\.(json|send)\(" src → route1..route12 (all 12 route files — the only files
                                      in the tree with a response call)
grep -rlE "email|phone|ssn|dob..." src -i → src/lib/redact.js, src/models/customer.js only
cat each src/routes/route*.js      → 8 of 12 (route1,2,4,5,7,8,10,11) do
                                      `res.json({ ok, customer: c })` with the raw customer()
                                      object (email/phone/ssn/dob all present); the other 4
                                      call redact(c) first
cat src/jobs/*.js src/services/*.js → all 30 files are one-line arithmetic/filler
                                      (`export function computeN(x) { return x * N }`,
                                      `export async function jobN() { return 'jobN done' }`);
                                      none import customer or redact, none touch a response
```

This closes the work-list completely before any agent is dispatched: the only files that can
possibly leak PII into a response are the 12 route files, and the remaining 47 files
(services/jobs/models/lib, minus redact.js) are inert with respect to this question. That is
reflected in the spec as two lanes, not sixty file-level items — one lane per unit of work,
per the skill's "items are units of work, not files" rule.

## Agent count: 25 total (ceiling 30)

```
VERDICT: DISPATCHABLE (mode: workflow)
agents: 25 (ceiling 30)
by tier: opus=1 sonnet=24 haiku=0
by stage: scout=0 lanes=13 verify=11 synth=1
relative cost units: 29 (ceiling 40)
```
(zero planner errors, zero warnings — full JSON in `swarm/plan-verdict.json`)

| Stage | Dispatches | Model | Why this tier |
|---|---|---|---|
| Scout | 0 | — | `grep`/`cat` produced the complete work-list above for free; a scout agent buys nothing a command didn't already give me, and the skill calls that out by name. |
| Lane `routes-check` | 12 (one per route file) | **sonnet** | Mechanical read-and-report over a known file — a find/review sweep, the standard's "grunt" tier. |
| Lane `non-route-sweep` | 1 (one item covering all of services/jobs/models/lib) | **sonnet** | Same sweep class. It's one item, not 47, because the scout already showed those files are uniformly inert — one agent per file here would be the "forty-five inert files as forty-five items" mistake the skill names explicitly. |
| Verify | 11 (estimated) | **sonnet** | Skeptic/triage work is grunt tier, not judgment-authoring. 1 lens on every finding; the panel escalates to 3 lenses only for high/critical severities, and — because `expectedPatterns: 1` — only on the *first* occurrence of the one defect pattern all 8 leaks share ("raw customer object returned without redact()"). The other ~7 repeats of that title get the base 1-lens pass, not another vote. This is the "eight instances of one leak pattern are one title" rule from the skill, applied because the routes lane's own prompt forces every finder to use identical wording for the identical defect. |
| Synth | 1 | **opus** | Judgment + writing the one artifact everyone reads — the standard's "engineering" tier, pinned, never left to inherit. |
| **Total** | **25** | — | 24 sonnet + 1 opus, 0 haiku, 0 orchestrator-tier dispatches. |

No dispatch in the spec omits a `model`, and none names the orchestrator tier — the planner
checks exactly that (`MODEL_MISSING` / `MODEL_FORBIDDEN`) and returned zero errors.

## How verification works

`spec.verify`: `{ model: "sonnet", lenses: 1, escalate: { severities: ["high","critical"],
lenses: 3 }, expectedFindings: 9, expectedPatterns: 1, panelPerFinding: false }`.

- Every finding gets at least one adversarial "try to refute this" pass from a fresh sonnet
  agent that re-reads the cited file and defaults to *refuted* if it can't confirm the claim.
- Because these are PII leaks and SSN/DOB are in scope, the routes-check prompt assigns
  `critical` when SSN or DOB are exposed unredacted (which is all 8 leaking routes, since
  `customer()` returns the whole record) — so all 8 confirmed leaks are eligible for the
  escalated 3-lens quorum panel.
- `expectedPatterns: 1` caps the escalation at one full 3-lens panel, because the routes-check
  prompt requires every occurrence of the same defect to carry the identical finding title —
  so the runner (per its own pattern-collapse logic in `workflows/swarm.mjs`) escalates the
  *first* "raw customer object returned without redact()" finding to the full panel and
  reproduces the other ~7 at the base 1-lens pass. This is why verify costs 11 agents, not
  8×3=24: `9 findings × 1 lens = 9`, plus `1 escalated pattern × (3 − 1) extra lenses = 2`.
- A finding needs quorum to survive (2-of-3 lens votes for the escalated pattern, or the single
  lens for the base pass) — confirmed findings and refuted findings are both written into the
  report, so the compliance lead sees what was checked and cleared, not just the bad news.

## Where the report lands

`spec.synth.outputPath`: `Docs/swarm-{name}-{date}.md` →
**`/tmp/ab-agent-swarm/ws-01/Docs/swarm-pii-redact-sweep-2026-09-02.md`**

One opus agent writes it, reads it back to confirm every section exists on disk, and returns
only its path and a summary — findings are never re-summarized in the orchestrator's own
context (that re-summarization is the cost line the synth stage exists to avoid).

## What stops the run from growing past 25 (or 30)

1. **`ceiling.agents: 30`** in the spec is a hard cap the runner enforces at the code level,
   not a number written in this plan. Every `agent()` call in `workflows/swarm.mjs` goes
   through a `dispatch()` wrapper that checks `spent.total >= ceiling` before paying for
   another agent; once the cap is hit, further dispatches are **dropped and named** in the
   run's `dropped` array instead of silently running, and the synth stage's summary is
   prefixed `PARTIAL COVERAGE` rather than reported as a clean finish. 25 is this run's
   *estimate*; 30 is what the runner will actually refuse to exceed if verification runs wider
   than expected (e.g. a second distinct leak pattern turns up in the non-route sweep).
2. **No loop.** `spec.loop` is absent, so the runner does a single round. "Go wide" was honored
   by adding a second lane (the non-route sweep) and by escalation depth in verify — not by a
   `loop.maxRounds` repeat. The work-list here is a closed, fully-enumerated set of files (the
   scout step above already read every candidate); a second round would re-run all 13 lane
   dispatches against a file set that cannot produce new items, for zero marginal coverage.
   That is the actual reasoning, not a default — `loop.maxRounds: 2` is exactly what the
   skill's sizing table suggests for "go wide" language, and I deliberately did not add it here
   because this sweep has no discovery uncertainty a second pass could resolve.
3. **One synthesis agent, pinned in the spec.** There is no path in the runner for a second
   report-writing dispatch; `spec.synth` is a single object, checked by the planner
   (`SYNTH_MISSING`) before dispatch.
4. **Mode is `workflow`, not `agents`.** 25 > the planner's `SMALL_FANOUT` threshold (3), so
   the run goes through the ceiling-enforcing universal runner rather than loose `Agent` calls
   that have no shared cap at all.
