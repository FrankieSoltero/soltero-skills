// Lists every (run, dimension) cell whose verdict differs between the archived first judging
// pass (truncated transcripts) and the final pass.
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/diff-passes.mjs
import fs from 'node:fs';

const base = 'Docs/evals/instagram-studio-2026-09-17';
const read = (dir, f) => JSON.parse(fs.readFileSync(`${base}/${dir}/${f}`, 'utf8')).verdict;
let changed = 0;
for (const f of fs.readdirSync(`${base}/verdicts`).sort()) {
  const before = read('verdicts-pass1-truncated-transcripts', f);
  const after = read('verdicts', f);
  if (before !== after) {
    changed += 1;
    console.log(`${f.replace(/\.json$/, '')}: ${before} → ${after}`);
  }
}
console.log(`${changed} cell(s) changed`);
