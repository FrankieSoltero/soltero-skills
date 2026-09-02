# RED baseline — lean-plans (no skill present)

_Baseline model: unrecorded (July 2026 default) · run date: 2026-07-29_

Fresh general-purpose subagents, session-default model, scenario text only.
Recorded verbatim (key excerpts); honest RED — passes recorded as passes.

## Scenario 2 (vague-pressure: "three bullets, ten minutes") — baseline PASS

The agent resisted the vagueness pressure and produced a contract-level plan:
three tasks + verify, exact values inlined ("capacity **20**, refill **5
tokens/second**"), exact export names, per-task verification commands, explicit
"Tasks 1 and 2 are independent (run in parallel); Task 3 depends on both", and
pushed back on the team lead:

> "Stripping those lines wouldn't make the plan leaner, it would make the
> executors re-derive (and guess wrong on) capacity 20 / refill 5, the
> `sha256=` prefix, and the exact export names the spec locks down."

No verbatim implementation code was included; behavior was expressed as test
requirements. This is essentially the target output. Notable gaps vs the
target format (minor): no explicit risk-tier column, dependency info in prose
rather than a table, shared constraints "repeated inside each task" (duplication
the Global Constraints header exists to avoid).

## Scenario 1 (bloat-pressure: "write out every line of code") — PARTIAL FAIL

The agent resisted transcribing the IMPLEMENTATION — and pushed back on the
lead with a principled argument: "If I write out every implementation line and
instruct implementers to transcribe without judgment, then any bug I write
becomes a bug nobody is permitted to catch — we'd be shipping unreviewed,
unexecuted code with the safety net explicitly removed."

But the bloat pressure landed on the tests instead: all three test files were
written out verbatim in the plan ("transcribe the test file below exactly as
written. Do not modify it"), ~200 lines of test code for a 3-module feature,
and the agent computed golden HMAC vectors at PLAN time by running Node crypto
— plan authoring doing implementation-phase work. Writing full test files is a
large share of the implementation effort; behavior tables plus the exact-value
vectors (the one part where exactness genuinely matters) would pin the same
contract at a fraction of the authoring cost, with the reviewer gate catching
test gaps. Rationalization observed: "the tests are the executable spec" —
true of their CONTENT (cases + expected values), used to justify their FORM
(verbatim transcription files).

## Pattern summary (all three scenarios)

Capable models no longer fail toward vagueness — s2 and s3 resisted vague-
pressure and produced contract-level plans unprompted, and s1 resisted
implementation transcription. What remains broken:

1. **Residual bloat lands on tests** (s1): verbatim test files under "make it
   bulletproof" pressure, plan-time golden-vector computation.
2. **No stable format contract**: 0/3 runs produced risk tiers; dependency
   info appeared as a table (s1), prose (s2), and ASCII art (s3); s2 duplicated
   global constraints into every task; s3 embedded ad-hoc review/fix-loop
   process INTO the plan (execution process belongs to the executor skill).
   lean-sdd's baseline runs showed the dependency-table + risk-tier format is
   load-bearing for pipelining and tiered review — so format consistency is
   the plan-side failure that costs execution-side speed.

Skill scope, per this evidence: a positive format recipe (header + dependency/
risk table + task contract block with behavior tables), the code-only-where-
exactness-matters rule stated to cover TESTS as well as implementation, and
"no execution process in the plan" — not prohibitions on vagueness the
baseline no longer exhibits.

## Scenario 3 (orchestrator/parallel framing) — baseline PASS

Strong output: explicit execution waves ("Wave 1: Tasks A and B run in
parallel", "no shared files, no imports between them"), a pinned-interfaces
contract block ("interfaces are pinned in the plan so fresh-context Task C never
needs to read wave-1 conversations"), per-task gates with exact commands, and
reviews deliberately scheduled off the critical path ("R-A/R-B are deliberately
scheduled alongside C to keep only one review on the critical path... two
implementation slots of wall-clock time instead of three"). Behavior expressed
as numbered test requirements, not implementation code. Minor gaps vs target
format: no risk tiers, review/fix-loop process invented ad hoc in the plan
(that belongs to the executor skill), ASCII DAG instead of a table lean-sdd
can parse mechanically.
