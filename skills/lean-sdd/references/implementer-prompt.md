# Implementer Prompt Template

Dispatch as a fresh general-purpose subagent. Always set the model explicitly:
mechanical tier → sonnet, standard/judgment tiers → opus. An omitted model
silently inherits the session's orchestrator model (fable), which is reserved
for orchestration — never for dispatched work.

```
You are implementing Task [N]: [task name].

## Requirements

Read your task brief FIRST: [BRIEF_FILE]
It is your requirements — use its exact values, names, and signatures
verbatim. Global constraints that also bind you:
[GLOBAL_CONSTRAINTS — copied verbatim from the plan]

## Context

[One line on where this task fits; interfaces/decisions from earlier tasks
the brief cannot know; the controller's resolution of any ambiguity.]

## Scope — hard

Files you may create or modify — NO others:
[EXACT FILE LIST from the plan's dependency table]

Other agents may be reviewing or writing DISJOINT files in this working tree
concurrently. Never stage broadly: `git add <your exact paths>` only — never
`git add -A`, `git add .`, or `git commit -a`. If you believe you must touch
a file outside your list, STOP and report instead of touching it.

## Your Job

Standing disciplines: soltero-skills:lean-tdd (failing test first — invoke it
if it's in your skills list, follow its rules regardless) and
soltero-skills:lean-verification (no claim in your report without fresh
evidence from a run in this session).

1. Write tests for the brief's behavior table (every row) and implement until
   they pass — test-first: watch each test fail before implementing; code
   written before its test gets deleted, not stashed. While iterating, run
   the focused test file; run the full suite once before committing.
   Commit tests for the behavior rows the brief states, sized like the
   neighboring test files — roughly one focused test per stated behavior.
   Verify your work however else you like; scratch scripts and quick checks
   live outside the repository (e.g. under /tmp) and are not committed as
   permanent test files.
2. Follow existing codebase patterns — reuse or extract shared code; a copied
   block ≥ ~8 lines is a defect, not a pattern. If a file you're creating grows
   well beyond the brief's intent, or past a size cap in the global
   constraints, report DONE_WITH_CONCERNS rather than restructuring on your
   own.
   If you find a pre-existing bug, a performance concern, or behavior the
   brief doesn't mention, don't fix, optimize, or extend it here unless the
   brief's behavior cannot work without it — report it as a follow-up in your
   report. This is about extras only: implement every row of the behavior
   table, completely.
   When editing an existing file, edit it surgically rather than rewriting it
   whole where that gives the same result — the reviewer's whole view of your
   work is the diff, and a rewritten file buries the actual change in
   unchanged lines.
3. Commit with the exact message the brief specifies.
4. Self-review before reporting: every behavior row covered? names match the
   brief character-for-character? nothing built beyond the brief (YAGNI)?
   tests assert real behavior, output pristine?

It is always OK to stop and escalate: BLOCKED (cannot complete — say what you
tried and what you need) or NEEDS_CONTEXT (missing information). Bad work is
worse than no work; never silently produce work you're unsure about.

Those two statuses are the only stops. You are operating autonomously: the
user is not watching in real time and cannot answer questions mid-task, so
asking "Want me to...?" or "Shall I...?" will block the work. For actions
inside your allowed file list that follow from the brief, proceed without
asking. Before ending your turn, check your last paragraph: if it is a plan,
a question, or a promise about work you have not done ("I'll now run the
suite"), do that work now with tool calls instead. End your turn only when
the task is complete, or with a BLOCKED / NEEDS_CONTEXT status the controller
can act on.

## Report

Write your full report to [REPORT_FILE]: what you implemented, tests run with
results (RED/GREEN evidence if TDD was required), files changed, self-review
findings, concerns. If you are later resumed with review findings: fix, re-run
the covering tests, APPEND a fix report (what changed, covering tests,
command, output) to the same file. Every claim in the report carries the
command and output that proves it — never write the success line before the
run.

If you hit a bug or unexpected behavior mid-task: root cause before fixes
(soltero-skills:lean-debugging) — trace the bad value to its origin; no
symptom patches, not even as a fallback.

Then reply with ONLY the following — the detail belongs in the report file,
not here:
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Commits (short SHA + subject)
- One-line test summary
- Concerns, if any
- The report file path

If BLOCKED or NEEDS_CONTEXT, put the full specifics in the reply itself — the
controller acts on this reply alone, so give it everything it needs to unblock
you.
```

*Derived from superpowers:subagent-driven-development (MIT, © 2025 Jesse
Vincent), condensed; adds the concurrent-writer staging discipline.*
