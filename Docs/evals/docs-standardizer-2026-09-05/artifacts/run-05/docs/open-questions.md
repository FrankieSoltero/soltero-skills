# Open questions

Things this pass could not settle from the tree or the manifests. Each is a question for a
human, not a guess.

- `LEDGER_DB_PATH` is declared in `.env.example` and set by `make dev`, but `src/db.js` is an
  in-memory stand-in that never reads it — is the real SQLite driver (per
  `docs/adr/0001-use-sqlite.md`) meant to exist and simply isn't written yet, or does something
  outside this repo supply it?
- `RECONCILE_CRON` is declared in `.env.example` but nothing under `src/` reads it and no
  scheduler/cron file exists in the repo — is reconcile run by an external scheduler, or is
  this env var stale?
- `scripts/migrate.js` lists `migrations/*.sql` filenames and logs `applied <file>` for each,
  but never opens a database connection or executes SQL — is this a stub awaiting the real
  driver, or is schema applied some other way before first start?
- `src/db.js`'s own comment says "the real driver is loaded in production only," but no second
  db module, driver-selection logic, or production config exists anywhere in this repo — where
  does production wiring actually live?
