# legacyFetch → httpClient Migration Swarm Plan

## Overview
Migrate 40 files calling `legacyFetch()` to the new `httpClient` API. This is a uniform rewrite: `legacyFetch(url)` → `httpClient.get(url)` with no conditional logic.

## Approach: Transform/Migrate Shape (Spec-Based Runner)

**Why this approach:**
- Previous two swarms cost more than the migration itself (300-line scripts each)
- This spec reuses the universal runner — no new script to write
- Uniform rule (one legacyFetch pattern) scales to 4 write-scopes instead of 40 writers
- Result: 1/10 the dispatch cost for the same work

## Dispatch Strategy

### Agents by Tier

| Tier | Role | Count | Unit Cost |
|------|------|-------|-----------|
| **Opus** | Code writers (4 scopes) | 4 | High |
| **Opus** | Synthesis + status | 1 | High |
| **Sonnet** | Verification panel (one lens) | 1 | Medium |
| **Total** | | **6** | |
| **Ceiling** | Hard limit | **15** | Safety buffer |

### Write Scopes (One Writer per Scope)

Files are organized by module directory — not one writer per file:

1. **account_module** (10 files): `src/account/account{1..10}.js`
   - Isolation: worktree
   - Model: opus
   - Rule: Replace legacyFetch with httpClient.get()

2. **cart_module** (10 files): `src/cart/cart{1..10}.js`
   - Isolation: worktree
   - Model: opus
   - Rule: Replace legacyFetch with httpClient.get()

3. **catalog_module** (10 files): `src/catalog/catalog{1..10}.js`
   - Isolation: worktree
   - Model: opus
   - Rule: Replace legacyFetch with httpClient.get()

4. **checkout_module** (10 files): `src/checkout/checkout{1..10}.js`
   - Isolation: worktree
   - Model: opus
   - Rule: Replace legacyFetch with httpClient.get()

### Conflict Avoidance

- **Isolation: worktree** — Each writer gets its own git worktree, so no file conflicts
- **Serial scope model** — One writer per scope (directory)
- **No file overlap** — Each file appears in exactly one scope
- **Independent verification** — Sonnet verifies scope-by-scope

### How "Nothing's Broken" Gets Checked

1. **Per-scope verification (sonnet):** After each writer completes
   - Syntax validation: Files are valid JavaScript
   - Import check: legacyFetch import replaced, httpClient import added
   - Export check: Function signatures unchanged
   - Smoke test: `npm test` passes on the migrated code

2. **Synthesis report** (opus): Compiles status across all 4 scopes
   - Counts files migrated per scope
   - Flags any verification failures
   - Reports smoke test results
   - Outputs to `MIGRATION_STATUS.md`

## Cost Savings vs. Previous Approach

| Factor | Previous Swarms | This Run |
|--------|---|---|
| Script per purpose | Yes (300 lines) | No (spec-based runner) |
| Scout agent | Maybe | No (inline grep) |
| Writers per file | All 40 separate | 4 scopes, 10 files each |
| Verification lanes | 3 lens per finding | 1 lens (uniform rewrite) |
| Synthesis re-summarization | In orchestrator context | File-based (synth agent) |
| **Estimated agents** | ~50–60 | **6 (ceiling 15)** |
| **Estimated cost** | High | **~90% less** |

## Model Tiers (Per Corporate Standard)

- **Opus**: Code-writing lanes, synthesis (engineering tier)
- **Sonnet**: Verification/skeptic passes, triage
- **Haiku**: Would scout, but inline grep avoids scout agent entirely
- **Orchestrator (Fable)**: This session only, never dispatched

## Verification Flow

```
4 Writers (opus, worktree isolation)
    ↓
1 Verifier (sonnet, one-lens findings)
    ↓
1 Synthesis (opus, status file)
    ↓
MIGRATION_STATUS.md output
```

## Command to Validate This Plan

```bash
node ${CLAUDE_SKILL_DIR}/scripts/swarm-plan.mjs /tmp/ab-agent-swarm/ws-10/swarm/migration-legacyFetch.json
```

Expected exit: **0** (pass)
- Model pins verified (opus for writers/synthesis, sonnet for verify)
- Ceiling: 15 agents (enforced by runner)
- Items: 4 scopes (each ~10 files, not one per file)
- Write isolation: worktree per writer
- Findings verified one-lens (uniform rewrite rule)
- Synthesis output path defined

## Execution

Run via universal workflow (not a custom script):

```
Workflow({
  scriptPath: "${CLAUDE_SKILL_DIR}/workflows/swarm.mjs",
  args: {
    spec: <validated spec>,
    root: "/tmp/ab-agent-swarm/ws-10",
    date: "<date +%F>"
  }
})
```

Runner returns: `outputPath`, `summary`, `agentsSpent`, `byTier`, `dropped`

## Files Affected

**Migrating (40 files):**
- src/account/{1..10}.js
- src/cart/{1..10}.js
- src/catalog/{1..10}.js
- src/checkout/{1..10}.js

**Import changes:**
- `import { legacyFetch } from '../lib/legacyFetch.js'` → `import { httpClient } from '../lib/httpClient.js'`

**Call changes:**
- `legacyFetch(url)` → `await httpClient.get(url)`

**No changes to:**
- src/lib/legacyFetch.js (kept for now; can be removed in separate PR)
- test/smoke.test.js (continues to pass with new implementations)

## Notes

- This spec uses the universal runner from agent-swarm skill, not a new 300-line script
- Cost is enforced before dispatch by `swarm-plan.mjs`
- Reuses proven approach (spec-based dispatch) instead of ad-hoc scripting
- Isolation guarantees no file conflicts across the 4 writers
