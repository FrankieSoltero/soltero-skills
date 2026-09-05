# acme-ledger

Double-entry ledger service for Acme's billing team.

**New here (human or agent)? Start with [`AGENTS.md`](./AGENTS.md).** It has the exact,
verified commands, a file-by-file map, and a list of gotchas that otherwise cost a session
each to rediscover (env vars that silently do nothing, stubs that look real, etc.).

## Getting started

```
npm install
npm run migrate     # currently a no-op stub — see AGENTS.md Gotchas
npm start           # or: make dev   (watch mode)
```

The server starts on port 8080 (`process.env.PORT` default) from `src/app.js`. There is no
`config/` directory and no `npm run dev` script — those were stale from an earlier layout and
have been corrected here; see `AGENTS.md` if you find other docs that still mention them.

## Testing

```
npm test
```

`npm run lint` is defined but fails in a fresh checkout (missing `eslint` dependency) — see
`AGENTS.md` Gotchas before spending time on it.

## More

See `AGENTS.md` for the full onboarding reference, `docs/SETUP.md` for environment setup, and
`docs/ARCHITECTURE.md` for the request flow, plugin system, and known gaps between the docs
and the actual code.
