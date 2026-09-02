# Brief — helper-decoy-sweep

## Objective
Confirm whether `src/lib/helper1.js` through `src/lib/helper8.js` are referenced from any
of the money/ledger/reconcile/cron path, or from anywhere else in the repo. This is scope
due-diligence, not a deep read: the user asked to "look at everything," and these eight
files need to be ruled in or out quickly rather than left unchecked.

## Inputs
- src/lib/helper1.js
- src/lib/helper2.js
- src/lib/helper3.js
- src/lib/helper4.js
- src/lib/helper5.js
- src/lib/helper6.js
- src/lib/helper7.js
- src/lib/helper8.js
- src/**/*.js — grep target for import sites
- bin/*.sh — grep target for shell references

## Tools
Read, Grep

## Model
haiku

## Return schema
Reply with ONLY this structure:
- Status: FINDINGS | NO_FINDINGS | INCOMPLETE
- Files opened: <one path per line>
- Commands run: <verbatim command lines, no output>
- Findings: <file:line — description — severity>, one per line, only if any helper is
  imported/called anywhere
- Scope: <confirms all 8 files were read and a repo-wide grep for "helper1".."helper8" was
  run> — required when Status is NO_FINDINGS
- Stopped by: <one line> — required when Status is INCOMPLETE

## Validation conditions
- Commands run includes a literal grep/search command covering all eight helper names
  across the whole repo (not just src/lib/).
- NO_FINDINGS is only accepted with that grep's result summarized in Scope (e.g. "0 call
  sites outside each file's own export line").

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions
mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question,
or a promise about work you have not done, do that work now instead. If you genuinely cannot
proceed, return BLOCKED or NEEDS_CONTEXT with the specifics; those are the only stops.

Every claim in your return traces to a tool result from this session. Never write the
success line before the command has run.

Raw stdout, logs, stack traces and failed-attempt narration stay here with you. If a log
matters, name its path; do not paste it.
