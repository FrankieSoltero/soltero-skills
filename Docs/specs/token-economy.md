# Skill Spec — token-economy

- **Problem:** "I keep hitting my usage limit" is answered by guessing: the agent recommends
  a smaller main model, more `/compact`, or shorter sessions — none of which is what the
  transcripts show actually burns the budget. Measured over 479 sessions (Aug–Sep 2026) the
  levers were elsewhere: automated headless sessions spawned by a hook (23% of all uncached
  input, invisible from inside a chat), breaks longer than the prompt-cache TTL inside a long
  session (14% — the whole context is re-written cold on return), subagents that inherit the
  orchestrator's model, and whole-file reads into the main context. The user's own system —
  one long orchestrator session riding a 98% cache-hit ratio, `HANDOFF.md` + `/clear` instead
  of compaction (1 compaction in 479 sessions), every dispatch pinned to a cheaper tier, workers
  read while the orchestrator decides — lives in one person's habits, a memory file and a
  hand-edited `settings.json`. Nobody else who installs the plugin gets it.
- **Trigger:** User says usage/limits/tokens are the problem, asks to cut model usage, asks why
  usage is burning so fast, asks to "set up the token-saving system" on a machine, or asks to
  audit token usage.
- **Scope / non-goals:** Two modes. **Audit**: run the bundled `token-audit.mjs` over
  `~/.claude/projects` (or a given root) and rank the levers by uncached input, with the
  headless/automated sessions, cache-TTL breaks, compactions, unpinned dispatches and read
  patterns called out mechanically. **Setup**: run the bundled `economy-setup.mjs` to check
  and (with `--apply`) install the system at user scope — the context-watch hook calibrated to
  the model's context window, the effort level, and an idempotent "Token economy" protocol
  block in `~/.claude/CLAUDE.md` — with a timestamped backup of every file it touches.
  Non-goals: changing the user's main model (their call), editing any plugin's hooks,
  editing project files, touching API code (`claude-api cost-optimize` owns that), and
  compaction tuning (the protocol replaces compaction with handoff).
- **Trigger phrasings:** "use tokens more efficiently", "stay under my usage limit", "cut
  down on my model usage", "I keep hitting my usage limit", "I have 24 percent of my limit
  left", "subagents are killing my usage", "why am I burning through usage so fast", "set up
  the token-saving system", "audit my token usage", "make the skills token-efficient", "set
  this up on my teammate's machine".
- **Success scenario:** On a seeded home directory (settings.json with no hook and default
  effort, a 1M-context model, a transcripts root with one long cached orchestrator session
  that contains a 3-hour break, forty short headless `sdk-py` review sessions, a session with
  two compactions, and dispatches with no `model`), the skill runs the audit first and reports
  the ranked levers with numbers from the script (headless reviews first, then the break
  re-prime, then unpinned dispatches — and states that the long session is the *most*
  efficient one, not the problem); then runs setup `--check`, shows the diff, applies with
  backups, and verifies: hook registered with `HANDOFF_CONTEXT_WINDOW=1000000`, protocol block
  present once, effort recorded. A no-skill baseline recommends "use sonnet as your main
  model and /compact more often", edits settings.json in place with no backup, and installs
  the hook with the 200 000 default window on a 1M model.
- **Bundled assets:**
  - `scripts/token-audit.mjs` (+ test) — walks transcripts, computes per-session and
    aggregate token metrics (uncached vs cache-read, hit ratio, peak context, gaps over the
    cache TTL and their re-prime cost, compactions, dispatch model distribution, headless
    entrypoints, tool mix), prints markdown + optional JSON; ranks levers by uncached input.
  - `scripts/economy-setup.mjs` (+ test) — `--check` reports each item of the system as
    OK / MISSING / MISCALIBRATED against `~/.claude` (or `--home DIR`); `--apply` installs
    with backups and is idempotent; exit 0 = all OK, 1 = gaps, 2 = bad input.
  - `scripts/test-fixture.mjs` — builds the seeded home + transcripts used by tests and
    scenarios.
  - `references/protocol.md` — the exact CLAUDE.md block and why each line exists.
  - `references/findings-2026-09.md` — the measured baseline this skill was built from.

## Architecture

**Audit before advice.** The first action is always the script over real transcripts; every
number in the report comes from it. Levers are ranked by uncached input tokens (input +
cache_creation), never by cache reads — cache reads are the cheap half and a high cache-read
count is what a healthy long session looks like.

**Setup is a checklist, applied by a script.** Items: (1) `UserPromptSubmit` context-watch hook
present, pointing at an existing script, with `HANDOFF_CONTEXT_WINDOW` matching the configured
model's window (1M for opus/fable/sonnet-5 tier, 200K for haiku) and a threshold (default 40);
(2) `effortLevel` set (report the value; recommend `high`; never silently change it);
(3) the protocol block in `~/.claude/CLAUDE.md` between `<!-- token-economy:start -->` /
`<!-- token-economy:end -->` markers, replaced in place when present. Every write is preceded
by `<file>.bak-<ISO timestamp>`. Anything else in settings.json or CLAUDE.md is untouched.

**The protocol (what the block says).** One long orchestrator session per project; handoff +
`/clear`, never `/compact`; before a break longer than the cache TTL, refresh HANDOFF.md and
`/clear`; every dispatch pins a tier (opus engineering, sonnet grunt, haiku reading; never
inherit, never the orchestrator's model); workers read, the orchestrator decides — no whole
files or long logs into the main context; check `/usage` before a fan-out; effort high.

## Testing

Repo `creating-a-skill` conventions. `scripts/test-fixture.mjs` seeds `/tmp/te-home-<tag>/.claude`
(settings.json, CLAUDE.md, `projects/` with synthetic JSONL transcripts in the real schema).
RED on pinned sonnet; GREEN on the same tier; A/B via `skill-ab-eval` on sonnet + haiku with a
canary of scenario 1's shape.
