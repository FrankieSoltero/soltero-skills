# Decisions

Index of architectural decisions and decision records.

## Active decisions

- **ADR 0001** — Use SQLite for the ledger store (see `adr/0001-use-sqlite.md`)
  - Single-writer ledger, one process, nightly reconcile planned
  - SQLite via `src/db.js`, migrations under `migrations/`
  - Decision made 2025-11-03; revisit if a second writer appears
