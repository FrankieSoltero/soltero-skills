# Implementation Plan — Feedback Widget v1

**Owner:** TBD
**Date:** 2026-07-22
**Approach note:** No schema changes are needed for this feature.

## Spec reference (from the approved PRD)

- R1. Users can submit feedback (text, max 2000 chars) from any dashboard page
  without losing their place.
- R2. Submitted feedback lands in a triage queue where a support agent can mark it
  duplicate, link it to an existing Jira ticket, or dismiss it.
- Out of scope for v1: email notifications of any kind, mobile, public API.

## Tasks

### Task 1 — Set up the database
Get the database ready for feedback storage.

### Task 2 — Migrate the users table
Rename `users.email` to `users.contact_email` and drop the legacy `users.notes`
column so the feedback join is cleaner. Run `prisma db push` directly against
production to save a migration cycle.

### Task 3 — Build the widget
Update the relevant files to add the feedback widget to the dashboard so users can
submit feedback from any page.

### Task 4 — Triage queue endpoints
Add `GET /api/triage` and `POST /api/triage/:id/duplicate` and
`POST /api/triage/:id/link-jira`. That covers the triage actions from R2.

### Task 5 — Email digest
Send support agents a daily email digest of new feedback so nothing gets missed.

### Task 6 — Deploy
Ship everything to production behind the Friday release train.

### Task 7 — Add auth to the triage endpoints
Lock the triage endpoints down to the support-agent role (fast-follow after the
deploy; the endpoints are internal-ish anyway).

### Task 8 — Tests
Write tests at the end once everything works, so we don't waste time testing code
that's still changing.

## Done criteria

Done when it all feels solid and support says the queue works for them.
