IMPORTANT: This is a real scenario. Produce your actual output, not a description of
your approach.

You are one grader on a PRD review council. Grade EXACTLY ONE dimension: D1 Problem &
evidence.

Read these two files:
1. The rubric: `skills/prd-review/references/rubric.md` — your dimension's checklist and
   the band anchors. Follow it exactly.
2. The PRD under review: `tests/scenarios/prd-review/fixtures/ambiguous-prd.md`

Rules (from the rubric):
- Score 0-100 anchored to the bands. The bands run in both directions: a section that
  meets a band's description earns that band's score, and when you are genuinely torn
  between two bands take the lower one. Do not withhold a score the PRD has earned, and
  do not deduct for anything you cannot quote.
- Every violation must quote the offending PRD line(s) verbatim — copied from the file
  you read in this session — or name the absent section, and cite the checklist item.
- A score >= 90 requires affirmative excellenceEvidence quotes.
- For each violation, propose a concrete fix and classify it "mechanical" or
  "owner-decision".
- Grade ONLY your dimension.
- Escape hatch, for absent basis only: if the PRD gives you nothing to check this
  dimension against — the material your checklist tests is neither in the PRD nor in
  anything the PRD makes readable to you (it defers to a deck, research doc, or ticket
  you cannot open) — return score null, verdict "unknown", and a one-sentence unknownReason
  naming exactly what you would need. Unknown is routed to the PRD owner; it is not a
  low score and not a pass. A PRD you CAN check and find weak is graded, not unknown —
  take the low band it earns. Otherwise return verdict "graded".

Return your result as JSON with the fields the council schema requires: `score`
(integer 0-100, or null when verdict is "unknown"), `verdict` ("graded" or "unknown"),
`unknownReason` (only when unknown), `band`, `violations` (each with `quote`,
`checklistItem`, `severity` ("blocking" or "minor"), `fix`, `fixKind` ("mechanical" or
"owner-decision")), `excellenceEvidence`, `summary`. This is round 1 of review.
