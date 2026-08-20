#!/usr/bin/env bash
# Install the soltero-skills scheduled runs (dev-debrief nightly, session-miner
# 1st/15th) as macOS launchd LaunchAgents, replacing the old crontab entries.
#
# WHY launchd, not cron: cron jobs run outside the user's login session, so a
# headless `claude -p` cannot read the Keychain-stored credentials and every run
# logs "Not logged in · Please run /login" (observed 2026-07-25 → 2026-08-20,
# 21 consecutive failures, zero debriefs). cron also silently drops runs missed
# while the Mac sleeps (session-miner never fired on Aug 1 / Aug 15). LaunchAgents
# run inside the GUI session (Keychain reachable) and fire missed
# StartCalendarInterval runs on wake.
#
# Usage:  scripts/install-schedules.sh            # install / reinstall + auth smoke test
#         scripts/install-schedules.sh --uninstall
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE="${CLAUDE_BIN:-$(command -v claude || echo "$HOME/.local/bin/claude")}"
AGENTS_DIR="$HOME/Library/LaunchAgents"
UID_NUM="$(id -u)"
JOBS=(dev-debrief session-miner)

mkdir -p "$HOME/.claude/logs" "$AGENTS_DIR"

if [[ "${1:-}" == "--uninstall" ]]; then
  for j in "${JOBS[@]}"; do
    launchctl bootout "gui/$UID_NUM/com.soltero-skills.$j" 2>/dev/null || true
    rm -f "$AGENTS_DIR/com.soltero-skills.$j.plist"
    echo "removed com.soltero-skills.$j"
  done
  exit 0
fi

[[ -x "$CLAUDE" ]] || { echo "claude binary not found at $CLAUDE (set CLAUDE_BIN)"; exit 1; }

for j in "${JOBS[@]}"; do
  tmpl="$HERE/scripts/launchd/com.soltero-skills.$j.plist.tmpl"
  dest="$AGENTS_DIR/com.soltero-skills.$j.plist"
  sed -e "s|__CLAUDE__|$CLAUDE|g" -e "s|__REPO__|$HERE|g" -e "s|__HOME__|$HOME|g" "$tmpl" > "$dest"
  plutil -lint "$dest"
  launchctl bootout "gui/$UID_NUM/com.soltero-skills.$j" 2>/dev/null || true
  launchctl bootstrap "gui/$UID_NUM" "$dest"
  echo "installed com.soltero-skills.$j"
done

# Retire the crontab entries this replaces (backup first).
if crontab -l >/dev/null 2>&1; then
  crontab -l > "$HOME/.claude/logs/crontab.backup.$(date +%Y%m%d%H%M%S)"
  crontab -l | grep -v -E "session-miner|dev-debrief" | crontab - || true
  echo "crontab: soltero-skills lines removed (backup in ~/.claude/logs/)"
fi

# Auth smoke test: this actually runs tonight's debrief now, so the proof that
# launchd can authenticate is a new Docs/debriefs/ entry (or skip-log line).
echo "=== $(date) launchd install smoke test ===" >> "$HOME/.claude/logs/dev-debrief.log"
launchctl kickstart "gui/$UID_NUM/com.soltero-skills.dev-debrief"
echo
echo "Kicked off dev-debrief. Verify in a few minutes:"
echo "  tail -f ~/.claude/logs/dev-debrief.log      # must NOT say 'Not logged in'"
echo "  ls Docs/debriefs/                           # new dated report or skip-log.md line"
echo "If it still says 'Not logged in', run 'claude setup-token' and add"
echo "CLAUDE_CODE_OAUTH_TOKEN to the EnvironmentVariables dict in both plists."
