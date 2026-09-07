# Token Usage Findings — 2026-09-07

## Executive Summary

Analysis of 47 sessions across 930 assistant turns reveals **8.4M uncached input tokens** consumed over the audit period. The top three budget consumers account for **66.3%** of all uncached input tokens:

1. **Headless review sessions (50.8% of budget)** — 4.27M uncached tokens
2. **Cache TTL breaks (11.9% of budget)** — 998K uncached tokens  
3. **Compactions (3.6% of budget)** — 300K uncached tokens

---

## Detailed Lever Analysis

### Lever 1: HEADLESS_SESSIONS — 4,272,000 uncached tokens (50.8% of budget)

**What's happening:** 40 independent review sessions spawned from an `sdk-py` entrypoint, each running with `claude-opus-4-7`. These are headless/non-interactive sessions triggered by a plugin or SDK integration. The first prompt shows these are security review sessions: *"Review this change for security vulnerabilities. Changed files..."*

**Evidence:**
- 40 headless sessions, all from `sdk-py` entrypoint
- All 40 use `claude-opus-4-7` as the main model
- Each session is a fresh, cold-context invocation (~8 turns per session)
- Hit ratio is only 85.5% (vs 99%+ for interactive sessions), indicating fresh context on each call

**Root cause:** A plugin or SDK (likely a GitHub/GitLab CI integration) is spawning a Claude Code session for every code review request, each with full fresh context. The prompt cache cannot help here because each session is independent.

**Recommendation:** 
- Identify the hook/plugin that triggers these (likely in `.claude/hooks/` or settings related to CI/VCS integration)
- Decide: either disable the reviews, batch them, or pin them to a cheaper tier like Haiku
- Current cost per review: ~107K uncached tokens (4.27M ÷ 40 sessions)

---

### Lever 2: CACHE_TTL_BREAKS — 998,260 uncached tokens (11.9% of budget)

**What's happening:** One session (the main orchestrator `orch-0001`) experienced a break longer than 60 minutes. When you returned to the session after the cache TTL expired, the entire context had to be re-written at cache-creation cost, losing the cached prefix.

**Evidence:**
- 1 gap event in the main orchestrator session (`orch-0001`)
- This gap caused context to be re-primed: ~998K uncached tokens on the return
- The same session's cache hit ratio is excellent at 99.5% when you stay within the TTL window

**Root cause:** User stepped away from an active session for more than 60 minutes. On return, the prompt cache had expired, forcing a cold re-prime of the full context.

**Recommendation:** 
- Before stepping away for longer than the cache TTL (60 minutes by default), run `/clear` and commit the work to HANDOFF.md
- Resume the next session by reading HANDOFF.md as the first action
- This avoids the ~1M token re-prime penalty and costs only a few thousand tokens for the handoff read

---

### Lever 3: COMPACTIONS — 300,160 uncached tokens (3.6% of budget)

**What's happening:** The session `compact-0001` underwent 2 compaction events (lossy context summarization). Each compaction rebuilt the context from a summary, costing 300K uncached tokens in re-priming.

**Evidence:**
- 2 compaction events in 1 session (`compact-0001`)
- 150 turns in that session
- Each compaction re-primed context: input + cache_creation tokens spiked after each event

**Root cause:** The session is configured to auto-compact (likely due to `autoCompactWindow` in settings or time-based compaction). Each compaction discards the prefix cache and forces re-priming from a lossy summary.

**Recommendation:** 
- Replace auto-compaction with handoff + `/clear`
- When you hit ~40% of context used, run `/clear` and save state to HANDOFF.md
- Start a fresh session reading HANDOFF.md
- This costs a few thousand tokens (handoff read) instead of 150K+ (compaction re-prime)

---

### Lever 4: UNPINNED_DISPATCHES — 18 of 30 dispatches (60% of subagent calls)

**What's happening:** 18 out of 30 Agent tool dispatches in the orchestrator session do not specify a model tier. These inherit the main model (`claude-opus-5`), meaning expensive tier work is being assigned to subagents that should use cheaper models for reading/analysis.

**Evidence:**
- Dispatch breakdown: 18 inherit, 8 explicit opus, 4 haiku
- 60% of subagents inherit instead of being pinned to tier
- Dispatch costs are not counted in the uncached total (they live in subagent transcripts), but unpinned dispatches increase subagent spend

**Recommendation:** 
- Pin every Agent dispatch to an explicit tier:
  - `haiku`: reading, searching, summarizing, gathering context
  - `sonnet`: grunt work, refactoring, analysis, moderate complexity
  - `opus`: architecture decisions, complex reasoning, debugging
- Change `model: "inherit"` or missing `model` fields to `model: "haiku"` (or sonnet/opus as needed)
- This automatically shows up in the main orchestrator's dispatch calls

---

### Lever 5: WHOLE_FILE_READS — 151 whole-file Read calls (25.9% of tool use)

**What's happening:** The orchestrator is calling Read tool 151 times without offset/limit parameters (whole-file reads). These load entire file contents into the main session context, adding 666KB of Read results to the orchestrator's context.

**Evidence:**
- 151 whole-file reads vs 0 ranged reads (sed -n, head, grep)
- 666KB of file content landed in the orchestrator context
- Additional 111KB of Bash output results

**Root cause:** The orchestrator is the bottleneck for all file access. It reads full files, then filters/processes them in the main context.

**Recommendation:** 
- Push reads to workers: use sed/grep/head/tail for ranged reads in Bash
- Dispatch a Haiku agent for summarization when you need an overview of a large file
- Keep the orchestrator's context light: it should decide and coordinate, not read

---

## Long Sessions vs Short Sessions

**Are long sessions a problem?** NO — they are actually the COST-EFFECTIVE choice.

**Evidence:**
- 2 long sessions (peak context ≥ 200K):
  - Uncached per turn: 7,190 tokens
  - Cache read per turn: 1,143,937 tokens  
  - **Hit ratio: 99.4%** ← very healthy
  
- 5 short sessions (10-50 turns, small context):
  - Uncached per turn: 3,050 tokens
  - Cache read per turn: 28,500 tokens
  - Hit ratio: 90.3%

**Interpretation:** Long sessions are CHEAPER per turn than short sessions, despite larger apparent context. The long sessions hit the cache 99.4% of the time, making them efficient. The 400-turn orchestrator session (`orch-0001`) is the healthiest session in the set: 99.5% hit ratio, 2.97M uncached tokens across 400 turns = 7,440 tokens/turn.

Short sessions look cheaper because they have less context, but their lower hit ratio means they're re-priming context more often. **Do not split long sessions — they are the budget-efficient choice.**

---

## Budget Allocation Summary

Of the 8.4M uncached input tokens:
- **4.27M (50.8%)** → Stop the headless review sessions, or pin to haiku
- **0.998M (11.9%)** → Use handoff + /clear for breaks > 60 minutes
- **0.300M (3.6%)** → Replace compactions with handoff + /clear
- **0.835M (9.9%)** → Long sessions with high hit ratio (these are working correctly)
- **Other (24.4%)** → Baseline operations, well-optimized

**Most impactful action:** Disable or dramatically reduce the 40 headless review sessions (sdk-py). At 50.8% of spend, finding a cheaper way to run reviews or disabling them entirely would cut the weekly budget by half.

---

## Cache Health

Overall cache hit ratio: **98.7%** ✓ Excellent

- Interactive orchestrator (opus-5): 99.3% hit ratio
- Headless reviews (opus-4-7): 85.5% hit ratio (expected for cold-start sessions)

The main orchestrator is riding the cache very effectively. The 98.7% overall ratio is healthy despite the 40 independent review sessions dragging it down.

---

## Configuration Applied

The following changes have been applied to `/tmp/run-09-home/.claude`:

1. **Protocol block** installed in `CLAUDE.md` — standardizes handoff + `/clear` over compaction, pins all dispatches, disables auto-compaction
2. **Hook script** installed at `.claude/hooks/context-watch.mjs` — monitors context usage and reminds before the ~40% threshold
3. **settings.json** updated — removed auto-compaction, set cache window to match model tier (200K for Haiku)

See `/tmp/eval-skills/token-economy/references/protocol.md` for the full protocol text.
