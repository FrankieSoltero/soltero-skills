# Plan — README acme-cli@1 sweep

## Task
Find every README under `packages/*/README.md` (this repo has exactly 6, one per
package: api, cli, docs, sdk, web, worker) that still instructs installing via
`acme-cli@1` instead of the current `npx acme@2`, and hand back a fix-list.
One pass, bounded scope: only the 6 known README.md files, nothing else in the
tree, no recursion outside `packages/*/README.md`.

## Why Agent dispatches, not a Workflow script
This is a single ad-hoc sweep over a fixed, already-enumerated file set (6
files), not a recurring or resumable job. `run.mjs` (Workflow) earns its cost
when a script will be re-run, needs durable resume across a long multi-step
process, or drives non-agent steps (API calls, file mutation loops). None of
that applies here: enumeration is one `Glob`/`Bash` call the orchestrator can
do directly, each check is "does this string appear in this short file,"
and the whole thing fits in one parallel Agent fan-out plus one verification
pass. Went with `dispatches.md`.

## Total agent count
- 6 finder agents (one per package README), dispatched in parallel in a
  single message.
- 0–6 verifier agents, one per POSITIVE finding only (a package with zero
  hits needs no verifier — nothing to refute). Upper bound is 6 (every
  package could plausibly be positive), so worst case 12 agents total,
  best case (all packages already migrated) 6 agents total.
- No aggregator agent — aggregation is deterministic (collate verified
  findings into a table) and done by the orchestrator itself, not dispatched,
  because it requires no judgment, only transcription of already-verified
  facts.
- Enumeration of the 6 target files is also done by the orchestrator directly
  (`Glob packages/*/README.md`), not dispatched — spinning up an agent to run
  one glob is waste.

So: **6 to 12 agents**, orchestrator does enumeration + aggregation itself.

## Model per dispatch
Per the standing model-tier rule (dispatched work never inherits the
orchestrator's tier): this is pure reading/pattern-matching, not engineering,
so nothing here earns Opus, and nothing here is orchestration, so nothing
gets Fable.
- **Finder agents → haiku.** Each is handed exactly one file path and asked
  "does this file still tell the reader to install acme-cli@1, or has it
  already moved to npx acme@2 — quote the exact line and its line number."
  That's a read-and-classify task on a file under 10 lines; haiku is
  sufficient and keeps 6 parallel dispatches cheap.
- **Verifier agents → haiku**, using the `finding-skeptic` agent type
  (read-only, built to actively try to refute a finding, defaults to
  "refuted" on any doubt). The check is mechanical — "does this exact quoted
  line appear verbatim, at the claimed line number, in this exact file" — so
  it doesn't need more reasoning budget than the finder that produced the
  claim. Independence comes from being a fresh agent with adversarial intent
  and read-only tools, not from a bigger model.
- Orchestrator (this session) stays on its assigned top tier for
  enumeration, dispatch construction, disagreement handling, and
  aggregation — the only steps that need judgment.

## How findings get checked before they're believed
Two-layer check, following the project's verification discipline (a
subagent's report is a claim against the tree, not a fact — lean-verification;
severity-scaled independent re-check — audit-swarm):
1. Every finder claim must include a verbatim quoted line + line number, not
   just a yes/no. A bare "yes, it's outdated" with no quote is treated as
   unverifiable and auto-escalated to a verifier with instructions to read
   the whole file itself.
2. Every POSITIVE finding (old-install still present) gets one independent
   `finding-skeptic` pass: given only the file path and the finder's quoted
   claim, it re-reads the actual file and tries to refute the claim (wrong
   quote, wrong line number, file already fixed, string is inside a comment
   about *not* using the old command, etc.). This is a low-severity,
   mechanical, single-fact check (a docs staleness issue, not a
   security/compliance finding), so it gets **1 skeptic lens**, not
   audit-swarm's 3-lens majority vote reserved for high/critical findings.
3. NEGATIVE findings (finder says "already on npx acme@2") are spot-checked
   by the orchestrator directly rather than given a dedicated verifier agent:
   the orchestrator re-reads all 6 files itself before writing the final
   list (cheap — 6 short files) and cross-checks every finder verdict against
   that direct read. Any finder/orchestrator disagreement, on either a
   positive or a negative, blocks that package from the final list and gets
   flagged "needs manual check" instead of a guessed answer.
4. Any finder/verifier disagreement on a positive is NOT resolved by
   majority-of-two or by trusting either side — it's flagged
   "disagreement, needs manual read" in the output rather than silently
   picked one way.

## Where the result lands
`/tmp/ab-agent-swarm/ws-07/swarm/results.md` — a table with
one row per package: package name, file path, verdict (outdated / current /
disagreement), the quoted evidence line + line number for any "outdated"
row, and verification status (verified by skeptic / orchestrator spot-check
/ escalated). That table is the literal fix-list the user asked for.

## What bounds the run
- **Scope bound**: only `packages/*/README.md` in this working directory —
  no other files, no other directories, nothing outside
  `/tmp/ab-agent-swarm/ws-07`. Finder agents are given a
  single explicit file path each, not a directory to roam.
- **Fan-out bound**: exactly 6 finders (one per already-enumerated file, no
  dynamic re-fan-out if a finder claims to find "more" READMEs — that would
  be a scope violation, not a real finding, and gets flagged, not chased).
- **Verifier bound**: at most 1 verifier per positive finding, capped at 6 —
  no re-verification loops, no second skeptic if the first one refutes (a
  refutation triggers escalation to "needs manual check," not another
  skeptic round).
- **Pass bound**: one pass, per the user's explicit instruction ("Swarm it,
  one pass") — no retries beyond a single re-dispatch if an agent errors out
  or returns an unparseable report; a second failure on the same package is
  recorded as "needs manual check," not retried indefinitely.
- **Tool bound**: every dispatched agent is read-only (Explore for finders,
  finding-skeptic for verifiers) — nothing in the swarm can write, so the
  only write in the whole run is the orchestrator's own
  `swarm/results.md` at the end.
- **Model-cost bound**: haiku for every dispatch, 6–12 agents total, each
  reading one file under 10 lines — trivially bounded token cost regardless
  of package count staying small.
