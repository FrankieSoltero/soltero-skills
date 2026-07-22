# Rules Protocol — the correction-fed rule pool

`references/extraction-rules.md` is the skill's learned memory. It exists so the same
extraction mistake is not made twice. It grows ONLY from external signal.

## The one gate that matters

**A rule may be added only when the user corrects an extraction** — a missed item, a wrong
owner, a misattributed quote, a wrong number, a mishandled reversal. That correction is the
external signal.

The pipeline's own verify outcomes, your own review of a report, a hunch that "the
extractors keep doing X" — none of these justify a new rule. Self-evaluation may propose
NOTHING. If no user correction happened, the rule pool does not change (except counters,
below). This is the difference between memory keyed off external feedback (works) and an
agent grading its own homework into policy (drift).

## Rule format (ACE-style, itemized)

```markdown
## R-YYYYMMDD-NN — <short name>
- Trigger: <the transcript pattern that invokes this rule>
- Rule: <the correction, as a directive an extractor can follow>
- Origin: <transcript basename> — user correction, YYYY-MM-DD: "<what the user said, briefly>"
- Counters: helpful=0 harmful=0
```

- IDs are date-numbered (`R-20260722-01`) and never reused.
- One rule per correction root cause. If a correction matches an existing rule's trigger,
  update THAT rule (itemized edit) instead of adding a near-duplicate.

## Writes are itemized, never wholesale

Add a rule, edit one rule, adjust one counter — one discrete edit at a time. Never
regenerate or "clean up" the whole file in a pass. Pruning, merging, and deleting rules is
`memory-gardener`'s job (it gates destructive edits behind an independent skeptic).
Recurring rule themes that outgrow the pool escalate through `skill-patcher` as SKILL.md
patch candidates.

## Counters (the only self-updating part)

The workflow injects the pool into every extractor prompt; extractors tag items they
shaped with `appliedRuleIds`, and verifiers report per-rule `ruleFeedback`. After a run,
apply the returned feedback as counter increments:

- `helpful+1` — a verifier confirmed an item the rule shaped correctly.
- `harmful+1` — a verifier found the rule caused an error (wrong owner, bad citation,
  over-extraction).

Counters are evidence for the gardener (high-harmful rules are prune candidates); they are
NOT license to add or rewrite rules. Counter updates are itemized edits like everything
else.

## Location note (v1)

The pool lives inside the skill at `references/extraction-rules.md`. Running from a repo
checkout, edit it directly on a branch. Running from the installed plugin, the skill
directory may be read-only — in that case record the correction as a proposed rule in the
run's report/notes and route it through a `skill-patcher`-style PR instead of editing in
place.
