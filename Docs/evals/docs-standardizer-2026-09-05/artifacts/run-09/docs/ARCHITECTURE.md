# Architecture

## Overview

`acme-ledger` is a double-entry ledger service for billing. It records debit/credit entries, applies plugin transformations, and reconciles daily. Single-writer, one process, SQLite backend. See `docs/adr/0001-use-sqlite.md` for the database decision.

## Entry point

- **`src/app.js`** — Starts the HTTP server on `process.env.PORT` (default 8080).
  - Call: `node src/app.js`
  - Dev mode: `make dev` (uses `node --watch` for file watching)

## Core modules

### `src/http/router.js`
HTTP request router. Exposes the ledger API. Takes loaded plugins as input.

### `src/ledger/post.js`
**Most frequently edited.** Posts an entry to the ledger:
- Takes: `{ amount, side, currency }` + plugin list
- Applies plugins' `beforePost` hooks (in order of loading)
- Rounds using ONLY `roundHalfEven()` — **never `Math.round()`** (see notes in `doc/notes.md`)
- Stores in `src/db.js`
- Applies plugins' `afterPost` hooks
- Returns the posted entry object

### `src/ledger/rounding.js`
**Critical.** The ONLY rounding function permitted in posting logic. Do not add Math.round() directly to post.js or any calculation path. Every amount is stored as integer cents; `roundHalfEven` converts dollars to cents using banker's rounding.

### `src/ledger/reconcile.js`
Runs nightly (scheduled via `RECONCILE_CRON` in `.env`). Compares recorded debits and credits. Logs discrepancies.

### `src/db.js`
Database interface. Currently a simple in-memory store for development (populated by migrations during tests).

## Plugin system

Every `.js` file under `src/plugins/` (except `registry.js`) is a plugin. Each exports:
```javascript
export default {
  name: 'plugin-name',
  hooks: {
    beforePost(entry) { /* ... */ },   // optional
    afterPost(entry)  { /* ... */ }    // optional
  }
}
```

- Plugins run in filesystem order (alphabetical by filename).
- `beforePost` runs before rounding and storage; can modify the entry.
- `afterPost` runs after storage; cannot affect the stored record but can add fields (audit log, etc.).
- **Discovery by filename.** No registration list. Add a file, it loads automatically.

Example plugins:
- `audit-log.js` — Tags entries as audited in afterPost
- `fx-normalize.js` — Converts non-USD currencies to USD in beforePost

## Database

### Storage
SQLite file at `LEDGER_DB_PATH` (default `./var/ledger.sqlite`).

### Schema
```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY,
  side TEXT NOT NULL,           -- 'debit' or 'credit'
  cents INTEGER NOT NULL,       -- dollar amount × 100
  currency TEXT NOT NULL        -- ISO 4217 code (e.g., 'USD')
);
```

### Migrations
Numbered SQL files in `migrations/` (e.g., `0001_entries.sql`).
Applied by `npm run migrate` (calls `scripts/migrate.js`).
Run **before the server starts for the first time.**

## Environment

Copy `.env.example` to `.env`:
```
PORT=8080                              # Server port (default if omitted)
LEDGER_DB_PATH=./var/dev.sqlite       # SQLite file path
RECONCILE_CRON=15 2 * * *             # Nightly reconcile schedule (cron format)
```

## Testing

- Unit tests: `npm test` (runs all `.test.js` files under `test/`)
- Test DB: In-memory (uses `src/db.js` directly; does not touch the file DB)

## Key files & line refs

| File | Purpose | Gotchas |
|------|---------|---------|
| `src/app.js` | HTTP server startup | Import order: plugins must load before router |
| `src/ledger/post.js:20-45` | Entry posting + plugin orchestration | ONLY use `roundHalfEven()` for rounding |
| `src/ledger/rounding.js` | Banker's rounding | Do not bypass this function |
| `src/plugins/registry.js:10-18` | Plugin discovery | Auto-discovers by filename; no manual registration |
| `src/db.js` | Storage interface | Dev = in-memory; prod = SQLite file |
| `migrations/` | Schema | Must run `npm run migrate` before first server start |

## Common tasks

### Add a new entry field
1. Update the `entries` table schema (new migration in `migrations/`)
2. Update `post.js` to handle it
3. Update tests

### Add a plugin
1. Create `.js` file under `src/plugins/`
2. Export `{ name, hooks }` as default
3. Restart server (auto-loads)

### Debug plugin execution order
Plugins load in filename order. Check `src/plugins/` listing.

### Change reconcile schedule
Edit `RECONCILE_CRON` in `.env` (cron format; default `15 2 * * *` = 2:15 AM daily).

## Secrets & security

No secrets currently. Keep auth, API keys, and database credentials out of source (use `.env` and `.gitignore`).
