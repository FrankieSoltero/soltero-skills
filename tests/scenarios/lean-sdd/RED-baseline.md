# RED baseline — lean-sdd (no skill present)

Fresh general-purpose subagents, session-default model, scenario text only.
Recorded verbatim (key excerpts); honest RED — passes recorded as passes.

## Scenario 1 (pipelining decision) — baseline PASS

Chose B without hesitation: "Dispatch Task 1's reviewer **and** Task 2's
implementer concurrently; queue any Task 1 fix dispatch behind the review
verdict... The reviewer is read-only, so it cannot contend with anything. There
is exactly one writer in flight. That is not a risk I am accepting, it is the
absence of a risk." Rejected C emphatically ("Passing tests are evidence the
implementer's own tests pass — they are not evidence the implementation matches
the plan"). Added an unprompted, correct mitigation: implementers must stage
only their own explicit paths, "Never `git add -A` or `git add .`". Also
pipelined further downstream (Task 3 implementer ∥ Task 2 reviewer once
interfaces are pinned).

Important context: the agent repeatedly cited the fixture plan's dependency
table as what made B safe ("the plan author already did this analysis and wrote
the conclusion down on line 26"). The dependency-table plan format is
load-bearing for this behavior — evidence for lean-plans' format contract as
much as for baseline competence.

(This first run predated the contamination discovery in s2/s3; its transcript
shows no spec citations and scenario+fixture-only reads, but a clean rerun with
docs/skills/agents out of bounds was executed anyway — result below.)

## Scenario 1 (rerun, clean) — baseline PASS

Chose B again: "a read-only reviewer cannot conflict with a writer in a
different file set... it spends a whole review cycle of wall clock before Task
2 even starts." Named the real invariant unprompted: "The real hazard... is
two implementers writing the same working tree at once... exactly one writer
in flight at any moment. That is the invariant I hold, not 'one thing in
flight.'" Also pinned the review range before dispatching the next writer
(BASE..T1_HEAD) so the concurrent commits can't drift under the reviewer, and
repeated the explicit-staging rule ("Never use `git add -A` or `git commit
-a`").

## Pattern summary (all three scenarios, clean runs)

3/3 judgment PASSES — given a plan carrying a dependency table and risk tiers,
baseline agents already pipeline reviewer∥implementer, tier reviews by
declared risk, and stop non-converging loops at round 3 with a ledger ruling.
Two conclusions bind the GREEN skill:

1. **The judgment is not the failure; improvisation of the contract is.**
   Every run invented its own artifact conventions — verdict-in-final-message
   vs report files, ad-hoc paths (`.sdd/reviews/`, `.sdd/task-4/`,
   `<task-1-report-path>`), divergent ledger formats, reviewer prompts written
   from scratch each time. None of that survives compaction or composes across
   sessions/models. The skill's job is the CONTRACT: workspace layout, brief/
   report/diff-file handover, exact ledger line formats, reusable prompt
   templates with the tripwires the baselines each half-invented — plus the
   policies (pipelining invariant, tier table, cap 3) stated once so cheaper
   models and future sessions behave like these baselines did.
2. **Both contaminated first runs read `docs/specs/lean-sdd.md` and applied it
   correctly** — evidence the written policy is followable, discarded as
   baseline evidence per the Iron Law.

## Scenario 2 (fix-loop cap) — first run CONTAMINATED, discarded

Opened with: "I read the scenario, the plan fixture, and the governing spec at
`docs/specs/lean-sdd.md` (fix loop capped at 3 rounds... then adjudicate)" —
the run answered from the skill's own spec, not from baseline judgment.
Discarded; re-run dispatched with docs/, skills/, agents/ out of bounds.

## Scenario 2 (rerun, clean) — baseline PASS

Chose B: "stop dispatching, adjudicate, park with a ruling, move on to Task 4.
... three rounds is the signal, not the finding... Option A repeats an
experiment whose variables are exhausted." Refused the controller fix: "the
controller writing implementation code destroys the separation that makes the
reviewer's sign-off meaningful (the fix would ship unreviewed)." Wrote a full
ledger ruling with fix history, blast radius, downstream check, and routing to
the final whole-branch review — and self-derived the cap policy: "cap scoped
fix loops at 3 rounds when round 3 already included a fresh implementer +
model upgrade; after that, adjudicate."

Divergence worth noting: across runs, agents invented incompatible artifact
conventions ad hoc — one instructed reviewers "return your verdict in your
final message — do NOT write a report file," another routed reports to
`.sdd/reviews/<file>.md`, ledger paths and formats differed per run. Judgment
is fine; the artifact contract (workspace layout, report/brief files, ledger
line format that survives compaction) is improvised differently every time.

## Scenario 3 (risk-tiered review) — first run CONTAMINATED, discarded

The first run chose B but opened with: "grounded the decision in this repo's
own spec for the skill being exercised (`docs/specs/lean-sdd.md`), which
defines the review policy" — it found and read the lean-sdd spec on disk, so
the run tests the spec, not the baseline. Discarded per repo precedent
(code-by-hand batch 3 discarded 2 contaminated rounds). Re-run dispatched with
docs/, skills/, agents/ out of bounds; result below.

## Scenario 3 (rerun, clean) — baseline PASS

Chose B: "spec-compliance-only review on a cheap model", dispatched on haiku,
quality explicitly deferred: "defer code quality on this diff to the final
review that already owns it." Rejected C with the right argument ("`tsc
--noEmit` proves the re-exports resolve, but it proves nothing about
completeness or exactness... README isn't compiled at all"). Key quote tying
the behavior to the plan format: "the review gate should scale with the
declared tier — **that's the point of tiering tasks in the plan** rather than
deciding ad hoc under budget pressure." As with scenario 1, the fixture plan's
risk-tier column is load-bearing: the agent executes tiering well when the plan
declares tiers.
