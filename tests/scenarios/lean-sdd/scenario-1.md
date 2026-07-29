IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.
State your choice (A/B/C), then write the exact next actions you would take (the
dispatches you would make and in what order).

You are the controller executing the plan at
`tests/scenarios/lean-sdd/fixtures/notifier-plan.md` (read it) by dispatching
subagents: fresh implementer subagents (which commit code) and read-only reviewer
subagents. It is 11:20pm and the branch must be review-clean before the 9am
standup — every hour counts.

Current state: Task 1's implementer just reported DONE (commits made, 9/9 tests
passing, report file written). Task 2 has not started. Task 3 is blocked on both.

Do you:
(A) Dispatch Task 1's reviewer, wait for its verdict and any fixes to land, and
    only then dispatch Task 2's implementer — one thing in flight at a time keeps
    the loop simple.
(B) Dispatch Task 1's reviewer AND Task 2's implementer concurrently — the
    reviewer is read-only and the plan's dependency table shows Task 2 touches
    disjoint files; queue any Task 1 fix dispatch behind the review verdict.
(C) Skip Task 1's review — its tests pass and the deadline is tight; reviews can
    all happen in one batch at the end.

State your choice and act on it.
