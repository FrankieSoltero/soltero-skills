---
name: correction-compiler
description: Use when the user corrects the agent for the same class of mistake a second time (evidence in Docs/mistakes-and-fixes.md and/or session history) — compiles the repeated correction into a proposed deterministic enforcement artifact (Claude Code hook, lint rule, or CI check) recorded in Docs/corrections-ledger.md with full provenance, and never installs or modifies anything that executes without explicit human approval.
---

# Correction Compiler

## Overview

A correction the user has to repeat is a failed memory, not a reminder to write a firmer
one. CLAUDE.md lines and lesson entries are soft memory the model can ignore under
context pressure; hooks, lint rules, and CI checks are deterministic. On the **second**
correction for the same class of mistake, stop strengthening prose and compile the
correction into a proposed enforcement artifact — recorded in the shared ledger, gated on
explicit human approval.

## When to Use

- The user corrects you and `Docs/mistakes-and-fixes.md` (or this session's history)
  shows a prior correction for the same class of mistake — that's ≥2; compile it.
- A new correction shows an existing ledger rule is too broad or too narrow.

## When NOT to Use

- First occurrence of a mistake → `capture-lesson` (log it; do not compile a rule
  speculatively — rules are added reactively, after observed repetition).
- Writing settings.json itself → the harness's `update-config` skill owns the write
  mechanics. This skill decides WHAT to propose and keeps the audit trail.

## The Loop

1. **Confirm the repeat.** Find the prior correction(s) in `Docs/mistakes-and-fixes.md`
   and/or session history. No second occurrence → stop; just capture the lesson.
2. **Check the ledger first.** Read `Docs/corrections-ledger.md` (create from
   `references/ledger-format.md` if missing). If an existing rule already covers this
   class but misfired, **refine that rule in place** — same Rule ID, sharpen the
   Constraint, extend Traced-To, set Status back to `proposed` — never add an
   overlapping rule beside it. More-specific rules subsume more-general ones.
3. **Draft the artifact.** Choose hook, lint rule, or CI check (see
   `references/enforcement-artifacts.md`) and draft it exactly (hook JSON, lint config
   diff, or CI step).
4. **Record it in the ledger** using the exact entry format in
   `references/ledger-format.md` — this format is a shared contract other skills
   consume; do not improvise proposal files, script-header comments, or prose notes in
   the lessons log instead. Status: `proposed`.
5. **Present for approval and STOP.** Show the human the drafted artifact, the ledger
   entry, and what it will block. Install only after they approve; record who approved
   in the ledger (`approved` → then `installed`, with install delegated to
   `update-config` for settings.json writes).

## The Approval Gate Is Physical, Not a Label

**You never approve your own artifact.** Hooks run arbitrary shell; a human approves
anything that executes. And the gate is about *what runs*, not what the ledger says:

- Until a human approves, make **no write** to anything that executes: settings.json
  hooks, hook scripts, lint config, CI config, git hooks. Setting Status to `proposed`
  while also editing the hook script IS installing unapproved enforcement.
- When refining an installed rule, the **old approved version keeps running** until the
  refinement is approved. Draft the new hook/script alongside (in the ledger entry or a
  clearly-not-wired file); do not touch the live one.
- Keep the blast radius to one rule: never reroute or rewrite another rule's installed
  enforcement as a side effect of refining this one.
- Keep proposal changes out of the user's urgent change set — don't bundle ledger/
  artifact drafts into a commit they asked for, and don't commit at all unless asked.

## Quick Reference — ledger entry fields

| Field | Content |
|-------|---------|
| Rule ID | `CC-NNN`, stable forever; refinements keep the same ID |
| Category | short class, e.g. `code-quality`, `data-safety` |
| Trigger Origin | which corrections triggered it (dates + one line each) |
| Scope | where the rule applies |
| Constraint | the enforced behavior, precisely |
| Rationale | why deterministic enforcement, not memory |
| Added | YYYY-MM-DD |
| Traced-To | pointers to the specific corrections/lessons that justify it |
| Enforcement | `hook`\|`lint`\|`ci` + where installed |
| Status | `proposed` \| `approved` \| `installed` \| `retired` (+ who/what approved) |

Full entry template and worked example: `references/ledger-format.md`.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I'll add a firmer CLAUDE.md line this time." | Prose already failed once for this exact mistake. Compile it. |
| "'Make sure this never happens again' counts as approval." | That approved the goal, not this artifact. The human must see the actual hook/rule. |
| "settings.local.json is local/reversible, so it doesn't count." | It still executes. Less visible is worse, not better. |
| "I set Status to proposed, so I'm compliant." | If you also edited the hook/script/config, you installed it. The gate is about what runs. |
| "I'll write the proposal as a comment in the script / a note in the lessons log." | Other skills consume the ledger contract. Use the exact format, in `Docs/corrections-ledger.md`. |
| "The old rule is approved — safer to leave it and add CC-00N beside it." | Overlapping rules drift apart. Refine in place, same ID, back to `proposed`. |

## Red Flags — STOP

- About to write to settings.json, a hook script, lint config, CI config, or
  `.git/hooks/` and no human has approved this artifact → STOP.
- About to create a one-off proposal file or append the proposal to
  `Docs/mistakes-and-fixes.md` instead of the ledger → STOP, use the ledger format.
- About to add a rule whose Constraint overlaps an existing Rule ID → STOP, refine that
  rule in place.
- About to mark a ledger entry `approved` yourself → STOP. Only a human approval, and
  the entry records who.
