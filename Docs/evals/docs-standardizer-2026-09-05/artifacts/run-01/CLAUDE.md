# acme-ledger

## Purpose
Double-entry ledger service for Acme's billing team — an HTTP server that posts ledger
entries and reconciles them nightly.

## Commands
- `npm start` — runs `node src/app.js`, the HTTP server (port from `PORT`, default 8080).
- `make dev` — dev loop: sets `LEDGER_DB_PATH=./var/dev.sqlite`, runs `node --watch src/app.js`.
- `npm test` (or `make test`) — runs `node --test test/*.test.js`.
- `npm run lint` — runs `eslint .`.
- `npm run migrate` (or `make migrate`) — runs `scripts/migrate.js`.

## Layout
- `src/app.js` — HTTP server entry point; loads plugins, wires the router.
- `src/http/router.js` — routes `POST /entries` to `src/ledger/post.js`.
- `src/ledger/` — `post.js` (post an entry), `rounding.js` (banker's rounding),
  `reconcile.js` (nightly balance check).
- `src/db.js` — in-memory store stand-in (see `docs/open-questions.md`).
- `src/plugins/` — hook plugins auto-discovered by filename at boot.
- `migrations/` — numbered SQL files applied in order by `scripts/migrate.js`.
- `test/` — `node --test` tests, one file per module.

## Where to look
- Add or change a plugin hook → `src/plugins/` (discovery mechanism in `docs/architecture.md`).
- Change rounding behavior → `src/ledger/rounding.js` only — the only rounding function
  allowed in posting code (see `docs/notes.md`).
- Add a migration → new numbered file in `migrations/`, then `npm run migrate`.
- Change the HTTP surface → `src/http/router.js`.

## Conventions
- `eqeqeq` and `no-var` enforced by `eslint.config.js`; CI runs `npm test` then `npm run lint`.
- Full list, with observed patterns labeled as such: `docs/conventions.md`.

## Docs
- Index: `docs/README.md`
- Lessons: `docs/mistakes-and-fixes.md` · Open questions: `docs/open-questions.md`
