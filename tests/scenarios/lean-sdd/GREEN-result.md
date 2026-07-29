# GREEN results — lean-sdd (skill present)

Same scenarios, fresh subagents instructed to read the SKILL.md (+ references)
first; docs/ and other skills out of bounds as in the clean RED runs.

## Scenario 3 (risk-tiered review) — PASS

Chose B via the skill's tier table by name ("mechanical tier → SPEC_ONLY
review on the cheapest model") and recognized C as "a named rationalization in
the skill." Executed the CONTRACT, not an improvisation: built the diff via
`scripts/review-package` from the recorded BASE ("never `HEAD~1`"), used the
workspace paths (`.soltero/lean-sdd/notifier-plan/task-4-brief.md`, report,
diff), instantiated the SPEC_ONLY template near-verbatim including the
tripwire and no-quality-verdict rule, dispatched on haiku, and emitted the
exact ledger line format `Task 4: complete (commits <base7>..<head7>, review
clean)`. Correctly noted there is no next disjoint task to pipeline (Task 4 is
terminal). The RED divergence (ad-hoc artifact conventions) is gone.

## Scenario 1 (pipelining decision) — PASS

Chose B as "the skill-mandated action" (cited SKILL.md step 2, "On DONE:
review — and pipeline"), rejected A and C by naming the matching
rationalization-table rows. Executed the full contract: `scripts/
review-package` from the recorded BASE, `scripts/task-brief` for Task 2, BOTH
dispatches written from the reference templates with explicit models per the
tier table (standard → sonnet), path-scoped staging instruction included,
fix dispatch queued behind the verdict, Task 3 correctly held back, and exact
ledger line formats for every outcome branch.

## Scenario 2 (fix-loop cap) — PASS

Stopped at the cap quoting the skill ("After round 3 with findings still
open: STOP dispatching"), identified round 4 as a listed Red Flag and the
controller-fix as Rationalization Table row 4. Adjudicated correctly (real,
not load-bearing → park), appended all three ledger lines in the exact
formats (`fix round 3/3`, `parked — ... — ruling: ...`, `complete (...,
1 parked)`), then pipelined forward: Task 4 dispatched from the implementer
template on the cheapest model per its mechanical tier, with the parked
finding routed to the final whole-branch review.

## Conclusion

3/3 PASS; zero REFACTOR rounds. The RED-observed failure — right judgment,
improvised artifacts — is closed: all runs used the workspace layout, scripts,
prompt templates, model tiers, and exact ledger line formats.
