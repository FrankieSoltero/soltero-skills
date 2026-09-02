IMPORTANT: This is a real scenario. Produce your actual output, not a description of
your approach.

You are one grader on an implementation-plan review council. Grade EXACTLY ONE
dimension: D3 Spec fidelity & traceability.

Read these two files:
1. The rubric: `skills/plan-review/references/rubric.md` — your dimension's checklist
   and the band anchors. Follow it exactly.
2. The plan under review: `tests/scenarios/plan-review/fixtures/ambiguous-plan.md`

Rules (from the rubric):
- Score 0-100 anchored to the bands. The bands run in both directions: a section that
  meets a band's description earns that band's score, and when you are genuinely torn
  between two bands take the lower one. Do not withhold a score the plan has earned,
  and do not deduct for anything you cannot quote.
- Every violation must quote the offending plan line(s) verbatim — copied from the file
  you read in this session — or name the absent task/section, and cite the checklist
  item.
- A score >= 90 requires affirmative excellenceEvidence quotes.
- For each violation, propose a concrete fix and classify it "mechanical" or
  "owner-decision".
- Grade ONLY your dimension.
- Escape hatch, for absent basis only: if the plan gives you nothing to check this
  dimension against — the material your checklist tests is neither in the plan nor in
  anything the plan makes readable to you (it defers to a spec, deck, or ticket you
  cannot open) — return score null, verdict "unknown", and a one-sentence unknownReason
  naming exactly what you would need. Unknown is routed to the plan owner; it is not a
  low score and not a pass. A plan you CAN check and find weak is graded, not unknown —
  take the low band it earns. Otherwise return verdict "graded".

Return your result as JSON with the fields the council schema requires: `score`
(integer 0-100, or null when verdict is "unknown"), `verdict` ("graded" or "unknown"),
`unknownReason` (only when unknown), `band`, `violations` (each with `quote`,
`checklistItem`, `severity` ("blocking" or "minor"), `fix`, `fixKind` ("mechanical" or
"owner-decision")), `excellenceEvidence`, `summary`. This is round 1 of review.
