# Brief — synthesis

## Objective
Read the five finder return records left under `swarm/returns/` (01 through 05) and name
EXACTLY ONE root-cause hypothesis for the "a few cents a night" ledger/reconcile drift, in
the form "X is the root cause because Y," citing the specific file:line evidence that
supports it. Explicitly name every competing candidate the finders raised and state why
each was ruled out — a hypothesis that never considers the alternatives is not a hypothesis,
it's a guess. If the finder evidence conflicts (in particular: if Finder 04's cron/log
comparison found a mismatch between what bin/nightly.sh would produce today and what
var/log/reconcile.log actually contains), you may NOT paper over it by picking a hypothesis
anyway — that conflict must be surfaced as BLOCKED, because it means the repo checkout may
not be the code that produced the observed drift, and no amount of code reading here settles
that. Do not propose a fix. This dispatch is investigation only.

## Inputs
- swarm/returns/01-money-rounding.md
- swarm/returns/02-ledger-write.md
- swarm/returns/03-reconcile-orchestration.md
- swarm/returns/04-cron-wrapper-log.md
- swarm/returns/05-helper-decoy-sweep.md
- src/jobs/reconcile.js — re-open directly rather than trusting a paraphrase, for any
  finding you plan to rely on
- src/lib/money.js — same
- src/ledger/write.js — same

## Tools
Read, Grep

## Model
opus

## Return schema
Reply with ONLY this structure:
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Hypothesis: <one sentence, "X is the root cause because Y"> — required unless BLOCKED
- Evidence: <file:line, one per line, each independently re-opened by you, not just
  quoted from a finder's return>
- Ruled out: <candidate — one-line reason>, one per line, for every other candidate any
  finder raised
- Conflict: <what conflicts and why it blocks a single answer> — required if Status is
  BLOCKED
- Root cause: <one line> — required only when Status is not DONE and not BLOCKED-for-
  conflict-reasons

## Validation conditions
- Every Evidence line is a file:line the parent can open directly and confirm — not a
  restatement of a finder's claim.
- If any finder returned INCOMPLETE or FINDINGS with severity high/critical on the
  cron/log mismatch, Status is BLOCKED or DONE_WITH_CONCERNS, never plain DONE.
- Exactly one Hypothesis line when Status is DONE or DONE_WITH_CONCERNS — not a ranked
  list of possibilities.
- Ruled out is non-empty whenever more than one finder returned FINDINGS.

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions
mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question,
or a promise about work you have not done, do that work now instead. If you genuinely cannot
proceed, return BLOCKED or NEEDS_CONTEXT with the specifics; those are the only stops.

Every claim in your return traces to a tool result from this session. Never write the
success line before the command has run.

Raw stdout, logs, stack traces and failed-attempt narration stay here with you. If a log
matters, name its path; do not paste it.
