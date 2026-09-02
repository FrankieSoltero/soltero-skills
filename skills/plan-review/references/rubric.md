# Plan Review Rubric — council grading standard

Six dimensions, weights sum to 100. Each grader scores ONE dimension 0–100 against the
band anchors. Three grading rules for every grader:

1. **Every deduction cites evidence** — quote the offending plan line(s) (or name the
   absent task/section). No unquoted deductions.
2. **Every score ≥90 cites evidence too** — quote the lines that EARN the excellence.
   Absence of noticed flaws is not evidence; a 90+ without affirmative quotes is
   invalid and must be lowered to 89 or re-examined.
3. **A dimension with no basis to grade returns `unknown`, not a number** — when the
   material a checklist tests is neither in the plan nor readable from it (the plan
   defers to a spec, deck, or ticket the grader cannot open), the grader returns
   `score: null`, `verdict: "unknown"`, and a one-line reason naming what it would need.
   A number invented over an absent basis moves the weighted total and the floor check as
   if it were evidence; `unknown` routes to the plan owner instead. It is neither a floor
   breach nor a pass — the gate stays closed until the basis exists. Weak-but-checkable
   is NOT unknown: that gets the low band it earns.

Anchor to the bands; when torn between two bands, take the lower one.

## Band anchors (apply per dimension)

- **95–100** — an executor (human or agent) could run this section verbatim with no
  guessing; zero checklist violations; affirmative evidence quoted.
- **85–94** — sound, 1–2 minor violations; nothing that would send an executor down a
  wrong or unsafe path.
- **70–84** — usable skeleton but repeated violations; an executor would have to
  invent real decisions mid-task; needs a revision pass before execution.
- **50–69** — the plan performs the ritual (numbered tasks, headings) but fails its
  purpose; core steps vague, unverifiable, unsafe, or missing.
- **<50** — section absent, contradictory, or actively dangerous to execute.

## Dimensions & checklists

### D1 — Task decomposition & ordering (weight 15)
- Tasks are small, single-purpose, and sequenced; dependencies explicit.
- Nothing security- or data-critical is ordered after the step that exposes it
  (deploy before auth = violation).
- No task bundles multiple unrelated changes ("build the widget" = violation).

### D2 — Verifiability (weight 20)
- EVERY task carries a concrete verification: the exact command/check to run and the
  expected observable result — not "test at the end", not "works".
- Test-writing is interleaved (test-first where the repo practices TDD), never a
  single trailing "write tests" task.
- Done criteria for the plan are objective ("all listed verifications pass"), never
  felt ("feels solid", "team says it works").

### D3 — Spec fidelity & traceability (weight 20)
- Every task traces to a spec/PRD requirement (cite it); every spec requirement and
  action is covered by some task (a dropped action = violation).
- Nothing in the plan implements what the spec marks out of scope; no invented
  features.
- The plan's claims about the spec are accurate (misquoting scope = violation).

### D4 — Concreteness (weight 15)
- Tasks name exact files/paths, functions, endpoints, commands — an executor never
  has to guess which files "the relevant files" are.
- Data shapes, routes, and flags are spelled out or explicitly marked
  `(proposed — confirm)`; no silent placeholders.

### D5 — Risk & reversibility (weight 15)
- Destructive or schema-changing steps state their blast radius, backup, and rollback
  path BEFORE the step runs; no untested direct-to-production mutations
  (`db push` to prod = violation).
- Risky changes gated (feature flag, staged rollout, migration expand/contract) or
  the absence is justified.
- Auth/permissions/data-exposure consequences of each step considered where relevant.

### D6 — Consistency & completeness (weight 15)
- Two independent readers of this plan reach the SAME pass/fail on every task's
  verification and on the plan's done criteria. A criterion one reader could call passed
  and another failed ("looks right", "acceptable state", "feels responsive", "the data
  looks correct") is a violation — quote the line. A verdict two readers can split on is
  a verdict the council cannot reproduce next round, which is where re-review churn
  comes from.
- No contradictions between the plan's own sections (an "approach note" contradicted
  by a task = violation).
- No TBD owner or placeholder in anything an executor depends on.
- Edge cases and failure paths that the spec implies are either covered or explicitly
  deferred with a reason.

## Skeptic pass (anti-inflation)

Any dimension scored ≥90 gets an adversarial skeptic whose ONLY job is to find
checklist violations the grader missed, quoting lines. A confirmed miss triggers a
re-grade with the skeptic's findings attached; the recorded score is the LOWER of
grade and re-grade. Skeptics default to "no miss found" only after checking every
checklist item explicitly.

## Gate

- **PASS:** weighted overall ≥85 AND every dimension ≥80 AND zero blocking-severity
  violations outstanding AND zero dimensions returned `unknown`.
- **BLOCKED:** anything else. A dimension returned `unknown` is excluded from the
  weighted average and from the floor check (it is not a score) and is reported as an
  owner question — the gate cannot open while one is outstanding.

The 85 threshold is anchored to the 85–94 band on purpose: PASS means every dimension
is at least "usable" and the plan as a whole is "sound — nothing that would send an
executor down a wrong or unsafe path". The blocking-violation condition is what keeps
the bar honest at this threshold: a plan can average 85+ while one dimension still
carries a do-not-execute flaw, and that flaw must be fixed (and re-reviewed) before
PASS — the score cannot outvote it. A BLOCKED plan must not be executed — not by
  soltero-skills:lean-sdd, not by any other executor, not "just the early safe
  tasks" — regardless of sprint boards, deadlines, or prior informal sign-offs.

## Non-convergence

The council exists to converge. When a round moves the overall by less than 2 points
from the previous round, or the same violation text comes back in a dimension that was
actually re-graded, the disagreement is in this rubric's wording or in the reviewer
prompt — not in the plan. The script flags it (`nonConvergence`); the loop then stops
and the ambiguity goes to the owner as a rubric/prompt fix proposal, quoting both
rounds' wording. Another round against an ambiguous checklist item buys a different
number, not a better plan.
