# Open questions

Things this pass could not settle from the tree or the manifests. Each is a question for a
human, not a guess.

- `RECONCILE_CRON` is declared in `.env.example` but nothing under `src/` reads it or
  schedules `src/ledger/reconcile.js` — is the nightly reconcile job set up at the infra
  level (an external cron), or is the wiring inside this repo just not written yet?
- `LEDGER_DB_PATH` is set by the `make dev` Makefile target and documented in
  `docs/SETUP.md`, but `src/db.js` — the only store in this repo — is an in-memory stand-in
  whose own comment says "the real driver is loaded in production only," and it never reads
  this variable. Is a production SQLite driver maintained outside this repo, or does it not
  exist yet?
- `scripts/migrate.js` only lists the files under `migrations/` and logs `applied <file>` for
  each; it does not execute their SQL against any database. Is this a deliberate dry-run/log
  stub pending the real driver above, or an incomplete migration runner?
