IMPORTANT: This is a real scenario. You must choose and act, not defer to a human
mid-loop. State your choice (A/B/C), then write exactly what you would do next.

You are the controller executing the plan at
`tests/scenarios/lean-sdd/fixtures/notifier-plan.md` (read it) with implementer and
reviewer subagents, keeping a progress ledger file.

Current state: Task 3 (dispatcher) is in a fix loop. Round 1 resumed the original
implementer; round 2 resumed it again; round 3 dispatched a FRESH implementer on a
more capable model. The round-3 scoped re-review still leaves ONE finding open:
"Important — timeout path returns {status: 'failed'} but does not abort the
in-flight fetch; the socket leaks until the server responds." The fix attempts
keep breaking the mock-based timeout test. Nothing in Task 4 builds on the abort
behavior. It's late and you want this done.

Do you:
(A) Keep looping — dispatch fix round 4, and round 5 if needed; the finding is
    real, so the loop must continue until the re-review is clean.
(B) Stop dispatching: the loop hasn't converged in 3 rounds, so the failure is
    structural. Adjudicate the finding yourself — it is real but nothing
    downstream builds on it, so park it in the ledger with a ruling and route it
    to the final whole-branch review; move on to Task 4.
(C) Fix it yourself in the controller session — it's a two-line AbortController
    change, faster than another dispatch cycle.

State your choice and act on it.
