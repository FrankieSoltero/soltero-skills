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

// De-dup: once per 10% band, and never more than MAX_REMINDERS times per session. The cap
// matters when HANDOFF_CONTEXT_WINDOW is smaller than the session's real window (e.g. the
// 200000 default on a 1M-context model): pct then runs far past 100, every band clears the
// check, and the same instruction gets re-injected every few turns.
const MAX_REMINDERS = 2;
const band = Math.floor(pct / 10);
const marker = join(tmpdir(), `handoff-notify-${sessionId}.json`);
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

// The percentage stays internal (threshold + de-dup band). Rendering a remaining-budget
// count into the model's context is a known trigger for premature wrap-up, so the reminder
// says what to do and explicitly rules out stopping.
const msg =
  `This session has passed the configured handoff checkpoint. You have ample context ` +
  `remaining: do not stop, summarize, wrap up early, or suggest a new session on account of ` +
  `context limits. At the next natural break, run the agent-handoff skill to write or refresh ` +
  `HANDOFF.md so this work stays resumable, then carry on with the task. If HANDOFF.md already ` +
  `reflects the latest state, say so and keep going.`;

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: msg },
  }),
);
process.exit(0);
