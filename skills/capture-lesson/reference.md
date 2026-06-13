# Capture Lesson — Reference

## Entry format (enforced by append-lesson.mjs)

```
## YYYY-MM-DD — <symptom>

- **Symptom:** ...
- **Root cause:** ...
- **Fix:** ...
- **Lesson:** ...
- **Regression test:** ...
```

## Turning a lesson into a regression test

When the bug is reproducible in code, write the smallest test that would have caught it,
in the project's existing test framework, before moving on. Reference the test path in the
`--test` field so the log links to the guard.

## Optional: CHANGELOG line

For security/compliance/financial fixes, also add a one-line entry under "Fixed" in the
project's `CHANGELOG.md`, tagged with severity.
