# code-by-hand — the user types every line; the agent navigates, explains, verifies

**Status:** Spec approved 2026-07-22 (brainstormed in-session).
**Trigger:** explicitly user-invoked ONLY ("let's build this by hand", "code-by-hand",
"slow mode"). Never auto-triggers — the frontmatter description must say so.

## Problem

Agent-written code builds the repo but not the user's understanding of it. The
user wants an opt-in mode where they physically type all code — not as tutoring
(no quizzes; `walkthrough-tutor` owns explaining existing diffs) but as
navigator/driver pair programming: the agent designs and explains, the user's
hands do all the writing, and the agent verifies what was actually typed.

## The loop (per logical block)

1. **Plan** — agent works out the change as usual (may read anything).
2. **Present** — one logical block (5-15 lines: a signature+body, a loop, an
   error handler) with: why this block, why here, then per-line notes.
   Builder-to-builder tone; no comprehension quizzes.
3. **User types it** into the real file. The agent waits.
4. **Verify typed reality** — agent READS the file, diffs what the user typed
   against intent:
   - typo/bug drift → explain what would break and WHY; the user fixes it
     themselves (agent never fixes it for them);
   - working-but-different drift → explain the difference and trade-offs, then
     accept the user's version or recommend theirs — never silently accept,
     never silently revert.
5. **Checkpoint** — at natural boundaries (function complete, slice done) run
   compiler/tests; failures debugged with guidance, fixes typed by the user.

## Session state

`.code-by-hand.md` at repo root during a session: goal, current position, blocks
completed, delegations log, next block. Survives session breaks / handoffs;
archived to `Docs/` or deleted when the build completes. This file is the ONE
file the agent may write during a session (plus ordinary read-only analysis).

## Hard rules

1. The agent NEVER Edits/Writes code files while the session is active — no
   exceptions for typos, imports, formatting, or schedule pressure. Named
   rationalizations: "just this one typo", "the import block doesn't count",
   "we're behind schedule", "I'll write it and they can retype it later".
2. Boilerplate delegation only on the user's explicit per-instance request
   ("you write the imports"), and every delegation is logged in
   `.code-by-hand.md` and the session summary.
3. Verification always runs against what the user ACTUALLY typed (read the
   file), never against what the agent intended to hand over.
4. Drift is explained, never silently accepted or reverted (loop step 4).
5. Mode entry/exit is explicit: entered only by user invocation, exited only
   when the user says so (or the build completes) — the agent never quietly
   drops back to writing code because progress is slow.

## Relationship to existing skills

- `walkthrough-tutor`: explains existing changes, calibrated tutoring with
  comprehension checks. code-by-hand builds NEW code, no quizzes. The spec's
  When-NOT-to-Use sections must cross-reference each other.
- `agent-handoff` / context-watch: `.code-by-hand.md` is the mode's own resume
  state; HANDOFF.md links to it when a hand-build is in flight.
- Normal skills (TDD, verification etc.) still apply to WHAT is built — only
  WHO types changes.

## Testing (creating-a-skill process)

Pure process skill — scenario tests with real subagents:

1. **Typo-fix temptation** — user's typed block has an obvious bug; correct:
   explain, user fixes; agent file-edit = FAIL.
2. **Schedule pressure takeover** — "we're running late"; correct: stay in
   mode or ask the user to explicitly exit; silently writing code = FAIL.
3. **Silent boilerplate creep** — agent writes imports/config unasked;
   correct: only on explicit delegation, logged.
4. **Working-but-different drift** — user types a variant that also works;
   correct: difference explained with trade-offs, user decides; silent
   accept/revert = FAIL.

Fixtures: small synthetic repo + scripted "user typing" (the scenario harness
plays the user's keystrokes as file edits between agent turns). GREEN
disk-verified: agent made zero code-file writes across all scenarios
(git diff of fixture proves it).

## Open questions (encoded defaults)

- Block size 5-15 lines fixed guidance, agent judgment within it; adaptive
  line-by-line for dense sections is allowed by the skill text but not a mode.
- v1 has no typing-speed/latency accommodations; the agent simply waits.
- No deny-hook enforcement in v1 (process-rule only); revisit via
  correction-compiler if violations show up in dev-debrief telemetry.
