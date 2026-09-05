# acme-ledger

Double-entry ledger service for Acme's billing team.

## Getting started

```
npm install
make dev
```

`make dev` starts `src/app.js` with `node --watch`, pointed at `./var/dev.sqlite`. The
server listens on `PORT` (default `8080`; see `.env.example`) and reads `LEDGER_DB_PATH`
for its store. There is no `config/` directory — configuration is entirely via
environment variables (copy `.env.example` to `.env`).

## Testing

```
npm test
```

## More

Start with `CLAUDE.md` for an orientation to this repo. See `docs/SETUP.md` for
environment setup and `docs/adr/` for design decisions (there is no separate
ARCHITECTURE doc — ADRs are the design record).
