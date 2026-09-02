# Mistakes and Fixes

A running log of bugs, root causes, fixes, and lessons.

## 2026-04-30 — Org list kept showing a deleted org until a hard reload

- **Symptom:** After deleting an org from the admin console, the org switcher still listed it until the page was reloaded.
- **Root cause:** The delete route mutated the DB but nothing invalidated the cached org list, so the client kept serving the stale payload.
- **Fix:** Called `revalidateTag('orgs')` in the delete route handler.
- **Lesson:** A mutation that changes a cached list must invalidate that list's cache in the same handler.
- **Regression test:** (none yet)

## 2026-05-12 — Login rate limiter locked out a whole bar's staff

- **Symptom:** Eleven staff at one venue were locked out within a minute of a shift change.
- **Root cause:** The limiter keyed on IP, and the venue's tablets share one NAT address.
- **Fix:** Keyed the limiter on account id with a much smaller per-IP ceiling.
- **Lesson:** Shared-device venues break IP-keyed limits. Key on identity.
- **Regression test:** `server/__tests__/rate-limit.test.ts`

## 2026-05-27 — Password reset links expired immediately

- **Symptom:** Reset emails arrived with links that returned "expired" on the first click.
- **Root cause:** The token TTL was compared against a UTC timestamp while the token was minted with a local one.
- **Fix:** Minted and compared both timestamps in UTC.
- **Lesson:** Token lifetimes must be minted and validated in the same clock.
- **Regression test:** `server/__tests__/reset-token.test.ts`

## 2026-06-09 — Employee table paginated inconsistently under load

- **Symptom:** Rows appeared twice across pages when new employees were added mid-scroll.
- **Root cause:** Pagination ordered by `createdAt` alone with no tiebreaker.
- **Fix:** Added `id` as a stable tiebreaker to the order clause.
- **Lesson:** Every keyset pagination needs a unique tiebreaker column.
- **Regression test:** `server/__tests__/pagination.test.ts`

## 2026-06-18 — Bulk role assignment silently skipped half the roster

- **Symptom:** Assigning a role to 46 staff applied to 23.
- **Root cause:** The loop awaited inside a `forEach`, so half the promises were never awaited before the response returned.
- **Fix:** Replaced with a single batched write inside a transaction.
- **Lesson:** `forEach` does not await. Batch writes go through one transaction.
- **Regression test:** `server/__tests__/bulk-assign.test.ts`

## 2026-07-02 — Migrated off Next.js cache tags

- **Symptom:** Tag-based revalidation stopped invalidating anything after the App Router upgrade; several handlers were calling `revalidateTag` into the void.
- **Root cause:** The upgrade moved us to explicit per-route cache keys; `revalidateTag` no longer maps to how the org and venue lists are cached.
- **Fix:** Replaced every `revalidateTag` call with an explicit `revalidatePath` for the affected route plus a client-side query invalidation.
- **Lesson:** After the App Router upgrade, `revalidateTag` is not the invalidation mechanism in this repo. Older lesson entries that recommend it are stale — check the cache layer before following them.
- **Regression test:** (none yet)

## 2026-07-14 — Venue switcher showed venues from the previous org

- **Symptom:** Switching orgs left the previous org's venues in the dropdown for a few seconds.
- **Root cause:** The venue query key did not include the org id, so the cached result survived the org switch.
- **Fix:** Added the org id to the query key.
- **Lesson:** Any cached list scoped to a tenant must carry the tenant id in its cache key.
- **Regression test:** (none yet)

## 2026-07-23 — Shift export CSV opened with mojibake in Excel

- **Symptom:** Accented staff names rendered as garbage in Excel on Windows.
- **Root cause:** No UTF-8 BOM on the exported file.
- **Fix:** Prepended a BOM to the CSV response.
- **Lesson:** Excel needs a BOM to read UTF-8 CSV.
- **Regression test:** (none yet)

## 2026-08-04 — Invite emails went to the wrong org's staff

- **Symptom:** Two staff at org B received invites intended for org A.
- **Root cause:** The invite job resolved recipients from a request-scoped variable reused across queued jobs.
- **Fix:** Passed explicit recipient ids into the job payload.
- **Lesson:** Never let a queued job read request-scoped state.
- **Regression test:** `server/__tests__/invite-job.test.ts`

## 2026-08-14 — Deleting a bar left its employees assigned to it

- **Symptom:** Employees kept a venue badge after the venue was deleted.
- **Root cause:** The delete cascaded to shifts but not to assignments.
- **Fix:** Extended the cascade to assignment rows in the same transaction.
- **Lesson:** Deletes must cascade to every table that references the row, not just the obvious one.
- **Regression test:** (none yet)

## 2026-08-20 — Vercel preview used the production database

- **Symptom:** A preview deploy wrote test orgs into production.
- **Root cause:** `DATABASE_URL` was set at the project level, not per-environment.
- **Fix:** Scoped the variable per environment and added a startup assertion.
- **Lesson:** Environment variables that name a database must be environment-scoped and asserted at boot.
- **Regression test:** `server/__tests__/env-assert.test.ts`

## 2026-08-27 — Staff search returned soft-deleted employees

- **Symptom:** Search results included employees who had been removed.
- **Root cause:** The search query missed the `deletedAt IS NULL` predicate.
- **Fix:** Added the predicate and a shared scope helper.
- **Lesson:** Soft-delete filters belong in one shared query scope, not copied per query.
- **Regression test:** (none yet)
