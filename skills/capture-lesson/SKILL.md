---
name: capture-lesson
description: Use when you just fixed a bug, resolved an incident, or discovered a non-obvious gotcha — records a structured lesson in Docs/mistakes-and-fixes.md so the same mistake doesn't recur.
---

# Capture Lesson

## Overview

A fix isn't done when the tests pass — it's done when the lesson is captured. Right after
fixing a bug or hitting a gotcha, append a structured entry to `Docs/mistakes-and-fixes.md`
using the bundled script, so the knowledge survives past this session.

## When to Use

- Immediately after a bug fix, incident resolution, or discovering a non-obvious gotcha.
- Even when you're moving straight to the next task, even for "small" fixes, even when tired.

## When NOT to Use

- Routine feature work with no surprising failure or lesson.

## How

Run the bundled script (it creates `Docs/mistakes-and-fixes.md` if missing and keeps every
entry in the same format):

```bash
node ${CLAUDE_SKILL_DIR}/scripts/append-lesson.mjs \
  --symptom "<one line: what went wrong>" \
  --cause "<root cause>" \
  --fix "<what fixed it>" \
  --lesson "<the generalizable takeaway>" \
  --test "<a regression test idea, or omit>"
```

If the lesson warrants a regression test, scaffold it now (don't defer) — see `reference.md`.

This file is read by future sessions, so keep it worth reading. Before appending, skim the
existing entries: if one already covers this root cause, edit that entry in place instead of
adding a near-duplicate, and note the new occurrence there. Don't record what the repo or the
commit history already states plainly — the entry earns its place by carrying the lesson, not
the event. If an entry is later proven wrong, delete it rather than leaving it to teach the
next session the wrong thing.

## Red Flags — STOP

| Thought | Reality |
|---------|---------|
| "Tests pass, I'm done." | The lesson is still uncaptured. Run the script first. |
| "It's a small fix, not worth logging." | Small recurring bugs cost the most. Log it. |
| "I'll document it tomorrow." | Tomorrow's context is gone. Capture it now. |
| "A code comment is enough." | Comments aren't searchable across the project's history. Log it. |
