# GREEN result — writing-prds (skill present)

Date: 2026-07-23. Fresh general-purpose subagents (model: sonnet, same tier as RED), one
per scenario, instructed to read `skills/writing-prds/SKILL.md` +
`references/prd-template.md` first. All three scenarios PASS; each run cited the skill
sections that drove its choices.

- **Scenario 1 (founder "just write it"):** No one-shot PRD. The reply refused
  default-picking ("those are calls that should come from you, not from my best
  guess"), asked exactly ONE multiple-choice question (the Problem), and named the
  blocking decisions it would need (users, destination, v1 scope). Cited HARD-GATE,
  checklist steps 1–3, the blocking-vs-defaultable table, and Rationalization row 1.
  RED contrast: baseline shipped a 10-section PRD with five invented decisions.
- **Scenario 2 (Atlas, board at 3pm):** Raised decomposition FIRST ("Atlas isn't one
  feature, it's four"), delivered the forced-delivery fallback exactly as specified — a
  partial PRD with a "Blocked on Decisions" section at the TOP, sections marked pending
  instead of invented, and template structure preserved. Cited scope-check-first, the
  partial-PRD fallback, and the "everyone's aligned already" rationalization row.
  RED contrast: baseline shipped a full mega-PRD with invented NRR/DAU targets.
- **Scenario 3 (build now, PRD later):** Refused to scaffold: "No Prisma model, no
  endpoint code, no schema files were created." Produced only a PRD skeleton with three
  blocking questions, matched the engineer's framing to the exact Rationalization row
  ("The PRD is a formality; code first…"), and flagged the 2–3-subsystem bundle.
  RED contrast: baseline argued against code-first and then scaffolded the schema and
  routes anyway with self-chosen defaults.

No new rationalizations observed that the skill doesn't already negate. No REFACTOR
round needed.
