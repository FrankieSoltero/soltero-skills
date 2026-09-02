# Contributing (eval-lab)

## The loop
1. Spec → `docs/specs/<skill>.md`.
2. RED → 3 pressure scenarios in `tests/scenarios/<skill>/`; run a fresh subagent without
   the skill and record the baseline failure. Record the model identifier and the date at
   the top of `RED-baseline.md` — a baseline is a per-model fact.
3. GREEN → minimal `skills/<skill>/SKILL.md`.
4. Verify → re-run scenarios with the skill; confirm compliance.
5. Validate → `npm run lint:fm`.
6. PR → CI runs the gates. `main` is PR-only with a required `validate` check.
