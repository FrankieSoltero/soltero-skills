# Corrections Ledger

Written by correction-compiler. One entry per compiled correction.

### CL-033

- **Rule ID:** CL-033
- **Category:** triage/quarantine
- **Trigger Origin:** human correction (retro 2026-06-19)
- **Scope:** repo
- **Constraint:** "Intermittent" for quarantine purposes means ≥2 failures across ≥10
  runs with no correlated commit; a single flake is a rerun, not a quarantine.
- **Rationale:** Agent quarantined a test after one flake per T-2; the test was masking
  a real race that later shipped.
- **Added:** 2026-06-19
- **Traced-To:** session 2026-06-19-a; retro 2026-06-19; skills/test-triage/SKILL.md T-2
- **Enforcement:** hook (quarantine advisory)
- **Status:** active

### CL-036

- **Rule ID:** CL-036
- **Category:** triage/quarantine
- **Trigger Origin:** human rejection (quarantine PR #61 rejected)
- **Scope:** repo
- **Constraint:** Quarantine requires an attached failure-rate count and a link to the
  flake history, or the quarantine PR is rejected.
- **Rationale:** Second evidence-free quarantine under T-2's bare "if intermittent,
  quarantine".
- **Added:** 2026-06-30
- **Traced-To:** session 2026-06-30-d; PR #61; skills/test-triage/SKILL.md T-2
- **Enforcement:** hook (quarantine advisory)
- **Status:** active

### CL-039

- **Rule ID:** CL-039
- **Category:** triage/fix-forward
- **Trigger Origin:** human correction (prod incident INC-57)
- **Scope:** repo
- **Constraint:** "Small" for fix-forward purposes means a diff the agent has already
  written and tested locally; otherwise revert first, fix second.
- **Rationale:** Agent chose fix-forward under T-5 for a "small" fix that took 4 hours;
  main stayed red the whole time.
- **Added:** 2026-07-08
- **Traced-To:** session 2026-07-08-b; INC-57; skills/test-triage/SKILL.md T-5
- **Enforcement:** hook (triage advisory)
- **Status:** active

### CL-041

- **Rule ID:** CL-041
- **Category:** meta/pr-format
- **Trigger Origin:** human correction (review of patch PR #71)
- **Scope:** repo
- **Constraint:** Skill-patch PR titles must name the target skill file being patched.
- **Rationale:** Reviewer could not tell from the title which skill PR #71 touched;
  triaged it a day late.
- **Added:** 2026-06-24
- **Traced-To:** session 2026-06-24-c; PR #71; skills/skill-patcher/SKILL.md P-3
- **Enforcement:** none yet
- **Status:** active

### CL-044

- **Rule ID:** CL-044
- **Category:** meta/pr-format
- **Trigger Origin:** human correction (review of patch PR #79)
- **Scope:** repo
- **Constraint:** Skill-patch PR descriptions must list, per change, the ledger entries
  that justify it.
- **Rationale:** PR #79's summary said "sharpen triage rules" with no traceability;
  reviewer had to reconstruct the evidence by hand.
- **Added:** 2026-07-02
- **Traced-To:** session 2026-07-02-a; PR #79; skills/skill-patcher/SKILL.md P-3
- **Enforcement:** none yet
- **Status:** active

### CL-047

- **Rule ID:** CL-047
- **Category:** meta/pr-format
- **Trigger Origin:** human rejection (patch PR #84 sent back)
- **Scope:** repo
- **Constraint:** Skill-patch PR descriptions must state, for each edit, which rule ID
  it modifies.
- **Rationale:** Third PR-format correction; P-3's "descriptive title and a summary" is
  too weak to prevent any of these.
- **Added:** 2026-07-11
- **Traced-To:** session 2026-07-11-b; PR #84; skills/skill-patcher/SKILL.md P-3
- **Enforcement:** none yet
- **Status:** active
