# Skill Spec — prd-review

**Status:** Spec approved 2026-07-24 (user chose: aggregate ≥95 + per-dimension floor 80;
fix → re-review loop; bundled Workflow engine). Fourth child of
[writing-prds](writing-prds.md).

- **Problem:** Asked "is this PRD good enough to build against?", a single agent does a
  one-shot editorial read: no rubric, no score discipline, generous grades ("solid
  foundation, 8/10"), fixes offered as optional polish, and a green light to proceed
  with known flaws outstanding. Under pressure it rubber-stamps, and when asked to
  apply review fixes it self-certifies the result without any re-review. Weak PRDs
  flow into design and the requirements fictions become code.
- **Trigger:** A PRD needs a quality verdict before design/implementation ("review this
  PRD", "can we build against this?", "grade the PRD"); the review gate of
  soltero-skills:writing-prds (step 8); or a PRD was revised after a failed review.
- **Scope / non-goals:** Convene a 6-grader council via the bundled Workflow
  (`workflows/review.mjs`): one grader per dimension (problem-evidence 15, requirements
  20, stories-criteria 15, scope 15, metrics 15, consistency-ambiguity 20), each scoring
  0–100 against the band-anchored rubric (`references/rubric.md`) with PRD-quoted
  evidence for every deduction and for any score ≥90; adversarial skeptic on every ≥90
  score, confirmed miss → re-grade, script takes min(grade, regrade); deterministic
  weighted aggregate in script. Gate: overall ≥95 AND every dimension ≥80 AND zero
  blocking-severity violations outstanding, else verdict BLOCKED. (Blocking term added
  2026-09-01: the gate had no blocking-violation condition while the re-review selector
  already treated a dimension carrying one as failed, so a PRD could PASS at ≥95 with an
  outstanding blocking violation — parity with plan-review's gate.) Report to
  `docs/prd-reviews/YYYY-MM-DD-<topic>-review.md`. Fix loop: apply
  mechanical fixes to the PRD, escalate owner decisions as questions (never
  auto-answer), re-convene the council on the edited PRD; max 3 rounds; fixer never
  adjusts scores. Fallback when the Workflow tool is unavailable: same council via
  parallel Agent-tool subagents with identical prompts/rubric. Non-goals: reviewing
  code or design docs; replacing the user's approval; editing scores by hand.
- **Success scenario:** Given a flawed PRD (vague requirements, no out-of-scope, 12
  unsourced metrics, one contradiction), the skill runs the council, reports ~60–80
  overall with per-dimension evidence, stamps BLOCKED — do not proceed to design,
  applies mechanical fixes, asks the owner questions, and re-reviews — instead of
  "8/10, proceed while fixing".
- **Bundled assets:** `workflows/review.mjs`, `references/rubric.md`.

- **2026-09-01 recalibration** (owner-delegated, from the Fable 5.1 prompt audit
  `docs/audits/2026-09-01-fable-5.1/B-plan-prd-review.md`, findings 10–12):
  1. *Skeptic effort override removed.* The skeptic must read two files and quote them;
     at `effort: 'low'` a Fable-era model retrieves less and answers from memory more,
     which is the wrong trade for a verification role. Model alias unchanged (opus).
  2. *Per-dimension `unknown` escape.* A grader with no basis to grade its dimension
     returns `score: null, verdict: "unknown"` with a reason instead of a number. The
     script excludes it from the weighted average and the floor check, reports it as an
     owner question, and blocks PASS while one is outstanding (playbook, Proven: give
     LLM graders escape clauses rather than forcing a fabricated score).
  3. *Non-convergence circuit breaker.* `args.priorOverall` plus the prior round's
     dimensions let the script detect a round that moved < 2 points or that repeated a
     violation verbatim in a re-graded dimension; SKILL.md then stops the loop, samples
     the council's own outputs, names the rubric/prompt ambiguity producing the churn,
     routes a rubric/prompt fix proposal to the owner and the PRD back to writing-prds
     (playbook, Proven: detect repair-loop dead-ends by recurrence and switch strategy;
     evidence: the 9-round 79.2→84.3 run in `docs/debriefs/2026-08-29.md`, on the
     sibling plan-review engine).
  4. *Verdict reproducibility criterion* added to D6: two independent readers must
     reach the same pass/fail on every acceptance criterion; ambiguity that would split
     them is a violation with the quoted line (playbook, Proven: write
     specs precise enough that two independent experts reach the same verdict).
