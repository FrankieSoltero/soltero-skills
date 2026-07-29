# Implementer Prompt Template

Dispatch as a fresh general-purpose subagent. Always set the model explicitly
(per the SKILL.md tier table — an omitted model silently inherits the
session's most expensive one).

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
2. Follow existing codebase patterns. If a file you're creating grows well
   beyond the brief's intent, report DONE_WITH_CONCERNS rather than
   restructuring on your own.
3. Commit with the exact message the brief specifies.
4. Self-review before reporting: every behavior row covered? names match the
   brief character-for-character? nothing built beyond the brief (YAGNI)?
   tests assert real behavior, output pristine?

It is always OK to stop and escalate: BLOCKED (cannot complete — say what you
tried and what you need) or NEEDS_CONTEXT (missing information). Bad work is
worse than no work; never silently produce work you're unsure about.

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

Then reply with ONLY (under 10 lines):
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Commits (short SHA + subject)
- One-line test summary
- Concerns, if any
- The report file path

If BLOCKED or NEEDS_CONTEXT, put the specifics in the reply itself.
```

*Derived from superpowers:subagent-driven-development (MIT, © 2025 Jesse
Vincent), condensed; adds the concurrent-writer staging discipline.*
