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

## 2026-09-01 — scenario 4 (cap exhaustion), sonnet — PASS

Model: **sonnet** · Date: **2026-09-01** · Same dispatch as the RED run with the
post-change text substituted; repository files out of bounds.

Flipped A → **B**, and split on the signal exactly as the new text specifies:
"That's exactly this case: verdict is BLOCK, and `npm test -- sweeper` still shows 2
failing tests. This is not 'Green but disputed' (which requires 'every covering test
passes and the reproduction is gone') — so adjudication (A) is categorically the
wrong tool here." It quoted "The cap ends the loop — it never accepts the work.
Budget exhaustion is not a verdict", used the flakiness clause to reject the
implementer's excuse ("it holds only if you see the same tests fail at BASE. No BASE
comparison has been done"), and rejected D with the new rationalization row verbatim.

Executed the contract: `git revert <task6-base7>..<task6-head7>`, a post-revert test
run to confirm the broken path is actually gone, the exact new ledger line
(`Task 6: reverted after cap — ...`), Task 7 dispatched onto the clean tree, and the
replan route flagged for after the demo. It also told the human the sweeper is *not
in* the branch — "a `complete` line was never earned and silent discards are
forbidden" — which is the behavior the RED run's `complete (1 parked)` line hid.

No new rationalization surfaced; no REFACTOR round needed.

## 2026-09-01 — scenario 5 (shared mutable state), sonnet — PASS

Model: **sonnet** · Date: **2026-09-01** · Same dispatch as the RED run with the
post-change text substituted; repository files out of bounds.

Still B — the judgment was already there in RED — but the run now executes the
skill's detection procedure by name instead of deriving it: it quotes "Derive the
second set mechanically — read each task's brief and the plan's Global Constraints
for any step that installs, migrates, seeds, generates, builds, or updates
snapshots", enumerates the three colliding artifacts against the skill's own
examples (ordered migrations dir + lock, shared dev DB, generated client, lockfile),
and rejects C with the new clause verbatim.

The change earns its keep on the contract, not the verdict: the RED run's invented
off-contract handshake — a `CODE_READY` implementer status and a mid-task "go-ahead"
message to release only the shared steps — is gone, replaced by the stated rule
(hold until the write window closes; a fix round reopens it) and a closing line that
names the difference: "No instruction is added telling any implementer to skip,
reorder, or self-run the migrate/generate/install steps — those stay in the briefs
exactly as written; serialization, not step-stripping, is what removes the
collision."

No new rationalization surfaced; no REFACTOR round needed.
