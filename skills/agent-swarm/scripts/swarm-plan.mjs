#!/usr/bin/env node
// swarm-plan.mjs — deterministic gate for a swarm spec, run BEFORE anything is dispatched.
//
// Reads a spec (see ../references/spec-format.md), checks the hard rules that keep a swarm
// from burning the usage budget on its own mechanics, and prints the agent count per tier.
//
//   node swarm-plan.mjs <spec.json> [--json]
//
// Exit 0 = dispatchable (warnings may be printed). Exit 1 = violations; the spec must change.
// Exit 2 = unreadable or malformed input.
//
// The count is an ESTIMATE: verification volume depends on how many findings the lanes return,
// so the planner assumes one finding per finder item unless verify.expectedFindings says
// otherwise, and that a quarter of findings escalate to the larger panel. `units` is a
// relative-cost figure (agents weighted by tier), not dollars — override `weights` in the
// spec if your price ratios differ. Dependency-free Node; runs anywhere.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TIERS = ['opus', 'sonnet', 'haiku'];
export const ORCHESTRATOR_TIER = 'fable';
export const DEFAULT_WEIGHTS = { opus: 5, sonnet: 1, haiku: 0.3 };
export const MAX_ROUNDS = 5;
export const SMALL_FANOUT = 3;
export const WIDE_LANE = 5;
export const WIDE_WRITE_LANE = 10;
export const ESCALATE_SHARE = 0.25;
const HIGH_EFFORT = new Set(['high', 'xhigh', 'max']);

function isPosInt(n) {
  return Number.isInteger(n) && n > 0;
}

export function planSwarm(spec) {
  const errors = [];
  const warnings = [];
  const err = (code, where, message) => errors.push({ code, where, message });
  const warn = (code, where, message) => warnings.push({ code, where, message });

  const fail = (msg) => ({
    ok: false,
    mode: null,
    counts: { total: 0, byTier: { opus: 0, sonnet: 0, haiku: 0 }, byStage: { scout: 0, lanes: 0, verify: 0, synth: 0 } },
    units: 0,
    ceiling: null,
    unitCeiling: null,
    errors: [{ code: 'SPEC_MALFORMED', where: 'spec', message: msg }],
    warnings: [],
  });

  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return fail('spec must be a JSON object');
  if (!Array.isArray(spec.lanes) || spec.lanes.length === 0) return fail('spec.lanes must be a non-empty array');
  for (const [i, lane] of spec.lanes.entries()) {
    if (!lane || typeof lane !== 'object') return fail(`spec.lanes[${i}] must be an object`);
    if (typeof lane.prompt !== 'string' || !lane.prompt.trim()) return fail(`spec.lanes[${i}].prompt must be a non-empty string`);
  }

  const weights = { ...DEFAULT_WEIGHTS, ...(spec.weights || {}) };
  const byTier = { opus: 0, sonnet: 0, haiku: 0 };
  const byStage = { scout: 0, lanes: 0, verify: 0, synth: 0 };

  // ---- model at every dispatch site -------------------------------------------------------
  const checkModel = (model, where) => {
    if (model === undefined || model === null || model === '') {
      err('MODEL_MISSING', where, `${where} names no model — an omitted model inherits the session's orchestrator tier`);
      return null;
    }
    if (model === ORCHESTRATOR_TIER || !TIERS.includes(model)) {
      err('MODEL_FORBIDDEN', where, `${where} uses "${model}" — dispatched work runs on one of ${TIERS.join('/')}, never the orchestrator tier`);
      return null;
    }
    return model;
  };
  const count = (model, stage, n) => {
    byStage[stage] += n;
    if (model && TIERS.includes(model)) byTier[model] += n;
  };

  // ---- ceiling ------------------------------------------------------------------------------
  const ceiling = spec.ceiling && isPosInt(spec.ceiling.agents) ? spec.ceiling.agents : null;
  if (ceiling === null) err('CEILING_MISSING', 'ceiling.agents', 'declare the maximum agent count this run may spend before dispatching');

  // ---- loop ---------------------------------------------------------------------------------
  let rounds = 1;
  if (spec.loop !== undefined && spec.loop !== null) {
    const mr = spec.loop.maxRounds;
    if (!isPosInt(mr) || mr > MAX_ROUNDS) {
      err('LOOP_UNCAPPED', 'loop.maxRounds', `a loop must declare maxRounds between 1 and ${MAX_ROUNDS} — loop-until-dry with no cap runs to the harness's 1000-agent backstop`);
    } else {
      rounds = mr;
    }
  }

  // ---- scout --------------------------------------------------------------------------------
  const hasScout = Boolean(spec.scout);
  if (hasScout) {
    const m = checkModel(spec.scout.model, 'scout');
    count(m, 'scout', 1);
  }

  // ---- lanes --------------------------------------------------------------------------------
  let findingItems = 0;
  let anyFindings = false;
  const writerItems = new Map();
  for (const [i, lane] of spec.lanes.entries()) {
    const where = `lanes[${i}]${lane.key ? ` (${lane.key})` : ''}`;
    const m = checkModel(lane.model, where);

    let n = 0;
    if (Array.isArray(lane.items)) n = lane.items.length;
    else if (isPosInt(lane.items)) n = lane.items;
    else if (lane.items === 'scout') {
      if (!hasScout || !isPosInt(lane.expectedItems)) {
        err('ITEMS_UNKNOWN', `${where}.items`, 'items come from the scout: the spec needs a scout AND expectedItems so the count can be bounded before dispatch');
      } else {
        n = lane.expectedItems;
      }
    } else {
      err('ITEMS_UNKNOWN', `${where}.items`, 'items must be an array, a positive integer, or "scout" (with expectedItems)');
    }

    if (n > 1 && !lane.prompt.includes('{item}')) {
      err('ITEM_PLACEHOLDER_MISSING', `${where}.prompt`, `a lane over ${n} items must put {item} in its prompt, or every agent does the same work`);
    }
    if (n > WIDE_LANE && HIGH_EFFORT.has(lane.effort)) {
      warn('EFFORT_HIGH_ON_FANOUT', `${where}.effort`, `effort "${lane.effort}" on ${n} agents — fan-out lanes are mechanical; reserve high effort for verify/judge stages`);
    }

    if (lane.schema === 'findings') {
      anyFindings = true;
      findingItems += n;
    }

    if (lane.writes) {
      if (n > WIDE_WRITE_LANE) {
        warn('WIDE_WRITE_LANE', where, `${n} writer agents — a uniform rewrite is one item per write-scope (a directory, ~10 files), not one per file; one writer per file only when each file needs its own judgment`);
      }
      if (lane.isolation !== 'worktree' && lane.serial !== true) {
        err('WRITER_UNISOLATED', where, 'a lane that writes files must declare isolation: "worktree" or serial: true — concurrent writers on one tree collide');
      }
      const items = Array.isArray(lane.items) ? lane.items : [];
      for (const item of items) {
        const prev = writerItems.get(item);
        if (prev) err('WRITER_OVERLAP', where, `${item} is written by ${prev} and ${where} — one writer per file set`);
        else writerItems.set(item, where);
      }
    }

    count(m, 'lanes', n * rounds);
  }

  // ---- verify -------------------------------------------------------------------------------
  const hasVerify = Boolean(spec.verify);
  if (anyFindings && !hasVerify) {
    err('FINDINGS_UNVERIFIED', 'verify', 'a findings lane with no verify stage reports unrefuted claims as fact — add a verify stage (1 lens is enough for low/medium)');
  }
  if (hasVerify) {
    const v = spec.verify;
    const m = checkModel(v.model, 'verify');
    const lenses = isPosInt(v.lenses) ? v.lenses : 1;
    const findings = isPosInt(v.expectedFindings) ? v.expectedFindings : findingItems * rounds;
    let n = findings * lenses;
    if (v.escalate && isPosInt(v.escalate.lenses) && v.escalate.lenses > lenses) {
      let escalated = isPosInt(v.escalate.expected) ? v.escalate.expected : Math.ceil(findings * ESCALATE_SHARE);
      // The runner escalates once per distinct finding title (pattern); repeats of a pattern get the
      // base panel. expectedPatterns bounds the escalated count when the caller knows the shape.
      if (isPosInt(v.expectedPatterns)) escalated = Math.min(escalated, v.expectedPatterns);
      n += escalated * (v.escalate.lenses - lenses);
    } else if (lenses >= 3) {
      warn('VERIFY_FLAT', 'verify.lenses', `${lenses} lenses on every finding — scale the panel by severity (escalate) so the expensive vote is spent where it changes the outcome`);
    }
    count(m, 'verify', n);
  }

  // ---- synth --------------------------------------------------------------------------------
  if (!spec.synth || typeof spec.synth.outputPath !== 'string' || !spec.synth.outputPath.trim()) {
    err('SYNTH_MISSING', 'synth', 'every swarm ends in one synthesis agent writing outputPath — results that come back as prose get re-summarized in the orchestrator context');
  } else {
    const m = checkModel(spec.synth.model, 'synth');
    count(m, 'synth', 1);
  }

  // ---- totals -------------------------------------------------------------------------------
  const total = byStage.scout + byStage.lanes + byStage.verify + byStage.synth;
  if (ceiling !== null && total > ceiling) {
    err('OVER_CEILING', 'ceiling.agents', `estimated ${total} agents > ceiling ${ceiling} (${total} > ${ceiling}) — narrow the lanes, cap the loop, or raise the ceiling deliberately`);
  }
  const units = Number(TIERS.reduce((a, t) => a + byTier[t] * weights[t], 0).toFixed(2));
  const unitCeiling = spec.ceiling && typeof spec.ceiling.units === 'number' && spec.ceiling.units > 0 ? spec.ceiling.units : null;
  if (unitCeiling !== null && units > unitCeiling) {
    err('OVER_UNITS', 'ceiling.units', `estimated ${units} relative cost units > ceiling ${unitCeiling} — fewer opus dispatches, chunk the write items, or raise the ceiling deliberately`);
  }

  let mode = 'workflow';
  if (total <= SMALL_FANOUT) {
    mode = 'agents';
    warn('SMALL_FANOUT', 'lanes', `${total} agents in total — dispatch them with the Agent tool (one typed brief each, dispatch-contract); a Workflow adds orchestration cost for nothing here`);
  }

  return {
    ok: errors.length === 0,
    mode: errors.length === 0 ? mode : null,
    counts: { total, byTier, byStage },
    units,
    ceiling,
    unitCeiling,
    errors,
    warnings,
  };
}

export function formatReport(result) {
  const lines = [];
  const { counts, ceiling } = result;
  lines.push(result.ok ? `VERDICT: DISPATCHABLE (mode: ${result.mode})` : 'VERDICT: NOT DISPATCHABLE');
  lines.push(`agents: ${counts.total}${ceiling !== null ? ` (ceiling ${ceiling})` : ' (no ceiling)'}`);
  lines.push(`by tier: opus=${counts.byTier.opus} sonnet=${counts.byTier.sonnet} haiku=${counts.byTier.haiku}`);
  lines.push(`by stage: scout=${counts.byStage.scout} lanes=${counts.byStage.lanes} verify=${counts.byStage.verify} synth=${counts.byStage.synth}`);
  lines.push(`relative cost units: ${result.units}${result.unitCeiling !== null ? ` (ceiling ${result.unitCeiling})` : ''}`);
  for (const e of result.errors) lines.push(`ERROR ${e.code} @ ${e.where}: ${e.message}`);
  for (const w of result.warnings) lines.push(`WARN  ${w.code} @ ${w.where}: ${w.message}`);
  return lines.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const path = argv.find((a) => !a.startsWith('--'));
  if (!path) {
    console.error('usage: swarm-plan.mjs <spec.json> [--json]');
    process.exit(2);
  }
  let spec;
  try {
    spec = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`cannot read spec ${path}: ${e.message}`);
    process.exit(2);
  }
  const result = planSwarm(spec);
  if (result.errors.some((e) => e.code === 'SPEC_MALFORMED')) {
    console.error(json ? JSON.stringify(result, null, 2) : formatReport(result));
    process.exit(2);
  }
  console.log(json ? JSON.stringify(result, null, 2) : formatReport(result));
  process.exit(result.ok ? 0 : 1);
}

// Compare real paths: on macOS /tmp is a symlink to /private/tmp, and fileURLToPath() returns the
// resolved path while argv[1] is whatever the caller typed — a plain string compare silently skips
// main() and exits 0, which reads as "dispatchable" to anything checking only the exit code.
const invokedDirectly = (() => {
  try { return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
})();
if (invokedDirectly) main();
