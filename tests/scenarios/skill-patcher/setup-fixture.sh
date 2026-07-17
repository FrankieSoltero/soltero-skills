#!/usr/bin/env bash
# Usage: setup-fixture.sh <1|2|3> <target-parent-dir>
# Copies the scenario fixture repo into <target-parent-dir> and initializes git,
# so a fresh subagent can be dispatched on the scenario prompt verbatim.
set -euo pipefail

SCENARIO="${1:?scenario number (1|2|3) required}"
TARGET_PARENT="${2:?target parent dir required (e.g. /tmp/sp-s1)}"
HERE="$(cd "$(dirname "$0")" && pwd)"

case "$SCENARIO" in
  1) NAME="acme-agent-stack" ;;
  2) NAME="nimbus-agents" ;;
  3) NAME="orbit-stack" ;;
  *) echo "unknown scenario: $SCENARIO" >&2; exit 1 ;;
esac

DEST="$TARGET_PARENT/$NAME"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$HERE/fixtures/scenario-$SCENARIO/." "$DEST/"
git -C "$DEST" init -q -b main
git -C "$DEST" add -A
git -C "$DEST" -c user.name=fixture -c user.email=fixture@example.com \
  commit -qm "fixture: initial state"
echo "$DEST"
