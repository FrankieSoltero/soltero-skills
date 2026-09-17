// Reads the model each FINAL-PASS judge actually ran on back out of the raw agent logs (the same
// way models.json is built for the runs), so "one pinned judge model" is evidence, not assertion.
// A judge log is any task log whose first user message points at judge-prompts/R<nn>--<dim>.txt.
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/judge-models.mjs <tasks-dir> [<more-dirs>…]
import fs from 'node:fs';
import path from 'node:path';

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error('usage: judge-models.mjs <tasks-dir> [<more-dirs>…]');
  process.exit(2);
}
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : /\.(output|jsonl)$/.test(e.name) ? [p] : [];
  });
const found = {};
for (const file of dirs.flatMap(walk)) {
  const head = fs.readFileSync(file, 'utf8').slice(0, 200000);
  const m = /judge-prompts\/(R\d\d--[a-z-]+)\.txt/.exec(head.split('\n')[0] ?? '');
  if (!m) continue;
  const model = /"model":"([^"]+)"/.exec(head)?.[1] ?? 'unknown';
  (found[m[1]] ??= new Set()).add(model);
}
const jobs = Object.keys(found).sort();
const byModel = {};
for (const j of jobs) for (const mdl of found[j]) byModel[mdl] = (byModel[mdl] ?? 0) + 1;
const out = { judgeLogsFound: jobs.length, byModel, jobs: Object.fromEntries(jobs.map((j) => [j, [...found[j]]])) };
fs.writeFileSync('Docs/evals/instagram-studio-2026-09-17/judge-models.json', `${JSON.stringify(out, null, 2)}\n`);
console.log(JSON.stringify({ judgeLogsFound: out.judgeLogsFound, byModel }));
