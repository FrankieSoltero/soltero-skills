# Agent Dispatch Manifest: legacyFetch → httpClient Migration

Execute the following 5 agent dispatches. **Agents 1-4 must run in parallel** (they have disjoint file sets). **Agent 5 (verification) must run after all of 1-4 complete.**

---

## Agent 1: Account Module Migration
**Model:** haiku  
**Priority:** high  
**Parallelism:** can run simultaneously with agents 2, 3, 4  
**Cost estimate:** ~$0.0012

**Task:**
Migrate 10 files in src/account/ from legacyFetch to httpClient. You own these files exclusively; no other agent will touch them.

**Files:**
- src/account/account1.js
- src/account/account2.js
- src/account/account3.js
- src/account/account4.js
- src/account/account5.js
- src/account/account6.js
- src/account/account7.js
- src/account/account8.js
- src/account/account9.js
- src/account/account10.js

**Instructions:**
1. For each file, read it first
2. Apply this transformation:
   - Replace `import { legacyFetch } from '../lib/legacyFetch.js'` with `import { httpClient } from '../lib/httpClient.js'`
   - Replace `const r = await legacyFetch(url)` with `const result = await httpClient.get(url)` (or inline it directly)
   - Remove `.json()` await chain (httpClient returns data directly)
3. After each transformation, read the file again to verify it parses and contains no legacyFetch references
4. Report completion status for all 10 files

**Success criteria:**
- All 10 files successfully transformed
- Each file parses as valid JavaScript
- Zero `legacyFetch` references in any of your files

---

## Agent 2: Cart Module Migration
**Model:** haiku  
**Priority:** high  
**Parallelism:** can run simultaneously with agents 1, 3, 4  
**Cost estimate:** ~$0.0012

**Task:**
Migrate 10 files in src/cart/ from legacyFetch to httpClient. You own these files exclusively; no other agent will touch them.

**Files:**
- src/cart/cart1.js
- src/cart/cart2.js
- src/cart/cart3.js
- src/cart/cart4.js
- src/cart/cart5.js
- src/cart/cart6.js
- src/cart/cart7.js
- src/cart/cart8.js
- src/cart/cart9.js
- src/cart/cart10.js

**Instructions:**
1. For each file, read it first
2. Apply this transformation:
   - Replace `import { legacyFetch } from '../lib/legacyFetch.js'` with `import { httpClient } from '../lib/httpClient.js'`
   - Replace `const r = await legacyFetch(url)` with `const result = await httpClient.get(url)` (or inline it directly)
   - Remove `.json()` await chain (httpClient returns data directly)
3. After each transformation, read the file again to verify it parses and contains no legacyFetch references
4. Report completion status for all 10 files

**Success criteria:**
- All 10 files successfully transformed
- Each file parses as valid JavaScript
- Zero `legacyFetch` references in any of your files

---

## Agent 3: Catalog Module Migration
**Model:** haiku  
**Priority:** high  
**Parallelism:** can run simultaneously with agents 1, 2, 4  
**Cost estimate:** ~$0.0012

**Task:**
Migrate 10 files in src/catalog/ from legacyFetch to httpClient. You own these files exclusively; no other agent will touch them.

**Files:**
- src/catalog/catalog1.js
- src/catalog/catalog2.js
- src/catalog/catalog3.js
- src/catalog/catalog4.js
- src/catalog/catalog5.js
- src/catalog/catalog6.js
- src/catalog/catalog7.js
- src/catalog/catalog8.js
- src/catalog/catalog9.js
- src/catalog/catalog10.js

**Instructions:**
1. For each file, read it first
2. Apply this transformation:
   - Replace `import { legacyFetch } from '../lib/legacyFetch.js'` with `import { httpClient } from '../lib/httpClient.js'`
   - Replace `const r = await legacyFetch(url)` with `const result = await httpClient.get(url)` (or inline it directly)
   - Remove `.json()` await chain (httpClient returns data directly)
3. After each transformation, read the file again to verify it parses and contains no legacyFetch references
4. Report completion status for all 10 files

**Success criteria:**
- All 10 files successfully transformed
- Each file parses as valid JavaScript
- Zero `legacyFetch` references in any of your files

---

## Agent 4: Checkout Module Migration
**Model:** haiku  
**Priority:** high  
**Parallelism:** can run simultaneously with agents 1, 2, 3  
**Cost estimate:** ~$0.0012

**Task:**
Migrate 10 files in src/checkout/ from legacyFetch to httpClient. You own these files exclusively; no other agent will touch them.

**Files:**
- src/checkout/checkout1.js
- src/checkout/checkout2.js
- src/checkout/checkout3.js
- src/checkout/checkout4.js
- src/checkout/checkout5.js
- src/checkout/checkout6.js
- src/checkout/checkout7.js
- src/checkout/checkout8.js
- src/checkout/checkout9.js
- src/checkout/checkout10.js

**Instructions:**
1. For each file, read it first
2. Apply this transformation:
   - Replace `import { legacyFetch } from '../lib/legacyFetch.js'` with `import { httpClient } from '../lib/httpClient.js'`
   - Replace `const r = await legacyFetch(url)` with `const result = await httpClient.get(url)` (or inline it directly)
   - Remove `.json()` await chain (httpClient returns data directly)
3. After each transformation, read the file again to verify it parses and contains no legacyFetch references
4. Report completion status for all 10 files

**Success criteria:**
- All 10 files successfully transformed
- Each file parses as valid JavaScript
- Zero `legacyFetch` references in any of your files

---

## Agent 5: Verification & Synthesis
**Model:** sonnet  
**Priority:** high  
**Parallelism:** MUST RUN AFTER agents 1-4 complete  
**Cost estimate:** ~$0.0045

**Task:**
Verify that all 40 files have been successfully migrated and that nothing is broken.

**Instructions:**
1. Run `npm test` in the working directory and capture the output and exit code
2. Execute `grep -r "legacyFetch" src/ --exclude-dir=lib | grep -v "lib/legacyFetch.js"` and verify the result is empty (count should be 0)
3. Spot-check these 4 files for correctness (one from each agent's batch):
   - src/account/account1.js (Agent 1)
   - src/cart/cart1.js (Agent 2)
   - src/catalog/catalog1.js (Agent 3)
   - src/checkout/checkout1.js (Agent 4)
   
   For each, verify:
   - File contains `import { httpClient } from '../lib/httpClient.js'`
   - File contains `httpClient.get(...)` calls
   - File does NOT contain `legacyFetch`
   - File is syntactically valid JavaScript

4. Report overall status:
   - npm test: PASS/FAIL (include output)
   - legacyFetch grep: count (should be 0)
   - Spot-checks: 4 results (PASS/FAIL for each)
   - Overall: PASS if test passes AND grep returns 0 AND all 4 spot-checks pass

**Success criteria:**
- npm test exits with code 0
- grep finds 0 legacyFetch references in src/
- All 4 spot-checks pass
- Overall verdict: PASS

---

## Execution Notes

### Parallelism
- **Dispatch agents 1-4 simultaneously** (they are independent; each owns a directory)
- **Do not dispatch agent 5 until agents 1-4 report completion**

### File Safety
- Agents 1-4 have no overlapping files (disjoint by directory)
- No risk of write conflicts or collisions
- Each agent can work at its own pace

### Cost Tracking
- Agent 1-4: ~0.0012 × 4 = ~$0.0048
- Agent 5: ~$0.0045
- **Total: ~$0.009 (well under $0.50 ceiling)**

### If Any Agent Fails
- If agent 1-4 fails: halt, do not proceed to verification; manually debug the failed file
- If agent 5 fails: check test output and grep results; manually fix any issues

### Rollback
- If verification fails, all changes are in working tree (git status will show modified files)
- Run `git checkout src/` to revert all changes and investigate

---

## Summary Table

| Agent | Module | Files | Model | Status | Cost |
|-------|--------|-------|-------|--------|------|
| 1 | account | 10 | haiku | pending | $0.0012 |
| 2 | cart | 10 | haiku | pending | $0.0012 |
| 3 | catalog | 10 | haiku | pending | $0.0012 |
| 4 | checkout | 10 | haiku | pending | $0.0012 |
| 5 | verify | — | sonnet | pending (after 1-4) | $0.0045 |
| | **TOTAL** | **40** | | **pending** | **$0.0093** |
