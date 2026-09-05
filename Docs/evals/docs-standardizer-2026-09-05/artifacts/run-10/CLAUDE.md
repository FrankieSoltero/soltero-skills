# acme-ledger

Double-entry ledger service for Acme's billing team.

## Purpose

Track financial transactions with double-entry accounting principles. Provides HTTP API for posting
entries, querying balances, and retrieving transaction history. Used by Acme's billing team to
maintain accurate, auditable ledger records.

## Commands

- `make dev` — start the development server with file watching (port 8080)
- `npm test` — run the test suite
- `npm run lint` — check code style with ESLint
- `npm run migrate` — apply schema changes

## Layout

- `src/app.js` — HTTP server entry point
- `src/db.js` — SQLite database connection
- `src/ledger/` — ledger logic (posting, rounding, queries)
- `src/http/` — HTTP request handlers
- `src/plugins/` — extensible plugin system
- `test/` — test suite
- `migrations/` — schema migration scripts
- `docs/` — documentation

## Where to look

- Start with `src/app.js` to understand the request flow
- `docs/notes.md` documents the rounding system (critical for correctness)
- `src/ledger/rounding.js` is the only rounding function allowed in posting code
- `docs/SETUP.md` for environment setup and development workflow
- See `docs/architecture.md` for module map and data flow
- `docs/README.md` lists all documentation

## Conventions

**Declared:**
- Code style: ESLint (see `eslint.config.js`)
- Tests: Node test runner in `test/*.test.js`

**Observed:**
- Plugins discovered by filename in `src/plugins/`; no registration list
- All amounts stored as integer cents, never floats
- Config via environment variables only (no config files)

## Docs

- `docs/README.md` — index of all documentation
- `docs/SETUP.md` — environment and development setup
- `docs/architecture.md` — entry points, module map, data flow, mechanisms
- `docs/conventions.md` — declared and observed code patterns
- `docs/decisions.md` — architecture decisions
- `docs/mistakes-and-fixes.md` — lessons learned
- `docs/open-questions.md` — unresolved questions for humans
- `docs/notes.md` — rounding system (critical for correctness)
