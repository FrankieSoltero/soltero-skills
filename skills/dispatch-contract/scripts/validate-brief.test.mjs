import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateBrief, TIERS } from './validate-brief.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'validate-brief.mjs');
const fixtures = path.resolve(here, '../../../tests/scenarios/dispatch-contract/fixtures');
const template = path.resolve(here, '../references/brief-template.md');
const goodPath = path.join(fixtures, 'good-brief.md');
const good = readFileSync(goodPath, 'utf8');

const codes = (r) => [...r.errors.map((e) => e.code), ...r.warnings.map((w) => w.code)];
const errorCodes = (r) => r.errors.map((e) => e.code);

// Replace one "## Heading ... " section's body, or drop the section entirely.
function replaceSection(text, heading, body) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  assert.notEqual(start, -1, `fixture has no "## ${heading}" section`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) { end = i; break; }
  }
  const replacement = body === null ? [] : [lines[start], ...body.split('\n')];
  return [...lines.slice(0, start), ...replacement, ...lines.slice(end)].join('\n');
}

test('the canonical fixture brief is valid, with no warnings', () => {
  const r = validateBrief(good);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test('the shipped template stays valid as briefs are copied from it', () => {
  const md = readFileSync(template, 'utf8');
  const block = md.split('```markdown')[1].split('\n```')[0];
  const r = validateBrief(block);
  assert.deepEqual(errorCodes(r), []);
});

test('each required section is required', () => {
  for (const [heading, code] of [
    ['Objective', 'MISSING_SECTION'],
    ['Inputs', 'MISSING_SECTION'],
    ['Tools', 'MISSING_SECTION'],
    ['Return schema', 'MISSING_SECTION'],
    ['Validation conditions', 'MISSING_SECTION'],
  ]) {
    const r = validateBrief(replaceSection(good, heading, null));
    assert.ok(errorCodes(r).includes(code), `dropping ${heading} should error`);
  }
});

test('a missing model is an error — dispatched work never inherits the session model', () => {
  const r = validateBrief(replaceSection(good, 'Model', null));
  assert.ok(errorCodes(r).includes('MODEL_NOT_PINNED'));
});

test('every standard tier is accepted', () => {
  for (const tier of TIERS) {
    const r = validateBrief(replaceSection(good, 'Model', tier));
    assert.deepEqual(errorCodes(r), [], `${tier} should be accepted`);
  }
});

test('the orchestration tier is rejected outright', () => {
  const r = validateBrief(replaceSection(good, 'Model', 'fable'));
  assert.ok(errorCodes(r).includes('MODEL_ORCHESTRATION_TIER'));
});

test('a non-tier model, or two tiers at once, is rejected', () => {
  assert.ok(errorCodes(validateBrief(replaceSection(good, 'Model', 'gpt-9-turbo')))
    .includes('MODEL_NOT_PINNED'));
  assert.ok(errorCodes(validateBrief(replaceSection(good, 'Model', 'sonnet or opus, whichever')))
    .includes('MODEL_AMBIGUOUS'));
});

test('an inline "Model: <tier>" field counts as a pin', () => {
  const inline = replaceSection(good, 'Model', null).replace('## Objective', '**Model:** haiku\n\n## Objective');
  assert.deepEqual(errorCodes(validateBrief(inline)), []);
});

test('a hedged model tier warns even when a tier is present', () => {
  const r = validateBrief(replaceSection(good, 'Model', 'sonnet (or just inherit the session model)'));
  assert.deepEqual(errorCodes(r), []);
  assert.ok(codes(r).includes('MODEL_HEDGED'));
});

test('pasted file contents under Inputs are rejected three ways', () => {
  const fenced = replaceSection(good, 'Inputs', '- src/webhooks.js\n\n```js\nexport function handle() {}\n```');
  assert.ok(errorCodes(validateBrief(fenced)).includes('INPUT_PASTED_CONTENT'), 'fenced block');

  const long = replaceSection(good, 'Inputs', `- src/webhooks.js — ${'x'.repeat(220)}`);
  assert.ok(errorCodes(validateBrief(long)).includes('INPUT_PASTED_CONTENT'), 'over-long line');

  const many = replaceSection(good, 'Inputs', Array.from({ length: 30 }, (_, i) => `- src/mod${i}.js`).join('\n'));
  assert.ok(errorCodes(validateBrief(many)).includes('INPUT_PASTED_CONTENT'), 'section too long');
});

test('--max-input-lines relaxes the length ceiling for a genuinely wide brief', () => {
  const many = replaceSection(good, 'Inputs', Array.from({ length: 30 }, (_, i) => `- src/mod${i}.js`).join('\n'));
  assert.deepEqual(errorCodes(validateBrief(many, { maxInputLines: 40 })), []);
});

test('an input that names no file is rejected; a soft-wrapped one is not', () => {
  const prose = replaceSection(good, 'Inputs', '- Whatever the last agent was looking at');
  assert.ok(errorCodes(validateBrief(prose)).includes('INPUT_NOT_A_PATH'));

  const wrapped = replaceSection(good, 'Inputs',
    '- src/webhooks.js — the handler under review, plus every caller reached\n  from it that can influence the signature check');
  assert.deepEqual(errorCodes(validateBrief(wrapped)), []);
});

test('an empty inputs section is rejected', () => {
  assert.ok(errorCodes(validateBrief(replaceSection(good, 'Inputs', ''))).includes('INPUT_EMPTY'));
});

test('an empty tool allowlist errors; an unrestricted one warns', () => {
  assert.ok(errorCodes(validateBrief(replaceSection(good, 'Tools', ''))).includes('TOOL_ALLOWLIST_EMPTY'));
  const r = validateBrief(replaceSection(good, 'Tools', 'all tools'));
  assert.deepEqual(errorCodes(r), []);
  assert.ok(codes(r).includes('TOOL_ALLOWLIST_UNRESTRICTED'));
});

test('a return schema with no status field is rejected', () => {
  const noStatus = replaceSection(good, 'Return schema', '- Findings: file:line — description\n- Evidence: the command you ran');
  assert.ok(errorCodes(validateBrief(noStatus)).includes('RETURN_NO_STATUS'));
});

test('empty return schema and empty validation conditions are rejected', () => {
  assert.ok(errorCodes(validateBrief(replaceSection(good, 'Return schema', ''))).includes('RETURN_SCHEMA_EMPTY'));
  assert.ok(errorCodes(validateBrief(replaceSection(good, 'Validation conditions', '')))
    .includes('VALIDATION_CONDITIONS_EMPTY'));
});

test('the autonomy and claim-audit lines are required in the brief itself', () => {
  const noStanding = replaceSection(good, 'Standing rules', null);
  const c = errorCodes(validateBrief(noStanding));
  assert.ok(c.includes('AUTONOMY_LINE_MISSING'));
  assert.ok(c.includes('CLAIM_AUDIT_LINE_MISSING'));
});

test('half the autonomy line is not the autonomy line', () => {
  const halved = good.replace(
    'Before ending your turn, check your last paragraph — if it is a plan, a question,\nor a promise about work you have not done, do that work now instead.',
    'Use your judgement about when to stop.');
  assert.ok(errorCodes(validateBrief(halved)).includes('AUTONOMY_LINE_MISSING'));
});

test('a brief that never bounds raw output warns but does not block', () => {
  const noBoundary = good.replace(
    'Raw stdout, logs and stack traces stay with you — name a log\'s path, do not paste it.', '');
  const r = validateBrief(noBoundary);
  assert.deepEqual(errorCodes(r), []);
  assert.ok(codes(r).includes('RAW_OUTPUT_RULE_MISSING'));
});

test('common heading spellings are recognized', () => {
  for (const [from, to] of [
    ['## Return schema', '## Returns'],
    ['## Model', '## Model tier'],
    ['## Inputs', '## Input'],
    ['## Validation conditions', '## Conditions this will be checked against'],
  ]) {
    assert.deepEqual(errorCodes(validateBrief(good.replace(from, to))), [], `${to} should be recognized`);
  }
});

test('headings are matched at any level and case', () => {
  const shouty = good.replace(/^## /gm, '#### ').toUpperCase();
  assert.deepEqual(errorCodes(validateBrief(shouty)), []);
});

test('a fenced code block elsewhere in the brief does not hide a heading', () => {
  const withFence = good.replace('## Inputs', '```\n## Model\nfable\n```\n\n## Inputs');
  const c = errorCodes(validateBrief(withFence));
  assert.ok(!c.includes('MODEL_ORCHESTRATION_TIER'), 'the fenced heading must not be read as the model section');
  assert.deepEqual(c, []);
});

test('CLI exits 0 on a valid brief and prints PASS', () => {
  const out = execFileSync('node', [script, goodPath], { encoding: 'utf8' });
  assert.match(out, /^PASS /m);
  assert.match(out, /1 brief\(s\) valid/);
});

test('CLI exits 1 on an invalid brief and names the codes', () => {
  try {
    execFileSync('node', [script, template], { encoding: 'utf8' });
    assert.fail('expected a non-zero exit');
  } catch (e) {
    assert.equal(e.status, 1);
    assert.match(e.stdout, /ERROR\s+MISSING_SECTION/);
  }
});

test('CLI --json reports every file with a machine-readable verdict', () => {
  let stdout;
  try {
    stdout = execFileSync('node', [script, '--json', goodPath, template], { encoding: 'utf8' });
  } catch (e) { stdout = e.stdout; }
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.results.length, 2);
  assert.equal(parsed.results[0].ok, true);
  assert.equal(parsed.results[1].ok, false);
});

test('CLI exits 2 on usage and IO errors', () => {
  for (const args of [[], [path.join(fixtures, 'nope.md')], ['--bogus', goodPath]]) {
    try {
      execFileSync('node', [script, ...args], { encoding: 'utf8', stdio: 'pipe' });
      assert.fail(`expected a non-zero exit for ${JSON.stringify(args)}`);
    } catch (e) {
      assert.equal(e.status, 2, `args ${JSON.stringify(args)}`);
    }
  }
});
