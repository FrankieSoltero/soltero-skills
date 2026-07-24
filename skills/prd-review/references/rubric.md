# PRD Review Rubric — council grading standard

Six dimensions, weights sum to 100. Each grader scores ONE dimension 0–100 against the
band anchors below. Two evidence rules apply to every grader:

1. **Every deduction cites evidence** — quote the offending PRD line(s) (or name the
   absent section). No unquoted deductions.
2. **Every score ≥90 cites evidence too** — quote the lines that EARN the excellence.
   "Nothing wrong that I saw" is not evidence; a 90+ without affirmative quotes is
   invalid and must be lowered to 89 or re-examined.

Scores are NOT letter-grade vibes. Anchor to the bands; when torn between two bands,
take the lower one.

## Band anchors (apply per dimension)

- **95–100** — a tester/designer/exec could act on this section verbatim; zero
  violations from the dimension's checklist; affirmative evidence quoted.
- **85–94** — sound structure, 1–2 minor violations (cosmetic vagueness, one missing
  marker); nothing that would mislead a builder.
- **70–84** — usable skeleton but repeated violations; a builder would have to guess on
  real decisions; needs a revision pass before design.
- **50–69** — the section performs its ritual (headings, tables) but fails its purpose;
  core content vague, invented, or missing.
- **<50** — section absent, contradictory, or actively misleading.

## Dimensions & checklists

### D1 — Problem & evidence (weight 15)
- Problem states who hurts, how, with evidence (tickets, interviews, data) — not
  "customers have been asking".
- No solution language in the problem section (naming the tech stack = violation).
- Every user group marked validated/unvalidated honestly; no story-bearing personas
  that are unvalidated.

### D2 — Requirements quality (weight 20)
- Numbered, gap-free IDs; each requirement testable (observable bound or behavior —
  "fast", "intuitive", "secure", "scales" are violations).
- Each traces to a goal; non-functional requirements state their bound.
- No requirement contradicts another section.

### D3 — Stories & acceptance criteria (weight 15)
- Every story: validated persona, traces to a requirement.
- Every story has Given/When/Then criteria with observable Thens.
- No invented thresholds presented as settled (unsourced numbers need
  `(proposed — confirm)`).

### D4 — Scope discipline (weight 15)
- MoSCoW (or equivalent) with Must ≤ ~half; Must means "does not ship without".
- Explicit Out-of-scope list exists.
- No multi-subsystem bundle absorbed silently; undefined-shape items flagged as
  needing their own spec, not tiered.

### D5 — Success metrics (weight 15)
- 3–5 primary metrics, each with baseline + target + timeframe + measurement source.
- Unsourced targets carry `(proposed — confirm)`; no invented instrumentation.
- At least one guardrail metric.

### D6 — Consistency & ambiguity (weight 20)
- No cross-section contradictions (goals vs scope vs requirements).
- No TBD/placeholder in Owner, Open Questions, or any section a builder depends on.
- No sentence a reasonable reader could take two ways on a decision that matters;
  no invented specifics presented as fact anywhere in the doc.

## Skeptic pass (anti-inflation)

Any dimension scored ≥90 gets an adversarial skeptic whose ONLY job is to find
checklist violations the grader missed, quoting lines. A confirmed miss triggers a
re-grade with the skeptic's findings attached; the recorded score is the LOWER of
grade and re-grade. Skeptics default to "no miss found" only after checking every
checklist item explicitly.

## Gate

- **PASS:** weighted overall ≥95 AND every dimension ≥80.
- **BLOCKED:** anything else. A BLOCKED PRD must not proceed to design
  (superpowers:brainstorming), planning, or implementation — no exceptions for
  deadlines, sunk contractor costs, or prior informal sign-offs.
