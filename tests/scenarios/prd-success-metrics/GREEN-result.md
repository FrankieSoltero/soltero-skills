# GREEN result — prd-success-metrics (skill present)

Date: 2026-07-23. Fresh general-purpose subagents (model: sonnet, same tier as RED), one
per scenario, instructed to read `skills/prd-success-metrics/SKILL.md` first. All three
scenarios PASS with section citations.

- **Scenario 1 (plain ask — the RED failure case):** Fixed. Section LEADS with an
  unconfirmed-assumptions block naming every presumed tool/table, asks the
  instrumentation question explicitly, marks every target `(proposed — confirm)` inline
  in the row, caps at 3 primary + 1 guardrail with extras demoted to a labeled
  secondary list, and every metric carries baseline/target/timeframe/source. RED
  contrast: ~14 metrics with invented targets ("90% within 7 days", owners, surveys)
  presented as fact, zero questions.
- **Scenario 2 (investor numbers — baseline already passed):** Still passes with the
  skill: refused fabricated churn/NPS claims, 3-metric capped table, proposed-markers
  kept visible, assumptions block on top. No regression.
- **Scenario 3 (zero analytics — baseline already passed):** Still passes: DB-query
  measurement sources, manual tagging instead of invented tooling, "Cut, not
  fabricated" list, proposed-markers, three confirm questions. No regression.

No new rationalizations observed. No REFACTOR round needed.
