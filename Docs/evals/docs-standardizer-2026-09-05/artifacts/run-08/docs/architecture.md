# Architecture

## Entry points

- `src/app.js` — HTTP server; starts on PORT (default 8080) and loads plugins
- `scripts/migrate.js` — applies pending database migrations
- `scripts/` — CLI utilities (called via npm scripts and make targets)

## Module map

```
src/
├── app.js            — server bootstrap; creates HTTP listener, loads plugins
├── db.js             — database interface; in-memory stub in test, SQLite in prod
├── http/
│   └── router.js     — POST /entries handler; parses JSON, calls ledger.post()
├── ledger/
│   ├── post.js       — core entry posting; applies plugin hooks, inserts to DB
│   ├── rounding.js   — banker's rounding (half-even); the ONLY rounding allowed
│   └── reconcile.js  — nightly reconciliation (unused; kept for future)
└── plugins/
    ├── registry.js   — plugin discovery; loads all .js files (except itself)
    ├── fx-normalize.js — plugin example
    ├── audit-log.js  — plugin example
    └── (more .js files auto-loaded as plugins)
```

## Data flow

1. Client POST /entries with JSON body `{ amount, ... }`
2. `router` parses JSON, calls `ledger.post(input, plugins)`
3. `post()` executes:
   - Apply `beforePost` hooks from all plugins (modify entry in-place)
   - Convert `amount` (decimal) to `cents` (integer) using `roundHalfEven`
   - Insert into database
   - Apply `afterPost` hooks from all plugins (observe entry, log, etc.)
4. Return posted entry to client

## Non-obvious mechanisms

### Plugin discovery (no registry)

- Every .js file in `src/plugins/` except `registry.js` is auto-loaded as a plugin at boot
- Each plugin must export `{ name, hooks: { beforePost?, afterPost? } }`
- Hooks are called in file-order; a `beforePost` hook can modify the entry before rounding
- `afterPost` hooks cannot affect the posted entry, but can log or validate

### Rounding

- All amounts are stored as integer cents (not floating-point)
- `roundHalfEven` in `src/ledger/rounding.js` is the **ONLY rounding function** allowed in posting code
- Naive `Math.round` caused the Feb drift incident; never use it for ledger amounts
- A plugin's `beforePost` hook can modify `amount`; `post()` rounds after all hooks

### Database

- Per ADR 0001, SQLite via `src/db.js`; migrations under `migrations/`, applied by `scripts/migrate.js`
- Single writer (one process); nightly reconcile task planned but not implemented
- Tests use the in-memory stub in `src/db.js`; production is configured in env vars
