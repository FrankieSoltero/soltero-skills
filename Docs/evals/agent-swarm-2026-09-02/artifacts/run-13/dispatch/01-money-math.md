# Brief — money-math

## Objective
Analyze all rounding and truncation operations in money.js to identify where fractional cents are lost or incorrectly handled. Find which functions drop precision, calculate what remainder is lost in each operation (e.g., what does split(457, 3) actually return, and how much is lost?), and trace whether these lost cents accumulate over invoices. Determine if this is the source of the daily drift.

## Inputs
- src/lib/money.js — all rounding functions (toCents, fromCents, applyRate, split)
- var/log/reconcile.log — the pattern to match against

## Tools
Read, Bash

## Model
haiku

## Return schema
Reply with ONLY this structure:
- Status: DONE | BLOCKED | NEEDS_CONTEXT
- Functions analyzed: <list each function from money.js>
- Precision losses found: <for each function: name, input examples, what is lost, magnitude in cents>
- Hypothesis: <Is the split() function the culprit? Does applyRate lose cents? Quantify.>
- Evidence: <actual bash command showing concrete input/output pairs that demonstrate the loss>
- Root cause: <one line maximum, if not DONE>

## Validation conditions
- Each function must have been tested with concrete examples showing input and actual output
- Any claim of precision loss must be demonstrated with a calculation showing the lost cents
- The hypothesis must be testable against the log pattern (does the math match the observed 2-3-4-1 cent cycle?)

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question, or a promise about work you have not done, do that work now instead.

Every claim in your return traces to a tool result from this session. Never write the success line before the command has run.
