# Open questions

Questions that only a human can answer about this codebase.

## Incomplete features

- `src/ledger/reconcile.js` exists but is never called. ADR 0001 mentions "nightly reconcile" — is this planned? Should it be removed, or should a job call it?
- `LEDGER_DB_PATH` is documented in `SETUP.md` and set by `make dev`, but the code only uses an in-memory stub in `src/db.js`. How is production database configured?

## Plugin behavior

- The `audit-log` plugin's `afterPost` hook wraps the entry in an object with `audited: true`, which changes its shape. Is this behavior tested? Does it need to be unwrapped before returning to the client?
- Currency normalization in `fx-normalize.js` silently converts non-USD to USD. Should entries with other currencies fail loudly instead of being converted?

## Testing and CI

- `.github/workflows/ci.yml` exists but is not documented in this codebase documentation. What does CI check? Does it run tests, lint, or migrations?
