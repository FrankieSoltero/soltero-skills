# Conventions

## Declared
- `eqeqeq: 'error'` — no `==`/`!=` (`eslint.config.js:1`)
- `no-var: 'error'` — no `var` (`eslint.config.js:1`)
- CI runs `npm test` then `npm run lint` on every push and pull request
  (`.github/workflows/ci.yml`)
- "The only rounding function allowed in posting code" is `roundHalfEven` in
  `src/ledger/rounding.js` (`src/ledger/rounding.js:1`)
- Plugins are discovered by filename in `src/plugins/`, one file per plugin, each
  default-exporting `{ name, hooks: { beforePost?, afterPost? } }`; there is no registration
  list (`src/plugins/registry.js:8-9`)

## Observed
- ES module `import`/`export` throughout (`"type": "module"` in `package.json`) — observed, not
  enforced by a lint rule.
- Money is handled as integer cents after `post()` (`src/ledger/post.js`,
  `migrations/0001_entries.sql`) — observed, not enforced by a lint rule.
