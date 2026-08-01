# Skills MCP Server — Design

Date: 2026-08-01
Status: pending approval

## Goal

Ship an MCP server from this repo so **any MCP-capable agent** (Kimi, Cursor,
Codex, Gemini, Claude, …) can discover and fetch the 41 skills under
`skills/` programmatically — the programmatic counterpart to what `AGENTS.md`
already does via convention — plus authoring tools for maintaining the
library.

## Decisions (from brainstorm)

- **Distribution:** published to npm; `npx soltero-skills` runs the server.
- **Scope:** read-only serving **and** authoring tools.
- **Transport:** stdio only. The `build-mcp-server` production floor's HTTP
  transport, bearer auth, and Dockerfile are deliberately scoped down — this
  is a local server; there is no remote client to authenticate.
- **Location:** `mcp/` in this repo, single npm package. Server resolves
  `skills/` relative to itself, so the content and the server version
  together.

## Interface

### Tools (actions, validated args)

| Tool | Args | Returns |
|------|------|---------|
| `list_skills` | none | Every skill: `name`, `description` (from frontmatter), path |
| `get_skill` | `name` | Full `SKILL.md` body + list of bundled files (reference.md, templates/, workflows/) with their contents on request via `include_files` |
| `search_skills` | `query` | Skills whose name/description/body match (case-insensitive substring), ranked: name > description > body |
| `lint_skill` | `name` *or* `content` | Runs the repo's frontmatter rules (reuse `tools/lint-frontmatter.mjs` logic) against an installed skill or draft content |
| `scaffold_skill` | `name`, `description` | A new `skills/<name>/SKILL.md` skeleton following `creating-a-skill` conventions |

### Resources (cacheable, read-only)

- Resource template `skill://<name>` → the `SKILL.md` body.
- Resource template `skill://<name>/file/<path>` → bundled files.

Same content as `get_skill`, exposed as resources for clients that prefer
resource-driven context. One shared read path backs both.

### Prompts

- `route-task(task)` — returns the routing rule from `AGENTS.md` plus the
  current skill index, instructing the agent to pick and fetch the right
  skill. This is the `SessionStart` hook's job, delivered on demand.
- `use-skill(name)` — returns the skill body framed as "follow these
  instructions for the rest of the session."

## Architecture

```
mcp/
  src/
    server.ts       # buildServer() factory: tools + resources + prompts
    stdio.ts        # entry; stderr-only logging (stdout = JSON-RPC stream)
    skills.ts       # discovery: walk skills/, parse frontmatter, read bodies
    frontmatter.ts  # extracted shared parser (also used by lint-frontmatter)
  test/             # node --test, matching repo convention
  tsconfig.json     # strict, ESM
```

- **Single package, root `package.json`:** add `bin: { "soltero-skills": "mcp/dist/stdio.js" }`
  and a `files` field (`skills/`, `mcp/dist/`). No separate package to
  version. **Default flagged for approval:** bin name `soltero-skills`.
- **Skills dir resolution:** `path relative to import.meta.url` → repo root
  `skills/`; overridable via `SOLTERO_SKILLS_DIR` env for dev/testing.
- **Deps:** `@modelcontextprotocol/sdk` + `zod`. SDK is **1.30.0** as of
  today — the `build-mcp-server` reference pins 1.29.x, so per Rule 0 the
  API must be re-verified against the v1.30.0 tag before writing server
  code; do not write imports from memory.
- **Floor kept from `build-mcp-server`:** Zod at every tool boundary,
  `{ isError: true }` returns instead of throws, stderr logging with level
  from env, unit tests per handler + one in-memory-transport integration
  test. **Floor dropped (user-scoped):** HTTP transport, auth, Docker.
- **CI:** extend `npm run check` with `tsc --noEmit` and `mcp` tests.
- **Frontmatter parsing:** factor the YAML-frontmatter rules out of
  `tools/lint-frontmatter.mjs` into a shared module so `lint_skill` and the
  existing CLI check use one implementation.

## Error handling

- Unknown skill name → typed error listing close matches (prefix/substring).
- Frontmatter parse failures → skip the skill from `list_skills`, surface in
  a `warnings` field rather than failing the whole call.
- `SOLTERO_SKILLS_DIR` missing/unreadable → fail fast at startup with a
  clear stderr message.

## Testing

- Unit: frontmatter parser, skills discovery, each tool handler.
- Integration: one `InMemoryTransport` test listing + fetching a real skill.
- Manual: MCP Inspector (`npx @modelcontextprotocol/inspector node mcp/dist/stdio.js`),
  then register in at least one non-Claude agent to prove the portability
  claim.

## Docs

- README: new "Use from any agent (MCP)" section with `npx` / agent-config
  snippets.
- `AGENTS.md`: add MCP to the mechanisms section (it becomes the portable
  alternative to the `Skill` tool).
- CHANGELOG entry; version bump per `scripts/bump-version.sh`.

## Non-goals

- Remote/hosted serving, auth, Docker (stdio only).
- Executing skills' bundled `Workflow` scripts — orchestration stays the
  agent's job, same as documented in `AGENTS.md`.
- Auto-installing skills into other tools' config files.
