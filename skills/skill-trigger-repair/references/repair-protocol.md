# Trigger Repair — Protocol

## 1. What the parser gives you

```bash
node ${CLAUDE_SKILL_DIR}/scripts/missed-triggers.mjs docs/debriefs            # JSON
node ${CLAUDE_SKILL_DIR}/scripts/missed-triggers.mjs docs/debriefs --markdown # tables
node ${CLAUDE_SKILL_DIR}/scripts/missed-triggers.mjs docs/debriefs --routing . --markdown
```

It reads only the `## Missed triggers` section of each report, in the format
`skills/dev-debrief/references/report-format.md` fixes:

```markdown
- **<skill>** — not invoked in <session file>; activity at <turn/timestamp>
  matches its description ("<quoted trigger phrase>"). <One sentence of evidence.>
```

Per skill it returns `dates` (distinct debrief dates — the bar), `occurrences` (bullets),
`sessions`, `projects`, `phrasings`, `phrasingEvidence`, and `status`.

**Quote kinds.** Every quoted span in a bullet is classified by the prose right before it:

| Kind | Introduced by | Use |
|---|---|---|
| `user` | "the user wrote/said/asked/proposed…" | The raw material for a trigger clause. |
| `description` | "matches its description (…)", "matching …" | The skill quoting itself. Never source material. |
| `other` | anything else — commit subjects, log lines | Context only. |

`phrasingEvidence: 'description-only'` on a candidate is the interesting signal: the
corpus proves the skill was missed and proves nothing about what the user said. That is a
trip to the sessions, or a `phrasing-unrecovered` line — not a rewrite.

The bar is `dates.length >= 2`. Pass `{ minDates: n }` to `summarize()` to raise it for a
noisy corpus; never lower it below 2.

## 2. Recovering the phrasing

The parser hands you the cited session ids. In Claude Code they resolve under
`~/.claude/projects/<project>/<session>.jsonl` (a session-scan pass may need `--add-dir`
to read outside the working tree). What you are looking for is the user turn at or just
before the cited timestamp — the sentence that should have fired the skill.

Take it verbatim, warts included ("why dont we…", a typo, the missing question mark). The
value is that it is what someone types, not what a description writer would have written.
Trim only for length, never for grammar, and keep the citation: date, session, moment.

If the sessions are rotated, deleted, or unreadable, the phrasing is unrecovered. Write
that in the ledger with the dates and sessions you did have, and make no description edit
for that skill. An unrecovered phrasing is a finding; an invented one is contamination
that no future reader can distinguish from evidence.

## 3. Rewriting the description

The description is the only always-loaded surface, so it is the whole discoverability
budget. The rewrite is surgical:

- Keep the existing "Use when …" opening and the existing what-it-does clause.
- Fold the recovered phrasings in as literal quoted trigger clauses, near the front.
- One line. ≤1024 characters (the frontmatter linter enforces the cap; the budget is
  tighter than the cap in practice — if it doesn't fit, cut existing prose, don't drop
  the trigger).
- No capitals for emphasis, no imperatives aimed at the model, no second line.

Worked example — three nights of evidence for `capture-lesson`:

```diff
-description: Use when you just fixed a bug, resolved an incident, or discovered a
-non-obvious gotcha — records a structured lesson in Docs/mistakes-and-fixes.md so the
-same mistake doesn't recur.
+description: Use when you just fixed a bug, resolved an incident, or discovered a
+non-obvious gotcha — including when someone says "we should write this one down so it
+doesn't bite us again", "log that gotcha somewhere", or "add it to the mistakes file" —
+records a structured lesson in Docs/mistakes-and-fixes.md so the same mistake doesn't
+recur.
```

(Shown wrapped for readability; it is one physical line in the file.)

## 4. Repairing the routing line

Three surfaces, checked in this order. A skill can be missing from one and present in the
others — repair each independently, and take which-is-missing from the `--routing` column
rather than from reading the three files. (Observed at a cheap model tier: an agent that
opened all three still reported two skills as "already routed in AGENTS.md and
hooks/session-context.md" when they appeared only in the README table. `--routing` is
there because that call is deterministic and eyeballing it is not.)

| Surface | What it is | Line shape |
|---|---|---|
| `hooks/session-context.md` | Injected every session (Claude Code `SessionStart`) | ``- <task type> → `<plugin>:<skill>` `` |
| `AGENTS.md` | The portable equivalent for every other agent | ``- <task type> → open `skills/<skill>/SKILL.md` `` |
| `README.md` `## Skills` table | The index both files point at | one row |

Rules: one line per skill, in the section that already exists, phrased as *task type →
skill* rather than as a description restated. If a line is already there but wrong,
sharpen it — never add a second. These files are navigational maps; a root instruction
file that grows into a manual loses accuracy rather than gaining it, so a repair that adds
a line should also ask whether an obsolete one can go.

## 5. Ledger format — `Docs/trigger-repair-YYYY-MM-DD.md`

One file per repair pass. Not in `docs/debriefs/`, not in `Docs/corrections-ledger.md`.

```markdown
# Trigger Repair — YYYY-MM-DD

Corpus: <N> reports, <first date>–<last date>. Bar: 2+ distinct dates.

## <skill> — <repair-candidate | logged-only>

- **Dates:** YYYY-MM-DD, YYYY-MM-DD (<n> bullets)
- **Sessions:** `<id>` (<project>), `<id>` (<project>)
- **Phrasing evidence:** user | description-only | none
- **Quoted phrasing:**
  - "<verbatim>" — YYYY-MM-DD, session `<id>`
- **Proposed — description:** <path>; before/after diff below, or `none — <reason>`
- **Proposed — routing:** <surfaces missing the skill>, or `none — already routed`
- **Status:** proposed | applied — verifying | verified | declined (<who, when>)
- **Re-check:** the debrief window after <date> must show it firing, or zero opportunity.

    ```diff
    - description: …
    + description: …
    ```
```

Below-bar skills get the same block with `logged-only`, no proposal, and no diff. They are
the record that the miss was seen and consciously not acted on — which is what makes the
second occurrence a pattern rather than a surprise.

## 6. The re-check pass

On the next debrief after edits land, re-run the parser and compare:

- The skill's `dates` no longer grows → the repair is holding; move the ledger line to
  `verified` and cite the window.
- It grows again → the description was not the binding constraint. Do not rewrite it a
  second time on the same evidence: record the failed hypothesis in the ledger and route
  the skill to `skill-patcher` (body/scope) or to a coverage question (is this two skills
  wearing one description?).
- Zero opportunity in the window → not evidence either way. Say so and wait.
