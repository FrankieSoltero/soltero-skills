# Architecture

## Entry points
- `src/app.js` — HTTP server via `node:http`. Reads `PORT` (default 8080). Only calls `start()`
  when the file is run directly (`node src/app.js` / `npm start` / `make dev`), so importing it
  elsewhere would not open a port.
- `scripts/migrate.js` — CLI entry run by `npm run migrate` / `make migrate`.

## Module map
| Path | Responsibility | Key exports |
|---|---|---|
| `src/app.js` | Bootstraps the HTTP server | `start()` |
| `src/http/router.js` | Routes `POST /entries` to `post()`; everything else 404s | `router(plugins)` |
| `src/ledger/post.js` | Rounds the amount, runs plugin hooks in order, persists the entry | `post(input, plugins)` |
| `src/ledger/rounding.js` | Round-half-even; the only rounding function allowed in posting code | `roundHalfEven(x)` |
| `src/ledger/reconcile.js` | Sums debits/credits across all entries; reports drift, does not correct it | `reconcile()` |
| `src/db.js` | In-memory store stand-in (comment: the real driver is production-only) | `insertEntry`, `allEntries`, `reset` |
| `src/plugins/registry.js` | Loads every other `*.js` file in `src/plugins/` as a plugin by filename | `loadPlugins()` |
| `src/plugins/fx-normalize.js` | `beforePost` hook: forces `currency` to `USD` | default export |
| `src/plugins/audit-log.js` | `afterPost` hook: sets `audited: true` | default export |
| `scripts/migrate.js` | Lists `migrations/*.sql` and logs `applied <file>` per file | (script) |

## Data flow
```
HTTP POST /entries
  -> src/http/router.js            (parses JSON body)
  -> src/ledger/post.js: post()
       -> roundHalfEven(amount*100)          (src/ledger/rounding.js)
       -> plugin.hooks.beforePost, in registry order   (fx-normalize: currency -> USD)
       -> insertEntry(entry)                 (src/db.js, in-memory)
       -> plugin.hooks.afterPost, in registry order    (audit-log: audited = true)
  -> response: the entry as JSON
```
`src/ledger/reconcile.js` reads `allEntries()` and returns `{ count, balance }`; a non-zero
`balance` is drift. Nothing in this repo calls `reconcile()` — see `docs/open-questions.md`.

## Non-obvious mechanisms
- **Plugin discovery is by filename, not registration.** `src/plugins/registry.js` reads every
  `*.js` file in its own directory except itself and imports each as a plugin; there is no list
  to add a plugin to. A plugin default-exports `{ name, hooks: { beforePost?, afterPost? } }`
  (observed from `fx-normalize.js` and `audit-log.js`; not enforced by any check).
- **`roundHalfEven` is the only rounding function allowed in posting code** (`src/ledger/rounding.js`
  comment; also `docs/notes.md`) — a naive `Math.round` previously caused a drift incident.
- **`scripts/migrate.js` does not execute SQL.** It lists `migrations/*.sql` and logs
  `applied <file>` for each one; there is no database call in the script. Whether schema is
  actually applied elsewhere is `(unverified)` from this repo — see `docs/open-questions.md`.

## External dependencies
- No third-party packages (`package.json` declares none).
- Env vars actually read in `src/`: `PORT` (`src/app.js`). `LEDGER_DB_PATH` (set by `make dev`,
  documented in `docs/SETUP.md`) and `RECONCILE_CRON` (`.env.example`) are declared but not read
  by anything in this repo's `src/` — see `docs/open-questions.md`.
