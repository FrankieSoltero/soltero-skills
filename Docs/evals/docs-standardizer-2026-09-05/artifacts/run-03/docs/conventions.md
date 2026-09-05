# Conventions

## Declared
- `===`/`!==` required, no `==`/`!=` — `eslint.config.js` (`eqeqeq: 'error'`)
- `var` is disallowed; use `let`/`const` — `eslint.config.js` (`no-var: 'error'`)
- CI runs `npm test` then `npm run lint` on every push and pull request —
  `.github/workflows/ci.yml`
- `roundHalfEven` (`src/ledger/rounding.js`) is the only rounding function allowed in posting
  code — stated in that file's own comment and in `docs/notes.md`
- SQLite is the ledger store; migrations are numbered SQL files under `migrations/`, applied by
  `scripts/migrate.js` — `docs/adr/0001-use-sqlite.md`

## Observed
- Plugins under `src/plugins/` default-export `{ name, hooks: { beforePost?, afterPost? } }` and
  are picked up by filename at boot (`src/plugins/registry.js`) — observed from the two existing
  plugins; not enforced by any lint rule or check.
- `src/db.js` is described in its own comment as an in-memory stand-in for the real SQLite
  driver, "loaded in production only" — observed from the comment; the real driver is not present
  in this repo, so the claim itself is `(unverified)` here.
