# acme-ledger

Double-entry ledger service for Acme's billing team.

## Getting started

```
npm install
make dev
```

The server starts on port 8080 (override with `PORT`) from `src/app.js`. There is no `config/`
directory; configuration is via environment variables — copy `.env.example` to `.env`. See
`docs/SETUP.md` for details.

## Testing

```
npm test
```

## More

See `docs/SETUP.md` for environment setup and `docs/adr/` for architecture decisions
(there is no `docs/ARCHITECTURE.md` in this repo).
