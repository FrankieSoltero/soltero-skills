# Mistakes and Fixes

## 2026-07-05 — Blocking index build reached production

- **Symptom:** CREATE INDEX on a large table spiked write latency in production.
- **Cause:** db-migrations M-2 says "review for safety" with no hazard checklist; each
  session improvises what "safe" means.
- **Fix:** Index rebuilt concurrently in a maintenance window.
- **Lesson:** Three distinct migration incidents now trace to M-2's vagueness. The rule
  needs concrete hazard classes, not another reminder to reviewers.
- **Test:** n/a (process gap).
