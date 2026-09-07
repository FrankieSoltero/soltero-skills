#!/usr/bin/env python3
"""
PreToolUse hook (matcher ".*").

Purpose: stop the "stuck retry loop" pattern found in usage-findings.md
(short-1..5.jsonl): an agent re-running the exact same Bash command over
and over (e.g. `npm test`) with no Edit/Write in between, burning a growing
cache_read on every turn while making zero progress.

Behavior:
  - Any Edit / Write / NotebookEdit tool use resets the loop counter for the
    session (a real change was made, so a follow-up re-run of the same
    command is legitimate).
  - A Bash tool use with the same `command` string as the immediately
    preceding Bash call increments a per-session counter.
  - On the 3rd consecutive identical Bash command (i.e. it would be run a
    3rd time with nothing having changed), the call is blocked (exit 2).
    Blocking feeds the stderr message back to the agent so it can change
    approach instead of continuing to retry blindly.

State is kept per session_id under .claude/hooks/state/loop-<session_id>.json
so this hook is self-contained and does not depend on any other tool.
"""
import json
import os
import sys

STATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "state")
REPEAT_LIMIT = 3  # block on the Nth consecutive identical Bash call


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    session_id = payload.get("session_id", "unknown")
    tool_name = payload.get("tool_name", "")
    tool_input = payload.get("tool_input", {}) or {}

    os.makedirs(STATE_DIR, exist_ok=True)
    state_path = os.path.join(STATE_DIR, f"loop-{session_id}.json")

    state = {"last_command": None, "repeat_count": 0}
    if os.path.exists(state_path):
        try:
            with open(state_path) as f:
                state = json.load(f)
        except Exception:
            pass

    if tool_name in ("Edit", "Write", "NotebookEdit"):
        # A real change happened; any prior repeat streak no longer applies.
        state = {"last_command": None, "repeat_count": 0}
        with open(state_path, "w") as f:
            json.dump(state, f)
        return 0

    if tool_name != "Bash":
        return 0

    command = tool_input.get("command", "")

    if command and command == state.get("last_command"):
        state["repeat_count"] = state.get("repeat_count", 0) + 1
    else:
        state["last_command"] = command
        state["repeat_count"] = 1

    with open(state_path, "w") as f:
        json.dump(state, f)

    if state["repeat_count"] >= REPEAT_LIMIT:
        sys.stderr.write(
            f"[loop-guard] This exact command has now been requested "
            f"{state['repeat_count']} times in a row with no Edit/Write in "
            f"between:\n  {command}\n"
            "Blocked to stop a runaway retry loop (see "
            "usage-findings.md, short-1..5 pattern: identical `npm test` "
            "reruns burned ~1.9M tokens across 5 sessions with zero fixes "
            "applied). Diagnose why it is failing (read the actual error, "
            "inspect the relevant source file) and make an Edit before "
            "retrying, or stop and report the blocker instead of "
            "re-running the same command again.\n"
        )
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
