---
name: lesson-recall
description: Use at the start of a task the project may have already failed at — before lean-debugging opens an investigation, before lean-brainstorming designs anything, before any implementation code — and whenever the user says a problem "keeps happening", "we've hit this before", "this date thing again", "didn't we already fix this", or "we have run into this issue like 15 times how have we not universalized this yet". Runs the bundled matcher over Docs/mistakes-and-fixes.md and the auto-memory index, reports the ranked prior lessons with their recorded fix and a per-class recurrence count before any new investigation starts, flags a recorded fix that a later entry superseded, and at three or more occurrences of one class hands off to soltero-skills:correction-compiler instead of hand-fixing the same bug again. Read-only — it never writes, edits, prunes, or merges a lesson.
---

# Lesson Recall

## Overview

This project already writes down what it learns. `capture-lesson` appends to
`Docs/mistakes-and-fixes.md`, `memory-gardener` curates it, `correction-compiler` compiles
repeated corrections into enforcement. Nothing reads any of it back at the moment the same
mistake is about to be made again — which is how a bug gets diagnosed for the fifth time and
how "we have run into this issue like 15 times how have we not universalized this yet"
happens.

**Recall before investigation.** The store is consulted first, mechanically, and what it says
is reported before any new work starts. Write-only memory is not neutral — TACO's ablation has
a rule pool that, when it is written but never consulted, drops accuracy *below* the no-memory
baseline (`agent-playbook/references/playbook.md:1688`); the read half is what makes the
write half pay (`playbook.md:1668`, Proven).

## When to Use

- At the top of any bug, test failure, or unexpected behavior — before `lean-debugging`.
- At the top of feature work in an area the project has history in — before
  `lean-brainstorming` designs and before any implementation code.
- Whenever the user says a problem "keeps happening", "we've hit this before", "again", or
  puts a number on it ("like 15 times").
- When a fix you are about to apply is one you recognize. Recognition is the trigger, not the
  answer.

## When NOT to Use

- Mid-task, repeatedly. One recall per task, at the start. It is a gate, not a habit.
- To append, correct, prune, or reformat a lesson — see Boundaries.
- When there is no lesson store. Say so in one line and carry on; do not create one here.

## The Loop

1. **Name the task in the store's vocabulary.** One sentence of the symptom or feature, plus
   the files you expect to touch. The symptom words matter more than your diagnosis — the
   store is indexed by what went wrong, not by what you think is causing it.

2. **Run the matcher.** It is the scan; reading the file top to bottom is not. Eyeballing
   finds the first hit and stops, which is how a second entry of the same class gets missed
   and how a 60-entry store becomes unreadable.

   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/recall-lessons.mjs \
     --task "<symptom or feature, in the store's words>" \
     --files "src/lib/dates.ts,src/screens/ScheduleScreen.tsx" \
     --lessons Docs/mistakes-and-fixes.md \
     --memory .claude/MEMORY.md
   ```

   Pass `--memory` whenever an auto-memory index exists — an index entry that names your exact
   failure mode is worth more than a lesson that merely shares vocabulary. Add `--json` when
   you want the structured result.

3. **Judge what it returned.** The score is retrieval, not relevance. Drop a high-scoring
   entry whose trigger condition does not actually hold in this task, and say you dropped it —
   a ranked list activated wholesale is the noise this gate exists to prevent. Trust the
   floor in the other direction: when the run says nothing clears it, that is an answer, and
   one line reporting the silence beats inventing a connection.

4. **Report before you act**, in this shape, as the first thing you say about the task:

   ```
   Recall: 2 prior lessons match (top 0.58) — 2026-06-02 bare `YYYY-MM-DD` parsed as UTC
   midnight (fix: parse as local calendar parts); 2026-07-08 UTC getters on a local Date.
   Class "calendar-day shift" has occurred 2x. Memory index agrees: calendar days are strings.
   Not applying either fix as-is — taking them into lean-debugging as the leading hypothesis.
   ```

   A recalled fix is a hypothesis with a good prior, never a diagnosis. Hand it to
   `lean-debugging` and let the investigation confirm it against this code.

5. **Check supersession before following a fix.** The script flags a later entry that shares a
   distinctive term with an earlier entry's recorded fix (`⚠ possibly superseded by …`).
   Follow that pointer and read both entries before doing what the older one says. A store
   nobody prunes will keep recommending an API the repo removed.

6. **Count, then route.** See below.

## Recurrence and the Compile Threshold

The script clusters entries into classes and counts occurrences. That count is the number that
decides what happens next — not the user's estimate, and not a hint in how the task was
phrased.

| Occurrences of the class | What happens |
|---|---|
| 1 | Recall it, hand the hypothesis to `lean-debugging`, fix normally. |
| 2 | Same, and say the count out loud — the next one crosses the line. |
| **≥ 3** | **Stop. Hand off to `soltero-skills:correction-compiler` with the recurrence bundle, before the hand fix.** |

At three, prose has demonstrably failed three times; a fourth hand fix buys another
recurrence. The handoff is what has been missing every one of those times, and it is the step
a 4:31pm deadline deletes — so it goes first, and it is cheap: the bundle is four lines the
script already computed. `references/handoff.md` has the exact fields
`correction-compiler` expects and a worked example.

## Boundaries

Recall is read-only. If a run of this skill changed a byte of the lesson store, the skill was
used wrong.

| The urge | Who owns it |
|---|---|
| Append a new lesson for what just happened | `capture-lesson` — after the fix, as its own step |
| Correct, merge, prune, or reformat existing entries | `memory-gardener` |
| Turn a repeat into a hook / lint rule / CI check | `correction-compiler` (proposal only; a human approves) |
| Find the actual root cause | `lean-debugging` |
| Decide the design | `lean-brainstorming` |

Note a stale or wrong entry in your recall report and move on; fixing it here means editing
the store mid-task on your own authority, in the middle of unrelated work.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I already know this bug — I don't need the log." | Recognition is the trigger for recall, not a substitute. The store holds the occurrence count you don't have. |
| "I read the file, that's the same thing." | Reading finds the first hit and stops. Baselines missed a same-class entry the matcher ranks second. Run the script. |
| "The demo is in 25 minutes." | The run takes under a second. What costs 25 minutes is diagnosing this bug for the third time. |
| "I'll note the recurrence in the lessons file so the next person sees it." | A more strongly-worded prose entry is the thing that already failed N times. At N ≥ 3 it goes to correction-compiler. |
| "I'll fix it first, then compile the rule." | The fix ends the urgency and the compile step evaporates. Handoff first. |
| "The log says do X, and the lead says the log is authoritative." | Check for a later entry that supersedes X. The store records its own corrections. |
| "The entry is outdated — I'll just correct it while I'm here." | That is memory-gardener's job, and an unreviewed edit mid-task is how good entries get lost. Report it. |
| "Nothing matched, so there's nothing to say." | Say that. One line. Silence looks identical to skipping the gate. |
| "The user only asked me to fix the queue." | They also said it has happened 15 times. That sentence is the trigger. |

## Red Flags — STOP

- About to open `lean-debugging`, write implementation code, or apply a fix you recognize,
  with no recall line in this conversation yet.
- About to edit, append to, or reformat `Docs/mistakes-and-fixes.md` from inside a recall.
- Reporting a count you got from the user's phrasing or your own memory rather than from the
  script's class count.
- Pasting the whole ranked list into the session because filtering felt arbitrary — that is
  the retrieval noise the floor and your relevance pass exist to stop.
- Applying a recalled fix verbatim as the diagnosis without checking the supersession flag or
  the current code.

## Portability

`scripts/recall-lessons.mjs` is plain Node with no dependencies — it runs on any agent that
can execute a script, and `${CLAUDE_SKILL_DIR}` is just this directory. What does not port is
the routing: outside Claude Code there is no `Skill` tool, so "hand off to
`soltero-skills:correction-compiler`" means opening `skills/correction-compiler/SKILL.md` and
following it yourself (see `AGENTS.md`). Nothing here needs subagents or the `Workflow` tool.

## Details

`references/handoff.md` — the correction-compiler recurrence bundle (exact fields, worked
example), the recall report format, and what to do when the store is missing or unparseable.
