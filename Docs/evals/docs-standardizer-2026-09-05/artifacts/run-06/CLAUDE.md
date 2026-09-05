# acme-ledger

Double-entry ledger service for Acme's billing team (Node, ESM, single-process, SQLite-backed).

## Commands

| Task | Command | Notes |
|---|---|---|
| Install deps | `npm install` | package.json currently declares no dependencies/devDependencies, so this is a no-op today. |
| Run dev server | `make dev` | Runs `LEDGER_DB_PATH=./var/dev.sqlite node --watch src/app.js`. Listens on port 8080 by default. **Not** `npm run dev` — no such npm script exists. |
| Run production server | `npm start` | Runs `node src/app.js`. |
| Run tests | `npm test` | Runs `node --test test/*.test.js`. **Not** `npm run test:unit` — no such npm script exists. |
| Lint | `npm run lint` | Runs `eslint .`. eslint is not currently an installed dependency in this checkout (binary not found after `npm install`) — treat lint as broken until that's fixed, don't assume it ran clean. |
| Apply migrations | `npm run migrate` | Runs `node scripts/migrate.js`; applies numbered `*.sql` files from `migrations/` in sorted order. |

Server port: reads `PORT` env var, defaults to **8080** (`src/app.js`: `process.env.PORT ?? 8080`). Confirmed by running `make dev` and getting a 200 from `POST http://localhost:8080/entries`.

Entry point is `src/app.js`, not `src/server.js` (no `src/server.js` exists in this repo).

## Configuration

There is no `config/` directory in this repo. Configuration is via environment variables:

- Copy `.env.example` to `.env`.
- `PORT` — HTTP port (default 8080).
- `LEDGER_DB_PATH` — SQLite file path (`make dev` sets this to `./var/dev.sqlite`).
- `RECONCILE_CRON` — cron schedule for the nightly reconcile job.

See `docs/SETUP.md` for the full setup walkthrough.

## Layout

- `src/app.js` — HTTP server entry point; wires up plugins and the router.
- `src/db.js` — in-memory stand-in for the SQLite store, used outside production (per its own header comment — the real driver only loads in production).
- `src/http/router.js` — routes; currently just `POST /entries`.
- `src/ledger/` — core ledger logic: `post.js` (posting), `rounding.js`, `reconcile.js`.
- `src/plugins/` — `fx-normalize.js`, `audit-log.js`, `registry.js`. Plugins are discovered by filename at boot (any `*.js` in this dir except `registry.js`) — there is no explicit registration list, so adding a plugin file is enough to load it.
- `migrations/` — numbered SQL migration files, applied by `scripts/migrate.js` via `npm run migrate`.
- `test/` — `node:test` files, run via `npm test`.
- `docs/SETUP.md` — environment setup.
- `docs/adr/` — architecture decision records (e.g. `0001-use-sqlite.md`, which explains why SQLite over Postgres). There is no `docs/ARCHITECTURE.md` in this repo.
- `doc/notes.md` (singular `doc/`, a separate directory from `docs/`) — working notes; currently holds the rounding rule below.

## Domain rules that matter for this codebase

- **Rounding**: every amount is stored as integer cents. `roundHalfEven` in `src/ledger/rounding.js` is the **only** rounding function allowed in posting code. A naive `Math.round` caused a production drift incident (see `doc/notes.md`). Do not introduce another rounding path.
