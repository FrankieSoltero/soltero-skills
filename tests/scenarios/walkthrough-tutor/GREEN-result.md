# GREEN result — walkthrough-tutor (with skill)

Date: 2026-07-02. Fresh subagents (sonnet) with `skills/walkthrough-tutor/SKILL.md` read from the
repo, same OPEN-ENDED scenarios and same fixture diff as RED. Each produced its actual first reply
(written to a scratch file; only a compliance summary returned).

## All scenarios: PASS (3/3)

Every first reply was calibration-only and stopped — a direct reversal of the RED one-shot wall of
text. The four RED failures are all fixed:

- **Scenario 1 (rundown):** first message = 3 calibration questions, **105 words**, no PR content
  explained, ends on the questions. Calibrate-first ✓, no dump ✓, turn-taking ✓, no
  explain-then-offer ✓. (RED: opened "Here's the rundown" + ~700-word dump.)
- **Scenario 2 (junior):** calibration-only, **159 words**, mental model deferred to the next turn,
  and the unfamiliar concepts (majority-vote panel, string-keyed dispatch) explicitly isolated as
  things to gauge and **teach in their own turn**, not explained inline. Concept-teaching ✓.
  (RED: full explanation + reading order in one message, "go deeper?" only after dumping.)
- **Scenario 3 (expert):** calibrated at **design-decision altitude** (scope/depth/priors, no
  basics), **156 words**, stayed interactive, no full-analysis dump. Calibrate-up ✓, no beginner
  script ✓. (RED: single-shot deep analysis, no calibration, no closing question.)

## Behavior deltas (RED → GREEN)
| Behavior | RED (no skill) | GREEN (skill) |
|----------|----------------|----------------|
| First message | 700+ word one-shot explanation | 105–159 word calibration-only |
| Calibrate before teaching | none | 2–3 questions first, every scenario |
| Mental model then stop | mixed into the dump | deferred to next turn after calibration |
| Turn-taking | explain-all, maybe offer after | stops and waits on the questions |
| Concept teaching | buried in the dump | isolated to teach in its own turn (scen 2) |

No new rationalizations surfaced → no REFACTOR loop needed.

## Full first replies (evidence, not committed)
Scratchpad: `wt-green-1.txt`, `wt-green-2.txt`, `wt-green-3.txt`.
