# Corrections Ledger — Shared Contract

`Docs/corrections-ledger.md` is a **shared contract**: other skills read and write this
exact format to reason about compiled rules across sessions and PRs. Do not add, rename,
reorder, or omit fields, and do not record proposals anywhere else.

## File skeleton (when creating the ledger)

```markdown
# Corrections Ledger

Compiled rules: deterministic enforcement artifacts derived from repeated corrections.
One entry per rule. Statuses: proposed | approved | installed | retired.
```

## Entry template (one per compiled rule)

```markdown
## CC-NNN — <short imperative title>

- **Category:** <short class, e.g. code-quality | data-safety | database-safety>
- **Trigger Origin:** <which corrections triggered it: dates + one line each>
- **Scope:** <where the rule applies, e.g. "All Bash tool invocations">
- **Constraint:** <the enforced behavior, stated precisely>
- **Rationale:** <why deterministic enforcement rather than memory>
- **Added:** <YYYY-MM-DD>
- **Traced-To:** <pointers to the specific corrections/lessons, e.g. Docs/mistakes-and-fixes.md entries 2026-07-03, 2026-07-14>
- **Enforcement:** <hook|lint|ci> — <exact artifact + where installed, e.g. "hook — PreToolUse Bash matcher in .claude/settings.json">
- **Status:** <proposed | approved | installed | retired> <(who/what approved, date — required for approved/installed)>
```

## Rules of the contract

- **Rule ID** is `CC-` + zero-padded sequence (`CC-001`, `CC-012`). IDs are stable
  forever: refinements keep the ID; a retired ID is never reused.
- **Status lifecycle:** `proposed → approved → installed`, with `retired` reachable from
  any state. Only a human moves an entry past `proposed`; the Status line records who
  approved and when (e.g. `installed (approved by F. Soltero, 2026-07-05)`).
  Refining an installed rule sets its Status back to `proposed` (and notes that the
  previously approved version remains installed until re-approval).
- **Refine in place:** when a correction shows a rule is too broad or too narrow, edit
  that entry — sharpen Constraint, extend Trigger Origin and Traced-To. Keep the
  original Added date (the refinement date shows up in Trigger Origin). Never add an
  overlapping entry beside it; more-specific rules subsume more-general ones.
- **Traced-To must resolve:** every pointer must name a real lesson entry, session, or
  PR. If the lessons log entry doesn't exist yet, capture it first (`capture-lesson`),
  then point at it.

## Worked example

```markdown
## CC-004 — migrations only, never db push

- **Category:** database-safety
- **Trigger Origin:** User corrections on 2026-07-03 and 2026-07-14 (prisma db push wiped shared dev schema)
- **Scope:** All Bash tool invocations
- **Constraint:** Block any Bash command invoking `prisma db push` (any package-runner prefix).
- **Rationale:** CLAUDE.md rule existed before the second incident and did not prevent it; a PreToolUse hook is deterministic.
- **Added:** 2026-07-17
- **Traced-To:** Docs/mistakes-and-fixes.md entries 2026-07-03, 2026-07-14
- **Enforcement:** hook — PreToolUse Bash matcher in .claude/settings.json (drafted JSON in this entry's proposal, install via update-config)
- **Status:** proposed
```
