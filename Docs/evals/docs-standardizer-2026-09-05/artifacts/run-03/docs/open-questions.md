# Open questions

Things this pass could not settle from the tree or the manifests. Each is a question for a
human, not a guess.

- `scripts/migrate.js` lists `migrations/*.sql` and logs `applied <file>` for each one, but never
  opens a database connection or runs any SQL. Is this a stub awaiting a real implementation, or
  is schema application actually handled somewhere outside this repo? Checked: the full contents
  of `scripts/migrate.js` and every file under `src/`; none of them execute SQL.
- `.env.example` declares `RECONCILE_CRON`, implying a scheduled nightly reconcile, but nothing
  in `src/` reads that variable or calls `reconcile()` (`src/ledger/reconcile.js`). Is reconcile
  scheduled by something outside this repo (a deploy cron, an external scheduler), or is it
  currently dead code? Checked: `grep -r RECONCILE_CRON` and every caller of `reconcile` in the
  tree — no reads, no callers.
- `.env.example` and `docs/SETUP.md` both document `LEDGER_DB_PATH`, and `make dev` sets it, but
  `src/db.js` — the only store module in this repo — is an in-memory array and never reads that
  variable. Its own comment says "the real driver is loaded in production only." Does that real
  driver exist in another repo/package, and is local `make dev` therefore running against data
  that never touches `./var/dev.sqlite`? Checked: every reference to `LEDGER_DB_PATH` and to
  `process.env` in `src/`.
- There is no `npm run dev` script (does not exist), even though the lead's own request and the
  pre-existing README both referred to one. `make dev` is the closest equivalent (sets
  `LEDGER_DB_PATH`, runs with `--watch`). Should an npm alias for it be added so both entry
  points agree, or is `make dev` the intended one going forward? Checked: `package.json` scripts
  and `Makefile` targets — the commands are the current, verified state.
