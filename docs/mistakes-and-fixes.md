# Mistakes and Fixes

A running log of bugs, root causes, fixes, and lessons.

## 2026-07-24 — dev-debrief nightly cron produced no debrief, no skip-log, and no log file for 2 nights (7/22, 7/23) despite firing on schedule

- **Symptom:** dev-debrief nightly cron produced no debrief, no skip-log, and no log file for 2 nights (7/22, 7/23) despite firing on schedule
- **Root cause:** crontab redirects >> ~/.claude/logs/dev-debrief.log but ~/.claude/logs/ never existed; /bin/sh fails the redirect before executing, so claude never ran — the only evidence was bounce mail in /var/mail/$USER
- **Fix:** mkdir -p ~/.claude/logs (2026-07-24); same dir also serves the session-miner cron whose first fire is Aug 1
- **Lesson:** A cron entry that redirects output depends on the log directory existing — sh kills the whole command on a failed redirect, so the job looks installed but never runs; when a cron job leaves zero traces, check /var/mail/$USER first, and have installers mkdir -p the log dir in the crontab line itself
- **Regression test:** cron-install docs/snippets should use: mkdir -p ~/.claude/logs && <cmd> >> ~/.claude/logs/x.log 2>&1; verify tonight's 21:40 run writes Docs/debriefs/2026-07-24.md or skip-log
