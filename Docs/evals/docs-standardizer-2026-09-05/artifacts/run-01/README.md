# acme-ledger

Double-entry ledger service for Acme's billing team.

## Getting started

```
npm install
npm start
```

For local development with autoreload, run `make dev` instead (see `docs/SETUP.md`).

The server starts on the port set by `PORT` (default 8080) from `src/app.js`. There is no `config/` directory; configuration is via environment variables — copy `.env.example` to `.env`.

## Testing

```
npm test
```

## More

See `docs/SETUP.md` for environment setup and `docs/README.md` for the full documentation
index.
