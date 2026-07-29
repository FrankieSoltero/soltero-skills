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

This lean suite fully replaces the superpowers plugin's pipeline (brainstorming,
writing-plans, executing-plans, subagent-driven-development, systematic-debugging,
test-driven-development, verification-before-completion, using-git-worktrees,
finishing-a-development-branch, requesting-code-review's reviewer). If
superpowers is still installed, prefer the lean skills wherever both claim a
flow.

## Red Flags

"This is too simple for the pipeline", "I'll just start coding", "they're in a
hurry so skip the gate", "quick fix now, investigate later", "should pass —
call it done" — STOP and invoke the matching skill. Speed requests change
round-trip count, never gates.

User instructions (CLAUDE.md, AGENTS.md, direct requests) override skills.
</EXTREMELY_IMPORTANT>
