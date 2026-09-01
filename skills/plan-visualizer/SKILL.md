---
name: plan-visualizer
description: Use when asked to visualize, diagram, map, or "show the shape of" an implementation plan written by soltero-skills:lean-plans (any plan with a Task Dependency Table) — before plan-review, before lean-sdd executes it, or for a stakeholder view. Runs the bundled deterministic parser to render a risk-tier-colored dependency graph with derived waves and an integrity panel (table↔block file drift, interfaces consumed without a declared dependency, same-wave file overlaps, cycles, missing tiers) into a sibling `<plan>.viz.md` (published as an Artifact when available). Read-only on the plan; reports defects, never repairs them; never writes waves, model picks, or review order anywhere.
---

# Plan Visualizer

## Overview

A lean-plans plan is a machine-read contract; this skill shows what that contract
actually says — and where it contradicts itself — without adding anything the plan
does not state. **The parser finds the facts; you render them. Nothing in the
picture may be inferred, suggested, or repaired.**

## When to Use

- "Visualize / diagram / map this plan", "what runs in parallel?", "show me the
  shape of the plan" — for any plan with a Task Dependency Table.
- Before plan-review (spot blocking violations early) or before lean-sdd (see
  the schedule it will derive).

## When NOT to Use

- Grading the plan → soltero-skills:plan-review. Fixing it → lean-plans. Executing
  it → lean-sdd.
- The plan has no Task Dependency Table → you cannot visualize dependencies that
  are not stated (see Rule 3).

## Procedure

1. **Run the parser** — always, before looking at the plan yourself:
   `node ${CLAUDE_SKILL_DIR}/scripts/plan-graph.mjs <plan.md> --md > <plan>.viz.md`
   (same directory as the plan; `--md` is the full render, `--mermaid` the graph
   only, no flag for JSON). Exit code 1 means blocking findings exist — that is
   information, not an error to suppress.
2. **Read the findings before the graph.** Every row in "Integrity findings" goes
   into your reply verbatim with its evidence line numbers. Never hand-derive or
   hand-waive a finding; if you believe the parser is wrong, quote the plan lines
   that show it and say so — the parser output still ships.
3. **Publish.** If the Artifact tool exists, publish the `.viz.md` (it renders
   mermaid natively) and hand over the link; otherwise point to the file. The
   `.viz.md` always exists either way.
4. **Route defects back.** Blocking findings → "fix in the plan via lean-plans,
   then re-gate with plan-review." You do not edit the plan (Rule 1).

## Hard Rules

1. **Plan file is read-only.** `git diff <plan>` must be empty after you finish.
   Not even a "harmless" comment block or a blank tier filled in.
2. **No execution choreography, anywhere.** No model columns, no "suggested
   review order", no dispatch instructions, no hand-authored schedule — not in
   the plan, not in the visualization. Waves appear only as the parser's
   *derived* table, labelled as the executor's to decide.
3. **No table, no graph.** If the parser reports `no-dependency-table`, deliver
   the task list and that finding, and route to lean-plans to regenerate the
   table. Do not draw inferred edges, even dashed, even labelled, even as a
   "second diagram" — a labelled guess on a slide reads as a fact.
4. **Findings are shown, not fixed or softened.** Blocking and warn rows stay in
   the artifact and in your message regardless of audience, deadline, or who
   says the plan "already passed review".

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "It passed plan-review, just draw the table." | The parser takes seconds; a same-wave file overlap breaks lean-sdd's one-writer invariant whether or not a council noticed it. Run it. |
| "I'll cross-check the blocks myself, no need for the script." | Same model, same plan: one baseline agent found both blocking defects by hand, another found none. Hand-checking is luck. |
| "A model/review column helps the new person." | It is a second schedule that drifts from the one lean-sdd computes at run time. The tier column already carries that information. |
| "The dependencies are obvious from the prose; I'll label them inferred." | Labelled inference is still inference. The fix is a dependency table (15 min in lean-plans), not a guess. |
| "Caveats don't belong on a stakeholder slide." | The integrity panel is the slide's most useful content; hide it and the deck promises parallelism the plan cannot deliver. |
| "I'll just fill in the blank tier while I'm here." | That is a plan edit. Report it; lean-plans fixes it. |

## Red Flags — STOP

- You are typing a mermaid graph or findings list without having run the parser.
- Your visualization names a model or model tier, assigns a task to an agent, or
  states a review order — under any wording, in any column.
- You are about to draw an edge that has no `Depends on` cell behind it.
- `git status` shows the plan file modified.
- The output is named anything other than `<plan>.viz.md` beside the plan.

See [references/render-contract.md](references/render-contract.md) for what the
rendered artifact must contain and the finding kinds the parser emits.
