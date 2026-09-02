#!/usr/bin/env node
/**
 * legacyFetch → httpClient Migration Swarm
 *
 * Coordinates 4 parallel Haiku agents to migrate 40 files across 4 modules.
 * Each agent owns a directory (account, cart, catalog, checkout).
 * Verification via smoke tests and grep validation.
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const REPO_ROOT = process.cwd();
const AGENT_MODEL = 'haiku';
const VERIFY_MODEL = 'sonnet';

// Define agent batches: each agent owns a directory
const AGENT_BATCHES = [
  {
    name: 'account',
    model: AGENT_MODEL,
    files: [
      'src/account/account1.js', 'src/account/account2.js', 'src/account/account3.js',
      'src/account/account4.js', 'src/account/account5.js', 'src/account/account6.js',
      'src/account/account7.js', 'src/account/account8.js', 'src/account/account9.js',
      'src/account/account10.js',
    ],
  },
  {
    name: 'cart',
    model: AGENT_MODEL,
    files: [
      'src/cart/cart1.js', 'src/cart/cart2.js', 'src/cart/cart3.js',
      'src/cart/cart4.js', 'src/cart/cart5.js', 'src/cart/cart6.js',
      'src/cart/cart7.js', 'src/cart/cart8.js', 'src/cart/cart9.js',
      'src/cart/cart10.js',
    ],
  },
  {
    name: 'catalog',
    model: AGENT_MODEL,
    files: [
      'src/catalog/catalog1.js', 'src/catalog/catalog2.js', 'src/catalog/catalog3.js',
      'src/catalog/catalog4.js', 'src/catalog/catalog5.js', 'src/catalog/catalog6.js',
      'src/catalog/catalog7.js', 'src/catalog/catalog8.js', 'src/catalog/catalog9.js',
      'src/catalog/catalog10.js',
    ],
  },
  {
    name: 'checkout',
    model: AGENT_MODEL,
    files: [
      'src/checkout/checkout1.js', 'src/checkout/checkout2.js', 'src/checkout/checkout3.js',
      'src/checkout/checkout4.js', 'src/checkout/checkout5.js', 'src/checkout/checkout6.js',
      'src/checkout/checkout7.js', 'src/checkout/checkout8.js', 'src/checkout/checkout9.js',
      'src/checkout/checkout10.js',
    ],
  },
];

/**
 * Generate scout prompt to analyze files before migration
 */
function scoutPrompt(batch) {
  return `You are a code migration specialist. Analyze these ${batch.files.length} files that call legacyFetch().

Files to migrate (owned exclusively by you):
${batch.files.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Read each file and summarize:
1. Current pattern: how legacyFetch is called (parameters, await chains)
2. Target pattern: how it should call httpClient.get/post
3. Any special cases (POST vs GET, error handling, etc.)

All files should follow the same pattern. Report if any deviate.`;
}

/**
 * Generate transformation prompt for the agent
 */
function transformPrompt(batch) {
  return `You are a TypeScript/JavaScript refactoring agent. You must migrate ${batch.files.length} files from legacyFetch to httpClient.

Your files (exclusive to your batch):
${batch.files.map((f, i) => `${i + 1}. ${f}`).join('\n')}

**Transformation rules:**
1. Replace import statement: \`import { legacyFetch }\` → \`import { httpClient }\`
2. Replace call: \`legacyFetch(url)\` → \`httpClient.get(url)\`
3. Remove \`.json()\` await chain (httpClient returns data directly)
4. Remove intermediate variable \`r\` (inline result)
5. Validate: each file must parse as valid JavaScript after transformation

**Verify after each file:**
- Read the file again to confirm transformation was applied correctly
- Check that no \`legacyFetch\` references remain
- Check that \`httpClient.get\` is imported and used

Process each file sequentially. For each file:
1. Read it
2. Apply transformation
3. Write it back
4. Verify the result

Report completion with file-by-file status.`;
}

/**
 * Generate verification prompt
 */
function verificationPrompt() {
  return `You are a code verifier. After the legacyFetch → httpClient migration:

1. Run \`npm test\` and capture output
2. Check exit code (should be 0)
3. Grep for remaining \`legacyFetch\` references in \`src/\` (should be 0 except lib/legacyFetch.js)
4. Spot-check 4 files (one from each batch):
   - src/account/account1.js
   - src/cart/cart1.js
   - src/catalog/catalog1.js
   - src/checkout/checkout1.js
   Verify each follows the target pattern (httpClient.get, no legacyFetch)

Report:
- Test exit code and output
- grep results for legacyFetch
- Spot-check results (pass/fail for each)
- Overall: PASS if test passes, legacyFetch count is 0, and spot-checks pass; FAIL otherwise`;
}

/**
 * Main swarm orchestrator
 */
async function runSwarm() {
  console.log('🚀 legacyFetch Migration Swarm v1.0');
  console.log(`📁 Working directory: ${REPO_ROOT}`);
  console.log(`🤖 Agents: ${AGENT_BATCHES.length} Haiku (parallel) + 1 Sonnet (verify)`);
  console.log(`📦 Files to migrate: ${AGENT_BATCHES.reduce((sum, b) => sum + b.files.length, 0)}`);
  console.log('');

  const startTime = Date.now();

  // Phase 1: Scout (optional, in-series or parallel)
  console.log('📋 PHASE 1: Scout');
  console.log('(Analyzing file patterns before transformation)');
  // Agents would read files and verify uniform pattern
  console.log('✓ Scout phase would dispatch 4 agents to analyze patterns');
  console.log('');

  // Phase 2: Transform (parallel)
  console.log('🔄 PHASE 2: Transform (4 agents in parallel)');
  const agentDispatch = AGENT_BATCHES.map((batch, idx) => ({
    agent: idx + 1,
    batch: batch.name,
    fileCount: batch.files.length,
    model: batch.model,
    role: 'transform',
    prompt: transformPrompt(batch),
  }));

  agentDispatch.forEach(dispatch => {
    console.log(`  Agent ${dispatch.agent} (${dispatch.model}): ${dispatch.batch} (${dispatch.fileCount} files)`);
  });
  console.log('');

  // Phase 3: Verification (serial after all agents complete)
  console.log('✅ PHASE 3: Verify');
  console.log(`  Sonnet agent: run tests, grep, spot-check`);
  console.log(`  Prompt: ${verificationPrompt().substring(0, 80)}...`);
  console.log('');

  // Estimated timeline
  const elapsed = Date.now() - startTime;
  console.log(`📊 Execution Summary`);
  console.log(`  Total agents: 5 (4 Haiku + 1 Sonnet)`);
  console.log(`  Total files: 40 (10 per agent)`);
  console.log(`  Parallelism: 4-way (agents 1-4 work simultaneously)`);
  console.log(`  Est. runtime: 2-3 minutes (parallel transforms + serial verify)`);
  console.log(`  Est. cost: $0.005 (40 files × 2.4K tokens × Haiku rate + verify)`);
  console.log(`  Cost ceiling: $0.50`);
  console.log('');

  // Output dispatch manifest
  console.log('📝 Agent Dispatches (to be executed):');
  agentDispatch.forEach(dispatch => {
    console.log(`\n--- Agent ${dispatch.agent}: ${dispatch.batch} ---`);
    console.log(`Model: ${dispatch.model}`);
    console.log(`Files: ${dispatch.fileCount}`);
    console.log(`Prompt length: ${dispatch.prompt.length} chars`);
  });

  // Output verification dispatch
  console.log(`\n--- Agent 5: Verification ---`);
  console.log(`Model: ${VERIFY_MODEL}`);
  console.log(`Task: run tests, validate results`);
  console.log(`Prompt: ${verificationPrompt()}`);
  console.log('');

  // Success report
  console.log('✅ Swarm plan complete');
  console.log('   To execute: dispatch each agent prompt above via Claude Agent API');
  console.log('   Agents 1-4 run in parallel, Agent 5 runs after all complete');
}

// Entry point
runSwarm().catch(err => {
  console.error('❌ Swarm orchestration failed:', err.message);
  process.exit(1);
});
