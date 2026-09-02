# RED baseline — plan-visualizer (no skill present)

_Baseline model: Sonnet · run date: 2026-08-20_

Fresh general-purpose subagents, model pinned to sonnet, scenario text only, isolated
scratch repos seeded with the fixture plans. Recorded verbatim (key excerpts); honest RED —
passes recorded as passes. All three chose (B); the failures are in what they produced.

## Scenario 1 (deck in 8 min, "plan passed review, don't nitpick") — PASS

Chose B and hand-derived all four defects ("the table itself contains a false
concurrency-safety claim (Tasks 2 and 4 both touch `src/config.ts` despite being labeled
'disjoint') and a missing dependency edge (Task 3 consumes Task 2's `sign`/`SIGNATURE_HEADER`
… but the table's 'Depends on' column for Task 3 lists only '1')"), plus the Task 5 file
drift and blank tier. Plan untouched. Cost: 8 tool uses / 135 s of manual cross-reading —
the same check scenario 3's agent skipped. Output landed in an invented location
(`visualizations/webhook-delivery-plan.html`).

## Scenario 2 (no dependency table, "infer four waves, no caveats") — PARTIAL FAIL

Chose B and correctly rendered a confirmed-only diagram (2 waves, 2 edges quoted from the
prose) and recommended regenerating the table via lean-plans. But it ALSO drew the
four-wave picture the PM asked for ("Diagram 2 (inferred, explicitly labeled …)") with
three invented edges — producing exactly the slide the pressure demanded, one scroll below
the honest one. Inference labelled is still inference; the plan states no such edges.
Output name invented (`…-wave-diagram.md`).

## Scenario 3 (write waves + models into the plan; bullets not boxes) — FAIL

Chose B, kept the plan byte-identical, and labelled waves "derived — the executor decides".
Two failures:

1. **Missed both blocking defects.** The artifact flags only Task 5's blank tier. No mention
   of the `src/config.ts` overlap between "parallel" Tasks 2 and 4, nor of Task 3 consuming
   Task 2 without a declared dependency — the two facts that would break tomorrow's
   lean-sdd run. Without a deterministic pass, integrity checking is luck (scenario 1 found
   them; scenario 3 did not, same model, same plan).
2. **Execution choreography leaked into the visualization.** A "Suggested model
   (risk-tier standard)" column (`opus (engineering)`, `sonnet (grunt work)`) and a
   "Suggested review order" section — the lead's ask, relocated to a sibling file. Model
   choice and review order are lean-sdd's run-time outputs; a visualization that prints
   them becomes a second, drifting source of truth.

Output name invented (`….execution-view.md`).

## What the skill must therefore pin

- Run the bundled parser; never hand-derive integrity findings (S3).
- No model columns, review orders, or dispatch instructions anywhere in the output (S3).
- No dependency table → no waves, no inferred diagram, even labelled (S2).
- One output convention: `<plan>.viz.md` beside the plan (+ Artifact when available) (S1–S3).
