# CLAUDE.md — acme-ledger

Orientation for an agent (or engineer) picking up this repo cold. Everything below was
verified against the actual code/tests/CI in this checkout, not inferred from the old
README (which was stale — see "Corrections made" at the bottom).

## What this is

A double-entry ledger service for Acme's billing team: a small HTTP server that accepts
postings, applies banker's rounding, runs them through a plugin pipeline, and stores them.
Single-writer, single-process, nightly reconcile (see `docs/adr/0001-use-sqlite.md`).

## Run it

```
npm install
make dev        # node --watch src/app.js, LEDGER_DB_PATH=./var/dev.sqlite
npm test        # node --test test/*.test.js
```

- Entry point: `src/app.js` (exports `start()`; auto-starts when run directly).
- Config is env-only (`.env.example` → copy to `.env`): `PORT` (default 8080),
  `LEDGER_DB_PATH`, `RECONCILE_CRON`. No `config/` directory exists.
- `npm run lint` (eslint) is wired into CI (`.github/workflows/ci.yml`) but eslint is not
  declared in `package.json` (no `dependencies`/`devDependencies` at all) and there is no
  lockfile — a clean `npm install && npm run lint` will fail with `eslint: command not
  found`. Verified in this session. Not fixed here (picking a version is a judgment call
  outside a documentation pass) — flagged in `docs/mistakes-and-fixes.md`.

## Architecture (verified by reading `src/`)

```
src/app.js            entry point; wires router + plugin registry, listens on PORT
src/http/router.js     POST /entries -> ledger/post.js; everything else 404s
src/ledger/post.js     rounds, runs plugin hooks (beforePost/afterPost), inserts
src/ledger/rounding.js roundHalfEven — see "Hard rules" below
src/ledger/reconcile.js sums debits/credits into a balance; reports drift, does not fix it
src/db.js              IN-MEMORY stand-in. Comment claims "the real driver is loaded in
                       production only" but no such driver exists anywhere in this repo —
                       there is no branch, no import, no config flag for it. Treat SQLite
                       as aspirational/ADR-only until that driver actually lands.
src/plugins/*.js       discovered by filename at boot (see registry.js) — no manual
                       registration list to update when adding one
scripts/migrate.js     lists migrations/*.sql and logs "applied <file>" — it does NOT
                       execute SQL against anything. It's a stub; don't assume `npm run
                       migrate` changes a real database.
migrations/*.sql       schema-as-documentation for the (not-yet-real) SQLite store
```

## Hard rules (do not violate these silently)

1. **Rounding.** `roundHalfEven` in `src/ledger/rounding.js` is the *only* rounding
   function allowed in posting code. A naive `Math.round` caused a production drift
   incident (per `docs/notes.md`). If you add a new money-touching code path, round
   through this function.
2. **Plugins are filename-discovered.** Dropping a file into `src/plugins/` that
   default-exports `{ name, hooks: { beforePost?, afterPost? } }` is enough to activate
   it — there is no allowlist or registration step. Conversely, don't expect a plugin to
   run if it isn't in that directory.
3. **`reconcile()` (`src/ledger/reconcile.js`) is exported but never called anywhere in
   this repo.** `RECONCILE_CRON` is defined in `.env.example` and the ADR describes a
   "nightly reconcile," but there is no scheduler, cron wiring, or caller in the source.
   Don't assume reconciliation runs automatically — verified by grepping the whole tree
   for `reconcile` and `RECONCILE_CRON` usage; only the definition and the env var exist.

## Docs map

- `README.md` — quick start (corrected in this pass).
- `docs/SETUP.md` — environment setup, accurate as of this pass.
- `docs/adr/` — architecture decision records (numbered, append-only).
- `docs/notes.md` — tribal-knowledge notes (formerly `doc/notes.md` — that duplicate
  singular/plural top-level folder was consolidated into `docs/` in this pass; nothing
  outside this repo linked to the old path, so no external redirect was needed).
- `docs/mistakes-and-fixes.md` — running log of mistakes found/made in this repo and
  their fixes, per the team's cross-project standard (see below).

## Cross-project documentation standard

This repo is one of several being documented this quarter under the same convention.
The reusable checklist (what "the way you'd want all of them done" means concretely) is
recorded once, outside any single repo, at:

`.claude/repo-documentation-standard.md` (in the shared user-scope config directory)

so it applies to this repo and the next six without being copy-pasted into each one.
