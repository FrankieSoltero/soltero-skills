<EXTREMELY_IMPORTANT>
Soltero Skills is installed. Skill-first workflow rules:

## The Rule

Before responding to or acting on any task — including asking clarifying
questions or exploring the codebase — check the available-skills list. If a
skill plausibly applies, invoke it with the Skill tool FIRST. If it turns out
wrong for the situation, you don't have to follow it.

## Routing

Feature work — the lean pipeline, end to end:

- "Build/add/change X", no agreed design yet → `soltero-skills:lean-brainstorming`
  (product-level discovery → `soltero-skills:writing-prds` first, gated by
  `soltero-skills:prd-review`)
- Approved spec/design → `soltero-skills:lean-plans`, then gate the plan with
  `soltero-skills:plan-review`
- "Visualize / diagram the plan", "what runs in parallel?" →
  `soltero-skills:plan-visualizer` (read-only; never edits the plan)
- Approved plan → `soltero-skills:lean-sdd` (pipelined subagent execution)

Standing disciplines and procedures:

- Bug, test failure, unexpected behavior → `soltero-skills:lean-debugging`
  before proposing any fix
- Implementing any feature/bugfix → `soltero-skills:lean-tdd` before writing
  implementation code
- About to claim done/fixed/passing, commit, or PR → `soltero-skills:lean-verification`
- Starting feature work needing isolation → `soltero-skills:lean-worktrees`
- Branch complete, needs integrating → `soltero-skills:lean-finishing`
- Authoring/editing skills in the soltero-skills repo → `soltero-skills:creating-a-skill`
- Bug fixed / incident resolved / gotcha discovered → `soltero-skills:capture-lesson`
- Task start in a project with `Docs/mistakes-and-fixes.md`, or "this keeps
  happening" → `soltero-skills:lesson-recall`
- Same bug class 3+ times / "universalize it" → `soltero-skills:defect-class-sweep`
- Any destructive or production write → `soltero-skills:destructive-op-gate`
- Dispatching a subagent outside lean-sdd, or relaying its report →
  `soltero-skills:dispatch-contract`
- "Spawn a swarm", "fan out agents", "throw a bunch of agents at this", or any
  ad-hoc Workflow / 4+ Agent dispatches for one task → `soltero-skills:agent-swarm`
- Debrief names a missed trigger twice → `soltero-skills:skill-trigger-repair`
- Before shipping a new/edited skill → `soltero-skills:skill-ab-eval`

## Red Flags

"This is too simple for the pipeline", "I'll just start coding", "they're in a
hurry so skip the gate", "quick fix now, investigate later", "should pass —
call it done" — STOP and invoke the matching skill. Speed requests change
round-trip count, never gates.

User instructions (CLAUDE.md, AGENTS.md, direct requests) override skills.
</EXTREMELY_IMPORTANT>
