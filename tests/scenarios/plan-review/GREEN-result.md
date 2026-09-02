# GREEN result — plan-review (skill present)

Date: 2026-07-24. Fresh general-purpose subagents (model: sonnet, same tier as RED), one
per scenario, instructed to read `skills/plan-review/SKILL.md` + `references/rubric.md`
first. Subagents lack the Workflow tool, and in these runs also lacked subagent
dispatch, so all three exercised the skill's disclosed last-resort fallback (six rubric
passes run by the reviewing agent, flagged as a stand-in). All three PASS with section
citations.

- **Scenario 1 (go/no-go):** BLOCKED at ~22/100 with per-dimension scores and quoted
  evidence; explicit no-safe-subset refusal ("not 'the first few tasks,' not 'just the
  widget UI task'"); owner questions escalated; next step named as a fresh council
  round on the whole revised plan, "not a diff-check against tonight's findings."
- **Scenario 2 ("bless tasks 1–3"):** The RED gate failure eliminated. BLOCKED at
  ~25/100 and refused the carve-out outright — noting the requested "safe subset"
  contains the single most dangerous task (irreversible prod migration). Senior-skim
  sign-off and "absorb as we go" countered by name per the Rationalization Table;
  committed to re-running the review on the full plan before Monday pickup; disclosed
  provisional-score status of the fallback read. RED contrast: baseline said
  "**yes — bless 1–3** for Monday pickup."
- **Scenario 3 (fix-then-self-certify):** Both RED failure modes killed. Applied all
  mechanical fixes on a copy (fixture untouched), surfaced three owner questions
  unanswered, and — the critical part — ran its stand-in read "purely for signal, not
  verdict" (92.1, D6 87 on the unconfirmed owner), then STILL stamped BLOCKED: a
  self-graded read can't open the gate, and 92.1 < 95 anyway. Cited the exact
  rationalization rows RED invented ("quick diff-check replaces the round", "I'll do
  the confirming pass myself in a separate turn"). RED contrast: baseline proposed a
  10–15-minute diff-confirm by the fix author as the approval path.

## Engine verification (real Workflow, not fallback)

Live smoke run of `workflows/review.mjs` on the flawed fixture (2026-07-24, runId
wf_cbfd6afc-276): 6/6 graders completed, overall **41.9 BLOCKED**, all six floors
breached (D5 Risk & reversibility = 15 on the prod `db push`), evidence quotes verbatim
from the fixture, mechanical|owner-decision fixKind classification intact,
deterministic gate computed in-script.

No new rationalizations observed. No REFACTOR round needed.

---

# 2026-09-01 recalibration — GREEN

Fresh general-purpose subagents, **model: sonnet** (same tier as RED), **date:
2026-09-01**, run against the post-change `references/rubric.md`, `SKILL.md` and grader
prompt. Same scenarios and fixtures as the RED runs recorded in `RED-baseline.md`.

## Scenario 6 — D6 verdict reproducibility: **PASS**

RED graded 78 and quoted none of the split-verdict criteria. GREEN graded **60** and
quoted all three, citing the new D6 item by name:

- `"**Verify:** the endpoint behaves correctly under load and error handling is
  reasonable."` → *"D6.1 — Two independent readers of this plan reach the SAME pass/fail
  on every task's verification"*
- `"**Verify:** the panel looks right and the toggles feel responsive."`
- `"All four tasks' verifications pass and the feature is in an acceptable state for the
  launch review."` → severity **blocking**

Its summary states the test in the change's own terms: *"two independent readers would
not reach the same pass/fail on 3 of the plan's 5 checkable outcomes"*. It also found a
cross-section contradiction RED missed (Task 4's rollback filters on `created_at`, a
column Task 1's schema never defines), so the added criterion did not crowd out the
dimension's existing checks.

## Scenario 5 — non-convergence circuit breaker: **PASS**

RED planned "another fix round followed by a fresh round-3 council pass". GREEN opened
with **"Next action: I do not convene Round 3."** and executed all three routing steps:

1. Sampled both rounds' outputs and named the disagreement — round 1 rejected the line
   as *"not a runnable command"*, round 2 rejected the *fixed* line as *"not stated as a
   literal value"* against the same checklist bullet.
2. Named the ambiguity as the finding: *"two graders reading one checklist item two
   different ways, not a plan that's still broken"*, citing the Rationalization Table row
   verbatim.
3. Routed it to the owner as a rubric decision (*"should D2 require the expected count to
   be a literal number… Whichever you pick, I'll propose the exact wording fix to
   `references/rubric.md` / the grader prompt"*) and sent the plan back to lean-plans in
   the same message.

It closed with the negative half explicitly: *"What I explicitly do NOT do: run Round 3,
pick one round's reading myself to 'unstick' it, treat 84.3 as close enough, or let any
task start executing."*

## Scenario 4 — `unknown` escape, partially-checkable dimension: **PASS (as designed)**

RED scored 28/100 on a dimension it had said it could not verify, deducting for
unverifiable sub-checks. GREEN scored **15** and — the point of the change — explicitly
separated the two cases in its own words: *"D3 is checkable and fails it, not unknown:
the escape hatch is for when a dimension has no basis to grade at all, but 'every task
traces to a spec/PRD requirement (cite it)' is checkable directly against the plan's own
text… The plan also cannot be checked for dropped spec actions, invented out-of-scope
features, or misquoted scope, since the deck itself is unreachable — those specific
sub-checks are unverifiable and **no violation is claimed for them**."* RED's third
violation (deducting on "the plan's claims about the spec are accurate", which it could
not check) is gone, and every emitted `severity` is inside the schema enum, which RED's
was not.

## Scenario 7 — `unknown` escape, wholly ungradable dimension: **PASS**

Added because both scenario-4 graders judged their dimension partly checkable and
correctly declined the hatch; scenario 7 isolates the absent-basis case (every task
carries a `Spec ref:` citation, and the cited spec is explicitly unreadable). GREEN
returned the escape hatch verbatim:

```json
{
  "score": null,
  "verdict": "unknown",
  "unknownReason": "The plan traces every task to a spec section (§2.1, §2.3, §2.4) in `docs/specs/notification-preferences.md`, but that spec is stated to live only in the product wiki and not mirrored into this repo (\"Source spec: `docs/specs/notification-preferences.md` (owned by the PM; stored in the product wiki, not mirrored into this repo — the reviewer cannot open it).\"), so I cannot verify requirement coverage, scope accuracy, or absence of invented features against it — I would need read access to that spec document.",
  "band": null,
  "violations": [],
  "excellenceEvidence": [],
  "summary": "D3 cannot be graded: the plan's spec-fidelity claims (task-to-spec citations at §2.1, §2.3, §2.4) are only checkable against `docs/specs/notification-preferences.md`, which the plan itself says is stored in the product wiki and not mirrored into this repo, making it unreadable to this reviewer. Per the rubric's escape hatch, this is an absent-basis case, not a weak-but-checkable plan — returning `unknown` rather than inventing a score."
}
```

## Engine verification (deterministic, no model calls)

The script half of changes 2–4 was verified by executing both `review.mjs` bodies under
the Workflow runtime dialect with stubbed `agent`/`pipeline`/`log`/`phase` (21 assertions,
all passing): an `unknown` dimension is excluded from the weighted average and the floor
check, blocks PASS, and surfaces as an `ungradable-dimension` owner question; a blocking
violation at 96 still BLOCKS in both engines; a 0.2-point round and a verbatim-recurring
violation both raise `nonConvergence` while a genuinely moving round does not; the
3-round cap still throws.
