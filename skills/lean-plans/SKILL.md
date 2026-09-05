---
name: lean-plans
description: Use when turning an approved spec or design into an implementation plan for multi-step or subagent execution ("write the plan", after lean-brainstorming approval) and wall-clock matters — produces a contract-level plan (exact interfaces, behavior tables, exact values, and a dependency/risk-tier table the executor uses to parallelize and tier reviews) with code in the plan only where exactness is the requirement. Lean variant of the plan-writing step; plans shrink ~3× because implementation and test FILES stay the implementer's job. Executed by soltero-skills:lean-sdd; gate with soltero-skills:plan-review before executing.
---

# Lean Plans

## Overview

A plan is a set of contracts, not the codebase written in markdown. A
fresh-context implementer needs exactly four things per task: which files,
exact interfaces, exact behavior, and how to verify. Give them those
completely — and nothing else. Capable implementers write better code than a
plan author can transcribe (plan-authored code ships unreviewed and
unexecuted); what they cannot do is guess a signature, a constant, or a header
name. **Exactness lives in contracts, not code volume.**

## What a Plan IS (the recipe)

Start from [references/plan-template.md](references/plan-template.md). Every
plan has exactly these parts, in order:

1. **Header:** goal (one sentence), architecture (2–3 sentences), tech stack,
   and how tests are run.
2. **Global Constraints:** the spec's project-wide exact values, verbatim,
   ONCE. Every task implicitly includes this section — never re-paste it into
   tasks. Where the repo declares limits of its own — a max file size (e.g.
   `.code-optimizer.yml` `max_file_lines`), a duplication tool and threshold
   (e.g. `jscpd`) — quote them here as constraints, naming the file that
   declares them; write "none declared" when the repo declares none. A limit
   the plan never states is a limit nobody downstream applies.
3. **Task Dependency Table:** one row per task — files touched, depends-on,
   risk tier. This table is the executor's scheduling and review-depth input;
   it must agree with the task blocks' file lists. Risk tiers:
   - **mechanical** — renames, barrel exports, config/doc rows; a compiler or
     exact-string check catches failure
   - **standard** — single-module logic with a clear contract
   - **judgment** — multi-module integration, concurrency, design discretion
4. **Task contract blocks**, one per task:
   - **Files:** create/modify/test, exact paths.
   - **Interfaces:** *consumes* (from earlier tasks, signatures verbatim) and
     *produces* (what later tasks rely on — exact names, parameter and return
     types). A task's implementer sees only its own task; this block is how
     they learn what neighbors expect.
   - **Reuse / extract:** when the task adds a screen, module, or route
     alongside an existing sibling, name by exact path the shared components,
     hooks, and styles it reuses — and, where that shared code still sits
     inline in the sibling, the EXTRACT-first task it depends on. Never
     "mirror `<sibling>`" or "same structure as `<sibling>`": a fresh-context
     implementer reads that as "copy it", and a copy is what the plan gets.
   - **Behavior table:** case | input/state | expected. Every spec requirement
     touching this task appears as a row.
   - **Exact values:** magic constants, header/error strings, golden vectors,
     external API shapes — the things an implementer must never derive.
   - **Verify:** exact command + expected outcome.
   - **Commit:** the commit message.

## The Code Rule

Code appears in a plan ONLY where exactness IS the requirement:

- golden values and magic constants — the VALUES, not the test file around them
- external API request/response shapes
- a genuinely tricky algorithm's core (≤ ~15 lines) that a behavior table
  cannot pin

Everything else — implementation bodies AND test files — is the implementer's
job. "The tests are the executable spec" is true of their *content*, not their
*form*: a behavior table plus exact expected values pins the same contract at
a fraction of the authoring cost, and the task review catches test gaps. A
plan that transcribes test files (or computes golden vectors by running code
at planning time beyond the few values that need pinning) has moved
implementation into the planning phase, where nothing can execute or review it.

## No Execution Process in the Plan

The plan states WHAT plus the dependency facts. Scheduling (waves, parallel
dispatch), review procedure, fix loops, and model choice belong to the
executor — soltero-skills:lean-sdd reads the dependency table and risk tiers
and decides. Writing "dispatch A and B in parallel, then review R-A…" into the
plan duplicates, and then drifts from, the executor's process.

## Self-Review (run yourself before saving; fix inline)

1. **Spec coverage:** every spec requirement maps to a behavior-table row or
   exact value in some task. List gaps; add tasks.
2. **Interface consistency:** names and signatures in later tasks' *consumes*
   match earlier tasks' *produces* character-for-character.
3. **Table agreement:** the dependency table's files and depends-on match the
   task blocks.
4. **Placeholder scan:** no "add validation", "handle edge cases", "similar to
   Task N" — each becomes a behavior row or an exact value.
5. **Code-rule scan:** any code block that isn't a golden value, an API shape,
   or a ≤15-line tricky core gets converted to contract + behavior rows.
6. **Existence claims:** every "X does not exist" / "no shared Y available"
   claim is verified by LISTING the directory it would live in (`ls
   components/`, `ls hooks/`), never by one grep for one import name. A wrong
   absence claim makes the plan commission a duplicate of something the repo
   already ships.

## Handoff

Save to `docs/plans/YYYY-MM-DD-<feature>.md` (user preferences override).
Then offer, in order: gate the plan with soltero-skills:plan-review; execute
with soltero-skills:lean-sdd. Where no skill dispatch is available, the plan
still executes by hand: work the tasks in dependency order, one at a time.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Verbatim test files "so nothing is left to judgment" | Behavior table + golden values pin the contract; the test file is implementation. |
| Global constraints re-pasted into every task | State once; tasks inherit. |
| Dependency info as prose or ASCII art | The table is a machine-read contract for the executor — keep the format. |
| Missing risk tiers | Tiers drive review depth and model cost downstream; omitting them forces the executor to guess. |
| Review/wave procedure written into the plan | Executor's job. Plans carry facts, not process. |
| 5-step TDD choreography per task ("write test, run it, implement, run, commit") | One contract block; TDD is the implementer's standing discipline. |
| "Mirror the sibling screen" as the task's structural instruction | Name the shared modules it reuses by path, plus the extraction task that must precede it. "Mirror" is executed as "copy". |
| The repo's declared size cap / duplication rule missing from Global Constraints | Quote both with the file that declares them; a limit the plan omits is one no implementer or reviewer applies. |
| "Component X doesn't exist" concluded from a single grep | List the directory. A wrong absence claim buys a hand-rolled duplicate of shipped code. |

---

*Derived from superpowers:writing-plans (MIT, © 2025 Jesse Vincent),
re-scoped from code-level to contract-level granularity.*
