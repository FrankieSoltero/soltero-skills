# Environment setup

`.env.example` documents the two env vars the service is meant to understand: `PORT` and
`LEDGER_DB_PATH`. **Copying it to `.env` has no effect** — verified by starting the server
with only a `.env` file present and confirming the port and DB path in it were ignored. There
is no `dotenv` dependency and no `--env-file` flag anywhere in the scripts. To actually set an
env var, export it in your shell or prefix the command:

```
PORT=9090 npm start
```

Also note: `LEDGER_DB_PATH` isn't read by any source file today — `src/db.js` is an in-memory
stub, not a real SQLite driver (see `docs/ARCHITECTURE.md`). Setting it changes nothing yet.

Run the dev loop with `make dev` (sets `LEDGER_DB_PATH=./var/dev.sqlite` inline and runs with
`node --watch`; per the note above, that env var is currently inert, but `make dev` is still
the right entry point for watch-mode).

`npm run migrate` does not apply schema changes yet — `scripts/migrate.js` only lists the
`migrations/*.sql` filenames it would apply, it doesn't execute them. Safe to run, but don't
expect a database to exist afterward.

Tests: `npm test` (2 tests, both pass as of this writing). `npm run lint` fails in a fresh
checkout — `eslint` isn't a declared dependency — see `AGENTS.md` Gotchas.
