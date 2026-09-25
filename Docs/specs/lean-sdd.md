# Skill Spec — lean-sdd

- **Problem:** Executing a multi-task plan with subagents is wall-clock dominated by
  serialization and oversized loops. superpowers:subagent-driven-development runs strictly
  serial (implement → review → fix → re-review per task, one at a time) even when the next
  task touches disjoint files and the reviewer is read-only — so reviewer latency is pure
  dead time. Its fix loop budget is 5 rounds, sized for weak implementers; with capable
  models a loop that hasn't converged by round 3 is structural. And every task gets a full
  two-verdict review on a capable model, even mechanical ones (renames, config,
  transcription-adjacent work) whose quality the final whole-branch review would catch
  anyway. Baseline agents without any skill are worse: they skip reviews entirely, fix
  findings in the controller context, or keep no recovery ledger.
- **Trigger:** Use when executing an implementation plan with subagents in the current
  session and the user wants the fast pipeline (lean variant of
  superpowers:subagent-driven-development; consumes lean-plans' dependency table).
- **Scope / non-goals:** Controller-side execution process: fresh implementer per task;
  pipelined dispatch — reviewer(N) runs concurrently with implementer(N+1) when the plan's
  dependency table shows disjoint files — where "disjoint" means the union of declared
  paths AND the artifacts each brief's install/migrate/generate/snapshot steps write, so
  shared mutable state (lockfile, migrations directory + lock, generated client, shared
  dev DB, cache) counts as file overlap even when every declared path differs; risk-tiered
  review (mechanical → spec-compliance-only on a cheap model; standard/judgment → full
  two-verdict review); fix loop capped at 3 rounds (round 3 = fresh implementer on a more
  capable model), where the cap ends the loop but never accepts the work — a still-red
  signal at exhaustion (failing covering test, BLOCK verdict, live reproduction) reverts
  the task's commits or returns it to lean-plans for replanning, and adjudication-to-park
  is reserved for disagreement about a green artifact;
  progress ledger + report/brief/diff handed over as files, never pasted. Keeps SDD's
  load-bearing parts: don't-trust-the-report reviewer stance, breaker adjudication with
  ledger rulings, final whole-branch review on the most capable model with ONE fix wave.
  Non-goals: does not write plans (lean-plans), does not replace human merge decisions,
  never runs two implementers concurrently on overlapping files.
- **Success scenario:** Mid-execution, task 2's implementer reports DONE and the plan's
  dependency table shows task 3 touches disjoint files: the agent dispatches task 2's
  reviewer AND task 3's implementer in the same message, queues task 2's fix dispatch
  behind the review verdict, reviews the mechanical task 4 as spec-only on a cheap model,
  and at a round-3 non-converging loop stops dispatching: if the covering tests still
  fail it reverts the task's commits (or returns the task to lean-plans) with a ledger
  line, and only if the artifact is green and the dispute is a judgment call does it
  adjudicate and park — never looping to round 5.
- **Bundled assets:** `references/implementer-prompt.md`, `references/task-reviewer-prompt.md`
  (with spec-only mode), `references/re-review-prompt.md`; `scripts/sdd-workspace`,
  `scripts/task-brief`, `scripts/review-package`. Derived from
  superpowers:subagent-driven-development (MIT, © 2025 Jesse Vincent).
