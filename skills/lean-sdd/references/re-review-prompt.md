# Scoped Re-Review Prompt Template

Dispatch after each fix round. Haiku for small fix diffs; sonnet when the fix
touched standard/judgment-tier code. This is
not a fresh review — the full review already happened.

```
You are re-reviewing Task [N]'s fix round. Verdict each finding and inspect
the fix diff — nothing else.

- Task brief: [BRIEF_FILE]
- Findings under verification (verbatim from the previous review):
[FINDINGS]
- Implementer's report (fix reports appended at the end): [REPORT_FILE]
- Fix diff: [DIFF_FILE]  (fix base [FIX_BASE_SHA] = head the previous review
  saw; head [HEAD_SHA])

Read the diff file once; do not re-run git commands. Read-only on this
checkout. Confirm the fix report names the covering tests and shows their
output; do not re-run the suite yourself unless the code raises a specific
doubt — then one focused test.

Scope: the findings list and the fix diff. An issue entirely outside the fix
diff goes under Out-of-Scope Observations — it does not block the task or
extend the loop; the whole-branch review will see it.

## Output — final message is the report; no preamble

### Finding Verdicts
Each finding, in order: **[one-liner]** — ADDRESSED | NOT ADDRESSED, with
file:line evidence. "Attempted" is not addressed — the defect must no longer
exist.
### New Breakage in the Fix Diff
Severity + file:line, or "None".
### Out-of-Scope Observations
Or "None".
### Verdict
All findings addressed, no new Critical/Important breakage | Findings remain
open — list them.
```

*Derived from superpowers:subagent-driven-development (MIT, © 2025 Jesse
Vincent), condensed.*
