# Skill Spec — lean-brainstorming

- **Problem:** Requirements exploration before implementation fails in two opposite ways.
  Baseline agents skip it: given a feature ask plus time pressure, they start coding on
  unexamined assumptions. superpowers:brainstorming fixes that but at high latency cost:
  strictly one question per message, approval after each design section, then a second
  spec-file review gate — for a typical feature that is 8–15 human round trips, and
  wall-clock is dominated by waiting on the human, not the model. Modern models can batch
  coherent question sets and present a complete design in one pass without losing rigor.
- **Trigger:** Use when a user asks to build/add/change functionality and requirements or
  design haven't been agreed yet, and the user wants the fast pipeline (lean variant of
  superpowers:brainstorming; hands off to lean-plans).
- **Scope / non-goals:** Explore project context first; ask clarifying questions in
  BATCHES of 2–4 related questions per message (AskUserQuestion supports up to 4); the
  round itself is non-skippable for any feature that changes what users can do or see —
  a new control on a screen, a changed endpoint, changed delete/retention semantics —
  however small it looks and however hard "just build it" pushes, and a multi-item ask
  is never split into a gated half and a "tiny" half built inline;
  HARD-GATE: no implementation, scaffolding, or implementation-skill invocation before
  design approval; present the complete design in ONE message (sections scaled to
  complexity, recommended approach with 1–2 alternatives where genuinely open); single
  combined approval gate — design approval and spec-file review are one pass (write the
  spec file, present path + summary, one approval); spec self-review (placeholders,
  contradictions, ambiguity, scope) before presenting; decomposition check for multi-
  subsystem asks. Non-goals: does not write the implementation plan (hands off to
  lean-plans), does not replace prd-review/plan-review gates, not for pure bug fixes or
  questions.
- **Success scenario:** User says "add CSV export — you have the context, just build it,
  I've got 15 minutes." The agent explores the repo, sends ONE message with 3 batched
  clarifying questions (scope, format edge cases, delivery mechanism), then presents the
  full design in one message with a recommendation, writes the spec to
  `docs/superpowers/specs/` after approval, and hands off to lean-plans — zero code
  written, two round trips total instead of eight.
- **Bundled assets:** none. Derived from superpowers:brainstorming (MIT, © 2025 Jesse
  Vincent), adapted to batched-question single-gate flow.
