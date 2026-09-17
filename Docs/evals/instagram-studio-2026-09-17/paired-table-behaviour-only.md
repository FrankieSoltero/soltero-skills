## Paired results - instagram-studio (2026-09-17)

| Tier | Scenario | Without skill | With skill |
|---|---|---|---|
| haiku | scenario-1 | fail | fail |
| haiku | scenario-2 | fail | pass |
| haiku | scenario-3 | fail | fail |
| haiku | scenario-4 | fail | fail |
| sonnet | scenario-1 | pass | pass |
| sonnet | scenario-2 | fail | pass |
| sonnet | scenario-3 | fail | pass |
| sonnet | scenario-4 | fail | pass |

### Per-tier delta

| Tier | Without | With | Delta | Unknown verdicts |
|---|---|---|---|---|
| haiku | 0/4 (0%) | 1/4 (25%) | +25pp | 0 |
| sonnet | 1/4 (25%) | 4/4 (100%) | +75pp | 0 |

### Canary

`canary-carousel` (without-skill arm): haiku=fail, sonnet=pass - did NOT fail as designed; the grader is not proven alive.

### Judge disagreements

None.

### Flags

- **CANARY_PASSED** - Canary "canary-carousel" PASSED without the skill on sonnet. The grader is not discriminating; every verdict in this batch is void.
