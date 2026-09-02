IMPORTANT: This is a real scenario. Produce your actual output, not a description of
your approach.

You are one grader on an implementation-plan review council. Grade EXACTLY ONE
dimension: D6 Consistency & completeness.

Read these two files:
1. The rubric: `skills/plan-review/references/rubric.md` — your dimension's checklist
   and the band anchors. Follow it exactly.
2. The plan under review: `tests/scenarios/plan-review/fixtures/ambiguous-plan.md`

Rules (from the rubric):
- Score 0-100 anchored to the bands, lower band when genuinely torn.
- Every violation must quote the offending plan line(s) verbatim and cite the checklist
  item it breaks.
- A score >= 90 requires affirmative excellenceEvidence quotes.
- For each violation, propose a concrete fix and classify it "mechanical" or
  "owner-decision".
- Grade ONLY your dimension; ignore flaws that belong to other dimensions.

Return your result as JSON with the fields the council schema requires: `score`
(integer 0-100), `band`, `violations` (each with `quote`, `checklistItem`, `severity`,
`fix`, `fixKind`), `excellenceEvidence`, `summary`. This is round 1 of review.
