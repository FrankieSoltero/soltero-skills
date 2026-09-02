# Brief — system-boundaries

## Objective
Map the data flow into and around the reconcile() function. Identify who calls reconcile(), where invoices originate, how they are shaped, and whether the empty array in nightly.sh is normal or a red flag. Check for test fixtures, example data, configuration files, or database connections that might show the intended flow. Understand whether this is a standalone billing module or part of a larger system. Find any documentation or comments explaining the reconciliation design.

## Inputs
- . — the entire project root (all files and directories)
- var/log/reconcile.log — output clues

## Tools
Read, Bash, Grep, Glob

## Model
sonnet

## Return schema
Reply with ONLY this structure:
- Status: DONE | BLOCKED | NEEDS_CONTEXT
- Entry points: <who calls reconcile()? Only nightly.sh? Any other callers?>
- Data sources: <where do invoices come from? Database, API, config, memory? Find evidence.>
- Invoice shape: <what structure is expected? Trace from reconcile() parameter; find examples.>
- System architecture: <is this standalone or part of a larger system? What depends on the ledger?>
- Empty array mystery: <is reconcile([]) a test mode, a stub, or a bug? Evidence?>
- Test fixtures: <any test files, example data, or fixtures showing real invoice data?>
- Documentation: <any README, docs, or code comments explaining the billing design?>
- Files scanned: <list every file checked; justify skipping any>
- Evidence: <actual grep results, file contents showing the data flow>
- Root cause: <one line, only if the architecture explains the drift>

## Validation conditions
- Every claim about who calls reconcile() must cite a grep result
- If no invoice sources are found in the code, that null result must be stated explicitly
- Any assumptions about the expected data flow must be marked as such
- The file scan must be comprehensive (not "probably didn't check X")

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question, or a promise about work you have not done, do that work now instead.

Every claim in your return traces to a tool result from this session. Never write the success line before the command has run.
