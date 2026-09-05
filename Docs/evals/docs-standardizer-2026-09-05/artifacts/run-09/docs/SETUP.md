# Environment setup

## Prerequisites

- Node.js 18+ (`node --version`)
- npm (included with Node)
- A text editor
- Terminal access

## Step-by-step

### 1. Install dependencies
```bash
npm install
```

### 2. Create environment file
Copy `.env.example` to `.env` in the repo root:
```bash
cp .env.example .env
```

This creates your local environment variables:
- **`PORT`** (default 8080) — HTTP server port
- **`LEDGER_DB_PATH`** (default `./var/dev.sqlite`) — SQLite database file
- **`RECONCILE_CRON`** (default `15 2 * * *`) — Reconcile schedule (cron format; 2:15 AM daily)

Leave defaults as-is for development. Secrets (API keys, DB passwords) never go in source; use `.env` and `.gitignore` protects it.

### 3. Ensure `./var/` directory exists
The dev server writes SQLite to `./var/dev.sqlite`. The directory must exist:
```bash
mkdir -p ./var
```

### 4. Apply database migrations
Migrations set up the schema. Run **before starting the server for the first time:**
```bash
npm run migrate
```

This runs all numbered `.sql` files in `migrations/` and initializes the `entries` table. Safe to re-run; skips already-applied migrations.

### 5. Start the dev server
```bash
make dev
```

You should see:
```
Server listening on port 8080
```

The `node --watch` flag auto-restarts on file changes. Stop with Ctrl+C.

### 6. Verify setup
In another terminal:
```bash
npm test
```

All tests pass? ✓ Setup is done.

## Environment variables reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 8080 | HTTP server port |
| `LEDGER_DB_PATH` | `./var/ledger.sqlite` | SQLite database file path |
| `RECONCILE_CRON` | `15 2 * * *` | Reconcile schedule (cron format) |

## Common commands

| Command | Behavior |
|---------|----------|
| `make dev` | Start server with `node --watch` (auto-restarts on changes) |
| `npm test` | Run unit tests |
| `npm run migrate` | Apply pending migrations |
| `npm run lint` | Run ESLint |
| `node src/app.js` | Start server once (no watch) |

## Troubleshooting

### `ENOENT: no such file or directory, open './var/dev.sqlite'`
Ensure `./var/` directory exists:
```bash
mkdir -p ./var
```

### `Error: UNIQUE constraint failed`
The dev database already has records. Clear it:
```bash
rm ./var/dev.sqlite
npm run migrate
npm test
```

### Tests fail randomly
Ensure migrations run before tests. The test suite uses the in-memory DB from `src/db.js`, not the file DB, so it should not be affected by existing data. If issues persist, check Node version (`node --version` — need 18+).

### Port 8080 already in use
Change `PORT` in `.env`:
```
PORT=3001
```

## Next steps

- Read `docs/ONBOARDING.md` for a step-by-step walkthrough.
- Read `docs/ARCHITECTURE.md` for design and project structure.
- Explore `src/app.js` to trace the entry point.
- Check `doc/notes.md` for critical gotchas (especially rounding).
