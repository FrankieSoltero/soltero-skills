# GREEN results — mini-game-craft (skill present)

Methodology: RED passed 3/3 exceptionally, so GREEN verifies skill-following
and NON-DEGRADATION (the risk of adding guidance atop a strong baseline).
2 runs (s1 mechanics, s3 art).

## s1 — PASS, no degradation; contract visibly followed and value added

Named all three failure classes up front; produced an apex-by-cadence TABLE
(4.19 → 3.40 rows, "run is unwinnable" at dt=0.1); quoted the class-over-
instance rule in its own design note ("clamping GAP_MAX would patch the
instance and leave the class open"); every regression test annotated
"KILLS: <old line>" and RUN against the pre-fix module (7/8 fail old, 8/8
pass new, original 10 unchanged); dt-varying cadence tests per contract
rule 3; migration flags for the two new state fields per rule 5; and it
preemptively closed the accumulator-merge race class from the reference in
its own new code. Terminal-velocity clamp doing double duty (sub-step travel
< GAP_MIN) is an improvement beyond the RED run.

## s3 — PASS

Art contract followed exactly: label-hashed sub-seeds per concern, width-safe
1:1 substitution preserving the render contract, contrast enforced in code
AND fuzz-tested over 500 seeds, theme derived once per session, run-length
spans, engines untouched with the suites-pass-unchanged proof obligation
stated, no-migration note (theme re-derived from seed), and the honest flag
that gameplay Math.random (spec §3.4) is deliberately out of scope.

2/2; zero REFACTOR rounds. Batch totals: RED 3/3 honest passes (real-code
fixtures), GREEN 2/2 with the contract landing and no degradation.
