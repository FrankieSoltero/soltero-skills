# Auto-Compaction Configuration Report
Date: 2026-09-07

## Decision
Set auto-compaction threshold to **350,000 tokens** (autoCompactWindow: 350000)

## Problem Statement
The acme session was accumulating excessive context (600K+ tokens) that was being dragged into every turn, significantly reducing efficiency and increasing costs.

## Data Analysis

### Original Session Metrics (orch-0001.jsonl)
- **Total turns:** 400 message pairs
- **Starting context:** 20,000 tokens
- **Final context:** 2,968,100 tokens (nearly 3M)
- **Total growth:** 2,948,100 tokens
- **Average growth per turn:** 7,370 tokens/turn

### Threshold Reachability
The session reached various token thresholds at the following turns:
- 300,000 tokens → Turn 59
- **350,000 tokens → Turn 69** ← SELECTED THRESHOLD
- 400,000 tokens → Turn 79
- 500,000 tokens → Turn 99
- 600,000 tokens → Turn 120 (user's pain point)

### Specific Turn Snapshots
- Turn 50: 260,100 tokens
- Turn 75: 382,000 tokens
- Turn 100: 504,500 tokens
- Turn 120: 603,100 tokens (problem threshold)

## Rationale

### Why 350,000?
1. **Triggers well before pain point:** The 350K threshold triggers at turn 69, which is 51 turns BEFORE the user hit 600K at turn 120
2. **Reasonable session length:** At ~7.4K tokens/turn average growth, sessions would last 69 turns before compaction, which is substantial enough for good context reuse
3. **Conservative but not aggressive:** A middle-ground choice that avoids both:
   - Too aggressive (e.g., 250K would trigger every 30 turns)
   - Too lenient (e.g., 500K would still drag large context forward)
4. **Aligns with user intent:** "kicks in way earlier" suggests early intervention, not waiting until context becomes problematic

### Alternative Thresholds Considered
- **300K tokens:** Would trigger at turn 59 (even earlier, might cause too many compactions for some workflows)
- **400K tokens:** Would trigger at turn 79 (still 41 turns before reaching 600K pain point)
- **500K tokens:** Would trigger at turn 99 (only 21 turns before 600K, not aggressive enough)

## Implementation
Configuration applied to `/tmp/run-10-home/.claude/settings.json`:
```json
{
  "autoCompactEnabled": true,
  "autoCompactWindow": 350000
}
```

## Expected Impact
- Compaction will trigger automatically when session context reaches 350K tokens
- Typical session length before first compaction: ~69 turns
- Reduced context bloat for subsequent turns
- Estimated cost savings: proportional to fewer cache read tokens per turn after turn 69
- User experience: Automatic compaction without manual intervention needed

## Configuration File Changed
- **File:** `/tmp/run-10-home/.claude/settings.json`
- **Change type:** Added two new fields
- **Status:** Applied successfully
