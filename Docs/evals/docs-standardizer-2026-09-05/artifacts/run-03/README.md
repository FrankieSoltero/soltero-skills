# acme-ledger

Double-entry ledger service for Acme's billing team.

## Getting started

```
npm install
make dev
```

There is no `npm run dev`; `make dev` sets `LEDGER_DB_PATH` and runs `node --watch src/app.js`
(see `docs/SETUP.md`). `npm start` also works (`node src/app.js`) without the watch/dev DB path.
The server listens on `PORT` (default 8080, see `.env.example`) from `src/app.js` — there is no
`src/server.js` and no `config/` directory; configuration is environment variables only.

## Testing

```
npm test
```

There is no `npm run test:unit`.

## More

See `docs/SETUP.md` for environment setup and `docs/architecture.md` for the design.
