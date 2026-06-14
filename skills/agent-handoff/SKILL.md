---
name: agent-handoff
description: Use when context is getting heavy (the bundled context-watch hook reminds around ~40%), when wrapping a long session, or when asked to hand off / save state / continue in a fresh session — writes and refreshes a living HANDOFF.md with the eight elements that make work resumable (goal, status, decisions+why, ordered next steps, files with line refs, gotchas, open questions, how to resume & verify) so a fresh agent continues with zero further questions.
---

# Agent Handoff

## Overview

A hand-off is not a recap — it's a **resume packet**. The bar: a fresh agent reads `HANDOFF.md`
and continues with **zero questions to the human**. Maintain a **living** `HANDOFF.md` (update
it; don't recreate it from scratch each time).

## When to Use

- The context-watch hook reminded you (~40%), or context is otherwise getting heavy.
- Wrapping up a long/complex session, or asked to "hand off / save state / continue fresh."

## When NOT to Use

- A quick conversational recap for the human (this writes an artifact for the *next agent*).
- Context compaction (that's the harness, not this).

## The eight required elements — a hand-off missing any is NOT done

| Element | Rule |
|---------|------|
| **Goal & current task** | What we're ultimately doing + the specific task in flight |
| **Status** | done / in-progress (**say exactly where it stopped**) / blocked |
| **Decisions + WHY** | Every locked-in choice **with its rationale** — so the next agent doesn't re-litigate or reverse it |
| **Ordered next steps** | Numbered, concrete, actionable — never "continue the work" |
| **Files with LINE REFS** | `path/to/file.ts:120-160` for every touchpoint — **a bare filename is not enough** |
| **Gotchas / constraints** | The non-obvious traps a fresh agent will hit |
| **Open questions** | Surface unresolved items — **never claim "nothing left to decide" when gaps exist** |
| **Resume & verify** | Exact commands + expected output, branch/PR, spec/plan paths |

## How

1. **Read the existing `HANDOFF.md`** (repo root, or a stated path) and update it — don't recreate.
2. **Fill every element from the ACTUAL state** — open the files and cite real line numbers, state
   the real verify commands. No vibes, no invented placeholders.
3. **Self-check before finishing:** could a fresh agent resume with zero questions to the human?
   If not, find the gap and fill it. Start from `templates/HANDOFF.md`.

## The auto-trigger (opt-in)

The bundled `hooks/context-watch.mjs` (a `UserPromptSubmit` hook) estimates context from the
transcript and, at/over a threshold (default 40%, configurable), injects a reminder to run this
skill. See `reference.md` to enable and tune it. Honest caveat: Claude Code has no native
context-% trigger — the estimate is approximate and the hook *reminds*, it doesn't *force*.

## Red Flags — STOP

- Naming files without line refs → add `path:line-range`. "Find the seed code" is not a hand-off.
- Writing "no open questions / no further investigation needed" when unknowns exist → surface them.
- Recording a decision without its WHY → the next agent re-litigates or reverses it.
- A status with no "where it stopped," or next steps with no verify command → not resumable.
- Recreating `HANDOFF.md` from scratch instead of updating the living doc.
