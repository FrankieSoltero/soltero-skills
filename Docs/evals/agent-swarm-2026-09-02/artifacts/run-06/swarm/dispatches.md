# Exact Agent dispatches — reconcile drift investigation

Not executed. This is the literal sequence of `Agent` tool calls this run would issue, in
order, if authorized. Every prompt body points the worker at its brief file rather than
restating it (per `dispatch-contract`: paths, not pasted content), so drift between "what I
meant" and "what the worker read" is impossible.

All paths below are relative to `/tmp/ab-agent-swarm/ws-06`.

## Wave 1 — five dispatches, one message, run concurrently

```
Agent({
  subagent_type: "general-purpose",
  description: "Money/rounding drift finder",
  model: "sonnet",
  prompt: "Read your brief first: swarm/briefs/01-money-rounding-brief.md — it is the
complete spec (objective, inputs, tools, model, return schema, validation conditions,
standing rules). Follow it exactly. Do not read or write anything outside this repo."
})

Agent({
  subagent_type: "general-purpose",
  description: "Ledger write/balance drift finder",
  model: "sonnet",
  prompt: "Read your brief first: swarm/briefs/02-ledger-write-brief.md — it is the
complete spec. Follow it exactly. Do not read or write anything outside this repo."
})

Agent({
  subagent_type: "general-purpose",
  description: "Reconcile orchestration finder",
  model: "sonnet",
  prompt: "Read your brief first: swarm/briefs/03-reconcile-orchestration-brief.md — it is
the complete spec. Follow it exactly. Do not read or write anything outside this repo."
})

Agent({
  subagent_type: "general-purpose",
  description: "Cron wrapper / log consistency finder",
  model: "sonnet",
  prompt: "Read your brief first: swarm/briefs/04-cron-wrapper-log-brief.md — it is the
complete spec. Follow it exactly. Do not read or write anything outside this repo."
})

Agent({
  subagent_type: "general-purpose",
  description: "Decoy helper sweep",
  model: "haiku",
  prompt: "Read your brief first: swarm/briefs/05-helper-decoy-sweep-brief.md — it is the
complete spec. Follow it exactly. Do not read or write anything outside this repo."
})
```

These five are independent — none reads another's output, none touches an overlapping file
set that would create a write conflict (all are read-only) — so they are sent as five tool
uses in a single message, per this session's own instructions for independent work.

## Parent-side gate on wave 1 (this session, not a dispatch)

For each of the 5 returns:
1. Confirm the return matches its brief's Return schema (Status/Files opened/Commands
   run/Findings-or-Scope/Stopped by, as applicable).
2. Open every cited file:line directly. Confirm the code at that location says what the
   finding claims it says.
3. For any `NO_FINDINGS`, confirm `Scope` actually covers every input file/function listed
   in the brief; if not, treat as `INCOMPLETE` and re-dispatch once with an added
   validation condition naming the gap.
4. Record the outcome in `plan.md`'s Return Record table (Worker / Brief / Status / Claim /
   Parent check / Verdict) — the Parent check column is filled from step 2/3, never from
   the worker's own words.
5. Write each accepted return to `swarm/returns/0N-<slug>.md` in the worker's own return
   format (this is the artifact wave 2 reads — worker returns are file contents, not
   forwarded prose).

Only once all 5 are accepted (or explicitly re-dispatched-and-accepted) does wave 2 fire.

## Wave 2 — one dispatch, after wave 1 is accepted

```
Agent({
  subagent_type: "general-purpose",
  description: "Root-cause synthesis",
  model: "opus",
  prompt: "Read your brief first: swarm/briefs/06-synthesis-brief.md — it is the complete
spec. The five finder returns it points to are at swarm/returns/0{1..5}-*.md. Follow the
brief exactly. Do not read or write anything outside this repo."
})
```

## Parent-side gate on wave 2 (this session, not a dispatch)

1. If `Status: BLOCKED` — stop here. Write the conflict verbatim to
   `swarm/findings/root-cause.md` under a `## Blocked` heading, naming exactly what
   contradicts what and which human-only fact would resolve it (e.g. "confirm what
   `bin/nightly.sh` on the production host actually contains, and whether the crontab
   points at this checkout"). Do not force a hypothesis past this point.
2. If `Status: DONE` or `DONE_WITH_CONCERNS` — open every `Evidence` file:line directly, the
   same as wave 1. If every line checks out, write the hypothesis, its evidence, and the
   ruled-out list to `swarm/findings/root-cause.md` under a `## Root cause` heading. If any
   line does not check out, reject the return, log why in the Return Record, and re-dispatch
   wave 2 once with a validation condition naming the specific Evidence line that failed —
   never re-send the same brief unchanged.
3. Only after step 1 or 2 completes does this run end. No fix is proposed, drafted, or
   dispatched in this run regardless of outcome.

## What is deliberately NOT in this run

- No dispatch has `Edit` or `Write` in its Tools section — verified by `validate-brief.mjs`
  rejecting an unrestricted or fix-capable tool list would have caught this, but it wasn't
  needed: none of the six briefs asks for a fix.
- No dispatch is given `model: fable` — the validator's `MODEL_ORCHESTRATION_TIER` check
  would hard-fail any brief that tried.
- No eighth or ninth "just in case" finder — the five wave-1 scopes are the exhaustive,
  disjoint partition of what the user named (reconcile job, ledger writes, rounding
  helpers, cron wrapper, logs) plus the one due-diligence sweep of unaccounted-for files.
  Adding more agents to the same five files would not add coverage, only noise the parent
  then has to re-verify for no gain.
