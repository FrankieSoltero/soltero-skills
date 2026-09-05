# Mistakes and fixes

Running log of mistakes discovered in this repo (mine or inherited) and how they were
fixed, so the same one doesn't get re-made. Every entry below traces to a command run in
this session.

## 2026-09-05 — Documentation pass

### README described a server that doesn't exist
**Found:** `README.md` said the app starts via `npm run dev` on port 3000 from
`src/server.js`, with config under `config/default.json`, and testing via `npm run
test:unit`.
**Verified wrong:**
- `npm run dev` → `npm error Missing script: "dev"`
- `npm run test:unit` → `npm error Missing script: "test:unit"`
- `src/server.js` and `config/` do not exist (`find` over the repo tree)
- Actual entry point is `src/app.js`, default port is `8080` (`process.env.PORT ?? 8080`
  in `src/app.js`), config is env-var only, real commands are `make dev` and `npm test`.
**Fix:** Rewrote the "Getting started" and "Testing" sections of `README.md` to the
verified commands, and pointed it at `CLAUDE.md` and `docs/adr/` instead of a
non-existent `docs/ARCHITECTURE.md`.

### Duplicate `doc/` and `docs/` top-level folders
**Found:** `doc/notes.md` (singular) held load-bearing tribal knowledge — the
banker's-rounding rule and the plugin-discovery-by-filename behavior — separate from
`docs/` (plural), which held `SETUP.md` and `adr/`. Easy for an agent to read one and
miss the other.
**Fix:** `git mv doc/notes.md docs/notes.md`, removed the now-empty `doc/` directory.
Nothing else in the repo referenced the old `doc/` path (checked with `grep -rn`), so no
redirect was needed.

### Stale path in a source comment
**Found:** `src/ledger/rounding.js` pointed readers to `Docs/notes.md` — wrong case and
wrong pluralization even before the folder consolidation above (the real file was
`doc/notes.md`, not `Docs/notes.md`); it would not have resolved on a case-sensitive
filesystem or in a link.
**Fix:** Corrected to `docs/notes.md` (matching the consolidated location).

### Known gaps flagged, not fixed (out of scope for a documentation pass)
- `npm run lint` is wired into CI but `eslint` is not declared in `package.json`
  (no `dependencies`/`devDependencies`, no lockfile) — a clean install will fail to lint.
  Verified: `npm run lint` → `sh: eslint: command not found`.
- `src/ledger/reconcile.js` exports `reconcile()`, and `.env.example` defines
  `RECONCILE_CRON`, but nothing in the source tree calls `reconcile()` or reads that env
  var (checked with `grep -rn "reconcile\|RECONCILE_CRON"` across `*.js`/`*.md`/`*.yml`).
  The "nightly reconcile" described in `docs/adr/0001-use-sqlite.md` is not wired up.
- `src/db.js` is explicitly an in-memory stand-in ("the real driver is loaded in
  production only" per its own comment), but no such production driver exists anywhere
  in this repo. ADR 0001 documents a SQLite decision that isn't implemented yet.
- `scripts/migrate.js` only lists `migrations/*.sql` and logs `applied <file>` — it does
  not execute SQL. `npm run migrate` will not change any real database.

These are left as-is because fixing them requires product/engineering decisions (which
eslint version, how to schedule the cron, whether/when to build the real SQLite driver)
that a documentation pass shouldn't make unilaterally. They're recorded here and in
`CLAUDE.md` so the next agent doesn't assume they work.
