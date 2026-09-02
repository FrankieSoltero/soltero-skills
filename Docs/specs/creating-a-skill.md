# Skill Spec — creating-a-skill

- **Problem:** Skills get written the way documentation gets written — author-
  first, from what the author believes an agent gets wrong — and then ship on
  the author's conviction. The result is unfalsifiable: no evidence the skill
  changed behavior, no evidence it is ever discovered, and judgment prose
  standing in for logic a script should own.
- **Trigger:** Creating any new skill under `skills/`, or editing an existing
  skill's behavior, before writing any SKILL.md content.
- **Scope:** The authoring loop (spec → RED → GREEN → refactor → eval → validate
  → ship) and the four Hard Rules that gate it. Non-goals: authoring skills
  outside this repo's conventions; running the A/B eval itself (that is
  `soltero-skills:skill-ab-eval`); linting mechanics (`tools/lint-
  frontmatter.mjs` owns those).
- **Trigger phrasings:** "write a skill for…", "add a skill", "update the X
  skill", "make this a skill", "turn this into a skill", "the X skill should
  also…" — all in the description verbatim; `tests/scenarios/creating-a-
  skill/scenario-1.md` is the negative scenario that never names this skill.
- **Success scenario:** An author under deadline, with 3/3 scenarios GREEN on
  one tier, does not ship: the loop holds them at the A/B gate, and the skill
  lands only once paired with/without pass rates on ≥2 model tiers show it moves
  the numbers.
- **Bundled assets:** `reference.md` (subagent-testing protocol, meta-testing,
  authoring principles), `templates/{SKILL.md.tmpl,spec.md,scenario.md}`.

## Three gates (added 2026-09-01)

Each traces to a Proven entry in `skills/agent-playbook/references/playbook.md`
and to a 2026-09-01 baseline run recorded in `tests/scenarios/creating-a-
skill/RED-baseline.md`.

**1. Ship gate — with/without pass rates on ≥2 model tiers** (playbook L1320:
"Validate a paired A/B eval … across multiple model tiers before shipping").
GREEN on one tier says the skill did not hurt, once, on one model; it does not
say the skill helps, and skill benefit is not uniform across model generations.
The loop gains an A/B step before Validate, run with `soltero-skills:skill-ab-
eval`. **Baseline: failed.** A sonnet agent produced a 14-item ship checklist —
spec, scenarios, RED record, GREEN citations, REFACTOR, lint, plugin validate,
private-name scan, `npm run check`, README row, spec-compliance review, version
bump, PR, CI — with no measurement of the skill's effect on any model, and
shipped: "Yes — open the PR within the next 30 minutes."

**2. Deterministic step ⇒ bundled script with a test** (playbook L942: "Ship
deterministic logic a skill uses … as bundled scripts"). Promoted from a
preference sentence in `reference.md` to a Hard Rule in the body, with the test
requirement made explicit. **Baseline: complied, 3 of 3 probes** — including one
where the deterministic step was small and incidental inside a judgment-heavy
skill. The promotion is therefore a hardening, not a fix: what the probes
established is *where* the rule was reachable (only in `reference.md`, behind a
pointer that advertises "subagent-testing protocol, meta-testing, and persuasion
notes" and never mentions authoring principles) and that the "with a test" half
was absent from the skill entirely — the probes' tests came from repo
convention, not from the rule.

**3. Description discoverability** (playbook L873: progressive disclosure —
"Guard against the one failure mode — a hidden capability never invoked because
the model doesn't know it exists — by writing a discoverable, always-visible
short description"). The description is the whole trigger surface; the body does
not load until the skill fires. Two requirements: the description carries the
literal phrasings a user would type, and at least one RED scenario is a negative
one where the task matches and the skill is never named. A scenario that opens
"Use the `<skill>` skill to…" tests the body, not the trigger.
