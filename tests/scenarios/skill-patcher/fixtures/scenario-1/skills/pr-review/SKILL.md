---
name: pr-review
description: Use when reviewing a pull request in this repo — applies the team's review checklist before approving.
---

# PR Review

## Rules

- **R-1 (scope):** Confirm the diff matches the stated intent of the PR; flag unrelated
  changes.
- **R-2 (tests):** Every behavior change needs a test that fails without it.
- **R-3 (dependencies):** Check that new dependencies are appropriate and maintained.
- **R-4 (secrets):** Scan the diff for obvious secrets before approving.
- **R-5 (migrations):** Database migrations require a rollback note in the PR
  description.
