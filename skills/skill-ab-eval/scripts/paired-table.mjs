#!/usr/bin/env node
// paired-table.mjs — deterministic tabulator for a skill A/B efficacy eval.
//
// Input: a verdict JSON (see references/judging.md). Output: the paired table
// (tier x scenario x arm x verdict), per-tier with-vs-without deltas, judge
// disagreements, and blocking flags. Reads nothing else; writes nothing; never
// looks at the skill under evaluation.
//
//   node paired-table.mjs runs.json          # JSON result
//   node paired-table.mjs runs.json --md     # markdown report body
//
// Exit 0 = no blocking flag. Exit 1 = at least one blocking flag (the eval does
// not support a ship decision as it stands). Exit 2 = malformed input.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ARMS = new Set(['with', 'without']);
const VERDICTS = new Set(['pass', 'fail', 'unknown']);

// Every flag this script can raise is blocking: each one means the batch cannot
// carry a ship decision until it is resolved or explained in the report.
export const FLAG_CODES = [
  'CANARY_MISSING',
  'CANARY_PASSED',
  'SINGLE_TIER',
  'PAIR_INCOMPLETE',
  'NO_LIFT',
  'NO_VARIANCE',
  'JUDGE_DISAGREEMENT',
];

const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('input must be a JSON object');
  }
  if (!Array.isArray(input.runs) || input.runs.length === 0) {
    throw new Error('input.runs must be a non-empty array');
  }
  const seen = new Set();
  input.runs.forEach((r, i) => {
    for (const f of ['tier', 'scenario', 'arm', 'verdict']) {
      if (typeof r?.[f] !== 'string' || r[f] === '') {
        throw new Error(`runs[${i}]: missing or non-string "${f}"`);
      }
    }
    if (!ARMS.has(r.arm)) {
      throw new Error(`runs[${i}]: arm must be "with" or "without", got "${r.arm}"`);
    }
    if (!VERDICTS.has(r.verdict)) {
      throw new Error(`runs[${i}]: verdict must be pass|fail|unknown, got "${r.verdict}"`);
    }
    const key = `${r.tier} ${r.scenario} ${r.arm}`;
    if (seen.has(key)) {
      throw new Error(`runs[${i}]: duplicate run for ${r.tier}/${r.scenario}/${r.arm}`);
    }
    seen.add(key);
  });
}

function disagreementFor(run) {
  const dims = run.dimensions;
  if (!dims || typeof dims !== 'object') return null;
  const entries = Object.entries(dims);
  if (entries.length === 0) return null;
  const abstained = entries.filter(([, v]) => v === 'unknown').map(([k]) => k);
  if (abstained.length > 0 && run.verdict !== 'unknown') {
    return {
      dimensions: abstained,
      reason: `dimension abstained (Unknown) but the run was scored "${run.verdict}"`,
    };
  }
  const failed = entries.filter(([, v]) => v === 'fail').map(([k]) => k);
  if (failed.length > 0 && run.verdict === 'pass') {
    return { dimensions: failed, reason: 'dimension scored fail but the run was scored "pass"' };
  }
  if (run.verdict === 'fail' && entries.every(([, v]) => v === 'pass')) {
    return {
      dimensions: entries.map(([k]) => k),
      reason: 'every dimension passed but the run was scored "fail"',
    };
  }
  return null;
}

export function tabulate(input) {
  validate(input);
  const canaryScenario = input.canary?.scenario ?? null;
  const isCanary = (r) => canaryScenario !== null && r.scenario === canaryScenario;

  // The canary measures the grader, not the skill: it is excluded from the
  // efficacy math so it can never pad a delta.
  const graded = input.runs.filter((r) => !isCanary(r));
  const canaryRuns = input.runs.filter((r) => isCanary(r) && r.arm === 'without');
  const flags = [];
  const add = (code, message, extra = {}) => flags.push({ code, blocking: true, message, ...extra });

  const canary = {
    scenario: canaryScenario,
    runs: canaryRuns.map((r) => ({ tier: r.tier, verdict: r.verdict })),
    alive: false,
  };
  if (canaryScenario === null || canaryRuns.length === 0) {
    add(
      'CANARY_MISSING',
      canaryScenario === null
        ? 'No canary declared. A clean batch proves nothing without a scenario known to fail without the skill.'
        : `No without-arm run for canary scenario "${canaryScenario}" - the batch has no liveness proof.`,
    );
  } else {
    const unknown = canaryRuns.filter((r) => r.verdict === 'unknown');
    const passed = canaryRuns.filter((r) => r.verdict === 'pass');
    if (unknown.length > 0) {
      add(
        'CANARY_MISSING',
        `Canary "${canaryScenario}" returned unknown on ${unknown.map((r) => r.tier).join(', ')} - no usable liveness verdict.`,
      );
    }
    if (passed.length > 0) {
      add(
        'CANARY_PASSED',
        `Canary "${canaryScenario}" PASSED without the skill on ${passed.map((r) => r.tier).join(', ')}. The grader is not discriminating; every verdict in this batch is void.`,
        { tiers: passed.map((r) => r.tier) },
      );
    }
    canary.alive = unknown.length === 0 && passed.length === 0;
  }

  const tierNames = [...new Set(graded.map((r) => r.tier))];
  const tiers = tierNames.map((tier) => {
    const rows = graded.filter((r) => r.tier === tier);
    const arm = (a) => rows.filter((r) => r.arm === a);
    const count = (a, v) => arm(a).filter((r) => r.verdict === v).length;
    const withTotal = arm('with').length;
    const withoutTotal = arm('without').length;
    const withPass = count('with', 'pass');
    const withoutPass = count('without', 'pass');
    const withRate = pct(withPass, withTotal);
    const withoutRate = pct(withoutPass, withoutTotal);
    return {
      tier,
      withPass,
      withTotal,
      withRate,
      withoutPass,
      withoutTotal,
      withoutRate,
      deltaPP: Math.round((withRate - withoutRate) * 10) / 10,
      unknowns: count('with', 'unknown') + count('without', 'unknown'),
    };
  });

  if (tierNames.length < 2) {
    add(
      'SINGLE_TIER',
      `Only ${tierNames.length} model tier(s) measured (${tierNames.join(', ') || 'none'}). Skill benefit is a per-tier fact; one tier cannot carry a ship decision.`,
    );
  }

  const pairs = [];
  for (const tier of tierNames) {
    const scenarios = [...new Set(graded.filter((r) => r.tier === tier).map((r) => r.scenario))];
    for (const scenario of scenarios) {
      const find = (a) => graded.find((r) => r.tier === tier && r.scenario === scenario && r.arm === a);
      const w = find('with');
      const wo = find('without');
      pairs.push({ tier, scenario, with: w?.verdict ?? null, without: wo?.verdict ?? null });
      if (!w || !wo) {
        add(
          'PAIR_INCOMPLETE',
          `${tier}/${scenario}: missing the "${w ? 'without' : 'with'}" arm - an unpaired run has no delta.`,
          { tier, scenario },
        );
      }
    }
  }

  for (const t of tiers) {
    if (t.withTotal > 0 && t.withoutTotal > 0 && t.withoutPass >= t.withPass) {
      add(
        'NO_LIFT',
        `${t.tier}: without-skill ${t.withoutPass}/${t.withoutTotal} >= with-skill ${t.withPass}/${t.withTotal} (delta ${t.deltaPP}pp). The skill does not help on this tier.`,
        { tier: t.tier, deltaPP: t.deltaPP },
      );
    }
  }

  if (input.runs.every((r) => r.verdict === 'pass')) {
    add(
      'NO_VARIANCE',
      `All ${input.runs.length} runs passed, in both arms. Zero variance is the degenerate-grader signature, not a result.`,
    );
  }

  const disagreements = [];
  for (const r of input.runs) {
    const d = disagreementFor(r);
    if (d) {
      disagreements.push({ tier: r.tier, scenario: r.scenario, arm: r.arm, verdict: r.verdict, ...d });
      add(
        'JUDGE_DISAGREEMENT',
        `${r.tier}/${r.scenario}/${r.arm}: ${d.reason} [${d.dimensions.join(', ')}].`,
        { tier: r.tier, scenario: r.scenario, arm: r.arm },
      );
    }
  }

  return {
    skill: input.skill ?? null,
    date: input.date ?? null,
    judge: input.judge ?? null,
    tiers,
    pairs,
    canary,
    disagreements,
    flags,
    shipDecisionSupported: flags.length === 0,
  };
}

export function toMarkdown(result) {
  const L = [];
  L.push(`## Paired results - ${result.skill ?? '(skill unnamed)'}${result.date ? ` (${result.date})` : ''}`, '');
  L.push('| Tier | Scenario | Without skill | With skill |', '|---|---|---|---|');
  for (const p of result.pairs) {
    L.push(`| ${p.tier} | ${p.scenario} | ${p.without ?? '--'} | ${p.with ?? '--'} |`);
  }
  L.push('', '### Per-tier delta', '', '| Tier | Without | With | Delta | Unknown verdicts |', '|---|---|---|---|---|');
  for (const t of result.tiers) {
    const sign = t.deltaPP > 0 ? '+' : '';
    L.push(
      `| ${t.tier} | ${t.withoutPass}/${t.withoutTotal} (${t.withoutRate}%) | ${t.withPass}/${t.withTotal} (${t.withRate}%) | ${sign}${t.deltaPP}pp | ${t.unknowns} |`,
    );
  }
  L.push('', '### Canary', '');
  if (result.canary.scenario === null) {
    L.push('No canary declared - this batch has no liveness proof.');
  } else {
    L.push(
      `\`${result.canary.scenario}\` (without-skill arm): ` +
        result.canary.runs.map((r) => `${r.tier}=${r.verdict}`).join(', ') +
        (result.canary.alive
          ? ' - failed as designed, so the grader is proven alive for this batch.'
          : ' - did NOT fail as designed; the grader is not proven alive.'),
    );
  }
  L.push('', '### Judge disagreements', '');
  if (result.disagreements.length === 0) L.push('None.');
  else {
    for (const d of result.disagreements) {
      L.push(`- ${d.tier}/${d.scenario}/${d.arm} scored \`${d.verdict}\`: ${d.reason} [${d.dimensions.join(', ')}]`);
    }
  }
  L.push('', '### Flags', '');
  if (result.flags.length === 0) L.push('None. No blocking flag stands against a ship decision from this batch.');
  else for (const f of result.flags) L.push(`- **${f.code}** - ${f.message}`);
  return L.join('\n');
}

function main(argv) {
  const md = argv.includes('--md');
  const file = argv.filter((a) => a !== '--md')[0];
  if (!file) {
    console.error('usage: paired-table.mjs <verdicts.json> [--md]');
    return 2;
  }
  let result;
  try {
    result = tabulate(JSON.parse(readFileSync(file, 'utf8')));
  } catch (err) {
    console.error(`paired-table: ${err.message}`);
    return 2;
  }
  console.log(md ? toMarkdown(result) : JSON.stringify(result, null, 2));
  return result.flags.length === 0 ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
