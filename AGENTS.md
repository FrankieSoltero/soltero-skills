# AGENTS.md

This repo is a library of skills — reusable instruction modules under
`skills/<name>/SKILL.md`, each plain markdown with a YAML frontmatter
description. That content is tool-agnostic: any agent that can read files
can open a `SKILL.md` and follow it, regardless of which coding agent you
are.

This file exists for agents that are **not** Claude Code (Codex, Kimi, or
any other coding agent working in this repo). Claude Code sessions get the
equivalent rule injected automatically every session via
`hooks/session-context.md` (a `SessionStart` hook) and can invoke skills
directly with its `Skill`/`Workflow` tools — if that's you, this file is
redundant but harmless. If you have no such hook and no `Skill` tool, read
this once at the start of working in this repo and apply it for the rest of
the session.

## The rule

Before responding to or acting on any task in this repo — including asking
clarifying questions or exploring the codebase — check whether a skill under
`skills/` applies. If one plausibly does, open its `SKILL.md` and follow it
before doing anything else. If it turns out wrong for the situation, you
don't have to follow it.

Red flags that mean you skipped this: "this is too simple for the
pipeline," "I'll just start coding," "they're in a hurry so skip the gate,"
"quick fix now, investigate later," "should pass — call it done." Speed
requests should change how many round trips you take, never whether the
gate exists.

## Routing

Feature work — the lean pipeline, end to end:

- "Build/add/change X", no agreed design yet → open
  `skills/lean-brainstorming/SKILL.md` (product-level discovery → open
  `skills/writing-prds/SKILL.md` first, gated by
  `skills/prd-review/SKILL.md`)
- Approved spec/design → open `skills/lean-plans/SKILL.md`, then gate the
  plan with `skills/plan-review/SKILL.md`
- Approved plan → open `skills/lean-sdd/SKILL.md` (pipelined subagent
  execution)

Standing disciplines and procedures:

- Bug, test failure, unexpected behavior → open
  `skills/lean-debugging/SKILL.md` before proposing any fix
- Implementing any feature/bugfix → open `skills/lean-tdd/SKILL.md` before
  writing implementation code
- About to claim done/fixed/passing, commit, or PR → open
  `skills/lean-verification/SKILL.md`
- Starting feature work needing isolation → open
  `skills/lean-worktrees/SKILL.md`
- Branch complete, needs integrating → open `skills/lean-finishing/SKILL.md`
- Authoring/editing skills in this repo → open
  `skills/creating-a-skill/SKILL.md`

## Full skill index

Don't duplicate a second list here — see `README.md`'s `## Skills` table for
the complete, one-line-per-skill index. Every entry there is a directory
under `skills/` with a `SKILL.md` you can open directly.

## Mechanisms this repo relies on that don't exist outside Claude Code

- **`Skill` tool** (surfaces skills via an `available-skills` list) → you
  don't have this tool; just open `skills/<name>/SKILL.md` directly and
  read it. If your agent speaks MCP, the portable alternative is this repo's
  MCP server (`npx soltero-skills`, or `node mcp/dist/stdio.js` from a
  checkout): its `list_skills`/`get_skill`/`search_skills` tools and
  `skill://<name>` resources serve the same content programmatically, and its
  `route-task` prompt delivers this file's routing rule plus the current
  skill index on demand (the portable stand-in for the `SessionStart` hook).
- **`SessionStart` hook** (auto-injects the routing rule above every
  session) → no equivalent exists for you; that's why this file exists —
  read it once, then keep applying it yourself.
- **`Workflow` tool** (bundled multi-agent orchestration: parallel
  subagents, schema-forced structured output, independent-skeptic
  verification passes, concurrency caps, worktree isolation) → **not
  portable.** Six skills bundle a `Workflow` script: `agent-playbook`
  (update mode), `audit-swarm`, `design-forge` (update mode), `plan-review`,
  `prd-review`, and `transcript-reader`. On a non-Claude-Code agent, open
  the skill's `SKILL.md`, read what each phase is meant to accomplish, and
  perform those steps yourself, sequentially, as a single agent. You lose
  the parallel fan-out and the independent-skeptic verification pass those
  skills rely on for confidence — apply extra scrutiny to your own
  conclusions in the places where the skill would normally have used one.
  Auto-translating that orchestration to run on other CLIs is a separate,
  not-yet-attempted investigation.
- **Named subagent types** (`Explore`, `general-purpose`, `code-reviewer`,
  etc.) referenced in `SKILL.md` prose → there is no dispatchable subagent
  of that name outside Claude Code; do that piece of work yourself, inline.

## Precedence

Direct user instructions always override a skill.
