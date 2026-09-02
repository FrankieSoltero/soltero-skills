# Brief — reconcile-orchestration

## Objective
Trace how `src/jobs/reconcile.js` uses its `invoices` argument, how it computes the
`drift` value it returns, and — critically — whether that computed drift is ever posted
back to the ledger, corrected, or alerted on anywhere, or whether it is only returned and
logged. "Done" means an explicit statement of what happens to `drift` after it is computed,
with file:line evidence.

## Inputs
- src/jobs/reconcile.js — the whole function
- src/ledger/write.js — post()/balance(), to check whether reconcile ever calls post()
  again after computing drift
- bin/nightly.sh — how reconcile() is invoked and what happens to its return value

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
- States explicitly whether `drift` is ever written back to the ledger (a `post()` call
  with the drift amount) anywhere in the three input files, citing file:line either way.
- States explicitly what argument `bin/nightly.sh` actually passes to `reconcile()` today,
  citing the exact line.
- NO_FINDINGS is only valid if both of the above were checked and are unremarkable.

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions
mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question,
or a promise about work you have not done, do that work now instead. If you genuinely cannot
proceed, return BLOCKED or NEEDS_CONTEXT with the specifics; those are the only stops.

Every claim in your return traces to a tool result from this session. Never write the
success line before the command has run.

Raw stdout, logs, stack traces and failed-attempt narration stay here with you. If a log
matters, name its path; do not paste it.
