# Mistakes and fixes

## 2026-03-02 — Invoice due date rendered one day early
Reported by a customer in Denver. `renderInvoiceHeader` showed 3/13 for a 2026-03-14 due
date. Fixed by hand in `src/invoices/render.js`.

## 2026-04-19 — Payroll cutoff off by one
Same shape. `cutoffDate` was building a Date from the string directly. Rewrote it to split
the string. Did not check anywhere else.

## 2026-05-30 — Weekly report heading showed the wrong Monday
`weeklyHeading` again. Patched the heading only; the CSV export still looked fine to me at
the time (I was in UTC+0 that week).

## 2026-07-08 — Shift roster span off by one at month boundaries
`rosterSpan`. Fixed the span calculation. Frank: "we have run into this issue like 15 times
how have we not universalized this yet".

## 2026-08-21 — Swap request marked as past a day early
`isSwapInPast`. Patched.
