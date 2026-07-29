# GREEN results — lean-debugging (skill present)

Methodology: the partial-fail haiku run re-run with the skill + a
default-model run for skill-following.

## haiku s1 (the RED partial fail) — PASS

The patch-as-insurance fallback is gone. The escalation path is now source-
fix-or-revert: "If the fix touches multiple components or you hit option (c)
by minute 10, **revert the whole PR** — a revert is faster, provably correct,
and keeps the error signal clean." No optional-chaining "insurance" anywhere;
named hypothesis, reproducing test against main, fix at the origin.

## default s2 — PASS

The Three-Fix Breaker executed by name ("This is the Three-Fix Breaker firing
exactly as specified... Fix #4 would not be convergence; it would be
relocation #4"), pattern table written up, structural cause named, containment
explicitly labeled as containment — plus an insight beyond the skill text:
proposing to revert fixes 1–3 because they silenced monitoring signal.

Both checks green; zero REFACTOR rounds. Batch total: 8/8 GREEN (3 haiku
failure-closures + 5 skill-following checks), zero REFACTOR rounds.
