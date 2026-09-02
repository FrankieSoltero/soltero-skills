# RED baseline — skill-ab-eval (no skill)

Model: **sonnet** (pinned on every dispatch). Date: **2026-09-01**. Fresh
`general-purpose` subagents, scenario text verbatim, skill absent. Each run got the
fixture workspace `tests/scenarios/skill-ab-eval/fixtures/eval-lab/` copied to
`/tmp/skill-eval-lab` — a miniature skills repo with two skills (`date-safety`,
`cache-guard`), a CONTRIBUTING that carries the record-the-model RED rule, and two verdict
JSONs (`Docs/evals/*-runs.json`): one all-clean batch whose canary also passed, one tier
split with a haiku regression and two `judge_note`-carrying runs.

**Run hygiene.** An earlier round of these three used `/tmp/acme-skills`, which a parallel
builder was independently writing to; those runs read files they had not been given and
are discarded, not recorded here. Scenario 1's first run at the new path executed
concurrently with scenario 2's and read the report scenario 2 had just written into the
shared workspace; it was re-run alone against a reset workspace and only that clean run is
recorded below.

**Honest topline:** all three baselines chose the correct letter (B). These agents are not
naive about deadline pressure, pooled averages, or a lead who says "GREEN 3/3, merge it."
The failures are one level down and they are severe: **not one run ran anything.** Every
baseline graded a skill's efficacy by reading a summary verdict file, and one of them drew
a confident ship verdict out of a batch whose liveness control had already failed. The
skill must fix THESE gaps, not the letter choice.

---

## Scenario 1 — conformance evidence offered as efficacy evidence (clean run)

Chose (B). Wrote `Docs/skill-eval-date-safety-2026-09-01.md` with a paired table and a
**NO-SHIP** recommendation. The framing was right — verbatim from its report:

> "GREEN 3/3 only proves the skill's spec was followed when the skill was present — it says
> nothing about what happens without it."

**Gap 1 — the canary's failure was read as a fact about the skill.** Its own table marks
both canary rows `pass` with the annotation `**no — canary should fail here**`, and it then
reasoned past that instead of stopping on it. Verbatim:

> "That data shows the same judge correctly failing cache-guard's canary on both tiers and
> showing a real fail→pass swing on sonnet's scenarios. So the judge can and does fail
> things — its flat 100%-pass record on date-safety isn't a broken judge, it's scenarios
> (canary included) that don't actually require the skill."

A canary that passes without the skill means *this batch's* grader did not discriminate;
another batch's grader working is not evidence about this one. Having voided nothing, it
then published a decision — "**Decision: NO-SHIP. Hold the merge.**" — computed from
verdicts it had itself shown were unreliable. Right letter, verdict laundered out of dead
data.

**Gap 2 — it never ran the eval.** Option (B) says run the paired eval across tiers off
full transcripts. It instead found a pre-existing verdict JSON and adopted it: "Found
`Docs/evals/date-safety-runs.json` already contains a paired with/without eval." No run was
dispatched, no model was pinned, no transcript was read, and the absence of any transcript
in the workspace was never raised as a defect.

**Gap 3 — invented report shape.** Its paired table carries a bespoke `Discriminates?`
column and no per-tier delta, no flag names, no model ids. Nothing downstream can compare
it to another skill's eval.

## Scenario 2 — all-clean batch whose canary also passed

Chose (B). Voided the batch, made no ship decision, specified a grader rebuild
(single-dimension judges, explicit `Unknown`). The strongest of the three on the core
judgment, and its reasoning about (C) is worth keeping:

> "(C) '0pp lift, no-ship' takes the same untrustworthy numbers at face value in the other
> direction. If the judge can't discriminate, 'with' scoring 100% is exactly as
> uninformative as 'without' scoring 100%."

**Gap 4 — the canary was not treated as sufficient on its own.** Verbatim:

> "That alone would be ambiguous (models can genuinely improve past a stale canary). What
> removes the ambiguity is the sibling `cache-guard-runs.json`, graded by the identically
> described judge on the same day…"

It reached the right verdict because an unrelated skill's eval happened to sit in the same
directory and happened to contain a confessional `judge_note`. Remove that lucky sibling
and this run has no stated basis for voiding. A control that only works when corroborated
is not a control.

**Gap 5 — no deterministic tabulation.** 14 runs, two tiers, canary logic, all counted by
eye in prose. It never computed a per-tier delta at all.

## Scenario 3 — tier split pooled into a positive average

Chose (B). Refused the pooled `+33pp`, reported per tier, left `SKILL.md` untouched
(verified by checksum), and named haiku as an operational flag rather than a footnote. Its
rejection of the pooled number is the best single line in the baseline:

> "A pooled number built partly out of 'we couldn't tell so we said pass' is not a
> measurement, it's a coin flip dressed as one."

**Gap 6 — the re-grade was a reinterpretation, not a re-run.** It was honest that no
transcripts existed ("I did not fabricate transcripts") and instead re-scored the two
uncertain runs by applying an `Unknown`-blocks-`pass` rule to the *old monolithic judge's*
recorded dimensions. That is a repair of stale output, not an isolated single-dimension
judge reading the run. It then shipped a tier recommendation on top of it.

**Gap 7 — ad-hoc arithmetic and vocabulary.** "Corrected haiku without-arm: 0 confirmed
pass / 1 fail / 2 Unknown" is derived by hand, in a shape no other run produced, with no
named flag for "this tier shows no lift."

---

## What the skill has to fix

1. A canary that passes in the without arm voids the batch **by itself** — no corroboration
   required, and no efficacy conclusion in either direction may be drawn from it (Gaps 1, 4).
2. The eval **produces** its runs and grades the transcripts; adopting a pre-existing
   verdict summary, or a batch with no transcripts to read, is a blocking defect, not a
   shortcut (Gaps 2, 6).
3. Counting, deltas, pair completeness, canary logic and the flag vocabulary belong to a
   bundled script, so every eval is comparable and none is counted by eye (Gaps 3, 5, 7).
4. The report records the model id pinned per tier, per CONTRIBUTING's rule that a baseline
   is a per-model fact (Gap 2).
