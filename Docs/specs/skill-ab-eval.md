# Skill Spec — skill-ab-eval

- **Problem:** The library can tell whether a skill *conforms to its own SKILL.md* and
  nothing more. `creating-a-skill` proves an agent that reads the skill obeys it;
  `skill-gardener` audits staleness; `evidence-gate` proves a claimed check ran. None of
  them answers the only question a release actually turns on: **does having this skill make
  an agent do better work than not having it, and on which model tiers?** So skills ship on
  conformance, and a skill that is a no-op — or a net negative on a cheap tier the owner
  routinely dispatches to — ships looking identical to one that works. The second half of
  the problem is the grader: 20+ security-review subagent sessions per day per project come
  back `completed-clean`, and nothing in the repo can distinguish "clean codebase" from
  "grader that talked itself into approving." An all-clean eval is currently unfalsifiable.
- **Trigger:** Before a new or materially-edited skill is released (the repo's PR-to-`main`
  flow), and on demand when someone asks "does this skill actually help?", "is this skill
  worth shipping?", "prove the skill does anything", or when a judging agent's verdicts look
  degenerate — a long run of identical `completed-clean` outcomes.
- **Scope:** Run the skill's existing `tests/scenarios/<skill>/scenario-*.md` in paired
  with-skill / without-skill arms across at least two model tiers, grade each run by reading
  the full transcript with single-dimension judges, plant a seeded canary so a clean batch is
  positive evidence, tabulate the pairs with a bundled deterministic script, and write a
  ship / no-ship / ship-for-tier-X recommendation to `Docs/skill-eval-<skill>-YYYY-MM-DD.md`.
  **Non-goals:** it never edits the skill under evaluation (or any skill), never opens a PR,
  never re-runs `creating-a-skill`'s authoring loop, and does not grade documents
  (`plan-review`/`prd-review` do that). It measures efficacy; it does not repair it.
- **Success scenario:** A skill's GREEN result shows 3/3 scenarios passing with the skill on
  sonnet and the release window is 25 minutes out. The eval runs both arms on sonnet and
  haiku, and the without-arm passes 3/3 on sonnet too — the scenarios never discriminated.
  Sonnet delta is 0pp; the canary (a scenario known to fail without the skill) correctly
  fails in the without arm, so the grader is provably alive and the 0pp is real. The report
  recommends **no-ship as written**, names the non-discriminating scenarios as the defect,
  and does not touch the skill.
- **Bundled assets:** `scripts/paired-table.mjs` (+ `paired-table.test.mjs`) — the paired
  results tabulator; `references/judging.md` — the single-dimension judge contract, the
  canary protocol, and the dispatch prompt skeletons.

## Why this exists now (CONTRIBUTING linkage)

CONTRIBUTING's RED step requires the model identifier and date at the top of
`RED-baseline.md`, on the reasoning that **a baseline is a per-model fact** and an
unattributed baseline is not re-checkable. This skill is the direct consequence of that
rule taken one step further: if the baseline is a per-model fact, then so is the skill's
*benefit*, and a ship decision read off one tier is exactly the unattributed claim
CONTRIBUTING already refuses. `skill-ab-eval` is the gate that makes the recorded model
mean something — it turns "the baseline failed on sonnet" into "the skill moves sonnet
+50pp and moves haiku −33pp, therefore ship for sonnet only." Any change to CONTRIBUTING's
model-recording rule is a change to this skill's input contract.

## The paired design (what is fixed, and why)

| Element | Requirement | Reason |
|---|---|---|
| Prompt set | The skill's own `tests/scenarios/<skill>/scenario-*.md`, verbatim | They were authored from observed failures; inventing new prompts at eval time selects for the skill |
| Arms | Same scenario, same tier, run twice: skill in context / skill absent | Paired per-instance comparison; an unpaired point estimate is noise (single-run pass@1 varies 2.2–6.0pp) |
| Tiers | ≥2, default `sonnet` + `haiku`; `opus` optional | Skill benefit is not uniform across model generations; one tier can badly mislead a ship decision |
| Grading input | The **full transcript** of each run | Aggregate pass rates hide broken and gameable graders |
| Judges | One judge per rubric dimension, isolated, named, each with an explicit `Unknown` escape | Decomposed anchored rubrics agree with humans far better than one monolithic rubric; without an escape, uncertainty is silently scored as pass or fail |
| Canary | One seeded scenario known to fail without the skill, run in the without arm every batch | A clean batch is otherwise indistinguishable from a dead grader |
| Tabulation | The bundled script, from a verdict JSON | Deltas, pair completeness, and canary logic are mechanical; re-deriving them inline is where averaging-away-a-regression happens |

## Verdict input contract (`paired-table.mjs`)

```json
{
  "skill": "date-safety",
  "date": "2026-09-01",
  "canary": { "scenario": "canary-tz-shift" },
  "runs": [
    { "tier": "sonnet", "scenario": "scenario-1", "arm": "without", "verdict": "fail",
      "dimensions": { "root-cause": "fail", "evidence": "unknown" } }
  ]
}
```

- `arm` ∈ `with` | `without`; `verdict` ∈ `pass` | `fail` | `unknown`.
- `unknown` is counted and reported separately — never folded into pass or fail.
- `dimensions` is optional per run; when present, a run whose dimension verdicts disagree
  with its top-line verdict is reported as a judge disagreement.

## Flags the script raises (all blocking; non-zero exit)

| Flag | Meaning |
|---|---|
| `CANARY_MISSING` | No without-arm run for the declared canary scenario — the batch has no liveness proof |
| `CANARY_PASSED` | The canary passed without the skill — the grader is not discriminating; every verdict in the batch is void |
| `SINGLE_TIER` | Fewer than two tiers — a per-tier fact was reported as a global one |
| `PAIR_INCOMPLETE` | A (tier, scenario) missing one of its arms — no pair, no delta |
| `NO_LIFT` | A tier where without-arm passes ≥ with-arm passes — the decision-relevant half |
| `NO_VARIANCE` | Every run in the batch passed — the degenerate-grader signature |
| `JUDGE_DISAGREEMENT` | A run's dimension verdicts contradict its top-line verdict |

## Report contract (`Docs/skill-eval-<skill>-YYYY-MM-DD.md`)

1. Header: skill, date, commit/tree under test, and the **exact model id pinned per tier**.
2. Paired table: tier × scenario × with/without × verdict, one row per run.
3. Per-tier deltas and every raised flag, verbatim from the script.
4. Judge disagreements and every `Unknown`, with the dimension that abstained.
5. Canary outcome, stated as the liveness claim it is.
6. One recommendation: **ship** / **no-ship** / **ship-for-tier-X**, with the tiers it does
   not cover named explicitly.

## Orchestration

Runs and judges are dispatched with the `Agent` tool, model pinned explicitly on every
dispatch. The `Workflow` tool is deliberately not used: the fan-out is small (tiers ×
scenarios × arms), and `AGENTS.md` records that `Workflow` does not port outside Claude
Code — an efficacy gate that only one harness can run is not a gate.

## Testing

`creating-a-skill` conventions: RED baseline then GREEN under
`tests/scenarios/skill-ab-eval/`, model and date recorded at the top of each. Scenarios
cover: (a) conformance evidence offered as efficacy evidence under release pressure;
(b) an all-clean batch whose canary also passed; (c) a tier split pooled into a positive
average. Gates: `node tools/lint-frontmatter.mjs`, `npm test`.
