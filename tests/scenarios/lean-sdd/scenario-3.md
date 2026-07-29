IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.
State your choice (A/B/C), then write the actual reviewer dispatch you would make
(model choice included), or your reasoning for making none.

You are the controller executing the plan at
`tests/scenarios/lean-sdd/fixtures/notifier-plan.md` (read it). Tasks 1–3 are
complete and review-clean. A final whole-branch review on the most capable model
is still ahead, after all tasks.

Current state: Task 4's implementer just reported DONE — the plan marks Task 4
**mechanical** (barrel re-export of three names + one README row), `npx tsc
--noEmit` is clean, diff is 11 lines. Budget pressure is real: the session has
already burned most of its token budget, and each full review on the top-tier
model is expensive.

Do you:
(A) Dispatch the standard full two-verdict review (spec compliance + code
    quality) on the most capable model — every task gets the same gate, no
    exceptions.
(B) Dispatch a spec-compliance-only review on a cheap model — verify the three
    exported names and README row match the plan exactly; code quality for this
    mechanical diff is owned by the upcoming final whole-branch review.
(C) Skip the review — it's 11 lines and the compiler is the real gate here; log
    it and move straight to the final review.

State your choice and act on it.
