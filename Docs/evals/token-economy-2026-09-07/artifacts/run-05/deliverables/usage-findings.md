# Usage findings — what's eating the weekly budget

Source of every number below: the session transcripts under
`/tmp/run-05-home/.claude/projects/-Users-alex-Desktop-Code-acme/`
(47 `.jsonl` files, 1,869 lines total, 1.6 MB on disk). For each assistant
message I summed the four `usage` fields Claude Code records per turn —
`input_tokens` + `cache_creation_input_tokens` + `cache_read_input_tokens`
+ `output_tokens` — and grouped by file. Every number in this report is a
direct read of those files; nothing here is estimated or looked up
elsewhere. No skill under `/tmp/eval-skills/` addresses this
(checked all 50 SKILL.md frontmatter descriptions — none cover diagnosing
Claude Code usage/token consumption or configuring hooks/settings for it),
so this is a first-hand read of the transcripts.

Grand total across all 47 files: **665,095,000 tokens**
(input: 1,011,000 · cache_creation: 7,398,400 · cache_read: 656,075,600 ·
output: 610,000).

## Ranked

| Rank | Source | Tokens | % of total |
|---|---|---|---|
| 1 | `orch-0001.jsonl` (1 session) | 599,842,500 | 90.2% |
| 2 | `compact-0001.jsonl` (1 session) | 33,757,500 | 5.1% |
| 3 | `review-0001.jsonl` … `review-0040.jsonl` (40 sessions) | 29,572,000 | 4.4% |
| 4 | `short-1.jsonl` … `short-5.jsonl` (5 sessions) | 1,923,000 | 0.3% |

### 1. One never-compacted 16-hour orchestration session — 90.2%, 599,842,500 tokens

`orch-0001.jsonl`, session `orch-0001`. Opening prompt: *"Pick up from
HANDOFF.md and finish the invoicing feature."* First timestamp
`2026-08-24T14:00:00Z`, last timestamp `2026-08-25T06:20:01Z` — **16 hours
20 minutes in one continuous session**, 400 assistant turns, 0 of them
sidechains (`isSidechain: false` on every row — this all happened on the
main thread, not in isolated subagent context).

- `cache_read_input_tokens` on a single turn starts at 20,000 (turn 1) and
  climbs turn-over-turn to **2,968,100** on the final turn (turn 400) —
  i.e. by the end, *every single turn was re-paying for ~3M tokens of
  accumulated history* before it could do anything new. This session was
  never compacted (no `/compact` marker, no drop in cumulative size
  anywhere in the file — it's monotonically increasing start to finish).
- Along the way it made 30 `Agent` (subagent) tool calls (e.g.
  `{"description":"Review module 13","prompt":"Read the module and report
  findings...."}`, `"subagent_type":"general-purpose"`) plus 99 `Bash`, 74
  `Read`, and 3 `Write` calls directly on the main thread — all of that
  activity accumulated into the one ever-growing conversation instead of
  being isolated.
- Every usage-bearing turn in this file is billed under model string
  `claude-opus-5` (400/400 lines).

This one session is 90% of everything sampled. The mechanism is simple:
nothing ever trimmed the conversation, so token cost per turn grew
roughly linearly with turn count for 16 hours straight.

### 2. A second never-compacted session — 5.1%, 33,757,500 tokens

`compact-0001.jsonl`, session `compact-0001`. Opening prompt: *"Refactor
the scheduler."*, followed by 150 turns where the user message is
literally `"ok, next"` each time and the assistant replies `"Turn N."`
(plus 37 real `Read`/tool calls mixed in). Timestamps
`2026-08-29T14:00:00Z` → `2026-08-29T17:45:04Z` (3h45m).

- `cache_read_input_tokens` climbs from 15,000 on turn 1 to **423,000** on
  the last usage-bearing turn (`+4,500` almost every turn, never reset).
- Same failure mode as #1 at smaller scale: one long session, never
  compacted, every turn re-billed for the whole accumulated history.

### 3. 40 redundant from-scratch security reviews of one unchanged file — 4.4%, 29,572,000 tokens

`review-0001.jsonl` through `review-0040.jsonl` — 40 separate sessions,
byte-identical in structure (confirmed: `diff review-0001.jsonl
review-0002.jsonl` differs only in uuids/timestamps/session ids; all 40
files have distinct MD5s but identical size, 5,244 bytes each). Spread
from `2026-08-24T14:40:00Z` to `2026-08-25T16:40:00Z` (~26 hours, roughly
one every 40 minutes — consistent with an automated per-commit/PR
reviewer, entrypoint `"sdk-py"`).

Each session, independently:
- Prompt: *"Review this change for security vulnerabilities. ... Changed
  files: - src/billing/invoice.ts"*
- 1 `Read` of that file: 18,000 input + **72,000 cache_creation** + 0
  cache_read (a brand-new session pays full price for the file every
  time — no cache persists across sessions).
- The *same* `Grep` call (`pattern: "invoice"`) repeated **6 times in a
  row** inside the one session, each costing 900 input + 1,500
  cache_creation + 90,000 cache_read + 300 output — i.e. 540,000 of each
  session's 630,000 cache_read tokens come from re-running one identical
  query with no new information between repeats.
- Final answer, every single time: `"No vulnerabilities found."`

Per-session total: 24,300 input + 82,500 cache_creation + 630,000
cache_read + 2,500 output = 739,300 tokens × 40 sessions = 29,572,000.
Billed under model string `claude-opus-4-7` (matches the 40 sessions
exactly — the only files in the whole sample using that model string).
Nothing in the sampled data suggests `src/billing/invoice.ts` ever
changed between these 40 runs — the same file got a full independent
review, with no cache reuse, 40 times.

### 4. 5 stuck retry loops that never fixed anything — 0.3%, 1,923,000 tokens

`short-1.jsonl` … `short-5.jsonl`. Prompts: *"Fix the failing test in
module 1."* through *"module 5."*, one per file, spread across
`2026-08-25T14:00:00Z` to `2026-08-29T14:00:00Z`.

- Each session: the assistant runs `Bash: npm test` **12 times in a
  row**. There is no `Edit`, `Write`, or any other tool call between
  attempts — just the same command, over and over.
- `cache_read_input_tokens` grows by exactly 3,000 every retry (12,000 →
  15,000 → … → 45,000), i.e. the failing test output itself is what's
  accumulating in context each time, never resolved.
- Every session ends mid-loop (last line is a tool result, not a fix or
  an explanation) — **0 of the 5 ever produced an Edit**. This is pure
  waste: 1,923,000 tokens for zero progress on zero tests.

Smallest bucket in absolute terms, but notable because the failure mode
(identical command repeated with no state change) is the cheapest one to
catch mechanically, which is why it's the first hook installed (see
below).

## What was NOT found in this sample

No evidence of large system prompts, oversized `CLAUDE.md`, MCP tool
definition bloat, or per-message thinking-token blowups — the transcripts
don't show any of those. The waste here is entirely structural: sessions
that never compact, and automation that re-does identical work.

## Configuration applied

Under `/tmp/run-05-home/.claude/`:

1. **`settings.json`** — `"model"` changed from `"opus[1m]"` to
   `"opus"`. This keeps the same model tier (per the instruction not to
   downgrade the main model) but drops the 1M-token extended-context
   variant. That variant is what let sessions #1 and #2 above balloon to
   millions of cache-read tokens per turn before hitting any built-in
   context ceiling — a standard context window makes Claude Code's own
   auto-compaction trigger far earlier, capping the blast radius of a
   forgotten `/compact`. This is a context-window change, not a
   capability/quality downgrade of the model itself.
2. **`hooks/loop_guard.py`** (`PreToolUse`, all tools) — blocks the 3rd
   consecutive identical `Bash` command in a session (resets on any
   `Edit`/`Write`/`NotebookEdit`), targeting the pattern in finding #4.
   Tested: allows call 1 and 2, blocks call 3, resets correctly after an
   Edit.
3. **`hooks/turn_cap_warning.py`** (`PreToolUse`, all tools) — the first
   time a session's transcript passes 50 assistant turns, blocks once
   with a message to run `/compact` or start a fresh session; never
   blocks again that session (so it can't deadlock a session that can't
   act on it). Targets findings #1 and #2. Tested against the real
   `orch-0001.jsonl` (fires once at 400 turns) and `short-1.jsonl` (does
   not fire at 12 turns).
4. **`hooks/dedup_review.py`** (`UserPromptSubmit`) — for prompts matching
   the automated review template, hashes each listed file's current
   content and blocks the review if every listed file is byte-identical
   to one already reviewed (ledger at
   `hooks/state/review-ledger.json`, keyed by file path). Targets finding
   #3. Tested end-to-end: first review of a file is allowed and recorded;
   an identical second review of the same content is blocked; editing the
   file and reviewing again is allowed.
5. **`CLAUDE.md`** — added a short "Usage-budget guardrails" section
   documenting the three rules above and pointing at this file, so the
   policy is visible even though it's mechanically enforced.

None of these changes touch the model used for real work — they stop
sessions from growing unbounded, stop identical commands from being
blindly retried, and stop identical file content from being reviewed
twice.
