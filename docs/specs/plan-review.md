# Skill Spec — plan-review

**Status:** Spec approved 2026-07-24 (user chose: council reviewer only — no authoring
duplication of superpowers:writing-plans; gate mechanics identical to
[prd-review](prd-review.md)). Sibling of prd-review; sits between
superpowers:writing-plans and superpowers:executing-plans.

- **Problem:** Asked "is this implementation plan ready to execute?", a solo reviewer
  grades by vibe: catches some flaws, invents proceed-workarounds ("start the safe
  early tasks while we fix the rest"), and after editing the plan is ready to call it
  approved with no re-review. Vague tasks ("update relevant files"), missing
  verification steps, untraceable scope invention, and irreversible-migration risk
  flow straight into execution, where they cost real rework and real data.
- **Trigger:** A plan needs a quality verdict before execution ("review this plan",
  "ready to execute?", "grade the implementation plan"); after
  superpowers:writing-plans produces a plan; before superpowers:executing-plans or
  subagent-driven-development runs one; re-review after revisions.
- **Scope / non-goals:** Convene a 6-grader council via bundled Workflow
  (`workflows/review.mjs`), one per dimension: task decomposition & ordering (15),
  verifiability (20), spec fidelity & traceability (20), concreteness (15), risk &
  reversibility (15), consistency & completeness (15). Band-anchored 0–100 scores with
  plan-quoted evidence for every deduction and any score ≥90; skeptic on every ≥90;
  confirmed miss → re-grade, script records min. Gate: overall ≥85 AND every dimension
  ≥80 AND zero blocking-severity violations, else BLOCKED — no execution, no "safe
  first tasks", no partial start. (Originally ≥95 overall; recalibrated 2026-07-30 —
  field use showed sound plans plateau at 86–87 under the skeptic min-rule, making 95
  unreachable and forcing endless fix loops. 85 matches the rubric's own "sound" band;
  the blocking-violation condition keeps unsafe plans blocked at the lower threshold.) Report to
  `docs/plan-reviews/YYYY-MM-DD-<topic>-review.md`. Fix loop identical to prd-review:
  mechanical fixes applied, owner decisions escalated (never auto-answered), fresh
  council re-run, max 3 rounds, fixer never changes the verdict. Fallback without the
  Workflow tool: same six graders as parallel subagents, same rubric and formula.
  Non-goals: authoring plans (superpowers:writing-plans), reviewing PRDs (prd-review),
  reviewing code (/code-review), executing anything.
- **Success scenario:** Given a flawed plan (vague tasks, tests-at-the-end, an
  unreversed destructive prod migration, an out-of-scope feature added, a spec action
  dropped, deploy-before-auth ordering), the council scores it far below the gate, stamps
  BLOCKED — do not execute, separates mechanical fixes from owner decisions, and only
  a fresh council round can flip the verdict — instead of "solid plan, start the setup
  tasks while we tighten the rest".
- **Bundled assets:** `workflows/review.mjs`, `references/rubric.md`.
