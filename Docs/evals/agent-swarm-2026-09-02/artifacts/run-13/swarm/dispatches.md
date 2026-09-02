# Agent Dispatch List

## Dispatch Format
Each dispatch is an Agent tool call. The prompt instructs the agent to read its brief file first, then conduct the investigation as specified. All briefs are in `/tmp/ab-agent-swarm/ws-13/dispatch/`.

---

## Dispatch 1: Money Math Investigation
**Brief:** dispatch/01-money-math.md

**Agent call:**
```
Agent({
  description: "Analyze rounding losses in money.js functions",
  prompt: "Read your brief first: /tmp/ab-agent-swarm/ws-13/dispatch/01-money-math.md\n\nThen conduct the investigation as specified in the Objective, Inputs, and Return schema sections. Your response must follow the Return schema exactly.",
  model: "haiku"
})
```

---

## Dispatch 2: Ledger Analysis
**Brief:** dispatch/02-ledger-analysis.md

**Agent call:**
```
Agent({
  description: "Trace ledger write and balance functions for precision loss",
  prompt: "Read your brief first: /tmp/ab-agent-swarm/ws-13/dispatch/02-ledger-analysis.md\n\nThen conduct the investigation as specified. Trace post() and balance() to verify they preserve cent-level precision.",
  model: "haiku"
})
```

---

## Dispatch 3: Reconcile Loop Walkthrough
**Brief:** dispatch/03-reconcile-trace.md

**Agent call:**
```
Agent({
  description: "Step-by-step walkthrough of reconcile() with concrete test invoice",
  prompt: "Read your brief first: /tmp/ab-agent-swarm/ws-13/dispatch/03-reconcile-trace.md\n\nPerform a detailed trace of the reconcile() function with specific numbers at each step. Show where cents are lost.",
  model: "sonnet"
})
```

---

## Dispatch 4: Cron Wrapper Analysis
**Brief:** dispatch/04-cron-wrapper.md

**Agent call:**
```
Agent({
  description: "Analyze nightly.sh cron wrapper and reconcile invocation",
  prompt: "Read your brief first: /tmp/ab-agent-swarm/ws-13/dispatch/04-cron-wrapper.md\n\nInvestigate the cron schedule, how reconcile() is invoked, and what data is passed to it.",
  model: "haiku"
})
```

---

## Dispatch 5: Log Pattern Analysis
**Brief:** dispatch/05-log-patterns.md

**Agent call:**
```
Agent({
  description: "Extract and analyze temporal drift patterns from reconcile.log",
  prompt: "Read your brief first: /tmp/ab-agent-swarm/ws-13/dispatch/05-log-patterns.md\n\nParse all log entries, extract drift values, and identify repeating patterns. Use bash commands to analyze the data.",
  model: "haiku"
})
```

---

## Dispatch 6: System Boundaries & Data Flow
**Brief:** dispatch/06-system-boundaries.md

**Agent call:**
```
Agent({
  description: "Map system architecture and invoice data sources",
  prompt: "Read your brief first: /tmp/ab-agent-swarm/ws-13/dispatch/06-system-boundaries.md\n\nConduct a thorough search of the project to understand data flow, entry points, and where invoices originate.",
  model: "sonnet"
})
```

---

## Execution Notes

1. **Parallel execution:** All six dispatches are independent and can run concurrently.

2. **Brief validation:** Before dispatch, validate all briefs with:
   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/validate-brief.mjs \
     dispatch/01-money-math.md \
     dispatch/02-ledger-analysis.md \
     dispatch/03-reconcile-trace.md \
     dispatch/04-cron-wrapper.md \
     dispatch/05-log-patterns.md \
     dispatch/06-system-boundaries.md
   ```

3. **Return collection:** Each agent's return is saved to `/tmp/ab-agent-swarm/ws-13/dispatch/returns/<dispatch-slug>.md`.

4. **Verification pass:** After all six returns are collected, orchestrator performs verification checks per plan.md, cross-checking claims and validating evidence.

5. **Synthesis:** Orchestrator writes findings.md and verification-record.md with verified conclusions and cross-check audit trail.

---

## Model Assignment Justification

- **Haiku (threads 1, 2, 4, 5):** These are focused read tasks — analyze specific code sections, extract data from logs, trace through one function. Haiku's strength is rapid comprehension of bounded problems. Cost efficiency matters for a 6-agent swarm.

- **Sonnet (threads 3, 6):** These require judgment and synthesis across multiple components. Thread 3 needs careful step-by-step execution and quantitative reasoning. Thread 6 needs to reason about system-wide architecture. Sonnet's judgment and context window justify the cost.

- **Fable (orchestrator):** Coordination and verification only; no direct code work.

This allocation matches the dispatch-contract standard: haiku for reading/extraction, sonnet for engineering/judgment, opus reserved for only the most complex architectural redesigns (not needed here).
