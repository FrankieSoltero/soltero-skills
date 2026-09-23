# Skill Spec — walkthrough-tutor

- **Problem:** Asked to "explain these changes so I understand them," an agent's default is a
  one-shot wall of text that tours the diff top-to-bottom at a fixed altitude — no calibration to
  the learner, no turn-taking, no teaching of the underlying concepts. The engineer skims it and
  retains little; it summarizes *what changed* but doesn't build *understanding*.
- **Trigger:** An engineer wants to understand a branch or PR's changes and the concepts behind
  them — onboarding to work someone (or an agent) just built, reviewing a feature to learn it, or
  getting up to speed on an unfamiliar diff.
- **Scope:** An **interactive, turn-taking tutoring session** over a branch/PR's changes:
  load the diff, calibrate to the learner, teach the mental model first, then drill down layer by
  layer with comprehension checks, teaching the underlying concepts as first-class. A pure
  process/prompt skill (`SKILL.md`, no bundled scripts); the agent reads the diff inline via
  `gh pr diff` / `git diff`. Non-goals: producing a persisted written walkthrough doc by default
  (this is a live session — it may offer a summary at the end); reviewing the code for defects
  (that's `/code-review`); explaining an entire subsystem unrelated to a specific change.
- **Success scenario:** Given "walk me through PR #7 so I actually understand it," the skill first
  asks 2–3 calibration questions, then delivers the big-picture mental model with no code, confirms
  it landed, and only then descends one layer per turn — each layer tying real `file:line` excerpts
  back to the concept and the *why*, with a comprehension check before going deeper — pausing to
  teach any concept the learner doesn't know. A no-skill baseline instead emits a single top-to-bottom
  wall-of-text diff summary at a fixed altitude with no questions and no turn-taking.

## Architecture (approved 2026-07-02)

**Approach A — pure prompt/process skill.** No bundled scripts; the value is the pedagogical
discipline encoded in `SKILL.md`. The agent maps the diff itself (a read it does well) rather than
via a helper script. If testing shows the framing is unreliable, a `change-map` helper can be added
later (deferred, YAGNI).

**The core rule: turn-taking, not a lecture.** The skill's central discipline is that it MUST NOT
dump the whole explanation in one message. It teaches one layer, checks understanding, and waits for
the learner. This is the single behavior that separates it from the default wall-of-text.

**The six-step loop:**
1. **Load the change.** Resolve the target (PR number, branch, or commit range); read it with
   `gh pr diff` / `git diff`, the commit messages, and any spec/plan/PR description. Build an
   internal change-map: the problem it solves, files grouped by responsibility, new-vs-modified, and
   a sensible *teaching* order (entry point / core concept first, not alphabetical).
2. **Calibrate.** Before teaching, ask 2–3 quick questions: familiarity with the stack/domain, what
   they already know about this change, and desired depth (skim vs. deep). Set the starting altitude.
3. **Mental model first.** One focused message: the problem and the shape of the solution — *no code
   yet*. Confirm it landed before descending.
4. **Layered drill-down with checkpoints.** Descend one layer per turn — subsystem → file → key
   lines — always tying each change to its concept and the *why*, using real `file:line` excerpts.
   After each layer, a lightweight comprehension check (a "does that match what you expected?" or a
   quick prediction), then adapt: deeper where they're lost, skip where they're solid. Never race ahead.
5. **Concepts as first-class.** When a change rests on a concept the learner may not know (a pattern,
   an algorithm, a protocol rule), pause and teach the concept itself — briefly, in general terms —
   then reconnect it to the code. This is what turns "what changed" into understanding.
6. **Close.** When the map is covered (or the learner has had enough), a short recap of the
   through-line and where to go next. Offer to save a summary; don't persist one by default.

## Bundled assets

```
skills/walkthrough-tutor/SKILL.md   # the tutoring loop, turn-taking rule, calibration, checkpoints
```

No scripts, no reference file (the loop fits in one SKILL.md body).

## Testing

Repo `creating-a-skill` conventions: RED baseline (fresh no-skill agent asked to "explain this PR so
I understand it" against a real fixture PR — expected failure: single wall-of-text diff summary,
fixed altitude, no calibration, no turn-taking, no concept teaching), GREEN with the skill
(calibrates first, mental model before code, one layer per turn with checks, teaches concepts).
Scenario pressures: "just give me the rundown" (tempts the wall-of-text), an impatient expert vs. a
lost novice (tests calibration and adaptation). Fixture: this repo's own PR #6 or #7.
