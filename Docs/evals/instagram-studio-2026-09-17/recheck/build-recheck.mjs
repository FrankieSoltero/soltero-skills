// Builds blinded transcripts (X1, X2) and judge prompts for the two post-repair haiku re-check
// runs. Same transcript rendering rules as ../build-transcripts.mjs (nothing the agent wrote is
// clipped; tool results clipped at 6000; the run's own instruction-file read hidden; run ids
// redacted). Judge prompts are the final-pass prompts with only the two paths substituted, so the
// rubric text is byte-identical to the main eval's.
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/recheck/build-recheck.mjs <tasks-dir>
import fs from 'node:fs';

const tasksDir = process.argv[2];
if (!tasksDir) {
  console.error('usage: build-recheck.mjs <tasks-dir>');
  process.exit(2);
}
const evalDir = 'Docs/evals/instagram-studio-2026-09-17';
const dir = `${evalDir}/recheck`;
const RUNS = {
  'haiku-scenario-3-with-recheck': { agent: 'ab33c438caf54511f', code: 'X2' },
  'haiku-scenario-4-with-recheck': { agent: 'ae8b7243f066c8b29', code: 'X1' },
};
const DIMS = ['claims-traced', 'format-contract', 'gates-honoured', 'deliverable-contract'];
const LIMIT = 6000;
const clip = (s) => (s.length > LIMIT ? `${s.slice(0, LIMIT)}\n…[tool result truncated ${s.length - LIMIT} chars]` : s);
const asText = (c) =>
  typeof c === 'string'
    ? c
    : Array.isArray(c)
      ? c.map((x) => (x.type === 'text' ? x.text : x.type === 'image' ? '[image]' : JSON.stringify(x))).join('\n')
      : JSON.stringify(c);
const redact = (t) =>
  Object.keys(RUNS)
    .reduce((acc, id) => acc.split(id).join('RUN'), t)
    .replace(/scratchpad\/ab\/(?!RUN)[A-Za-z0-9-]+/g, 'scratchpad/ab/RUN');

for (const sub of ['transcripts', 'judge-prompts', 'verdicts']) fs.mkdirSync(`${dir}/${sub}`, { recursive: true });
const models = {};
for (const [id, { agent, code }] of Object.entries(RUNS)) {
  const prompt = fs.readFileSync(`${dir}/prompts/${id}.txt`, 'utf8');
  const task = prompt.slice(prompt.indexOf('You are doing a real task for a user.'));
  const out = [`# Run transcript — ${code} (tier, scenario name and arm withheld)`, '', '## The task as given to the agent', '', '```text', task.trim(), '```', '', '## What the agent did, in order', ''];
  let step = 0;
  const hidden = new Set();
  for (const line of fs.readFileSync(`${tasksDir}/${agent}.output`, 'utf8').split('\n').filter(Boolean)) {
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    const msg = o.message;
    if (!msg || !Array.isArray(msg.content)) continue;
    if (msg.model) models[id] = msg.model;
    for (const part of msg.content) {
      if (part.type === 'text' && msg.role === 'assistant' && part.text.trim()) {
        out.push(`### [${++step}] agent says`, '', part.text.trim(), '');
      } else if (part.type === 'tool_use' && JSON.stringify(part.input).includes('/prompts/')) {
        hidden.add(part.id);
      } else if (part.type === 'tool_result' && hidden.has(part.tool_use_id)) {
        continue;
      } else if (part.type === 'tool_use') {
        out.push(`### [${++step}] tool call — ${part.name}`, '', '```json', JSON.stringify(part.input, null, 1).replace(/\\n/g, '\n'), '```', '');
      } else if (part.type === 'tool_result') {
        out.push(`### [${++step}] tool result${part.is_error ? ' (ERROR)' : ''}`, '', '```text', clip(asText(part.content)), '```', '');
      }
    }
  }
  fs.writeFileSync(`${dir}/transcripts/${code}.md`, redact(out.join('\n')));
  for (const dim of DIMS) {
    const template = fs.readFileSync(`${evalDir}/judge-prompts/R01--${dim}.txt`, 'utf8');
    const swapped = template
      .split(`${evalDir}/transcripts/R01.md`)
      .join(`${dir}/transcripts/${code}.md`)
      .split(`${evalDir}/verdicts/R01--${dim}.json`)
      .join(`${dir}/verdicts/${code}--${dim}.json`);
    if (swapped === template) throw new Error(`template substitution failed for ${dim}`);
    fs.writeFileSync(`${dir}/judge-prompts/${code}--${dim}.txt`, swapped);
  }
  console.log(id, code, models[id], `${step} steps`);
}
fs.writeFileSync(`${dir}/blind-map.json`, `${JSON.stringify(Object.fromEntries(Object.entries(RUNS).map(([id, r]) => [id, r.code])), null, 2)}\n`);
fs.writeFileSync(`${dir}/models.json`, `${JSON.stringify(models, null, 2)}\n`);
