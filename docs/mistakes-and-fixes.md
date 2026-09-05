# Mistakes and Fixes

A running log of bugs, root causes, fixes, and lessons.

## 2026-08-21 — all three cloud routines (skill-gardener, memory-gardener, skill-patcher) failed every fire since creation; the routine objects themselves were broken

- **Symptom:** Aug 1 / Aug 8 / Aug 15 fires each ended `error_during_execution turns=0` ~3 s after "Claude Code process started"; a manual `run` on Aug 21 hung at the same point with zero events. No PRs, no reports, for a month.
- **Root cause:** not the repo, model, tools, or MCP connectors — four fresh one-off routines (minimal config; sonnet + Task/Agent; opus-5 + basic tools; opus-5 + the exact gardener tool list) all ran fine, and a fresh copy of the gardener with its verbatim prompt ran the full audit. Only the July-21-created routine objects fail (their runs still say "Cloning repository" where current runs say "Fetching" — the platform changed underneath them and the old records did not survive it).
- **Fix:** recreated the three routines with identical prompts/schedules (`trig_016dfZWZF9QNdoxXp3RGcdhn` gardener `7 13 1 * *`, `trig_01JEndZ4JEe8RusaVWQVw3hg` memory-gardener `11 13 8 * *`, `trig_019MmZYBMebpkyXhRpspRMpE` patcher `13 13 15 * *`); disabled and renamed the stale ones `[STALE … delete]` (delete is UI-only at claude.ai/code/routines). Verified with a one-off copy that completed the real audit.
- **Lesson:** "the routine fired" proves nothing — check `list_runs` → `get_run_log` for `init:` and `turns>0` after every new or migrated routine, and bisect with cheap `run_once_at` copies before touching the repo; when a fresh copy of the identical config works, recreate rather than debug the old object.
- **Regression test:** on Sep 1 the gardener run log shows `init: model=claude-opus-5` and a `chore: skill-garden report 2026-09` PR appears.

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

## 2026-09-02 — Re-ran tests/scenarios/agent-swarm/fixtures/setup-workspaces.sh (to add a canary fixture) while three GREEN scenario subagents were still working in /tmp/acme-crm, /tmp/acme-shop, /tmp/acme-billing; the script's rm -rf wiped their workspaces mid-run

- **Symptom:** Re-ran tests/scenarios/agent-swarm/fixtures/setup-workspaces.sh (to add a canary fixture) while three GREEN scenario subagents were still working in /tmp/acme-crm, /tmp/acme-shop, /tmp/acme-billing; the script's rm -rf wiped their workspaces mid-run
- **Root cause:** Scenario fixture builders are destructive by design (rm -rf + rebuild, so every batch starts clean) and they are shared across the RED, GREEN and A/B phases; nothing stopped a rebuild from being triggered while a batch was live
- **Fix:** Waited for the runs to finish, inspected the surviving artifacts, re-dispatched any run whose deliverables were lost; the A/B builder (setup-ab-workspaces.sh) now copies per-arm workspaces so each run has its own directory
- **Lesson:** A fixture builder that rm -rf's a workspace is a destructive op against a possibly-live target: never run it while any subagent batch is in flight, and add new fixtures in a separate script (or behind a flag) rather than appending them to the shared builder and re-running the whole thing
- **Regression test:** Fixture builders refuse to rebuild a workspace that has a <workspace>/swarm/ or other in-progress marker unless --force is passed

## 2026-09-02 — swarm-plan.mjs and dispatch-contract's validate-brief.mjs exit 0 with no output when invoked through /tmp/... on macOS (found by an A/B baseline run that had to re-invoke via /private/tmp/... to get a verdict)

- **Symptom:** swarm-plan.mjs and dispatch-contract's validate-brief.mjs exit 0 with no output when invoked through /tmp/... on macOS (found by an A/B baseline run that had to re-invoke via /private/tmp/... to get a verdict)
- **Root cause:** The CLI main-guard compares fileURLToPath(import.meta.url) (already symlink-resolved to /private/tmp/...) with process.argv[1] (the literal /tmp/... the caller typed); they differ, so main() never runs and the process exits 0 — a silent no-op that looks like PASS to anything checking only the exit code
- **Fix:** Compare realpathSync() of both sides in the main-guard (skills/agent-swarm/scripts/swarm-plan.mjs, skills/dispatch-contract/scripts/validate-brief.mjs) and cover the symlinked-invocation path in each script's test
- **Lesson:** Never gate a CLI's main() on a string equality between import.meta.url and argv[1]; resolve both with realpathSync (or drop the guard for bin-style scripts). A guard that fails closed to 'do nothing, exit 0' is the worst possible failure for a validator — pair every such script with a test that invokes it through a symlinked path
- **Regression test:** swarm-plan.test.mjs / validate-brief.test.mjs: spawn the script via a symlinked directory and assert the verdict line appears and the exit code is non-zero on a failing input

## 2026-09-05 — docs-standardizer RED fixture seeded a docs/ vs Docs/ docs-root clash; on macOS both names resolved to one directory, so two of three baseline agents reported 'identical duplicate content' and the clash under test never existed

- **Symptom:** docs-standardizer RED fixture seeded a docs/ vs Docs/ docs-root clash; on macOS both names resolved to one directory, so two of three baseline agents reported 'identical duplicate content' and the clash under test never existed
- **Root cause:** APFS is case-insensitive by default: mkdir docs then writing Docs/notes.md lands in docs/. The fixture, the inventory script's existsSync path checks, and the Makefile/makefile manifest lookup all assumed a case-sensitive tree
- **Fix:** Stray root renamed to doc/ (distinct name); case-only mismatch with the standard's root made its own verifier finding (DOCS_ROOT_CASE, resolved by a recorded project override, not a rename); path claims resolved case-exactly via readdirSync per segment; manifest lookup matches exact names from readdirSync
- **Lesson:** Any fixture or checker that distinguishes paths by case must resolve each segment against readdirSync, never existsSync — a macOS run must report what a Linux checkout would see, and a case-only clash is not a valid fixture on the author's own machine
- **Regression test:** docs-verify.test.mjs: a doc citing docs/architecture.md and SRC/app.js against Docs/ and src/ yields 2 PATH_MISSING on any filesystem
