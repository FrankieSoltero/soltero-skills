# Architecture

## Entry points
- `src/app.js` — HTTP server; started by `npm start` or `make dev`. Reads `PORT` (default
  8080), loads plugins via `src/plugins/registry.js`, and serves `src/http/router.js`.
- `scripts/migrate.js` — migration runner; started by `npm run migrate` or `make migrate`.

## Module map
| Path | Responsibility | Key exports |
|---|---|---|
| `src/app.js` | starts the HTTP server, wires plugins and router | `start` |
| `src/http/router.js` | routes `POST /entries` to `post()` | `router` |
| `src/ledger/post.js` | posts an entry: rounds, runs plugin hooks, inserts | `post` |
| `src/ledger/rounding.js` | banker's rounding — the only rounding allowed in posting | `roundHalfEven` |
| `src/ledger/reconcile.js` | sums debits/credits; reports drift, does not fix it | `reconcile` |
| `src/db.js` | in-memory store stand-in | `insertEntry`, `allEntries`, `reset` |
| `src/plugins/registry.js` | discovers plugins by filename at boot | `loadPlugins` |
| `src/plugins/fx-normalize.js` | plugin: normalizes non-USD entries to USD before posting | default export |
| `src/plugins/audit-log.js` | plugin: marks entries audited after posting | default export |
| `scripts/migrate.js` | lists `migrations/*.sql` in filename order (see `docs/open-questions.md`) | (script) |

## Data flow
`POST /entries` → `src/http/router.js` parses the JSON body → `src/ledger/post.js` rounds the
amount with `roundHalfEven` → runs each plugin's `beforePost` hook in order → `insertEntry`
(`src/db.js`) → runs each plugin's `afterPost` hook in order → the entry is returned as the
JSON response.

## Non-obvious mechanisms
- **Plugin discovery by filename.** Every `*.js` file in `src/plugins/` except `registry.js`
  is loaded as a plugin at boot; there is no registration list (`src/plugins/registry.js`,
  `docs/notes.md`).
- **Rounding is centralized on purpose.** `roundHalfEven` in `src/ledger/rounding.js` is the
  only rounding function allowed in posting code — a naive `Math.round` caused a prior
  production drift incident (`docs/notes.md`).
- **`src/db.js` is a stand-in.** Its own comment says the real driver is loaded in production
  only, but no such driver is present in this repo (`docs/open-questions.md`).

## External dependencies
- `PORT` (env, default 8080) — read in `src/app.js`.
- `LEDGER_DB_PATH` (env) — set by the `make dev` target; not read anywhere under `src/`
  (`docs/open-questions.md`).
- `RECONCILE_CRON` (env, in `.env.example`) — not read anywhere under `src/`
  (`docs/open-questions.md`).
- SQLite — the ledger store per `docs/adr/0001-use-sqlite.md`; no SQLite driver code exists
  under `src/` in this repo (`docs/open-questions.md`).
