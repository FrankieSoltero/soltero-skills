# Dev Debrief — Report Contract

`Docs/debriefs/` is a **shared contract**: reports accrete nightly, get diffed by
humans and cadences, and feed `skill-patcher` (weekly recommendations) and
`memory-gardener` (as a gardenable surface). Do not add, rename, reorder, or omit
sections; empty sections say `None observed.` rather than disappearing. One report per
date, `Docs/debriefs/YYYY-MM-DD.md`, and the skip log — nothing else, nowhere else.

## Skip-log line (skip days write this and nothing more)

Append exactly one line to `Docs/debriefs/skip-log.md`:

```markdown
- YYYY-MM-DD — no coding signals in 24h window (<N> sessions scanned: <one clause on what they were>) — skipped: no report, no push.
```

## Daily lite report — `Docs/debriefs/YYYY-MM-DD.md`

```markdown
# Dev Debrief — YYYY-MM-DD

## What you did

- **<project>** (<n> sessions, <HH:MM>–<HH:MM>): <tasks, outcomes, commits/PRs by
  short hash + message>. One bullet block per project, every project in the window.

## Skill telemetry

| Skill | Project | Session | Trigger kind | Outcome |
|---|---|---|---|---|
| <name> | <project> | <file> (<turn/timestamp>) | user-command | completed-clean |

## Missed triggers

- **<skill>** — not invoked in <session file>; activity at <approx. turn/timestamp>
  matches its description ("<quoted trigger phrase>"). <One sentence of evidence.>
  Recommendation only — route any fix via creating-a-skill / skill-patcher.

## Workflow observations

- At most 2, each with concrete transcript evidence (session + moment). No generic
  advice; `None observed.` is the common, correct value.

## Redactions

- <placeholders applied and their kinds — e.g. "2 x <REDACTED_TOKEN>, 1 x <EMAIL>">,
  grep sweep clean. Never restate what was redacted or where the live values live.
  `None needed.` when the window carried nothing sensitive.
```

Every section, every day, in this order. The telemetry table's trigger-kind and
outcome columns are mandatory per row — one value each from the classification tables
in `scan-protocol.md` (trigger kind: `user-command` | `user-request` | `auto-match` |
`subagent`; outcome: `completed-clean` | `user-corrected` | `aborted` | `unclear`).

## Weekly deep section (Sundays, appended to that day's report)

```markdown
---

## Weekly Deep Review — YYYY-MM-DD to YYYY-MM-DD

<One line: sessions scanned, projects, portfolio size.>

### Per-skill grades

**<skill> — Grade: <A-F>** (or **<skill> — N/A**)
- Opportunities observed / times fired; trigger quality; friction events
  (fired-then-corrected), each citing session file + moment.
- N/A entries carry one line of reasoning: zero relevant opportunity observed.

### Improvement recommendations (corrections-ledger-compatible)

### Coverage-gap analysis

- Recurring work this week with no matching installed skill: named new-skill
  candidates (feeds the roadmap / session-miner). One occurrence is not a pattern;
  say so instead of inventing a candidate.
```

### Grading rubric

- **A** — fired on every relevant opportunity, completed clean, findings/output sound.
- **B–C** — fired but with friction (user corrections, partial misses) — cite each.
- **D–F** — clear opportunities missed; **F** = missed essentially all of them.
- **N/A** — zero relevant opportunity in the window. Never F, never a "fair middle"
  letter. Every A–F entry cites at least one session; a grade with no citation is
  invalid and must become evidence-backed or N/A.
- Every skill in the portfolio appears — graded or N/A. Completeness comes from N/A
  entries, not fabricated letters.

### Recommendation entry template (exact — `skill-patcher` parses this)

Rule-ID-less corrections-ledger form: the `correction-compiler` ledger contract
(`skills/correction-compiler/references/ledger-format.md`) minus the `CC-NNN` heading
ID. Field names, bolding, and order verbatim:

```markdown
## (proposed) — <target skill>: <short imperative title>

- **Category:** <short class, e.g. skill-scope | skill-coverage | skill-quality>
- **Trigger Origin:** <which observations triggered it: dates + one line each>
- **Scope:** <where it applies, e.g. "skills/<name>/SKILL.md trigger behavior">
- **Constraint:** <the recommended behavior, stated precisely>
- **Rationale:** <why, grounded in this week's evidence>
- **Added:** <YYYY-MM-DD — this report's date>
- **Traced-To:** <session files + this report's path/section — pointers must resolve>
- **Enforcement:** none — recommendation only; route via creating-a-skill / skill-patcher
- **Status:** proposed
```

No field may be dropped or renamed ("close enough" breaks the consumer). The debrief
never writes these into `Docs/corrections-ledger.md` itself — they live in the report
as input signal for `skill-patcher`'s monthly pass (Hard Rule 3).
