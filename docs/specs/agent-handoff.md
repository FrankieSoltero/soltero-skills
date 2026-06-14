# Skill Spec — agent-handoff

- **Problem:** When a long session ends or context fills up, the next session/agent re-derives
  everything from scratch — losing decisions, rationale, and where work stopped. A general agent
  asked to "hand off" writes a vague summary that omits the *why* behind decisions, exact
  file/line locations, open questions, and how to resume/verify — so a fresh agent cannot
  actually continue cleanly.

- **Trigger:** Use when context is getting heavy (the bundled `context-watch` hook reminds around
  ~40%), when wrapping up a long/complex session, or when explicitly asked to hand off / "save
  state" / "continue in a fresh session."

- **Behavior:** Read the existing `HANDOFF.md` and **UPDATE the living doc** (don't recreate it),
  then fill an in-depth, actionable hand-off from the **actual current state**: goal & current
  task; status (done / in-progress / blocked); key decisions **+ the why**; ordered next steps;
  critical files **with line refs**; gotchas/constraints; open questions; and exact
  how-to-resume-&-verify. Write to `HANDOFF.md` at the repo root (or a stated path). The bar:
  **a fresh agent can resume with zero further questions.**

- **Scope / non-goals:** Produces/maintains the hand-off artifact for the *next agent* — not a
  conversational recap for the user. Not a context-compaction tool (that's the harness). Pairs
  with, but is independent of, the trigger hook.

- **The trigger (bundled, opt-in):** `hooks/context-watch.mjs` — a `UserPromptSubmit` hook that
  estimates context from the transcript file and, at/over a configurable threshold (default 40%),
  injects a reminder to run this skill. Window + threshold are env-configurable. **Honest
  caveats:** Claude Code has no native context-% trigger; the estimate is approximate
  (transcript size ÷ ~4), and the hook *reminds* (injects `additionalContext`) rather than
  *forces*. De-duped to nudge once per ~10% band per session, not every turn.

- **Success scenario:** Mid-way through a multi-step migration, context nears the threshold; the
  hook reminds; the skill writes `HANDOFF.md` capturing exactly what's done, the next 3 steps with
  file/line refs, the key decision (and why), and the verify command. A fresh session reads it and
  continues without re-asking anything. A baseline agent would have written a 3-bullet summary
  missing the why, the line refs, the open questions, and the resume steps.

- **Bundled assets:** `templates/HANDOFF.md` (the structure), `hooks/context-watch.mjs` (the
  trigger), `reference.md` (hook setup, threshold config, JSON output contract, caveats).
