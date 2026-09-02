# Contributing

All skills are authored with the `creating-a-skill` skill — test-driven documentation.

## The loop
1. Spec → `docs/specs/<skill>.md`.
2. RED → 3 pressure scenarios in `tests/scenarios/<skill>/` — one of which never names the
   skill, so the description itself is tested and not just the body; run a fresh subagent
   without the skill and record the baseline failure. Record the model identifier and the date at the top of
   `RED-baseline.md` — a baseline is a per-model fact, and "the baseline already does X" claims in
   a SKILL.md are only re-checkable if a later reader knows which model was measured, and when.
3. GREEN → minimal `skills/<skill>/SKILL.md` (+ optional `reference.md`, `scripts/`).
4. Verify → re-run scenarios with the skill; confirm compliance.
5. REFACTOR → close loopholes; re-verify.
6. Ship gate → `soltero-skills:skill-ab-eval`: paired with/without pass rates over the same
   tasks on **at least two model tiers**. GREEN on one tier shows the skill did not hurt once
   on one model; it does not show it helps, and skill benefit is not uniform across model
   generations. No skill lands without those numbers.
7. Validate → `npm run lint:fm` and `claude plugin validate ./ --strict`.
8. PR → CI runs the gates.

## Confidentiality (required)
No private repo/company names, proprietary code/schemas, secrets, or internal identifiers in
any committed file. Re-derive private-inspired patterns generically. Run
`scripts/check-private-names.sh` before pushing.

## Conventions
- One kebab-case folder per skill; `name` in frontmatter equals the folder name.
- `description`: third person, lead with the trigger, quote the literal phrasings a user
  would type, ≤1024 chars.
- Deterministic steps ship as a bundled script under `skills/<skill>/scripts/` with a
  `*.test.mjs` beside it (picked up by `npm test`), never as prose in the skill body.
- Keep `SKILL.md` under ~500 lines; split heavy reference one level deep.
