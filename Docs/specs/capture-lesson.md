# Skill Spec — capture-lesson

- **Problem:** After fixing a bug or hitting a non-obvious gotcha, the lesson is lost — no
  consistent record, so the same mistake recurs.
- **Trigger:** Immediately after a bug fix, incident resolution, or discovery of a gotcha.
- **Scope:** Append a structured entry to `Docs/mistakes-and-fixes.md` (create if missing):
  date, symptom, root cause, fix, lesson, regression-test idea. Optionally scaffold the test.
  Non-goal: deciding code fixes; it only records them.
- **Success scenario:** Agent finishes a fix, recognizes it's worth capturing, runs the
  bundled script, and a correctly formatted entry appears.
- **Bundled assets:** `scripts/append-lesson.mjs`.
