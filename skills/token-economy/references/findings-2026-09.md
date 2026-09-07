# Measured baseline — 2026-09-07

The system this skill installs was reverse-engineered from one user's transcripts, not
designed from first principles. This file records what the audit script found, so the
protocol's lines can be traced to numbers and re-measured later with the same script:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/token-audit.mjs --since 2026-08-01 --json audit.json > audit.md
```

## Scope

- Root: `~/.claude/projects` — 2,348 transcript files, 479 main-thread sessions with at least
  one assistant turn, 2026-08-01 → 2026-09-07. Older sessions had been rotated out.
- Command history (`~/.claude/history.jsonl`, 3,316 entries) for the slash-command counts.
- Cache TTL assumed 60 minutes (the session's own `cache_creation.ephemeral_1h_input_tokens`
  field confirms the 1-hour tier was in use).

## Totals

| Metric | Value |
|---|---|
| Assistant turns (main thread) | 23,362 |
| Uncached input (input + cache_creation) | 166.5M |
| Cache reads | 6.30B |
| Cache hit ratio | 97.4% |
| Uncached input per turn | 7.1K |
| Compaction events | 1 |
| `HANDOFF.md` writes | 180 in 22 sessions (411 counting Bash heredocs) |
| Slash commands typed | `/usage` 86, `/clear` 84, `/agent-handoff` 64, `/context` 22, `/model` 21, `/effort` 9, `/compact` 2 |

## What the user does that keeps the budget

1. **One long orchestrator session per project.** The 32 sessions with peak context ≥200K
   ran at a 98.1% hit ratio and 7.0K uncached tokens per turn — the same uncached cost per
   turn as the 226 short sessions (6.1K, 91.2% hit ratio) — while serving 361K cached tokens
   per turn. Median wall-clock of the ≥400K sessions: 49 hours; longest 101 hours.
2. **Handoff + `/clear` instead of compaction.** One compaction in 479 sessions. `/clear`
   follows `/agent-handoff` 17 times in the command history; `/compact` was typed twice.
3. **Every dispatch pinned.** 1,004 of 1,006 `Agent` dispatches carried an explicit `model`;
   opus 60.5%, haiku 21.6%, sonnet 17.7%. Haiku's share went from 8% in August to 40% in
   September after the tier standard was written down.
4. **Workers read, the orchestrator decides.** 1,006 dispatches with a 2.7K-character median
   brief; 47% of main-thread tool calls are Bash (ranged reads via `sed -n`/`head`/`grep`),
   Read is 14%.
5. **`/usage` before fan-outs.** 86 `/usage` checks; the next entry is a prompt 61 times,
   `/workflows` 5.
6. **Effort `high`** at user scope; `/effort` raised per task nine times.

## What still leaks (the levers the audit ranks)

| # | Lever | Uncached tokens | Share | Evidence |
|---|---|---|---|---|
| 1 | HEADLESS_SESSIONS | 47.7M | 28.4% | 404 `sdk-py` sessions on claude-opus-4-7 — the security-guidance plugin's per-change review hook, ~97K uncached each, 82% hit ratio, invisible from inside any chat — plus 30 `sdk-cli` runs |
| 2 | CACHE_TTL_BREAKS | 22.8M | 13.6% | 71 in-session gaps over an hour; each return re-wrote a 500–900K context cold |
| 3 | WHOLE_FILE_READS | not costed | — | 1,258 whole-file `Read` calls vs 365 ranged; 19.6MB of Read results (~5M tokens) and 6.0MB of Bash output landed in the main context |
| 4 | COMPACTIONS | 0.09M | 0.1% | 1 event |
| 5 | UNPINNED_DISPATCHES | not costed | — | 2 of 1,006 |

Levers 1 and 2 are the two lines the protocol adds beyond what the user already did by habit:
audit the automated sessions, and hand off before a break longer than the TTL.

## Cost weighting

The report's "input-equivalent" line uses the standard API multipliers — uncached input ×1,
cache writes ×1.25, cache reads ×0.1. Subscription usage limits weigh these differently and
the exact weights are not published; the ranking uses uncached tokens only, which is
robust to the weights.
