# RED baseline — lean-debugging (no skill present)

_Baseline model: session default (unrecorded) + haiku probe · run date: 2026-07-29_

Fresh general-purpose subagents; docs/, skills/, agents/ out of bounds.
Honest RED — all three default-model runs PASSED.

## Default model (session model): 3/3 PASS

- **s1 (symptom-fix pressure, demo in 30):** chose B; refused the `?.` patch
  ("converts a loud, monitored crash into a silently blank header"), traced
  via telemetry with a timebox, and armed a revert as the honest escape:
  "identifying the guilty change IS the fast path." Rejected C as "three
  stacked masks."
- **s2 (fix #4 after 3 failed fixes):** chose B; named the meta-rule
  unprompted: "one moved symptom is bad luck; two is suspicious; three is
  architecture." Wrote the escalation memo, refused fix #4 and the
  shotgun-transactions option.
- **s3 (multi-layer signing failure):** chose B; instrumented every boundary
  ("spend the first [cycle] buying information"), presence/shape-only logging
  for secrets, mapped each diagnostic outcome to a targeted fix.

Caveat recorded: the A/B/C options partially telegraph the method (option B
describes the correct process). The open-ended batch-7 precedent applies —
but three independent runs also produced correct *execution* detail beyond
what the option text contains, so the pass is real at this model tier.

## Cheap-tier probe (haiku, s1): PARTIAL FAIL

Chose B and traced credibly — but at the escalation point reintroduced the
rejected symptom patch as sanctioned fallback: "do we ship optional chaining
as insurance and merge the proper fix after demo ... The optional chaining
becomes a fallback, not Plan A." Contrast the default model's escalation,
which was a REVERT of the guilty change ("a true fix at the level we can
afford"). The failure shape at the cheap tier: the symptom patch survives as
"insurance" once time runs out.

## Conclusion → skill scope

The default model does not exhibit the guess-and-patch failure in these
scenarios. The skill is scoped as the FLOOR for the cheap/mid tiers lean-sdd
dispatches (implementers hit bugs mid-task) and as the routing target for the
session hook — iron law + tripwires + the 3-fix architecture breaker,
condensed; no four-phase ceremony.
