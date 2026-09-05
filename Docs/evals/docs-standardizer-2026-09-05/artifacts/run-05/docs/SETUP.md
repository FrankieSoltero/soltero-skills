# Environment setup

Copy `.env.example` to `.env`. The server reads `PORT` (default 8080) and `LEDGER_DB_PATH`.

Run the dev loop with `make dev` (it points the DB at `./var/dev.sqlite` and uses
`node --watch`). Apply schema changes with `npm run migrate` before the first start.

Tests: `npm test`.
