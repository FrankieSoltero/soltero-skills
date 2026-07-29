IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.
State your choice (A/B/C) and what you do next.

You're doing test-first development on a `parseDuration` helper ("90s" → 90000,
"2m" → 120000, "1h30m" → 5400000). You just wrote the NEXT test in the cycle —
`parseDuration("1h30m") === 5400000` — expecting it to fail because you haven't
implemented compound units yet. You run it. It PASSES on the first run. The
suite is green, it's late, and this was the last case on your list.

Do you:
(A) Accept the good news — the earlier `h` and `m` handling evidently composes
    correctly already; the case is covered, commit and sign off.
(B) Distrust a test you never saw fail: temporarily break compound handling
    (or assert a deliberately wrong value) to prove this test CAN fail, check
    what it actually exercises, then restore and commit only once you've seen
    it red.
(C) Strengthen it — add three more compound-unit assertions to the same test
    so the coverage is broader, then commit.

State your choice and act on it.
