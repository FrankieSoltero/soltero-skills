---
name: creating-a-skill
description: Use when creating a new skill or editing an existing one in this repo, before writing any SKILL.md content — enforces test-first, subagent-validated authoring and the plugin's quality gates.
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

## The Loop

1. **Spec** — write `docs/specs/<skill>.md` from `templates/spec.md`: problem, trigger,
   scope, one concrete success scenario.
2. **RED** — write 3 pressure scenarios in `tests/scenarios/<skill>/` from
   `templates/scenario.md`. Dispatch a fresh subagent on each WITHOUT the skill. Record its
   choices and rationalizations verbatim. You must see it fail.
3. **GREEN** — author the minimal `SKILL.md` (start from `templates/SKILL.md.tmpl`) that
   addresses only the observed failures. No content for hypothetical cases.
4. **Verify GREEN** — re-run the same scenarios with the skill present. Confirm compliance.
5. **REFACTOR** — for each new rationalization the agent invents, add an explicit negation,
   a Rationalization-table row, and a Red-Flag entry. Re-verify until bulletproof.
6. **Validate** — `node tools/lint-frontmatter.mjs` and `claude plugin validate ./ --strict`.
7. **Review** — spec-compliance pass (built exactly what the spec asked), then code-quality.
8. **PR + CI** — open a PR; CI re-runs the gates; merge to `main`.
9. **Release** — bump `version` in both manifests + `package.json`, tag, update `CHANGELOG.md`.

## Quick Reference

| Field | Rule |
|-------|------|
| folder | kebab-case; equals frontmatter `name` |
| `name` | lowercase letters/numbers/hyphens, ≤64 chars, not `anthropic`/`claude`; always set it |
| `description` | third person, leads with the trigger ("Use when …") AND says what it does, ≤1024 chars |
| body | ≤~500 lines; inline short content; split heavy reference (100+ lines) one level deep |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "This skill is obvious, I'll skip the baseline." | Obvious-to-you ≠ what an agent actually does. Run the baseline. |
| "I'll add scenarios later." | Later never comes and the skill is unvalidated. Scenario first. |
| "It's just a small edit." | Edits change behavior. Same Iron Law applies. |
| "The agent passed once, ship it." | Run all 3 scenarios; one pass can be luck. |

## Red Flags — STOP

- About to create `SKILL.md` before any scenario exists → STOP, write the scenario.
- Adding content for a case no baseline run surfaced → delete it (YAGNI).
- Committing a skill that hasn't passed `lint-frontmatter` + `claude plugin validate` → STOP.

## Details

See `reference.md` for the full subagent-testing protocol, meta-testing, and persuasion notes.
