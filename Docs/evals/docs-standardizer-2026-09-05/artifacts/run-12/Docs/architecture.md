# Architecture

## Entry points

- **Server**: `src/app.js` (`start()` function or direct execution)
- **Schema migration**: `scripts/migrate.js` (applies SQL under `migrations/`)

## Module map

```
app.js
  ├─ plugins/registry.js → loadPlugins() (discovers .js files, imports each)
  ├─ http/router.js → router(plugins) (creates request handler)
  └─ (HTTP server setup)

http/router.js
  └─ ledger/post.js → post(input, plugins) (processes entries)

ledger/post.js
  ├─ ledger/rounding.js → roundHalfEven() (converts amount to cents)
  └─ db.js → insertEntry() (writes to database)

plugins/*.js (auto-discovered)
  └─ hooks: beforePost(entry)?, afterPost(entry)?
```

## Data flow

1. HTTP request arrives at `/entries (unverified)` (POST)
2. Body parsed as JSON
3. `ledger.post()` processes:
   - Rounds amount to cents via `roundHalfEven()`
   - Runs `beforePost` hooks (all plugins)
   - Writes entry to database
   - Runs `afterPost` hooks (all plugins)
4. Response: JSON of processed entry

## Non-obvious mechanisms

**Plugin discovery**: Every `.js` file in `src/plugins/` (except `registry.js`) is auto-loaded as a plugin. No registration list. A plugin default-exports `{ name, hooks: { beforePost?, afterPost? } }`. This lets billing rules and formatters be added as files without editing any core code.

**Rounding**: `roundHalfEven()` is the *only* allowed rounding function in posting code. Naive `Math.round()` caused a Feb drift incident and is forbidden by convention.

**Database**: Test uses in-memory store from `db.js`; production loads the real SQLite driver (not in test). Schema changes are migrations under `migrations/` run by `npm run migrate`.
