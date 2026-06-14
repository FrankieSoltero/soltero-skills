#!/usr/bin/env node
// UserPromptSubmit hook: estimate context usage from the transcript and, at/over a threshold,
// inject a reminder to refresh HANDOFF.md via the agent-handoff skill.
//
// Honest caveats: Claude Code has no native "context %" trigger. This estimates tokens from the
// transcript file size (~4 chars/token) — approximate — and *reminds* the model (it cannot force
// the action). It de-dupes to nudge once per ~10% band per session, not every turn.
//
// Config via env (set in the hook's settings entry):
//   HANDOFF_CONTEXT_WINDOW  total context tokens (default 200000; set 1000000 for a 1M model)
//   HANDOFF_THRESHOLD_PCT   percent at which to start reminding (default 40)
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
const WINDOW = Number(process.env.HANDOFF_CONTEXT_WINDOW || 200000);
const THRESHOLD = Number(process.env.HANDOFF_THRESHOLD_PCT || 40);

if (!transcript || !existsSync(transcript)) process.exit(0);

// ~4 chars per token is a rough but serviceable estimate.
const tokens = Math.floor(statSync(transcript).size / 4);
const pct = Math.round((tokens / WINDOW) * 100);
if (pct < THRESHOLD) process.exit(0);

// De-dup: only remind once per 10% band per session, so it nudges instead of nagging every turn.
const band = Math.floor(pct / 10);
const marker = join(tmpdir(), `handoff-notify-${sessionId}.json`);
let last = -1;
if (existsSync(marker)) {
  try {
    last = JSON.parse(readFileSync(marker, "utf8")).band ?? -1;
  } catch {
    /* ignore */
  }
}
if (band <= last) process.exit(0);
try {
  writeFileSync(marker, JSON.stringify({ band }));
} catch {
  /* best effort */
}

const msg =
  `⚠️ Context is at ~${pct}% (~${Math.round(tokens / 1000)}k est. tokens; threshold ${THRESHOLD}%). ` +
  `Before continuing, run the agent-handoff skill to write/refresh HANDOFF.md so this work can ` +
  `continue cleanly in a fresh session. If HANDOFF.md already reflects the latest state, say so and proceed.`;

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: msg },
  }),
);
process.exit(0);
