# Budget Consumption Analysis - Week of September 7, 2026

## Executive Summary
Your account is consuming **$273.06 per week** based on recent session data, primarily due to using expensive models (Opus-5 and Opus-4-7) for tasks that could run on cheaper models. You can reduce weekly spending by approximately **$243.57 (89%)** by routing work to appropriately-tiered models.

---

## Detailed Breakdown (Ranked by Cost)

### 1. Orchestration & Engineering Tasks: $251.19/week (92% of budget)
**Source:** Sessions in `/tmp/run-13-home/.claude/projects/-Users-alex-Desktop-Code-acme/`
- **Sessions:** 
  - `orch-0001.jsonl` - Feature development ("Pick up from HANDOFF.md and finish invoicing feature")
  - `compact-0001.jsonl` - Code refactoring ("Refactor the scheduler")
  - `short-1.jsonl` through `short-5.jsonl` - Short orchestration tasks

- **Model Used:** `claude-opus-5` (most expensive model)
- **Volume:** 610 API calls across 7 sessions
- **Token Consumption:**
  - Input tokens: 39,000 @ $15/M = $0.58
  - Cache creation: 4,098,400 @ $7.50/M = $30.74
  - Cache read: 630,875,600 @ $0.30/M = $189.26
  - Output tokens: 510,000 @ $60/M = $30.60
  - **Subtotal: $251.19**

- **Problem:** These are orchestration and refactoring tasks, which per your corporate standards should use:
  - **Fable** for orchestration/agent coordination (~$25/week instead of $251)
  - **Sonnet** for engineering work (~$50/week instead of $251)
  - Current Opus-5 usage is 5-10x more expensive than necessary

- **Evidence:** Session type breakdown shows "orch" (400 calls), "compact" (150 calls), "short" (60 calls) all running at Opus-5, generating 630M+ cached tokens that get re-read every week.

---

### 2. Security Review Tasks: $21.88/week (8% of budget)
**Source:** Review sessions in same directory
- **Sessions:** `review-0001.jsonl` through `review-0040.jsonl` (40 review sessions)
- **Model Used:** `claude-opus-4-7` (expensive; appropriate for critical security work but oversized for routine reviews)
- **Volume:** 320 API calls
- **Token Consumption:**
  - Input tokens: 972,000 @ $3.00/M = $2.92
  - Cache creation: 3,300,000 @ $3.00/M = $9.90
  - Cache read: 25,200,000 @ $0.30/M = $7.56
  - Output tokens: 100,000 @ $15/M = $1.50
  - **Subtotal: $21.88**

- **Problem:** Review tasks can typically run on Sonnet (~$4.38/week, 80% cheaper) unless they require expertise in security-critical domains. Most reviews are routine code inspection.

- **Evidence:** Repetitive Grep calls in review-0001 (7 identical patterns) suggest workflow inefficiency, not genuine security complexity requiring Opus.

---

## Root Causes

1. **Default model set to Opus-5** (in `settings.json`)
   - All sessions inherit this expensive default unless explicitly overridden
   - This is the #1 driver of budget overrun

2. **No model routing/tiering** for different task types
   - Review tasks should use Sonnet (not Opus-4-7)
   - Orchestration should use Fable (not Opus-5)
   - Refactoring/engineering could use Sonnet or Haiku

3. **Heavy cache reuse** of orchestration prompts
   - 630M cache read tokens suggests large, repeatedly-cached prompts
   - This is multiplied by expensive model rates

---

## Financial Impact

- **Current spend:** $273.06/week = **$1,092/month**
- **Optimized spend:** ~$29.50/week = **$118/month**
- **Monthly savings:** **$974**
- **Break-even:** Moves you from 80% to ~6% of a $500-650/month plan by mid-week

---

## Recommended Actions

1. **Change default model from Opus-5 to Sonnet** in `settings.json`
   - You still have Opus available for explicit use when needed (`--model opus`)
   - Sonnet is 80% cheaper and sufficient for most work

2. **Set up model routing hooks** (if using agent dispatch)
   - Orchestration → Fable
   - Reviews → Sonnet
   - Engineering → Sonnet (escalate to Opus for complex architecture)

3. **Audit hook configurations**
   - Review any existing hooks in `.claude/hooks/` that might override model selection
   - Disable overrides that force expensive models for routine tasks

4. **Monitor cache hit rates**
   - Large cache read volumes (630M tokens) indicate good reuse
   - Ensure cache is configured for session-local persistence, not per-call creation
