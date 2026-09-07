# Usage findings — 2026-09-07

Produced by `soltero-skills:token-economy`, audit mode. Command run:

```
node /private/tmp/eval-skills/token-economy/scripts/token-audit.mjs --home /private/tmp/run-08-home --top 10 --json /private/tmp/run-08-home/audit.json
```

Root: `/private/tmp/run-08-home/.claude/projects` — 47 transcript files, 47
main-thread sessions with ≥1 assistant turn, one project (`acme`). Cache TTL assumed 60 min
(the script's default). Full machine-generated report: `audit-report.md` in this same
directory; raw numbers: `audit.json`.

## Totals (from the audit)

| Metric | Value |
|---|---|
| Assistant turns | 930 |
| Uncached input (input + cache_creation) | 8,409,400 |
| Cache reads | 656,075,600 |
| Cache hit ratio | 98.7% |
| Output tokens | 610,000 |
| Uncached input per turn | 9,042 |

## Levers, ranked by uncached input (verbatim from the script)

| # | Lever | Uncached tokens | Share | Evidence |
|---|---|---|---|---|
| 1 | HEADLESS_SESSIONS | 4,272,000 | 50.8% | 40 sessions with a non-interactive entrypoint (sdk-py: 40); models: claude-opus-4-7: 40; first prompt: "Review this change for security vulnerabilities. Changed files (you may Read these and any other file in the repo): -" |
| 2 | CACHE_TTL_BREAKS | 998,260 | 11.9% | 1 gap longer than 60 min inside a session; it re-wrote the whole context cold on return |
| 3 | COMPACTIONS | 300,160 | 3.6% | 2 compaction events in 1 session; the turn after each rebuilt context from a lossy summary |
| 4 | UNPINNED_DISPATCHES | n/a (not costed here) | — | 18 of 30 Agent dispatches carry no model (they inherit the orchestrator's tier); subagent spend is billed in the subagent's own transcript, not counted here |
| 5 | WHOLE_FILE_READS | n/a (not costed here) | — | 151 whole-file Read calls vs 0 ranged; 666,000 bytes of Read results and 111,300 bytes of Bash output landed in the main context |

## What each lever is, in this account

**1. HEADLESS_SESSIONS — 50.8% of uncached input, the largest lever.**
40 sessions (`review-0001` … `review-0040` in `.claude/projects/-Users-alex-Desktop-Code-acme/`)
all share the same shape: `entrypoint: "sdk-py"`, model `claude-opus-4-7`, and an identical
first prompt — "Review this change for security vulnerabilities. Changed files (you may Read
these and any other file in the repo): — src/billing/invoice.ts" (per-session, one changed
file each). Each session reads the changed file cold, costs ~106,800 uncached tokens (72,000
cache-creation + 18,000 input on the first turn alone) at an 85.5% hit ratio, and never appears
in any interactive chat transcript — it is a separate, non-interactive SDK session per file
change. This matches the skill's description of "a plugin hook spawning a cold-context review
session on every edit." I found no `hooks` entry in `settings.json` before this run (it was
empty of hooks) and no plugin source under this `.claude` directory, so I cannot name the exact
plugin or trigger (likely a git hook or CI step invoking the Claude Agent SDK directly, outside
Claude Code's own hook mechanism, since `sdk-py` is a non-Code entrypoint). Per the skill's hard
rule 5, I have not touched anything here — this is reported, not fixed. **You (Alex) need to
find where these 40 `sdk-py` calls are launched from** (a git pre-commit/pre-push hook, a CI
job, or a separate automation script) and decide whether it should fire on every changed file,
batch changes, or use a cheaper model — that source is outside this `.claude` directory and
outside what `economy-setup.mjs` can touch.

**2. CACHE_TTL_BREAKS — 11.9%.**
One gap inside session `orch-0001` — a 16-hour, 400-turn session — was longer than the 60-minute
cache TTL. That single return re-wrote the whole context cold, costing 998,260 uncached tokens
(vs ~4,945/turn for the rest of that session — see below). Fix per the protocol: refresh
`HANDOFF.md` and `/clear` before a break that long, then resume from the handoff instead of
resuming the live session cold.

**3. COMPACTIONS — 3.6%.**
Session `compact-0001` (150 turns) ran 2 compaction events, each rebuilding context from a lossy
summary at cache-write price — 300,160 uncached tokens combined. 1 compaction in the other 46
sessions combined (0). Fix: handoff + `/clear` instead of `/compact`.

**4. UNPINNED_DISPATCHES — 18 of 30 (count only, not costed here).**
All 18 unpinned `Agent` dispatches are inside `orch-0001`; the other 12 dispatches (8 `opus`, 4
`haiku`) are pinned. An unpinned dispatch inherits the orchestrator's own model
(`opus[1m]`) — expensive if the delegated task was grunt work or reading. Per the audit script's
own scope note, the actual token cost of those 18 dispatches lives in their own subagent
transcripts, not in this count.

**5. WHOLE_FILE_READS — 151 whole-file reads, 0 ranged reads (count only).**
Every `Read` call across all 47 sessions used a full-file read; none used `offset`/`limit`. That
put 666,000 bytes of Read output and 111,300 bytes of Bash output directly into context across
the account. Not independently costed by the script (it's folded into each session's uncached
total already), but it is a systemic pattern worth naming.

## Are the long sessions the problem? No.

The audit buckets sessions by peak context:

| Bucket | Sessions | Uncached/turn | Cache read/turn | Hit ratio | TTL breaks | Handoff sessions |
|---|---|---|---|---|---|---|
| peak ctx ≥ 200K | 2 | 7,190 | 1,143,937 | 99.4% | 1 | 1 |
| peak ctx < 200K, ≥10 turns | 5 | 3,050 | 28,500 | 90.3% | 0 | 0 |

The two long sessions (`orch-0001`, 400 turns, 16 hours; `compact-0001`, 150 turns) have a
*better* hit ratio than the short ones (99.4% vs 90.3%) — that's what a healthy long session
looks like. Their raw uncached/turn (7,190) is higher than short sessions' (3,050), but almost
all of that gap is the two levers already counted above, not session length itself:

- `orch-0001`: 2,976,400 uncached / 400 turns = 7,441/turn raw. Subtract its one TTL-break
  cost (998,260): (2,976,400 − 998,260) / 400 ≈ **4,945/turn**.
- `compact-0001`: 978,000 uncached / 150 turns = 6,520/turn raw. Subtract its compaction cost
  (300,160): (978,000 − 300,160) / 150 ≈ **4,519/turn**.

So once the break and the compactions are backed out — which the lever table already charges
separately — the residual per-turn cost of the long sessions (~4,500–4,950) is in the same
neighborhood as the short sessions (3,050), and the remaining gap is plausibly the embedded
`Agent` dispatch reports flowing through `orch-0001`'s own context (30 dispatches, none of
which the short sessions carry) — exactly what "workers read, the orchestrator decides" expects
to see, not a defect. **Splitting `orch-0001` into shorter sessions would not have avoided
either cost that actually hit it (the break, the unpinned dispatches) and would have thrown away
its 99.4%-hit-ratio cache advantage on every restart.** The fix for this account is handoff
+ `/clear` at the TTL boundary and pinning dispatches — not shorter sessions.

## Model note

`settings.json` has `"model": "opus[1m]"` going in and coming out — untouched, per the user's
explicit instruction and the skill's hard rule that the main model is never this skill's call.

## Conflicts

`conflicts()` check in `economy-setup.mjs` found zero contradicting lines in `CLAUDE.md`
outside the token-economy block, before or after the edit (see setup output below).
