# claude-brain-mcp — P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship P1 of `claude-brain-mcp` — a standalone MCP server giving Claude a persistent knowledge-graph memory (entities / relations / observations) with temporal supersession and FTS5 keyword search, with **zero external runtime dependencies**.

**Architecture:** Two layers. `engine/` is pure domain logic (SQLite via `better-sqlite3`, graph CRUD, temporal supersession, FTS5 search) with **zero MCP imports** — fully unit-testable. `mcp/` is a thin adapter that registers tools/resources, validates input with Zod raw-shape schemas, and maps engine results to MCP responses. Transports/env/logger reuse the proven `sqlite-explorer-mcp` scaffolding.

**Tech Stack:** TypeScript (strict), `@modelcontextprotocol/sdk` v1.29.x, `better-sqlite3`, `zod`, `vitest`, Express (HTTP transport), Docker.

## Global Constraints

- **SDK pinned to v1.29.x** — use subpath imports and **raw-shape** `inputSchema` (`{ x: z.string() }`, NOT `z.object(...)`). Do NOT use SDK v2 alpha.
- **No external runtime deps in P1** — no Ollama, no `sqlite-vec`. FTS5 only (ships inside SQLite).
- **stdio transport: NEVER `console.log`** — stdout is JSON-RPC. All logging goes to **stderr** only.
- **HTTP transport: build the Express app by hand** — `createMcpExpressApp()` already calls `express.json()`; a second one 500s every POST.
- **`SQLITE_PATH` must be absolute** — relative defaults won't resolve from Claude Code's cwd. Validate via Zod env.
- **Timestamps are ISO-8601 strings** computed by the caller and passed into engine functions as `now: string`, so supersession stamps the old `valid_to` and new `valid_from` with the identical value.
- **Default reads return only currently-valid rows** (`valid_to IS NULL`). Supersession never deletes.
- TDD throughout: failing test → minimal impl → green → commit. In-memory SQLite (`:memory:`) per test.
- MCP server name is `brain` (tools surface as `mcp__brain__*`).

## File Structure

```
claude-brain-mcp/
  package.json            # deps, scripts (build/test/seed-free), bin
  tsconfig.json           # strict TS
  vitest.config.ts
  Dockerfile
  .github/workflows/ci.yml
  src/
    env.ts                # Zod-validated env (SQLITE_PATH absolute, TRANSPORT, PORT)
    logger.ts             # stderr-only structured logger
    engine/
      types.ts            # Entity, Observation, Relation, GraphDump, SearchHit
      schema.ts           # SCHEMA: string (all DDL, incl. obs_fts FTS5 + triggers)
      db.ts               # openDb(path): Database — connect + apply schema + meta
      graph.ts            # entities/relations/observations CRUD + supersession
      search.ts           # searchMemory (FTS5 BM25, valid-only)
      stats.ts            # stats(db): counts
    mcp/
      tools.ts            # registerTools(server, db) — all 9 tools
      resources.ts        # registerResources(server, db) — schema://stats
    server.ts             # buildServer(db): McpServer (wires tools + resources)
    stdio.ts              # stdio entry
    http.ts               # HTTP entry (hand-built Express app)
  test/
    engine/graph.test.ts
    engine/search.test.ts
    engine/stats.test.ts
    mcp/tools.test.ts
```

---

### Task 1: Project scaffold + env + logger

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/env.ts`, `src/logger.ts`
- Test: `test/env.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `loadEnv(): { sqlitePath: string; transport: 'stdio' | 'http'; port: number }`; `logger.info/warn/error(msg: string, meta?: object): void` (writes JSON lines to **stderr**).

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "claude-brain-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": { "claude-brain-mcp": "dist/stdio.js" },
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "start:stdio": "node dist/stdio.js",
    "start:http": "node dist/http.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.29.0",
    "better-sqlite3": "^11.0.0",
    "express": "^4.19.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['test/**/*.test.ts'] } });
```

- [ ] **Step 4: Write the failing env test**

```ts
// test/env.test.ts
import { describe, it, expect } from 'vitest';
import { loadEnv } from '../src/env.js';

describe('loadEnv', () => {
  it('rejects a relative SQLITE_PATH', () => {
    expect(() => loadEnv({ SQLITE_PATH: 'data.db' })).toThrow(/absolute/i);
  });
  it('accepts an absolute path and defaults transport to stdio', () => {
    const env = loadEnv({ SQLITE_PATH: '/tmp/brain.db' });
    expect(env.sqlitePath).toBe('/tmp/brain.db');
    expect(env.transport).toBe('stdio');
    expect(env.port).toBe(3000);
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run test/env.test.ts`
Expected: FAIL — cannot find module `../src/env.js`.

- [ ] **Step 6: Write `src/env.ts`**

```ts
import { isAbsolute } from 'node:path';
import { z } from 'zod';

const Schema = z.object({
  SQLITE_PATH: z.string().refine(isAbsolute, 'SQLITE_PATH must be an absolute path'),
  TRANSPORT: z.enum(['stdio', 'http']).default('stdio'),
  PORT: z.coerce.number().int().positive().default(3000),
});

export interface Env { sqlitePath: string; transport: 'stdio' | 'http'; port: number; }

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const e = Schema.parse(source);
  return { sqlitePath: e.SQLITE_PATH, transport: e.TRANSPORT, port: e.PORT };
}
```

- [ ] **Step 7: Write `src/logger.ts`**

```ts
type Level = 'info' | 'warn' | 'error';

function emit(level: Level, msg: string, meta?: object): void {
  // stderr ONLY — stdout is reserved for JSON-RPC on the stdio transport.
  process.stderr.write(JSON.stringify({ level, msg, ...meta }) + '\n');
}

export const logger = {
  info: (msg: string, meta?: object) => emit('info', msg, meta),
  warn: (msg: string, meta?: object) => emit('warn', msg, meta),
  error: (msg: string, meta?: object) => emit('error', msg, meta),
};
```

- [ ] **Step 8: Install deps and run test to verify it passes**

Run: `npm install && npx vitest run test/env.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts src/env.ts src/logger.ts test/env.test.ts
git commit -m "chore: scaffold claude-brain-mcp + env validation + stderr logger"
```

---

### Task 2: Schema + DB connection

**Files:**
- Create: `src/engine/types.ts`, `src/engine/schema.ts`, `src/engine/db.ts`
- Test: `test/engine/db.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces:
  - Types — `Entity { id; name; entityType; createdAt }`, `Observation { id; entityId; content; validFrom; validTo; supersededBy; importance }`, `Relation { id; fromEntity; toEntity; relationType; validFrom; validTo; supersededBy }`.
  - `openDb(path: string): Database.Database` — opens, enables foreign keys + WAL, applies `SCHEMA` idempotently, stamps `meta(schema_version)`.

- [ ] **Step 1: Write `src/engine/types.ts`**

```ts
export interface Entity { id: number; name: string; entityType: string; createdAt: string; }
export interface Observation {
  id: number; entityId: number; content: string;
  validFrom: string; validTo: string | null; supersededBy: number | null; importance: number;
}
export interface Relation {
  id: number; fromEntity: number; toEntity: number; relationType: string;
  validFrom: string; validTo: string | null; supersededBy: number | null;
}
export interface GraphDump { entities: Entity[]; relations: Relation[]; observations: Observation[]; }
export interface SearchHit { observation: Observation; entity: Entity; score: number; }
```

- [ ] **Step 2: Write `src/engine/schema.ts`**

```ts
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS entities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY,
  entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  superseded_by INTEGER REFERENCES observations(id),
  importance REAL NOT NULL DEFAULT 1.0
);
CREATE INDEX IF NOT EXISTS idx_obs_entity ON observations(entity_id);
CREATE INDEX IF NOT EXISTS idx_obs_valid ON observations(valid_to);
CREATE TABLE IF NOT EXISTS relations (
  id INTEGER PRIMARY KEY,
  from_entity INTEGER NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  to_entity INTEGER NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  superseded_by INTEGER REFERENCES relations(id)
);
CREATE INDEX IF NOT EXISTS idx_rel_from ON relations(from_entity);
CREATE INDEX IF NOT EXISTS idx_rel_to ON relations(to_entity);
CREATE VIRTUAL TABLE IF NOT EXISTS obs_fts USING fts5(content, content='observations', content_rowid='id');
CREATE TRIGGER IF NOT EXISTS obs_ai AFTER INSERT ON observations BEGIN
  INSERT INTO obs_fts(rowid, content) VALUES (new.id, new.content);
END;
CREATE TRIGGER IF NOT EXISTS obs_ad AFTER DELETE ON observations BEGIN
  INSERT INTO obs_fts(obs_fts, rowid, content) VALUES('delete', old.id, old.content);
END;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
`;
```

- [ ] **Step 3: Write the failing db test**

```ts
// test/engine/db.test.ts
import { describe, it, expect } from 'vitest';
import { openDb } from '../../src/engine/db.js';

describe('openDb', () => {
  it('creates all core tables and enables foreign keys', () => {
    const db = openDb(':memory:');
    const names = db.prepare(
      "SELECT name FROM sqlite_master WHERE type IN ('table','view') ORDER BY name"
    ).all().map((r: any) => r.name);
    expect(names).toEqual(expect.arrayContaining(['entities', 'observations', 'relations', 'obs_fts', 'meta']));
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1);
  });
  it('is idempotent (re-applying schema does not throw)', () => {
    const db = openDb(':memory:');
    expect(() => db.exec(require('../../src/engine/schema.js').SCHEMA)).not.toThrow();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run test/engine/db.test.ts`
Expected: FAIL — cannot find module `../../src/engine/db.js`.

- [ ] **Step 5: Write `src/engine/db.ts`**

```ts
import Database from 'better-sqlite3';
import { SCHEMA } from './schema.js';

const SCHEMA_VERSION = '1';

export function openDb(path: string): Database.Database {
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  db.prepare('INSERT OR IGNORE INTO meta(key, value) VALUES (?, ?)').run('schema_version', SCHEMA_VERSION);
  return db;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run test/engine/db.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/engine/types.ts src/engine/schema.ts src/engine/db.ts test/engine/db.test.ts
git commit -m "feat: engine schema + db connection (entities/observations/relations + FTS5)"
```

---

### Task 3: Entities + observations CRUD with temporal supersession

**Files:**
- Create: `src/engine/graph.ts`
- Test: `test/engine/graph.test.ts`

**Interfaces:**
- Consumes: `openDb` (Task 2), types (Task 2).
- Produces (all take `db: Database.Database`):
  - `createEntities(db, items: { name: string; entityType: string }[], now: string): Entity[]` — upsert by `name` (existing row's type updated; `created_at` preserved).
  - `addObservations(db, items: { entityName: string; content: string; importance?: number }[], now: string): Observation[]` — throws if `entityName` unknown.
  - `supersedeObservation(db, oldId: number, newContent: string, now: string): Observation` — stamps old `valid_to=now` + `superseded_by`, inserts new valid observation on the same entity; throws if `oldId` missing or already superseded.

- [ ] **Step 1: Write failing tests for entities + observations**

```ts
// test/engine/graph.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { openDb } from '../../src/engine/db.js';
import { createEntities, addObservations, supersedeObservation } from '../../src/engine/graph.js';

const T0 = '2026-06-22T10:00:00.000Z';
const T1 = '2026-06-22T11:00:00.000Z';
let db: Database.Database;
beforeEach(() => { db = openDb(':memory:'); });

describe('createEntities', () => {
  it('inserts new entities and is idempotent by name', () => {
    const a = createEntities(db, [{ name: 'Ada', entityType: 'person' }], T0);
    expect(a[0]).toMatchObject({ name: 'Ada', entityType: 'person', createdAt: T0 });
    const b = createEntities(db, [{ name: 'Ada', entityType: 'engineer' }], T1);
    expect(b[0].id).toBe(a[0].id);
    expect(b[0].entityType).toBe('engineer');
    expect(b[0].createdAt).toBe(T0); // preserved
  });
});

describe('addObservations', () => {
  it('attaches valid observations to an entity', () => {
    createEntities(db, [{ name: 'Ada', entityType: 'person' }], T0);
    const obs = addObservations(db, [{ entityName: 'Ada', content: 'lives in London' }], T0);
    expect(obs[0]).toMatchObject({ content: 'lives in London', validFrom: T0, validTo: null, supersededBy: null, importance: 1.0 });
  });
  it('throws for an unknown entity', () => {
    expect(() => addObservations(db, [{ entityName: 'Nobody', content: 'x' }], T0)).toThrow(/unknown entity/i);
  });
});

describe('supersedeObservation', () => {
  it('stamps the old observation and creates a new valid one', () => {
    createEntities(db, [{ name: 'Ada', entityType: 'person' }], T0);
    const [old] = addObservations(db, [{ entityName: 'Ada', content: 'lives in London' }], T0);
    const fresh = supersedeObservation(db, old.id, 'lives in Manchester', T1);
    const reloaded = db.prepare('SELECT valid_to AS validTo, superseded_by AS supersededBy FROM observations WHERE id = ?').get(old.id) as any;
    expect(reloaded.validTo).toBe(T1);
    expect(reloaded.supersededBy).toBe(fresh.id);
    expect(fresh).toMatchObject({ content: 'lives in Manchester', validFrom: T1, validTo: null });
    expect(fresh.entityId).toBe(old.entityId);
  });
  it('throws when superseding an already-superseded observation', () => {
    createEntities(db, [{ name: 'Ada', entityType: 'person' }], T0);
    const [old] = addObservations(db, [{ entityName: 'Ada', content: 'a' }], T0);
    supersedeObservation(db, old.id, 'b', T1);
    expect(() => supersedeObservation(db, old.id, 'c', T1)).toThrow(/already superseded/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/engine/graph.test.ts`
Expected: FAIL — cannot find module `../../src/engine/graph.js`.

- [ ] **Step 3: Write `src/engine/graph.ts` (entities + observations portion)**

```ts
import type Database from 'better-sqlite3';
import type { Entity, Observation } from './types.js';

const entityRow = (r: any): Entity => ({ id: r.id, name: r.name, entityType: r.entity_type, createdAt: r.created_at });
const obsRow = (r: any): Observation => ({
  id: r.id, entityId: r.entity_id, content: r.content,
  validFrom: r.valid_from, validTo: r.valid_to, supersededBy: r.superseded_by, importance: r.importance,
});

export function createEntities(db: Database.Database, items: { name: string; entityType: string }[], now: string): Entity[] {
  const upsert = db.prepare(`
    INSERT INTO entities(name, entity_type, created_at) VALUES (@name, @entityType, @now)
    ON CONFLICT(name) DO UPDATE SET entity_type = excluded.entity_type
  `);
  const get = db.prepare('SELECT * FROM entities WHERE name = ?');
  const tx = db.transaction((rows: { name: string; entityType: string }[]) =>
    rows.map((r) => { upsert.run({ ...r, now }); return entityRow(get.get(r.name)); })
  );
  return tx(items);
}

export function addObservations(
  db: Database.Database,
  items: { entityName: string; content: string; importance?: number }[],
  now: string,
): Observation[] {
  const findEntity = db.prepare('SELECT id FROM entities WHERE name = ?');
  const insert = db.prepare(`
    INSERT INTO observations(entity_id, content, valid_from, valid_to, superseded_by, importance)
    VALUES (?, ?, ?, NULL, NULL, ?)
  `);
  const get = db.prepare('SELECT * FROM observations WHERE id = ?');
  const tx = db.transaction((rows: typeof items) => rows.map((r) => {
    const e = findEntity.get(r.entityName) as { id: number } | undefined;
    if (!e) throw new Error(`unknown entity: ${r.entityName}`);
    const info = insert.run(e.id, r.content, now, r.importance ?? 1.0);
    return obsRow(get.get(info.lastInsertRowid));
  }));
  return tx(items);
}

export function supersedeObservation(db: Database.Database, oldId: number, newContent: string, now: string): Observation {
  const get = db.prepare('SELECT * FROM observations WHERE id = ?');
  const insert = db.prepare(`
    INSERT INTO observations(entity_id, content, valid_from, valid_to, superseded_by, importance)
    VALUES (?, ?, ?, NULL, NULL, ?)
  `);
  const stamp = db.prepare('UPDATE observations SET valid_to = ?, superseded_by = ? WHERE id = ?');
  const tx = db.transaction(() => {
    const old = get.get(oldId) as any;
    if (!old) throw new Error(`observation not found: ${oldId}`);
    if (old.valid_to !== null) throw new Error(`observation already superseded: ${oldId}`);
    const info = insert.run(old.entity_id, newContent, now, old.importance);
    stamp.run(now, info.lastInsertRowid, oldId);
    return obsRow(get.get(info.lastInsertRowid));
  });
  return tx();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/engine/graph.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/graph.ts test/engine/graph.test.ts
git commit -m "feat: entities + observations CRUD with temporal supersession"
```

---

### Task 4: Relations + reads (read_graph, open_nodes) + deletes

**Files:**
- Modify: `src/engine/graph.ts`
- Test: `test/engine/graph.test.ts` (append)

**Interfaces:**
- Consumes: Task 3 functions + types.
- Produces (all take `db`):
  - `createRelations(db, items: { from: string; to: string; relationType: string }[], now: string): Relation[]` — resolves entity names; throws on unknown.
  - `readGraph(db): GraphDump` — currently-valid entities, relations, observations only.
  - `openNodes(db, names: string[]): GraphDump` — the named entities plus their valid observations and valid relations touching them.
  - `deleteEntities(db, names: string[]): void` (cascades observations + relations), `deleteRelations(db, ids: number[]): void`, `deleteObservations(db, ids: number[]): void` — hard removal.

- [ ] **Step 1: Append failing tests**

```ts
// append to test/engine/graph.test.ts
import { createRelations, readGraph, openNodes, deleteEntities } from '../../src/engine/graph.js';

describe('relations + reads', () => {
  beforeEach(() => {
    createEntities(db, [{ name: 'Ada', entityType: 'person' }, { name: 'London', entityType: 'city' }], T0);
    addObservations(db, [{ entityName: 'Ada', content: 'lives in London' }], T0);
    createRelations(db, [{ from: 'Ada', to: 'London', relationType: 'lives_in' }], T0);
  });

  it('createRelations links two entities', () => {
    const g = readGraph(db);
    expect(g.relations).toHaveLength(1);
    expect(g.relations[0]).toMatchObject({ relationType: 'lives_in', validTo: null });
  });
  it('createRelations throws on unknown entity', () => {
    expect(() => createRelations(db, [{ from: 'Ada', to: 'Nowhere', relationType: 'x' }], T0)).toThrow(/unknown entity/i);
  });
  it('readGraph returns only valid rows', () => {
    const [old] = addObservations(db, [{ entityName: 'Ada', content: 'temp' }], T0);
    supersedeObservation(db, old.id, 'updated', T1);
    const g = readGraph(db);
    const contents = g.observations.map((o) => o.content);
    expect(contents).toContain('updated');
    expect(contents).not.toContain('temp');
  });
  it('openNodes returns the named entity with its observations and relations', () => {
    const g = openNodes(db, ['Ada']);
    expect(g.entities.map((e) => e.name)).toEqual(['Ada']);
    expect(g.observations.some((o) => o.content === 'lives in London')).toBe(true);
    expect(g.relations).toHaveLength(1);
  });
  it('deleteEntities cascades observations and relations', () => {
    deleteEntities(db, ['Ada']);
    const g = readGraph(db);
    expect(g.entities.map((e) => e.name)).toEqual(['London']);
    expect(g.observations).toHaveLength(0);
    expect(g.relations).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/engine/graph.test.ts`
Expected: FAIL — `createRelations` / `readGraph` / `openNodes` / `deleteEntities` are not exported.

- [ ] **Step 3: Append to `src/engine/graph.ts`**

```ts
import type { Relation, GraphDump } from './types.js';

const relRow = (r: any): Relation => ({
  id: r.id, fromEntity: r.from_entity, toEntity: r.to_entity, relationType: r.relation_type,
  validFrom: r.valid_from, validTo: r.valid_to, supersededBy: r.superseded_by,
});

export function createRelations(db: Database.Database, items: { from: string; to: string; relationType: string }[], now: string): Relation[] {
  const findEntity = db.prepare('SELECT id FROM entities WHERE name = ?');
  const insert = db.prepare(`
    INSERT INTO relations(from_entity, to_entity, relation_type, valid_from, valid_to, superseded_by)
    VALUES (?, ?, ?, ?, NULL, NULL)
  `);
  const get = db.prepare('SELECT * FROM relations WHERE id = ?');
  const resolve = (name: string): number => {
    const e = findEntity.get(name) as { id: number } | undefined;
    if (!e) throw new Error(`unknown entity: ${name}`);
    return e.id;
  };
  const tx = db.transaction((rows: typeof items) => rows.map((r) => {
    const info = insert.run(resolve(r.from), resolve(r.to), r.relationType, now);
    return relRow(get.get(info.lastInsertRowid));
  }));
  return tx(items);
}

export function readGraph(db: Database.Database): GraphDump {
  return {
    entities: (db.prepare('SELECT * FROM entities ORDER BY id').all() as any[]).map(entityRow),
    relations: (db.prepare('SELECT * FROM relations WHERE valid_to IS NULL ORDER BY id').all() as any[]).map(relRow),
    observations: (db.prepare('SELECT * FROM observations WHERE valid_to IS NULL ORDER BY id').all() as any[]).map(obsRow),
  };
}

export function openNodes(db: Database.Database, names: string[]): GraphDump {
  if (names.length === 0) return { entities: [], relations: [], observations: [] };
  const placeholders = names.map(() => '?').join(',');
  const entities = (db.prepare(`SELECT * FROM entities WHERE name IN (${placeholders}) ORDER BY id`).all(...names) as any[]).map(entityRow);
  const ids = entities.map((e) => e.id);
  if (ids.length === 0) return { entities: [], relations: [], observations: [] };
  const idPlaceholders = ids.map(() => '?').join(',');
  const observations = (db.prepare(
    `SELECT * FROM observations WHERE valid_to IS NULL AND entity_id IN (${idPlaceholders}) ORDER BY id`
  ).all(...ids) as any[]).map(obsRow);
  const relations = (db.prepare(
    `SELECT * FROM relations WHERE valid_to IS NULL AND (from_entity IN (${idPlaceholders}) OR to_entity IN (${idPlaceholders})) ORDER BY id`
  ).all(...ids, ...ids) as any[]).map(relRow);
  return { entities, relations, observations };
}

export function deleteEntities(db: Database.Database, names: string[]): void {
  const stmt = db.prepare('DELETE FROM entities WHERE name = ?');
  const tx = db.transaction((rows: string[]) => rows.forEach((n) => stmt.run(n)));
  tx(names);
}
export function deleteRelations(db: Database.Database, ids: number[]): void {
  const stmt = db.prepare('DELETE FROM relations WHERE id = ?');
  const tx = db.transaction((rows: number[]) => rows.forEach((id) => stmt.run(id)));
  tx(ids);
}
export function deleteObservations(db: Database.Database, ids: number[]): void {
  const stmt = db.prepare('DELETE FROM observations WHERE id = ?');
  const tx = db.transaction((rows: number[]) => rows.forEach((id) => stmt.run(id)));
  tx(ids);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/engine/graph.test.ts`
Expected: PASS (all graph tests, 11 total).

- [ ] **Step 5: Commit**

```bash
git add src/engine/graph.ts test/engine/graph.test.ts
git commit -m "feat: relations, read_graph, open_nodes, hard deletes"
```

---

### Task 5: FTS5 keyword search

**Files:**
- Create: `src/engine/search.ts`
- Test: `test/engine/search.test.ts`

**Interfaces:**
- Consumes: Task 2/3 (`openDb`, `createEntities`, `addObservations`, `supersedeObservation`), types.
- Produces: `searchMemory(db, query: string, limit = 10): SearchHit[]` — FTS5 BM25 over `obs_fts`, joined to entities, filtered to `valid_to IS NULL`, best match first (`score` = `-bm25`, so higher = better). Empty/whitespace query returns `[]`.

- [ ] **Step 1: Write failing search tests**

```ts
// test/engine/search.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { openDb } from '../../src/engine/db.js';
import { createEntities, addObservations, supersedeObservation } from '../../src/engine/graph.js';
import { searchMemory } from '../../src/engine/search.js';

const T0 = '2026-06-22T10:00:00.000Z';
const T1 = '2026-06-22T11:00:00.000Z';
let db: Database.Database;
beforeEach(() => {
  db = openDb(':memory:');
  createEntities(db, [{ name: 'Ada', entityType: 'person' }], T0);
  addObservations(db, [
    { entityName: 'Ada', content: 'enjoys analytical engines' },
    { entityName: 'Ada', content: 'corresponds with Babbage about mathematics' },
  ], T0);
});

describe('searchMemory', () => {
  it('finds observations by keyword and attaches the entity', () => {
    const hits = searchMemory(db, 'engines');
    expect(hits).toHaveLength(1);
    expect(hits[0].observation.content).toContain('analytical engines');
    expect(hits[0].entity.name).toBe('Ada');
  });
  it('returns empty for a blank query', () => {
    expect(searchMemory(db, '   ')).toEqual([]);
  });
  it('excludes superseded observations', () => {
    const [old] = addObservations(db, [{ entityName: 'Ada', content: 'unique-token-xyz' }], T0);
    supersedeObservation(db, old.id, 'replacement', T1);
    expect(searchMemory(db, 'unique-token-xyz')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/engine/search.test.ts`
Expected: FAIL — cannot find module `../../src/engine/search.js`.

- [ ] **Step 3: Write `src/engine/search.ts`**

```ts
import type Database from 'better-sqlite3';
import type { SearchHit } from './types.js';

export function searchMemory(db: Database.Database, query: string, limit = 10): SearchHit[] {
  if (!query.trim()) return [];
  const rows = db.prepare(`
    SELECT o.id, o.entity_id, o.content, o.valid_from, o.valid_to, o.superseded_by, o.importance,
           e.name AS e_name, e.entity_type AS e_type, e.created_at AS e_created,
           bm25(obs_fts) AS bm25
    FROM obs_fts
    JOIN observations o ON o.id = obs_fts.rowid
    JOIN entities e ON e.id = o.entity_id
    WHERE obs_fts MATCH ? AND o.valid_to IS NULL
    ORDER BY bm25
    LIMIT ?
  `).all(query, limit) as any[];
  return rows.map((r) => ({
    observation: {
      id: r.id, entityId: r.entity_id, content: r.content,
      validFrom: r.valid_from, validTo: r.valid_to, supersededBy: r.superseded_by, importance: r.importance,
    },
    entity: { id: r.entity_id, name: r.e_name, entityType: r.e_type, createdAt: r.e_created },
    score: -r.bm25, // bm25() returns lower = better; negate so higher = better
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/engine/search.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/search.ts test/engine/search.test.ts
git commit -m "feat: FTS5 keyword search (valid-only, bm25-ranked)"
```

---

### Task 6: Stats

**Files:**
- Create: `src/engine/stats.ts`
- Test: `test/engine/stats.test.ts`

**Interfaces:**
- Consumes: Task 2/3 functions.
- Produces: `stats(db): { entities: number; relations: { valid: number; superseded: number }; observations: { valid: number; superseded: number }; schemaVersion: string }`.

- [ ] **Step 1: Write failing stats test**

```ts
// test/engine/stats.test.ts
import { describe, it, expect } from 'vitest';
import { openDb } from '../../src/engine/db.js';
import { createEntities, addObservations, supersedeObservation } from '../../src/engine/graph.js';
import { stats } from '../../src/engine/stats.js';

const T0 = '2026-06-22T10:00:00.000Z', T1 = '2026-06-22T11:00:00.000Z';

describe('stats', () => {
  it('counts valid vs superseded observations', () => {
    const db = openDb(':memory:');
    createEntities(db, [{ name: 'Ada', entityType: 'person' }], T0);
    const [old] = addObservations(db, [{ entityName: 'Ada', content: 'a' }], T0);
    supersedeObservation(db, old.id, 'b', T1);
    const s = stats(db);
    expect(s.entities).toBe(1);
    expect(s.observations).toEqual({ valid: 1, superseded: 1 });
    expect(s.schemaVersion).toBe('1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/engine/stats.test.ts`
Expected: FAIL — cannot find module `../../src/engine/stats.js`.

- [ ] **Step 3: Write `src/engine/stats.ts`**

```ts
import type Database from 'better-sqlite3';

export interface Stats {
  entities: number;
  relations: { valid: number; superseded: number };
  observations: { valid: number; superseded: number };
  schemaVersion: string;
}

export function stats(db: Database.Database): Stats {
  const one = (sql: string): number => (db.prepare(sql).get() as { n: number }).n;
  const version = (db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get() as { value: string } | undefined)?.value ?? '0';
  return {
    entities: one('SELECT COUNT(*) AS n FROM entities'),
    relations: {
      valid: one('SELECT COUNT(*) AS n FROM relations WHERE valid_to IS NULL'),
      superseded: one('SELECT COUNT(*) AS n FROM relations WHERE valid_to IS NOT NULL'),
    },
    observations: {
      valid: one('SELECT COUNT(*) AS n FROM observations WHERE valid_to IS NULL'),
      superseded: one('SELECT COUNT(*) AS n FROM observations WHERE valid_to IS NOT NULL'),
    },
    schemaVersion: version,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/engine/stats.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/engine/stats.ts test/engine/stats.test.ts
git commit -m "feat: engine stats (valid vs superseded counts)"
```

---

### Task 7: MCP adapter — tools + resources + server

**Files:**
- Create: `src/mcp/tools.ts`, `src/mcp/resources.ts`, `src/server.ts`
- Test: `test/mcp/tools.test.ts`

**Interfaces:**
- Consumes: all engine functions (Tasks 3–6).
- Produces:
  - `registerTools(server: McpServer, db: Database.Database): void` — registers `create_entities`, `create_relations`, `add_observations`, `supersede_observation`, `delete_entities`, `delete_relations`, `delete_observations`, `search_memory`, `read_graph`, `open_nodes`. **Raw-shape** `inputSchema`. Each returns `{ content: [{ type: 'text', text: JSON.stringify(result) }] }`; engine throws map to `{ isError: true, content: [...] }`.
  - `registerResources(server: McpServer, db: Database.Database): void` — `schema://stats`.
  - `buildServer(db: Database.Database): McpServer`.

- [ ] **Step 1: Write failing adapter test (drives the engine through a tool callback)**

```ts
// test/mcp/tools.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { openDb } from '../../src/engine/db.js';
import { makeHandlers } from '../../src/mcp/tools.js';

let db: Database.Database;
let h: ReturnType<typeof makeHandlers>;
beforeEach(() => { db = openDb(':memory:'); h = makeHandlers(db, () => '2026-06-22T10:00:00.000Z'); });

describe('tool handlers', () => {
  it('create_entities then add_observations then search_memory round-trips', async () => {
    await h.create_entities({ entities: [{ name: 'Ada', entityType: 'person' }] });
    await h.add_observations({ observations: [{ entityName: 'Ada', content: 'loves engines' }] });
    const res = await h.search_memory({ query: 'engines' });
    const payload = JSON.parse(res.content[0].text);
    expect(payload[0].entity.name).toBe('Ada');
    expect(res.isError).toBeFalsy();
  });
  it('maps engine errors to isError responses', async () => {
    const res = await h.add_observations({ observations: [{ entityName: 'Ghost', content: 'x' }] });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/unknown entity/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/mcp/tools.test.ts`
Expected: FAIL — cannot find module `../../src/mcp/tools.js`.

- [ ] **Step 3: Write `src/mcp/tools.ts`**

```ts
import type Database from 'better-sqlite3';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createEntities, createRelations, addObservations, supersedeObservation,
  deleteEntities, deleteRelations, deleteObservations, readGraph, openNodes,
} from '../engine/graph.js';
import { searchMemory } from '../engine/search.js';

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };
const ok = (data: unknown): ToolResult => ({ content: [{ type: 'text', text: JSON.stringify(data) }] });
const err = (e: unknown): ToolResult => ({ content: [{ type: 'text', text: String(e instanceof Error ? e.message : e) }], isError: true });
const guard = (fn: () => unknown): ToolResult => { try { return ok(fn()); } catch (e) { return err(e); } };

// Pure handler map — unit-testable without a transport. `now` is injected for determinism.
export function makeHandlers(db: Database.Database, now: () => string) {
  return {
    create_entities: async (a: { entities: { name: string; entityType: string }[] }) => guard(() => createEntities(db, a.entities, now())),
    create_relations: async (a: { relations: { from: string; to: string; relationType: string }[] }) => guard(() => createRelations(db, a.relations, now())),
    add_observations: async (a: { observations: { entityName: string; content: string; importance?: number }[] }) => guard(() => addObservations(db, a.observations, now())),
    supersede_observation: async (a: { oldId: number; newContent: string }) => guard(() => supersedeObservation(db, a.oldId, a.newContent, now())),
    delete_entities: async (a: { names: string[] }) => guard(() => { deleteEntities(db, a.names); return { deleted: a.names.length }; }),
    delete_relations: async (a: { ids: number[] }) => guard(() => { deleteRelations(db, a.ids); return { deleted: a.ids.length }; }),
    delete_observations: async (a: { ids: number[] }) => guard(() => { deleteObservations(db, a.ids); return { deleted: a.ids.length }; }),
    search_memory: async (a: { query: string; limit?: number }) => guard(() => searchMemory(db, a.query, a.limit ?? 10)),
    read_graph: async () => guard(() => readGraph(db)),
    open_nodes: async (a: { names: string[] }) => guard(() => openNodes(db, a.names)),
  };
}

export function registerTools(server: McpServer, db: Database.Database): void {
  const h = makeHandlers(db, () => new Date().toISOString());
  const entityShape = { name: z.string(), entityType: z.string() };
  server.registerTool('create_entities',
    { description: 'Upsert named entities with a type.', inputSchema: { entities: z.array(z.object(entityShape)) } },
    h.create_entities);
  server.registerTool('create_relations',
    { description: 'Add directed typed edges between existing entities.', inputSchema: { relations: z.array(z.object({ from: z.string(), to: z.string(), relationType: z.string() })) } },
    h.create_relations);
  server.registerTool('add_observations',
    { description: 'Attach timestamped facts to an entity.', inputSchema: { observations: z.array(z.object({ entityName: z.string(), content: z.string(), importance: z.number().optional() })) } },
    h.add_observations);
  server.registerTool('supersede_observation',
    { description: 'Mark an observation no longer valid and replace it with a new fact (preserves history).', inputSchema: { oldId: z.number(), newContent: z.string() } },
    h.supersede_observation);
  server.registerTool('delete_entities',
    { description: 'Hard-delete entities by name (cascades observations + relations).', inputSchema: { names: z.array(z.string()) } },
    h.delete_entities);
  server.registerTool('delete_relations',
    { description: 'Hard-delete relations by id.', inputSchema: { ids: z.array(z.number()) } },
    h.delete_relations);
  server.registerTool('delete_observations',
    { description: 'Hard-delete observations by id.', inputSchema: { ids: z.array(z.number()) } },
    h.delete_observations);
  server.registerTool('search_memory',
    { description: 'Keyword-search currently-valid observations; returns hits with their entity.', inputSchema: { query: z.string(), limit: z.number().optional() } },
    h.search_memory);
  server.registerTool('read_graph',
    { description: 'Dump the full currently-valid graph.', inputSchema: {} },
    h.read_graph);
  server.registerTool('open_nodes',
    { description: 'Fetch named entities with their valid observations and relations.', inputSchema: { names: z.array(z.string()) } },
    h.open_nodes);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/mcp/tools.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write `src/mcp/resources.ts`**

```ts
import type Database from 'better-sqlite3';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { stats } from '../engine/stats.js';

export function registerResources(server: McpServer, db: Database.Database): void {
  server.registerResource(
    'stats', 'schema://stats',
    { title: 'Memory stats', description: 'Counts of entities/relations/observations (valid vs superseded).', mimeType: 'application/json' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(stats(db)) }] }),
  );
}
```

- [ ] **Step 6: Write `src/server.ts`**

```ts
import type Database from 'better-sqlite3';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './mcp/tools.js';
import { registerResources } from './mcp/resources.js';

export function buildServer(db: Database.Database): McpServer {
  const server = new McpServer({ name: 'brain', version: '0.1.0' });
  registerTools(server, db);
  registerResources(server, db);
  return server;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/mcp/tools.ts src/mcp/resources.ts src/server.ts test/mcp/tools.test.ts
git commit -m "feat: MCP adapter — 10 tools + schema://stats resource + server wiring"
```

---

### Task 8: Transports (stdio + HTTP) + Dockerfile + CI

**Files:**
- Create: `src/stdio.ts`, `src/http.ts`, `Dockerfile`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `loadEnv` (Task 1), `openDb` (Task 2), `buildServer` (Task 7).
- Produces: runnable entry points. No new test file — covered by `npm run build` + the full suite in CI.

- [ ] **Step 1: Write `src/stdio.ts`**

```ts
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadEnv } from './env.js';
import { openDb } from './engine/db.js';
import { buildServer } from './server.js';
import { logger } from './logger.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const db = openDb(env.sqlitePath);
  const server = buildServer(db);
  await server.connect(new StdioServerTransport()); // stdout = JSON-RPC; never console.log
  logger.info('brain stdio server connected', { sqlitePath: env.sqlitePath });
}
main().catch((e) => { logger.error('fatal', { error: String(e) }); process.exit(1); });
```

- [ ] **Step 2: Write `src/http.ts` (hand-built Express app)**

```ts
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadEnv } from './env.js';
import { openDb } from './engine/db.js';
import { buildServer } from './server.js';
import { logger } from './logger.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const db = openDb(env.sqlitePath);
  const app = express();
  app.use(express.json()); // build the app by hand — do NOT also call createMcpExpressApp()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await buildServer(db).connect(transport);
  app.post('/mcp', (req, res) => { transport.handleRequest(req, res, req.body); });
  app.listen(env.port, () => logger.info('brain http server listening', { port: env.port }));
}
main().catch((e) => { logger.error('fatal', { error: String(e) }); process.exit(1); });
```

- [ ] **Step 3: Write `Dockerfile`**

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV TRANSPORT=http
CMD ["node", "dist/http.js"]
```

- [ ] **Step 4: Write `.github/workflows/ci.yml`**

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - run: npm test
```

- [ ] **Step 5: Verify the whole project builds and all tests pass**

Run: `npm run build && npm test`
Expected: build succeeds (no TS errors); all tests green (env + db + graph + search + stats + tools).

- [ ] **Step 6: Commit**

```bash
git add src/stdio.ts src/http.ts Dockerfile .github/workflows/ci.yml
git commit -m "feat: stdio + http transports, Dockerfile, CI"
```

---

### Task 9: Wire into Claude Code + dogfood

**Files:** none (operational).

**Interfaces:** Consumes the built `dist/stdio.js`.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: `dist/stdio.js` exists.

- [ ] **Step 2: Register at user scope with an ABSOLUTE db path**

Run:
```bash
claude mcp add brain -s user -e SQLITE_PATH=/Users/franciscosoltero/Desktop/Code/claude-brain-mcp/brain.db -- node /Users/franciscosoltero/Desktop/Code/claude-brain-mcp/dist/stdio.js
claude mcp get brain
```
Expected: `Scope: User config`, `Status: ✔ Connected`.

- [ ] **Step 3: Dogfood the round-trip**

In a Claude Code session, exercise: `create_entities` → `add_observations` → `search_memory` (find it) → `supersede_observation` → `search_memory` (old gone, new found) → read `schema://stats` (valid=1, superseded=1).

- [ ] **Step 4: Update HANDOFF.md** noting P1 shipped + wired, and capture any gotchas via the `capture-lesson` skill.

---

## Self-Review

**Spec coverage:**
- §2 layering (engine pure / mcp thin) → Tasks 2–6 (engine) vs Task 7 (mcp). ✓
- §3 schema (entities/observations/relations + supersession + FTS5 + meta) → Task 2. ✓
- §4 full tool surface (10 tools + schema://stats; `core://memory` is P3, correctly excluded) → Tasks 5–7. ✓
- §5 write/supersede/read data flow → Tasks 3 (write+supersede), 4 (read), 5 (search). ✓
- §6 error handling: input validation (Zod, Task 1/7), structured errors (`guard`/`isError`, Task 7), no-`console.log` + hand-built Express (Task 8). P2-only items (Ollama, dim mismatch, sqlite-vec) correctly out of P1 scope. ✓
- §7 testing (engine unit + adapter, in-memory per test) → every task is TDD. ✓
- §8 P1 scope (graph + supersession + FTS5, zero deps) → entire plan; no Ollama/sqlite-vec anywhere. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every test step shows the assertion and command. ✓

**Type consistency:** `Entity/Observation/Relation` field names (`entityType`, `validTo`, `supersededBy`, `fromEntity`) are identical across `types.ts`, `graph.ts`, `search.ts`, `stats.ts`, and the tool handlers. `makeHandlers(db, now)` signature is the same in the test and in `tools.ts`. Engine functions consistently take `now: string`; the MCP layer injects `() => new Date().toISOString()`. ✓
