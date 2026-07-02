# claude-brain-mcp — Design Spec

> Status: **Approved** (design phase complete, 2026-06-21). Next step: implementation plan via `superpowers:writing-plans`.
> A persistent, cross-session knowledge-graph memory MCP server for Claude, built on the TS + SQLite
> patterns proven in [`sqlite-explorer-mcp`](https://github.com/FrankieSoltero/sqlite-explorer-mcp).

## 1. Overview & goals

`claude-brain-mcp` is a standalone MCP server exposing a **persistent knowledge graph** that Claude
reads from and writes to across sessions — the "brain of a tool" arc. It is **agent memory for Claude**,
not a human note-taking app: the calling agent (Claude) performs its own fact extraction, conflict
judgment, and salience decisions. The server stays **simple and deterministic** — it stores, indexes,
retrieves, and supersedes; it does not run its own LLM extraction pipeline.

**Goals**
- Give Claude durable memory: entities, the relations between them, and timestamped observations.
- Make retrieval feel "smart": hybrid keyword + semantic search, with belief history preserved.
- Run **locally, privately, at $0** — no data leaves the machine (aligns with the user's corporate/
  privacy standards).
- Ship a usable brain **early** via phased rollout; P1 has **zero external runtime dependencies**.

**Non-goals**
- No server-side LLM/extraction pipeline (Mem0-style). The agent does that.
- No multi-user/multi-tenant auth in P1 — single local user.
- No cloud sync in P1.

## 2. Architecture & layering

Standalone server, internally **two layers**:

- **`engine/`** — pure domain logic with **zero MCP imports**. Owns the SQLite connection, schema,
  graph CRUD, temporal supersession, and search/ranking. Fully unit-testable without any transport.
  Could later also back Claude's native `memory_20250818` tool.
- **`mcp/`** — thin adapter. Registers tools/resources, validates input (Zod raw-shape `inputSchema`
  on SDK v1.29.x), translates engine results into MCP responses. No business logic here.

Transports, env, and logging reuse the `sqlite-explorer-mcp` scaffolding: `stdio.ts`, `http.ts`,
`server.ts`, `db.ts`, `env.ts`, `logger.ts`, plus its vitest + CI + Dockerfile setup.

```
src/
  engine/        # pure, no MCP — graph CRUD, supersession, search, ranking
    db.ts        # better-sqlite3 connection + migrations
    schema.sql   # tables, FTS5 (+ vec0 in P2)
    graph.ts     # entities/relations/observations CRUD
    search.ts    # FTS5 (P1); + KNN + RRF + rescore (P2)
    types.ts
  mcp/           # thin adapter — tool/resource registration, validation
    tools.ts
    resources.ts
  stdio.ts http.ts server.ts env.ts logger.ts  # reused scaffolding
```

## 3. Data model & SQLite schema

Knowledge graph cloning Anthropic's `@modelcontextprotocol/server-memory` contract:
**entities** (named nodes with a type), **relations** (directed, typed edges), **observations**
(timestamped facts attached to an entity).

**Temporal supersession** is the core differentiator: observations and relations carry
`valid_from` / `valid_to`. A contradicting fact stamps `valid_to` on the old row and links it via
`superseded_by` — it is **never deleted**. Default reads return only currently-valid rows
(`valid_to IS NULL`). Belief history stays queryable.

```sql
CREATE TABLE entities (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,       -- agent-supplied stable key
  entity_type TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE observations (
  id            INTEGER PRIMARY KEY,
  entity_id     INTEGER NOT NULL REFERENCES entities(id),
  content       TEXT NOT NULL,
  valid_from    TEXT NOT NULL,
  valid_to      TEXT,                      -- NULL = currently valid
  superseded_by INTEGER REFERENCES observations(id),
  importance    REAL NOT NULL DEFAULT 1.0  -- for P3 recency·importance·relevance scoring
);
CREATE INDEX idx_obs_entity ON observations(entity_id);
CREATE INDEX idx_obs_valid  ON observations(valid_to);

CREATE TABLE relations (
  id            INTEGER PRIMARY KEY,
  from_entity   INTEGER NOT NULL REFERENCES entities(id),
  to_entity     INTEGER NOT NULL REFERENCES entities(id),
  relation_type TEXT NOT NULL,
  valid_from    TEXT NOT NULL,
  valid_to      TEXT,
  superseded_by INTEGER REFERENCES relations(id)
);
CREATE INDEX idx_rel_from ON relations(from_entity);
CREATE INDEX idx_rel_to   ON relations(to_entity);

-- Keyword search (P1, zero deps)
CREATE VIRTUAL TABLE obs_fts USING fts5(content, content='observations', content_rowid='id');

-- Semantic search (P2) — dim baked in; mismatch = refuse to start
-- CREATE VIRTUAL TABLE obs_vec USING vec0(embedding float[768]);

CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);  -- embed model + dim, schema version
```

## 4. Tool & resource surface (approved as-is)

**Tools** (mirrors `server-memory` + supersession):
- `create_entities` — upsert named entities with type.
- `create_relations` — add directed typed edges between entities.
- `add_observations` — attach timestamped facts to entities.
- `supersede_observation` — stamp `valid_to` on an old observation and link `superseded_by`
  (the temporal-supersession write path).
- `delete_entities` / `delete_relations` / `delete_observations` — hard removal (escape hatch;
  supersession is the normal "this is no longer true" path).
- `search_memory` — the main retrieval entry point (FTS5 in P1; hybrid in P2). Returns currently-
  valid rows only by default.
- `read_graph` — dump the full currently-valid graph.
- `open_nodes` — fetch specific entities by name with their observations + relations.

**Resources:**
- `core://memory` — a compact always-relevant memory block (P3).
- `schema://stats` — counts (entities/relations/observations, valid vs superseded), model/dim info.

## 5. Data flow

**Write** (`add_observations`): validate → insert observation with `valid_from=now`, `valid_to=NULL`
→ index into `obs_fts` → (P2: compute embedding via Ollama, insert into `obs_vec`; if Ollama down,
skip and mark for later backfill).

**Supersede** (`supersede_observation`): set `valid_to=now` + `superseded_by` on the old row; insert
the new observation as a fresh valid row.

**Read** (`search_memory`):
- **P1:** FTS5 BM25 over `obs_fts`, filtered to `valid_to IS NULL`, ranked by BM25.
- **P2:** run FTS5 and vec0 KNN in parallel (both pre-filtered to currently-valid), fuse by
  **Reciprocal Rank Fusion** (rank each list, sum `1/(k+rank)`, **k=60** — never add raw BM25 +
  cosine, the scales are incomparable), then optional rescore by `recency · importance · relevance`.

## 6. Error handling & degradation

- **P1:** no external deps to fail. Standard input validation + structured errors via the MCP adapter.
- **P2 — Ollama unreachable:** **degrade gracefully**, never hard-fail. Log a warning, fall back to
  FTS5-only search, and mark new observations for embedding backfill once Ollama returns.
- **Embedding-dim mismatch:** the dim (768) is baked into `obs_vec` and recorded in `meta`. On
  startup, if the configured model/dim disagrees with `meta`, **refuse to start** (re-embedding is a
  deliberate migration, not an accident).
- **`sqlite-vec` is pre-v1** (v0.1.9, Mar 2026): **pin the version**; expect a possible storage-format
  migration before v1.0. Brute-force KNN only — fine for a single user (<~500K vectors).
- stdio transport: **never `console.log`** (stdout is JSON-RPC); stderr only. HTTP transport: stdout free.
- `createMcpExpressApp()` already calls `express.json()` — do **not** add a second one (it 500s every
  POST). Build the Express app by hand.

## 7. Testing

- **Engine unit tests** (vitest): graph CRUD, supersession correctness (old row stamped + linked, new
  row valid, default reads exclude superseded), FTS5 ranking, RRF fusion math (P2), Ollama-down
  fallback path (P2), dim-mismatch refuse-to-start.
- **MCP adapter tests:** each tool validates input and maps engine output correctly; resources return
  expected shapes.
- Reuse the `sqlite-explorer-mcp` test harness (in-memory SQLite per test).

## 8. Phased rollout

- **P1 — usable brain, zero external deps (APPROVED scope):** graph (entities/relations/observations)
  + temporal supersession + **FTS5 keyword search**. No Ollama, no sqlite-vec. Full tool surface from
  §4 (search is keyword-only). Wire into Claude Code, dogfood.
- **P2 — semantic upgrade:** add Ollama `nomic-embed-text` (768-dim) embeddings + `sqlite-vec` KNN +
  RRF hybrid fusion + recency/importance/relevance rescore + graceful Ollama-down fallback.
- **P3 — brain polish:** `core://memory` always-relevant block + optional reflection/decay pass.

## 9. Open questions (deferred, not blocking)

- **Cloud-embedding escape hatch** (Voyage / Anthropic-recommended) as an env switch vs local-only —
  revisit in P2 if the Ollama dependency proves to be friction.
- **Repo name** — working name `claude-brain-mcp`; MCP server name `brain` (→ `mcp__brain__*` tools).
- **"Brain of a tool" beyond P3** (agent/automation layer) — revisit after P1 ships.
