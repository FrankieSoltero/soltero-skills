# Architecture

## Entry points
- HTTP: `src/app.js` creates a `node:http` server on `PORT` (default 8080) and hands it
  `router(plugins)` from `src/http/router.js`. Started by `npm start`, or `make dev` for the
  watch/dev-DB variant.
- Migrations: `scripts/migrate.js`, run via `npm run migrate` / `make migrate`.

## Module map
| Path | Responsibility | Key exports |
|---|---|---|
| `src/app.js` | HTTP server bootstrap | `start` |
| `src/http/router.js` | Routes `POST /entries` | `router` |
| `src/ledger/post.js` | Posts an entry through plugin hooks | `post` |
| `src/ledger/rounding.js` | Banker's rounding to integer cents | `roundHalfEven` |
| `src/ledger/reconcile.js` | Sums debits/credits, reports drift | `reconcile` |
| `src/db.js` | In-memory entry store (stand-in) | `insertEntry`, `allEntries`, `reset` |
| `src/plugins/registry.js` | Loads every plugin file by filename | `loadPlugins` |
| `src/plugins/audit-log.js` | Tags posted entries as audited | default export |
| `src/plugins/fx-normalize.js` | Normalizes currency to USD before posting | default export |
| `scripts/migrate.js` | Lists migration filenames (see Non-obvious mechanisms) | — |

## Data flow
```
POST /entries → src/http/router.js → src/ledger/post.js
  → roundHalfEven(amount * 100)         (src/ledger/rounding.js)
  → each plugin's beforePost hook, in filename order
  → insertEntry                          (src/db.js, in-memory)
  → each plugin's afterPost hook, in filename order
  → JSON response
```
Nightly reconcile: `reconcile()` sums debits minus credits across `allEntries()` and returns the
balance; a non-zero balance is reported, not fixed. No scheduler or cron file exists in this
repo — see `docs/open-questions.md` for what triggers it.

## Non-obvious mechanisms
- **Plugin discovery is by filename, not registration.** `src/plugins/registry.js` reads its
  own directory and `import()`s every `*.js` file except `registry.js`; each must
  default-export `{ name, hooks: { beforePost?, afterPost? } }`. Adding a plugin means adding a
  file — there is no list to edit.
- **Rounding has exactly one allowed implementation.** `src/ledger/rounding.js:1` states "The
  only rounding function allowed in posting code" — round-half-to-even; `docs/notes.md` records
  that a prior `Math.round` caused a production drift incident.
- **`src/db.js` is an in-memory stand-in.** Its own comment says "the real driver is loaded in
  production only," but no second db module or driver-selection code exists anywhere in this
  repo — see `docs/open-questions.md`.
- **`scripts/migrate.js` does not apply migrations.** It lists `migrations/*.sql` filenames and
  logs `applied <file>` for each; it never opens a connection or runs SQL — see
  `docs/open-questions.md`.

## External dependencies
- `PORT` — read by `src/app.js` (default 8080).
- `LEDGER_DB_PATH` — declared in `.env.example`, set by `make dev` — not read by any source
  file in this repo (`src/db.js` is in-memory). See `docs/open-questions.md`.
- `RECONCILE_CRON` — declared in `.env.example`; no scheduler in this repo reads it. See
  `docs/open-questions.md`.
- No external services are wired up. SQLite is the intended store per
  `docs/decisions.md` / `docs/adr/0001-use-sqlite.md`, but no driver is present in code.
