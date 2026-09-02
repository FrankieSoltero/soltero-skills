# Implementation Plan — Notification Preferences (v2)

**Source spec:** the approved "Notification Preferences" spec deck the PM shared in the
#product channel. (Not checked into this repo.)

## Approach

Add per-user notification preferences to the existing settings service. No schema
changes beyond the new `notification_prefs` table.

## Task Dependency Table

| # | Task | Depends on | Files | Risk tier |
|---|------|-----------|-------|-----------|
| 1 | Add `notification_prefs` table + migration | — | `prisma/schema.prisma`, `prisma/migrations/` | standard |
| 2 | `GET/PUT /api/settings/notifications` | 1 | `src/api/settings/notifications.ts` | standard |
| 3 | Settings UI panel | 2 | `src/ui/settings/NotificationsPanel.tsx` | mechanical |
| 4 | Backfill existing users with defaults | 1 | `scripts/backfill-notification-prefs.ts` | standard |

## Tasks

### Task 1 — Add `notification_prefs` table + migration
Add the table with columns `user_id`, `channel`, `enabled`, `updated_at`. Write the
migration with `prisma migrate dev`, review the generated SQL, and apply to staging
first. Rollback: `prisma migrate resolve --rolled-back` plus the down-migration checked
in alongside it.
**Verify:** `npx prisma migrate status` reports the migration applied on staging and
`SELECT count(*) FROM notification_prefs;` returns 0 rows.

### Task 2 — `GET/PUT /api/settings/notifications`
Implement both handlers against the table from Task 1. `PUT` accepts
`{channel: "email"|"push", enabled: boolean}` and is authenticated with the existing
session middleware.
**Verify:** the endpoint behaves correctly under load and error handling is reasonable.

### Task 3 — Settings UI panel
Render one toggle per channel, wired to the endpoints from Task 2.
**Verify:** the panel looks right and the toggles feel responsive.

### Task 4 — Backfill existing users with defaults
Insert a row per existing user with `enabled = true` for both channels. Run in batches
of 1,000 inside a transaction, against staging first, then production during the
low-traffic window. Rollback: `DELETE FROM notification_prefs WHERE created_at > <run
start>`.
**Verify:** `SELECT count(*) FROM notification_prefs;` equals
`SELECT count(*) * 2 FROM users;` on staging before the production run.

## Done criteria

All four tasks' verifications pass and the feature is in an acceptable state for the
launch review.
