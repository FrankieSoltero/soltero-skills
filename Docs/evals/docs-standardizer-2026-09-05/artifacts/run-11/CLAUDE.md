# acme-ledger

Double-entry ledger service for Acme's billing team.

## Quick Start

```bash
npm install
npm start
```

Server runs on port 3000.

## Commands

- `npm start` — Run the server
- `npm test` — Run tests
- `npm run lint` — Lint code
- `npm run migrate` — Run database migrations

## Layout

```
src/         — Application code (app.js is entry point)
src/ledger/  — Core ledger operations (posting, reconciliation, rounding)
src/plugins/ — HTTP server plugins (router, audit log, FX normalization)
src/http/    — HTTP routing
test/        — Unit tests
migrations/  — Database migrations
docs/        — Documentation and architecture decisions
```

## Environment

See `.env.example` for required environment variables.

## Testing

```bash
npm test
```

## Where to Look

- **Architecture**: `docs/adr/` for design decisions
- **Setup**: `docs/SETUP.md` for environment configuration
- **Core Logic**: `src/ledger/` for posting and reconciliation rules
