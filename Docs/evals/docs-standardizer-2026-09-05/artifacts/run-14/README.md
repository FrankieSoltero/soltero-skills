# acme-ledger

Double-entry ledger service for Acme's billing team. Handles financial entry posting with precision guarantees around currency conversion and rounding.

**Tech Stack:** Node.js (ES modules), SQLite, vanilla HTTP server (no frameworks).

## Quick Start

```bash
npm install
npm run migrate
make dev
```

The server starts on port 8080 and listens for `POST /entries`.

For detailed setup instructions, see [`docs/SETUP.md`](docs/SETUP.md).

## Testing

```bash
npm test
```

## Documentation

- **New to this project?** Start with [`CLAUDE.md`](CLAUDE.md) (10-minute overview).
- **Want to understand the design?** Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- **How do I contribute?** See [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **Looking for something specific?** Check [`docs/INDEX.md`](docs/INDEX.md) for navigation.

## Key Concepts

- **Precision:** All amounts are integers (cents), never floats. Uses `roundHalfEven()` for rounding—this is non-negotiable.
- **Plugins:** Business logic is extensible via a before/after hook pipeline. Auto-discovered by filename.
- **Immutable Log:** Entries are never updated, only inserted. Corrections are new entries.
- **Single Writer:** One process, SQLite as the store. Multi-writer scenarios require Postgres (see ADR 0001).

## Critical Knowledge

**The Feb Drift Incident:** In February 2025, naive `Math.round()` caused reconciliation failures. All posting code must use `roundHalfEven()` from `src/ledger/rounding.js`. See [`CLAUDE.md`](CLAUDE.md) for details.

## Project Structure

```
src/               # Application code
├── app.js         # Server startup
├── db.js          # Data store
├── http/          # HTTP routing
├── ledger/        # Posting logic, rounding, reconciliation
└── plugins/       # Extensible plugins (auto-discovered)

test/              # Tests
docs/              # Documentation
├── ARCHITECTURE.md    # Technical design
├── SETUP.md           # Environment setup
├── INDEX.md           # Documentation navigation
└── adr/               # Architecture Decision Records

migrations/        # Database schema (SQL files)
scripts/           # Utility scripts
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `make dev` | Start dev server (auto-restarts on changes) |
| `npm test` | Run all tests |
| `npm run lint` | Check code style |
| `npm run migrate` | Apply database migrations |
| `npm run start` | Start production server |

## Next Steps

1. Read [`CLAUDE.md`](CLAUDE.md) for an overview and critical knowledge.
2. Run `make dev` to start the server.
3. Test an endpoint: `curl -X POST http://localhost:8080/entries -H 'Content-Type: application/json' -d '{"side":"debit","amount":123.45,"currency":"USD"}'`
4. Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) to understand the design.
5. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) to learn how to make changes.

---

For detailed documentation, see [`docs/INDEX.md`](docs/INDEX.md).
