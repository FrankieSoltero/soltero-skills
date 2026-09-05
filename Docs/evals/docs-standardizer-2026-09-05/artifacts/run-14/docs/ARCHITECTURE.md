# acme-ledger Architecture

## System Design

acme-ledger is a simple, single-process ledger service. It receives JSON entry requests, applies business logic through a plugin pipeline, stores entries in SQLite, and returns confirmation.

### Design Principles

1. **Single Writer:** One process writes to the ledger. Concurrency control is OS-level file locking via SQLite.
2. **Immutable Log:** Entries are never updated, only inserted. Corrections are new entries.
3. **Precision First:** All currency amounts are integers (cents). No floats in the posting path.
4. **Plugin Extensibility:** Business logic is added via a before/after hook pipeline. No hardcoding.
5. **Migrations as SQL:** Schema changes are numbered SQL files, applied in order at startup.

---

## Request/Response Flow

### 1. HTTP Request

```
POST /entries
Content-Type: application/json

{
  "side": "debit",
  "amount": 123.45,
  "currency": "USD",
  ...
}
```

### 2. Routing (`src/http/router.js`)

- Matches `POST /entries`.
- Reads request body as JSON.
- Calls `post(input, plugins)`.

### 3. Posting Pipeline (`src/ledger/post.js`)

```javascript
// 1. Normalize amount to integer cents
entry = {
  ...input,
  cents: roundHalfEven(input.amount * 100)
};

// 2. Run beforePost hooks
for (const p of plugins) {
  if (p.hooks.beforePost)
    entry = p.hooks.beforePost(entry);
}

// 3. Insert into database
insertEntry(entry);

// 4. Run afterPost hooks
for (const p of plugins) {
  if (p.hooks.afterPost)
    entry = p.hooks.afterPost(entry);
}

// 5. Return enriched entry
return entry;
```

### 4. Database Write (`src/db.js`)

In production: SQLite file.
In tests: In-memory array (allows test isolation).

### 5. Response

```json
{
  "side": "debit",
  "amount": 123.45,
  "cents": 12345,
  "currency": "USD",
  "audited": true,
  ...
}
```

(Fields like `audited` are added by plugins.)

---

## Plugin System

### Discovery (`src/plugins/registry.js`)

At startup, `loadPlugins()` scans `src/plugins/` for all `.js` files (excluding `registry.js`), imports them, and collects their default exports.

```javascript
const plugins = await loadPlugins();
// plugins = [audit-log, fx-normalize, ...]
```

### Plugin Contract

Each plugin exports:

```javascript
export default {
  name: 'my-plugin',
  hooks: {
    beforePost(entry) {
      // Modify or validate the entry BEFORE it's stored.
      // Return the (possibly modified) entry, or throw to reject.
      return entry;
    },
    afterPost(entry) {
      // Modify the entry AFTER it's stored.
      // Useful for logging, side effects, or enrichment.
      // The database already has the entry at this point.
      return entry;
    },
  },
};
```

### Examples

**audit-log** (`src/plugins/audit-log.js`): Marks every entry as audited after posting.

**fx-normalize** (`src/plugins/fx-normalize.js`): Converts currency to a base currency before posting (hypothetical).

### Adding a Plugin

1. Create `src/plugins/my-feature.js`.
2. Export the plugin contract.
3. Restart the server—it's auto-loaded.
4. Test with `post(input, [myPlugin])` in unit tests.

### Removing a Plugin

1. Delete the file or rename it (e.g., `my-feature.js.bak`).
2. Restart the server—it won't be loaded.

---

## Data Model

### Table: `entries`

```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY,
  side TEXT NOT NULL,
  cents INTEGER NOT NULL,
  currency TEXT NOT NULL
);
```

- **id:** Auto-incrementing primary key.
- **side:** Debit or credit (string, no enum constraint—flexibility for billing teams).
- **cents:** Amount in integer cents. Never floats.
- **currency:** ISO 4217 code (e.g., "USD", "EUR").

Additional fields can be added via migrations. See `migrations/` for examples.

### Immutability Guarantee

Entries are never UPDATEd. Corrections are new INSERT entries. This keeps the audit trail intact and avoids reconciliation bugs.

---

## Rounding: The Non-Negotiable Rule

### The Problem

Floating-point arithmetic causes drift:
```javascript
0.1 + 0.2 === 0.30000000000000004  // true!
Math.round(0.1 + 0.2) * 100  // 30, but then what about the fractional cent?
```

In February 2025, posting code used `Math.round()`, causing a mismatch between posted amounts and bank reconciliation.

### The Solution

All amounts in the posting pipeline **must** be converted to integer cents using `roundHalfEven()` from `src/ledger/rounding.js`.

```javascript
import { roundHalfEven } from './rounding.js';

const cents = roundHalfEven(123.456 * 100);  // 12346
```

`roundHalfEven` implements banker's rounding (round half to even), which is the IEEE 754 standard for financial calculations.

### Testing Rounding

Add a test to `test/rounding.test.js` for any new posting logic:

```javascript
test('posting converts to cents correctly', () => {
  const entry = post({ amount: 123.456 }, []);
  assert.equal(entry.cents, 12346);
});
```

### No Exceptions

- No `Math.round()`.
- No `parseFloat()` without `roundHalfEven`.
- No stored floats in the database.
- Plugins must also respect this rule in their `beforePost` hooks.

---

## Database Access

### Production: SQLite

`src/db.js` exports functions:

```javascript
insertEntry(entry)    // Returns the entry as stored (with ID).
allEntries()          // Returns all entries (for testing/debugging only).
reset()               // Clear all entries (testing only).
```

The real SQLite driver is loaded in production. File path is set via `LEDGER_DB_PATH` environment variable.

### Testing: In-Memory

For tests, `src/db.js` provides an in-memory mock. This allows test isolation without file I/O.

### Migrations

SQL migrations in `migrations/` are applied by `scripts/migrate.js` at startup. They're numbered sequentially:
- `0001_entries.sql` (initial schema)
- `0002_add_timestamp.sql` (hypothetical)

Each migration runs once. The framework tracks which have been applied.

---

## Reconciliation

`src/ledger/reconcile.js` implements nightly reconciliation (balance all entries for the day, verify sums).

**Note:** This is a separate concern from posting and runs asynchronously. It does not block entry posting.

---

## Security Considerations

### Input Validation

HTTP requests are parsed as JSON. The router does basic validation (is it valid JSON?). Plugins can add stricter validation in `beforePost` hooks.

### No SQL Injection

Entries are inserted via parameterized queries (provided by the SQLite driver). Raw SQL is only in `migrations/`, which is not user-controlled.

### No Authorization

acme-ledger does not implement authentication or authorization. It assumes deployment behind a reverse proxy or API gateway that handles these concerns. (Future work.)

### Audit Trail

Entries are immutable. The `audit-log` plugin marks entries as audited. For detailed audit logs, consider adding a `created_at` timestamp to the schema.

---

## Deployment Model

acme-ledger is designed for **single-process, single-writer** deployment:

- One instance of the server runs.
- One SQLite database file (or in-memory for testing).
- No multi-process concurrency control needed beyond SQLite's file locking.

If a second writer is added (e.g., async reconciliation updates), migration to Postgres (or another multi-writer DB) is needed. See ADR 0001.

---

## Development Workflow

### Local Development

```bash
make dev  # Starts server with src/app.js, watches for changes, uses ./var/dev.sqlite
```

Changes to `src/` trigger a restart. Changes to `migrations/` require manual migration run.

### Testing

```bash
npm test  # Runs all tests with Node's test runner
```

Tests use the in-memory database. Each test file is isolated.

### Linting

```bash
npm run lint  # ESLint
```

### Committing

- Update `docs/adr/` if you've made a decision.
- Update `doc/notes.md` for short-lived gotchas.
- Update this file if you've changed architecture.
- Run tests and lint before committing.

---

## Troubleshooting

### Tests fail with "entries table not found"

The test setup doesn't run migrations. If a migration adds a new table, update `test/post.test.js` to create it.

### Entries are posted but don't appear in queries

Check that `LEDGER_DB_PATH` is set and writable. Verify the `entries` table schema with `sqlite3 <path> ".schema"`.

### Rounding test fails

Review `src/ledger/rounding.js` and `test/rounding.test.js`. If you've changed rounding logic, ensure the test reflects the new behavior and aligns with the billing team's requirements.

---

## Future Considerations

- **Multi-writer:** If concurrency is needed, migrate to Postgres or add a write-ahead log to SQLite.
- **Authentication:** Add bearer token or OAuth2 validation.
- **Audit trail:** Add `created_at` and `created_by` columns to `entries`. Add audit log table for plugin events.
- **Reconciliation:** Async reconciliation service with retry logic.
- **Monitoring:** Add logging and metrics export (e.g., Prometheus).

---

Generated: 2026-09-05
