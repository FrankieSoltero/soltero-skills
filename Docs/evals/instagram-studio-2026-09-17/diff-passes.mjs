// Lists every (run, dimension) cell whose verdict differs between judging passes.
//   pass 1 — transcripts truncated by the builder (archived, keyed by run id)
//   pass 2 — full transcripts, but run id / arm readable from paths (archived, keyed by run id)
//   pass 3 — final: full transcripts, opaque ids, run ids redacted (verdicts/, keyed by R-code)
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/diff-passes.mjs
import fs from 'node:fs';

const base = 'Docs/evals/instagram-studio-2026-09-17';
const DIMS = ['claims-traced', 'format-contract', 'gates-honoured', 'deliverable-contract'];
const blind = JSON.parse(fs.readFileSync(`${base}/blind-map.json`, 'utf8'));
const read = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')).verdict : 'MISSING');
const compare = (label, a, b) => {
  let changed = 0;
  console.log(`\n${label}`);
  for (const id of Object.keys(blind).sort()) {
    for (const dim of DIMS) {
      const before = a(id, dim);
      const after = b(id, dim);
      if (before !== after) {
        changed += 1;
        console.log(`  ${id}--${dim}: ${before} → ${after}`);
      }
    }
  }
  console.log(`  ${changed} cell(s) changed`);
};
const p1 = (id, dim) => read(`${base}/verdicts-pass1-truncated-transcripts/${id}--${dim}.json`);
const p2 = (id, dim) => read(`${base}/verdicts-pass2-arm-leak/${id}--${dim}.json`);
const p3 = (id, dim) => read(`${base}/verdicts/${blind[id]}--${dim}.json`);
compare('pass 1 (truncated) → pass 2 (full, arm readable)', p1, p2);
compare('pass 2 (full, arm readable) → pass 3 (final, blinded)', p2, p3);
