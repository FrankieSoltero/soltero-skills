# Brief — cron-wrapper

## Objective
Analyze the nightly.sh cron wrapper to understand exactly what it does: how it invokes reconcile(), what data is passed to it (currently an empty array []), where invoices should come from but don't, and whether the empty-array call is intentional or a bug. Check for environment variables, configuration, or data sources that should be feeding invoices into the job. Determine if this empty-array behavior is correct or if reconcile is supposed to fetch its own data.

## Inputs
- bin/nightly.sh — the cron wrapper script
- var/log/reconcile.log — the output pattern (shows consistent drift despite empty input)

## Tools
Read, Bash, Grep

## Model
haiku

## Return schema
Reply with ONLY this structure:
- Status: DONE | BLOCKED | NEEDS_CONTEXT
- Cron definition: <the schedule line from nightly.sh>
- Reconcile invocation: <exact Node command being run; what arguments are passed>
- Input data: <currently [] — is this intentional? Should invoices be loaded from somewhere?>
- Environment: <any env vars, TZ setting, path setup that matters>
- Log output: <what does reconcile() return when called with []? Does it log anything?>
- Data source question: <where should invoices come from? Database? API? Config file? Not found yet.>
- Evidence: <grep/cat results showing cron and bash code; any attempt to find invoice sources>
- Root cause: <one line, only if this appears to be the source of drift or if data is missing>

## Validation conditions
- The exact cron schedule must be quoted
- The exact Node command must be shown, with arguments
- Any assumptions about where invoices come from must be stated explicitly
- If empty array is intentional, that must be confirmed; if not, the gap must be named

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question, or a promise about work you have not done, do that work now instead.

Every claim in your return traces to a tool result from this session. Never write the success line before the command has run.
