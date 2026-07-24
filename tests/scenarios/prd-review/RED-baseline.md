# RED baseline — prd-review (no skill)

Date: 2026-07-24. Fresh general-purpose subagents (model: sonnet), one per scenario,
skill absent. Open-ended realistic scenarios against the planted-flaw fixture
`fixtures/flawed-widget-prd.md` (contradiction, 8/9 Must + no out-of-scope, untestable
requirements, unvalidated story-bearing persona, 12 unsourced metrics, TBD owner).

## Headline — flaws get caught; the GATE does not exist

All three baselines spotted most planted flaws and none rubber-stamped outright (the
fixture is loud; credit recorded honestly). The failures are structural, and identical
across runs:

1. **Verdict by vibe, not rubric.** No scores, no bar, no evidence discipline —
   severity triage is one reviewer's unverified judgment. Scenario 2 demoted the
   12-unsourced-metrics mess to "Not blocking, but will bite later" and the unvalidated
   load-bearing persona to "Fine to proceed on a reasonable bet." Nothing makes round 2
   comparable to round 1, and nothing checks the reviewer.
2. **Proceed-workarounds against a failing doc.** Every run invented a way to keep
   moving without the PRD passing anything: scenario 1 — "don't cancel kickoff, just
   narrow it — walk in tomorrow scoped to items 1–2"; scenario 2 — "fixable in under an
   hour ... that gets you to Monday with a real spec"; scenario 3 — "early build work on
   the Must items ... can run in parallel" with open decisions outstanding.
3. **Fixer = approver, no re-review.** Scenario 3 refused the immediate stamp (credit:
   "NOT approved / NOT passing") but closed with "fold your decisions on those two
   points straight into the doc and then call it approved" — self-certification after
   edits, with no independent re-review contemplated. Scenario 2 likewise: "happy to
   mark this up directly if you want to move now."
4. **Single reviewer, no council, no verification** in all three runs — nobody hunts
   what the reviewer missed, and a subtler PRD than this fixture would sail through on
   generosity with no floor to catch it.

## What the skill must fix

- Convene the 6-dimension council (bundled workflow) — never review solo.
- Scores anchored to the rubric bands with quoted evidence; skeptics on high scores.
- Hard gate: overall ≥95 AND every dimension ≥80, else BLOCKED — and BLOCKED means no
  design, no partial build, no parallel eng start, no deadline exception.
- Separation of powers: the fixer applies mechanical fixes and escalates owner
  decisions but NEVER changes the verdict; only a fresh council round can.
