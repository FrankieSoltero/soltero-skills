# Mistakes and Fixes

## 2026-06-29 — Unpinned dependency approved again

- **Symptom:** Second PR in two weeks approved with a floating dependency range.
- **Cause:** Review guidance (pr-review R-3) says "appropriate and maintained" — it
  never mentions version pinning, so each session re-decides from scratch.
- **Fix:** Reviewer caught it manually; approval reverted.
- **Lesson:** The checklist itself is the gap — sessions follow R-3 as written and R-3
  as written permits floating ranges.
- **Test:** n/a (process gap, not code).

## 2026-07-10 — Dev-dependency drift took CI down

- **Symptom:** Unpinned dev-dependency approved ("dev-only, low risk"); CI red for two
  days after a transitive bump.
- **Cause:** Same R-3 vagueness; dev vs runtime distinction invented in-session.
- **Fix:** Pinned the version; human overrode the agent's approval on PR #158.
- **Lesson:** Third occurrence of the same guidance gap. The rule needs to change, not
  the reviewers.
- **Test:** n/a.
