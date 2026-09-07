# Token-efficiency audit — acme project (user-scope home: /tmp/run-07-home)

Command run:

```
node /private/tmp/eval-skills/token-economy/scripts/token-audit.mjs \
  --home /private/tmp/run-07-home --top 10 \
  --json /private/tmp/run-07-home/audit.json
```

(Note: `/tmp` on this machine is a symlink to `/private/tmp`; the script's
`import.meta.url === file://${argv[1]}` self-check only matches when invoked through the
resolved `/private/tmp/...` path, so that's the path used for the real run — same script,
same transcripts.)

Full script output below, verbatim, is the source for every number in this report.

## Script output (verbatim)

```
# Token-efficiency audit — 2026-09-07

Root: /private/tmp/run-07-home/.claude/projects — 47 transcript files, 47 main-thread sessions with ≥1 assistant turn. Cache TTL assumed 60 min.

## Totals
| Metric | Value |
|---|---|
| Assistant turns | 930 |
| Uncached input (input + cache_creation) | 8,409,400 |
| Cache reads | 656,075,600 |
| Cache hit ratio | 98.7% |
| Output tokens | 610,000 |
| Uncached input per turn | 9,042 |
| Input-equivalent tokens (weights 1/1.25/0.1) | 75,866,560 |

## Levers, ranked by uncached input
| # | Lever | Uncached tokens | Share | Evidence |
|---|---|---|---|---|
| 1 | HEADLESS_SESSIONS | 4,272,000 | 50.8% | 40 sessions with a non-interactive entrypoint (sdk-py: 40); models: claude-opus-4-7: 40; first prompt: "Review this change for security vulnerabilities. Changed files (you may Read these and any other file in the repo): -" |
| 2 | CACHE_TTL_BREAKS | 998,260 | 11.9% | 1 gaps longer than 60 min inside a session; each re-wrote the whole context cold on return |
| 3 | COMPACTIONS | 300,160 | 3.6% | 2 compaction events in 1 sessions; the turn after each rebuilt context from a lossy summary |
| 4 | UNPINNED_DISPATCHES | n/a (not costed here) | — | 18 of 30 Agent dispatches carry no model (they inherit the orchestrator's tier); subagent spend is billed in the subagent transcript, not here |
| 5 | WHOLE_FILE_READS | n/a (not costed here) | — | 151 whole-file Read calls vs 0 ranged; 666,000 bytes of Read results and 111,300 bytes of Bash output landed in the main context |

- **HEADLESS_SESSIONS** — Find the hook or plugin that spawns them and decide whether every firing is worth a cold-context model call; pin it to a cheaper tier or fire it less often.
- **CACHE_TTL_BREAKS** — Before stepping away for longer than the cache TTL, refresh HANDOFF.md and /clear; resume from the handoff instead of re-priming the full context.
- **COMPACTIONS** — Replace compaction with handoff + /clear (agent-handoff at the ~40% reminder).
- **UNPINNED_DISPATCHES** — Pin every dispatch: opus for engineering, sonnet for grunt work, haiku for reading; never inherit.
- **WHOLE_FILE_READS** — Workers read, the orchestrator decides: ranged reads (sed -n, head, grep) in the main thread; a haiku reader for anything long.

## By main model
| Model | Sessions | Turns | Uncached in | Cache read | Hit ratio | Output | Median peak ctx |
|---|---|---|---|---|---|---|---|
| claude-opus-4-7 | 40 | 320 | 4,272,000 | 25,200,000 | 85.5% | 100,000 | 92,400 |
| claude-opus-5 | 7 | 610 | 4,137,400 | 630,875,600 | 99.3% | 510,000 | 48,050 |

## Long sessions vs short sessions
| Bucket | Sessions | Uncached/turn | Cache read/turn | Hit ratio | TTL breaks | Handoff sessions |
|---|---|---|---|---|---|---|
| peak ctx ≥ 200K | 2 | 7,190 | 1,143,937 | 99.4% | 1 | 1 |
| peak ctx < 200K, ≥10 turns | 5 | 3,050 | 28,500 | 90.3% | 0 | 0 |

Interactive sessions: 7; headless: 40; compactions: 2; HANDOFF.md writes: 3 in 1 sessions.

## Dispatches (Agent tool, main thread)
Total 30; background 0; median prompt 2,400 chars. Workflow calls: 0.
| model | count | share |
|---|---|---|
| inherit | 18 | 60.0% |
| opus | 8 | 26.7% |
| haiku | 4 | 13.3% |

## Tool mix (main thread)
| Tool | Calls | Share | Result bytes into context |
|---|---|---|---|
| Grep | 240 | 41.2% | 0 |
| Bash | 159 | 27.3% | 111,300 |
| Read | 151 | 25.9% | 666,000 |
| Agent | 30 | 5.1% | 54,000 |
| Write | 3 | 0.5% | 180 |

## Top 10 sessions by uncached input
| Session | Day | Project | Model | Entry | Turns | Uncached | Cache read | Hit | Peak ctx | TTL breaks | Compactions | Dispatches (unpinned) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| orch-0001 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-5 | cli | 400 | 2,976,400 | 596,506,100 | 99.5% | 2,972,460 | 1 | 0 | 30 (18) |
| compact-0001 | 2026-08-29 | Users-alex-Desktop-Code-acme | opus-5 | cli | 150 | 978,000 | 32,659,500 | 97.1% | 427,580 | 0 | 2 | 0 (0) |
| review-0001..0040 | 2026-08-24/25 | Users-alex-Desktop-Code-acme | opus-4-7 | sdk-py | 8 each | 106,800 each | 630,000 each | 85.5% | 92,400 | 0 | 0 | 0 (0) |
```

## Per-lever explanation, in this user's case

### #1 HEADLESS_SESSIONS — 4,272,000 uncached tokens, 50.8% of all audited spend

This is 40 separate transcripts (`review-0001` through `review-0040`), each 8 turns, each
opening with the identical prompt: *"Review this change for security vulnerabilities. Changed
files (you may Read these and any other file in the repo): -"*. Every one runs on
`claude-opus-4-7` with `entrypoint: "sdk-py"` — meaning it was started by the Python Claude
Agent SDK, not by anyone typing in the CLI (`cli` is the interactive entrypoint; `sdk-py` never
is). They land roughly every 40 minutes across 2026-08-24 14:40 → 2026-08-25 16:42, one per
changed file in `acme`.

I checked `/tmp/run-07-home/.claude/settings.json` for a `hooks` entry that would
explain the trigger — there is none (the file only sets `model`, `enabledPlugins`, and `theme`).
So this isn't a Claude Code `hooks` config firing; it's an external automation (a script, a
pre-commit/pre-push hook, or a CI job) invoking the SDK directly on every file change, cold,
with no session reuse: hit ratio 85.5% vs. 99%+ for the interactive sessions, and 0% cache
carryover between the 40 firings (each one pays full price again). Per Hard Rule 5, I have not
touched this — it isn't a Claude Code hook I have write access to, and the fix is the owner's
call. Cost per firing: 106,800 uncached tokens. Total: 40 × 106,800 = 4,272,000 — more than the
entire three-day session combined.

### #2 CACHE_TTL_BREAKS — 998,260 uncached tokens, 11.9%

This lever is not spread across many sessions — it is one event, inside `orch-0001` (the "giant"
session). Walking its per-turn usage: turn 198 ends at `2026-08-24T20:38:00Z`; turn 199 starts at
`2026-08-24T23:40:00Z` — a 3h02m gap, past the 60-minute cache TTL. At turn 199,
`cache_creation_input_tokens` jumps to 998,200 and `cache_read_input_tokens` drops to 0: the
entire context accumulated up to that point (~994K tokens worth) was rewritten at cache-write
price instead of read at cache-read price. That single re-prime is 33.5% of `orch-0001`'s own
total uncached spend (998,260 / 2,976,400).

### #3 COMPACTIONS — 300,160 uncached tokens, 3.6%

This is a *different* session: `compact-0001`, 2026-08-29, 150 turns, unrelated to `orch-0001`.
It has 2 `isCompactSummary` events, and each one is followed by a turn that re-primes context
from the lossy summary. Its uncached-per-turn (978,000 / 150 = 6,520) is already worse than
`orch-0001`'s steady-state (below), which is direct evidence against compacting on a schedule:
compaction is not a milder version of the long-session pattern, it is a repeatable tax every
time it fires.

### UNPINNED_DISPATCHES / WHOLE_FILE_READS — counts only, not costed here

18 of 30 `Agent` dispatches from the main thread carry no `model` (they inherit the
orchestrator's tier — `opus-5`, meaning 18 dispatches ran at opus price for work that may not
have needed it). 151 Read calls were whole-file with 0 ranged reads, landing 666,000 bytes of
Read output directly in the main context. Per the skill's script-report rule these are counts,
not tokens — the actual spend is in the subagent/tool-result transcripts, not summed here.

## Is the long session the problem? No — it is the second-cheapest thing in this audit per turn once its one break is set aside, and it is not three days long.

Facts against the user's framing, all from `orch-0001`'s own transcript:

- **Duration**: `start = 2026-08-24T14:00:00Z`, `end = 2026-08-25T06:20:01Z` → 16h20m01s, not
  three days.
- **"600K of context every single turn"**: uncached input per turn is 2,976,400 / 400 = 7,441 —
  three orders of magnitude below 600K. Total context (including cache reads) does climb turn
  by turn — from 24,360 at turn 0 to 2,972,460 at turn 399 — but cache reads are the cheap 0.1×
  tier; that's what a cache riding all the way through a long session looks like, not the cost.
- **Hit ratio**: 99.5% (596,506,100 cache-read / (596,506,100 + 2,976,400)) — the best hit ratio
  of any main-thread session in the audit.
- **Per-turn cost with the one break excluded**: (2,976,400 − 998,260) / 399 = 4,958 uncached
  tokens/turn. Compare to the already-short `short-1`…`short-5` sessions (12 turns each, cli,
  same acme project, different days): 36,600 / 12 = 3,050/turn. `orch-0001`'s steady-state is in
  the same order of magnitude as sessions the user would call "short" — length is not what made
  this session's per-turn cost what it is.
- **What actually cost money in this session**: one 3-hour gap (998,260 tokens, 33.5% of the
  session's own uncached total) — a cache-TTL break, not the session's length or turn count.

The three real levers, ranked: the headless security-review automation (50.8%, more than the
whole three-day session combined), the one cache-TTL break inside the long session (11.9%), and
the two compactions in the unrelated `compact-0001` session (3.6%). The long session's mere
existence is not one of the top three levers.
