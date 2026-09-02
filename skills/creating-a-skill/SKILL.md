---
name: creating-a-skill
description: Use when creating a new skill or editing an existing one in this repo, before writing any SKILL.md content ("write a skill for…", "add a skill", "update the X skill", "make this a skill", "turn this into a skill", "the X skill should also…") — enforces test-first, subagent-validated authoring and the plugin's four hard gates: an observed failing baseline, deterministic steps as tested scripts, a description a user's own words actually trigger, and with/without pass rates on two model tiers before anything ships.
---

# Creating a Skill

## Overview

Authoring a skill is test-driven development for documentation. The product is a `SKILL.md`;
the test is a pressure scenario run on a fresh subagent. **Iron Law: no skill (or skill edit)
ships without a failing scenario observed first.** If you wrote skill content before watching
an agent fail without it, delete the content and start from the scenario.

## When to Use

- Creating any new skill under `skills/`.
- Editing an existing skill's behavior.

## When NOT to Use

- Pure tooling/scripts with unit tests (use normal code TDD).
- Fixing a typo or reformatting (no behavior change).

## Hard Rules

Not preferences. A skill that breaks one does not ship, whatever the deadline.

1. **Iron Law — no skill (or skill edit) ships without a failing scenario observed first.**
   (Stated in full in the Overview above.)
2. **A deterministic step ships as a bundled script with a test — never as prose.** If a step
   has exactly one right answer for a given input (parsing, counting, comparing, formatting,
   validating), it goes in `skills/<skill>/scripts/` with a `*.test.mjs` beside it — `npm test`
   already globs `skills/*/scripts/*.test.mjs`, so it costs no wiring — and the body invokes it
   via `${CLAUDE_SKILL_DIR}`. Prose is not a lighter version of the script; it is the same logic
   re-derived by an LLM every run, with a fresh chance to slip. Judgment in the skill,
   determinism in a script. This binds hardest where the step is small and incidental inside an
   otherwise judgment-heavy skill — that is where it gets skipped.
3. **No ship without with/without pass rates on ≥2 model tiers.** GREEN on one tier shows the
   skill did not hurt, once, on one model; it does not show it helps. Run the paired comparison
   — same tasks, with the skill vs without — on at least two tiers with
   `soltero-skills:skill-ab-eval`, and ship only if the numbers move. Skill benefit is not
   uniform across model generations: one that lifts a mid tier can be inert or worse on a
   stronger one, and a single tier cannot tell you which you are holding.
4. **The description must carry the words a user would actually say, and one scenario must
   never name the skill.** The description is the entire trigger surface — the body does not
   load until the skill fires — so put the literal phrasings people type into it ("this test
   keeps failing randomly", "our CI is flaky"), not only a formal paraphrase of the domain.
   Then prove it: at least one RED scenario is a **negative** one, where the task matches the
   skill and the prompt never names it, anywhere. A scenario that opens "Use the `<skill>`
   skill to…" tests the body; only an unnamed one tests the trigger. Three passing scenarios
   that all name the skill leave the description entirely unmeasured.

## The Loop

1. **Spec** — write `docs/specs/<skill>.md` from `templates/spec.md`: problem, trigger,
   scope, one concrete success scenario, and the literal phrasings a user would type.
2. **RED** — write 3 pressure scenarios in `tests/scenarios/<skill>/` from
   `templates/scenario.md`; **one of them never names the skill** (Hard Rule 4). Dispatch a
   fresh subagent on each WITHOUT the skill. Record its choices and rationalizations verbatim
   in `RED-baseline.md`, under a dated heading with the model pinned. You must see it fail —
   and where it does not, record that plainly instead of shipping content no failure justified.
3. **GREEN** — author the minimal `SKILL.md` (start from `templates/SKILL.md.tmpl`) that
   addresses only the observed failures. No content for hypothetical cases.
4. **Verify GREEN** — re-run the same scenarios with the skill present. Confirm compliance,
   including that the unnamed scenario reaches for the skill on the description alone.
5. **REFACTOR** — for each new rationalization the agent invents, add an explicit negation,
   a Rationalization-table row, and a Red-Flag entry. Re-verify until bulletproof.
6. **A/B eval** — `soltero-skills:skill-ab-eval`: paired with/without pass rates over the same
   tasks on ≥2 model tiers. No ship without it (Hard Rule 3).
7. **Validate** — `node tools/lint-frontmatter.mjs` and `claude plugin validate ./ --strict`.
8. **Review** — spec-compliance pass (built exactly what the spec asked), then code-quality.
9. **PR + CI** — open a PR; CI re-runs the gates; merge to `main`.
10. **Release** — bump `version` in both manifests + `package.json`, tag, update `CHANGELOG.md`.

## Quick Reference

| Field | Rule |
|-------|------|
| folder | kebab-case; equals frontmatter `name` |
| `name` | lowercase letters/numbers/hyphens, ≤64 chars, not `anthropic`/`claude`; always set it |
| `description` | third person, leads with the trigger ("Use when …") AND says what it does, quotes the literal phrasings a user would type, ≤1024 chars |
| body | ≤~500 lines; inline short content; split heavy reference (100+ lines) one level deep |
| deterministic step | bundled script under `scripts/` + a `*.test.mjs` beside it, invoked from the body — never prose |
| ship evidence | with/without pass rates on ≥2 model tiers (`soltero-skills:skill-ab-eval`), not one tier's GREEN |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "This skill is obvious, I'll skip the baseline." | Obvious-to-you ≠ what an agent actually does. Run the baseline. |
| "I'll add scenarios later." | Later never comes and the skill is unvalidated. Scenario first. |
| "It's just a small edit." | Edits change behavior. Same Iron Law applies. |
| "The agent passed once, ship it." | Run all 3 scenarios; one pass can be luck. |
| "3/3 GREEN on sonnet — the skill works." | One tier, one direction. That shows it did not hurt; it does not show it helps, and benefit is not uniform across model generations. Run the A/B eval on ≥2 tiers. |
| "Everything the documented loop asks for is green, so it ships." | The loop asks for the A/B eval too. A checklist that measures process and never measures effect goes fully green on a skill that changes nothing. |
| "We'll measure with/without next week — teammates are blocked today." | Then it sits in the plugin unmeasured all week, and a "measure it later" item blocks nothing by design. Either the numbers exist or it does not ship. |
| "It's one small deterministic step inside a big judgment skill — prose is clearer." | Small and incidental is exactly where this gets skipped. Prose re-derives the logic every run; a script cannot be talked out of running correctly. Script + test. |
| "The description is accurate — it describes what the skill does." | Accurate and findable are different properties. If its words are not the words a user types, the skill never loads and its accuracy is never exercised. |
| "All 3 scenarios pass, so the skill is validated." | If all 3 name the skill, you validated the body and never tested the trigger. Write the negative one. |

## Red Flags — STOP

- About to create `SKILL.md` before any scenario exists → STOP, write the scenario.
- Adding content for a case no baseline run surfaced → delete it (YAGNI).
- Committing a skill that hasn't passed `lint-frontmatter` + `claude plugin validate` → STOP.
- About to ship on pass-rate evidence from a single model tier → STOP, run the A/B eval.
- Writing prose for a step that has exactly one right answer → STOP, write the script + test.
- Every scenario names the skill → STOP, the description is untested; write the negative one.
- A description a user's own words would never match → STOP, put their phrasings in it.

## Details

See `reference.md` for the full subagent-testing protocol (including the negative scenario and
why an option list must never spell out the target behavior), the A/B ship gate, meta-testing,
persuasion notes, and the authoring principles — progressive disclosure, description design,
and where deterministic logic belongs.
