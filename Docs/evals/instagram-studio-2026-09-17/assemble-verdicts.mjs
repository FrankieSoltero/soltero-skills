// Rolls the per-dimension judge verdicts up into the JSON that skill-ab-eval's
// paired-table.mjs consumes. Roll-up rule (references/judging.md): all pass → pass,
// any fail → fail, otherwise (an abstention with no failure) → unknown.
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/assemble-verdicts.mjs
import fs from 'node:fs';

const evalDir = 'Docs/evals/instagram-studio-2026-09-17';
// Optional sensitivity view: `--dims claims-traced,gates-honoured --out verdicts-behaviour-only.json`
// rolls up only the named dimensions (same judge verdicts, nothing re-graded).
const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const ALL_DIMS = ['claims-traced', 'format-contract', 'gates-honoured', 'deliverable-contract'];
const DIMS = argOf('--dims') ? argOf('--dims').split(',') : ALL_DIMS;
for (const d of DIMS) if (!ALL_DIMS.includes(d)) throw new Error(`unknown dimension: ${d}`);
const OUT = argOf('--out') ?? 'verdicts.json';
const models = JSON.parse(fs.readFileSync(`${evalDir}/models.json`, 'utf8'));
const runs = [];
const missing = [];
// Judges only ever see the opaque id (R01…R18); blind-map.json maps it back to the run.
const VDIR = argOf('--verdicts') ?? 'verdicts';
const blind = JSON.parse(fs.readFileSync(`${evalDir}/blind-map.json`, 'utf8'));
for (const [id, code] of Object.entries(blind).sort(([x], [y]) => x.localeCompare(y))) {
  const file = `${code}.md`;
  const m = /^(sonnet|haiku)-(.+)-(with|without)$/.exec(id);
  if (!m) throw new Error(`unparseable run id: ${id}`);
  const [, tier, scenario, arm] = m;
  const dimensions = {};
  for (const dim of DIMS) {
    const p = `${evalDir}/${VDIR}/${code}--${dim}.json`;
    if (!fs.existsSync(p)) {
      missing.push(`${code}--${dim} (${id})`);
      continue;
    }
    const v = JSON.parse(fs.readFileSync(p, 'utf8')).verdict;
    if (!['pass', 'fail', 'unknown'].includes(v)) throw new Error(`bad verdict in ${p}: ${v}`);
    dimensions[dim] = v;
  }
  const vals = Object.values(dimensions);
  const verdict =
    vals.length !== DIMS.length
      ? 'unknown'
      : vals.includes('fail')
        ? 'fail'
        : vals.every((x) => x === 'pass')
          ? 'pass'
          : 'unknown';
  runs.push({ tier, scenario, arm, verdict, transcript: `${evalDir}/transcripts/${file}`, dimensions });
}
if (missing.length) console.error(`MISSING verdict files (${missing.length}): ${missing.join(', ')}`);
const tiers = {};
for (const [id, model] of Object.entries(models)) tiers[id.split('-')[0]] = model;
const doc = {
  skill: 'instagram-studio',
  date: '2026-09-17',
  tiers,
  judge:
    'isolated single-dimension judges, Unknown escape, one call per dimension per run, judge model alias sonnet (claude-sonnet-5), arm withheld from the transcript',
  canary: {
    scenario: 'canary-carousel',
    note: 'seeded from RED-baseline.md scenario 3: an unaided run picks a square canvas, 12 slides, word-wall slides and no facts/claims deliverable for a "readers love it" carousel',
  },
  runs,
};
fs.writeFileSync(`${evalDir}/${OUT}`, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`${runs.length} runs, ${missing.length} missing dimension verdicts → ${evalDir}/${OUT}`);
process.exit(missing.length ? 1 : 0);
