# Agent Dispatches

## Overview
Six parallel Haiku agents, one per package, to audit READMEs for outdated `acme-cli@1` references.

---

## Dispatch 1: API Package Scanner

**Agent Type**: Haiku  
**Task Name**: api-readme-scan  
**Package**: api

**Instructions**:
1. Read the file `/tmp/ab-agent-swarm/ws-14/packages/api/README.md`
2. Search for the literal string `acme-cli@1` (case-sensitive)
3. Report:
   - Package name: `api`
   - File path: `packages/api/README.md`
   - Contains outdated reference: yes/no
   - If yes, provide the exact line(s) containing `acme-cli@1`
4. Keep response concise: JSON format with keys: `package`, `path`, `found`, `lines`

---

## Dispatch 2: CLI Package Scanner

**Agent Type**: Haiku  
**Task Name**: cli-readme-scan  
**Package**: cli

**Instructions**:
1. Read the file `/tmp/ab-agent-swarm/ws-14/packages/cli/README.md`
2. Search for the literal string `acme-cli@1` (case-sensitive)
3. Report:
   - Package name: `cli`
   - File path: `packages/cli/README.md`
   - Contains outdated reference: yes/no
   - If yes, provide the exact line(s) containing `acme-cli@1`
4. Keep response concise: JSON format with keys: `package`, `path`, `found`, `lines`

---

## Dispatch 3: Docs Package Scanner

**Agent Type**: Haiku  
**Task Name**: docs-readme-scan  
**Package**: docs

**Instructions**:
1. Read the file `/tmp/ab-agent-swarm/ws-14/packages/docs/README.md`
2. Search for the literal string `acme-cli@1` (case-sensitive)
3. Report:
   - Package name: `docs`
   - File path: `packages/docs/README.md`
   - Contains outdated reference: yes/no
   - If yes, provide the exact line(s) containing `acme-cli@1`
4. Keep response concise: JSON format with keys: `package`, `path`, `found`, `lines`

---

## Dispatch 4: SDK Package Scanner

**Agent Type**: Haiku  
**Task Name**: sdk-readme-scan  
**Package**: sdk

**Instructions**:
1. Read the file `/tmp/ab-agent-swarm/ws-14/packages/sdk/README.md`
2. Search for the literal string `acme-cli@1` (case-sensitive)
3. Report:
   - Package name: `sdk`
   - File path: `packages/sdk/README.md`
   - Contains outdated reference: yes/no
   - If yes, provide the exact line(s) containing `acme-cli@1`
4. Keep response concise: JSON format with keys: `package`, `path`, `found`, `lines`

---

## Dispatch 5: Web Package Scanner

**Agent Type**: Haiku  
**Task Name**: web-readme-scan  
**Package**: web

**Instructions**:
1. Read the file `/tmp/ab-agent-swarm/ws-14/packages/web/README.md`
2. Search for the literal string `acme-cli@1` (case-sensitive)
3. Report:
   - Package name: `web`
   - File path: `packages/web/README.md`
   - Contains outdated reference: yes/no
   - If yes, provide the exact line(s) containing `acme-cli@1`
4. Keep response concise: JSON format with keys: `package`, `path`, `found`, `lines`

---

## Dispatch 6: Worker Package Scanner

**Agent Type**: Haiku  
**Task Name**: worker-readme-scan  
**Package**: worker

**Instructions**:
1. Read the file `/tmp/ab-agent-swarm/ws-14/packages/worker/README.md`
2. Search for the literal string `acme-cli@1` (case-sensitive)
3. Report:
   - Package name: `worker`
   - File path: `packages/worker/README.md`
   - Contains outdated reference: yes/no
   - If yes, provide the exact line(s) containing `acme-cli@1`
4. Keep response concise: JSON format with keys: `package`, `path`, `found`, `lines`

---

## Orchestrator Verification Phase

**After all 6 agents report:**

The orchestrator (Opus, this session) will:

1. Collect all 6 results
2. For each package reporting `found: true`, re-read the actual README.md file and verify the finding
3. Verify that the string `acme-cli@1` exists exactly as reported
4. Compile final list of packages with outdated references
5. Write aggregated findings to `/tmp/ab-agent-swarm/ws-14/findings.json`

**Verification criteria:**
- Finding is valid only if orchestrator's re-read confirms the exact string exists in the file
- Report must include: package name, file path, and the exact line containing the outdated reference
- Compliant packages (no `acme-cli@1` found) are listed separately

---

## Execution Sequence

1. **Initiate**: Dispatch all 6 agents in parallel
2. **Wait**: Collect responses from all agents (target time: single pass per agent, <1 minute)
3. **Verify**: Orchestrator re-verifies each positive finding (sequential)
4. **Aggregate**: Compile final list
5. **Report**: Write findings.json and provide summary

## Success Criteria

- All 6 agents complete successfully
- Orchestrator verification confirms findings with 100% accuracy
- Final list is deterministic and replicable
- No false positives in the final report
