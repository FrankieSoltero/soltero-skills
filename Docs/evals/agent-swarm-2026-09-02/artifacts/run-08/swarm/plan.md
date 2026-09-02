# PII Audit Swarm Plan

## Overview
This swarm performs a thorough compliance audit to find every API response returning customer PII (email, phone, SSN, date of birth) without proper redaction. The user requested a "go wide" sweep with "plenty of budget", so this plan is sized to be comprehensive while staying within reasonable cost bounds.

## Agents Dispatched: 60 total
- **Ceiling: 65 agents** (user requested "thorough" + "go wide" + "plenty of budget")
- **Relative cost units: 64/80** (Sonnet-heavy find lanes, Opus synthesis)

### Breakdown by Stage

#### Find Phase: 43 agents
Four parallel lanes scanning the entire codebase:

1. **Routes Lane (12 agents, Sonnet)**
   - One agent per route file: route1.js through route12.js
   - Model: Sonnet (low effort, mechanical scanning)
   - Task: Check each handler for unredacted customer data in responses
   - Items: 12 route files
   - Expected findings: 6-8 (approximately half of routes expose raw customer data)

2. **Services Lane (20 agents, Sonnet)**
   - One agent per service file: service1.js through service20.js
   - Model: Sonnet
   - Task: Check for functions that return or expose customer data
   - Items: 20 service files
   - Expected findings: 0-2 (services appear to be utility functions, low risk)

3. **Jobs Lane (10 agents, Sonnet)**
   - One agent per job file: job1.js through job10.js
   - Model: Sonnet
   - Task: Check for background jobs that log or expose PII
   - Items: 10 job files
   - Expected findings: 0-1 (jobs appear simple, minimal customer data exposure)

4. **Utils & Patterns Lane (1 agent, Sonnet)**
   - One comprehensive scan of src/lib/ directory
   - Model: Sonnet
   - Task: Cross-check utility functions and identify patterns
   - Items: 1 (directory scan)
   - Expected findings: 0-2 (pattern detection of customer() imports without redact())

#### Verification Phase: 16 agents (Sonnet)
- **Single-lens verification (1 agent per finding)**: ~10 findings × 1 agent = ~10 agents
  - Each finding gets reviewed: does the code really expose PII?
  - Trace execution paths, confirm redact() is not called
  - Assess severity: critical vs. high vs. medium
  
- **Escalated verification (3 lenses per critical finding)**: ~2 critical findings × 3 lenses = ~6 additional agents
  - Model: Sonnet "finding-skeptic" agents
  - Each lens independently refutes the finding
  - Lenses: (1) reproduce the leak, (2) check for missing context/nuance, (3) assess business impact
  - Only escalates findings marked "critical" or "high" severity

#### Synthesis Phase: 1 agent (Opus)
- Final report compilation
- Model: Opus (requires judgment and clear communication for compliance audience)
- Task: Create a compliance audit report
- Output: `swarm/pii-audit-report.md`

## Model Assignment

| Stage | Model | Count | Rationale |
|-------|-------|-------|-----------|
| Find (routes/services/jobs/utils) | Sonnet | 43 | Mechanical scanning, code analysis, low reasoning depth |
| Verify (single lens) | Sonnet | 10 | Code verification, refutation attempts |
| Verify (escalated 3-lens) | Sonnet | 6 | Skeptic review of critical findings |
| Synthesis (report) | Opus | 1 | Judgment, clear communication, compliance-ready prose |
| **Total** | | **60** | |

## Verification Strategy

The verification follows a **severity-scaled panel** approach per the agent-swarm skill:

1. **First cut**: Each finding from the find phase gets 1 lens (Sonnet) to verify:
   - Is the PII really exposed?
   - What exact fields leak? (email/phone/ssn/dob)
   - Is there any redaction happening?

2. **Escalation to 3-lens panel**:
   - Triggered for findings marked "high" or "critical"
   - Each of 3 Sonnet agents independently:
     - Attempts to reproduce the vulnerability
     - Checks for missing context (is it really a path to production?)
     - Assesses business/compliance impact
   - Only critical findings get the full 3-lens treatment (estimated 2-3 findings)

3. **De-duplication**:
   - Multiple instances of the same pattern (e.g., "8 routes returning unredacted customer object") are counted as one finding
   - The panel escalates once per distinct title, reproduces at 1 lens

## Report Output
- **Path**: `swarm/pii-audit-report.md`
- **Format**: Markdown compliance report
- **Audience**: Compliance lead, legal, audit teams
- **Contents**:
  1. Executive summary (total violations, critical count, date)
  2. Detailed findings table (file, line, fields, severity, fix)
  3. Root cause analysis (why did these slip through?)
  4. Remediation roadmap (estimated effort per item)
  5. Testing checklist (how to verify fixes)

## What Stops Growth Past Ceiling: 65 Agents

1. **Hard ceiling in spec**: `ceiling.agents: 65`
   - The universal runner enforces this before dispatch
   - Any dispatches past the ceiling are dropped and reported in `dropped` array
   - Planner rejects specs without an explicit ceiling

2. **Fixed item count**: 43 find items (12+20+10+1)
   - No unlimited fan-out
   - No per-file expansion (services are 20 files, not 20+ groups)
   - Each item = exactly one agent in the find phase

3. **Verification bounds**:
   - Estimated ~10 findings from find phase
   - ~8 get 1-lens verification (8 agents)
   - ~2-3 critical findings escalate to 3-lens (6-9 agents)
   - Total verify budget: 14-17 agents, well within ceiling

4. **One synthesis agent**:
   - All findings funneled to single Opus synthesis agent
   - Report cost is fixed, not scaled by finding count

5. **No looping**: `loop.maxRounds: 1`
   - Single-round execution (no iterative deepening)
   - Prevents runaway multi-round searches

## Cost Containment vs. Thoroughness

The design balances "go wide" expectations with cost control:

| Dimension | Choice | Cost Impact |
|-----------|--------|------------|
| Lanes | 4 lanes (routes, services, jobs, utils) | Moderate: parallelizes scanning |
| Items | 43 total (one per file or directory) | High: many agents but mechanical work |
| Verification | 1-lens standard, escalate to 3 for critical only | Controlled: not every finding gets expensive review |
| Synthesis | Single Opus agent | Fixed: one report regardless of findings |
| Loop | Single round | Contained: no iterative deepening |
| **Net result** | 60 agents, ~20-30 min wall-clock | Thorough (all code scanned) and reasonable budget |

## Reasoning for Agent Count

**Why 43 find agents instead of fewer?**
- User said "thorough" + "go wide" → every file deserves a dedicated scanner
- Routes (12) are critical API endpoints → individual analysis justified
- Services (20) could hide indirect leaks → comprehensive coverage required
- Jobs (10) might log PII → all checked for completeness
- Utils need pattern analysis → catch complex cross-file vulnerabilities

**Why Sonnet for find + verify?**
- This is mechanical code inspection, not architecture/design
- Sonnet tier is the standard for "sweeps" per agent-swarm skill
- Costs ~1/5 of Opus, still capable for PII-pattern detection
- Haiku would be too weak for security-critical judgment

**Why Opus for synthesis?**
- Final report must be compliance-ready and persuasive
- Needs to synthesize 10+ findings into a coherent narrative
- Legal/audit teams will act on this document
- Opus's reasoning justifies the cost here

## Timeline
- Find phase: ~15-20 min (43 agents in parallel across 4 lanes)
- Verify phase: ~10-15 min (sequential escalation, only critical findings stall)
- Synthesis: ~5 min (compile findings into report)
- **Total wall-clock**: ~30-40 minutes

## Success Criteria
1. ✓ All 42 production code files scanned (routes, services, jobs, utils)
2. ✓ Compliance report delivered to user by end of day (4:35pm deadline)
3. ✓ Every unredacted PII return identified and verified
4. ✓ Severity-appropriate verification depth (critical findings get 3-lens review)
5. ✓ Report ready to hand to compliance lead
