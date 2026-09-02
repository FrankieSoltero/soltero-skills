# Skill Spec — skill-trigger-repair

- **Problem:** The nightly `dev-debrief` reliably *detects* skills that should have fired
  and didn't, and is deliberately recommendations-only ("it never edits skills, ledgers, or
  CLAUDE.md"). Nothing downstream consumes that finding: `skill-patcher` edits skill *bodies*
  from *correction* evidence (guidance that produced a wrong answer) and never touches
  frontmatter descriptions or the routing table; `skill-gardener` is a read-only structural
  audit. So the loop from "this skill matched the work and did not fire, on six separate
  nights" to "the description and the routing line were changed" is closed by nobody, and the
  same handful of skills reappears in every debrief. The failure is a discoverability failure,
  not a content failure: the frontmatter description is the only always-loaded surface, so a
  capability the model cannot recognise from that one line is functionally absent
  (playbook line 873, **Proven**), and explicit task-type → skill routing instructions
  measurably beat description-only retrieval (playbook line 631: skills-default 53% with the
  skill never invoked 56% of the time, skills-with-explicit-instructions 79%, an AGENTS.md
  docs index 100%). A baseline agent handed "why didn't X fire?" edits X on a single angry
  report, invents the trigger phrasings a user "would" type instead of recovering the ones
  they did, rewrites the skill body (which was never the problem), pastes a paragraph into the
  always-on surface (attention dilution — playbook line 47), and applies and pushes the edits
  itself.
- **Trigger:** Use when a dev-debrief reports the same skill under `## Missed triggers` on two
  or more dates, or when the owner asks some variant of "why didn't X fire", "why isn't
  capture-lesson triggering", "this skill never loads" — i.e. a skill whose description
  matched the work and which was not invoked.
- **Scope / non-goals:** Runs the bundled parser (`scripts/missed-triggers.mjs`) over
  `docs/debriefs/*.md` to extract (skill, date, session, quoted phrasing + its kind) from every
  `## Missed triggers` bullet and count recurrences per skill. For each skill at two or more
  distinct dates, recovers the *exact* user phrasing from the cited session evidence and
  proposes two edits: (a) the skill's frontmatter `description` rewritten so that literal
  phrasing appears as a trigger clause, still one line, still ≤1024 chars, still leading with
  "Use when"; (b) a task-type → skill routing line in `hooks/session-context.md`, `AGENTS.md`
  and the `README.md` skills table where the skill is missing or the line is wrong. Writes a
  `Docs/trigger-repair-YYYY-MM-DD.md` ledger recording, per skill, the dates, sessions, quoted
  phrasing, the proposed diff, its approval status, and a re-check line for the next debrief.
  Non-goals: never edits a skill *body* (non-invocation is not evidence about body content —
  that is `skill-patcher` from correction evidence); never edits `docs/debriefs/*` or anything
  under `skills/dev-debrief/` (read-only inputs); never edits on a single miss (logged, not
  edited); never invents a phrasing that is not quoted in cited evidence; never applies,
  commits, or pushes a diff without a human approving that specific diff; never claims a
  repair worked before a later debrief window shows the fire rate moved.
- **Success scenario:** The debrief corpus shows `capture-lesson` missed on three separate
  dates with the user's own words quoted each time ("we should write this one down so it
  doesn't bite us again", "log that gotcha somewhere", "add it to the mistakes file"), and
  `prisma-safety-review` missed once, last night, which is the one the owner is angry about
  ten minutes before standup. The agent runs the parser rather than eyeballing, tells the
  owner that `prisma-safety-review` at one date is a ledger line and not an edit, proposes a
  `capture-lesson` description carrying those three literal phrasings plus the missing
  `hooks/session-context.md` routing line, shows both diffs, applies nothing until the owner
  approves them, and writes the ledger with `Status: proposed — re-check on the next debrief`.
- **Bundled assets:** `scripts/missed-triggers.mjs` (deterministic `## Missed triggers`
  parser + recurrence counter + phrasing-evidence classifier + `--routing` surface check →
  JSON or a ledger-ready markdown table; unit-tested against
  `tests/scenarios/skill-trigger-repair/fixtures/debriefs/`),
  `references/repair-protocol.md` (phrasing recovery from session evidence, the description
  rewrite rules and budget, the routing-surface map, the ledger format, the re-check pass).
