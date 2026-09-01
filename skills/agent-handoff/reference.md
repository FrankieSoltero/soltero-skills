# Agent Handoff — Reference

## The auto-trigger hook (opt-in)

`hooks/context-watch.mjs` is a `UserPromptSubmit` hook. On every turn it reads the transcript the
hook receives, estimates token usage (size ÷ ~4), and — at/over the threshold — emits a
`UserPromptSubmit` `additionalContext` reminder telling the model to run `agent-handoff`. It
de-dupes to one reminder per ~10% band and at most two reminders per session. The
reminder deliberately carries no percentage or token count — a rendered budget countdown
is a known trigger for premature wrap-up — only the instruction to refresh HANDOFF.md and
carry on.

### Why this design (and its limits)

Claude Code has **no native context-% trigger**. The compaction-aware events (`PreCompact`, and
`SessionStart` with source `compact`) fire only when auto-compaction is already happening, and
the compaction threshold is not configurable. So this
hook is the most reliable approximation: it runs every turn, estimates usage, and injects a
reminder. Limits to accept: the token count is **estimated** (transcript bytes ÷ 4, not the API's
tokenizer), the reminder is injected for the **next** model turn, and it **reminds** rather than
**forces** — the model still has to act on it.

### Enable it (user settings)

Copy the script somewhere stable and add a `UserPromptSubmit` hook in `~/.claude/settings.json`:

```jsonc
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/context-watch.mjs",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Tune with env on the same entry (defaults: window 200000, threshold 40):

```jsonc
{ "type": "command",
  "command": "HANDOFF_CONTEXT_WINDOW=1000000 HANDOFF_THRESHOLD_PCT=40 node ~/.claude/hooks/context-watch.mjs",
  "timeout": 10 }
```

> Set `HANDOFF_CONTEXT_WINDOW` to match the model you actually run: on a 1M-context model,
> 40% is ~400K tokens, so leaving the 200000 default makes the estimate pass 100% early and
> the reminder fire far sooner than intended (the script caps it at two reminders per session
> so a mismatch degrades to a nudge rather than a cadence). Lower `HANDOFF_THRESHOLD_PCT` if
> you want to hand off earlier.

### Enable it (as a plugin hook)

If shipping it enabled with a plugin, reference it via `${CLAUDE_PLUGIN_ROOT}` in the plugin's
`hooks/hooks.json` and point at `${CLAUDE_PLUGIN_ROOT}/skills/agent-handoff/hooks/context-watch.mjs`.
Prefer the opt-in user-settings path above for a shared library, so installers aren't forced into
a per-turn hook.

### Output contract

On exit 0 the script prints either nothing (under threshold / de-duped) or:

```json
{ "hookSpecificOutput": { "hookEventName": "UserPromptSubmit", "additionalContext": "This session has passed the configured handoff checkpoint. You have ample context remaining: … run the agent-handoff skill to write or refresh HANDOFF.md …, then carry on with the task. …" } }
```

`additionalContext` is appended to the model's input for the turn. (For `UserPromptSubmit`, plain
stdout is also injected as context, so a bare reminder string works too.)

### Verify the hook

```bash
echo '{"session_id":"t","transcript_path":"/path/to/a/large.jsonl"}' | \
  HANDOFF_CONTEXT_WINDOW=1000 HANDOFF_THRESHOLD_PCT=1 node hooks/context-watch.mjs
# -> prints the additionalContext JSON when the estimate clears the threshold
```
