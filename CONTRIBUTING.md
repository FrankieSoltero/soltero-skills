# Contributing

All skills are authored with the `creating-a-skill` skill — test-driven documentation.

## The loop
1. Spec → `docs/specs/<skill>.md`.
2. RED → 3 pressure scenarios in `tests/scenarios/<skill>/`; run a fresh subagent without the
   skill and record the baseline failure.
3. GREEN → minimal `skills/<skill>/SKILL.md` (+ optional `reference.md`, `scripts/`).
4. Verify → re-run scenarios with the skill; confirm compliance.
5. REFACTOR → close loopholes; re-verify.
6. Validate → `npm run lint:fm` and `claude plugin validate ./ --strict`.
7. PR → CI runs the gates.

## Confidentiality (required)
No private repo/company names, proprietary code/schemas, secrets, or internal identifiers in
any committed file. Re-derive private-inspired patterns generically. Run
`scripts/check-private-names.sh` before pushing.

## Conventions
- One kebab-case folder per skill; `name` in frontmatter equals the folder name.
- `description`: third person, lead with the trigger, ≤1024 chars.
- Keep `SKILL.md` under ~500 lines; split heavy reference one level deep.
