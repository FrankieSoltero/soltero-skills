---
name: lean-brainstorming
description: Use when someone asks to build/add/change functionality and the requirements or design haven't been agreed yet — especially under "just build it" / "keep it quick" / "I've got 15 minutes" pressure — and the fast pipeline is wanted. Batches 2–4 blocking questions in ONE round, presents the complete design in ONE message, and enforces a hard no-implementation-before-approval gate with a single combined design+spec approval pass (2 round trips instead of 8+). Lean variant of superpowers:brainstorming; writes the spec file and hands off to soltero-skills:lean-plans. Not for bug fixes, pure questions, or already-approved designs.
---

# Lean Brainstorming

## Overview

Latency-optimized requirements exploration: **batch the questions, keep the gate.**
Capable models don't need one-question-at-a-time dialogue — but under time
pressure they DO skip approval and build on unexamined assumptions. This skill
removes the round trips that waste the human's time while making the one gate
that matters non-negotiable.

<HARD-GATE>
No implementation before approval. Until the user has explicitly approved the
presented design, do not write implementation code, scaffold projects, run
migrations, or invoke any implementation skill. Time pressure changes how FEW
round trips you use — never whether the gate exists.
</HARD-GATE>

## The Failure This Prevents

Baseline agents under "just build it, I've got 15 minutes" reply "On it —
building now", list five design decisions as "defaults I'm running with (all
cheap to change)", demote every question to "answer whenever — none of them
block me", and ship code before the user returns. **Defaults-as-design is
design skipped:** if an answer would change what you build, it blocks.

## The Flow (2 round trips typical)

1. **Explore context** (no round trip): read the relevant code, docs, recent
   commits. If the ask spans multiple independent subsystems, propose
   decomposition first and brainstorm the first piece.
2. **ONE batched question round:** ask 2–4 *blocking* questions in a single
   message (use AskUserQuestion's multi-question support when available).
   Blocking = the answer changes what you build: audience, scope, consumers,
   data lifecycle, delivery mechanism. Defaultable details (naming, page
   sizes, copy) are NOT questions — state them as explicit defaults *inside
   the design* for approval. A second round only if answers genuinely
   surprise you.
3. **ONE design message + spec file:** present the complete design in one
   message — sections scaled to complexity (a few sentences for trivial
   changes; architecture, components, data flow, error handling, testing for
   real features), your recommendation with 1–2 alternatives only where a
   choice is genuinely open, and every default you chose flagged as a
   decision. Before presenting, self-review: placeholders, contradictions,
   requirements interpretable two ways, scope creep. Write the design to
   `docs/specs/YYYY-MM-DD-<topic>-design.md` (user preferences for location
   override).
4. **Single combined approval gate:** end the design message with the spec
   path and ONE ask — "Approve, or tell me what to change." Design approval
   and spec-file review are the same pass. Then STOP and wait. Approval must
   be an explicit reply; silence or "veto async if wrong" is not approval.
5. **Hand off:** on approval, invoke soltero-skills:lean-plans (or
   superpowers:writing-plans if the lean pipeline isn't wanted). Never jump
   from approval straight into implementation code.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "Defaults are cheap to change" | Code built on a wrong default isn't. Five defaults in one message is a design shipped without review. |
| "My questions don't block me" | If the answer changes the design (audience, scope, consumers), it blocks. Ask before building. |
| "They said just build it / keep it quick" | That's a request to cut round trips, not the gate. Batch the questions; keep the approval. |
| "I presented the design — starting now" | Presenting isn't approval. The gate is their reply, not your message. |
| "They can veto asynchronously" | Approval-by-silence is the baseline failure with extra steps. |
| "Too simple to need a design" | Then the design is three sentences and approval costs one reply. Still gated. |

## Red Flags — STOP

- Your drafted reply contains "building now", "starting on", or implementation
  code, and no approval reply exists yet.
- Questions phrased as "answer whenever you're free — none of them block me."
- A design that exists only in chat: no spec file written.
- One-question-at-a-time drip, or a second question round after unsurprising
  answers.

## When NOT to Use

- Bug fixes → soltero-skills:lean-debugging. Pure questions → just answer.
- Requirements already agreed/approved → soltero-skills:lean-plans.
- Full product-level discovery → soltero-skills:writing-prds first.
- User explicitly wants deep one-question-at-a-time exploration →
  superpowers:brainstorming (if that plugin is installed).

---

*Derived from superpowers:brainstorming (MIT, © 2025 Jesse Vincent), adapted
to a batched-question, single-gate flow.*
