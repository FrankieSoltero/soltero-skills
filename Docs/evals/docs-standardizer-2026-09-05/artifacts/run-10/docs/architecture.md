# Architecture

## Entry points

- `src/app.js` — HTTP server initialization and route setup
- `src/http/` — request handlers for each endpoint
- `src/ledger/` — core ledger operations (posting, querying)

## Module map

```
src/
  ├── app.js          — server setup
  ├── db.js           — database connection and initialization
  ├── http/           — HTTP request handlers
  │   └── router.js
  ├── ledger/         — ledger business logic
  │   ├── post.js
  │   ├── rounding.js
  │   └── reconcile.js
  └── plugins/        — plugin system
      ├── registry.js
      ├── audit-log.js
      └── fx-normalize.js
```

## Data flow

1. HTTP request arrives at `src/app.js` handlers
2. Request routed via `src/http/router.js`
3. Handler calls `src/ledger/` operations
4. Ledger operations interact with SQLite via `src/db.js`
5. Database persists transactions in normalized tables

## Non-obvious mechanisms

- **Plugin discovery**: Plugins in `src/plugins/` are automatically discovered by filename at boot; there is no registration list (see `doc/notes.md`)
- **Rounding**: The `roundHalfEven` function in `src/ledger/rounding.js` is the ONLY rounding function allowed in posting code
- **Environment-only config**: No config files; all configuration via environment variables
