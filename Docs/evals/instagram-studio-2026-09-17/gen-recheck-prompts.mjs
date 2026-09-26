// Post-eval re-check: after the skill text was repaired for the gaps this eval found, re-run
// ONLY the two haiku with-arm cells that failed (scenario 3 and scenario 4), with the current
// SKILL.md swapped into the otherwise byte-identical original prompt. This is an addendum — it
// does not replace or amend the paired table, which describes the tree named in the report.
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/gen-recheck-prompts.mjs <scratch-dir>
import fs from 'node:fs';

const scratch = process.argv[2];
if (!scratch) {
  console.error('usage: gen-recheck-prompts.mjs <scratch-dir>');
  process.exit(2);
}
const evalDir = 'Docs/evals/instagram-studio-2026-09-17';
const skillText = fs.readFileSync('skills/instagram-studio/SKILL.md', 'utf8');
fs.mkdirSync(`${evalDir}/recheck/prompts`, { recursive: true });
for (const scenario of ['scenario-3', 'scenario-4']) {
  const oldId = `haiku-${scenario}-with`;
  const newId = `haiku-${scenario}-with-recheck`;
  const original = fs.readFileSync(`${evalDir}/prompts/${oldId}.txt`, 'utf8');
  const open = original.indexOf('<skill>\n');
  const close = original.indexOf('\n</skill>');
  if (open < 0 || close < 0) throw new Error(`no skill block in ${oldId}`);
  const swapped = `${original.slice(0, open)}<skill>\n${skillText}${original.slice(close)}`
    .split(`/${oldId}`)
    .join(`/${newId}`);
  fs.writeFileSync(`${evalDir}/recheck/prompts/${newId}.txt`, swapped);
  fs.mkdirSync(`${scratch}/${newId}`, { recursive: true });
  console.log(newId, swapped.length);
}
