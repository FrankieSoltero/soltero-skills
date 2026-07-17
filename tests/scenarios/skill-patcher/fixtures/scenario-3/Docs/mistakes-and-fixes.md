# Mistakes and Fixes

## 2026-07-08 — Fix-forward left main red for 4 hours

- **Symptom:** Agent chose fix-forward for a "small" fix that took 4 hours; main red all
  afternoon.
- **Cause:** test-triage T-5 says "prefer fixing forward when the fix is small" without
  defining small; each session guesses.
- **Fix:** Reverted, then fixed on a branch.
- **Lesson:** T-5 (and T-2, see the quarantine incidents) fail the same way: an
  undefined judgment word each session fills in optimistically.
- **Test:** n/a (process gap).
