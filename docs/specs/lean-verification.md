# Skill Spec — lean-verification

- **Problem:** Agents claim success without fresh evidence: "should pass now",
  status reports from stale runs after further edits, relaying a subagent's
  "success" without checking the diff, satisfaction expressed before any
  verification ran. superpowers:verification-before-completion counters this;
  the lean variant keeps its gate at lower word count and ties into lean-sdd
  (implementer reports as evidence, controller never marks clean without a
  reviewer verdict).
- **Trigger:** Use before claiming anything is complete, fixed, or passing —
  before committing, PR creation, task completion, or answering "is it
  done/fixed?". Lean variant of superpowers:verification-before-completion.
- **Scope / non-goals:** The iron law (no completion claim without fresh
  verification evidence in the same message), the gate function (identify the
  proving command → run it fully → read the output → claim WITH evidence),
  the claims table (tests/lint/build/bugfix/subagent-report/requirements, plus
  live surfaces), the live-surface rule (a change to a UI screen, an HTTP
  endpoint or a CLI surface requires one live-driven observation — the `run`
  skill, a real request, the rendered screen — plus a final-state check on the
  DB row / file / response body, because integration and component tests still
  run against doubles), and red flags ("should", "probably", stale runs,
  trusting agent reports, "it works" for a surface nobody has driven).
  Non-goals: doesn't define what to verify (the plan/task does); not a CI
  guide.
- **Success scenario:** Asked "is the bug fixed?" after editing code but not
  re-running the reproducing test, the agent runs the test and answers with
  the output — instead of "should be fixed now". A subagent's DONE report is
  checked against the actual diff and test run before being relayed.
- **Bundled assets:** none. Derived from superpowers:verification-before-
  completion (MIT, © 2025 Jesse Vincent), condensed.
