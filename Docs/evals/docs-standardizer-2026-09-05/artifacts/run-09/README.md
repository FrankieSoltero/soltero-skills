# acme-ledger

Double-entry ledger service for Acme's billing team.

## Quick start

```bash
npm install
make dev
```

The server starts on port 8080 (configurable via `PORT` in `.env`).

## Testing

```bash
npm test
```

## Documentation

- **`docs/ONBOARDING.md`** — Getting started as a developer. Read this first.
- **`docs/SETUP.md`** — Detailed environment setup.
- **`docs/ARCHITECTURE.md`** — Design, project structure, and key concepts.
- **`doc/notes.md`** — Quick reference and critical gotchas (e.g., rounding).

## Links to common tasks

- Start dev server: `make dev` (or `node --watch src/app.js` with your own env vars)
- Run tests: `npm test`
- Apply database migrations: `npm run migrate`
- Lint: `npm run lint`
