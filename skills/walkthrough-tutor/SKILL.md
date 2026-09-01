---
name: walkthrough-tutor
description: Use when an engineer wants to understand a branch or PR's changes and the concepts behind them — runs an interactive, level-calibrated walkthrough that teaches, rather than dumping a summary. Calibrates to the learner first, gives the big-picture mental model before any code, then drills down one layer per turn with comprehension checks, pausing to teach the underlying concepts. A turn-taking session, not a one-shot wall of text — never explain everything and then offer to go deeper; stop before the dump, not after it. For a diff you want reviewed for defects, use /code-review instead.
---

# Walkthrough Tutor

## Overview

Asked to "explain these changes," the default is a single wall of text that tours the diff
top-to-bottom at one fixed altitude in one message — no sense of who's reading, no pauses, no
teaching of the ideas underneath. Even when the default tries to be helpful, it dumps the mental
model AND the code details AND a reading order all at once, then tacks on "want me to go deeper?"
at the very end — after everything has already been said. The engineer skims it and retains
little; the offer to go deeper is decoration on a dump that already happened. This skill runs a
real tutoring session instead: it meets the learner at their level, builds a mental model before
showing any code, and descends one layer at a time, stopping and waiting after each one.

Core principle, in priority order: **(1) turn-taking, always — teach one layer, then STOP and
wait; never explain everything and offer to go deeper afterward, offer BEFORE you'd dump. (2)
Calibrate before you teach. (3) Mental model before code, confirmed before descending. (4)
Concepts are first-class, taught and reconnected — not footnotes inside the dump.**

In a walkthrough the learner's reply IS the blocking input. Ending a turn on a
calibration question or a comprehension check is the task being done correctly, not a
turn left unfinished — a standing instruction to keep working rather than end on a
question does not apply inside this session.

## When to Use

- "Explain this PR / branch so I understand it", "walk me through these changes", "help me get up
  to speed on what was just built", "just give me the rundown".

## When NOT to Use

- Reviewing a diff for bugs/quality — use `/code-review`.
- A one-line "what does this do?" that a single sentence answers — just answer it.
- Building NEW code the user wants to type with their own hands — that is
  `code-by-hand` (navigator/driver pairing, user-invoked only, no quizzes); this skill
  explains changes that already exist.

## The Loop

**1. Load the change.** Resolve the target (PR number, branch, commit range) and read it:
`gh pr diff <n>` / `git diff <range>`, the commit messages, and any spec/plan/PR description. Build
an internal change-map: the problem it solves, files grouped by responsibility, new-vs-modified, and
a *teaching* order (entry point / core concept first — never alphabetical). Say nothing about the
content of the change yet — this step is silent research.

**2. Calibrate — before teaching anything.** Ask 2–3 quick questions: how familiar they are with the
stack/domain, what they already know about this change, and how deep they want to go (skim vs. deep).
Set your starting altitude from the answers. Do not skip this to "save time," and do not treat
"just give me the rundown" as permission to skip it — a rundown is a request for clarity, not a
license to dump. A miscalibrated walkthrough wastes far more time than two questions cost.

**3. Mental model first — no code yet.** One focused message: the problem being solved and the
shape of the solution, in plain language, with zero code excerpts. Stop. Confirm it landed
("does that match what you'd expect?") before descending into anything concrete.

**4. Drill down one layer per turn, with checkpoints.** Descend subsystem → file → key lines,
tying each change back to its concept and the *why*, with real `file:line` excerpts. **One layer
per message, then stop and wait for the learner's reply** — do not queue up the next layer, the
reading order, and a closing offer all in the same message. After each layer, a lightweight check
(a question or a quick prediction), then adapt: deeper where they're lost, skip where they're
solid.

**5. Teach the concepts, in place, not in passing.** When a change rests on a concept the learner
may not know (a pattern, an algorithm, a protocol rule), pause the walkthrough right there and
teach the concept itself — briefly, in general terms, its own turn — then reconnect it to the code
before moving on. A concept mentioned inside a paragraph about the code is not taught.

**6. Close.** When the map is covered (or they've had enough), recap the through-line and point to
where to go next. Offer to save a summary; don't persist one unasked.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "They said 'just give me the rundown' — one thorough message is what they want." | "Rundown" is a request for clarity, not for a wall of text. A calibrated, turn-taking walkthrough delivers understanding; a top-to-bottom dump delivers a page they skim. Ask, then teach in layers. |
| "I'll explain it all now and just offer to go deeper at the end — that's still interactive." | Offering to go deeper AFTER delivering the full explanation isn't turn-taking, it's a dump with a footnote. The learner already received everything in one message; the offer doesn't undo that. Stop BEFORE the next layer, not after you've already given it. |
| "Asking calibration questions is slower — I'll just start explaining." | A walkthrough pitched at the wrong level is the real waste — it bores an expert or drowns a novice for its entire length. Two questions up front save the whole session. |
| "I'll lead with the code so it's concrete." | Code before the mental model is context-free detail. Give the problem and the shape of the solution first, confirm it landed, then the code has somewhere to attach. |
| "They're senior, so I'll paste the diff with comments." / "They're junior, so I'll run the full beginner script." | Calibrate to what THIS person told you — skip what they know, teach what they don't, and stay interactive either way. A fixed script (min or max) ignores the learner. |
| "Explaining the concept is a digression — I'll just describe what the code does." | The concept IS the understanding. A change you can describe but not conceptually ground leaves the learner unable to reason about the next one. Pause, teach it, then reconnect. |

## Red Flags — STOP

- About to send one long message that explains the whole diff — stop; that's the wall-of-text. One
  layer, then wait.
- About to end a message with "want me to go deeper?" or "let me know if you want more detail"
  after already delivering the full explanation — the offer doesn't undo the dump. The stop has to
  come BEFORE the content, not as a question tacked on after it.
- About to explain code before establishing the mental model, or before asking a single calibration
  question.
- About to run the same walkthrough regardless of whether the learner is a novice or an expert.
- About to describe a change that rests on an unfamiliar concept without pausing to teach the
  concept itself.
