# ADR 0001 — Use SQLite for the ledger store

Status: accepted (2025-11-03)

Context: single-writer ledger, one process, nightly reconcile. Postgres was the default
choice; the ops cost was not justified for one writer.

Decision: SQLite via `src/db.js`, migrations as numbered SQL files under `migrations/`,
applied by `scripts/migrate.js`. Revisit if a second writer ever appears.
