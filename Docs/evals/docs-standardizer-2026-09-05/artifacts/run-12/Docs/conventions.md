# Conventions

## Declared

**Linting** (ESLint, `eslint.config.js`):
- `eqeqeq: error` — always use `===`, never `==`
- `no-var: error` — use `const` or `let`, never `var`

## Observed

- **Rounding**: use `roundHalfEven()` from `src/ledger/rounding.js` only. Never use `Math.round()` directly (caused Feb drift incident).
- **Plugins**: auto-discovered by filename from `src/plugins/`. No registration list; the mechanism is in `src/plugins/registry.js`.
- **Environment variables**: `PORT` (default 8080) and `LEDGER_DB_PATH` control runtime behavior; see `Docs/SETUP.md`.
