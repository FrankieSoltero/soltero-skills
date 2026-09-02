# skill-ab-eval — judges, dispatches, and the verdict schema

## Verdict JSON (what `paired-table.mjs` consumes)

```json
{
  "skill": "date-safety",
  "date": "2026-09-01",
  "tiers": { "sonnet": "<exact model id used>", "haiku": "<exact model id used>" },
  "judge": "isolated single-dimension judges, Unknown escape, one call per dimension per run",
  "canary": {
    "scenario": "canary-tz-shift",
    "note": "known to fail without date-safety: bare new Date('2026-03-08') across a DST boundary"
  },
  "runs": [
    {
      "tier": "sonnet",
      "scenario": "scenario-1",
      "arm": "without",
      "verdict": "fail",
      "transcript": "Docs/evals/transcripts/sonnet-scenario-1-without.md",
      "dimensions": { "correct-choice": "fail", "cited-rule": "fail", "no-side-effects": "pass" }
    }
  ]
}
```

- `arm` is `with` or `without`; `verdict` is `pass`, `fail`, or `unknown`.
- `tiers` and `transcript` are for the human reading the report — the script ignores them,
  and the report is not complete without them.
- `dimensions` is optional per run. When present the script cross-checks it against the
  top-line verdict and raises `JUDGE_DISAGREEMENT` on a contradiction: a dimension that
  abstained under a scored run, a failed dimension under a `pass`, or an all-pass dimension
  set under a `fail`. That check is the whole reason to record dimensions.
- The canary's runs are excluded from the pass-rate math. It measures the grader, not the
  skill, and must never pad a delta.

## Seeding the canary

Pick a task in the same shape as the skill's scenarios where an unaided agent is *known* to
go wrong — from the skill's own `RED-baseline.md`, from `Docs/mistakes-and-fixes.md`, or
from an incident. Two properties matter:

1. Its failure without the skill is established, not assumed. A canary you hope will fail
   proves nothing when it passes.
2. It is a real scenario, not a trick. A canary the skill itself would not help with tests
   the grader's pedantry rather than its liveness.

Re-seed when a canary starts passing legitimately (the models moved past it). Re-seeding is
a batch-invalidating event: the old batch's liveness proof is gone with it.

## Run dispatch skeleton

One `Agent` call per (tier, scenario, arm). `model` is pinned on every one. The two arms are
byte-identical apart from the skill block.

> **With arm** — prepend to the scenario text:
>
> "The following skill is loaded and applies to this task:
> `<full contents of skills/<skill>/SKILL.md>`"
>
> **Without arm** — the scenario text alone, with no mention that a skill exists.

Both arms close with the standing lines:

> "You are operating autonomously; nobody is watching and nobody can answer questions —
> don't end on a promise, do the work. Every claim you make must trace to a tool result from
> this session. State your choice and act on it."

Give each arm its own scratch workspace. Two runs sharing a directory read each other's
output and stop being independent — that happened during this skill's own baseline and cost
a re-run.

## Judge dispatch skeleton

One `Agent` per rubric dimension per run. Each judge sees **one** dimension and **one**
transcript, and knows nothing about the arm, the tier, or the other dimensions — a judge
told which arm it is reading will find the result it expects.

> "You are grading one dimension of one agent run. The dimension is **<name>**: <one
> sentence defining what counts as meeting it>.
>
> Here is the full transcript of the run: <transcript>
>
> Answer with exactly one of `pass`, `fail`, or `unknown`, then one sentence of evidence
> quoted from the transcript.
>
> `unknown` is a real answer and carries no penalty: use it whenever the transcript does not
> let you tell. Do not resolve uncertainty into `pass` to avoid blocking anyone, and do not
> resolve it into `fail` to look rigorous. Judge only this dimension — another judge is
> covering the rest.
>
> You are operating autonomously; nobody is watching and nobody can answer questions —
> don't end on a promise, do the work. Every claim you make must trace to the transcript
> text in front of you."

Pin the judge model too, and use the same model for every judge in a batch — a mixed judge
panel makes the disagreements uninterpretable.

**Rolling dimensions into a top-line verdict.** All dimensions `pass` → `pass`. Any
dimension `fail` → `fail`. Otherwise (an abstention with no failure) → `unknown`. Never let
an `Unknown` roll up to `pass`; the script flags it when it does.

**Rubric dimensions** come from the skill under test — its hard rules, one dimension each,
plus one for "took no action the skill forbids". Three to five is usually the whole rubric;
a dimension nobody can define in a sentence is not a dimension.

## Reading the transcripts yourself

The judges are not the last word. Read a sample of full transcripts and the judges' own
outputs before writing the report — that is how gameable and dead graders are caught, and
aggregate pass rates never show it. When a judge's verdict diverges from your own read,
rewrite that judge's dimension definition against the divergence case and re-grade. Expect
more than one round; residual gaps are normal and belong in the report rather than being
smoothed over.

## Report skeleton

```markdown
# Skill efficacy eval — <skill> — YYYY-MM-DD

Tree under test: <commit/tree>
Tiers and pinned model ids: sonnet=<id>, haiku=<id>
Judge design: isolated single-dimension, Unknown escape, model=<id>

<paste of `paired-table.mjs --md`: paired table, per-tier delta, canary, disagreements, flags>

## Judge disagreements and abstentions
<per row: which dimension abstained or contradicted, and what the transcript showed>

## Recommendation
**ship** / **no-ship** / **ship-for-<tier> only**
<the tiers this does not cover, named; the flags that stand; what would change the answer>
```

## Cost, honestly

Two arms × two tiers × N scenarios, plus one judge call per dimension per run, is roughly
`4N` agent runs and `4N × |dimensions|` judge calls, before any re-grade round. For a
three-scenario skill with four dimensions that is 16 runs and 64 judge calls. Isolated
judges are the expensive half and they are the half that works. Spend it at release, not on
every edit — and never spend it by shrinking to one tier, which is the one economy that
destroys the result.

## Outside Claude Code

`Agent` dispatch and pinned model tiers are Claude Code mechanisms. On another harness, run
the arms with whatever equivalent it offers and keep the two properties that matter:
identical prompts apart from the skill block, and a grader that judges one dimension at a
time with a real way to abstain. `paired-table.mjs` is plain Node and runs anywhere; the
flag vocabulary is the portable part of this skill.
