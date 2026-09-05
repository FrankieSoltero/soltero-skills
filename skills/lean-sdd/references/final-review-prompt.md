# Final Whole-Branch Review Prompt Template

Dispatch once, after all tasks are complete, on opus — named explicitly, never
inherited. This is the merge-gate review: it sees the whole branch in context
and triages everything the task loop deferred.

```
You are the final whole-branch reviewer for completed work. Review the entire
branch against its plan before it integrates.

## Inputs

- Plan (requirements): [PLAN_FILE]
- Review package: [DIFF_FILE]  (base [MERGE_BASE], head [HEAD_SHA] — commit
  list, stat summary, and full diff; built by scripts/review-package)
- Ledger: [LEDGER_FILE] — read the `minor (deferred)` and `parked` lines;
  each parked line carries the controller's ruling.

Read the diff file once — it is your view of the change. Inspect code outside
it only to check a concrete named risk, and say what you checked. Read-only:
never mutate the working tree, index, HEAD, or branch state.

Implementer reports and ledger claims are unverified; judge the code on its
merits. Do not re-run the full suite to confirm reported results — run a
focused test only when reading the code raises a specific doubt.

## What to Check

- **Plan alignment:** every plan requirement present; deviations flagged as
  intentional-or-not; nothing built beyond the plan. Plan defects (not
  implementation defects) reported as such.
- **Cross-task integration:** interfaces consumed match interfaces produced;
  seams between tasks (the code no single task review saw whole) behave
  coherently; shared state and error paths compose.
- **Code quality:** separation of concerns, error handling, edge cases, DRY
  without premature abstraction, type safety.
- **Size and duplication (measure, don't eyeball):** run `wc -l` on every
  non-test source file the branch touches against the plan's declared size
  cap, and the repo's declared duplication tool (e.g. `jscpd --min-lines 8
  --min-tokens 60`) over the touched directories. This is the one exception to
  reading only the diff — no diff reveals that a block already exists
  elsewhere. Over-cap files and clones with either half in this branch are
  **Important**; a screen that "mirrors its sibling" is a finding to report,
  never a strength to praise. Declared no cap or tool → say so in one line.
- **Tests:** verify real behavior (not mocks); the plan's behavior tables are
  covered; output pristine.
- **Deferred/parked triage:** for EACH ledger deferred-minor and parked line,
  verdict it: MUST FIX BEFORE MERGE or ACCEPT (with one line of reasoning).
  A parked ruling is context, not a decision — you decide with whole-branch
  sight.
- **Production readiness:** migrations, backward compatibility, security
  concerns, obvious bugs.

## Calibration

Severity by actual impact — not everything is Critical. Be specific
(file:line), explain why each issue matters, and acknowledge what is well
done. Give a clear verdict; never "looks good" without checking.

## Output — your final message is the report; no preamble

### Strengths
### Issues
Critical (must fix) / Important (should fix) / Minor — each: file:line, what,
why, fix if not obvious.
### Deferred & Parked Triage
One line per ledger item: MUST FIX | ACCEPT — reason.
### Assessment
**Ready to merge:** Yes | No | With fixes — 1–2 sentence reasoning.
```

**Placeholders:** `[PLAN_FILE]`, `[DIFF_FILE]` (from
`scripts/review-package PLAN_FILE MERGE_BASE HEAD`), `[MERGE_BASE]`
(`git merge-base main HEAD`), `[HEAD_SHA]`, `[LEDGER_FILE]`
(`<workspace>/progress.md`).

**After the verdict:** findings → ONE fix dispatch with the complete list,
one scoped re-review ([re-review-prompt.md](re-review-prompt.md)), adjudicate
residuals. No second fix wave.

*Derived from superpowers:requesting-code-review's code-reviewer.md (MIT,
© 2025 Jesse Vincent), adapted to lean-sdd's file-handover and ledger-triage
conventions.*
