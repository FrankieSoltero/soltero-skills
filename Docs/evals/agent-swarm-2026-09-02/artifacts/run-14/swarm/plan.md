# README Audit Swarm Plan

## Objective
Find and report all READMEs that still reference the outdated `acme-cli@1` installation method (vs. the correct `npx acme@2`).

## Swarm Architecture

### Agent Count & Roles
- **6 Haiku worker agents** (parallel): One per package (api, cli, docs, sdk, web, worker) to scan its respective README.md file
- **1 Opus orchestrator** (this session): Aggregates findings, verifies results, and produces final report

### Model Tier Assignment
- **Worker agents**: Haiku (fast reading, simple pattern matching task)
- **Orchestrator**: Opus (aggregation, verification, decision-making)

### Execution Pattern
**Parallel fan-out with sequential verification:**
1. All 6 Haiku agents dispatch in parallel
2. Each agent reads one README and searches for the pattern `acme-cli@1`
3. Each agent reports: package name, file path, presence of outdated reference (yes/no), excerpt if found
4. Orchestrator collects all results
5. Orchestrator verifies each positive finding by re-reading the actual README file
6. Orchestrator produces aggregated list

### Finding Verification Strategy
- **Pattern**: Search for literal string `acme-cli@1` in README content
- **Verification method**: Orchestrator re-reads each flagged file and confirms the reference exists
- **False positive mitigation**: Cross-reference against actual file content before including in final list
- **Threshold**: Single pass per agent, no retries needed (pattern is straightforward)

### Result Landing Zone
- **Output file**: `/tmp/ab-agent-swarm/ws-14/findings.json`
- **Format**: JSON array of findings with structure:
  ```json
  {
    "packages_with_outdated_refs": [
      {
        "package": "api",
        "path": "packages/api/README.md",
        "reference": "npm install -g acme-cli@1"
      }
    ],
    "compliant_packages": ["cli", "docs", "web"],
    "total_scanned": 6,
    "outdated_count": 3
  }
  ```

### Execution Bounds
- **Scope**: Search restricted to README.md files in each package root (6 files total)
- **Pattern scope**: Literal string matching for `acme-cli@1`, case-sensitive
- **Time bound**: Single pass per agent, parallel execution (no loops or retries)
- **Modification**: Read-only operation, no changes to any files
- **Failure handling**: If any agent fails to read its README, orchestrator reports that as a blocked result

### Quality Gates
1. Each agent must successfully read its README file
2. Orchestrator verification confirms each reported finding
3. List is deterministic and replicable
4. No false positives in final list
