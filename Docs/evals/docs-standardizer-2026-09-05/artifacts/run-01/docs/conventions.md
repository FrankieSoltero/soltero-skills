# Conventions

## Declared
- Strict equality only (`eqeqeq`) — `eslint.config.js`.
- No `var` (`no-var`) — `eslint.config.js`.
- CI runs `npm test` then `npm run lint` on every push and pull request —
  `.github/workflows/ci.yml`.
- `roundHalfEven` is the only rounding function allowed in posting code — `docs/notes.md`.
- SQLite is the ledger store; migrations are numbered SQL files under `migrations/`, applied
  by `scripts/migrate.js` — `docs/adr/0001-use-sqlite.md`.

## Observed
- Plugins default-export `{ name, hooks: { beforePost?, afterPost? } }` — observed in
  `src/plugins/fx-normalize.js` and `src/plugins/audit-log.js`; not declared anywhere.
- ES modules (`import`/`export`) throughout, matching `"type": "module"` in `package.json` —
  observed, not written down as a rule.
