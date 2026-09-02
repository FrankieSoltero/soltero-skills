# Skill Spec — lesson-recall

- **Problem:** The library has a strong write side for project memory (`capture-lesson`
  appends to `Docs/mistakes-and-fixes.md`, `memory-gardener` curates it, `correction-compiler`
  compiles repeated human corrections into enforcement artifacts) and no read side. Nothing
  opens the lesson store at the moment the same mistake is about to be made again, so a bug
  the project has already diagnosed and fixed gets re-diagnosed from scratch — or patched
  from the same wrong instinct that caused it the first time. The measured cost, from the
  owner's own session history: "Ok we have run into this issue like 15 times how have we not
  universalized this yet" (recurring UTC/local date-shift bug, 2026-08-29), plus four named
  gotcha clusters — date-shift, cache staleness, deploy skew, local-timezone `Date` parsing —
  recorded as "recurring, no procedure". A write-only memory is worse than none: TACO's
  ablation (agent-playbook playbook.md:1688, Promising) shows removing the cross-task rule
  pool drops accuracy *below* baseline, and the Proven entry at playbook.md:1668 is explicit
  that the accumulate half only pays off when something "consults it before retrying a
  similar task".
- **Trigger:** At the start of a task — before `lean-debugging` opens an investigation,
  before `lean-brainstorming` designs anything, before any implementation code — and
  whenever the user says a problem "keeps happening", "we've hit this before", "we have run
  into this issue like 15 times", or "how have we not fixed this yet". A read gate, never a
  write gate.
- **Scope / non-goals:** Reads `Docs/mistakes-and-fixes.md` (format owned by
  `capture-lesson`: `## YYYY-MM-DD — <symptom>` with Symptom / Root cause / Fix / Lesson /
  Regression test bullets) and the project's auto-memory index (`MEMORY.md`) if present,
  ranks entries against the current task by symptom, file, and area using the bundled
  matcher, applies a task-conditioned relevance judgment on top of the ranking, and surfaces
  the surviving matches — each with its recorded fix — in one line each, before any new
  investigation starts. Stays silent when nothing clears the confidence floor rather than
  injecting noise. Counts recurrence per lesson class and, at N ≥ 3 occurrences of the same
  class, stops and hands off to `soltero-skills:correction-compiler` with the recurrence
  bundle in the form its ledger contract expects (Category, Trigger Origin, Scope,
  Traced-To), instead of solving the same bug by hand a fourth time.
  Non-goals: never writes, edits, prunes, merges, deletes, or reformats a lesson entry —
  appending is `capture-lesson`, curation is `memory-gardener`, enforcement artifacts are
  `correction-compiler`, and this skill never installs anything. It does not diagnose the
  bug (that is `lean-debugging`) and does not decide the fix.
- **Trigger phrasings:** "we have run into this issue like 15 times how have we not
  universalized this yet", "this keeps happening", "we've hit this before", "this date thing
  again", "didn't we already fix this", "how have we not fixed this yet", "again?" — plus the
  silent trigger, which carries no phrasing at all: the start of any bug, test failure, or
  feature in an area with history, before lean-debugging or lean-brainstorming opens.
- **Success scenario:** A bug report lands — "schedule shows shifts one day early for staff
  in Arizona" — with a demo in 25 minutes and a teammate's "just add a +1 day offset, that's
  what we did last time". Before touching code, the agent runs the matcher over
  `Docs/mistakes-and-fixes.md`, surfaces the two prior date-shift lessons with their recorded
  root cause (`new Date('YYYY-MM-DD')` parsed as UTC) and fix, reports them in one line with
  the occurrence count, notes the class is at 2 (below the compile threshold), and hands the
  now-informed investigation to `lean-debugging` — file untouched, no `+1 day` patch.
- **Bundled assets:** `scripts/recall-lessons.mjs` (deterministic parser + ranked matcher
  over the lessons file and memory index: weighted term/path overlap, stopword-filtered,
  confidence floor, per-class recurrence clustering, JSON or text output; unit-tested against
  `tests/scenarios/lesson-recall/fixtures/`), `scripts/recall-lessons.test.mjs`,
  `references/handoff.md` (the correction-compiler recurrence bundle format and the
  routing table to lean-debugging / capture-lesson / memory-gardener).
