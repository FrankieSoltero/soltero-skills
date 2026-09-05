# acme-ledger

Double-entry ledger service for Acme's billing team.

## Purpose

A billing ledger service for Acme. Stores journal entries in SQLite with schema versioning. Startup initializes plugins dynamically, each responsible for one bill type or reporting format.

## Commands

- **Dev loop**: `make dev` (sets `LEDGER_DB_PATH=./var/dev.sqlite`, file-watch reload via `node --watch`)
- **Tests**: `npm test` (runs test suite with `node --test`)
- **Linting**: `npm run lint` (eslint, output to stdout)
- **Schema migrations**: `npm run migrate` (applies SQL migrations under `migrations/` using `scripts/migrate.js`)

## Layout

- `src/app.js` — entry point; loads plugins, creates HTTP server
- `src/db.js` — database layer (production: uses SQLite; test: in-memory)
- `src/http/` — request handlers and routing
- `src/ledger/` — double-entry logic and posting rules
- `src/plugins/` — billing plugins; auto-discovered by filename at boot
- `migrations/` — numbered SQL schema files applied by `npm run migrate`
- `scripts/migrate.js` — migration runner
- `test/` — test suite files
- `Docs/` — documentation root

## Where to look

- **How to run**: `Docs/SETUP.md` (environment vars, initial setup)
- **Design decisions**: `Docs/decisions.md` (index of ADRs; current: SQLite choice in 0001)
- **Design patterns**: `Docs/notes.md` (rounding rules, plugin mechanism)
- **Architecture**: `Docs/architecture.md` (entry points, data flow)
- **Conventions**: `Docs/conventions.md` (lint rules, observed patterns)

## Conventions

Enforced: ESLint (config: `eslint.config.js`).

Observed: rounding must use `roundHalfEven()` from `src/ledger/rounding.js` (safety rule: naive `Math.round` caused Feb drift incident).

## Docs

Full documentation lives in `Docs/`. See `Docs/README.md` for an index.
