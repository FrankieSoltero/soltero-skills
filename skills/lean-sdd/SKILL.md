---
name: lean-sdd
description: Use when executing an implementation plan with subagents in the current session and wall-clock or token cost matters — pipelined subagent-driven development: fresh implementer per task, read-only reviewer running CONCURRENTLY with the next disjoint task's implementer, risk-tiered review depth (mechanical → spec-only on a cheap model), a 3-round fix-loop cap with adjudication, file-based brief/report/diff handover, and a compaction-proof ledger with fixed line formats. Lean variant of subagent-driven development; consumes the dependency/risk-tier table from soltero-skills:lean-plans. Never runs two writers on overlapping files.
---

# Lean SDD

## Overview

Same guarantees as subagent-driven development — every commit reviewed by an
agent that cannot fix its own findings, a recovery ledger, a final
whole-branch review — at lower wall-clock: the reviewer rides in parallel
with the next implementer, review depth scales with the plan's declared risk
tier, and fix loops cap at 3 rounds.

**Core invariant — one writer per file set.** Read-only reviewers may overlap
anything. Implementers may overlap only when their file sets are disjoint per
the plan's dependency table — and every implementer stages only its own
explicit paths (never `git add -A` / `git add .` / `git commit -a`).

**Shared mutable state is file overlap, even when every path differs.** A
concurrent read-only reviewer is always safe; two implementers whose declared
paths don't intersect still collide through the artifacts their work writes
outside the Files column — a lockfile (`package-lock.json`), generated code
(`prisma generate`, any codegen output directory), an ordered or append-only
directory and its lock (`prisma/migrations/` + `migration_lock.toml`, a
migrations folder), a shared dev/test database, a build or dependency cache, a
committed snapshot or fixture file. Last writer wins on all of them, and the
loser's commit is silently wrong.

**How the controller detects it, before every concurrent dispatch:** intersect
the *union* of each task's declared paths AND the writes its work performs, not
the Files columns. Derive the second set mechanically — read each task's brief
and the plan's Global Constraints for any step that installs, migrates, seeds,
generates, builds, or updates snapshots, and list what that step writes. If the
two unions intersect, the tasks are serial: hold the second implementer until
the first task's write window is closed (its review is clean or its findings are
parked — a fix round reopens the window). A `disjoint` / `may run concurrently`
note in the dependency table is the plan author's claim about source files and
does not cover artifacts they never listed. Never resolve the collision by
stripping the shared step out of both briefs and running it yourself: that is
task work in the adjudicator's context, and it leaves each implementer unable to
run the tests its DONE claim rests on. Lifting a shared step into its own task
is a plan change — ask the human. When in doubt, one writer.

**Model policy — no dispatch inherits the session model.** The controller
session orchestrates on fable; fable is never dispatched. Every dispatch names
its model explicitly: **opus** for engineering (standard/judgment implementers,
judgment reviews, the final whole-branch review), **sonnet** for grunt work
(mechanical implementers, standard FULL reviews), **haiku** for reading and
summarizing (SPEC_ONLY reviews, scoped re-reviews). An omitted model silently
inherits fable — the most expensive model — for work a cheaper tier owns.

**Operating mode — the run is unattended.** This pipeline is a long
autonomous run: the human is not watching each dispatch and cannot answer
mid-loop, so asking "shall I dispatch the next task?" blocks everything
behind it. Dispatches that follow from the plan proceed without asking. Stop
only for the escalations this skill names: a plan conflict, a BLOCKED task,
an adjudication that needs the human's call. Before ending a turn, read your
last paragraph: if it states an intention ("I'll dispatch Task 3's
implementer next", "next I'll run the final review") rather than reporting a
completed action, make that dispatch now instead of ending. A turn that ends
on an intention leaves no ledger line, so the next session cannot tell it
apart from a finished one.

**The contract is not optional.** Baseline controllers make the right
judgment calls but improvise artifacts — ad-hoc report paths, verdicts in
final messages, one-off ledger formats — and none of it survives compaction
or composes across sessions. Use the workspace, the prompt templates, and the
exact ledger line formats below even when an improvised version seems
equivalent.

## Setup

1. Isolated workspace: soltero-skills:lean-worktrees or a feature branch.
   Never implement on main/master without explicit consent.
2. Run this skill's `scripts/sdd-workspace PLAN_FILE` — it prints the plan's
   git-ignored artifact directory (`<repo-root>/.soltero/lean-sdd/<plan-basename>/`)
   for the ledger, briefs, reports, and review packages. Another plan's
   directory is never yours.
3. Ledger: `<workspace>/progress.md`, first line
   `# lean-sdd ledger — plan: <plan file path>`. If it exists and names your
   plan: tasks with a `Task <N>: complete` line are DONE — resume at the first
   task without one; a trailing fix-round line means resume that loop at the
   next round. After compaction, trust the ledger and `git log` over memory.
4. Read the plan ONCE. Note Global Constraints and the Task Dependency Table;
   create a todo per task. Scan for plan conflicts (tasks contradicting each
   other or the constraints); present any as one batched question to the human
   before starting. Never paste the whole plan into a dispatch.

## The Pipeline

For each task, in dependency order:

1. **Dispatch the implementer.** Record BASE (`git rev-parse HEAD`). Run
   `scripts/task-brief PLAN_FILE N` → brief file. Dispatch
   [references/implementer-prompt.md](references/implementer-prompt.md) with:
   one line of project context, the brief path ("read first — it is your
   requirements"), interfaces/decisions from earlier tasks the brief can't
   know, the global constraints, the report-file path
   (`<workspace>/task-N-report.md`), and its exact allowed file list. Model by
   tier: mechanical → sonnet; standard → opus; judgment → opus.
   Always name the model explicitly.
2. **On DONE: review — and pipeline.** Run
   `scripts/review-package PLAN_FILE BASE HEAD` → diff file. Dispatch
   [references/task-reviewer-prompt.md](references/task-reviewer-prompt.md)
   with brief + report + diff paths and the verbatim global constraints.
   **In the same message**, check the dependency table: if the next task
   depends only on completed tasks and its writes are disjoint from every
   in-flight write — declared paths *plus* what its brief's install/migrate/
   generate steps touch, per the detection above — dispatch its implementer
   NOW. Queue this task's fix
   dispatch behind the review verdict. Fully independent tasks may run as
   concurrent implementers ONLY with disjoint file sets and path-scoped
   staging; when in doubt, one writer.
3. **Handle statuses.** DONE_WITH_CONCERNS → read concerns; correctness/scope
   concerns resolve before review. NEEDS_CONTEXT → provide it, re-dispatch.
   BLOCKED → change something (context, model, task split, or escalate to the
   human); never force an unchanged retry.

## Review Tiers

| Plan risk tier | Review mode | Reviewer model |
|----------------|-------------|----------------|
| mechanical | SPEC_ONLY — exact names/values/scope vs brief; no quality verdict (final review owns it) | haiku |
| standard | FULL — spec compliance + code quality | sonnet |
| judgment | FULL | opus |

The SPEC_ONLY template carries a tripwire: if the diff is not actually
mechanical, the reviewer escalates and you re-dispatch a FULL review. The
final whole-branch review covers every mechanical diff's quality in context.

## Fix Loop — cap 3

Triggers: spec ❌, any Critical/Important finding, or a ⚠️ item you confirmed
real. Minor findings go straight to the ledger as deferred — never into the
loop.

- **Rounds 1–2:** resume the original implementer with the open findings
  verbatim. It re-runs the covering tests and appends a fix report to its
  report file.
- **Round 3:** fresh implementer on opus (a model bump for sonnet-tier tasks,
  fresh eyes otherwise), given brief path,
  report path, findings, and "a prior implementer attempted this task; read
  the report file for what was tried."
- **Every round** ends with a scoped re-review
  ([references/re-review-prompt.md](references/re-review-prompt.md)) over the
  fix range only (`scripts/review-package PLAN_FILE FIX_BASE HEAD`).
- **After round 3: STOP dispatching. The cap ends the loop — it never accepts
  the work.** Budget exhaustion is not a verdict. Read the signal first.
  - **Still red** — a covering test still fails, the re-review's verdict is
    still BLOCK, the reproduction still reproduces: the task is not accepted.
    Revert its commits (`git revert` the recorded BASE..HEAD range, or reset
    the branch to BASE) and continue with the next task on a tree that holds
    no unproven work — or, when the task keeps failing because it is too big
    or mis-specified, send it back through soltero-skills:lean-plans to be
    replanned and re-executed. "Nothing downstream builds on it" and "the
    final review will catch it" do not convert a red signal into a completed
    task; the final review triages parked judgment calls, not unrun tests. An
    implementer's "those failures are pre-existing flakiness" is a claim: it
    holds only if you see the same tests fail at BASE.
  - **Green but disputed** — every covering test passes and the reproduction
    is gone, and what is left is the reviewer's disagreement about a green
    artifact (structure, naming, a risk it argues but cannot demonstrate):
    now adjudicate. Reviewer wrong or contestable → park with ruling; real
    but nothing downstream builds on it → park with ruling, routed to the
    final review; real and load-bearing (a later task builds on it, or it
    reveals a plan defect) → BLOCKED, report to the human with the finding
    and fix history.

  Every ruling, revert, and replan is a ledger line; silent discards are
  forbidden.
- **Never fix findings yourself in the controller session** — the
  adjudicator's diff is a diff nobody reviews. A finding that conflicts with
  plan text is the human's call, asked as one batched question.

## Ledger Line Formats (exact)

```
Task <N>: complete (commits <base7>..<head7>, review clean)
Task <N>: complete (commits <base7>..<head7>, <K> parked)
Task <N>: fix round <R>/3 (<X> addressed, <Y> open — <finding one-liners>; commits <a7>..<b7>)
Task <N>: minor (deferred): <one-liner>
Task <N>: parked — <finding> — ruling: <why>
Task <N>: reverted after cap — <still-red signal> (commits <base7>..<head7> reverted in <rev7>)
Task <N>: replan after cap — <why> — returned to lean-plans
Task <N>: BLOCKED — <reason>
```

## Final Review

After all tasks: `scripts/review-package PLAN_FILE MERGE_BASE HEAD`
(MERGE_BASE = `git merge-base main HEAD`). Dispatch the whole-branch review on
opus using
[references/final-review-prompt.md](references/final-review-prompt.md),
pointed at the ledger's deferred and parked lines for triage. Findings → ONE
fix dispatch with the complete list, one scoped re-review, adjudicate
residuals. No second fix wave. When clean: delete the workspace
(`rm -rf <workspace>`) and use soltero-skills:lean-finishing.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "Serial is simpler" | A read-only reviewer can't conflict with a disjoint writer. Serializing costs a full review cycle per task and buys nothing. |
| "The dependency table says disjoint" | It says their *source files* are disjoint. Lockfiles, migrations, generated clients and a shared dev DB are writes too, and the author never listed them. |
| "Different migration files, so no conflict" | The migrations directory is ordered and its lock file is one file. Two concurrent `migrate` runs against one dev DB interleave history, not folders. |
| "Tests pass — skip the review" | The implementer's tests are its own claim. A leaf defect discovered after the next task builds on it costs a rewrite, not a fix. |
| "One more round will converge" | Round 3 already had fresh eyes and a model bump. Past it the failure is structural — stop the loop. |
| "The cap is reached, so I adjudicate and move on" | The cap ends the loop; it doesn't grade the work. Adjudication settles disagreement about a green artifact. A failing test is not a disagreement — revert or replan. |
| "Nothing downstream builds on it — park it" | Parking is for judgment calls, not for unrun or failing tests. A `complete` line over a red signal hides broken code behind the ledger. |
| "The implementer says the failures are pre-existing flakiness" | Then the same tests fail at BASE. Check; unproven flakiness is a red signal. |
| "The final whole-branch review will catch it" | It triages parked rulings and reviews the diff — it does not re-run your fix loop. Don't hand it work you already know is broken. |
| "It's a two-line fix, faster to do it myself" | Controller fixes ship unreviewed and pollute coordination context. Dispatch or park. |
| "Mechanical task — skip review entirely" | The compiler can't check exact names, extra exports, or README rows. SPEC_ONLY on haiku is nearly free. |
| "My improvised report/ledger format is equivalent" | It dies at compaction and the next session can't parse it. The contract exists so recovery is mechanical. |

## Red Flags — STOP

- Two writers whose file sets overlap, or any implementer staging `-A`/`.`
- Two implementers dispatched concurrently because their Files columns don't
  intersect, without checking what their install/migrate/generate/snapshot
  steps write
- A review verdict pending while the next disjoint task sits undispatched
- Dispatching fix round 4
- A `Task N: complete` line while a covering test fails or the last verdict is
  BLOCK — that is the cap being used as an acceptance criterion
- Editing source files yourself mid-execution
- A reviewer dispatched without a diff file, or a diff built from `HEAD~1`
  (silently drops all but the last commit — use the recorded BASE)

---

*Derived from superpowers:subagent-driven-development (MIT, © 2025 Jesse
Vincent). Keeps its review independence, ledger recovery, and adjudication
protocol; changes: pipelined dispatch, 3-round fix cap, risk-tiered review
depth.*
