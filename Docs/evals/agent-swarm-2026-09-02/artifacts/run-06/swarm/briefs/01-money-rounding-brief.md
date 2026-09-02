# Brief — money-rounding

## Objective
Determine whether the arithmetic in `src/lib/money.js` can produce a systematic
per-invoice discrepancy of one or a few cents, distinct from any bug in the caller.
"Done" means: either a specific function and line is named as capable of dropping or
manufacturing cents on realistic inputs (with the input pattern that triggers it stated
explicitly), or a reasoned NO_FINDINGS with every function in the file exercised.

## Inputs
- src/lib/money.js — all four exported functions (toCents, fromCents, applyRate, split)
- src/jobs/reconcile.js:1-11 — the only current caller; shows how split()'s output is
  consumed and how "drift" is computed from it

## Tools
Read, Grep, Bash

## Model
sonnet

## Return schema
Reply with ONLY this structure:
- Status: FINDINGS | NO_FINDINGS | INCOMPLETE
- Files opened: <one path per line>
- Commands run: <verbatim command lines, no output>
- Findings: <file:line — description of the exact mechanism and an example input that
  triggers it — severity>, one per line, when Status is FINDINGS
- Scope: <functions/lines actually exercised> — required when Status is NO_FINDINGS
- Stopped by: <one line> — required when Status is INCOMPLETE

## Validation conditions
- Every finding names an exact file:line in src/lib/money.js or src/jobs/reconcile.js.
- A FINDINGS status states the concrete input pattern (e.g. specific cents/parts values)
  that reproduces the discrepancy, not just "rounding can be lossy" in the abstract.
- NO_FINDINGS is only accepted if Scope shows all four functions were read and reasoned
  about, including how split()'s return value is summed by callers.

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions
mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question,
or a promise about work you have not done, do that work now instead. If you genuinely cannot
proceed, return BLOCKED or NEEDS_CONTEXT with the specifics; those are the only stops.

Every claim in your return traces to a tool result from this session. Never write the
success line before the command has run.

Raw stdout, logs, stack traces and failed-attempt narration stay here with you. If a log
matters, name its path; do not paste it.
