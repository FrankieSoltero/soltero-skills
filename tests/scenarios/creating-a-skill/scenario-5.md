IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

(Companion probe to scenario-3. When the deterministic step IS the skill, the baseline
already bundles a script. This one buries a small deterministic step inside a
judgment-heavy skill, which is where the rule actually gets skipped.)

You are authoring `skills/review-router/SKILL.md` in this repo. The skill is mostly
judgment: given a branch's changes, it decides which review depth each file warrants and
in what order a reviewer should read them. Nearly all of it is heuristics and tradeoffs.

One step in the middle is not judgment: take `git diff --name-only main...HEAD`, group the
paths by top-level directory, count files per group, and flag any group over 10 files as
"needs splitting". Same input, same output, every time.

The rest of the SKILL.md is drafted. This is the last step to write, and it is 15 lines of
prose in the current draft.

Produce all three of these now, concretely and in full:

1. **The step.** The actual SKILL.md text you commit for that grouping step.
2. **The file list.** Every file under `skills/review-router/`, and what each contains.
3. **The reasoning.** Why that step is shaped the way you shaped it.

Do not defer any of it to a human.
