# Dev Debrief — Scan Protocol

## Sources and window

- **Transcript root:** `~/.claude/projects/` — one subdirectory per project (sanitized
  absolute path as the directory name), one JSONL file per session. An invoking prompt
  may supply an alternate root (tests, fixtures); everything else is unchanged.
- **Daily window:** files with mtime within the last 24 hours. Keyed to file mtime by
  design — a session spanning midnight counts on the day it ends.
- **Weekly window (Sundays):** files with mtime within the trailing 7 days, loaded only
  for the deep section. The daily sections still use the 24h window.
- **Installed portfolio:** the report repo's `skills/*/SKILL.md` frontmatter
  (`name` + `description`), plus plugin skills visible in the session's
  available-skills listing when present.
- Delegate the per-project scans to read-only subagents on a cheap model — one per
  project — and merge their extractions in the orchestrating run. That is the default
  past a couple of projects; keep merging what has come back rather than waiting on each
  subagent in turn. Subagents inherit every hard rule — read-only, no writes anywhere.

## JSONL shapes

Lines are JSON objects. The shapes that matter:

| Line | Relevant content |
|---|---|
| `{"type":"user", ...}` | user text — requests, corrections, confirmations; `/command` invocations |
| `{"type":"assistant", ...}` | `content[]` with `text` and `tool_use` blocks (`name`, `input`) |
| `{"type":"tool_result", ...}` | command output — commit lines, test results, skill-launch banners |

Timestamps order events within a session; the first/last timestamps give the session's
time-span for the what-you-did summary.

## Coding-day gate (run before drafting anything)

A **coding day** = at least one of the following anywhere in the daily window, across
all projects:

- a `tool_use` with `name` in {`Edit`, `Write`, `NotebookEdit`}, or
- a git commit: a Bash `tool_use` whose command invokes `git commit` with a
  `tool_result` showing `[<branch> <hash>] <message>` (or equivalent commit evidence).

Reads, greps, web searches, explanations, and Q&A — however substantial — are not
coding signals. If the gate fails: append the skip-log line (format in
`report-format.md`), write no report, send no push, exit.

## Skill-invocation extraction

An invocation is either:

- a `tool_use` with `name == "Skill"` (`input.skill` names the skill), or
- a user message invoking a slash command (`/skill-name …`) that the harness expands
  (a `<command-name>` block or launch banner in the following lines).

**Trigger kind** (every telemetry row carries exactly one):

| Kind | Transcript evidence |
|---|---|
| `user-command` | the preceding user message is/contains the explicit `/command` |
| `user-request` | the user asked for the behavior in prose; the assistant invoked the matching skill |
| `auto-match` | no user prompt for it — the assistant invoked mid-flow because the situation matched the description |
| `subagent` | the invocation appears inside a dispatched subagent's activity, not the top-level session |

**Outcome signal** (every telemetry row carries exactly one):

| Outcome | Transcript evidence |
|---|---|
| `completed-clean` | skill's work finished; no subsequent user pushback; any success signal (tests/commit/user thanks) |
| `user-corrected` | a user message redirects or reins in the skill's behavior mid-run ("no, don't rewrite…") |
| `aborted` | the run stops before the skill's work completes (user stop, error, abandonment) |
| `unclear` | none of the above is determinable — say so rather than guessing |

## Missed-trigger detection

For each session in the daily window, compare what the session *did* against each
installed skill's frontmatter description:

- Flag only **clear matches**: the session's activity is what the description's own
  trigger clause names (e.g. schema + `prisma migrate` work vs "writing Prisma schema,
  migrations"), and the skill was never invoked in that session.
- Cite the session file and the approximate turn/timestamp of the matching activity,
  and quote the matched description phrase.
- Stretched matches ("arguably this was kind of a handoff") are noise — omit them.
- Findings are recommendations only (Hard Rule 3): name the miss, suggest where the
  fix should route (`creating-a-skill` gates, `skill-patcher` evidence), change nothing.

## Redaction (before any text is written)

Apply session-miner's checklist **verbatim** —
`skills/session-miner/references/mining-protocol.md`, "Redaction checklist":
`<REDACTED_TOKEN>` / `<REDACTED_SECRET>`, `<EMAIL>` (the whole address — never keep the
local part), `<NAME>`, `<INTERNAL_HOST>`, `<ACCOUNT_ID>`. Then the debrief-specific
rule: **no maps to secrets** — the report never names the file, env var, or location
holding a live credential, and never says "see X for the real value". Sweep the
finished report with the checklist's grep pass (`Bearer `, `sk_`, `ghp_`, `AKIA`,
`-----BEGIN`, `@` in arguments), then re-read once for prose-embedded PII.

## Push notification

After the report is written (never before): if the running context exposes a notification
tool — check the actual available tools, deferred ones included, rather than assuming one
exists — send one line: `Dev debrief YYYY-MM-DD: <n> projects, <m> skill invocations, <k>
missed triggers`. Headless runs normally expose none; skip silently then, as on a failed
send. The push never gates, delays, or fails the report; skip days push nothing.

## Scheduling (documented here; installed at integration time, never by this skill)

Nightly **launchd LaunchAgent** (not cron), same pattern as session-miner — headless
`claude -p` from this repo, accept-edits permission mode, appending to a log. Install
with `scripts/install-schedules.sh` (templates in `scripts/launchd/`); it also
kick-starts one run as an auth smoke test.

Why not cron: cron jobs run outside the user's login session, so `claude -p` cannot
reach Keychain-stored credentials and every run logs `Not logged in · Please run
/login` (observed 2026-07-25 → 2026-08-20, 21 failures, zero reports). cron also
drops runs missed while the Mac sleeps; launchd fires them on wake. The skill itself
never installs, edits, or removes LaunchAgents or crontab entries.
