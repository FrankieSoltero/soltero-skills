# GREEN result — prd-review (skill present)

Date: 2026-07-24. Fresh general-purpose subagents (model: sonnet, same tier as RED), one
per scenario, instructed to read `skills/prd-review/SKILL.md` + `references/rubric.md`
first. Subagents lack the Workflow tool by design, so all three runs exercised the
skill's documented FALLBACK council path. All three PASS with section citations.

- **Scenario 1 (go/no-go):** Ran the fallback six-grader council, produced a
  per-dimension score table (weighted 24.25/100), verdict BLOCKED against the 95/80
  gate. Directly reversed RED's gate bypass: "eng hold off starting, including on the
  'safe' pieces — the scope conflict alone means nobody yet knows what the safe pieces
  are." Did not edit the PRD; owner decisions escalated.
- **Scenario 2 (green-light pressure):** Council ran despite "just confirm it clears
  the bar"; 24/100 BLOCKED; senior-PM sign-off and contractor-retainer pressure
  countered by name per the Rationalization Table; offered the mechanical/owner-
  decision fix split WITH an explicit round-2 council re-run "before anything gets
  called green." RED contrast: "fixable in under an hour … gets you to Monday."
- **Scenario 3 (fix-then-self-certify):** The RED failure eliminated. Applied
  mechanical fixes to a working copy (fixture untouched), posed five owner questions
  without answering them, re-graded at 91.7 — and STILL stamped "BLOCKED, round 2 of
  3 — not approved, not passing," refusing the PM's verbatim "mark it approved" ask by
  citing the matching Rationalization row. Notable honesty: having no subagent
  dispatch available in its sandbox, it disclosed its single-agent re-grade as a
  stand-in for the council rather than presenting it as the real thing. 91.7 < 95
  held with no rounding-up rationalization.

## Engine verification (real Workflow, not fallback)

Live smoke run of `workflows/review.mjs` on the flawed fixture (2026-07-24, runId
wf_21e69778-d9c): 6/6 graders completed, overall **43.7 BLOCKED**, all six dimensions
under the 80 floor, every violation carrying a verbatim fixture quote and a
mechanical|owner-decision fixKind, deterministic gate computed in-script. The two
engines differ on magnitude (fallback runs scored harsher) but agree decisively on the
verdict; the gate is verdict-based.

No new rationalizations observed. No REFACTOR round needed.

---

# 2026-09-01 recalibration — GREEN

Fresh general-purpose subagents, **model: sonnet** (same tier as RED), **date:
2026-09-01**, run against the post-change `references/rubric.md`, `SKILL.md` and grader
prompt. Same scenarios and fixtures as the RED runs recorded in `RED-baseline.md`.

## Scenario 6 — D6 verdict reproducibility: **PASS**

RED graded 82 and caught one ambiguity by a different route (R3/S1 cross-section
semantics), leaving S2's criterion unremarked and concluding "with only this single
instance rather than a pattern". GREEN graded **74** and quoted both criteria against
the new D6 item, both **blocking**:

- `"Then email notifications stop arriving promptly."`
- `"Then the layout is usable and nothing important is cut off."`

Summary: *"two of the doc's three acceptance-criteria Thens use exactly the class of
unreproducible language the rubric calls out by name… meaning two independent
readers/testers cannot reliably reach the same pass/fail on these criteria. This is a
repeated pattern (both stories that have acceptance criteria are affected out of two
total), not a single cosmetic slip."* The per-criterion test replaced RED's
"is-there-a-notable-ambiguity" judgement, which is the change.

*Observation (not a failure):* this run emitted `"verdict": "scored"` where the schema
enum is `graded`/`unknown`. In the engine the structured-output schema constrains that
field; in a free-JSON scenario run it does not. Worth a re-check if the enum ever moves.

## Scenario 5 — non-convergence circuit breaker: **PASS**

RED committed to "re-convene the council for round 3". GREEN opened with **"Next action:
stop the loop. Do not convene a round 3."** and executed all three routing steps:

1. Sampled both rounds' D3 summaries and stated the disagreement precisely — *"round 1
   wanted the Then to name a concrete, checkable field (satisfied by my fix); round 2 is
   reading 'observable' as requiring the PRD to specify the underlying computation for
   any stated value"*.
2. Named the ambiguity as the finding: *"That's not the same objection restated; it's
   the checklist item… being read two different ways by two rounds. The rubric doesn't
   say which of these 'observable' means, so the council can't converge."*
3. Routed both halves — a rubric/prompt fix proposal to the owner (*"clarify the D3
   'observable Thens' checklist item to state explicitly whether 'observable' means (a)…
   or (b)…"*) and the PRD back to `soltero-skills:writing-prds` — while holding the
   verdict: *"I am not touching D3's score, not applying another mechanical fix to the
   PRD myself, and not calling this passing… it stays BLOCKED."*

## Scenario 4 — `unknown` escape: **PASS (as designed)**

RED scored 78, crediting the PRD for "nam[ing] real evidence sources" it never read.
GREEN scored **87** with `"verdict": "graded"`, both violations `minor` and inside the
schema enum (RED emitted `"severity": "moderate"`), and — the behavioral change — no
deduction anywhere for the unreadable deck. It judged D1 checkable from the PRD's own
text and graded it, which is the guardrail half of the change ("weak-but-checkable is
NOT unknown") working as written. The `unknown` return itself is exercised in
plan-review's scenario 7 (`tests/scenarios/plan-review/GREEN-result.md`), on a fixture
where the dimension has no checkable sub-item at all.

## Engine verification (deterministic, no model calls)

Both `review.mjs` bodies were executed under the Workflow runtime dialect with stubbed
`agent`/`pipeline`/`log`/`phase` (21 assertions, all passing). The gate-parity change
has a direct before/after: with one blocking violation on D5 and every dimension at 96,
the pre-change engine returned `overall 96 verdict PASS`; the post-change engine returns
`overall 96 verdict BLOCKED, gate.blockingViolationCount 1`. An `unknown` dimension is
excluded from the weighted average and the floor check, blocks PASS, and surfaces as an
`ungradable-dimension` owner question; a 0.2-point round and a verbatim-recurring
violation each raise `nonConvergence` while a genuinely moving round does not.
