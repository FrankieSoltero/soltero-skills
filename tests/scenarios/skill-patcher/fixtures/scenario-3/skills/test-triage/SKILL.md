---
name: test-triage
description: Use when CI fails — triages failing tests and decides rerun, quarantine, or fix.
---

# test triage skill

this skill is for when the CI goes red. written 2025, some tools mentioned may be old.

RULES (numbering kept for hook references, do not renumber):

* **T-1**: first rerun the failed job once to rule out infra flakes
- **T-2 (flaky quarantine):** If a test fails intermittently, quarantine it.
* T-3: check the last 5 commits for obvious causes (use `git log`, or the old
  `ci-blame.sh` script if it still exists)

Misc notes: the dashboards moved twice, see wiki. TODO clean this section up someday.

- **T-4**: notify the owning team in #eng-ci ... actually it's #ci-alerts now? verify.
- **T-5 (fix-forward):** Prefer fixing forward over reverting when the fix is small.
* T-6: after any quarantine, file a ticket

(the formatting in here is inconsistent, sorry — it grew organically)
