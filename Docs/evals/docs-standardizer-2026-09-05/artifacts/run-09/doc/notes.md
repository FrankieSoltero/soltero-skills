# Quick reference & critical gotchas

Read this before making changes to the ledger or posting logic.

## Rounding (CRITICAL)

**Every amount is stored as integer cents.** When posting a ledger entry:

- Input: dollars (e.g., `100.005`)
- Processing: **ONLY use `roundHalfEven()` from `src/ledger/rounding.js`**
- Storage: integer cents (e.g., `10000` for $100.00)

**DO NOT use `Math.round()` directly in posting code.** A naive rounding implementation caused the Feb drift incident where accounts went out of balance. `roundHalfEven` implements banker's rounding (round to nearest even) as per accounting standards.

### Where to add rounding:
- `src/ledger/post.js:20-45` — Rounding happens here; do not bypass
- `src/plugins/` — If a plugin transforms amounts, use `roundHalfEven()` in `beforePost`

### Test it:
```bash
npm test test/rounding.test.js
```

## Plugin loading

Plugins under `src/plugins/` are auto-loaded by filename (alphabetical order). There is **no registration list**.

- Add a `.js` file → it loads automatically on next server start
- Each plugin exports `{ name, hooks: { beforePost?, afterPost? } }`
- `beforePost` runs before storage (can modify the entry)
- `afterPost` runs after storage (cannot affect the record but can add fields)
- Load order matters: if plugin A depends on plugin B's transformation, ensure B's filename comes first (e.g., `000-b.js` before `001-a.js`)

### Debug plugin order:
```javascript
// Add this in src/app.js after loadPlugins():
console.log('Loaded plugins:', plugins.map(p => p.name));
```

## Migrations are immutable

Once a migration is applied to production, **you cannot change or delete it**. Create a new migration instead:

```sql
-- migrations/0002_fix_schema.sql (new file, never edit 0001)
ALTER TABLE entries ADD COLUMN new_field TEXT;
```

Apply with:
```bash
npm run migrate
```

## Database path

The server reads `LEDGER_DB_PATH` from `.env`. Default is `./var/ledger.sqlite`.

- Dev: typically `./var/dev.sqlite` (see `Makefile`)
- Production: absolute path or network path (ensure directory exists and is writable)

If the directory doesn't exist, the app will fail on first write. Ensure it exists:
```bash
mkdir -p ./var
```

## Entry schema

Every entry in the `entries` table has:
- `id` (INTEGER PRIMARY KEY) — auto-increment
- `side` (TEXT) — 'debit' or 'credit'
- `cents` (INTEGER) — dollar amount × 100 (always integer)
- `currency` (TEXT) — ISO 4217 code (e.g., 'USD')

Plugins can add fields (see `audit-log.js` for example).

## Server startup

Entry point: `src/app.js`

1. Loads plugins from `src/plugins/`
2. Creates HTTP router (takes plugins as argument)
3. Listens on `PORT` from `.env`

If plugins fail to load, the server won't start. Check plugin exports.

## Testing

Tests run against an in-memory DB (via `src/db.js`), not the file DB. Safe to run anytime without affecting data.

```bash
npm test                          # All tests
npm test test/post.test.js        # Single file
npm test -- --grep "rounding"     # Grep pattern
```

## Reconcile schedule

The server runs daily reconciliation at the time set in `RECONCILE_CRON` (.env). Default: `15 2 * * *` (2:15 AM daily).

Format: standard cron (minute, hour, day-of-month, month, day-of-week).

If you need reconcile to run, manually call the reconcile endpoint (see `src/http/router.js`).

## Common commands

| Command | Behavior |
|---------|----------|
| `make dev` | Start with watch (auto-restart on file changes) |
| `npm test` | Run unit tests |
| `npm run migrate` | Apply pending migrations |
| `npm run lint` | Run ESLint |
| `npm install` | Install/update dependencies |

## Troubleshooting checklist

- [ ] Did you run `npm run migrate` before starting the server?
- [ ] Is `./var/` directory created?
- [ ] Did you copy `.env.example` to `.env`?
- [ ] Is Node 18+? (`node --version`)
- [ ] Is `Math.round()` used anywhere in posting logic? (grep for it, should be 0 results)
- [ ] Did you test? (`npm test`)

## Links

- Full architecture: `docs/ARCHITECTURE.md`
- Onboarding guide: `docs/ONBOARDING.md`
- Environment setup: `docs/SETUP.md`
- Decision log: `docs/adr/`
