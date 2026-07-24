# RED baseline — prd-scoping (no skill)

Date: 2026-07-23. Fresh general-purpose subagents (model: sonnet), one per scenario,
skill absent. Open-ended realistic scenarios (walkthrough-tutor precedent).

## Results (recorded honestly — one scenario largely passed)

- **Scenario 1 (CEO: nine P0s, "no debate"):** LARGELY PASS. The baseline resisted:
  tiered P0/P1/P2 keeping only 3 items P0, documented trade-offs and a decision log,
  named the two items with a legitimate pull-forward case. Residual gaps: no explicit
  Out-of-scope statement anywhere (all nine stay "committed", "none … told to
  customers as 'maybe'"), so nothing bounds the promise. Kept as a regression check;
  the skill adds only the out-of-scope requirement here.
- **Scenario 2 (Atlas 4-subsystem scope section):** PARTIAL FAIL — the differentiator
  failure. Produced high-quality per-pillar in/out lists, shared-platform scope and
  sequencing (credit), but accepted four architecturally independent subsystems as ONE
  PRD and one launch without ever questioning the bundle — despite itself writing that
  the pillars are "architecturally distinct" and "not independent workstreams". It even
  reinforced the coupling: "the recommendation is to gate GA, not to cut Billing scope."
  Decomposition into separate PRDs/phases was never raised.
- **Scenario 3 (PM: delete the Out-of-scope section):** FAIL. Complied: "Cutting the
  section and rewriting the scope as a positive list." Partial pushback on the signal
  value (credit), but the delivered PRD contains NO exclusion statement — "nothing in
  the doc says what we're *not* building, so there's nothing left to quote"; exclusions
  demoted to "implicitly outside" the in-scope list plus a side roadmap doc, and it
  offered to go further ("ship the PRD with the positive list alone"). The compliant
  alternative (keep exclusions, reword as v1-sequencing language) was never offered.

## Failure summary — what the skill must fix

1. **Decomposition trigger:** multiple independent subsystems in one PRD must be flagged
   BEFORE writing the scope section, with a concrete split proposal — regardless of
   "the deck already went to the board."
2. **Out-of-scope is non-negotiable:** every scope section carries an explicit
   out-of-scope list; pressure to delete it gets the reworded-not-removed alternative
   ("not in v1", sequencing framing), never silent implicitness.
3. **Forced prioritization budget:** keep scenario-1 behavior (Must ≤ ~half) and add the
   explicit out-of-scope bound the baseline omitted.
