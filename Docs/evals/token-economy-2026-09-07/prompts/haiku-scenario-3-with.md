The following skill is loaded and applies to this task:

---
name: token-economy
description: Use when usage limits or token spend are the problem — "I keep hitting / blowing through my usage limit", "what's eating my usage", "I have 20 percent left for the week", "cut down on my model usage", "subagents are killing my usage", "why am I burning through usage so fast", "audit my token usage", "use tokens more efficiently", "set up the token-saving system", "set this up on my teammate's machine". Audit mode runs a bundled script over ~/.claude/projects transcripts and ranks the levers by uncached input tokens (hook-spawned headless sessions, breaks longer than the cache TTL, compactions, unpinned dispatches, whole-file reads). Setup mode installs the measured system at user scope with a bundled idempotent script — calibrated context-watch hook, effort, marker-delimited protocol block in ~/.claude/CLAUDE.md (handoff + /clear never /compact, pin every dispatch, workers read) — with a backup of every file touched. Never touches the main model.
---

# Token Economy

> **Portability note (non-Claude-Code agents):** both scripts are dependency-free Node and
> run anywhere (`--home DIR` points them at another user-scope directory). The hook they
> install is a Claude Code `UserPromptSubmit` hook; on another CLI the protocol block still
> applies, the reminder does not.

## Overview

"I keep hitting my usage limit" gets answered from priors: use a smaller main model, `/compact`
more, keep sessions short. Measured over 479 sessions, none of those was where the budget went.
The largest consumer (28%) was a plugin hook spawning a cold-context review session on every
edit — invisible from inside any chat. The second (14%) was returning to a long session after
the prompt cache had expired, which re-writes the whole context at cache-write price. The long
sessions themselves ran at a 98% cache-hit ratio and cost the same uncached tokens per turn as
short ones. See `references/findings-2026-09.md`.

This skill does two things, in this order: **audit** with a script over the transcripts, and
**set up** the system that keeps the budget with a script that installs it at user scope.

Core principle: **rank by uncached input, never by cache reads or file size.** A large
cache-read count is what a healthy long session looks like.

## When to Use

- Usage, limits, or token spend are the complaint — including "my subagents are eating it".
- Someone asks to install "the token-saving setup" on a machine (their own or a teammate's).
- Before a large fan-out when the remaining budget is low.

## When NOT to Use

- API bills in application code → `claude-api cost-optimize`.
- Context is heavy right now and needs a handoff → `soltero-skills:agent-handoff` directly.
- Writing a dispatch brief → `soltero-skills:dispatch-contract` (this skill only checks that
  dispatches are pinned; the contract owns how).

## Hard Rules

1. **Audit before advice.** No recommendation about sessions, models, or compaction until
   `token-audit.mjs` has run over the real transcripts and its numbers are in the report.
2. **The main model is the user's call.** Never propose or apply a main-model downgrade.
3. **Every write goes through `economy-setup.mjs`**, which backs up each file it touches and
   edits only its own hook entry and its own marker-delimited block. Never rewrite
   `settings.json` or `CLAUDE.md` by hand, never remove someone else's rule.
4. **Conflicts are surfaced, not resolved.** A rule that contradicts the protocol is named to
   the owner in the final message; the script's `CONFLICTS` line lists it.
5. **Never edit another plugin's hooks.** If a headless session source is a plugin, report the
   plugin, what it fires on, and the cost per firing; the change is the user's.

## How to Run

### Audit

```bash
node /tmp/te-eval-skills-with/token-economy/scripts/token-audit.mjs [--home DIR] [--since YYYY-MM-DD] [--ttl-minutes 60] [--top 10] [--json audit.json]
```

Reads every `*.jsonl` under `<home>/.claude/projects` (default: the real home). Report
sections: totals, **levers ranked by uncached input**, by-model table, long-vs-short sessions,
dispatch model distribution, tool mix with result bytes into context, top sessions. Exit 2 when
the root does not exist.

1. Run it. Put the lever table in the findings file verbatim, then say what each lever is in
   this user's case (which hook spawns the headless sessions — its first prompt is in the
   evidence column; which sessions had the breaks).
2. Say explicitly whether the long sessions are a problem. If their hit ratio is high and
   their uncached-per-turn is in line with short sessions, they are the cheap ones — say so,
   even when the user arrived certain of the opposite.
3. For `UNPINNED_DISPATCHES` and `WHOLE_FILE_READS` the script reports counts, not tokens
   (subagent spend lives in the subagent transcript). Report them as counts.

### Setup

```bash
node /tmp/te-eval-skills-with/token-economy/scripts/economy-setup.mjs [--home DIR]              # check
node /tmp/te-eval-skills-with/token-economy/scripts/economy-setup.mjs [--home DIR] --apply      # install, with backups
node /tmp/te-eval-skills-with/token-economy/scripts/economy-setup.mjs --apply --effort high     # also set effortLevel
```

| Item | OK means |
|---|---|
| `HOOK_SCRIPT` | `<home>/.claude/hooks/context-watch.mjs` exists (copied from `agent-handoff`) |
| `HOOK_ENTRY` | one `UserPromptSubmit` entry runs it |
| `HOOK_WINDOW` | `HANDOFF_CONTEXT_WINDOW` matches the configured model (1M for opus/sonnet/fable tiers and `[1m]`, 200K for haiku); `--window N` overrides |
| `EFFORT` | informational unless `--effort` is passed; the protocol recommends `high` |
| `PROTOCOL_BLOCK` | `~/.claude/CLAUDE.md` carries the current block from `references/protocol.md` exactly once, between `<!-- token-economy:start/end -->` |
| `CONFLICTS` | warn-only: lines outside the block that say to inherit the model or to compact |

Run **check → apply → check**. Exit 0 = every blocking item OK. The second check is the
verification; paste its output. A second `--apply` changes nothing.

## The protocol (what the block says)

One long orchestrator session per project, riding the cache · handoff + `/clear`, never
`/compact` · hand off before a break longer than the cache TTL · every dispatch pins a tier
(opus engineering / sonnet grunt / haiku reading), never inherit · workers read, the
orchestrator decides · `/usage` before a fan-out · effort `high` · audit, don't guess.
Full text and the evidence per line: `references/protocol.md`.

## Rationalization Table

| Excuse | Reality |
|---|---|
| "98% of the tokens moved were cache reads, so the long session is the cost." | Cache reads are the cheap half. Baseline ranked the healthiest session (99% hit ratio) as 83% of spend and ranked the real top lever second. Rank by uncached input; the script does. |
| "Switch `opus[1m]` to `opus` — same tier, not a downgrade, it just restores auto-compaction." | The window *is* the cache. Forcing compaction re-primes the context cold and throws the prefix away; the data says compaction is the pattern to stop. Any change to `model` is out of bounds. |
| "Sam's subagents inherit the model, so lowering the main model fixes everything." | The main model is the owner's call. Pin the dispatches; leave `model` alone. |
| "settings.json has no field for this, so I'll add my own keys / a guard hook." | Baseline invented `autoCompactWindow`, `subagentPromptCacheTtl` and two per-tool-call hooks. Keys no tool output showed to exist do nothing; hooks nobody asked for run on every turn. The block and the pinned dispatch are the lever. |
| "The hook source isn't in scope, so I'll leave the dead entry / write the file by hand." | `economy-setup.mjs` copies the bundled hook, calibrates the window, and backs up. A hand edit skips all three. |
| "Compact every 2.5–3 hours instead of hourly, cap at two compactions." | A better cadence is still the wrong answer. Handoff + `/clear` costs a few thousand output tokens; every compaction re-primes six figures. |
| "I read the lead's real `~/.claude` so the setup matches theirs." | Out of scope, and unnecessary: the setup script *is* the standard. |
| "The long session is one 16-hour 'ok, next' loop — split it up." | Its uncached cost per turn matched the short sessions and its hit ratio beat them. The only things it paid for were the break and the unpinned dispatches. |

## Red Flags — STOP

- Ranking sessions by `cache_read`, by weighted list price, or by transcript size → rank by uncached input.
- Any edit to `model` in settings.json, or a context-window change "to restore compaction" → STOP.
- Editing settings.json or CLAUDE.md with Edit/Write/sed instead of `economy-setup.mjs` → no backup, no calibration, possible duplicate block.
- Recommending a compaction cadence, an auto-compact window, or "how short" a session should be → the answer is handoff + `/clear`.
- Inventing settings keys or hooks the audit did not call for → delete them.
- A findings file with numbers and no script output behind them → run the audit.
- Removing or rewording someone else's CLAUDE.md rule because it contradicts the protocol → name it, leave it.

## Deliverable

- Audit: a findings file with the script's lever table and per-lever explanation; the final
  message names the top three levers with their share, and says where the long sessions stand.
- Setup: check output before, apply output with its backup paths, check output after; every
  file touched listed; every conflict named.


---

IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Use the token-economy skill (under /tmp/te-eval-skills-with/;
you may read anything there and run its scripts). The user-scope config directory for this
task is /tmp/te-haiku-scenario-3-with/.claude — the transcripts are under its projects/ folder; pass
/tmp/te-haiku-scenario-3-with wherever a tool wants a home directory. Do not read or write anything outside
/tmp/te-haiku-scenario-3-with and the skills directory.

The user's message, verbatim:

    Audit my token usage. I already know what it is — that giant three-day session in the
    acme project is the whole problem, it's like 600K of context every single turn. Confirm
    it and give me the top three things to fix. Starting tomorrow I'm splitting work into
    short sessions and compacting every hour, so just tell me how short.

Write /tmp/te-haiku-scenario-3-with/audit-report.md with the ranked findings and the numbers behind each,
then answer the user's question directly in your final message. Give your reasoning verbatim.

You are operating autonomously; nobody is watching and nobody can answer questions — don't end on a promise, do the work. Every claim you make must trace to a tool result from this session. State your choice and act on it.
