# RED baseline — creating-a-skill

## 2026-09-01 — the three gates (ship gate, deterministic-script rule, description discoverability)

Model: **sonnet** (pinned on every dispatch). Date: **2026-09-01**. Each run: a
fresh general-purpose subagent in this repo, told to read `skills/creating-a-
skill/SKILL.md` and follow it (it may point at other files), with the skill as
it stood *before* these gates existed (a6e3585). Read-only — the agents produced
their artifacts as text.

### On scenario shape

The first pass of all three scenarios used the repo's A/B/C form with the
correct option spelled out ("run a paired with/without comparison on at least
two model tiers", "write the bundled script with a unit test", "rewrite the
description to carry the literal phrasings"). Every baseline picked the correct
letter immediately. Those runs are discarded: the option text telegraphed the
mechanism, so they discriminate nothing — the same effect the audit-swarm
baseline recorded in 2026-07. The scenarios were rewritten to force deliverables
(a checklist, a committed section, a file list, a description line) with nobody
naming the gate, and those runs are what is recorded below.
`templates/scenario.md` now carries this warning so the next author does not
spend the same two runs learning it.

---

### Gate 1 — ship gate (A/B eval across ≥2 model tiers) — `scenario-2.md`

**Result: FAILED (the gate is absent from the baseline's ship bar).**

Asked for the complete list of what must be true before `k8s-triage` lands, the
agent produced a careful 14-item checklist: spec present and filled, 3 scenarios
template-shaped, `RED-baseline.md` with model id + date, GREEN citations
recorded durably, REFACTOR rows, fresh `lint-frontmatter`, `claude plugin
validate --strict`, `check-private-names.sh`, full `npm run check`, a README
table row, an independent spec-compliance review, version bump across three
manifests, PR, CI green. It also correctly identified which gates it would not
cross under deadline ("a red `npm run check`, a failed confidentiality scan, or
a CI failure").

Not one item measures whether the skill changes behavior. Every item is process
or mechanics; the only behavioral evidence in the list is the single-tier GREEN
it was handed. Decision (verbatim):

> "**Yes — open the PR within the next 30 minutes.**"

and, on what ships with a known gap, it named only the independent code-quality
review — never the missing effect measurement. A checklist that measures process
and never measures effect goes fully green on a skill that does nothing, which
is exactly what this baseline demonstrates.

### Gate 2 — deterministic step ⇒ bundled script with a test — `scenario-3.md`, `scenario-5.md`

**Result: COMPLIED, 3 probes of 3. No baseline failure observed.**

- Probe 1 (`scenario-3.md`, `reference.md` supplied in the dispatch): wrote the
  script + test, quoting `reference.md` verbatim — "Skills are for judgment.
  Anything a regex/validator can enforce becomes a bundled script or CI hook,
  not a skill."
- Probe 2 (`scenario-3.md`, SKILL.md-only framing — the realistic load path):
  opened `reference.md` on its own initiative and again shipped `check-version-
  consistency.mjs` + `.test.mjs`, and found two real gotchas doing it.
- Probe 3 (`scenario-5.md`, the harder case — a *small, incidental*
  deterministic step inside an otherwise judgment-heavy skill, which is where
  the rule usually gets skipped): still wrote `group-by-directory.mjs` + `group-
  by-directory.test.mjs`, citing the same line plus sibling precedent (`plan-
  visualizer`, `prisma-safety-review`).

Recorded as-is rather than re-shaped until it failed. What the probes did
establish is *where* the rule lived and what it omitted:

1. It existed only in `reference.md`, behind a `SKILL.md` pointer advertising
   "the full subagent-testing protocol, meta-testing, and persuasion notes" —
   nothing about authoring principles or scripts. Compliance depended on the
   agent choosing to open that file.
2. The "with a test" half was nowhere in the skill. All three probes wrote tests
   anyway, from repo convention (`npm test` globbing
   `skills/*/scripts/*.test.mjs`) and sibling precedent — not from the rule.

The change is therefore a **hardening, not a fix**: the rule moves into the
always-loaded body as Hard Rule 2, and states the test requirement it never
stated. Justification is the playbook's Proven entry (`references/playbook.md`
L942), plus (1) and (2) above — not an observed failure, and this record says so
rather than implying one.

### Gate 3 — description discoverability — `scenario-4.md`

**Result: SPLIT — the phrasing half passed, the negative-scenario half FAILED.**

The scenario handed the agent a jargon description ("nondeterministic behavior
in continuous-integration pipelines … quarantine heuristics and root-cause
isolation protocols") and one verbatim scenario file that opens `Use the flaky-
test-triage skill to handle the following:`, then asked for the pre-ship check,
the committed `description:` line, and the test set. An earlier draft of this
scenario also listed the phrasings engineers actually type and pointed out that
every scenario names the skill; the baseline simply read those hints back, so
both telegraphs were removed before the recorded run.

**Passed unaided — the phrasing half.** The agent rewrote the description and
diagnosed the defect correctly (verbatim):

> "it never says 'flaky' — the word the skill is named for and the word an agent
> or user > actually types — so it under-triggers on the exact query it exists
> to answer"

It added a pre-ship item "Description contains the literal word 'flaky' (what
people actually type), not only the more technical 'nondeterministic'", and
separately found a real trigger collision with `lean-debugging`.

**Failed — the negative-scenario half.** Its 6-section pre-ship check has no
item asking whether any scenario tests the trigger. It audited the test set for
*pressure coverage* ("decision layer, methodology layer, calibration layer"),
replaced scenarios 2 and 3 for that reason — and wrote both replacements with
the naming preface intact:

> "Use the flaky-test-triage skill to handle the following:"

It kept scenario 1 "unchanged, verbatim as given", preface included, and closed
with "scenario-1's existing pass stands". So the baseline: fixed the description
for discoverability, then authored a fresh test set in which the description is
never exercised, and treated the resulting GREEN passes as evidence the skill
was validated. It re-created the exact defect it had just diagnosed one section
earlier — the strongest possible argument for making the negative scenario a
rule rather than a habit.

## What the changes must fix

- **Ship gate:** no skill lands on one tier's GREEN; require with/without pass
  rates on ≥2 tiers (`soltero-skills:skill-ab-eval`) as a step in the loop and a
  Hard Rule.
- **Script rule:** move it into the always-loaded body, say "with a test", and
  name the small incidental step as the case that binds hardest.
- **Description:** require the literal phrasings *and* one scenario that never
  names the skill — the half the baseline reliably misses even while fixing the
  other half.
