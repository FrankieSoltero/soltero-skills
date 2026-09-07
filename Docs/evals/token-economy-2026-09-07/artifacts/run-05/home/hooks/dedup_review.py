#!/usr/bin/env python3
"""
UserPromptSubmit hook.

Purpose: address the review-0001..0040.jsonl pattern found in
usage-findings.md - 40 separate sessions, each a fresh, from-scratch
security review of the exact same unchanged file
(src/billing/invoice.ts), each paying its own ~72K-token cache-creation
Read plus repeated Grep calls (no cache carries over between sessions
because each review is a brand-new session). Total: ~29.5M tokens across
40 runs of a review whose answer ("No vulnerabilities found.") never
changed, because the file itself never changed.

This hook only acts on prompts that match the automated review template
("Review this change for security vulnerabilities" + a "Changed files"
list). For each listed file, it hashes the file's current on-disk content
and compares it to the hash recorded from the last time that same file was
reviewed. If the content is byte-identical to a review already on record,
the new review is redundant: the hook blocks it (exit 2) and points back
at the prior verdict instead of paying for the same review again. If the
file changed (or has never been reviewed), the review proceeds normally
and its result/hash is recorded for next time.

Ledger: .claude/hooks/state/review-ledger.json, keyed by absolute file
path -> {sha256, session_id, timestamp}. Delete an entry (or the whole
file) to force a fresh review of that file.
"""
import hashlib
import json
import os
import re
import sys
import time

STATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "state")
LEDGER_PATH = os.path.join(STATE_DIR, "review-ledger.json")

REVIEW_MARKER = "Review this change for security vulnerabilities"
FILE_LINE_RE = re.compile(r"^\s*-\s+(\S.*\S)\s*$")


def load_ledger():
    if os.path.exists(LEDGER_PATH):
        try:
            with open(LEDGER_PATH) as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_ledger(ledger):
    os.makedirs(STATE_DIR, exist_ok=True)
    with open(LEDGER_PATH, "w") as f:
        json.dump(ledger, f, indent=2)


def extract_files(prompt, cwd):
    files = []
    for line in prompt.splitlines():
        m = FILE_LINE_RE.match(line)
        if m:
            candidate = m.group(1).strip()
            path = candidate if os.path.isabs(candidate) else os.path.join(cwd, candidate)
            files.append((candidate, path))
    return files


def sha256_of(path):
    try:
        with open(path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception:
        return None


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    prompt = payload.get("prompt", "") or ""
    cwd = payload.get("cwd", "") or os.getcwd()
    session_id = payload.get("session_id", "unknown")

    if REVIEW_MARKER not in prompt:
        return 0

    files = extract_files(prompt, cwd)
    if not files:
        return 0

    ledger = load_ledger()
    redundant = []
    to_record = {}

    for display_name, path in files:
        digest = sha256_of(path)
        if digest is None:
            continue  # can't hash it (missing/unreadable) - let the review run normally
        prior = ledger.get(path)
        if prior and prior.get("sha256") == digest:
            redundant.append((display_name, prior))
        else:
            to_record[path] = {
                "sha256": digest,
                "session_id": session_id,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }

    # Only block if EVERY listed file is an exact repeat of a prior review.
    if files and len(redundant) == len(files):
        lines = [
            "[dedup-review] Every file in this review request is byte-identical "
            "to a file already reviewed for security vulnerabilities:",
        ]
        for name, prior in redundant:
            lines.append(
                f"  - {name}: unchanged since session {prior.get('session_id')} "
                f"at {prior.get('timestamp')}"
            )
        lines.append(
            "Blocked as a redundant review (see usage-findings.md: 40 identical "
            "review sessions on this file cost ~29.5M tokens for the same "
            "unchanged content). Re-run only after the file actually changes, "
            "or delete the matching entry in "
            ".claude/hooks/state/review-ledger.json to force a re-review."
        )
        sys.stderr.write("\n".join(lines) + "\n")
        return 2

    # Not fully redundant (new file, or something changed) - record the
    # files we're about to actually review and let it proceed.
    if to_record:
        ledger.update(to_record)
        save_ledger(ledger)

    return 0


if __name__ == "__main__":
    sys.exit(main())
