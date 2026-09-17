// Converts each run's raw agent JSONL into a readable transcript for the judges.
// Usage (from the repo root): node Docs/evals/instagram-studio-2026-09-17/build-transcripts.mjs <tasks-dir>
// The transcript shows the task as the run saw it MINUS the skill block (so a judge is not
// told the arm), then every assistant message, tool call and (truncated) tool result in order.
import fs from 'node:fs';

const tasksDir = process.argv[2];
if (!tasksDir) {
  console.error('usage: build-transcripts.mjs <tasks-dir>');
  process.exit(2);
}
const evalDir = 'Docs/evals/instagram-studio-2026-09-17';
const RUNS = {
  'sonnet-scenario-1-with': 'af1381454901a4744',
  'sonnet-scenario-1-without': 'a649ca5fd2c0bb2de',
  'sonnet-scenario-2-with': 'ac2003e9f8fcacdfb',
  'sonnet-scenario-2-without': 'af59033c65bcdbe41',
  'sonnet-scenario-3-with': 'abc4e4477b71731c2',
  'sonnet-scenario-3-without': 'a1f942c77b096174a',
  'sonnet-scenario-4-with': 'afbfaa554c6668294',
  'sonnet-scenario-4-without': 'a486048795d8fe570',
  'sonnet-canary-carousel-without': 'a5099718eac0b72a5',
  'haiku-scenario-1-with': 'a2d1542071cf5c718',
  'haiku-scenario-1-without': 'ab239eb07bad5db09',
  'haiku-scenario-2-with': 'a6277ce243fbac20a',
  'haiku-scenario-2-without': 'afdb7775ee02baf27',
  'haiku-scenario-3-with': 'a035709d65bcce2b7',
  'haiku-scenario-3-without': 'a88d86411d7b2d312',
  'haiku-scenario-4-with': 'a5fd7edbd372e7104',
  'haiku-scenario-4-without': 'aca1c18b0ce68314d',
  'haiku-canary-carousel-without': 'aa3dd1bbb3d23f334',
};
// Pass 1 clipped everything at 2500 chars, which cut the agents' own deliverables (Write
// inputs, final replies) out from under the judges — three abstained for that reason and the
// whole pass was archived. Nothing the AGENT wrote is clipped any more; only what it READ
// (tool results: skill files, fixtures, directory listings) is, and generously.
const LIMIT = 6000;
const clip = (s) => (s.length > LIMIT ? `${s.slice(0, LIMIT)}\n…[tool result truncated ${s.length - LIMIT} chars]` : s);
const asText = (c) =>
  typeof c === 'string'
    ? c
    : Array.isArray(c)
      ? c.map((x) => (x.type === 'text' ? x.text : x.type === 'image' ? '[image]' : JSON.stringify(x))).join('\n')
      : JSON.stringify(c);

const models = {};
for (const [id, agent] of Object.entries(RUNS)) {
  const prompt = fs.readFileSync(`${evalDir}/prompts/${id}.txt`, 'utf8');
  const task = prompt.slice(prompt.indexOf('You are doing a real task for a user.'));
  const lines = fs.readFileSync(`${tasksDir}/${agent}.output`, 'utf8').split('\n').filter(Boolean);
  const out = [`# Run transcript — ${id.replace(/-(with|without)$/, '')} (arm withheld)`, '', '## The task as given to the agent', '', '```text', task.trim(), '```', '', '## What the agent did, in order', ''];
  let step = 0;
  const hidden = new Set();
  for (const line of lines) {
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
      } else if (part.type === 'tool_use' && JSON.stringify(part.input).includes(`${evalDir}/prompts/`)) {
        // The run reading its own instruction file: already shown above minus the skill block.
        // Echoing it (and its result) would hand the judge the arm.
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
  fs.writeFileSync(`${evalDir}/transcripts/${id}.md`, out.join('\n'));
  console.log(id, models[id], `${step} steps`);
}
fs.writeFileSync(`${evalDir}/models.json`, `${JSON.stringify(models, null, 2)}\n`);
