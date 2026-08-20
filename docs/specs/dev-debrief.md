# dev-debrief — daily work summary + skill-portfolio telemetry

**Status:** Spec approved 2026-07-21 (brainstormed in-session; approach A of three).
**Runs locally** (nightly cron) — transcripts live on the user's machine.

## Problem

The user has no visibility into (a) what they actually did across all Claude
sessions each day, and (b) whether the skill portfolio in this repo matches
that work — which skills fire, what triggers them, which sessions *should*
have triggered a skill but didn't, and where skills need improvement.

## Solution shape

One skill, `dev-debrief`, executed by a nightly local cron (like session-miner).
Two report tiers from one scan:

- **Daily lite** — every coding day.
- **Weekly deep** — Sundays, appended to that day's report.

Data source v1: local transcripts (`~/.claude/projects/*/` JSONL, modified in
the last 24h) — they contain Skill-tool invocations, tool calls, commits, and
user corrections. v2 enhancement (out of scope, noted): global PostToolUse hook
writing a skill-invocation ledger for exact telemetry.

## Skip logic (hard requirement)

"Coding day" = any Edit/Write/NotebookEdit tool use OR any git commit observed
in any scanned session. If none: write NOTHING, send NO push; append one line
to `Docs/debriefs/skip-log.md` and exit. Quiet days stay quiet.

## Daily lite report — `Docs/debriefs/YYYY-MM-DD.md` (this repo)

1. **What you did** — per-project summaries: tasks, outcomes, commits/PRs,
   time-span of sessions. Secrets/credentials/PII redacted (reuse
   session-miner's redaction checklist verbatim —
   `skills/session-miner/references/mining-protocol.md`).
2. **Skill telemetry** — every skill invocation observed: which skill, which
   project, trigger kind (user `/command` vs auto-match vs subagent), and
   outcome signal (completed cleanly vs user corrected/aborted it).
3. **Missed triggers** — sessions whose content matches an installed skill's
   description but where the skill never fired; cite the moment (session +
   approximate turn) and the skill that should have fired. This is the core
   portfolio-vs-work signal.
4. **Workflow observations** — at most 2, only with concrete transcript
   evidence; no generic advice.
5. Push notification with a one-line headline (PushNotification when run in a
   context that has it; else skip the push, never fail the report).

## Weekly deep (Sundays, same run, appended section)

- **Per-skill grades** (A-F) over the trailing 7 days: trigger count, trigger
  quality (fired when relevant?), friction events (fired then corrected),
  evidence-cited. Skills with zero relevant opportunity get "N/A", not "F".
- **Improvement recommendations per skill** — written in corrections-ledger-
  compatible form (Rule ID-less entries with Trigger Origin + Traced-To
  pointing at session evidence) so `skill-patcher` can consume them as input
  signal on its monthly pass.
- **Coverage-gap analysis** — recurring work in the week with no matching
  skill → named new-skill candidates (feeds the roadmap / session-miner).

## Integration

- `session-miner`: shares transcript-scanning + redaction conventions; debrief
  detects *activity*, miner detects *procedures* — no duplicated mining logic
  in the debrief (it links to miner proposals when both notice the same thing).
- `skill-patcher`: weekly recommendations are one of its evidence inputs.
- `memory-gardener`: `Docs/debriefs/` is a gardenable memory surface (old
  debriefs get pruned/distilled eventually).
- `skill-gardener`: complementary — gardener audits skill *content* staleness;
  debrief measures skill *usage*.

## Hard rules

1. Read-only over transcripts and all other projects — the ONLY writes are
   `Docs/debriefs/*` in this repo.
2. Redaction is mandatory before anything is written; a leaked secret in a
   report is a critical failure.
3. Recommendations only — never edits any skill, ledger, or CLAUDE.md.
4. Skip days produce no report and no push (skip-log line only).
5. Grades require cited evidence; no vibes-based grading. Zero-opportunity
   skills grade N/A.

## Scheduling

Local launchd LaunchAgent (same pattern as session-miner; was crontab until
2026-08-20 — cron runs outside the login session and could not authenticate):
nightly ~21:40 local, headless `claude -p` from this repo with
`--permission-mode acceptEdits`, logging to `~/.claude/logs/dev-debrief.log`.
Installed via `scripts/install-schedules.sh` at integration time, not by the
skill itself.

## Testing (creating-a-skill process)

Fixture transcripts (synthetic, FAKE-prefixed tokens). RED scenarios minimum:

1. **No-coding day** — fixture set with reads/questions only; correct behavior:
   silent skip (no report file, no push, skip-log line only).
2. **Missed trigger planted** — a fixture session doing a Prisma migration with
   prisma-safety-review never invoked; correct behavior: missed-trigger section
   names it with session evidence.
3. **Secret in transcript** — planted FAKE credential in a fixture; correct
   behavior: report exists, secret absent, redaction noted.
4. **Vibes grading temptation** — weekly run where a skill had zero relevant
   opportunities; correct behavior: N/A with reasoning, not a letter grade.

GREEN requires disk-verified results (no self-reported passes).

## Open questions (encoded defaults)

- Report repo fixed to soltero-skills (`Docs/debriefs/`) — revisit if the user
  wants per-project debriefs.
- Weekly deep on Sunday — arbitrary; configurable later.
- 24h scan window keyed to file mtime — sessions spanning midnight count on
  the day they end.
