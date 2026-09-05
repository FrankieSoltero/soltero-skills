# Environment Setup

## Prerequisites

- Node.js 18+ (ES modules support required)
- npm 9+
- SQLite3 (for production deployments; tests use in-memory)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs no external HTTP framework—the server uses Node's built-in `http` module.

### 2. Set Up Environment

Copy the example configuration:

```bash
cp .env.example .env
```

The `.env` file is gitignored. Environment variables:

- `PORT` (default 8080) – Server listen port
- `LEDGER_DB_PATH` (default `:memory:`) – SQLite database file path
  - `:memory:` – In-memory database (tests only, data lost on restart)
  - `./path/to/ledger.sqlite` – File-based database (persistent)

### 3. Apply Database Migrations

Before running the server for the first time, apply migrations:

```bash
npm run migrate
```

This reads migrations from `migrations/` and applies any pending ones to your SQLite database. Subsequent runs will only apply new migrations.

If you encounter "file not found", create the directory:

```bash
mkdir -p var
npm run migrate  # Creates ./var/dev.sqlite if needed
```

### 4. Verify Installation

Run tests to verify everything works:

```bash
npm test
```

Expected output: All tests pass, no errors.

## Development Workflow

### Starting the Dev Server

```bash
make dev
```

This:
- Sets `LEDGER_DB_PATH=./var/dev.sqlite` (persists state across restarts)
- Runs `node --watch src/app.js` (auto-restarts on file changes)
- Listens on port 8080

To use a different port:

```bash
PORT=3000 make dev
```

### Testing an Endpoint

In another terminal:

```bash
curl -X POST http://localhost:8080/entries \
  -H 'Content-Type: application/json' \
  -d '{"side":"debit","amount":123.45,"currency":"USD"}'
```

Expected response:

```json
{
  "side": "debit",
  "amount": 123.45,
  "cents": 12345,
  "currency": "USD",
  "audited": true
}
```

(The `audited` field comes from the audit-log plugin.)

### Running Tests

```bash
npm test               # All tests
npm test -- test/post.test.js   # One file (Node 20+)
```

Tests use an in-memory database, so they run fast and don't conflict with dev data.

### Linting

```bash
npm run lint
```

Checks code style with ESLint. Fix automatically:

```bash
npx eslint --fix .
```

## Database

### Local Development

- **Database file:** `./var/dev.sqlite`
- **Inspect contents:** `sqlite3 ./var/dev.sqlite`
- **View schema:** `sqlite3 ./var/dev.sqlite ".schema"`
- **Export data:** `sqlite3 ./var/dev.sqlite ".mode json" "SELECT * FROM entries;" > entries.json`

### Reset Development Database

```bash
rm ./var/dev.sqlite
npm run migrate
```

## Production Deployment

### Environment Variables

Set these in your deployment environment:

```bash
export PORT=8080
export LEDGER_DB_PATH=/data/ledger.sqlite
```

### Start the Server

```bash
npm run start
```

### Before First Deploy

1. Verify all tests pass: `npm test`
2. Run migrations: `npm run migrate`
3. Test the server: `PORT=8080 npm run start`

## Troubleshooting

### "ENOENT: no such file or directory" when starting dev server

The database directory doesn't exist. Create it:

```bash
mkdir -p var
npm run migrate
make dev
```

### "entries table not found" in tests

Migrations didn't run. Run:

```bash
npm run migrate
npm test
```

### Server won't start on the port

Check if the port is already in use:

```bash
lsof -i :8080
```

Use a different port:

```bash
PORT=3001 make dev
```

### "Cannot find module" errors

Ensure dependencies are installed:

```bash
rm -rf node_modules package-lock.json
npm install
npm run migrate
npm test
```

### Database locked error

SQLite is single-writer. If you have multiple dev instances running:

```bash
pkill -f "node.*app.js"
make dev
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | HTTP server listen port |
| `LEDGER_DB_PATH` | `:memory:` | SQLite database path (`:memory:` for in-memory) |
| `NODE_ENV` | (unset) | Set to `production` for production builds |

## Next Steps

- Read `CLAUDE.md` for project overview and critical knowledge.
- Read `docs/ARCHITECTURE.md` for technical design details.
- Read `CONTRIBUTING.md` for workflow and development guidelines.
- Explore `src/` to understand the codebase.

---

Generated: 2026-09-05
