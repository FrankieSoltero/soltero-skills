# Corrections Ledger

Written by correction-compiler. One entry per compiled correction.

### CL-021

- **Rule ID:** CL-021
- **Category:** migrations/safety
- **Trigger Origin:** human correction (staging incident)
- **Scope:** repo
- **Constraint:** A migration that drops or renames a column must land only after all
  readers of that column are gone (expand/contract).
- **Rationale:** Agent judged a column drop "safe" under M-2's generic review; a lagging
  consumer crashed in staging.
- **Added:** 2026-06-20
- **Traced-To:** session 2026-06-20-b; MR #88; skills/db-migrations/SKILL.md M-2
- **Enforcement:** hook (pre-apply advisory)
- **Status:** active

### CL-024

- **Rule ID:** CL-024
- **Category:** migrations/safety
- **Trigger Origin:** human correction (review thread MR #95)
- **Scope:** repo
- **Constraint:** Adding a NOT NULL column to a populated table requires a default or a
  staged backfill; "review for safety" must check row counts.
- **Rationale:** Agent passed a NOT NULL addition under M-2; the deploy locked a 40M-row
  table for 11 minutes.
- **Added:** 2026-06-27
- **Traced-To:** session 2026-06-27-a; MR #95; skills/db-migrations/SKILL.md M-2
- **Enforcement:** hook (pre-apply advisory)
- **Status:** active

### CL-027

- **Rule ID:** CL-027
- **Category:** migrations/safety
- **Trigger Origin:** human rejection (MR #103 approval overridden)
- **Scope:** repo
- **Constraint:** Index creation on large tables must be concurrent (non-blocking) or
  scheduled in a maintenance window.
- **Rationale:** Agent's M-2 pass called a plain CREATE INDEX "safe"; write latency
  spiked in production.
- **Added:** 2026-07-05
- **Traced-To:** session 2026-07-05-c; MR #103; skills/db-migrations/SKILL.md M-2
- **Enforcement:** hook (pre-apply advisory)
- **Status:** active

### CL-030

- **Rule ID:** CL-030
- **Category:** migrations/safety
- **Trigger Origin:** human correction (review thread MR #109)
- **Scope:** repo
- **Constraint:** "Safe" judgments under M-2 must name the specific hazard class checked
  (lock, reader-drift, backfill), not assert overall safety.
- **Rationale:** Fourth incident where M-2's unqualified "review for safety" produced a
  confident but hazard-blind approval.
- **Added:** 2026-07-12
- **Traced-To:** session 2026-07-05-c; MR #109; skills/db-migrations/SKILL.md M-2
- **Enforcement:** hook (pre-apply advisory)
- **Status:** active
