# Design: Portable discovery layer (root `AGENTS.md`)

**Date:** 2026-07-31
**Status:** Approved (pending user confirmation reply)
**Scope decisions (from brainstorming round):**

- Target: this repo's own root only — a contributor working ON soltero-skills
  with Codex/Kimi/Cursor/etc. instead of Claude Code. Shipping a
  generator/CLI that installs a portable layer into *consumer* projects is
  explicitly out of scope for this pass (future work, tracked below).
- Coverage: all skills, including the 6 that bundle a `Workflow`-tool script
  (`agent-playbook`, `audit-swarm`, `design-forge`, `plan-review`,
  `prd-review`, `transcript-reader`).
- Tier 3 (auto-translating the `Workflow` DSL to run its multi-agent
  fan-out on non-Claude-Code CLIs) stays out of scope — separate future
  investigation.

## Problem

The repo currently assumes Claude Code's runtime: skills surface via the
`Skill` tool driven by an `available-skills` list, the skill-first routing
rule is injected every session by `hooks/session-context.md` (a
`SessionStart` hook — see `hooks/hooks.json`), and 6 skills orchestrate
multi-agent fan-out via the `Workflow` tool. None of that exists if someone
runs Codex CLI, Kimi CLI, or another agent inside this same repo. That agent
has no hook, no `Skill`/`Workflow` tool, and no `/plugin marketplace`
mechanism — but every `SKILL.md` body is already plain markdown + YAML
frontmatter, so its *content* is directly readable and followable by any
agent that can read files. The gap is discovery and routing, not content.

## Design

Add one new file: **`AGENTS.md`** at repo root. It is the portable
equivalent of `hooks/session-context.md`, rewritten so its verbs work for
any file-reading agent, not just one wired to Claude Code's tools.

### Structure (target ~90-120 lines — nav map, not a manual)

1. **What this repo is** (1-2 lines) — a library of `skills/<name>/SKILL.md`
   files, plain markdown+frontmatter, readable/followable by any agent.
2. **The rule**, restated agent-agnostically: before responding to or acting
   on any task, check whether a skill under `skills/` applies; if so, open
   its `SKILL.md` and follow it. (Same rule as the Claude Code hook; same
   red-flags list carried over — "too simple," "just build it," etc.)
3. **Routing table** — the same routing logic as
   `hooks/session-context.md`'s `## Routing` section, verb-swapped
   (`invoke with the Skill tool` → `open skills/<name>/SKILL.md and follow
   it`).
4. **Skill index** — no duplicate table. Points at `README.md`'s existing
   `## Skills` table as the single source of truth for the full list +
   one-line descriptions, so adding/renaming a skill never requires touching
   two indexes. `AGENTS.md` only adds the routing/compatibility layer on
   top.
5. **Mechanism translation** (the genuinely new content) — four Claude-Code
   mechanisms this repo relies on, each with a concrete fallback for a
   generic agent:
   - `Skill` tool → open `skills/<name>/SKILL.md` directly and read it.
   - `SessionStart` hook (auto-injects the routing rule every session) →
     no equivalent; read this file once, at the start of working in this
     repo, and re-apply its rule for the rest of the session.
   - `Workflow` tool (multi-agent fan-out with schema-forced structured
     output, concurrency caps, worktree isolation) → **not portable**.
     Named exactly: `agent-playbook` (update mode), `audit-swarm`,
     `design-forge` (update mode), `plan-review`, `prd-review`,
     `transcript-reader`. On a non-Claude-Code agent, open the skill's
     `SKILL.md`, read what each phase is meant to accomplish, and perform
     those steps yourself, sequentially, as a single agent — you lose the
     parallel fan-out and the independent-skeptic verification pass, so
     apply extra scrutiny to your own conclusions where the skill would
     normally have used one. Auto-translating the orchestration itself is
     tracked as separate future work, not attempted here.
   - Named subagent types (`Explore`, `general-purpose`, `code-reviewer`,
     etc.) referenced in `SKILL.md` prose → do that piece of work yourself
     inline; there is no dispatchable subagent of that name outside Claude
     Code.
6. **Precedence line**, carried over verbatim in spirit: direct user
   instructions override any skill.

### What this explicitly does NOT do

- No new tooling/scripts, no generator, no per-project install flow.
- No per-`SKILL.md` edits. The 6 workflow-orchestrated skills are called out
  by name in `AGENTS.md` itself, not annotated file-by-file — keeps this a
  single contained file change. (Per-skill portability callouts are a
  reasonable follow-up but not this pass.)
- No change to `hooks/session-context.md` — it keeps serving Claude Code
  sessions exactly as today; `AGENTS.md` is additive, for the case where
  that hook doesn't run.

### README touch

Add one short line/section to `README.md` noting `AGENTS.md` exists for
non-Claude-Code agents working in this repo, so the two files reference each
other and don't drift apart silently.

### Verification

- `npm run lint:md` must pass on the new file (markdownlint-cli2 already
  globs `**/*.md`).
- `npm run check` (full existing suite) stays green — this change touches no
  code, only adds one markdown file and a short README addition.
- Manual read-through: confirm every routing-table line and every named
  workflow-skill actually matches current `hooks/session-context.md` and the
  6-file grep result above (no stale references if a skill is renamed later).

### Future work (explicitly deferred)

- Tier 3: translating `Workflow`-tool orchestration to run on other CLIs
  (separate investigation, already discussed).
- A generator/CLI so consumer projects that install this plugin can pull a
  portable `AGENTS.md` + skill copies into their own repo for non-Claude-Code
  agents.
- Per-`SKILL.md` inline portability callouts, if the centralized note in
  `AGENTS.md` proves insufficient in practice.
