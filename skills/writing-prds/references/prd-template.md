# PRD Template — `docs/prds/YYYY-MM-DD-<topic>-prd.md`

Draft sections IN ORDER, one at a time, getting a "looks right?" after each. Scale each
section to its real complexity — a few sentences is fine; padding is not. Every specific
(number, tool name, persona, date) is either user-supplied or marked
`(proposed — confirm)`.

```markdown
# <Product/Feature> — PRD

**Status:** Draft | In review | Approved
**Owner:** <the human decision-owner — never "TBD" at approval time>
**Date:** YYYY-MM-DD

## 1. Problem
What hurts today, for whom, with what evidence. No solution language here.

## 2. Users
Validated user groups only. Unvalidated groups are listed under Open Questions,
not here.

## 3. Goals
The outcomes this exists to cause. 3–5 max, each traceable to the Problem.

## 4. User Stories & Acceptance Criteria
Delegate to soltero-skills:prd-user-stories. Every story traces to a requirement;
every criterion is Given/When/Then testable.

## 5. Scope & Prioritization
Delegate to soltero-skills:prd-scoping. MoSCoW table + an explicit **Out of scope**
list. If the ask bundles independent subsystems, this section records the
decomposition decision instead of absorbing the bundle.

## 6. Requirements
Numbered (R1, R2, …), each testable, each traceable to a Goal. Functional and
non-functional (security, privacy, compliance, performance) — non-functional
requirements state their bound, not an adjective.

## 7. Success Metrics
Delegate to soltero-skills:prd-success-metrics. Baseline + target + timeframe +
measurement source per metric; 3–5 primary.

## 8. Open Questions & Decisions Log
Blocking questions live here until answered, each with its owner. Answered ones
move up into the doc and get a one-line decision entry (date, decider, choice).

## 9. Out of the PRD's hands
Explicit pointer: technical design → superpowers:brainstorming, after approval.
```
