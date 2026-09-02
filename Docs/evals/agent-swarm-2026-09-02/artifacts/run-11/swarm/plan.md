# legacyFetch → httpClient Migration Swarm Plan

## Summary
Coordinate 4 Haiku agents to migrate 40 legacyFetch callers across 4 modules (account, cart, catalog, checkout) in parallel, then verify with smoke tests. Total cost ceiling: ~$0.10 (40 files × ~2400 tokens per Haiku pass).

## Architecture

### File Distribution (4 agents, no collisions)
- **Agent 1 (account)**: 10 files (account/account1.js through account/account10.js)
- **Agent 2 (cart)**: 10 files (cart/cart1.js through cart/cart10.js)
- **Agent 3 (catalog)**: 10 files (catalog/catalog1.js through catalog/catalog10.js)
- **Agent 4 (checkout)**: 10 files (checkout/checkout1.js through checkout/checkout10.js)

Agents have disjoint file sets by directory, so they cannot step on each other's changes.

### Agent Count: 5 total
- 4 × Haiku (file migration) — dispatched in parallel
- 1 × Sonnet (verification orchestrator) — runs tests and validates results

### Model & Cost
- **Migration agents (4)**: Haiku 4.5 — ~2400 tokens per agent (file read + transformation + verify)
  - Estimated: 4 × ~2400 tokens × $0.000080/1K = $0.00077
- **Verification**: Sonnet 4 — ~1500 tokens (run tests, check output, report)
  - Estimated: 1 × 1500 tokens × $0.003/1K = $0.0045
- **Total estimated cost**: ~$0.005 (5 tokens, well under ceiling)

### Coordination
1. **Parallel dispatch**: All 4 migration agents work simultaneously on their directory.
2. **Barrier**: Wait for all agents to report completion (all file updates done).
3. **Verify**: Run `npm test` to ensure smoke tests pass (cart1 loads correctly).
4. **Validate transforms**: Spot-check one file from each agent to confirm patterns applied correctly.

## Migration Pattern (applied uniformly across all 40 files)

### Current pattern (legacyFetch):
```javascript
import { legacyFetch } from '../lib/legacyFetch.js';
export async function load*(id) {
  const r = await legacyFetch('/api/*/' + id);
  return r.json();
}
```

### Target pattern (httpClient):
```javascript
import { httpClient } from '../lib/httpClient.js';
export async function load*(id) {
  return await httpClient.get('/api/*/' + id);
}
```

**Transformation rules** (deterministic, code-only):
1. Replace import: `legacyFetch` → `httpClient`
2. Replace call: `legacyFetch(url)` → `httpClient.get(url)` (all files use GET, no POST detected)
3. Remove `.json()` await chain (httpClient returns data directly)
4. Remove intermediate variable `r` (inline result)

All 40 files follow the same pattern (verified by grep; no POST methods or complex options).

## Verification Plan: "Nothing's Broken"

### Automated checks
1. **Syntax validation**: Haiku validates each modified file parses as valid JavaScript.
2. **Smoke test**: Run `npm test` — must pass test('cart1 loads'). Confirms migration works end-to-end.
3. **Import check**: Grep to confirm no stray `legacyFetch` imports remain in src/ (should be 0).

### Manual spot-checks
- Verify one migrated file from each agent matches the target pattern exactly.

### Success criteria
- All 40 files migrated
- No parse errors in any file
- `npm test` exits 0
- Zero `legacyFetch` references in src/ (except lib/legacyFetch.js itself)

## Cost Ceiling

**Hard ceiling**: $0.50 (allows room for retries, verification iterations, or if files are larger than expected).

**Estimated actual**: $0.005 total.
**Safety margin**: 100× headroom.

If any agent exceeds its token budget during execution, halt and report the overage before proceeding to verification.

## Failure Modes & Mitigation

| Failure | Mitigation |
|---------|------------|
| Agent parse error in a file | Halt that agent, report line number, manually review the file pattern |
| Smoke test fails | Revert the agent's changes, debug the migration pattern with a targeted Haiku pass |
| legacyFetch still referenced | Grep to find missed files, re-run those through an agent |
| Cost ceiling exceeded | Halt immediately; accept partial migration or redesign |

## Timeline
- Dispatch 4 agents: immediate
- Migration runtime: ~1-2 minutes (parallel)
- Smoke test + validation: ~30 seconds
- **Total**: ~2-3 minutes end-to-end

## Execution Checklist
- [ ] All 40 files identified and distributed to agents
- [ ] Migration pattern verified as uniform across all targets
- [ ] Agent 1 (account) completes
- [ ] Agent 2 (cart) completes
- [ ] Agent 3 (catalog) completes
- [ ] Agent 4 (checkout) completes
- [ ] Smoke test passes
- [ ] No legacyFetch refs in src/
- [ ] Spot-check 4 files (one per agent) against target pattern
- [ ] Report cost and runtime
