# acme-ledger Developer Guide

## Project Overview

**acme-ledger** is a double-entry ledger service for Acme's billing team. It handles financial entry posting with precision guarantees around currency conversion and rounding.

**Tech Stack:** Node.js (ES modules), SQLite, vanilla HTTP server (no frameworks).

**Key Invariant:** All amounts are stored as integer cents. This is not optional—never use `Math.round()` directly in posting code. See [The Feb Drift Incident](#the-feb-drift-incident).

## Quick Start for New Agents

```bash
# Install dependencies
npm install

# Run dev server (rebuilds on file change, points DB at ./var/dev.sqlite)
make dev

# Run all tests
npm test

# Lint check
npm run lint

# Apply schema migrations
npm run migrate
```

The server starts on port 8080 (or `$PORT`) and listens for `POST /entries`.

---

## Architecture at a Glance

### Entry Posting Flow

```
POST /entries (JSON)
    ↓
router(plugins)
    ↓
post(input, plugins)
    ├─ before-Post hooks (plugins)
    ├─ insertEntry() [db.js]
    └─ after-Post hooks (plugins)
    ↓
response (JSON)
```

### Directory Structure

```
src/
├─ app.js              # Server startup, plugin loading
├─ db.js               # Data store (SQLite in production, in-memory in tests)
├─ http/
│  └─ router.js        # HTTP request routing
├─ ledger/
│  ├─ post.js          # Entry posting pipeline
│  ├─ reconcile.js     # Nightly reconciliation
│  └─ rounding.js      # roundHalfEven (DO NOT REPLACE)
└─ plugins/
   ├─ registry.js      # Plugin discovery (auto-loads all *.js except registry.js)
   ├─ audit-log.js     # Marks entries as audited
   └─ fx-normalize.js  # Currency conversion
migrations/
├─ 0001_entries.sql    # Initial schema
scripts/
├─ migrate.js          # Runs pending migrations
test/
├─ post.test.js        # Entry posting tests
├─ rounding.test.js    # Rounding tests
```

---

## Critical Knowledge

### The Feb Drift Incident

In February 2025, a naive `Math.round()` in posting code caused currency mismatch. **This must never happen again.**

**Rule:** Inside `src/ledger/post.js` and all posting code, use ONLY `roundHalfEven()` from `src/ledger/rounding.js`. Any other rounding function is a bug.

**Test for this rule:** If you add new posting code, add a test in `test/rounding.test.js` that proves the rounding is correct.

### Plugin System (Auto-Discovery)

Every `.js` file in `src/plugins/` except `registry.js` is automatically loaded at boot. No registration list.

**Plugin Contract:**
```javascript
export default {
  name: 'my-plugin',       // Plugin name (for debugging)
  hooks: {
    beforePost(entry) { /* runs before insertEntry */ },
    afterPost(entry)  { /* runs after insertEntry */ },
  },
};
```

**Adding a Plugin:**
1. Create `src/plugins/my-plugin.js` with the contract above.
2. Server loads it automatically at startup.
3. Test in `test/post.test.js` with `post(input, plugins)`.

**Removing a Plugin:**
1. Delete the file.
2. Restart server.

### SQLite as the Data Store

See **ADR 0001** in `docs/adr/0001-use-sqlite.md`. SQLite was chosen for single-writer simplicity. If a second writer appears, this decision is up for revisit.

**Migrations:**
- SQL files in `migrations/` are numbered: `0001_*.sql`, `0002_*.sql`, etc.
- `scripts/migrate.js` applies pending migrations in order.
- Always run `npm run migrate` before starting the dev server on a fresh clone.

**Current Schema:**
```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY,
  side TEXT NOT NULL,
  cents INTEGER NOT NULL,
  currency TEXT NOT NULL
);
```

---

## Common Tasks

### Adding a New Endpoint

1. Update `src/http/router.js` with a new route.
2. Create handler logic in a new file under `src/http/` or `src/ledger/`.
3. Write integration tests in `test/`.
4. Document the endpoint in this guide's API section (once you add one).

### Adding a Field to Entries

1. Create a new migration: `migrations/000X_add_column.sql`.
2. Update the schema description above.
3. Update tests to cover the new field.
4. If plugins need the field, update their hooks.

### Fixing a Bug in Posting Logic

1. Write a failing test in `test/post.test.js` that reproduces the bug.
2. Fix `src/ledger/post.js` or the plugin in question.
3. Verify the test passes.
4. If it touches rounding, add a test to `test/rounding.test.js`.

### Changing Rounding Behavior

**Do not.** If you must, discuss with the billing team first. The rounding function is a contract with accounting. Changes are audit-level events.

---

## Testing

```bash
npm test              # Run all tests
npm test -- test/post.test.js  # Run one file
```

Test files use Node's built-in `test()` API (ES modules friendly).

---

## Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Environment variables:
- `PORT` (default 8080) – Server port
- `LEDGER_DB_PATH` (default `:memory:`) – SQLite file path (or `:memory:` for in-memory store)

Dev loop uses `./var/dev.sqlite` to persist state across restarts.

---

## Decision Log

**ADR 0001 — Use SQLite for the Ledger Store** (`docs/adr/0001-use-sqlite.md`)
- **Status:** Accepted (2025-11-03)
- **Context:** Single-writer ledger, one process, nightly reconcile. Postgres was considered but ops cost not justified.
- **Decision:** SQLite via `src/db.js`, numbered SQL migrations, applied by `scripts/migrate.js`.
- **Revisit if:** A second writer appears.

---

## File Navigation for Agents

| Goal | Start Here |
|------|-----------|
| Understand the server startup | `src/app.js`, `src/plugins/registry.js` |
| Add/fix an endpoint | `src/http/router.js` |
| Fix a posting logic bug | `src/ledger/post.js`, `test/post.test.js` |
| Rounding issues | `src/ledger/rounding.js`, `test/rounding.test.js`, and this guide's "The Feb Drift Incident" |
| Add a plugin | `src/plugins/audit-log.js` (example), then update `src/app.js` if hooks needed elsewhere |
| Schema changes | Create migration in `migrations/`, update this doc's schema section |
| CI/CD or deployment | `.github/workflows/ci.yml`, `Makefile` |
| Development workflow | This file + `docs/SETUP.md` + `Makefile` |

---

## Principles for This Repository

1. **Precision over convenience:** Use integer cents, never floats. Use `roundHalfEven` only.
2. **Simplicity over features:** Vanilla HTTP, no frameworks. Migrations as SQL files.
3. **Discoverability over configuration:** Plugins auto-discover by filename. ADRs are in `docs/adr/`.
4. **Single writer:** One process, one ledger. SQLite is appropriate.

---

## When Things Break

### Tests fail after a change
- Check `test/post.test.js` and `test/rounding.test.js` for the failure.
- Revert the change and re-read the affected source file.
- If you changed rounding, see "The Feb Drift Incident" section above.

### Server won't start
- Did you run `npm install`?
- Did you run `npm run migrate`?
- Check `LEDGER_DB_PATH` environment variable.

### Entries aren't being recorded
- Check that `LEDGER_DB_PATH` points to a writable location.
- Verify the `entries` table exists: `sqlite3 <path> ".schema entries"`.
- Check if a plugin's `beforePost` hook is rejecting the entry.

---

## Handoff Notes for the Next Agent

When you finish your work:
1. Update this guide if you've changed architecture, added a principle, or discovered a footgun.
2. Update `docs/adr/` if you've made a decision that will affect future agents.
3. Add notes to `doc/notes.md` for short-lived gotchas (things the team should know this quarter).
4. Commit with a clear message: what changed and why.

---

Generated: 2026-09-05
