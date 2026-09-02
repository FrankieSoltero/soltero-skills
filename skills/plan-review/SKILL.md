---
name: plan-review
description: Use when an implementation/execution plan needs a quality verdict before anyone executes it ("review this plan", "ready to execute?", "grade the implementation plan"), after soltero-skills:lean-plans produces a plan, before soltero-skills:lean-sdd runs one, or when re-reviewing a revised plan — convenes a 6-dimension grading council (bundled workflow: rubric-anchored scores with plan-quoted evidence, anti-inflation skeptics, deterministic gate) instead of one agent's ungraded read, and enforces: overall ≥85 AND every dimension ≥80 AND zero blocking violations, else BLOCKED with no execution, no "bless the first few tasks", no absorb-as-we-go. Fix→re-review loop (max 3 rounds, re-grading only the dimensions that failed); the fixer never changes the verdict and never re-reviews its own fixes — only a fresh council round can. Small all-mechanical-tier plans get a lite single-reviewer mode instead of the full council. Sibling of soltero-skills:prd-review.
---

# Plan Review Council

> **Portability note (non-Claude-Code agents):** the graded verdict here comes from an
> independent multi-agent council (rubric-anchored scorers plus anti-inflation
> skeptics), run via Claude Code's `Workflow` tool — not available on other CLIs.
> Without it you can still apply the same rubric and gate (overall ≥85, every dimension
> ≥80, zero blocking violations) as a solo reviewer, but a self-graded review is exactly
> the failure mode this skill exists to prevent — treat your own verdict as provisional,
> not a real pass.

## Overview

Asked "is this plan ready to execute?", a solo reviewer often catches the flaws — then
gives the gate away: under sprint pressure it blesses "the safe first tasks", downgrades
security ordering and scope creep to "absorb as we go", and after applying fixes it
proposes a 10-minute diff-confirm (by itself) instead of a review round. This skill
replaces prose verdicts with a scored council and a gate only the council can open.

<HARD-GATE>
A plan that has not PASSED (overall ≥85 AND every dimension ≥80 AND zero
blocking-severity violations AND zero ungradable `unknown` dimensions, from an actual
council run) must not be executed — not by
soltero-skills:lean-sdd, not by any other executor, not by a human "picking up task 1". There is no safe
subset: severity and task-safety come from the rubric, not from a deadline, a loaded
sprint board, or who skimmed it. You never green-light on your own read, you never
adjust or estimate a score, and you never re-review your own fixes.
</HARD-GATE>

## When to Use / When NOT to Use

- **Use:** any request to review/grade/approve an implementation or execution plan;
  after soltero-skills:lean-plans; before soltero-skills:lean-sdd; re-review after
  revisions.
- **Don't use:** authoring plans (soltero-skills:lean-plans), PRDs
  (soltero-skills:prd-review), code diffs (/code-review), or design docs
  (soltero-skills:lean-brainstorming).

## The Loop

0. **Structural pre-pass (deterministic).** If the plan has a `## Task Dependency
   Table`, run the bundled parser before convening anyone:
   `node ${CLAUDE_PLUGIN_ROOT}/skills/plan-visualizer/scripts/plan-graph.mjs <plan.md>`
   (JSON on stdout; exit 1 means blocking findings exist). Pass the `findings` array
   through to the workflow as `args.structuralFindings`. Cycles, dangling
   dependencies, interfaces consumed without a declared dependency, same-wave file
   overlaps, table↔block file drift and missing risk tiers are facts the parser
   establishes with plan line numbers — the council's job is the judgment the parser
   cannot do, not re-deriving these by hand (which the plan-visualizer RED baseline
   records as unreliable: same model, same plan, one agent found both blocking
   defects and another found none).
1. **Size gate, then convene.** Before spending a full council, check the plan's own
   risk-tier table: if it lists 5 or fewer tasks AND every task is tier "mechanical",
   run the bundled workflow in **lite mode** instead of the full council:
   `Workflow({scriptPath: "${CLAUDE_SKILL_DIR}/workflows/review.mjs", args: {planPath,
   rubricPath: "${CLAUDE_SKILL_DIR}/references/rubric.md", date, round, mode: "lite"}})`.
   Lite mode is one sonnet reviewer grading all six dimensions in a single pass, no
   skeptic escalation — appropriate only because a small all-mechanical plan has
   little room for the graded-inflation failure mode the skeptic exists to catch. Any
   plan with a "standard" or "judgment" tier task, or more than 5 tasks, always gets
   the full council below.
2. **Convene the council** — run the bundled workflow:
   `Workflow({scriptPath: "${CLAUDE_SKILL_DIR}/workflows/review.mjs", args: {planPath,
   rubricPath: "${CLAUDE_SKILL_DIR}/references/rubric.md", date, round}})`.
   Six graders — decomposition & ordering (15), verifiability (20), spec fidelity &
   traceability (20), concreteness (15), risk & reversibility (15), consistency &
   completeness (15) — band-anchored scores with quoted evidence, skeptic on every
   ≥90, re-grade on confirmed misses (script records the min), deterministic weighted
   total. *Fallback (no Workflow tool):* the same six graders as parallel subagents
   with the same prompts + rubric, skeptic any ≥90, same formula — never merge the six
   into one reviewer. Models as in the script — graders on sonnet, skeptics and
   re-graders on opus (the skeptic only fires on a score ≥90, so the expensive tier is
   reserved for plans that need the extra scrutiny); never let a dispatch inherit the
   session model. If you also cannot dispatch subagents, run the six rubric passes
   separately yourself and DISCLOSE that it's a stand-in, not the council.
3. **Write the report** — `docs/plan-reviews/YYYY-MM-DD-<topic>-review.md`: verdict
   banner (PASS / **BLOCKED — do not execute**), score table (dimension, weight,
   grader score, skeptic misses, final), evidence-quoted violations, then blocking
   fixes (mechanical), owner questions, recommended fixes. A dimension the council
   returned as `unknown` is not a score and never becomes one: print it as `unknown` in
   the table with the reason the grader gave, and carry it into owner questions with
   what the council would need to grade it. It keeps the gate shut until the owner
   supplies that basis — you never estimate a number in its place.
4. **If BLOCKED → fix round:** apply mechanical fixes to the plan (rewording,
   reordering, adding verification/rollback steps, cutting out-of-scope tasks the spec
   already rules out); present owner questions to the user and WAIT — never answer
   them yourself. No verdict edits, no "provisionally ready".
5. **Re-convene** the council on the edited plan (round N+1), passing the previous
   round's returned `dimensions` array as `args.priorDimensions` — the script re-grades
   only the dimensions that failed (score < 80 or a blocking violation) and carries the
   rest forward unchanged, since a fix scoped to one dimension's violations doesn't
   need to re-litigate a dimension that already passed clean. A diff-confirm against
   the previous findings is NOT a round — new flaws enter through fixes, and the fix
   author cannot be the checker. Maximum 3 rounds; still BLOCKED → report what blocks
   and send the plan back to soltero-skills:lean-plans.

   **Circuit breaker — the loop stops when it stops converging.** The script returns a
   `nonConvergence` object when a round moves the overall by less than 2 points from the
   previous round, or when a violation the previous round already reported comes back
   verbatim in a dimension that was actually re-graded. (Pass the previous round's
   `overall` as `args.priorOverall` alongside `args.priorDimensions`, or the score half
   of the check cannot fire.) When it fires, do NOT convene another round — not even
   "one more, it's close". What is churning is the reviewer prompt or the rubric
   wording, not the plan, and another round spends 6–18 model calls to reproduce the
   same disagreement. Instead:
   1. **Sample the council's own outputs** for the recurring item — both rounds' grader
      summaries for that dimension, and any skeptic reasoning attached to it.
   2. **Name the ambiguity**: the exact checklist item or prompt sentence that let two
      graders read the same line two different ways, quoting what each round said about
      it.
   3. **Route it to the owner** as a rubric/prompt fix proposal (a concrete wording
      change to `references/rubric.md` or the grader prompt in `workflows/review.mjs`),
      and send the plan itself back to soltero-skills:lean-plans in the same message.
   You never resolve the ambiguity yourself mid-loop, and you never resolve it by
   picking whichever round's reading is more convenient.
6. **On PASS:** record the score and hand off to execution
   (soltero-skills:lean-sdd).

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "Bless tasks 1–3 so people have something to pick up Monday." | Executing part of a BLOCKED plan is executing a BLOCKED plan. The rubric decides what's safe, and it grades the whole plan. |
| "Anything small we can absorb as we go." | Deploy-before-auth and out-of-scope features looked 'small' at 6pm. Severity comes from the rubric, not the deadline. |
| "Fixes applied — a quick diff-check against the findings replaces the round." | Fixes introduce new flaws the old findings never mentioned. Only a fresh council round on the full plan counts. |
| "I'll do the confirming pass myself in a separate turn." | Fixer and checker must be different runs of the COUNCIL, not the same agent in a new message. |
| "Both seniors skimmed it and said it's fine." | Skims miss exactly what councils catch (the fixture's schema bomb read as a one-liner). Note the sign-off in the report; run the council. |
| "It's an internal tool; auth can fast-follow." | 'Internal-ish' is not a security boundary. D5 grades it; you don't waive it. |
| "It scored 84.6 — that rounds to 85." | The script's number is the number. 84.6 is BLOCKED. |
| "Round 2 moved it 0.2 points — one more round should get it over." | Two rounds that don't move the score are a rubric/prompt problem, not a plan problem. Circuit breaker: name the ambiguity, propose the rubric fix to the owner, plan back to lean-plans. |
| "The same violation came back, so the fix must not have landed — re-run it." | It came back because two graders read the checklist item two ways. Read both rounds' summaries before you re-run anything; if they disagree about what the item means, that's the finding. |
| "D3 has nothing to grade against; I'll put 70 so the round completes." | You never invent a score. `unknown` is the verdict for absent basis — it routes to the owner and keeps the gate shut. A number there is a guess the weighted total then treats as evidence. |
| "It's at 88 overall; the one blocking violation is basically mechanical." | Blocking means blocking. Apply the fix, re-convene; the next round passes it in minutes. |

## Red Flags — STOP

- You're typing a go/no-go (or "bless", "safe to start") and no council ran this round.
- You're about to name any subset of tasks executable before PASS.
- You edited the plan and "approved" / "ready-to-execute" is about to come from you
  instead of a fresh council report.
- Your proposed re-check reviews the diff or the findings list instead of the whole
  plan.
- You answered an owner question yourself to keep the round moving.
- The same violation quote is back for a second round and you're queuing a third.
- Two consecutive rounds landed within 2 points of each other and you're re-convening
  instead of naming the rubric/prompt ambiguity.
- You're choosing a number for a dimension the plan gave you no basis to grade.
- Round 4. (Stop; back to soltero-skills:lean-plans.)

## Bundled assets

- `workflows/review.mjs` — council engine (graders → skeptics → re-grades → gate).
- `references/rubric.md` — dimensions, weights, band anchors, evidence rules, gate.
