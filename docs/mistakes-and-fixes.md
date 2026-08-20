# Mistakes and Fixes

A running log of bugs, root causes, fixes, and lessons.

## 2026-08-20 — dev-debrief cron fired nightly for 4 weeks but every run failed "Not logged in"; session-miner cron never fired at all

- **Symptom:** `~/.claude/logs/dev-debrief.log` holds 21 lines of `Not logged in · Please run /login` (2026-07-25 → 2026-08-20); zero debriefs after 2026-07-22. `~/.claude/logs/session-miner.log` never created despite Aug 1 / Aug 15 schedule.
- **Root cause:** cron jobs run outside the macOS login session, so headless `claude -p` cannot read the Keychain-stored OAuth credentials. Separately, cron silently drops runs missed while the Mac is asleep (9:23am biweekly slot).
- **Fix:** migrated both jobs to launchd LaunchAgents (`scripts/launchd/*.plist.tmpl`, installer `scripts/install-schedules.sh`); LaunchAgents run inside the GUI session and fire missed calendar runs on wake. Installer removes the old crontab lines (backup kept) and kick-starts one debrief as an auth smoke test.
- **Lesson:** "the cron fired" is not "the job ran" — a headless `claude -p` needs the login session's Keychain; schedule it with launchd (or a `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`), and make the smoke test the real output artifact, not the exit code.
- **Regression test:** after install, `tail ~/.claude/logs/dev-debrief.log` shows no `Not logged in` and `docs/debriefs/` gains a dated report or skip-log line the same day.

## 2026-07-24 — dev-debrief nightly cron produced no debrief, no skip-log, and no log file for 2 nights (7/22, 7/23) despite firing on schedule

- **Symptom:** dev-debrief nightly cron produced no debrief, no skip-log, and no log file for 2 nights (7/22, 7/23) despite firing on schedule
- **Root cause:** crontab redirects >> ~/.claude/logs/dev-debrief.log but ~/.claude/logs/ never existed; /bin/sh fails the redirect before executing, so claude never ran — the only evidence was bounce mail in /var/mail/$USER
- **Fix:** mkdir -p ~/.claude/logs (2026-07-24); same dir also serves the session-miner cron whose first fire is Aug 1
- **Lesson:** A cron entry that redirects output depends on the log directory existing — sh kills the whole command on a failed redirect, so the job looks installed but never runs; when a cron job leaves zero traces, check /var/mail/$USER first, and have installers mkdir -p the log dir in the crontab line itself
- **Regression test:** cron-install docs/snippets should use: mkdir -p ~/.claude/logs && <cmd> >> ~/.claude/logs/x.log 2>&1; verify tonight's 21:40 run writes Docs/debriefs/2026-07-24.md or skip-log
