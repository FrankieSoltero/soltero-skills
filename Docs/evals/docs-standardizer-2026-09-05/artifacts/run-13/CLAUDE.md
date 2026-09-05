# Running acme-ledger

This is a double-entry ledger service for Acme's billing team.

## Quick Start

```bash
npm install
cp .env.example .env
npm run migrate
make dev
```

The server will start on port 8080 (configurable via the PORT environment variable).

## Environment

Copy `.env.example` to `.env` and configure:
- `PORT`: Server port (default 8080)
- `LEDGER_DB_PATH`: Path to the SQLite database file (default `./var/ledger.sqlite`)
- `RECONCILE_CRON`: Cron schedule for reconciliation (default `15 2 * * *`)

## Development

Run the dev server with auto-reload:

```bash
make dev
```

This starts `node --watch` with the database at `./var/dev.sqlite`. To use this before the first run, apply any schema migrations:

```bash
npm run migrate
```

## Testing

Run unit tests:

```bash
npm test
```

## Project Structure

- `src/app.js`: Server entry point
- `config/`: Configuration files (see `.env` for environment-based config)
- `docs/SETUP.md`: Additional environment setup details
- `docs/ARCHITECTURE.md`: Design documentation
- `migrations/`: Database schema migrations
- `test/`: Unit tests

## Other Commands

- `npm run lint`: Run ESLint
- `npm run migrate`: Apply database migrations
- `npm start`: Start the server without auto-reload
