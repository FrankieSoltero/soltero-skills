# acme-ledger

Double-entry ledger service for Acme's billing team.

## Getting started

```
npm install
make dev
```

The server starts on port 8080 from `src/app.js` and reads `PORT` and `LEDGER_DB_PATH` from the environment.

## Testing

```
npm test
```

## More

See `docs/SETUP.md` for environment setup and `docs/architecture.md` for the design.
