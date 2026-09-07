#!/usr/bin/env node
// UserPromptSubmit hook: read the ACTUAL context usage already recorded in this session's own
// transcript and, at/over a threshold, inject a reminder to run /compact now.
//
// WHY THIS EXISTS (read before changing the thresholds below):
// Claude Code's built-in auto-compaction is NOT exposed as a configurable percentage/interval in
// settings.json — confirmed against this same install's own docs at
// /tmp/eval-skills/agent-handoff/reference.md ("Claude Code has no native context-%
// trigger. The compaction-aware events (PreCompact, SessionStart source=compact) fire only when
// auto-compaction is already happening, and the compaction threshold is not configurable.").
// So there is no real settings.json key that makes native auto-compaction "kick in earlier."
// This hook is the same documented workaround that skill uses for handoff reminders (see its
// hooks/context-watch.mjs), repointed at compaction, with one change: it does NOT use that
// script's "transcript bytes / 4" heuristic. Measured against this project's own transcripts
// (see /tmp/run-04-home/canary-report.md), that heuristic undercounts real usage by
// ~13x here (a 906,264-byte transcript => ~226,566-token estimate vs. an actual final usage total
// of 2,972,460 tokens) because on-disk message deltas are much smaller than the cached context
// (system prompt, tool defs, prior turns) the API is actually charged for per turn. Every Claude
// Code assistant transcript line already carries a real `usage` object
// ({input_tokens, cache_creation_input_tokens, cache_read_input_tokens}); this hook sums those
// three fields from the LAST assistant turn in the transcript to get the true context size for
// that turn, and only falls back to the byte heuristic if no usage data is found (e.g. the very
// first turn of a session, before any assistant reply exists yet).
//
// Config via env (set in the hook's settings entry):
//   COMPACT_CONTEXT_WINDOW  total context tokens for the model in use (default 1000000, sized for
//                           the "opus[1m]" model configured in this project's settings.json)
//   COMPACT_THRESHOLD_PCT   percent of window at which to start reminding (default 25)
import { readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const input = (() => {
  try {
    return JSON.parse(readStdin() || "{}");
  } catch {
    return {};
  }
})();

const transcript = input.transcript_path;
const sessionId = input.session_id || "unknown";
const WINDOW = Number(process.env.COMPACT_CONTEXT_WINDOW || 1000000);
const THRESHOLD = Number(process.env.COMPACT_THRESHOLD_PCT || 25);

if (!transcript || !existsSync(transcript)) process.exit(0);

// Walk the transcript backward looking for the most recent assistant turn's real usage object.
// Falls back to the byte/4 heuristic only if no usage data exists yet in the transcript.
function realTokensFromTranscript(path) {
  let lines;
  try {
    lines = readFileSync(path, "utf8").split("\n");
  } catch {
    return null;
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let d;
    try {
      d = JSON.parse(line);
    } catch {
      continue;
    }
    const usage = d?.message?.usage;
    if (usage) {
      const total =
        (usage.input_tokens || 0) +
        (usage.cache_creation_input_tokens || 0) +
        (usage.cache_read_input_tokens || 0);
      return total;
    }
  }
  return null;
}

let tokens = realTokensFromTranscript(transcript);
if (tokens == null) {
  // No usage data yet (e.g. first turn) — fall back to the approximate byte heuristic.
  tokens = Math.floor(statSync(transcript).size / 4);
}
const pct = Math.round((tokens / WINDOW) * 100);
if (pct < THRESHOLD) process.exit(0);

// De-dup: once per 10% band, and never more than MAX_REMINDERS times per session.
const MAX_REMINDERS = 2;
const band = Math.floor(pct / 10);
const marker = join(tmpdir(), `compact-notify-${sessionId}.json`);
let last = -1;
let sent = 0;
if (existsSync(marker)) {
  try {
    const prev = JSON.parse(readFileSync(marker, "utf8"));
    last = prev.band ?? -1;
    sent = prev.sent ?? 0;
  } catch {
    /* ignore */
  }
}
if (band <= last || sent >= MAX_REMINDERS) process.exit(0);
try {
  writeFileSync(marker, JSON.stringify({ band, sent: sent + 1 }));
} catch {
  /* best effort */
}

const msg =
  `This session has passed the configured early-compaction checkpoint (well before context gets ` +
  `unwieldy). Run /compact now to summarize and shrink the conversation before continuing — do ` +
  `not wait for the built-in auto-compaction, which triggers much later and is not ` +
  `user-configurable. After compacting, carry on with the task normally.`;

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: msg },
  }),
);
process.exit(0);
