# GREEN result — prd-user-stories (skill present)

Date: 2026-07-23. Fresh general-purpose subagents (model: sonnet, same tier as RED), one
per scenario, instructed to read `skills/prd-user-stories/SKILL.md` first. All three
scenarios PASS with section citations.

- **Scenario 1 (single validated persona):** Fixed the flag-and-proceed failure. US-1
  explicitly BLOCKED on the actor question (no generic "As a user…" filler shipped as
  final), blocking questions at the TOP, status summary says which stories are and are
  not ticket-ready, every criterion G/W/T with observable Thens, the one invented
  mechanism marked `(proposed — confirm)`. RED contrast: baseline wrote generic
  submitter stories anyway and called everything "ticket-ready".
- **Scenario 2 (QA acceptance criteria):** Fixed invention sprawl. Dedup semantics,
  similarity thresholds, team-scope boundary, and field lists moved to Blocking
  Questions instead of being specced; explicitly refused the "QA is blocked, anything
  unblocks them" pressure by name; latency numbers marked proposed; criteria blocked
  where unwritable ("cannot be written until Q1.2 is answered"). RED contrast: baseline
  invented a 27-criterion product spec (72h windows, 90% thresholds, merge UI).
- **Scenario 3 ("skip Given/When/Then"):** Did not comply — delivered compact G/W/T
  ("compact Given/When/Then is the fast version of this, not the skipped version"),
  marked the section NOT ready over the unresolved hard-vs-soft-delete question, and
  kept criteria counts proportional (3–4 per story). RED contrast: baseline shipped
  adjective bullets and "That's it — go home."

No new rationalizations observed. No REFACTOR round needed.
