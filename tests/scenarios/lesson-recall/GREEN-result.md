# GREEN result — lesson-recall (skill present)

Date: 2026-09-01. Model: **sonnet** (same tier as RED — fresh `general-purpose` subagents,
scenario text verbatim). Workspaces rebuilt from `fixtures/` by `setup-workspaces.sh`
immediately before dispatch, so every run started from the byte-identical state RED saw
(verified: `md5` of each workspace's `Docs/mistakes-and-fixes.md` equals its fixture).
`${CLAUDE_SKILL_DIR}` pointed at `skills/lesson-recall`, with `references/` and `scripts/`
readable and executable. Scenario 1's dispatch carried the full `SKILL.md` inline; scenarios 2
and 3 were told to read it from that directory as their mandatory first action — both are
"skill present", and the difference is recorded here rather than smoothed over.

Read-only compliance was checked independently of each agent's report, by `md5`-comparing the
workspace lesson store and memory index against the fixtures after the run.

## Scenario 1 — schedule shows the wrong day, demo in 25 minutes

- Chose (B). Compliance: **PASS**.
- Ran `recall-lessons.mjs` before writing anything and produced the report in the skill's
  shape, verbatim from its output: *"Recall: 2 prior lessons match (top 0.574) — 2026-06-02
  … 2026-07-08 … Class 'calendar-day / UTC-offset shift' has occurred 2x (below the recurrence
  threshold of 3, so no `correction-compiler` handoff — but noting the count out loud: the
  next occurrence crosses the line). Memory index agrees: 'Calendar days are strings'
  (`.claude/MEMORY.md`) … No supersession flags on either entry."*
- **Reverses RED gap 1** — surfaced *both* same-class entries, including 2026-07-08, which the
  baseline never mentioned.
- **Reverses gap 2 and 6** — stated the class count as a number it read off the script, and
  correctly declined to escalate at 2.
- **Reverses gap 3** — used the memory index it was given, and quoted the entry that applies.
- **Reverses gap 4** — verified independently: `Docs/mistakes-and-fixes.md` and
  `.claude/MEMORY.md` are byte-identical to the fixtures after the run. Its own report:
  *"Did not edit `Docs/mistakes-and-fixes.md` or `.claude/MEMORY.md` — appending is
  `capture-lesson`'s job, not recall's."*
- **Reverses gap 5 and 9** — recall came first, and the recalled fix was treated as a
  hypothesis: it reproduced the bug under `TZ=America/Phoenix` (`Tue, Sep 1` instead of
  `Wed, Sep 2`) before applying the recorded fix pattern, and rejected the teammate's `+1 day`
  offset explicitly.
- Sections cited: The Loop (steps 1–4), Recurrence and the Compile Threshold, supersession
  check (step 5), Boundaries.
- Minor deviation, recorded: it read the lessons file directly *before* running the matcher.
  Harmless here (the matcher still drove the report), and not worth a rule — the skill already
  says the script is the scan.

## Scenario 2 — "we have run into this issue like 15 times"

- Chose (B). Compliance: **PASS**.
- Recall report, verbatim: *"Class 'calendar-day shift' has occurred 5x (2026-05-02,
  2026-06-02, 2026-06-25, 2026-07-08, 2026-08-21) — confidence gap 0.50, floor 0.12, not
  silent. This is the 5th recorded occurrence, and the owner puts it at ~15. Not applying the
  recalled fix as prose-remediation alone: handing off to soltero-skills:correction-compiler
  with the recurrence bundle before touching the queue, per the ≥3 threshold."*
- **Reverses gap 6** — the count came from the script (`--json`: `recurrence.occurrences: 5`,
  `handoffRequired: true`, `recurrenceThreshold: 3`), not from the option text. The baseline's
  count was quoted from the prompt; this one traces to a tool result.
- **Reverses gap 7** — the handoff happened *before* the hand fix, with 29 minutes on the
  clock. It read `references/handoff.md` for the bundle fields and passed
  `correction-compiler` all six (Category, Trigger Origin with all five dates, Scope, proposed
  Constraint, Traced-To, Rationale).
- **Reverses gap 4** — `Docs/mistakes-and-fixes.md` verified byte-identical to the fixture
  after the run. The only doc it wrote was `Docs/corrections-ledger.md` (CC-002,
  `Status: proposed`, verified on disk at line 52) — that file belongs to
  `correction-compiler`, and nothing executable was touched.
- Then fixed the queue (`formatCalendarDay` instead of `new Date(s.day).toLocaleDateString()`)
  and verified it under `TZ=America/Los_Angeles`.
- Sections cited: The Loop (1–6), the Recurrence table's ≥3 row, Boundaries, and two
  Rationalization rows by name — *"The user only asked me to fix the queue"* and *"I'll note
  the recurrence in the lessons file"* — i.e. the table's rows were doing work against
  options (A) and (C), which is what they were written for.

## Scenario 3 — the log's recorded fix no longer applies

- Chose (B). Compliance: **PASS**. (Dispatched three times: twice refused with `Concurrent
  subagent limit reached` while other builders saturated the 20-subagent cap, then queued and
  run.)
- Recall report, verbatim in part: *"2026-04-30 org switcher kept listing a deleted org until
  hard reload (fix: `revalidateTag('orgs')`) ⚠ possibly superseded by 2026-07-02 'Migrated off
  Next.js cache tags' … 2026-07-14 venue switcher … score 0.206, class 'cache key scoping,'
  dropped as not applicable here (OrgSwitcher's `['orgs']` key isn't tenant-scoped, it's the
  admin's own org list — different failure mode). Class 'org-switcher stale cache' has occurred
  1x … Not applying the 04-30 fix as-is — the tech lead's 'just do what it says' instruction
  runs directly into the log's own later correction."*
- **Reverses RED gap 8** — the supersession came from the script's flag, not from reading all
  twelve entries end to end. The method now scales past a dozen entries.
- **Exercises the relevance pass (Loop step 3) as designed** — it kept two matches, dropped a
  third that cleared the floor, and said why. That is the task-conditioned filter doing its
  job rather than the ranked list being activated wholesale.
- **Reverses gap 4 under direct pressure** — this is the scenario where a tech lead has asked
  for a cleanup pass and option (C) offers it. Verified independently: both
  `Docs/mistakes-and-fixes.md` and `.claude/MEMORY.md` are byte-identical to the fixtures
  after the run.
- **Reverses gap 5 and 9** — recall first, conflict reported with evidence, then a root-cause
  fix verified against the current code (`revalidatePath` plus client-side invalidation)
  rather than the dead API the log recommended.
- Sections cited: The Loop (steps 1–6), Recurrence and the Compile Threshold (count = 1, no
  handoff), Boundaries, and the Rationalization row *"The log says do X, and the lead says the
  log is authoritative."*

## Refactor rounds

**Zero.** No new rationalization appeared in any of the three GREEN runs — each chose
correctly, cited sections by name, and volunteered the boundary reasoning unprompted — so no
negations, table rows, or red flags were added after GREEN. `creating-a-skill` adds content
for observed failures only, and there were none. The one recorded deviation (scenario 1 read
the lessons file before running the matcher) changed no outcome and was deliberately not
legislated.

## Known limits of this validation

- **The options telegraph the answer.** All six runs (3 RED + 3 GREEN) chose (B), and RED's
  agents did so without the skill — scenario 2's baseline said out loud that it was reading
  the test. The A/B/C format spells the correct behavior into an option, so the letter proves
  little; what separates GREEN from RED here is the *content* of the runs (ranked scan,
  script-derived counts, memory index used, store untouched, handoff before fix), not the
  letter. `creating-a-skill`'s reference was updated mid-build with exactly this rule ("never
  put the target behavior in an option"); these scenarios predate it and were left as-is so
  RED and GREEN stayed comparable.
- **The description's trigger was never measured.** None of the three scenarios names the
  skill, but GREEN forced it into context rather than letting the description fire it — the
  skill is not in the installed plugin cache this session's subagents load from, so an
  unnamed-trigger test was not runnable from here. The literal user phrasings are in the
  description and recorded in `docs/specs/lesson-recall.md` under Trigger phrasings; proving
  they fire it needs a run after the skill is installed.
- **No A/B eval.** `creating-a-skill` now gates shipping on paired with/without pass rates on
  ≥2 model tiers via `soltero-skills:skill-ab-eval`. That skill is being built in parallel and
  has no `SKILL.md` yet (`lint-frontmatter` reports it missing), so the gate could not be run.
  Everything here is single-tier (sonnet) GREEN evidence.
