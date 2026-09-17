// Prints every judge verdict with its evidence sentence, grouped by run, for the report and
// for reading the judges against the transcripts.
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/show-evidence.mjs [fail|pass|unknown] [--md]
import fs from 'node:fs';

const dir = 'Docs/evals/instagram-studio-2026-09-17/verdicts';
const only = ['fail', 'pass', 'unknown'].includes(process.argv[2]) ? process.argv[2] : null;
const md = process.argv.includes('--md');
let lastRun = '';
for (const file of fs.readdirSync(dir).sort()) {
  const [run, dim] = file.replace(/\.json$/, '').split('--');
  const v = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf8'));
  if (only && v.verdict !== only) continue;
  if (run !== lastRun) {
    console.log(md ? `\n### ${run}\n` : `\n== ${run}`);
    lastRun = run;
  }
  const evidence = String(v.evidence).replace(/\s+/g, ' ').trim();
  console.log(md ? `- **${dim}: ${v.verdict}** — ${evidence}` : `  ${dim}: ${v.verdict} — ${evidence.slice(0, 380)}`);
}
