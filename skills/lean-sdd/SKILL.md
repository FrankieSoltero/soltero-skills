---
name: lean-sdd
description: Use when executing an implementation plan with subagents in the current session and wall-clock or token cost matters — pipelined subagent-driven development: fresh implementer per task, read-only reviewer running CONCURRENTLY with the next disjoint task's implementer, risk-tiered review depth (mechanical → spec-only on a cheap model), a 3-round fix-loop cap with adjudication, file-based brief/report/diff handover, and a compaction-proof ledger with fixed line formats. Lean variant of superpowers:subagent-driven-development; consumes the dependency/risk-tier table from soltero-skills:lean-plans. Never runs two writers on overlapping files.
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

**Model policy — no dispatch inherits the session model.** The controller
session orchestrates on fable; fable is never dispatched. Every dispatch names
its model explicitly: **opus** for engineering (standard/judgment implementers,
judgment reviews, the final whole-branch review), **sonnet** for grunt work
(mechanical implementers, standard FULL reviews), **haiku** for reading and
summarizing (SPEC_ONLY reviews, scoped re-reviews). An omitted model silently
inherits fable — the most expensive model — for work a cheaper tier owns.

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
   depends only on completed tasks and its files are disjoint from every
   in-flight write, dispatch its implementer NOW. Queue this task's fix
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
- **After round 3 with findings still open: STOP dispatching.** Adjudicate
  each finding yourself: reviewer wrong or contestable → park with ruling;
  real but nothing downstream builds on it → park with ruling, routed to the
  final review; real and load-bearing (a later task builds on it, or it
  reveals a plan defect) → BLOCKED, report to the human with the finding and
  fix history. Every ruling is a ledger line; silent discards are forbidden.
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
| "Tests pass — skip the review" | The implementer's tests are its own claim. A leaf defect discovered after the next task builds on it costs a rewrite, not a fix. |
| "One more round will converge" | Round 3 already had fresh eyes and a model bump. Past it the failure is structural — adjudicate. |
| "It's a two-line fix, faster to do it myself" | Controller fixes ship unreviewed and pollute coordination context. Dispatch or park. |
| "Mechanical task — skip review entirely" | The compiler can't check exact names, extra exports, or README rows. SPEC_ONLY on haiku is nearly free. |
| "My improvised report/ledger format is equivalent" | It dies at compaction and the next session can't parse it. The contract exists so recovery is mechanical. |

## Red Flags — STOP

- Two writers whose file sets overlap, or any implementer staging `-A`/`.`
- A review verdict pending while the next disjoint task sits undispatched
- Dispatching fix round 4
- Editing source files yourself mid-execution
- A reviewer dispatched without a diff file, or a diff built from `HEAD~1`
  (silently drops all but the last commit — use the recorded BASE)

---

*Derived from superpowers:subagent-driven-development (MIT, © 2025 Jesse
Vincent). Keeps its review independence, ledger recovery, and adjudication
protocol; changes: pipelined dispatch, 3-round fix cap, risk-tiered review
depth.*
