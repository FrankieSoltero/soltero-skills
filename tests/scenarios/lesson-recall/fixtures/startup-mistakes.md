# Mistakes and Fixes

A running log of bugs, root causes, fixes, and lessons.

## 2026-05-14 — EAS build shipped with a stale native fingerprint

- **Symptom:** A production EAS build kept running the previous native module set after a config plugin change.
- **Root cause:** The fingerprint was cached from the prior build because the app version was unchanged.
- **Fix:** Bumped the app version so the fingerprint recomputed, then rebuilt.
- **Lesson:** Native config changes need a version bump to invalidate the EAS fingerprint.
- **Regression test:** (none yet)

## 2026-06-02 — Shift dates rendered one day earlier for staff west of UTC

- **Symptom:** The schedule screen showed a shift saved for Tuesday as Monday for staff in Arizona and California.
- **Root cause:** `new Date('2026-06-02')` parses a bare ISO date as midnight UTC, and rendering it with a local-timezone formatter shifts it back a day for negative offsets.
- **Fix:** Parsed schedule day strings as local calendar dates (split on '-' and construct with explicit year/month/day) instead of passing the string to the Date constructor.
- **Lesson:** Never feed a bare `YYYY-MM-DD` string to `new Date()` when the value is a calendar day rather than an instant. Store and compare calendar days as strings; convert only at render.
- **Regression test:** `src/lib/__tests__/dates.test.ts` — asserts a bare date string renders the same day at UTC-7.

## 2026-06-20 — Time-entry list showed stale rows after clock-out

- **Symptom:** After clocking out, the entry list still displayed the open entry until a manual refresh.
- **Root cause:** The mutation did not invalidate the time-entry query cache; the list read a cached page.
- **Fix:** Invalidated the affected query keys in the mutation's onSuccess.
- **Lesson:** Every mutation that changes a list must invalidate that list's cache key in the same commit.
- **Regression test:** (none yet)

## 2026-07-08 — Payroll week boundary put Sunday shifts in the wrong week

- **Symptom:** Shifts on Sunday were counted in the previous pay period for staff in negative UTC offsets.
- **Root cause:** The week boundary was computed with UTC getters on a local Date, so the local Sunday resolved to the prior UTC Saturday.
- **Fix:** Computed pay-period boundaries from the calendar-day string in the org's timezone, never from UTC getters.
- **Lesson:** Mixing UTC accessors with locally-constructed Dates silently shifts day boundaries. Pick one representation for calendar days and keep it end to end.
- **Regression test:** `src/lib/__tests__/payroll-week.test.ts`

## 2026-07-19 — Frontend called an endpoint the backend had not deployed yet

- **Symptom:** Production 404s for two minutes after a release.
- **Root cause:** Vercel finished the frontend deploy before Render finished the backend deploy — deploy skew.
- **Fix:** Held the frontend deploy until the backend health check reported the new build.
- **Lesson:** Two independently deployed services need an ordering gate, not a shared release note.
- **Regression test:** (none yet)

## 2026-08-03 — Push permission prompt fired twice on first launch

- **Symptom:** New users saw the notification permission dialog, dismissed it, and saw it again immediately.
- **Root cause:** The permission request ran in an effect with an unstable dependency, so it re-ran on the first re-render.
- **Fix:** Moved the request behind a ref-guarded one-shot.
- **Lesson:** Permission prompts are side effects with user-visible cost — guard them against effect re-entry.
- **Regression test:** (none yet)

## 2026-08-11 — Postgres connection pool exhausted under onboarding load

- **Symptom:** Bulk staff onboarding for a 59-person org timed out with "too many clients already".
- **Root cause:** Each row insert opened its own client instead of reusing the pool.
- **Fix:** Wrapped the bulk insert in a single pooled transaction.
- **Lesson:** Bulk writes go through one transaction on one pooled client.
- **Regression test:** `server/__tests__/bulk-onboard.test.ts`

## 2026-08-18 — Soft-deleting a role left orphaned assignments

- **Symptom:** Staff kept a role badge after the role was deleted.
- **Root cause:** The soft delete flagged the role row but left assignment rows pointing at it.
- **Fix:** Cascaded the soft delete to assignments in the same transaction.
- **Lesson:** Soft deletes need the same cascade reasoning as hard deletes.
- **Regression test:** (none yet)
