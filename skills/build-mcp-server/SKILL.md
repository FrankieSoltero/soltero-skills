---
name: build-mcp-server
description: Use when building, hardening, or deploying a Model Context Protocol (MCP) server in TypeScript ("build an MCP server", "expose this API/DB as MCP tools", "make my MCP server production-grade", "add auth or HTTP to my MCP server", "deploy my MCP server so remote clients can reach it") — pins the verified-current @modelcontextprotocol/sdk API instead of authoring from memory or stale tutorials, enforces the stdout-is-the-stdio-channel rule and the tool-vs-resource decision, and makes a production floor the default (Zod validation + stderr logging + typed errors, both transports, bearer auth + env-validated secrets, tests + CI + Dockerfile), then verifies via the MCP Inspector and `claude mcp add`.
---

# Build MCP Server

## Overview

An MCP server is easy to get handshaking and easy to ship as a single-transport toy that logs
into its own protocol stream, validates nothing, and has no tests, container, or auth. This skill
does two things a from-memory answer skips: **(1) it pins the SDK API to the version you actually
install** — the API is mid-migration and tutorials are stale — and **(2) it makes the production
floor the default, not an upgrade you reach for only when the prompt says "production."**

Core principle: **verify the API, then build to the floor — every time, regardless of phrasing.**

## When to Use

- Building a new MCP server, or adding MCP to an existing service.
- Hardening an MCP server toward production (tests, CI, Docker, auth, deploy).
- Exposing an API or database as MCP tools/resources for Claude or any MCP client.

## When NOT to Use

- Authoring an MCP **client**, or building Claude Code itself.
- Python/FastMCP servers (this skill is TypeScript + `@modelcontextprotocol/sdk`).
- Designing web UI infra (that's `scaffold-frontend`). This is a backend service.

## Rule 0 — Verify the SDK API; never author it from memory

The TS SDK ships under two package families whose APIs differ: the **monolith**
`@modelcontextprotocol/sdk` (subpath imports, raw-shape `inputSchema`) and the **scoped**
`@modelcontextprotocol/server` / `/node` / `/express` (different imports and signatures).
Both are published; which one is current, and which the docs you are reading describe, changes
between releases. Tutorials — and your own memory — mix them. Recognizing these package names is
not the same as knowing their current state, so check both before writing a line.

So, before writing server code:

1. Run `npm view @modelcontextprotocol/sdk version` **and**
   `npm view @modelcontextprotocol/server dist-tags` — the second is the one that tells you
   whether the scoped family has shipped past prerelease. Decide which family you are on, and
   say which, before installing.
2. Read the docs for **that exact version**, pinned by git tag (`?ref=v<version>`), never the
   main branch — main tracks whatever is unreleased at the time you read it.
3. Match imports and the `registerTool`/`registerResource` signatures to that version.

`reference.md` holds a dated, verified snapshot of the monolith API. Check its verification date
against what step 1 returned: if the installed version has moved past it, or step 1 puts you on
the scoped family, the snapshot is a starting point to re-verify, not an answer.

## The Flow

1. **Verify the SDK (Rule 0)**, then scaffold: `npm i @modelcontextprotocol/sdk zod`,
   `type: module`, strict `tsconfig`, a `bin` entry.

2. **Define the server once; expose it over both transports from shared code.** One
   `buildServer()` factory (tools + resources). A stdio entry for local clients AND a Streamable
   HTTP entry for remote clients import the same factory. Don't fork the server per transport.

3. **Decide tool vs resource for each capability** — this is a design choice, not a coin flip:

   | Use a **resource** | Use a **tool** |
   |--------------------|----------------|
   | Read-only context the model *reads* (schema, config, a document) | An *action* with cost/risk (run a query, call an API, write) |
   | Cacheable, no side effects, no args (or templated URI) | Takes validated arguments, may fail, should be audited |

   Expose a DB's **schema as a resource**; expose **querying as a tool**. Exposing everything as
   tools is the common baseline mistake.

4. **The stdout rule (stdio only):** on the **stdio** transport, stdout IS the JSON-RPC stream —
   a single `console.log` corrupts it and the client silently disconnects. Log to **stderr**
   (`console.error`) or a file. (Over **HTTP**, stdout is free — the protocol rides the HTTP body,
   so this rule does not apply there.)

5. **Build to the production floor — this is the default, not an upsell.** Don't stop at "it
   handshakes." Apply all four; templates in `templates/` cover each:
   - [ ] **Validation + typed errors:** Zod at every tool boundary; catch in the handler and
         return `{ isError: true, content: […] }` — never throw into the transport.
   - [ ] **Structured logging to stderr** (stdio) with a level from env; never log result rows
         containing PII.
   - [ ] **Both transports + Docker:** shared `buildServer()`, a stdio entry, a Streamable HTTP
         entry, a multi-stage `Dockerfile` (non-root) + `.dockerignore`.
   - [ ] **Auth + secrets:** bearer/token auth on the HTTP transport (fail-closed, constant-time
         compare), all secrets via Zod-validated env (never hardcoded), least-privilege upstream
         access (e.g. a read-only DB role), a body-size limit.
   - [ ] **Tests + CI:** unit-test handlers directly + one in-memory-transport integration test;
         GitHub Actions running typecheck + lint + test.

6. **Wire in and verify before declaring done.** Test standalone with the MCP Inspector
   (`npx @modelcontextprotocol/inspector node dist/stdio.js`), then register:
   `claude mcp add --transport stdio <name> -- node <abs>/dist/stdio.js` (local) or
   `claude mcp add --transport http <name> <url> --header "Authorization: Bearer …"` (remote).
   Confirm with `/mcp` in a session. Exact commands + auth setup live in `reference.md`.

## Red Flags — STOP

- Writing `import … from "@modelcontextprotocol/..."` from memory without running
  `npm view @modelcontextprotocol/sdk version` first → STOP, verify (Rule 0). The raw-shape vs
  `z.object` inputSchema and the monolith-vs-scoped-package split flip between versions.
- Any `console.log` in a **stdio** server → it corrupts the JSON-RPC stream; use `console.error`.
- Exposing read-only schema/config as a **tool** instead of a **resource** → reach for the table.
- Shipping a single-transport stdio server with no tests, no Docker, no auth and calling it done
  because the prompt only said "a working server" → the floor (step 5) is the default. Build it
  unless the user explicitly scopes it down.
- An HTTP transport with no auth, or secrets/DB paths hardcoded → fail-closed bearer + Zod env.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I know the SDK API." | It's mid-migration (v1 monolith vs v2-alpha scoped). Run `npm view` and match the installed version. |
| "It handshakes, so it works." | Handshake ≠ production. No validation/errors/tests/auth = a toy. Apply step 5. |
| "They only asked for a working server." | The floor is the default. Deliver it (or have them scope it down on purpose), don't silently ship the toy. |
| "console.log is fine, it's just one log line." | On stdio that one line corrupts the protocol stream. stderr only. |
| "Everything can be a tool." | Read-only context belongs in resources — cacheable, side-effect-free, auditable separation. |
| "The README example is current." | The main branch tracks unreleased work and may describe a different package family than the one you installed. Pin the git tag of the version `npm view` reported. |

See `reference.md` for the verified-current API, both transport setups, auth, the Inspector, and
`claude mcp add`. Bundled `templates/` provide the production floor (server, both entries, env,
test, CI, Dockerfile).
