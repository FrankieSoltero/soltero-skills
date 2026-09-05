# acme-ledger

Double-entry ledger service for Acme's billing team.

## Purpose

Handles posting financial transactions with proper rounding and audit trails. Single writer, nightly reconcile, SQLite backend. Agents and humans start here for context on posting logic, the plugin system, and onboarding steps.

## Commands

- `make dev` — start the dev server with auto-reload on port 8080
- `npm start` — start the server on port 8080 (set PORT env var to override)
- `npm test` — run tests
- `npm run lint` — run ESLint
- `npm run migrate` — apply pending schema migrations

## Layout

- `src/app.js` — server entry point; loads plugins and sets up HTTP router
- `src/http/router.js` — HTTP request handler; routes POST /entries to the ledger
- `src/ledger/post.js` — core posting logic; applies plugins and stores entries
- `src/ledger/rounding.js` — banker's rounding (ONLY rounding allowed in posting code)
- `src/plugins/registry.js` — plugin discovery; loads all .js files except registry.js
- `src/db.js` — database interface
- `migrations/` — numbered SQL schema migrations
- `test/` — test files; run with `npm test`

## Where to look

- **Getting started?** Start with `docs/SETUP.md`, then `npm start` or `make dev`.
- **Understanding the posting flow?** Read `src/ledger/post.js`, the plugin hooks in `src/plugins/*.js`, and the ADR at `docs/adr/0001-use-sqlite.md`.
- **Rounding or precision issues?** See `src/ledger/rounding.js` (the only allowed rounding function) and the Feb-drift incident note in `docs/notes.md`.
- **Adding a plugin?** Create a .js file in `src/plugins/` that exports `{ name, hooks: { beforePost?, afterPost? } }`.
- **Database schema?** See `migrations/` and `docs/adr/0001-use-sqlite.md`.

## Conventions

See `docs/conventions.md` for declared and observed patterns.

## Docs

Full documentation lives under [`docs/`](docs/README.md):
- [`docs/README.md`](docs/README.md) — index of all docs and how to find them
- [`docs/SETUP.md`](docs/SETUP.md) — environment setup and dev workflow
- [`docs/architecture.md`](docs/architecture.md) — module map, entry points, data flow, non-obvious mechanisms
- [`docs/conventions.md`](docs/conventions.md) — declared lint/format rules and observed code patterns
- [`docs/decisions.md`](docs/decisions.md) — index of architectural decisions (ADRs)
- [`docs/mistakes-and-fixes.md`](docs/mistakes-and-fixes.md) — lesson log from debugging
- [`docs/open-questions.md`](docs/open-questions.md) — unresolved questions about the codebase
- [`docs/adr/`](docs/adr/) — decision records (historical, exempt from claim checks)
