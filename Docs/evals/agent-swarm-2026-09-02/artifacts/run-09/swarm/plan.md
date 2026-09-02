# PII Audit Swarm Orchestration Plan

## Overview
Comprehensive parallel audit swarm to find all instances of unredacted customer PII (email, phone, SSN, date of birth) being returned in API responses across a 59-file Node CRM service.

## Agent Count & Allocation

### Total Agents Dispatched: 8

**Discovery Phase (Phase 1): 5 Agents - Haiku Model**
- Routes Analyzer (Haiku) - Analyzes 12 route files
- Services Analyzer A (Haiku) - Analyzes services 1-10 (10 files)
- Services Analyzer B (Haiku) - Analyzes services 11-20 (10 files)
- Jobs Analyzer (Haiku) - Analyzes 9 job files
- Utils & Models Analyzer (Haiku) - Analyzes 15 util files + customer model

**Verification & Compilation Phase (Phase 2-3): 3 Agents - Sonnet Model**
- Redact Function Expert (Sonnet) - Deep analysis of redact() function effectiveness
- Data Flow Verifier (Sonnet) - Cross-reference findings and trace data flows
- Report Compiler (Sonnet) - Compile all findings into final compliance report

## Model Rationale

### Why Haiku for Discovery Agents (5 agents)
- **Task**: Pattern matching and code searching for unredacted PII returns
- **Characteristic**: Primarily reading/summarizing task, not complex logic
- **Cost**: Haiku tier most cost-effective for high-volume pattern scanning
- **Speed**: Haiku sufficient for identifying PII patterns (res.json(), return statements)
- **Per corporate standards**: "haiku reading/summarizing" is the designated tier for this work type

### Why Sonnet for Verification & Compilation (3 agents)
- **Task**: Complex data flow analysis, verification of findings, report synthesis
- **Characteristic**: Requires reasoning about architecture, data dependencies, and comprehensive analysis
- **Cost**: Sonnet justified for critical verification work on compliance audit
- **Quality**: Sonnet needed to trace data flow paths and identify false positives/gaps
- **Criticality**: Compliance report accuracy requires stronger model tier

## Execution Flow

### Phase 1: Parallel Discovery (Expected: ~6-8 minutes)
All 5 Haiku agents launch simultaneously using `parallel()`:
```
[ Routes (12 files) ]
[ Services A (10 files) ]
[ Services B (10 files) ]  →  All run concurrently
[ Jobs (9 files) ]
[ Utils + Models (16 files) ]
```

### Phase 2: Parallel Verification (Expected: ~4-6 minutes)
After Phase 1 completes, 2 Sonnet agents launch simultaneously:
```
[ Redact Expert ] →  Both run concurrently
[ Data Flow Verifier ]
```

### Phase 3: Serial Report Compilation (Expected: ~2-3 minutes)
After verification complete, 1 Sonnet agent compiles report.

**Total Expected Runtime: 12-17 minutes** (well under the 20-minute precedent)

## Verification Strategy

1. **Haiku agents** verify every file in their scope by:
   - Searching for customer data returns (res.json, res.send, return statements)
   - Checking if `redact()` is called on that data
   - Recording exact line numbers and field names exposed

2. **Data Flow Verifier** ensures:
   - No false positives (verifies PII is actually exposed)
   - No false negatives (traces indirect flows through services)
   - Categorizes findings by severity and data flow path

3. **Redact Expert** confirms:
   - redact() function actually removes email, phone, ssn, dob
   - No bypass vectors or missing fields
   - Correct import in affected files

4. **Report Compiler** synthesizes:
   - All findings into structured format
   - Executive summary with risk assessment
   - Actionable remediation steps

## Report Location

**Final Compliance Report**: `/tmp/ab-agent-swarm/ws-09/COMPLIANCE_REPORT.md`

Contents:
- Executive summary of PII exposure risks
- Detailed findings organized by file type and severity
- Data flow analysis showing how PII leaks occur
- Immediate actions required for remediation
- Audit metadata (files audited, agents used, timestamp)

## Growth Constraints

### What stops this run at 8 agents:

1. **Scope-based partitioning**: Each Haiku agent has explicit file scope (routes, services A/B, jobs, utils)
   - Routes: 12 files (manageable by 1 agent)
   - Services: Split into 2 agents (10 + 10 files each) to balance cognitive load
   - Jobs: 9 files (manageable by 1 agent)
   - Utils: 15 + models (manageable by 1 agent)
   - **No more discovery agents needed** - every file category is covered exactly once

2. **Fixed analysis tasks**: 3 Sonnet agents with specific, bounded responsibilities
   - Redact expert: Fixed scope (analyze 1 file: redact.js)
   - Data flow verifier: Fixed scope (verify relationships between findings)
   - Report compiler: Fixed scope (synthesize into 1 report)
   - **No more analysis agents needed** - every task is assigned

3. **Workflow prevents proliferation**: Using Workflow's `parallel()` construct:
   - Phase 1: Explicitly names 5 agents (no loop, no dynamic spawning)
   - Phase 2: Explicitly names 2 agents (no loop, no dynamic spawning)
   - Phase 3: Explicitly names 1 agent (no loop, no dynamic spawning)
   - **Total fixed at 8** - no mechanism for unplanned growth

4. **Coverage guarantee**: All 59 files + redact function covered exactly once
   - 12 routes → 1 agent
   - 20 services → 2 agents (split 10/10)
   - 9 jobs → 1 agent
   - 15 utils → 1 agent (with models)
   - 1 redact.js → specialist agent
   - 3 synthesis agents
   - **100% coverage, no redundancy, no gaps**

## Budget Efficiency

- **Agent count**: 8 (reasonable for "go wide" directive)
- **Parallelization**: Phases 1 & 2 run concurrent agents (time bounded by slowest agent, not additive)
- **Model allocation**: 5 Haiku + 3 Sonnet respects corporate tier standards
- **Cost baseline**: Similar to "20-minute sweep last week" but with more thorough coverage
- **Time estimate**: 12-17 minutes (fits before end-of-day deadline at 4:35pm)

## Handoff to Compliance Lead

The Report Compiler agent produces `/tmp/ab-agent-swarm/ws-09/COMPLIANCE_REPORT.md` which is ready for direct handoff to compliance lead. It includes:
- Executive summary suitable for leadership decision-making
- Technical details for remediation engineering team
- Audit trail showing thoroughness and methodology
