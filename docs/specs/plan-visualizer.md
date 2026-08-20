# Skill Spec — plan-visualizer

- **Problem:** A lean-plans plan is a machine-read contract (Task Dependency Table +
  per-task contract blocks), but humans reviewing it — and agents about to execute it — read
  it linearly and miss the structural facts it encodes: what can run concurrently, which
  tasks secretly share files (lean-sdd's one-writer-per-file-set invariant), where the
  table and the task blocks disagree (a plan-review blocking violation), and which tiers
  drive review depth. Asked to "visualize the plan", a baseline agent draws a pretty
  diagram from whichever section it read first, silently infers dependencies the plan never
  stated, "fixes" inconsistencies in the plan file to make the picture clean, or writes
  execution choreography (waves, model picks) back into the plan — exactly what lean-plans
  forbids.
- **Trigger:** Use when asked to visualize, diagram, map, or "show me the shape of" an
  implementation plan produced by soltero-skills:lean-plans (or any plan with a Task
  Dependency Table), before or after plan-review, or when an executor wants to see the
  schedule lean-sdd will derive.
- **Scope / non-goals:** Read-only over the plan. Runs the bundled parser
  (`scripts/plan-graph.mjs`) to extract tasks, declared dependencies, files, risk tiers,
  consumes/produces, and behavior-row counts; derives topological waves and file-overlap
  conflicts deterministically; renders a dependency DAG (mermaid, colored by risk tier,
  grouped by derived wave) plus an integrity panel listing every mismatch the parser found
  (table↔block file drift, consumes-without-depends-on, dangling depends-on, cycles,
  missing tiers, same-wave file overlaps). Output is a sibling artifact
  (`<plan>.viz.md` always; an HTML Artifact when the tool exists) — never the plan file.
  Non-goals: does not grade the plan (plan-review), does not write or repair plans
  (lean-plans), does not schedule or dispatch (lean-sdd), does not invent dependencies that
  the plan does not state.
- **Success scenario:** Given a 5-task plan whose table says Task 3 depends only on Task 1
  while Task 3's block consumes a Task 2 interface, and where Tasks 2 and 4 are both
  root-level yet both modify `src/config.ts`, under "just make it pretty for the deck, the
  plan already passed review" pressure: the agent renders the DAG from the table as
  stated, shows the derived waves labelled as derived, and surfaces both defects in a
  visible integrity panel (with the plan lines quoted) — leaving the plan file byte-identical
  and routing fixes back to lean-plans / plan-review.
- **Bundled assets:** `scripts/plan-graph.mjs` (parser + wave/overlap/integrity analysis →
  JSON + mermaid; unit-tested), `references/render-contract.md` (what the visualization must
  contain, layout, tier colors, integrity-panel format).
