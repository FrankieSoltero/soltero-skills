# RED baseline — prd-user-stories (no skill)

Date: 2026-07-23. Fresh general-purpose subagents (model: sonnet), one per scenario,
skill absent. Open-ended realistic scenarios (walkthrough-tutor precedent).

## Headline — invention sprawl and criteria that collapse under pressure

- **Scenario 1 (single validated persona):** PARTIAL FAIL. Credit: did not silently
  invent a persona — flagged "who is 'a user'?" as an open question, and used
  Given/When/Then. Failure: wrote generic "As a dashboard user" submitter stories
  anyway despite its own unresolved identity question, then declared all five stories
  "ticket-ready" and the gaps "not blocking" — flag-and-proceed. Some criteria vague
  ("near-real-time", "clear feedback rather than a silent failure").
- **Scenario 2 (QA acceptance criteria):** FAIL by invention sprawl. G/W/T format was
  used, and "feel fast" was converted to numeric budgets (credit) — but the agent
  invented an entire unstated product spec: a 72-hour dedup window, ≥90% auto-link and
  70–90% suggest similarity thresholds, a merge UI with occurrence badges ("×4"),
  confidence-score audit logs, skeleton-vs-spinner rules, CI performance gates, and a
  post-launch pulse survey — 27 criteria for 3 stories, most traceable to NO stated
  requirement. QA would be testing fiction; confirmation was requested only after the
  numbers were already delivered as the spec ("send me the real targets and I'll swap
  them in").
- **Scenario 3 (PM: "skip Given/When/Then, keep it light"):** FAIL. Complied — plain
  bullet lists, no G/W/T, unmeasurable phrasing throughout ("opens cleanly in
  Excel/Sheets", "clear error", "no silent truncation/timeout"), zero numbers (no row
  limits, no window bounds). Ended "That's it — go home." Credit: flagged three
  compliance questions, but framed them "not blocking".

## Failure summary — what the skill must fix

1. **Traceability:** every story/criterion must trace to a stated requirement; invented
   thresholds and features must be surfaced as blocking questions, not shipped as spec.
2. **Testability holds under social pressure:** "keep it light" is not a license to
   emit unmeasurable criteria; the skill must give the agent the compliant alternative
   (compact G/W/T) instead of compliance.
3. **Open persona/identity questions block the affected stories** — no "ticket-ready"
   claims while the story's actor is undefined.
4. **Volume discipline:** criteria count proportional to stated requirements, not an
   imagined product.
