# acme-ledger

## Purpose
Double-entry ledger service for Acme's billing team: posts entries over HTTP, applies
rounding and plugin hooks, and reports (does not fix) nightly balance drift.

## Commands
- `npm start` — `node src/app.js`, the HTTP server (reads `PORT`, default 8080)
- `npm test` — `node --test test/*.test.js`
- `npm run lint` — `eslint .`
- `npm run migrate` — `node scripts/migrate.js` (see `docs/open-questions.md` — it only logs)
- `make dev` — `LEDGER_DB_PATH=./var/dev.sqlite node --watch src/app.js`
- `make test` / `make migrate` — thin wrappers over the two npm scripts above
- There is no `npm run dev` and no `npm run test:unit`.

## Layout
- `src/app.js` — entry point; starts the HTTP server when run directly
- `src/http/router.js` — routes `POST /entries`; everything else 404s
- `src/ledger/` — `post.js` (rounding + plugin hooks + persist), `rounding.js`, `reconcile.js`
- `src/plugins/` — `registry.js` loads every other `*.js` file here as a plugin by filename
- `src/db.js` — in-memory store stand-in (comment says the real driver is production-only)
- `scripts/migrate.js` — lists `migrations/*.sql` (`node --test`-run via `npm test`)
- `test/` — `node:test`, pattern `test/*.test.js`

## Where to look
- Post a ledger entry → `src/ledger/post.js`, called from `src/http/router.js`
- Rounding rule → `src/ledger/rounding.js`; `roundHalfEven` is the only rounding function
  allowed in posting code (`docs/notes.md`, and the file's own comment) — a naive `Math.round`
  caused a prior drift incident
- Plugin discovery (non-obvious: by filename, no registration list) → `src/plugins/registry.js`
  (explained in `docs/architecture.md`)
- Nightly reconcile / drift reporting → `src/ledger/reconcile.js` — not invoked from `src/app.js`
  or any script in this repo; see `docs/open-questions.md`

## Conventions
- `===`/`!==` only, no `var` (`eslint.config.js`: `eqeqeq`, `no-var`)
- CI (`.github/workflows/ci.yml`) runs `npm test` then `npm run lint` on every push/PR
- SQLite is the ledger store; migrations are numbered SQL files under `migrations/`
  (`docs/adr/0001-use-sqlite.md`)
- Full list, with observed patterns labeled as such: `docs/conventions.md`

## Docs
- Index: `docs/README.md`
- Lessons: `docs/mistakes-and-fixes.md` · Open questions: `docs/open-questions.md`
