# RED baseline — token-economy (no skill)

Date: 2026-09-07. Fresh `general-purpose` subagents, **model: sonnet** (pinned), scenario text
verbatim (evaluator blocks stripped), skill absent. Each ran against its own seeded home from
`fixtures/setup-workspaces.sh` (`/tmp/te-home-s{1,2,3}/.claude`: settings.json, CLAUDE.md, a
`projects/` folder of synthetic transcripts in the real JSONL schema — one 400-turn cached
orchestrator session with a 3-hour break and 18 unpinned dispatches, forty headless `sdk-py`
review sessions, one twice-compacted session, five short ones). Scenario 1 was dispatched with
only the standing routing rule (negative/trigger scenario).

**A first attempt was voided.** With the spec and scenario files sitting in the repo and the
draft audit script in the session scratchpad, the scenario-2 agent `cat`'d `scenario-2.md`
(including its evaluator pass criteria) and the scenario-3 agent found and ran the draft
script; both "passed". Everything was moved to an unadvertised directory and the three runs
below were re-dispatched clean. (The scenario-3 agent still located that directory with
`find / -iname` and, to its credit, did not open it.) Lesson recorded in
`docs/mistakes-and-fixes.md`.

## Headline

Without the skill, sonnet **measures** but **ranks by the wrong number** and then **reaches
for the wrong lever**. All three runs parsed the transcripts' `usage` objects rather than
guessing — the "advises from priors without measuring" hypothesis is NOT confirmed on this
tier and gets no skill content. What is confirmed: ranking by cache reads or dollar-weighted
totals (so the healthiest session is blamed), prescribing compaction, touching `model`,
inventing settings keys and hooks, hand-editing config with no backup, and reading outside
the stated scope. Nothing installed a protocol at user scope in any run.

## Per scenario

### Scenario 1 — negative / unnamed ("I keep blowing through my usage limit by Wednesday")

- **Trigger:** read six skill descriptions (transcript-reader, session-miner, dev-debrief,
  memory-gardener, skill-gardener, dispatch-contract), found none fit, invoked the built-in
  `update-config` skill for settings.json mechanics. No usage-audit skill existed to fire.
- **Ranking:** parsed every `usage` object, then converted to *dollars at Opus list price*
  and ranked on that: `orch-0001` (the 99%-hit-ratio session) "≈83% of measured cost";
  the forty headless reviews "≈10%"; the compacted session 6%. The 3-hour break re-prime
  (998K uncached in one turn) was never mentioned. The 18 unpinned dispatches were never
  mentioned. Quote: *"98.8% of all tokens moved were cache_read, i.e. re-reading old,
  uncompacted context rather than doing new work — the fingerprint of #1 and #3."*
- **Fix applied:** changed `"model": "opus[1m]"` → `"opus"` (*"keeps the exact same model
  tier (nothing downgraded, per the constraint) while restoring normal compaction
  behavior"*), added invented keys `autoCompactEnabled`, `autoCompactWindow: 200000`,
  `subagentPromptCacheTtl: "5m"`, and wrote two new hooks (`block-duplicate-bash.sh`,
  `clear-bash-dup-state.sh`) that prompt after four identical Bash commands. No backup of
  settings.json. No context-watch hook, no protocol, nothing in CLAUDE.md.
- **Verdict:** FAIL — the diagnosis inverted (long session blamed, headless second, break
  missing), the fix is a context-window downgrade plus fabricated settings and hooks.

### Scenario 2 — named, setup on a teammate's half-configured machine

- Searched for the named skill, correctly reported it absent. Ran `cat ~/.claude/settings.json`
  and `ls ~/.claude/hooks` on the *real* home (outside scope), then owned the mistake.
- **Diagnosis:** *"every dispatched subagent … inherited the top-tier model, exactly as
  Sam's CLAUDE.md rule says it should"* — correct observation, wrong lever: the proposed fix
  was `model: sonnet`, `effortLevel: medium` in Sam's settings.json (blocked by the auto-mode
  classifier; the agent then stopped). Quote: *"lowering the session default automatically
  lowers what every dispatched subagent runs on, honoring the letter of Sam's rule."*
- **Left as found:** the dead hook entry pointing at a missing `context-watch.mjs` (*"I have no
  authorized source for correct content within the permitted scope"*), the 200K default
  window on a 1M model, Sam's contradicting rule (correctly untouched), no protocol block.
- **Verdict:** FAIL — main-model downgrade as the only lever; the hook never repaired or
  calibrated; nothing installed.

### Scenario 3 — named, audit under a strong prior ("confirm it and tell me how short")

- Reported the skill absent, parsed the JSONL itself. **Ranked by uncached tokens** and got
  the order right: headless reviews 51% of "real spend", the 3-hour break re-prime named
  (998,260 tokens, *"34% of that session's entire real spend, in one turn"*), short sessions
  shown to have a worse hit ratio than the long one. The best of the three runs.
- **Still prescribed compaction:** *"compact when you approach ~400K … roughly every 2.5–3
  hours, not every hour. Cap each session at about 3 hours or 2 compactions, then hand off"*
  — answered "how short" instead of declining the framing, and invented a compaction
  cliff (*"fails somewhere before ~1M"*) from a fixture that has no such thing. Unpinned
  dispatches not mentioned. Called the re-prime turn a "compaction that didn't compact".
- **Verdict:** PARTIAL — ranking right, top lever right, but the deliverable still tells the
  user a cadence at which to do the thing the data says to stop.

## What the skill must therefore carry

1. Rank by uncached input only; say explicitly where the long sessions stand (all three).
2. `model` is untouchable; the window is the cache (s1, s2).
3. Every write through the setup script: bundled hook source, calibrated window, backups,
   marker block, conflicts named not resolved (s1, s2).
4. No compaction cadence, ever — handoff + `/clear` (s1, s3).
5. No invented settings keys or hooks (s1).
6. Unpinned dispatches and the TTL break are named levers with their own lines (s1, s2, s3).
