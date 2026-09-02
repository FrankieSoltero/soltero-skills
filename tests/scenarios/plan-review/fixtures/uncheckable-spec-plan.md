# Implementation Plan — Notification Preferences (v3)

**Source spec:** `docs/specs/notification-preferences.md` (owned by the PM; stored in the
product wiki, not mirrored into this repo — the reviewer cannot open it).

## Approach

Add per-user notification preferences to the existing settings service, per spec §2.

## Task Dependency Table

| # | Task | Depends on | Files | Risk tier |
|---|------|-----------|-------|-----------|
| 1 | Add `notification_prefs` table + migration | — | `prisma/schema.prisma`, `prisma/migrations/` | standard |
| 2 | `GET/PUT /api/settings/notifications` | 1 | `src/api/settings/notifications.ts` | standard |
| 3 | Settings UI panel | 2 | `src/ui/settings/NotificationsPanel.tsx` | mechanical |

## Tasks

### Task 1 — Add `notification_prefs` table + migration
*Spec ref: §2.1 "Storage model".*
Add the table with columns `user_id`, `channel`, `enabled`, `updated_at`. Apply with
`prisma migrate dev`, staging first; the down-migration ships in the same commit.
**Verify:** `npx prisma migrate status` reports the migration applied on staging and
`SELECT count(*) FROM notification_prefs;` returns 0 rows.

### Task 2 — `GET/PUT /api/settings/notifications`
*Spec ref: §2.3 "Preferences API".*
Implement both handlers against the table from Task 1. `PUT` accepts
`{channel: "email"|"push", enabled: boolean}`, authenticated with the existing session
middleware.
**Verify:** `npm run test:api -- notifications` passes; `curl -X PUT` with an
unauthenticated session returns HTTP 401.

### Task 3 — Settings UI panel
*Spec ref: §2.4 "Settings surface".*
Render one toggle per channel, wired to the endpoints from Task 2.
**Verify:** `npm run test:ui -- NotificationsPanel` passes with the toggle-persists case
green.

## Done criteria

All three tasks' verifications pass.
