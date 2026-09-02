#!/usr/bin/env node
/**
 * legacyFetch → httpClient Migration Swarm Runner
 *
 * Executes the spec-based universal migration workflow.
 * This is NOT a custom script — it uses the agent-swarm universal runner.
 *
 * Usage: node run.mjs
 *
 * The spec is validated by swarm-plan.mjs before dispatch:
 *   node ${CLAUDE_SKILL_DIR}/scripts/swarm-plan.mjs swarm/migration-legacyFetch.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.join(__dirname, 'migration-legacyFetch.json');
const rootDir = path.dirname(__dirname);

// Read and parse the spec
if (!fs.existsSync(specPath)) {
  console.error(`Error: Spec file not found: ${specPath}`);
  process.exit(1);
}

let spec;
try {
  const specContent = fs.readFileSync(specPath, 'utf8');
  spec = JSON.parse(specContent);
} catch (err) {
  console.error(`Error reading spec: ${err.message}`);
  process.exit(1);
}

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

console.log('='.repeat(70));
console.log('legacyFetch → httpClient Migration Swarm');
console.log('='.repeat(70));
console.log(`\nSpec: ${specPath}`);
console.log(`Root: ${rootDir}`);
console.log(`Date: ${today}`);
console.log(`Ceiling: ${spec.ceiling.agents} agents`);
console.log(`Items: ${spec.items.length} write-scopes`);
console.log(`Model: ${spec.model} (writers), ${spec.verify.model} (verifier), ${spec.synth.model} (synthesis)\n`);

// This would be invoked via the Workflow() tool in Claude Code:
//
// Workflow({
//   scriptPath: "${CLAUDE_SKILL_DIR}/workflows/swarm.mjs",
//   args: {
//     spec: spec,
//     root: rootDir,
//     date: today
//   }
// })
//
// The runner returns: { outputPath, summary, agentsSpent, byTier, dropped }

console.log('WORKFLOW INVOCATION (to be run in Claude Code):');
console.log(`\nWorkflow({\n  scriptPath: "\${CLAUDE_SKILL_DIR}/workflows/swarm.mjs",\n  args: {\n    spec: ${JSON.stringify(spec, null, 2).split('\n').map((l, i) => i === 0 ? l : '    ' + l).join('\n')},\n    root: "${rootDir}",\n    date: "${today}"\n  }\n})`);

console.log('\n' + '='.repeat(70));
console.log('To validate this spec before dispatch, run:');
console.log(`  node ${process.env.CLAUDE_SKILL_DIR || '$CLAUDE_SKILL_DIR'}/scripts/swarm-plan.mjs ${specPath}`);
console.log('='.repeat(70));
