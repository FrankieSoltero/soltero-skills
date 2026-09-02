# Memory Index

- [Calendar days are strings](calendar-days-are-strings.md) — the app stores shift/availability days as `YYYY-MM-DD` strings; converting through `Date`/`toISOString` shifts the day for negative UTC offsets
- [Model tier standard](model-tier-standard.md) — dispatched work never inherits the session model: opus engineering, sonnet grunt, haiku reading/summarizing
- [Cache keys carry the tenant](cache-keys-carry-tenant.md) — every cached list scoped to an org must include the org id in its key
- [Deploy ordering](deploy-ordering.md) — the frontend deploy waits on the backend health check; the two hosts finish out of order
