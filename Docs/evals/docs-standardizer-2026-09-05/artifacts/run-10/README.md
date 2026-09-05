# acme-ledger

Double-entry ledger service for Acme's billing team.

## Getting started

```
npm install
make dev
```

The server starts on port 8080 from `src/app.js`. Environment variables: `PORT` (default 8080) and `LEDGER_DB_PATH`.
(See `docs/SETUP.md` for details.)

## Testing

```
npm test
```

## More

See `docs/SETUP.md` for environment setup and `docs/architecture.md` for the design.
