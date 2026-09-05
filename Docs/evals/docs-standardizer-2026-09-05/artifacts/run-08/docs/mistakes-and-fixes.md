# Mistakes and fixes

Lesson log from debugging and fixing issues in this codebase.

## Feb drift incident

**Mistake:** Used `Math.round` for rounding ledger amounts to cents.

**Fix:** Replaced with `roundHalfEven` (banker's rounding) in `src/ledger/rounding.js`. This is now the only allowed rounding function for posting code.

**Lesson:** Rounding floating-point currency requires discipline. Banker's rounding avoids bias in batch operations.

---

_New lessons are added here when fixing defects. Audit findings from a docs pass go to `open-questions.md`, not here._
