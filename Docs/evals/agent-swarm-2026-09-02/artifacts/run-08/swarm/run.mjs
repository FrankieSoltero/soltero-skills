import fs from 'fs';
import path from 'path';

// Load the swarm spec
const specPath = path.resolve(process.cwd(), '.soltero/swarm/pii-audit.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

// Invoke the universal swarm runner through the Workflow tool
export const meta = {
  description: 'PII exposure audit swarm - finds every API response returning unredacted customer PII',
  effort: 'medium',
  timeout: 3600000 // 60 minutes
};

export default async function run() {
  log('Starting PII audit swarm...');
  log(`Spec: ${specPath}`);
  log(`Ceiling: ${spec.ceiling.agents} agents, ${spec.ceiling.units} units`);
  log(`Lanes: ${spec.lanes.length} (routes, services, jobs, utils)`);
  log(`Total items: ${spec.lanes.reduce((sum, lane) => sum + lane.items.length, 0)}`);

  // Execute the swarm through the universal runner
  // The runner handles all orchestration: scout, parallel lanes, verification, synthesis
  const result = await Workflow({
    scriptPath: `${process.env.CLAUDE_SKILL_DIR}/workflows/swarm.mjs`,
    args: {
      spec: spec,
      root: process.cwd(),
      date: today
    }
  });

  // Report results
  log('Swarm execution complete');
  log(`Agents spent: ${result.agentsSpent} of ${spec.ceiling.agents}`);
  log(`By tier: opus=${result.byTier.opus}, sonnet=${result.byTier.sonnet}, haiku=${result.byTier.haiku}`);

  if (result.dropped.length > 0) {
    log(`WARNING: ${result.dropped.length} dispatches dropped past ceiling`);
    log(`Dropped items: ${result.dropped.join(', ')}`);
  }

  log(`Report written to: ${result.outputPath}`);
  log(`Summary: ${result.summary}`);

  return result;
}
