---
name: db-migrations
description: Use when writing or reviewing database migrations in this repo — applies the team's migration checklist.
---

# DB Migrations

## Rules

- **M-1 (naming):** Migrations are timestamped and named for the change they make.
- **M-2 (safety):** Review each migration for safety before applying it.
- **M-3 (rollback):** Every migration ships with a tested down-migration.
- **M-4 (data):** Backfill scripts run separately from schema changes.
