---
name: prd-user-stories
description: Use when writing or reviewing the user-stories / acceptance-criteria section of a PRD, or on standalone asks like "write user stories for X" or "add acceptance criteria to these stories" — produces stories that trace to stated requirements with Given/When/Then criteria a tester could execute verbatim, instead of inventing personas, thresholds, and features the PRD never stated or dropping testability because someone asked to "keep it light". Child skill of soltero-skills:writing-prds (which invokes it for section 4).
---

# PRD User Stories & Acceptance Criteria

## Overview

Two observed failure modes: (1) **invention sprawl** — asked for criteria on three
stories, the default output invents a whole product (dedup windows, similarity
thresholds, badges, audit logs, CI gates) traceable to no stated requirement, so QA ends
up testing fiction; (2) **testability collapse** — told "keep it light, skip the formal
stuff", the default complies and ships unmeasurable bullets ("opens cleanly", "feels
fast", "clear error"). This skill makes traceability and testability non-negotiable.

## The Rules

1. **Trace everything.** Every story maps to a stated requirement (cite it: R1, R2…);
   every criterion maps to its story. A criterion that needs a feature, threshold, or
   behavior nobody stated is not a criterion — it's a question. Move it to a
   **Blocking questions** block at the TOP of the deliverable.
2. **Personas come from the PRD or the user — never from you.** One validated persona
   means stories for one persona. If a requirement implies an actor that isn't
   validated ("a user" — which user?), that requirement's stories are BLOCKED on the
   answer; write the blocked marker, not generic "As a user…" filler.
3. **Given/When/Then, always** — even when asked to keep it light. The compliant
   alternative to "nobody reads the formal stuff" is *compact* G/W/T (one line per
   criterion), not adjective bullets. Every Then is observable: a number, a state, an
   exact message — never "fast", "clean", "clear", "gracefully", "near-real-time".
4. **Numbers are sourced or proposed — before delivery, not after.** If a criterion
   needs a threshold nobody gave (latency budget, retry count, window), either ask
   first or mark it `(proposed — confirm)` inline. Never deliver invented numbers as
   the spec with "swap them in later" at the bottom.
5. **No "ticket-ready" claims over open questions.** If your own deliverable contains a
   blocking question, the affected stories are explicitly NOT ready, and you say so.

## Quick Reference

| Smell in your draft | Fix |
|---|---|
| "As a user…" with no validated persona | Block the story; ask who the actor is |
| A threshold you chose (72h, 90%, 500ms) | `(proposed — confirm)` or ask first |
| A capability no requirement states (merge UI, audit log) | Blocking question, not a criterion |
| "feels fast / clean error / gracefully degrades" | Replace with observable bound or exact behavior |
| 8+ criteria on one small story | You're speccing, not testing — cut to what the requirement states |
| "These gaps aren't blocking" | If the actor/threshold is unknown, they are |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "PM said skip Given/When/Then, so vague bullets are what they want." | They asked for brevity, not untestability. Compact G/W/T is both. |
| "Complete means covering everything the feature will obviously need." | Complete means covering what the requirements state. The rest is the PM's call. |
| "I flagged my invented numbers as assumptions, so it's fine to ship them." | Flag-and-proceed makes fiction the spec. Sourced or `(proposed — confirm)` — and blocking gaps go on top. |
| "QA is blocked; anything testable-looking unblocks them." | QA testing invented behavior is worse than QA waiting one question's time. |

## Red Flags — STOP

- You wrote a persona the PRD doesn't contain.
- A criterion contains a number and you can't cite where it came from.
- You're about to comply with "drop the formal criteria" instead of offering compact G/W/T.
- Your questions section is at the bottom and labeled "not blocking".
