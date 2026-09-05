# Conventions

## Declared

- **Code style**: ESLint configuration in `eslint.config.js` is enforced via `npm run lint`
- **Testing**: Node.js built-in test runner; tests in `test/*.test.js`
- **Database**: SQLite; schema managed with migration scripts in `scripts/migrate.js`
- **Amounts**: Stored as integer cents; no floating-point arithmetic

## Observed

- Plugins discovered by filename in `src/plugins/` (no registration required)
- HTTP handlers follow request-response pattern
- All amounts are computed in cents to avoid floating-point errors
- Environment variables are the single source of configuration
