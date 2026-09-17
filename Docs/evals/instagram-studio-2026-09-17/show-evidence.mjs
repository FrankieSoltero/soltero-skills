// Prints every final-pass judge verdict with its evidence sentence, grouped by run (mapped back
// from the opaque ids through blind-map.json), for the report and for reading the judges
// against the transcripts.
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/show-evidence.mjs [fail|pass|unknown] [--md]
import fs from 'node:fs';

const base = 'Docs/evals/instagram-studio-2026-09-17';
const dir = `${base}/verdicts`;
const only = ['fail', 'pass', 'unknown'].includes(process.argv[2]) ? process.argv[2] : null;
const md = process.argv.includes('--md');
const blind = JSON.parse(fs.readFileSync(`${base}/blind-map.json`, 'utf8'));
const nameOf = Object.fromEntries(Object.entries(blind).map(([id, code]) => [code, id]));
const rows = fs.readdirSync(dir).map((file) => {
  const [code, dim] = file.replace(/\.json$/, '').split('--');
  return { run: `${nameOf[code]} (${code})`, dim, file };
});
rows.sort((x, y) => `${x.run} ${x.dim}`.localeCompare(`${y.run} ${y.dim}`));
let lastRun = '';
for (const { run, dim, file } of rows) {
  const v = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf8'));
  if (only && v.verdict !== only) continue;
  if (run !== lastRun) {
    console.log(md ? `\n### ${run}\n` : `\n== ${run}`);
    lastRun = run;
  }
  const evidence = String(v.evidence).replace(/\s+/g, ' ').trim();
  console.log(md ? `- **${dim}: ${v.verdict}** — ${evidence}` : `  ${dim}: ${v.verdict} — ${evidence.slice(0, 380)}`);
}
