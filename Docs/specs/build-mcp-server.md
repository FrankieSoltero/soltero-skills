# Skill Spec — build-mcp-server

- **Problem:** Building a Model Context Protocol (MCP) server from scratch means re-deriving the
  same scaffolding every time and stepping on the same landmines. A general agent reaches for
  stale or hallucinated SDK APIs, writes to **stdout** on a stdio server (which silently corrupts
  the JSON-RPC stream), conflates tools with resources, hand-rolls input validation, ships only
  one transport, and stops at a "it handshakes" toy — no error handling, logging, tests, CI,
  container, or auth. The result reads like a tutorial, not a production service.

- **Trigger:** Use when creating a new MCP server, adding MCP to a service, or hardening an
  existing MCP server toward production. Symptoms: "build an MCP server", "expose this API/DB as
  MCP tools", "write a tool/resource for Claude/an MCP client", "make my MCP server
  production-grade", "deploy/containerize my MCP server", "add auth to my MCP server".

- **Scope:** TypeScript, the official SDK — **both published package families**: the v1 monolith
  `@modelcontextprotocol/sdk` (1.x) and the v2 scoped family `@modelcontextprotocol/server` +
  `/node` + `/express` (2.x, stable since 2.0.0 on 2026-07-27, and the default for new servers).
  The two differ in imports, `inputSchema` (raw shape vs `z.object`), the stdio entry
  (`StdioServerTransport` + `connect` vs `serveStdio(factory)`), and the HTTP transport class, so
  the skill carries a dated verified snapshot per family (`reference.md` for v1,
  `references/sdk-v2.md` for v2) and Rule 0 makes the agent pick a family before writing code.
  Covers: correct current SDK setup
  (`McpServer`, `registerTool`, `registerResource`), the **stdout-is-sacred** stdio rule, when to
  use a **tool vs a resource**, Zod input validation, **both transports** (stdio + Streamable
  HTTP), structured **stderr logging**, typed error handling, **tests + CI**, a **Dockerfile**,
  **auth + secrets** on the HTTP transport, and wiring into Claude Code (`claude mcp add`) +
  testing with the MCP Inspector. Neutral example domains only.

- **Non-goals:** Not a Python/FastMCP guide (TS only — separate skill if ever needed). Does not
  design the upstream API/business logic it wraps. Does not cover MCP **client** authoring or
  building Claude Code itself. Distinct from `scaffold-frontend` (web UI infra) — this is a
  backend service skill; they don't overlap.

- **Confidentiality:** Re-derived generically from the open MCP standard with neutral example
  domains (a weather API, a key-value store, a public-data DB). NO private-repo data, names, or
  schemas — per the library design spec §2.1 and the `public-skills-no-confidential-material`
  rule. The author's own SQLite tutorial is fine to distill from (it is the author's, neutral).

- **Production bar (what "production-grade" means here, author's priorities):**
  1. **Tests + CI** — unit tests for tool/resource handlers (call them directly), an integration
     test over an in-memory transport, GitHub Actions running typecheck + lint + test.
  2. **Robust errors + logging** — Zod validation at every tool boundary, typed/​caught errors
     returned as MCP errors (never thrown into the transport), structured logging to **stderr**.
  3. **Both transports + Docker** — a stdio entry and a Streamable HTTP entry sharing one server
     definition, plus a multi-stage `Dockerfile` and `.dockerignore`.
  4. **Auth + security** — bearer/token auth on the HTTP transport, secrets via env (Zod-validated,
     never hardcoded), least-privilege upstream access, basic rate limiting.

- **Behavior — the flow the skill enforces:**
  1. Start from the official SDK with **verified-current** APIs (don't hand-roll or trust memory).
  2. Define the server once; expose it over **both** transports from shared code.
  3. Apply the four production concerns above (they are the value-add a tutorial skips), driven by
     bundled templates.
  4. Wire into Claude Code and verify with the MCP Inspector before declaring done.

- **Success scenario:** User: "Turn my read-only SQLite query server into something I can put on
  my resume." Skill keeps the verified SDK setup, adds a schema **resource** alongside the query
  **tool**, wraps every handler in Zod + typed error handling with stderr logging, adds a
  Streamable HTTP entry with bearer auth beside the stdio entry, env-validates secrets, ships
  tests + a CI workflow + a Dockerfile, then verifies via Inspector + `claude mcp add`. A baseline
  agent would have produced a single-transport stdio toy that `console.log`s into the JSON-RPC
  stream, validates nothing, and has no tests, container, or auth.

- **Bundled assets:** `reference.md` (verified v1-monolith SDK API, both transport setups, auth,
  the tool-vs-resource decision, Claude Code wiring + Inspector commands, the stdout rule),
  `references/sdk-v2.md` (the scoped v2 family: install, imports, `registerTool`/`registerResource`
  signatures quoted from the shipped `.d.mts`, `serveStdio`, the Express/Node Streamable HTTP
  wiring, and a v1↔v2 differences table — every claim carries its source URL and fetch date), and
  `templates/` (v1 server definition, stdio entry, HTTP+auth entry, Zod env module, a tool test, a
  CI workflow, Dockerfile + .dockerignore, `.env.example`) plus `templates/v2/` (v2 minimal
  server + stdio + HTTP entries, type-checked against the real 2.0.0 packages). Verify every
  command/API against current docs before shipping.

- **Mechanism note:** Pin verified SDK facts in `reference.md` so they are cheap to refresh as the
  spec/SDK drift (MCP spec was `2025-11-25` at authoring). The SKILL.md body carries the judgment
  (stdout rule, tool-vs-resource, the production checklist); exact APIs/commands live in reference.
