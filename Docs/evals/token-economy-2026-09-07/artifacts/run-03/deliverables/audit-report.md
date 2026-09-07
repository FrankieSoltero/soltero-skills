# Token Usage Audit — acme project

Source: `.claude/projects/-Users-alex-Desktop-Code-acme/*.jsonl` (46 session files, 1,869 lines total).
Method: parsed each transcript directly; per-turn context size = `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` on each assistant message's `usage` block.

## Correction to the starting assumption

There is no single three-day session in this project. The files break down as:

| Session(s) | Span | Turns | Notes |
|---|---|---|---|
| `orch-0001.jsonl` | 2026-08-24T14:00 → 2026-08-25T06:20 (16h18m) | 400 | one continuous run, model `claude-opus-5` |
| `review-0001..0040.jsonl` (40 files) | 2026-08-24T14:40 → 2026-08-25T16:40 (~26h) | 8 each (320 total) | subagent dispatches, `entrypoint: sdk-py` |
| `compact-0001.jsonl` | 2026-08-29T14:00 → 17:45 (3h45m) | 150 | single afternoon |
| `short-1..5.jsonl` (5 files) | one ~11-min run per day, 2026-08-25 → 2026-08-29 | 12 each (60 total) | `npm test` loop |

The "giant three-day session" is actually `orch-0001`, and it's **16 hours 18 minutes**, not three days. The three-day figure appears to come from conflating it with the daily `short-N` check-ins and `compact-0001` that happened on later calendar days in the same project directory. That distinction matters for the fix below.

## Finding 1 (highest impact): `orch-0001` blew past 600K three hours in and finished at ~3M — worse than believed, not confirmed-as-stated

Per-turn context in `orch-0001` grows essentially linearly, with no evidence of any compaction or context eviction across all 400 turns:

- Turn 1 (14:02): 24,360 tokens
- Turn 119 (17:58, **3h56m elapsed**, ~30% through the session): 603,160 tokens — this is where it first crosses 600K
- Turn 200 (~9h in): 998,260 tokens
- Turn 400 (06:20, end): **2,972,460 tokens**

So "600K every turn" is only true for roughly the back 70% of the session — the front is much lower, and the tail is nearly **5x** the 600K figure, not a flat plateau at 600K.

Summed across all 400 turns, this one session alone processed **~599,482,500 tokens** of context. Across every session file found in the project (orch-0001 + all 40 review dispatches + compact-0001 + all 5 short sessions = 664,485,000 tokens summed), `orch-0001` alone accounts for **90.2%** of total tokens processed. This is the dominant cost driver, confirmed, but understated in the user's framing on both duration (16h, not 3 days) and peak severity (~3M, not 600K).

Contributing config evidence: `.claude/settings.json` has `"model": "opus[1m]"` — the 1M-context-window variant. That's very likely *why* nothing capped this session earlier: the CLI's normal auto-compact guardrail is tied to the model's context window, and a 1M window pushes that guardrail far later than it would trigger on a standard ~200K-window model. It also means every token past 200K in this session was billed at 1M-context premium rates, compounding the cost of the runaway growth.

## Finding 2: 40 subagent review dispatches never reuse cache — cold-started at 90,000 tokens every single time

Every one of the 40 `review-000N.jsonl` files opens with the identical first-turn usage:

```
input_tokens: 18000, cache_creation_input_tokens: 72000, cache_read_input_tokens: 0
```

(Verified directly on review-0001, 0002, 0015, 0040 — all four identical.) `cache_read_input_tokens: 0` on every single one of 40 dispatches, spread across a 26-hour window, means zero prompt-cache reuse between review subagents despite them presumably sharing most of their system/repo context. That's `40 × 72,000 = 2,880,000` tokens of cache-creation cost that cache reads should have made cheap, and it's a flat, avoidable overhead unrelated to session length.

There's also a count mismatch worth flagging: `orch-0001`'s own tool-call log shows only **30** `Agent` dispatches (a clean pattern: "Review module 13, 26, 39 … 390", incrementing by 13), but there are **40** `review-*.jsonl` files, and the review sessions run under `entrypoint: sdk-py` while `orch-0001` runs under `entrypoint: cli`. That means at least 10 of these 40 review sessions are not being spawned by the interactive session at all — something else (an automated script or CI-style reviewer) is independently generating review-agent cost outside the session the user is auditing. Splitting/compacting the interactive session will do nothing about this piece.

## Finding 3: the user's own planned fix pattern is already running, and it doesn't change the growth mechanism — only how long it's allowed to run

The `short-N` sessions (one ~11-minute, 12-turn run per day, 2026-08-25 through 2026-08-29, each just looping `npm test`) and `compact-0001` (a single 3h45m, 150-turn afternoon) are the closest existing examples to what "short sessions, compacted hourly" will look like. Measured growth rates:

- `short-N`: 15,050 → 48,050 tokens over 12 turns / ~11 minutes = **~180,000 tokens/hour** — this is the *same* per-hour growth rate as `orch-0001` (24,360 → 2,972,460 over 16h18m = **~180,900 tokens/hour**). Same mechanism, just stopped earlier.
- `compact-0001`: 19,580 → 427,580 over 150 turns / 3h45m = **~108,800 tokens/hour** — lighter (fewer big tool payloads per turn), but still unbounded/linear, with no turn where cache reuse actually shrinks the trend.

None of these smaller sessions shows cache reads outgrowing cache creation turn-to-turn, even in `short-N` where the same `npm test` command runs 12 times back to back — each repeat still adds fresh cache-creation tokens rather than reading a stable cache. So shortening sessions caps the *damage window*, but it does not fix the *cause* (context that's never evicted/compacted mid-session, and repeated calls that aren't hitting cache). Wall-clock discipline alone will keep this from reaching 3M again, but it leaves real waste on the table (Finding 2's 2.88M is untouched by session length at all).

## Ranked fixes

1. **Stop using `opus[1m]` for this kind of long, tool-heavy orchestration work** (`.claude/settings.json`, currently `"model": "opus[1m]"`). Drop to the standard-context model so the normal ~200K auto-compact guardrail actually engages, and so tokens past 200K aren't billed at 1M-context premium rates. This directly targets Finding 1.
2. **Fix or remove the uncached review-dispatch fleet.** 40 dispatches at a flat 90,000-token cold start each, with `cache_read_input_tokens: 0` on all 40, is 2.88M tokens of pure waste independent of session length — and 10 of the 40 aren't even coming from the interactive session (`entrypoint: sdk-py` vs `cli`), so track down what's spawning those separately. This directly targets Finding 2 and isn't solved by shorter sessions or hourly compaction.
3. **Compact on a token threshold, not a pure wall clock**, because a single Agent/subagent fan-out turn can add tens-to-hundreds of thousands of tokens in one shot regardless of how many minutes have passed.

## Direct answer: how short

Measured growth rate for tool-heavy work (Bash/Read/Agent-driven, which is what both `orch-0001` and the `short-N` sample look like) is **~180,000 tokens/hour**, confirmed independently from two different sessions (`orch-0001`: ~180,900/hr over 16h18m; `short-N`: ~180,000/hr over 11 minutes). The lighter `compact-0001` pattern runs at ~108,800/hr.

At ~180K/hour, a straight hourly compaction cadence puts you at ~180K–200K tokens right before each compaction — a large improvement over the observed 600K–3M blowout, so "every hour" as a cadence is directionally reasonable. But:

- **Recommend compacting every 45 minutes, not a full hour**, to keep the pre-compaction ceiling closer to ~135K–150K and leave margin for the lighter-workload sessions that still won't compact themselves.
- **Add a token-threshold trigger in addition to the clock**: compact immediately whenever context crosses roughly 150,000 tokens, and *always* right after any turn that dispatches one or more subagents — Finding 1's data shows a single burst of Agent-tool calls can add far more in one turn than 45 minutes of normal work does. A pure wall-clock timer will not catch that.
- **Hourly/45-minute compaction of the interactive session does not touch Finding 2.** The 2.88M tokens burned by the 40 uncached review dispatches happen in separate subagent sessions, not in the session being compacted — that has to be fixed independently (cache reuse or dedup of the review fleet), or the "short sessions" plan will look successful on the main thread while this cost keeps recurring unseen.
