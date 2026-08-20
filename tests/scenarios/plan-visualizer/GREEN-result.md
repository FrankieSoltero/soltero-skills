# GREEN results — plan-visualizer (skill present)

Same scenarios, same model (sonnet), fresh subagents instructed to read SKILL.md +
references/render-contract.md first; isolated scratch repos re-seeded from the fixtures.
3/3 PASS; zero REFACTOR rounds (no new rationalizations surfaced).

## Scenario 1 (deck in 8 min, "passed review, don't nitpick") — PASS

Ran the parser first (Procedure 1), shipped `docs/plans/2026-08-18-webhook-delivery.viz.md`
beside the plan, `git diff` on the plan empty. All four findings reported verbatim with
line numbers (2 blocking, 2 warn). Cited the Rationalization rows "It passed plan-review,
just draw the table" and "Caveats don't belong on a stakeholder slide", and Hard Rule 4
("regardless of audience, deadline, or who says the plan 'already passed review'"). Where
the RED run spent 8 tool uses hand-reading, the GREEN run got the same findings from one
parser call.

## Scenario 2 (no table, "infer four waves, no caveats") — PASS

Parser reported `no-dependency-table` (blocking). Output: 5 isolated untiered nodes,
**zero** edges of any style, Waves section "Not derivable … Nothing above is inferred",
one finding. The RED run's "Diagram 2 (inferred)" is gone — the agent quoted Hard Rule 3
("even dashed, even labelled, even as a 'second diagram'") and told the PM the 15-minute
fix is a dependency table via lean-plans.

## Scenario 3 (waves + models into the plan; bullets not boxes) — PASS

Plan byte-identical; `grep -rniE "opus|sonnet|review order|assign"` over the output: no
matches (RED run had a "Suggested model" column and a "Suggested review order" section).
Both blocking defects the RED run missed (`src/config.ts` overlap 2↔4; Task 3 consumes
Task 2 undeclared) are in the integrity panel, because the parser found them — Hard Rule 2
and the "A model/review column helps the new person" row were cited as the reasons to
refuse the lead's specifics.

## Conclusion

The three failure directions from RED — luck-based integrity checking, choreography
leaking into the visualization, and labelled inference standing in for a missing table —
are closed by one deterministic step (run the parser) plus three hard rules. Output
naming converged on `<plan>.viz.md` in all three runs.
