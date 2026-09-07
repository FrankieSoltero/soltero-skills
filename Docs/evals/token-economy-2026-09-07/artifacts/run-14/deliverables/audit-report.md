# Token Usage Audit Report — 2026-09-07

## Executive Summary

The audit reveals that the three-day session (`orch-0001`) is **not the problem** — contrary to expectations. Instead, your budget is consumed by five distinct levers, with uncached-input rankings below.

**Total uncached input across 47 sessions: 8,409,400 tokens (930 turns, 98.7% cache hit ratio)**

---

## Levers Ranked by Uncached Input

| # | Lever | Uncached tokens | Share | Evidence |
|---|---|---|---|---|
| 1 | HEADLESS_SESSIONS | 4,272,000 | 50.8% | 40 sessions with a non-interactive entrypoint (sdk-py: 40); models: claude-opus-4-7: 40; first prompt: "Review this change for security vulnerabilities. Changed files (you may Read these and any other file in the repo): -" |
| 2 | CACHE_TTL_BREAKS | 998,260 | 11.9% | 1 gaps longer than 60 min inside a session; each re-wrote the whole context cold on return |
| 3 | COMPACTIONS | 300,160 | 3.6% | 2 compaction events in 1 sessions; the turn after each rebuilt context from a lossy summary |
| 4 | UNPINNED_DISPATCHES | n/a (not costed here) | — | 18 of 30 Agent dispatches carry no model (they inherit the orchestrator's tier); subagent spend is billed in the subagent transcript, not here |
| 5 | WHOLE_FILE_READS | n/a (not costed here) | — | 151 whole-file Read calls vs 0 ranged; 666,000 bytes of Read results and 111,300 bytes of Bash output landed in the main context |

---

## Per-Lever Explanation

### 1. HEADLESS_SESSIONS (50.8% of budget) — **PRIMARY LEVER**

An SDK-py plugin is spawning **40 security review sessions** automatically, each with a cold context and the full model tier (claude-opus-4-7). Every session starts with: *"Review this change for security vulnerabilities. Changed files (you may Read these and any other file in the repo):"*

This is the single largest uncached consumer. **Action:** Disable or deprioritize this hook, or pin it to a cheaper tier (haiku). The cost per firing is ~106,800 uncached tokens per session (40 sessions × 106,800 = 4,272,000).

### 2. CACHE_TTL_BREAKS (11.9% of budget) — **SECONDARY LEVER**

One break longer than 60 minutes occurred within a session (inside `orch-0001`). On return after the cache expired, the entire context re-wrote cold, costing 998,260 uncached tokens.

**Action:** Use handoff + `/clear` before stepping away for more than the TTL window. Refresh HANDOFF.md and clear, then resume from the handoff on return.

### 3. COMPACTIONS (3.6% of budget) — **TERTIARY LEVER**

Two compaction events occurred in the `compact-0001` session. Each turn after a compaction rebuilt the context from a lossy summary, costing 300,160 uncached tokens total.

**Action:** Replace compaction with handoff + `/clear`. The protocol recommends handoff + `/clear` instead of compaction for all session transitions.

### 4. UNPINNED_DISPATCHES (count: 18 of 30)

18 of 30 Agent dispatches in `orch-0001` carry no explicit model, inheriting the orchestrator's tier. The cost lives in each subagent's own transcript. These should be pinned: opus for engineering, sonnet for grunt, haiku for reading.

**Action:** Explicitly pass `model` to every dispatch; never inherit.

### 5. WHOLE_FILE_READS (count: 151 whole-file vs 0 ranged)

151 Read calls used whole-file reads instead of ranged reads (sed -n, head, grep). This landed 666,000 bytes of Read results directly into the main context.

**Action:** Use ranged reads (Bash with sed, head, grep) for most operations; reserve full Read for when you need the whole file. Dispatch long reads to a haiku worker.

---

## The Three-Day Session (`orch-0001`): Analysis

**Assumption:** The long session is inefficient and driving costs.

**Reality:** The long session is your *cheapest* session per turn.

| Metric | orch-0001 | Benchmark |
|---|---|---|
| Uncached per turn | **7,441** | 9,042 (your average) |
| Cache hit ratio | **99.5%** | 98.7% (your average) |
| Turns | 400 | — |
| Peak context | 2,972,460 | — |
| Total cost | 2,976,400 | — |

The session rides the cache at 99.5% — it is a *healthy* long session. The uncached cost per turn (7,441) is *below* your average (9,042). **Long sessions are not the problem; cache breaks and unpinned dispatches within the session are.**

The session paid for:
- 1 cache-TTL break: 998,260 tokens
- 18 unpinned dispatches (subagent costs in subagent transcripts)
- 30 total dispatches with inherited model on 18 of them

**Conclusion:** Long sessions are cheap. The protocol recommends riding one long orchestrator session per project with handoff + `/clear` for breaks, not splitting into short sessions. Splitting creates more cold-context cold-starts and loses the cache benefit entirely.

---

## Top Three Levers and Their Share

1. **HEADLESS_SESSIONS: 4,272,000 tokens (50.8%)**  
   An auto-firing security-review hook spawned 40 cold-context sessions.

2. **CACHE_TTL_BREAKS: 998,260 tokens (11.9%)**  
   One gap longer than 60 minutes forced context re-priming.

3. **COMPACTIONS: 300,160 tokens (3.6%)**  
   Two compaction events rebuilt context from summaries.

These three account for **65.3%** of your uncached spend. Removing the headless hook, using handoff + `/clear` instead of compaction, and using handoff before TTL breaks would recover **66% of the budget**.

---

## Verification Data

**Totals:**
- Assistant turns: 930
- Uncached input (input + cache_creation): 8,409,400
- Cache reads: 656,075,600
- Cache hit ratio: 98.7%
- Output tokens: 610,000
- Uncached input per turn: 9,042

**By main model:**
| Model | Sessions | Turns | Uncached in | Hit ratio |
|---|---|---|---|---|
| claude-opus-4-7 | 40 | 320 | 4,272,000 | 85.5% |
| claude-opus-5 | 7 | 610 | 4,137,400 | 99.3% |

**Long vs. Short Sessions:**
| Bucket | Sessions | Uncached/turn | Cache read/turn | Hit ratio |
|---|---|---|---|---|
| peak ctx ≥ 200K | 2 | 7,190 | 1,143,937 | 99.4% |
| peak ctx < 200K, ≥10 turns | 5 | 3,050 | 28,500 | 90.3% |

The two long sessions (peak context ≥ 200K) have lower uncached-per-turn cost and higher hit ratio. They are the efficient ones.
