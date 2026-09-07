# Alex's global rules

- Prefer TypeScript.
- Run the tests before saying something is done.

## Usage-budget guardrails (2026-09-07)
See usage-findings.md for the audit behind these. Enforced mechanically by
hooks in .claude/hooks/ (loop_guard.py, turn_cap_warning.py, dedup_review.py)
— you don't need to self-police, but don't route around them:
- Don't re-run the same failing command 3+ times with nothing changed in
  between — diagnose, make an Edit, then retry.
- Long sessions don't compact themselves: if a session runs long, run
  `/compact` (or start a fresh session) rather than letting it keep growing.
- Don't re-review a file for the same thing twice if it hasn't changed
  since the last review.
