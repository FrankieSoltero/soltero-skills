# Golden principles — acme-scheduler

Small, versioned, mechanically enforceable rules. Each entry has an ID, a check command,
and the date it landed. Prose-only entries are not accepted here.

## GP-001 (v1, 2026-01-12) — Money is integer cents, never a float
- **Wrong:** `total: 12.34` (any float in a currency field)
- **Correct:** `totalCents: 1234`
- **Check:** `npm run lint:money`

## GP-002 (v1, 2026-02-03) — Every API handler validates its input at the boundary
- **Wrong:** reading `req.body.x` before a schema parse
- **Correct:** `const body = Schema.parse(req.body)` as the first statement
- **Check:** `npm run lint:boundary`
