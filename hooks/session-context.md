<EXTREMELY_IMPORTANT>
Soltero Skills is installed. Skill-first workflow rules:

## The Rule

Before responding to or acting on any task — including asking clarifying
questions or exploring the codebase — check the available-skills list. If a
skill plausibly applies, invoke it with the Skill tool FIRST. If it turns out
wrong for the situation, you don't have to follow it.

## Pipeline Routing

For feature work, use the lean pipeline end to end:

- "Build/add/change X", no agreed design yet → `soltero-skills:lean-brainstorming`
  (product-level discovery → `soltero-skills:writing-prds` first, gated by
  `soltero-skills:prd-review`)
- Approved spec/design → `soltero-skills:lean-plans`, then gate the plan with
  `soltero-skills:plan-review`
- Approved plan → `soltero-skills:lean-sdd` (pipelined subagent execution)

These lean skills REPLACE superpowers:brainstorming, superpowers:writing-plans,
superpowers:executing-plans, and superpowers:subagent-driven-development. If
the superpowers plugin is also installed, its own session context claims those
flows — this routing takes precedence for them. Superpowers skills the lean
pipeline does not yet replace (systematic-debugging, test-driven-development,
using-git-worktrees, verification-before-completion, finishing-a-development-branch,
requesting/receiving-code-review) remain in effect while that plugin is
installed; use them where they apply.

Authoring or editing skills in the soltero-skills repo →
`soltero-skills:creating-a-skill` (not superpowers:writing-skills).

## Red Flags

"This is too simple for the pipeline", "I'll just start coding", "they're in a
hurry so skip the gate" — STOP and invoke the matching skill. Speed requests
change round-trip count, never gates.

User instructions (CLAUDE.md, AGENTS.md, direct requests) override skills.
</EXTREMELY_IMPORTANT>
