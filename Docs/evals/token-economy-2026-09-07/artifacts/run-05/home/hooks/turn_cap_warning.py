#!/usr/bin/env python3
"""
PreToolUse hook (matcher ".*").

Purpose: address the single biggest cost driver found in usage-findings.md
- orch-0001.jsonl (400 turns, one never-compacted main-chain session,
  cache_read climbing from ~20K to ~2.97M tokens per turn by the end:
  ~600M tokens total, ~90% of everything sampled) and
- compact-0001.jsonl (150 turns, one never-compacted session, cache_read
  climbing to ~423K tokens per turn: ~34M tokens total, ~5% of everything
  sampled).

Both sessions ran for hours without ever compacting, so every single turn
re-paid for the entire accumulated history. This hook cannot force a
compaction itself, but it can stop the session ONCE, the first time it
crosses a turn-count threshold, and tell the agent/user to run `/compact`
(or start a fresh session) before continuing - a single actionable nudge
that fires exactly once per session (never again, so it can't deadlock a
session that ignores or can't act on the advice).

Turn count is read from the transcript file Claude Code already passes in
as `transcript_path` - this hook does not maintain its own turn counter.
"""
import json
import os
import sys

STATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "state")
TURN_THRESHOLD = 50  # assistant turns before the one-time nudge fires


def count_assistant_turns(transcript_path):
    if not transcript_path or not os.path.exists(transcript_path):
        return 0
    count = 0
    try:
        with open(transcript_path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    d = json.loads(line)
                except Exception:
                    continue
                if d.get("type") == "assistant":
                    count += 1
    except Exception:
        return 0
    return count


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    session_id = payload.get("session_id", "unknown")
    transcript_path = payload.get("transcript_path", "")

    os.makedirs(STATE_DIR, exist_ok=True)
    marker_path = os.path.join(STATE_DIR, f"turncap-{session_id}.fired")
    if os.path.exists(marker_path):
        return 0  # already nudged this session once; never block again

    turns = count_assistant_turns(transcript_path)
    if turns < TURN_THRESHOLD:
        return 0

    # Fire once.
    with open(marker_path, "w") as f:
        f.write(str(turns))

    sys.stderr.write(
        f"[turn-cap] This session has reached {turns} assistant turns "
        "without compacting. Uncompacted long sessions were the largest "
        "single cost driver found in usage-findings.md (a 400-turn session "
        "and a 150-turn session together accounted for the large majority "
        "of tokens sampled, because every turn re-pays for the entire "
        "accumulated history). Run /compact now, or wrap up and start a "
        "fresh session for the next chunk of work, before continuing. "
        "(This is a one-time nudge - it will not block again this "
        "session.)\n"
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
