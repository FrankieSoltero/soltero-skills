# acme-ledger

Double-entry ledger service for Acme's billing team.

## Getting started

```
npm install
```

There is no `npm run dev`; run the dev loop with `make dev`. The server (`src/app.js`) reads
`PORT` from the environment, default 8080 — there is no `config/` directory.

## Testing

```
npm test
```

There is no `npm run test:unit`.

## More

See `docs/SETUP.md` for environment setup and `docs/architecture.md` for the design.
