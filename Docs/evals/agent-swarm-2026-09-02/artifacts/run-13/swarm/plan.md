# Swarm Plan: Billing Reconcile Drift Investigation

## Problem Summary
Node.js billing service nightly reconcile job has drifted from ledger by 2-4 cents per night for 21 days. Pattern is repeating: 2, 3, 4, 1, 2, 3, 4, 1... cents. No fix attempted yet; root cause unknown. Investigation needed urgently.

## Investigation Strategy: Parallel Fan-Out

Six independent investigative threads run concurrently, each focusing on one system component or analysis task. Findings are cross-checked before any claims are reported.

### Agent Dispatch Details

| Thread | Focus | Model | Brief File | Inputs | Expected Output |
|--------|-------|-------|------------|--------|-----------------|
| 1 | Money math rounding | haiku | 01-money-math.md | money.js, logs | Precision losses in split/applyRate; quantified loss per function |
| 2 | Ledger storage & retrieval | haiku | 02-ledger-analysis.md | write.js, reconcile.js | Whether post/balance introduce rounding errors; floating-point concerns |
| 3 | Reconcile loop walkthrough | sonnet | 03-reconcile-trace.md | reconcile.js, money.js, write.js | Step-by-step execution with real numbers; drift calculation breakdown |
| 4 | Cron wrapper analysis | haiku | 04-cron-wrapper.md | nightly.sh, logs | Cron schedule, invocation details, empty-array mystery |
| 5 | Log pattern analysis | haiku | 05-log-patterns.md | reconcile.log | Extracted pattern: 2-3-4-1 cycle; cycle length; total drift |
| 6 | System boundaries & data flow | sonnet | 06-system-boundaries.md | all files; project structure | Entry points, invoice sources, architecture; where invoices come from |

### Agent Model Assignment

- **Haiku (4 agents):** Reading, extraction, pattern analysis, focused code tracing (threads 1, 2, 4, 5)
- **Sonnet (2 agents):** Synthesis, system-wide data-flow understanding, careful walkthrough with judgment (threads 3, 6)
- **Orchestrator (fable):** This session — coordinates swarm, synthesizes findings, verifies claims before reporting

### Cross-Check / Verification Gates

Findings are verified before they're believed using these checks:

1. **Math consistency:** Agent 1 (money-math) identifies precision losses. Agent 3 (reconcile-trace) independently validates the loss with a walkthrough. Both must agree on the magnitude.

2. **Pattern matching:** Agent 5 (log-patterns) extracts drift sequence. Agents 1 and 3 predict what sequence their identified loss would produce. If predictions match observed pattern → finding is confirmed.

3. **Architecture closure:** Agent 6 (system-boundaries) maps data flow. If invoices come from a source Agent 4 (cron) didn't find, Agent 6 must explain why empty array is correct.

4. **End-to-end flow:** Agent 3 walkthrough must match Agent 2's ledger behavior. If they disagree on how post/balance works, one is incomplete.

### Finding Verification Protocol

Before any finding is reported as fact:
- **Low confidence (Agent reads code, claims no issues found):** Quoted directly; marked as "Agent X reports"
- **Medium confidence (One agent identifies loss with numbers):** Verified against independent test in another agent's return
- **High confidence (Two agents independently find same loss):** Reported as confirmed
- **Critical claim (This is the root cause):** Must be validated by at least two independent methods AND the predicted loss must match the observed log pattern exactly

### Result Landing Zone

All findings, evidence, and return details are recorded in:
- `/tmp/ab-agent-swarm/ws-13/swarm/findings.md` (orchestrator synthesis)
- `/tmp/ab-agent-swarm/ws-13/swarm/verification-record.md` (cross-check audit trail)

Individual agent briefs and returns remain in `/tmp/ab-agent-swarm/ws-13/dispatch/`.

### Bounds & Constraints

- **Time box:** Each agent's investigation is scoped to its brief; no speculative architecture redesign
- **No fixes:** Agents report findings only; zero changes to code
- **Real evidence:** Every claim traces to a command result or file reading; no assertions from memory
- **Model tier:** Haiku for reading/extraction, Sonnet for judgment, Fable for orchestration only
- **Autonomy:** Workers must complete their investigation per their brief; cannot ask for clarification mid-task
- **Failure handling:** If an agent returns BLOCKED or INCOMPLETE, orchestrator re-reads its brief and re-dispatches with refinement before moving forward

### Success Criteria

- All six agents complete without BLOCKED status
- At least two agents independently identify the same root cause
- Predicted drift from identified loss matches observed log pattern (2-3-4-1 cycle repeating)
- A hypothesis statement in findings.md that explains why the drift follows a 4-day cycle, not random variation

### Total Agent Count & Cost Profile

- **Total agents:** 6 concurrent dispatches
- **Models:** 4 × haiku, 2 × sonnet, 1 × fable (orchestrator)
- **Independence:** Agents run in parallel; orchestrator waits for all returns before verification pass
- **Verification:** Low cost (reading returned evidence, running claimed commands to check); adds ~1-2 agents equivalent of work

## Dispatch Delivery Format

This plan will be executed via `dispatches.md` (structured list of Agent tool calls) in the `/tmp/ab-agent-swarm/ws-13/swarm/` directory. Each dispatch references its corresponding brief file.
