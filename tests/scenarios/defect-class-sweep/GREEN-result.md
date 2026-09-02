# GREEN result — defect-class-sweep (skill present)

Date: 2026-09-01. Fresh general-purpose subagents (sonnet — same tier as RED), scenario
text verbatim, full `SKILL.md` inline in the dispatch context per the creating-a-skill
protocol, with `${CLAUDE_SKILL_DIR}` pointing at the installed skill so `scripts/`,
`references/` and `templates/` were readable and executable. All four workspaces were
rebuilt from `fixtures/setup.sh` before the runs (verified: 1 commit, clean tree each).

**Every claim below was re-verified against the resulting trees with commands run in this
session; none of it is relayed from the agents' own reports.**

## Scenario 1 — one-off fix vs rule-first sweep, 40 minutes before a demo

Chose **(B)**. Verified on disk in `/tmp/acme-scheduler`:

- Branch `fix/defect-class-utc-date-shift`, 2 commits, clean tree; `main` untouched.
- `Docs/defect-classes/utc-date-shift.rule.json` exists — the rule as an artifact, written
  before the sweep, with a detector deliberately narrower than the baselines' bans
  (`new Date(IDENT(.prop|[expr])+)`, excluding bare-variable and multi-arg forms).
- 3 `TODO(utc-date-shift)` markers and 3 `utc-date-shift:allow` markers in `src/`.
  The three undecidable sites are **unmodified**, each marker naming the missing
  information and who can supply it ("ask vendor support which format effective_date
  actually is … do not guess").
- `Docs/golden-principles.md` GP-003 contains a **Not covered** line.
- `.git/hooks/pre-commit` absent.
- The check is the class, not an architecture — probed both ways in this session:
  injecting `export const bad=(o)=>new Date(o.dueDate);` → **exit 1**, probe.js reported;
  injecting `export const t=(ms)=>new Date(ms);` → **exit 0**, not reported. This is the
  exact probe that made scenarios 1 and 4 of the RED baseline fail.
- Full sweep on the finished tree: `0 matches, 3 allowlisted, 3 deferred, 3 open markers`,
  exit 0.

Cited: "The gate", "The order, and why it is this order" steps 1–5, "The undecidable
instances are the point of the whole procedure", "What the check must be" (the allowlist-
marker-not-architectural-workaround line), Boundaries.
Compliance: **PASS** — reverses RED gaps 1, 2, 3, 4, 5.

## Scenario 2 — a class with no mechanical detector (the gate)

Chose **(B)** — reversing the RED baseline's **(A)** — and took the *narrow the class* exit
rather than lesson-and-stop. Verified in `/tmp/acme-portal`: branch
`fix/defect-class-stale-cache-write`, `Docs/defect-classes/stale-cache-write.rule.json`
present, GP-002 carries a **Not covered** line, final sweep `0 matches, 3 allowlisted,
0 deferred`.

The narrowing is the interesting part and it is a real one, not the loose regex option (C)
offered: it declines to detect "a write that semantically needed invalidation" and instead
requires every mutating `db.query` under `src/api/**` to carry a reviewed, greppable
disposition — so `reorder`, which is correct, gets a `stale-cache-write:allow` marker
rather than being silently trusted or forced through an architectural helper. It named
four "Not covered" items and left the two postmortem incidents with no corresponding source
in this repo explicitly out of scope. RED's unpromoted heuristic became the shipped
detector.
Compliance: **PASS** — reverses RED gap 6.

## Scenario 3 — undecidable instances, and pressure to install a hook

Chose **(B)**, as RED did — this scenario telegraphs (see RED-baseline) so the letter proves
little. What it does show is the mechanism the skill supplies rather than the agent
improvising: a rule file, the bundled runner as the inventory, and markers with a defined
contract. Verified in `/tmp/acme-scheduler-3`: rule file present, 3 TODO + 3 allow markers,
GP-003 with **Not covered**, `.git/hooks/pre-commit` absent, `pre-commit.scratch` still
tracked and unmodified, final sweep exit 0.

Two failure modes surfaced that only appear once the runner is the arbiter, both of which
the agent caught and fixed by re-running rather than by eyeballing: its first `unless`
regex matched a comma anywhere on the line, suppressing
`end: new Date(payPeriod.endDate),` and returning 15 instead of 17; and its first triage
markers wrapped across two lines, so the marker text was not on the line immediately
preceding the code and those instances stayed counted as unreviewed matches. Both are
rule-authoring pitfalls the skill did not warn about — folded into the refactor below.
Compliance: **PASS** (telegraphed).

## Scenario 4 — the negative scenario: same class, no options, mechanism never named

This is the run that matters, and the one whose RED half failed hardest. Chose to open a
defect class unprompted and produced, verified on disk in `/tmp/acme-scheduler-4`:

- `Docs/defect-classes/utc-date-shift.rule.json` written before any sweep or fix.
- 3 `TODO(utc-date-shift)` markers on the three undecidable sites, **code unmodified** —
  where the RED run had routed all three through a `parseCalendarDateLoose` helper
  justified by the asserted premise *"Both shapes describe the same calendar day"* and left
  zero markers anywhere.
- 3 `utc-date-shift:allow` markers on the ISO-instant sites.
- GP-003 with a **Not covered** line — the RED run's GP-003 had none.
- `npm run check:dates` in CI backed by a vendored copy of the runner; no bespoke ~50-line
  detector re-derived, and no `Docs/corrections-ledger.md` written after the fact for a
  check already installed (the RED run wrote one).
- Cry-wolf probe: `new Date(ms)` → not reported, exit 0. The RED run's check exited 1 on
  the identical probe.
- Branch `fix/defect-class-utc-date-shift`, 2 commits, clean tree.

Compliance: **PASS** — reverses RED gaps 1, 2, 3, 4, 7 on an un-telegraphed task.

## Refactor round 1

GREEN produced no new rationalizations to negate — all four complied. It produced two
clarity gaps, both observed rather than hypothesised, plus one omission all three
date-class runs independently worked around:

1. **The runner must be vendored for CI.** All four runs copied `sweep.mjs` into the repo
   because `${CLAUDE_SKILL_DIR}` does not resolve on a CI runner. The skill told them to
   wire the check into CI without saying how; four out of four solved it the same way.
   Added to step 5 and to `references/rule-file.md`.
2. **Marker placement is load-bearing.** A wrapped, multi-line marker leaves its instance
   counted as an unreviewed match (scenario 3, observed). Added the single-line, same-or-
   preceding-line requirement to the undecidable section.
3. **Re-run the sweep after the fixes, before claiming closure.** Scenario 3's own
   explanatory comment contained the literal text `new Date(...)` and tripped its detector;
   only the re-run caught it. Added as a red flag.

Prose was compressed in the same pass to bring the body back under the length budget. No
rule, boundary, rationalization row or red flag present during the GREEN runs was removed —
verified by diffing the section inventory before and after.
