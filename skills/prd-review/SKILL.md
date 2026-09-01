---
name: prd-review
description: Use when a PRD needs a quality verdict before design or implementation ("review this PRD", "is this good enough to build against?", "grade the PRD"), at the review gate of soltero-skills:writing-prds, or after a PRD was revised following a failed review — convenes a 6-dimension grading council (bundled workflow with rubric-anchored scores, evidence quotes, and anti-inflation skeptics) instead of one agent's ungraded editorial read, and enforces a hard gate: overall ≥95 AND every dimension ≥80, else BLOCKED with no design, partial build, or parallel eng start. Applies mechanical fixes and escalates owner decisions, but the fixer never changes the verdict — re-review rounds re-grade only the dimensions that failed, and only a fresh council round can change the verdict. Child skill of soltero-skills:writing-prds.
---

# PRD Review Council

> **Portability note (non-Claude-Code agents):** the graded verdict here comes from an
> independent multi-agent council (rubric-anchored scorers plus anti-inflation
> skeptics), run via Claude Code's `Workflow` tool — not available on other CLIs.
> Without it you can still apply the same rubric and gate (overall ≥95, every dimension
> ≥80) as a solo reviewer, but a self-graded review is exactly the failure mode this
> skill exists to prevent — treat your own verdict as provisional, not a real pass.

## Overview

Asked "is this PRD good enough?", a solo reviewer catches the loud flaws but grades by
vibe: severity triage is one unverified opinion, a failing doc gets a proceed-workaround
("start the safe parts in parallel", "fixable in an hour, go Monday"), and after editing
the doc the same agent is ready to "call it approved" — fixer and approver collapsed
into one, no re-review. This skill replaces that with a scored council and a gate that
only the council can open.

<HARD-GATE>
A PRD that has not PASSED (overall ≥95 AND every dimension ≥80, from an actual council
run) must not proceed to design (soltero-skills:lean-brainstorming), planning, implementation,
or "just the safe parts in parallel." Deadlines, contractor retainers, prior informal
sign-offs, and "we'll fix in flight" do not open the gate. Only a fresh council round
does. You never green-light a PRD on your own read, and you NEVER change or estimate a
score yourself.
</HARD-GATE>

## When to Use / When NOT to Use

- **Use:** any request to review/grade/approve a PRD; step 8 of
  soltero-skills:writing-prds; re-review after revisions.
- **Don't use:** reviewing code diffs (/code-review), design docs
  (soltero-skills:lean-brainstorming owns those), or writing PRD content
  (soltero-skills:writing-prds and its children).

## The Loop

1. **Convene the council** — run the bundled workflow:
   `Workflow({scriptPath: "${CLAUDE_SKILL_DIR}/workflows/review.mjs", args: {prdPath,
   rubricPath: "${CLAUDE_SKILL_DIR}/references/rubric.md", date, round}})`.
   Six graders (one per dimension, weights 15/20/15/15/15/20), band-anchored 0–100
   scores with quoted evidence, skeptic on every score ≥90, re-grade on confirmed
   misses (script records min of grade and re-grade), deterministic weighted total in
   the script. *Fallback (no Workflow tool):* dispatch the same six graders as parallel
   subagents with the same prompts + rubric, skeptic any ≥90, compute the weighted
   total yourself with the same formula — never merge the six into one reviewer.
   Models as in the script — graders on sonnet, skeptics and re-graders on opus (the
   skeptic only fires on a score ≥90, so the expensive tier is reserved for PRDs that
   need the extra scrutiny); never let a dispatch inherit the session model.
2. **Write the report** — `docs/prd-reviews/YYYY-MM-DD-<topic>-review.md`: verdict
   banner (PASS / **BLOCKED — do not proceed to design or implementation**), score
   table (dimension, weight, grader score, skeptic misses, final), evidence-quoted
   violations, then three lists: blocking fixes (mechanical), owner questions,
   recommended fixes.
3. **If BLOCKED → fix round:** apply the mechanical fixes to the PRD directly; present
   the owner questions to the user and WAIT — never answer them yourself (that's how
   fiction re-enters the doc). No verdict edits, no "provisionally passing".
4. **Re-convene** the council on the edited PRD (round N+1), passing the previous
   round's returned `dimensions` array as `args.priorDimensions` — the script re-grades
   only the dimensions that failed (score < 80 or a blocking violation) and carries the
   rest forward unchanged. Maximum 3 rounds; if still BLOCKED, report exactly what's
   blocking and stop — the PRD goes back to soltero-skills:writing-prds, not onward to
   design.
5. **On PASS:** record the score in the report and hand back to the writing-prds flow
   (user review gate → soltero-skills:lean-brainstorming).

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I read it carefully — I don't need the council for an obvious verdict." | Your solo read has no bands, no floor, and no skeptic. Obvious-fail docs still need the scored report; obvious-pass docs are exactly where inflation hides. Run the council. |
| "It's blocked, but eng can start the safe Must items in parallel." | Partial build against a failing PRD IS proceeding. The gate has no 'safe subset' door. |
| "The fixes are quick — fix, then mark it approved, no time for another round." | You just became fixer and approver. Verdicts come from council rounds, not from whoever edited last. |
| "Two senior PMs called it solid / the contractors bill Monday either way." | Authority and sunk cost don't move scores. Note the pressure in the report; run the council. |
| "It scored 94.6 — that rounds to 95." | The script's number is the number. 94.6 is BLOCKED. |
| "The council feels harsh; I'll adjust D5 up a few points." | You never touch scores. If a grade looks wrong, re-run that dimension with the evidence dispute in the prompt. |

## Red Flags — STOP

- You're typing a go/no-go verdict and no council ran this round.
- You're about to suggest any work can start before PASS.
- You edited the PRD and the words "approved", "passing", or "ready" are about to come
  from you instead of a report generated from a fresh council run.
- You answered an owner question yourself to keep the fix round moving.
- Round 4. (Stop; back to writing-prds.)

## Bundled assets

- `workflows/review.mjs` — council engine (graders → skeptics → re-grades → gate).
- `references/rubric.md` — dimensions, weights, band anchors, evidence rules, gate.
