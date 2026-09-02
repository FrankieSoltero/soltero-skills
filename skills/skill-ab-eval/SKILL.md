---
name: skill-ab-eval
description: Use before releasing a new or materially-edited skill, or when someone asks "does this skill actually help?", "is this skill worth shipping?", "prove the skill does anything", or a judging agent's verdicts look degenerate (a long run of identical "completed-clean" outcomes) — runs the skill's own scenarios in paired with/without arms across at least two model tiers, grades each run off the full transcript with one isolated judge per rubric dimension (each able to return Unknown), plants a canary scenario known to fail without the skill so a clean batch is evidence the grader is alive, tabulates the pairs with a bundled script, and writes a ship / no-ship / ship-for-tier-X recommendation to Docs/skill-eval-<skill>-YYYY-MM-DD.md. Measures efficacy, never conformance; never edits the skill.
---

# Skill A/B Eval

## Overview

`creating-a-skill` proves a skill's own scenarios pass when the skill is loaded. That is
conformance. It cannot tell a skill that works from a skill that changes nothing, because a
scenario an unaided agent already passes will pass either way. **This skill measures the
difference the skill makes** — same scenarios, run with it and without it, on more than one
model tier, graded off what the runs actually did.

It follows CONTRIBUTING's rule that a RED baseline records its model, and finishes the
thought: if a baseline is a per-model fact, so is a skill's benefit. A ship decision read
off one tier is the unattributed claim that rule already refuses.

## When to Use

- Before a new or materially-edited skill is released (`creating-a-skill` Hard Rule 3).
- On demand: "does this skill actually help?", "is it worth shipping?".
- When a grading or reviewing agent's verdicts look degenerate — many identical clean
  outcomes in a row.

## When NOT to Use

- The skill has no scenarios yet. Go finish `creating-a-skill`'s loop; there is nothing to
  pair.
- You want to know whether a skill matches its spec. That is conformance — `creating-a-skill`
  owns it, and this skill will not answer it.
- Grading a document (`plan-review`, `prd-review`) or auditing skill lifecycle/staleness
  (`skill-gardener`).

## The Iron Law

```
AN EFFICACY CLAIM COMES FROM RUNS THIS EVAL PRODUCED AND TRANSCRIPTS IT READ
```

Baselines graded a skill's efficacy off a pre-existing verdict summary sitting in the
workspace — no run dispatched, no transcript opened, no model pinned — and published a ship
verdict from it. A verdict file is somebody's conclusion, not evidence. **If the batch has
no transcripts to read, that is a blocking defect and there is no recommendation to make**;
produce the runs or report that you could not.

## The loop

1. **Collect.** Every `tests/scenarios/<skill>/scenario-*.md`, verbatim. Do not invent
   prompts at eval time — inventing them selects for the skill.
2. **Seed the canary.** One extra scenario in the same shape, chosen because an agent
   *without* the skill is known to get it wrong. It runs in the without arm on every tier.
   Without it, a clean batch and a dead grader are the same picture.
3. **Run both arms.** For each tier × scenario: one `Agent` dispatch with the skill's full
   `SKILL.md` in context, one with it absent, everything else identical. Pin `model`
   explicitly on every dispatch — an omitted model inherits the session's and the tier
   column becomes a guess. Default tiers: `sonnet` and `haiku`; add `opus` when the skill
   targets it. Keep each run's full transcript.
4. **Grade the transcripts.** One `Agent` per rubric dimension per run, isolated, named,
   each allowed to return `Unknown` — see `references/judging.md` for the judge contract and
   the dispatch skeleton. Never one monolithic judge: with no way to abstain it resolves
   uncertainty into whichever verdict is cheapest, and the baseline caught exactly that
   ("scored pass to avoid blocking").
5. **Tabulate.** Write the verdicts to JSON and run the bundled script. It owns the
   counting, the deltas, the pair logic and the flag names, so two evals of two skills are
   comparable and nothing is counted by eye:

   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/paired-table.mjs <verdicts.json> --md
   ```

   Exit 0 = no blocking flag. Exit 1 = at least one flag; the batch does not support a ship
   decision as it stands. Exit 2 = malformed input.
6. **Report.** `Docs/skill-eval-<skill>-YYYY-MM-DD.md`: the model id pinned per tier, the
   paired table and flags verbatim from the script, every judge disagreement and `Unknown`
   with the dimension that abstained, the canary outcome stated as the liveness claim it is,
   and one recommendation — **ship**, **no-ship**, or **ship-for-tier-X** with the tiers it
   does not cover named.

## The canary is the batch's liveness proof

A canary that **fails** without the skill is what makes the rest of the batch readable. A
canary that **passes** without the skill voids the batch — every verdict in it, in both
directions.

It needs no corroboration, and corroboration cannot rescue it. One baseline called a passing
canary "ambiguous" on its own and voided only because an unrelated skill's eval happened to
sit in the same directory with a confessional note in it. Another went the other way: it saw
both canary rows pass, reasoned that the judge had failed a *different* skill's canary so it
must be alive, and published a NO-SHIP verdict computed from the dead batch. Another batch's
grader is not this batch's control, and both directions are the same error — a measurement
problem laundered into a skill verdict.

Void means void: re-seed or rebuild the grader and re-run. No no-ship comes out of it either.

## Flags (from the script — all blocking)

| Flag | What it means |
|---|---|
| `CANARY_MISSING` | No usable without-arm canary verdict — the batch has no liveness proof |
| `CANARY_PASSED` | The canary passed without the skill — every verdict is void |
| `SINGLE_TIER` | One tier only — a per-tier fact reported as a global one |
| `PAIR_INCOMPLETE` | A (tier, scenario) missing an arm — no pair, no delta |
| `NO_LIFT` | A tier where without-arm passes ≥ with-arm passes — the decision-relevant half |
| `NO_VARIANCE` | Every run passed, both arms — the degenerate-grader signature |
| `JUDGE_DISAGREEMENT` | A run's dimension verdicts contradict its top-line verdict |

`NO_LIFT` fires per tier and is a finding to report, not a failure to fix: a skill that
lifts sonnet and does nothing on haiku ships **for sonnet only**, with haiku named. Pooling
the tiers into one average is how that regression disappears.

## Boundaries

- **Never edit the skill under evaluation**, or any skill, or its scenarios. Patching a
  SKILL.md to close a gap the eval just found makes the next run measure the patch instead
  of the skill, under deadline pressure, with no evidence for what the patch should say.
  Report the gap; `skill-patcher` and `creating-a-skill` own the repair.
- Never open a PR, merge, or advance a release. This produces a recommendation.
- Never rewrite or "correct" the verdict JSON after the fact. Re-grade by re-running judges
  on the transcripts, not by reinterpreting an earlier judge's recorded output. Surfacing an
  `Unknown` an earlier judge already recorded — via the script's `JUDGE_DISAGREEMENT` output
  — is reporting that batch's defect, not a re-grade: it can withdraw support from a verdict,
  never upgrade one, and never substitute for reading the transcript.
- Use the `Agent` tool for runs and judges, with `model` pinned. Do not use `Workflow`: the
  fan-out is small, and per `AGENTS.md` a `Workflow` script does not port outside Claude
  Code — an efficacy gate only one harness can run is not a gate.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "GREEN is 3/3 with the skill — that's the strongest evidence the process asks for." | It shows the spec was followed while the skill was loaded. If the unaided baseline also passed 3/3, a no-op skill produces that same record. |
| "There's already a verdict file in the workspace with both arms in it." | That is someone's conclusion, not your evidence. Runs you produced, transcripts you read, or no claim. |
| "The canary passing just means the scenarios are easy now." | Then you cannot tell that from a grader that stopped discriminating — which is what the canary exists to distinguish. Void the batch. |
| "The same judge failed another skill's canary, so it works." | Liveness is per batch. Another batch's grader is not this batch's control. |
| "Both arms scored 100%, so the honest read is 0pp lift, no-ship." | A grader that cannot fail a seeded known-bad case cannot certify anything. No-ship is as unsupported as ship. |
| "Pooled across tiers it's +33pp — ship it." | Pooling hides the tier reversal. Report per tier; ship for the tiers that moved. |
| "Haiku is the cheap tier, that arm is just noise." | It is the tier the team routes grunt work to. A tier you dispatch to is a tier the claim has to cover. |
| "One spot check without the skill is enough — if it fails, the skill works." | One run, one tier, no pair. Single-run pass rates swing several points on their own. |
| "The judge wasn't sure, so I scored it pass to avoid blocking." | That is the failure this design exists to remove. `Unknown` is a verdict; report it. |
| "I'll re-grade by applying the right rule to the old judge's notes." | Repairing stale output is not a re-grade. Fresh isolated judges, reading the transcript. An `Unknown` the old judge recorded can be reported as that batch's defect — it never turns a fail into a pass. |
| "Two minutes and I could patch the skill to close the haiku gap." | Then the next run measures your patch. Report the gap; do not touch the skill. |
| "Three PRs are blocked and it's 6pm." | Schedule pressure is not evidence. The recommendation waits for the numbers. |

## Red Flags — STOP

- About to write a ship or no-ship line while `CANARY_PASSED` or `CANARY_MISSING` stands → stop, the batch is void in both directions.
- About to grade from a verdict summary, pass-rate table, or another agent's report instead of a transcript → stop, that is not evidence.
- No transcripts exist for the batch → stop; that is a blocking defect, not a reason to grade the summary.
- Counting passes by eye, or writing your own table shape → stop, run `paired-table.mjs`.
- One tier measured → stop, `SINGLE_TIER` is blocking for a reason.
- Averaging tiers into a single delta → stop, report per tier.
- A model left unpinned on any dispatch → stop, the tier column is then a guess.
- Reaching for the skill's `SKILL.md` in an editor → stop, this skill never edits it.

## Details

`references/judging.md` — the single-dimension judge contract, the run and judge dispatch
skeletons, the canary-seeding protocol, and the verdict JSON schema the script consumes.
