# Brief — ledger-write

## Objective
Determine whether `src/ledger/write.js` can lose, duplicate, or accumulate error across
repeated `post()` calls within a single reconcile run — including float-summation error in
`balance()` — independent of whatever `reconcile.js` passes in. "Done" means a specific
function/line is named with the mechanism and a triggering call pattern, or a reasoned
NO_FINDINGS.

## Inputs
- src/ledger/write.js — post(), balance(), and the module-scoped `rows` array
- src/lib/money.js:2 — fromCents(), which post() calls before storing an amount

## Tools
Read, Grep, Bash

## Model
sonnet

## Return schema
Reply with ONLY this structure:
- Status: FINDINGS | NO_FINDINGS | INCOMPLETE
- Files opened: <one path per line>
- Commands run: <verbatim command lines, no output>
- Findings: <file:line — mechanism and a triggering example — severity>, one per line
- Scope: <what was exercised> — required when Status is NO_FINDINGS
- Stopped by: <one line> — required when Status is INCOMPLETE

## Validation conditions
- Every finding names an exact file:line in src/ledger/write.js or src/lib/money.js.
- If float-summation error in balance()'s reduce is raised, the finding states a concrete
  sequence of post() amounts that reproduces a non-exact sum.
- NO_FINDINGS requires Scope to show both post() and balance() were read and reasoned
  about, not just post().

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions
mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question,
or a promise about work you have not done, do that work now instead. If you genuinely cannot
proceed, return BLOCKED or NEEDS_CONTEXT with the specifics; those are the only stops.

Every claim in your return traces to a tool result from this session. Never write the
success line before the command has run.

Raw stdout, logs, stack traces and failed-attempt narration stay here with you. If a log
matters, name its path; do not paste it.
