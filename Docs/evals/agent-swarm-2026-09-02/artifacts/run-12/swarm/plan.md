# Billing Reconciliation Drift Investigation — Swarm Plan

## Executive Summary

A nightly billing reconciliation job has been drifting from the ledger by a few cents per night for three weeks. This swarm will investigate all components systematically to find the root cause.

## Swarm Parameters

**Planner Verdict:** DISPATCHABLE (mode: workflow)

### Agent Count & Distribution

| Tier | Count | Purpose |
|------|-------|---------|
| sonnet | 25 | Lane workers (13) + Verification (12) |
| opus | 1 | Synthesis & Root Cause Analysis |
| **Total** | **26** | **Under ceiling of 50** |

### Relative Cost

- **Cost Units:** 30 (minimal scope relative to thorough ceiling)
- **Mode:** Workflow (multi-stage, >3 agents)

## Swarm Structure

### Shape: Find / Review

Finding bugs that cause the reconciliation drift. Multiple lanes investigate different components, with severity-scaled verification and opus synthesis.

### Lanes (5 total, 13 items)

1. **inspect-reconcile-job** (1 item)
   - Files: `src/jobs/reconcile.js`
   - Model: sonnet
   - Search: Calculation errors, rounding losses, precision issues, drift calculation bugs
   - Findings Expected: 2-3

2. **inspect-ledger-writes** (1 item)
   - Files: `src/ledger/write.js`
   - Model: sonnet
   - Search: Floating point precision issues, format conversion errors, accumulated rounding errors
   - Findings Expected: 1-2

3. **inspect-math-helpers** (9 items)
   - Files: `src/lib/money.js`, `src/lib/helper1.js` through `src/lib/helper8.js`
   - Model: sonnet
   - Search: Math.floor/ceil without remainder handling, floating point division issues, lossless conversion failures
   - Findings Expected: 3-4

4. **inspect-cron-wrapper** (1 item)
   - Files: `bin/nightly.sh`
   - Model: sonnet
   - Search: Timing issues, timezone problems, environment variables, incorrect parameters
   - Findings Expected: 1-2

5. **analyze-reconcile-logs** (1 item)
   - Files: `var/log/reconcile.log`
   - Model: sonnet
   - Search: Drift patterns, deterministic vs random behavior, correlation with dates/times
   - Findings Expected: 1-2

### Verification Strategy

**Model:** sonnet (verification tier per standard)

**Lens Scaling:**
- **Default:** 1 lens per finding (for low/medium severity)
- **Escalated:** 3 lenses per finding (for high/critical severity findings)
- **Pattern Deduplication:** Runs once per distinct finding title; repeats use base lens count

**Configuration:**
- `expectedFindings: 8` (anticipate ~8 total findings across all lanes)
- `expectedPatterns: 3` (expect ~3 distinct bug patterns)
- `panelPerFinding: false` (per-pattern verification, not per-instance)

**Escalation Criteria:** Findings marked high or critical severity (root cause candidates) get 3-lens panel; others get 1 lens.

### Synthesis

**Model:** opus (engineering tier per standard — writes the report)

**Output:** `.soltero/swarm/drift-investigation-2026-09-02.md`

**Task:**
1. Group findings by component
2. Identify likely root cause(s) based on drift pattern in logs (1-4 cents/night, repeating)
3. Rank by likelihood
4. Provide prioritized fix list

## Bounds & Constraints

### Hard Bounds
- **Agent Ceiling:** 50 agents (user said "look at everything" / "swarmed" — thorough tier)
- **Verification:** Severity-scaled (1 or 3 lenses, not flat panel)
- **Synthesis:** Single opus agent writing to file (not re-summarized in context)

### Investigation Scope
- **In Scope:** All code components user mentioned + logs
- **Out of Scope:** External dependencies, infrastructure, deployment
- **Isolation:** No writes to production; read-only investigation

### Time Bounds
- **Single Round** (no loop required for initial investigation)
- Iterative rounds only if synthesis identifies ambiguities

## Expected Outcomes

### From Lane Agents (13 total)
- 8+ findings across 5 lanes
- Each finding: exact code location, clear description of how it causes drift

### From Verification (12 agents)
- High/critical findings escalated to 3-lens panel
- Low/medium findings verified at 1 lens
- Deduped by pattern (3 expected distinct patterns)

### From Synthesis (1 agent)
- Root cause analysis document
- Component-by-component bug list
- Ranked fix priorities
- Evidence linking findings to observed log patterns

## Model Standard Rationale

Per corporate dispatch contract:

| Tier | Work Class | Usage Here |
|------|-----------|-----------|
| **sonnet** | Grunt — find/research sweeps, triage | Lane workers (code inspection), verification passes |
| **opus** | Engineering — synthesis, judgment | Report writing, root cause analysis |
| **haiku** | Reading/summarizing | Not used (sonnet sufficient for finding and verification) |
| **fable** | Orchestrator (this session only) | Not dispatched to any agent |

## Execution Instructions

1. **Validate:** Spec already validated by planner (exit 0)
2. **Dispatch:** Invoke universal swarm runner with spec, root path, and date
3. **Verify:** Planner re-checks pins and ceiling at dispatch time
4. **Results:** Output path, agent count per tier, dropped dispatches (if any), findings summary

```bash
# Validation (already done)
node ${CLAUDE_SKILL_DIR}/scripts/swarm-plan.mjs .soltero/swarm/drift-investigation.json

# Execution (via Workflow tool)
Workflow({
  scriptPath: "${CLAUDE_SKILL_DIR}/workflows/swarm.mjs",
  args: {
    spec: <drift-investigation.json parsed>,
    root: "/tmp/ab-agent-swarm/ws-12",
    date: "2026-09-02"
  }
})
```

## Contingencies

### If Findings Are Insufficient
- Synthesis agent will flag ambiguities
- Second round can investigate deeper if needed
- Max 2 rounds (loop.maxRounds: 2) to avoid runaway cost

### If Verification Escalates Many Findings
- Severity-scaled panel (3 lenses only for high/critical)
- Expected patterns (~3) deduplicate repeated instances
- Total verification cost capped by specification

### If Drift Root Cause Not Found
- Synthesis will identify most likely candidates
- Flags investigation gaps for manual follow-up
- All findings still actionable as preventive improvements

## Status

- ✅ Spec written
- ✅ Validated by planner (26 agents, under ceiling of 50)
- ⏳ Ready for execution via Workflow tool
- ⏳ Awaiting user dispatch approval
