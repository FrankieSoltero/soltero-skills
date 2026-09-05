# CLAUDE.md

Quick orientation for agents working in this repo. See `README.md` for the user-facing
quickstart (verified against `package.json` and `Makefile` on 2026-09-05).

## Commands
- Install: `npm install`
- Dev server: `make dev` (port 8080, in-memory store, restarts on file change)
- Run once: `npm start` (`node src/app.js`)
- Tests: `npm test` (`node --test test/*.test.js`)
- Migrate: `npm run migrate` (lists `migrations/*.sql`; see `docs/adr/0001-use-sqlite.md`)
- Lint: `npm run lint` (requires `eslint`, not installed in this checkout)

## Layout
- `src/app.js` — HTTP entry point; wires plugins into the router and listens on `PORT`
  (default 8080)
- `src/http/router.js` — routes; only `POST /entries` exists today
- `src/ledger/post.js`, `rounding.js`, `reconcile.js` — posting, rounding, nightly reconcile
- `src/plugins/*.js` — auto-discovered by filename at boot, no registration list
  (`src/plugins/registry.js`)
- `src/db.js` — in-memory stand-in; the real SQLite driver is production-only
- `migrations/`, `scripts/migrate.js` — numbered SQL migrations

## Conventions
- `roundHalfEven` in `src/ledger/rounding.js` is the ONLY rounding function allowed in
  posting code — a naive `Math.round` caused a prior drift incident (see `doc/notes.md`)
- Plugins default-export `{ name, hooks: { beforePost?, afterPost? } }`

## Where to look
- `docs/SETUP.md` — environment setup
- `docs/adr/0001-use-sqlite.md` — why SQLite, single-writer assumption
- `doc/notes.md` — rounding + plugin-discovery notes (a separate folder from `docs/`;
  left as-is, not merged, by this change)

## Docs debt (flagged, not addressed here)
Scope for this pass was "fix the README + add a quick CLAUDE.md," fast, no reorg, no
review-heavy essay. Not done, and needs a human decision before anyone works on it:
- No `Docs/` root, `architecture.md`, `conventions.md`, `decisions.md`,
  `mistakes-and-fixes.md`, or `open-questions.md`
- `doc/` and `docs/` are two separate folders, not consolidated
- No `AGENTS.md` mirror of this file
