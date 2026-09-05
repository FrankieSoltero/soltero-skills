# acme-ledger

Double-entry ledger service for Acme's billing team.

## Getting started

```
npm install
cp .env.example .env
npm run migrate
make dev
```

This starts the server on `http://localhost:8080` (override with the `PORT` env var)
from `src/app.js`, currently backed by an in-memory store (see `src/db.js`). Env vars
are listed in `.env.example`; see `docs/SETUP.md` for the full setup notes.

To run the built server once instead of the watch loop: `npm start`.

## Testing

```
npm test
```

## More

See `docs/SETUP.md` for environment setup and `docs/adr/0001-use-sqlite.md` for the
storage decision. (There is no `docs/ARCHITECTURE.md` — that reference was stale.)
