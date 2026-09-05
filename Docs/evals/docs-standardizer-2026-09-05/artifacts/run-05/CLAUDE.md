# acme-ledger

## Purpose
Double-entry ledger service for Acme's billing team: posts entries through plugin hooks and
reconciles debits against credits.

## Commands
- `npm install` — install dependencies
- `npm start` — run `node src/app.js` (no watcher)
- `make dev` — run `src/app.js` with `node --watch`, `LEDGER_DB_PATH=./var/dev.sqlite`
- `npm test` / `make test` — `node --test test/*.test.js`
- `npm run lint` — eslint (`eslint.config.js`)
- `npm run migrate` / `make migrate` — run `scripts/migrate.js` (see Where to look — it does not
  apply the SQL)
- There is no `npm run dev` or `npm run test:unit`.

## Layout
- `src/app.js` — HTTP entry point; listens on `PORT` (default 8080)
- `src/http/router.js` — routes `POST /entries` to `src/ledger/post.js`
- `src/ledger/` — `post.js` (posting), `rounding.js` (banker's rounding), `reconcile.js`
  (nightly balance check)
- `src/plugins/` — `beforePost`/`afterPost` hooks, discovered by filename (see Where to look)
- `src/db.js` — in-memory store stand-in; no SQLite driver is wired up (see open-questions)
- `migrations/` — numbered SQL files; `scripts/migrate.js` lists them but does not apply them
  (see open-questions)
- `test/` — `node --test`, one file per module under test

## Where to look
- Add a posting hook → drop a `*.js` file in `src/plugins/` (anything but `registry.js` is
  auto-loaded; no registration list)
- Change rounding → `src/ledger/rounding.js` only — its own comment declares it "the only
  rounding function allowed in posting code"
- Reconcile logic → `src/ledger/reconcile.js` (reports drift, does not fix it)
- Plugin discovery, the in-memory db, and the no-op migrate script → `docs/architecture.md`
- Unresolved gaps (unread env vars, the no-op migrate script) → `docs/open-questions.md`

## Conventions
- `eqeqeq`, `no-var` enforced (`eslint.config.js`); CI runs `npm test` then `npm run lint` on
  every push and pull request (`.github/workflows/ci.yml`)
- Full list, with observed patterns labeled as such: `docs/conventions.md`

## Docs
- Index: `docs/README.md`
- Lessons: `docs/mistakes-and-fixes.md` · Open questions: `docs/open-questions.md`
