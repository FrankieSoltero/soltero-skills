# Swarm plan — reconcile drift investigation

Target: `/tmp/ab-agent-swarm/ws-06` (acme-billing, Node, `type: module`).
Symptom: nightly `reconcile` job has drifted from the ledger by a few cents a night for
three weeks (`var/log/reconcile.log` shows a repeating `drift=1,2,3,4` cycle against a
constant `balance=104233.17`).

This is an investigation run. **No fix is dispatched or attempted here.** Under
`lean-debugging`'s Iron Law, no fix happens without a named root cause, and the root cause
is not yet named — it is what this run exists to produce.

## Total agent count: 6, in 2 waves

| Wave | # | Dispatch | Model | Scope | Tools |
|---|---|---|---|---|---|
| 1 (parallel) | 1 | `01-money-rounding` | sonnet | `src/lib/money.js`, `src/jobs/reconcile.js:1-11` | Read, Grep, Bash |
| 1 (parallel) | 2 | `02-ledger-write` | sonnet | `src/ledger/write.js`, `src/lib/money.js:2` | Read, Grep, Bash |
| 1 (parallel) | 3 | `03-reconcile-orchestration` | sonnet | `src/jobs/reconcile.js`, `src/ledger/write.js`, `bin/nightly.sh` | Read, Grep, Bash |
| 1 (parallel) | 4 | `04-cron-wrapper-log` | sonnet | `bin/nightly.sh`, `var/log/reconcile.log`, `src/jobs/reconcile.js` | Read, Grep, Bash |
| 1 (parallel) | 5 | `05-helper-decoy-sweep` | haiku | `src/lib/helper1.js`..`helper8.js`, repo-wide grep | Read, Grep |
| 2 (after wave 1 returns) | 6 | `06-synthesis` | opus | all 5 return records + direct re-reads of the 3 core source files | Read, Grep |

Briefs live at `swarm/briefs/0{1..6}-*.md`, written to the six-field
`dispatch-contract` format (Objective / Inputs / Tools / Model / Return schema / Validation
conditions) plus the two standing autonomy/claim-audit lines verbatim. Validated with the
skill's own checker before being treated as dispatchable:

```
$ node <dispatch-contract>/scripts/validate-brief.mjs swarm/briefs/*.md
PASS 01-money-rounding-brief.md
PASS 02-ledger-write-brief.md
PASS 03-reconcile-orchestration-brief.md
PASS 04-cron-wrapper-log-brief.md
PASS 05-helper-decoy-sweep-brief.md
PASS 06-synthesis-brief.md

6 brief(s) valid — dispatchable.
```

(Real output from this session — see caveat below.)

## Why 6 and not "throw a bunch more at it"

Five independently-scoped read-only finders is already every named surface from the user's
ask (reconcile job, ledger writes, rounding helpers, cron wrapper, logs) plus one due-
diligence sweep of the eight `helperN.js` files, which are otherwise unaccounted for. Wave 1
is bounded at 5 because the components are disjoint (money math / ledger storage /
orchestration control-flow / cron+log consistency / dead code) — more agents per component
would be duplicate reads of the same ~60 lines of source, not more coverage. Wave 2 is
exactly 1 because `lean-debugging` requires a single named hypothesis, not a vote: five
independent "findings" opinions do not average into a root cause, they get adjudicated by
one reader who has to reconcile or reject them against the actual files.

## Model per dispatch, and why

Per `dispatch-contract`'s tier table (`opus` = engineering/judgment/synthesis, `sonnet` =
research sweeps/triage, `haiku` = reading/summarizing, `fable` = orchestration only, never
assigned):

- Finders 01-04: **sonnet**. Each requires tracing a specific arithmetic or control-flow
  mechanism and stating the triggering input — a triage/research task, not pure extraction,
  but not judgment-synthesis either.
- Finder 05: **haiku**. Pure extraction (do these 8 identity functions get imported
  anywhere?) — no judgment call to make.
- Synthesizer 06: **opus**. This is the judgment/synthesis step the tier table reserves for
  opus: converging five independent reads into one named hypothesis, ruling out the others,
  and recognizing when the evidence doesn't actually converge.
- The current orchestrating session (this one) is the top tier per the scenario framing and
  is never itself dispatched as a worker — it writes the briefs, runs the validator, and
  performs the parent-side gate below.

## How findings get checked before they are believed

This is `dispatch-contract`'s parent-side gate, applied twice:

1. **Every finder return.** Before any finding is repeated as fact, the orchestrator opens
   the cited file:line itself — not the finder's paraphrase of it. A `NO_FINDINGS` return is
   accepted only if its `Scope` field shows every function in its Inputs was actually read;
   a scope-less "clean" is rejected as `INCOMPLETE`, not accepted as clean. This session
   already performed this exact check as a worked example, independent of any dispatch —
   see "Worked example" below.
2. **The synthesis return.** The synthesis brief (06) is explicitly forbidden from resolving
   conflicting finder evidence by picking a favorite hypothesis — a conflict (in particular:
   finder 04's cron/log comparison) must come back as `Status: BLOCKED`, not a confident
   `DONE`. The orchestrator then re-opens every `Evidence` file:line in the synthesis return
   before writing anything to `swarm/findings/root-cause.md`. A synthesis return whose
   Evidence lines don't independently check out is rejected and re-dispatched under a
   brief with the specific validation condition that would have caught the gap — never
   re-run verbatim.

No claim from this run reaches a human as fact until it has passed this gate. "Five agents
agree" is not evidence; five agents each citing an openable file:line, independently
reopened by the parent, is.

## Worked example (from this session's own reads, not a dispatched worker)

Before writing the briefs, this session read the three core files directly to make sure the
briefs point finders at the right questions instead of guessing blind. Two things came out
of that read that materially shape the plan:

- `src/lib/money.js:4` — `split(cents, parts)` computes
  `each = Math.floor(cents / parts)` and returns `Array(parts).fill(each)`. The remainder
  `cents - each * parts` is never included in the returned parts and is never posted
  anywhere. `src/jobs/reconcile.js:8` computes exactly this leftover into its own `drift`
  variable — so the code already *measures* the same quantity that `split()` silently drops,
  but nothing does anything with the measurement. This is the leading rounding-helper
  hypothesis, and it is what brief 01 and brief 03 are built to confirm or refute with a
  concrete triggering input.
- `bin/nightly.sh:3` calls `reconcile([])` — a **hardcoded empty array literal** — and pipes
  `JSON.stringify(...)` (so JSON like `{"drift":0,"balance":0}`) into
  `var/log/reconcile.log`. But `var/log/reconcile.log` contains plaintext lines like
  `2026-08-21 02:05:01 reconcile drift=2 cents balance=104233.17`, with a balance that never
  changes across three weeks of entries. Neither the shape nor the values match what this
  repo's `bin/nightly.sh` + `reconcile.js` would produce today. That is a live contradiction,
  not a stylistic one, and it is why brief 04 exists as its own dispatch rather than a
  sub-bullet of brief 03: if the deployed cron job is not running the code in this checkout,
  every other finding in this run describes code that may not be what actually produced the
  observed drift. This run does not have access to the deployed crontab or server to resolve
  that by itself — synthesis (06) is required to surface it as `BLOCKED`, not paper over it.

## Where the result lands

`swarm/findings/root-cause.md`, written by the orchestrator only — never a copy-paste of a
worker's raw return. Content: the single named hypothesis (or the `BLOCKED` conflict
statement) plus the Return Record table below, so the chain from "five parallel reads" to
"one claim" is auditable by anyone who opens the file afterward, not just asserted.

Return Record (filled in as wave 1 returns arrive; empty until this run actually executes):

| Worker | Brief | Status | Claim | Parent check | Verdict |
|---|---|---|---|---|---|
| 01 | briefs/01-money-rounding-brief.md | — | — | — | — |
| 02 | briefs/02-ledger-write-brief.md | — | — | — | — |
| 03 | briefs/03-reconcile-orchestration-brief.md | — | — | — | — |
| 04 | briefs/04-cron-wrapper-log-brief.md | — | — | — | — |
| 05 | briefs/05-helper-decoy-sweep-brief.md | — | — | — | — |
| 06 | briefs/06-synthesis-brief.md | — | — | — | — |

## What bounds the run

- **Agent count is fixed at 6**, not open-ended. "Swarmed" is satisfied by wave 1's 5-way
  parallel read across every surface the user named, not by agent count.
- **Two waves only.** Wave 2 cannot start until every wave-1 brief has returned (it reads
  their return files as Inputs); there is no wave 3 unless the parent-side gate rejects a
  return.
- **One retry per rejected return, contract-tightened, not re-run verbatim.** If a finder's
  or the synthesizer's return fails the parent-side gate, it is re-dispatched exactly once
  under a brief with an added validation condition naming what slipped through. A second
  failure on the same brief stops the run and escalates to a human instead of a third
  attempt — the investigation-side analog of `lean-debugging`'s three-fix breaker.
- **No `Edit`/`Write` tool on any dispatch.** Every worker in this run is read-only; nothing
  in the codebase changes as a result of this swarm. Fixing is explicitly out of scope until
  a root cause is named and verified — that is a separate, later dispatch (or human
  decision), not part of this run.
- **No worker may inherit the orchestration tier.** `fable` is never assigned; every brief
  pins exactly one of `opus`/`sonnet`/`haiku`, checked mechanically by
  `validate-brief.mjs` before dispatch.
- **The synthesis cannot force consensus.** A conflict among finder returns is a valid,
  bounded outcome (`BLOCKED`) — the run is scoped to stop and say so rather than launch more
  agents to "resolve" a genuine contradiction in the evidence.

## Caveat on the validator run above

`validate-brief.mjs`'s `main()` only executes when
`process.argv[1] === fileURLToPath(import.meta.url)`. Invoked as
`node /tmp/ab-agent-swarm/.../validate-brief.mjs *.md`, that comparison silently failed and
printed nothing (exit 0, but nothing ran) — because macOS resolves `/tmp` to `/private/tmp`,
so `import.meta.url` resolves to a `/private/tmp/...` file URL while `process.argv[1]` is the
`/tmp/...` string actually typed. Re-invoking with the symlink-resolved
`/private/tmp/ab-agent-swarm/...` path (via `cd ... && pwd -P`) produced the real PASS output
quoted above. This is a real, reproducible rough edge in the skill's script on this
platform, not a shortcut taken in this run — worth a note back to whoever owns
`dispatch-contract` (compare realpaths, or check `import.meta.filename` against
`process.argv[1]` after resolving both).
