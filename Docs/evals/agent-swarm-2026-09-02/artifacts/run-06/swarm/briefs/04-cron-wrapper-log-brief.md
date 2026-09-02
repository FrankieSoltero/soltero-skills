# Brief — cron-wrapper-log

## Objective
Determine whether `bin/nightly.sh`'s current invocation of `reconcile()` is consistent
with the lines actually recorded in `var/log/reconcile.log`. Specifically: state what
`bin/nightly.sh` would write to the log if run today (exact output shape, not
paraphrased), compare it line-for-line against what `var/log/reconcile.log` actually
contains, and flag any mismatch as a first-class finding — do not fold it into a footnote.
This thread exists because a mismatch here would mean the repo's current `reconcile.js` may
not be the code that produced the existing log, which would invalidate conclusions drawn
from the other threads about "the" root cause.

## Inputs
- bin/nightly.sh — the full script
- var/log/reconcile.log — all lines
- src/jobs/reconcile.js — return shape of reconcile()

## Tools
Read, Grep, Bash

## Model
sonnet

## Return schema
Reply with ONLY this structure:
- Status: FINDINGS | NO_FINDINGS | INCOMPLETE
- Files opened: <one path per line>
- Commands run: <verbatim command lines, no output>
- Findings: <file:line — description — severity>, one per line
- Scope: <what was exercised> — required when Status is NO_FINDINGS
- Stopped by: <one line> — required when Status is INCOMPLETE

## Validation conditions
- Explicitly states whether `JSON.stringify(reconcile([]))`, appended by
  bin/nightly.sh:3, would produce text matching the format of the lines in
  var/log/reconcile.log (e.g. `reconcile drift=2 cents balance=104233.17`). Cite both the
  script line and at least one log line by content.
- If a mismatch is found (format, argument, or value), it is reported as Status: FINDINGS
  with severity at least "high", not NO_FINDINGS with a caveat.
- Does not attempt to explain the mismatch by inventing an external formatter or deploy
  step that isn't visible in this repo — states the discrepancy and marks it as requiring
  confirmation of what is actually deployed, which this repo checkout cannot answer.

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions
mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question,
or a promise about work you have not done, do that work now instead. If you genuinely cannot
proceed, return BLOCKED or NEEDS_CONTEXT with the specifics; those are the only stops.

Every claim in your return traces to a tool result from this session. Never write the
success line before the command has run.

Raw stdout, logs, stack traces and failed-attempt narration stay here with you. If a log
matters, name its path; do not paste it.
