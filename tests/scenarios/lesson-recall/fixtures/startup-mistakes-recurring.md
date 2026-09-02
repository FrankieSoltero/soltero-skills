# Mistakes and Fixes

A running log of bugs, root causes, fixes, and lessons.

## 2026-05-02 — Timesheet export was off by one day for half the staff

- **Symptom:** The CSV export listed shifts one calendar day earlier than the app displayed for staff in UTC-7.
- **Root cause:** The export serialized the shift day with `toISOString()`, which converts a locally-constructed Date to UTC and rolls back past midnight.
- **Fix:** Serialized the stored calendar-day string directly instead of round-tripping through a Date.
- **Lesson:** `toISOString()` on a local Date is a timezone conversion, not a format. Calendar days must not pass through it.
- **Regression test:** `server/__tests__/timesheet-export.test.ts`

## 2026-06-02 — Shift dates rendered one day earlier for staff west of UTC

- **Symptom:** The schedule screen showed a shift saved for Tuesday as Monday for staff in Arizona and California.
- **Root cause:** `new Date('2026-06-02')` parses a bare ISO date as midnight UTC; rendering with a local formatter shifts it back a day at negative offsets.
- **Fix:** Parsed schedule day strings as local calendar dates with explicit year/month/day.
- **Lesson:** Never feed a bare `YYYY-MM-DD` string to `new Date()` for a calendar day.
- **Regression test:** `src/lib/__tests__/dates.test.ts`

## 2026-06-25 — Availability calendar highlighted the wrong day

- **Symptom:** Staff marking availability for Friday saw Thursday highlighted after saving.
- **Root cause:** The picker returned a local Date, the API stored `date.toISOString().slice(0,10)`, and the two disagreed across midnight UTC.
- **Fix:** Sent the picker's local calendar day as a formatted string; the API stopped calling `toISOString()`.
- **Lesson:** The boundary between picker and API must agree on calendar-day-as-string. Every conversion is a chance to shift a day.
- **Regression test:** (none yet)

## 2026-07-08 — Payroll week boundary put Sunday shifts in the wrong week

- **Symptom:** Sunday shifts were counted in the previous pay period for staff in negative UTC offsets.
- **Root cause:** Week boundaries were computed with UTC getters on a locally-constructed Date.
- **Fix:** Computed pay-period boundaries from the calendar-day string in the org's timezone.
- **Lesson:** Mixing UTC accessors with local Dates silently shifts day boundaries.
- **Regression test:** `src/lib/__tests__/payroll-week.test.ts`

## 2026-07-19 — Frontend called an endpoint the backend had not deployed yet

- **Symptom:** Production 404s for two minutes after a release.
- **Root cause:** Vercel finished the frontend deploy before Render finished the backend deploy.
- **Fix:** Held the frontend deploy until the backend health check reported the new build.
- **Lesson:** Two independently deployed services need an ordering gate.
- **Regression test:** (none yet)

## 2026-08-11 — Postgres connection pool exhausted under onboarding load

- **Symptom:** Bulk staff onboarding for a 59-person org timed out with "too many clients already".
- **Root cause:** Each row insert opened its own client instead of reusing the pool.
- **Fix:** Wrapped the bulk insert in a single pooled transaction.
- **Lesson:** Bulk writes go through one transaction on one pooled client.
- **Regression test:** `server/__tests__/bulk-onboard.test.ts`

## 2026-08-21 — Shift swap request showed yesterday's date to the approver

- **Symptom:** A swap requested for the 22nd appeared as the 21st in the manager's approval queue.
- **Root cause:** The approval queue formatted the stored calendar day with `new Date(day).toLocaleDateString()`, parsing the bare string as UTC midnight.
- **Fix:** Formatted from the calendar-day parts, not from a Date built off the bare string.
- **Lesson:** Same UTC/local calendar-day shift as before, in a new surface. The parsing helper exists in `src/lib/dates.ts` — nothing forces anyone to use it.
- **Regression test:** (none yet)

## 2026-08-26 — Notification badge count never cleared

- **Symptom:** The badge kept showing unread counts after the user opened the inbox.
- **Root cause:** The clear call fired before the read receipt was persisted, so the next poll restored the count.
- **Fix:** Cleared the badge from the persisted receipt response rather than optimistically.
- **Lesson:** Optimistic clears need a server-confirmed source of truth to settle against.
- **Regression test:** (none yet)
