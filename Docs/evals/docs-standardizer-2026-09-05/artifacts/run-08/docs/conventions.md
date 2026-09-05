# Conventions

## Declared

### Code style

- ESLint enforces `eqeqeq` (strict equality, no == or !=)
- ESLint enforces `no-var` (use const/let, not var)
- Node.js ES modules (type: "module" in package.json)

### Testing

- Tests run with Node's built-in `node --test` (no external test framework)
- Test files live in `test/` and follow `*.test.js` naming
- Run with `npm test`

### Database schema

- Schema migrations live in `migrations/` as numbered SQL files (0001, 0002, etc.)
- Apply with `npm run migrate` before dev or tests
- Each migration is independent and irreversible

## Observed

### Module organization

- HTTP routing separated from ledger logic (`http/` vs `ledger/`)
- Plugin system decouples post-processing from core posting
- No centralized configuration file (env vars only)

### Error handling

- No try/catch blocks visible in core posting logic; errors propagate to HTTP handler
- Plugins are trusted to not throw; no error handling in plugin loop

### Entry structure

- All entries have at minimum `amount` field
- Plugins can add fields before posting (in `beforePost` hooks)
- Core code always rounds after plugin modifications

### Rounding discipline

- Single rounding operation per entry (in `post()`, after all hooks)
- Amounts are stored as integer cents, never as floats in the database
