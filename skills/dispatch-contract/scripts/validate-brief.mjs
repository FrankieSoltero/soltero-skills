#!/usr/bin/env node
// Deterministic checker for a dispatch brief (skills/dispatch-contract).
//
// Checks only what a machine can settle: are the six required sections present,
// are the inputs file references rather than pasted content, is a model pinned to
// a real tier, does the return schema name a status, and are the autonomy and
// claim-audit lines actually in the brief the worker will read. Whether the
// objective is the RIGHT objective is a judgment call and stays with the author.
//
// Usage:
//   node validate-brief.mjs briefs/01-research.md [more.md ...] [--json]
//   node validate-brief.mjs --max-input-lines=40 briefs/*.md
// Exit 0 = every brief passed (warnings may still print). Exit 1 = at least one
// error. Exit 2 = usage/IO problem.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TIERS = ['opus', 'sonnet', 'haiku'];
const ORCHESTRATION_TIER = 'fable';
const DEFAULT_MAX_INPUT_LINES = 25;
const MAX_LINE_CHARS = 200;

const SECTION_PATTERNS = [
  ['objective', /^#{1,6}\s*(?:\d+[.)]\s*)?objective\b/i],
  ['inputs', /^#{1,6}\s*(?:\d+[.)]\s*)?inputs?\b/i],
  ['tools', /^#{1,6}\s*(?:\d+[.)]\s*)?tools?\b/i],
  ['model', /^#{1,6}\s*(?:\d+[.)]\s*)?model\b/i],
  ['returns', /^#{1,6}\s*(?:\d+[.)]\s*)?returns?\b/i],
  ['validation', /^#{1,6}\s*(?:\d+[.)]\s*)?(?:validation|conditions\b|checked against)/i],
];

const AUTONOMY_RE = /nobody is watching|no one is watching|operating autonomously/i;
const NO_PROMISE_RE = /don't end on a promise|do not end on a promise|do that work now|end on a promise/i;
const CLAIM_AUDIT_RE = /trace[sd]? to a tool result|traces to a tool call|every claim (?:[^.]*?)tool (?:result|output|call)/i;
const RAW_OUTPUT_RE = /raw stdout|stack trace/i;
const UNRESTRICTED_TOOLS_RE = /\ball tools\b|\bany tool\b|\bunrestricted\b|^\s*[-*]?\s*\*\s*$/im;
const INHERIT_RE = /\binherit(?:s|ed|ing)?\b|\bsession(?:'s)? model\b|\bdefault(?:s)?\b|\bunset\b|\bwhatever\b/i;

// A token that looks like a filesystem reference: has a slash, or a dotted
// extension, optionally with a :line or :line-range suffix, or a glob.
const PATH_TOKEN_RE = /(?:^|[\s`(<[])(?:[\w.@~-]+\/[\w./*@~-]*|[\w@~-]+\.[A-Za-z][\w]{0,7}(?::\d+(?:-\d+)?)?)/;

function splitSections(lines) {
  // Returns { name: {heading, start, end, body[]} } for the first match of each
  // known section, plus `order` for reporting.
  const found = {};
  const headings = [];
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) return;
    if (!/^#{1,6}\s/.test(line)) return;
    headings.push(i);
  });
  for (let h = 0; h < headings.length; h++) {
    const start = headings[h];
    const end = h + 1 < headings.length ? headings[h + 1] : lines.length;
    for (const [name, re] of SECTION_PATTERNS) {
      if (found[name]) continue;
      if (re.test(lines[start])) {
        found[name] = { heading: lines[start].trim(), start, end, body: lines.slice(start + 1, end) };
        break;
      }
    }
  }
  return found;
}

function inlineField(text, label) {
  // Matches "Model: opus", "**Model:** opus", "- model — opus".
  const re = new RegExp(`^\\s*(?:[-*]\\s*)?\\**\\s*${label}\\s*\\**\\s*[:—-]\\s*(.+)$`, 'im');
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function bulletLines(body) {
  return body.filter((l) => l.trim() && !/^\s*(```|~~~)/.test(l));
}

// Join wrapped continuation lines onto their bullet so a soft-wrapped input
// reference is judged as one item, not two.
function listItems(body) {
  const items = [];
  for (const line of body) {
    if (!line.trim() || /^\s*(```|~~~)/.test(line)) continue;
    if (/^\s*(?:[-*+]|\d+[.)])\s/.test(line) || items.length === 0) items.push(line);
    else items[items.length - 1] += ' ' + line.trim();
  }
  return items;
}

/**
 * @param {string} text raw brief markdown
 * @param {{maxInputLines?: number}} [opts]
 * @returns {{errors: {code: string, message: string}[], warnings: {code: string, message: string}[]}}
 */
export function validateBrief(text, opts = {}) {
  const maxInputLines = opts.maxInputLines ?? DEFAULT_MAX_INPUT_LINES;
  const errors = [];
  const warnings = [];
  const err = (code, message) => errors.push({ code, message });
  const warn = (code, message) => warnings.push({ code, message });

  const lines = text.split('\n');
  const sections = splitSections(lines);

  for (const [name] of SECTION_PATTERNS) {
    if (name === 'model') continue; // model may be an inline field instead
    if (!sections[name]) {
      err('MISSING_SECTION', `no ${name} section — a brief without it is a free-text prompt`);
    }
  }

  // --- model tier ------------------------------------------------------------
  const modelText = sections.model ? sections.model.body.join('\n') : (inlineField(text, 'model') ?? '');
  const modelBlob = modelText.toLowerCase();
  const pinned = TIERS.filter((t) => new RegExp(`\\b${t}\\b`).test(modelBlob));
  if (!modelText.trim()) {
    err('MODEL_NOT_PINNED', 'no model section or "Model:" field — dispatched work must never inherit the session model');
  } else if (new RegExp(`\\b${ORCHESTRATION_TIER}\\b`).test(modelBlob)) {
    err('MODEL_ORCHESTRATION_TIER', `model is "${ORCHESTRATION_TIER}" — the orchestration tier is never assigned to dispatched work`);
  } else if (pinned.length === 0) {
    err('MODEL_NOT_PINNED', `model "${modelText.trim().split('\n')[0]}" is not one of ${TIERS.join('/')}`);
  } else if (pinned.length > 1) {
    err('MODEL_AMBIGUOUS', `model names more than one tier (${pinned.join(', ')}) — pin exactly one`);
  } else if (INHERIT_RE.test(modelBlob)) {
    warn('MODEL_HEDGED', 'the model field hedges (inherit/default/unset) alongside a tier — state one tier only');
  }

  // --- inputs are references, not pasted content -----------------------------
  if (sections.inputs) {
    const body = sections.inputs.body;
    if (body.some((l) => /^\s*(```|~~~)/.test(l))) {
      err('INPUT_PASTED_CONTENT', 'inputs section contains a fenced block — name the path, do not paste the file');
    }
    if (body.filter((l) => l.trim()).length > maxInputLines) {
      err('INPUT_PASTED_CONTENT', `inputs section is ${body.filter((l) => l.trim()).length} non-empty lines (> ${maxInputLines}) — that is content, not a reference`);
    }
    const longLine = body.find((l) => l.length > MAX_LINE_CHARS);
    if (longLine) {
      err('INPUT_PASTED_CONTENT', `inputs section has a ${longLine.length}-char line — inline a path, not a payload`);
    }
    const items = listItems(body);
    if (items.length === 0) {
      err('INPUT_EMPTY', 'inputs section is empty — name the files, or say explicitly that there are none');
    }
    for (const item of items) {
      if (!PATH_TOKEN_RE.test(item)) {
        err('INPUT_NOT_A_PATH', `input line has no file reference: ${item.trim().slice(0, 80)}`);
      }
    }
  }

  // --- tool allowlist --------------------------------------------------------
  if (sections.tools) {
    const items = bulletLines(sections.tools.body);
    if (items.length === 0) {
      err('TOOL_ALLOWLIST_EMPTY', 'tools section is empty — name the tools this subtask needs');
    } else if (UNRESTRICTED_TOOLS_RE.test(sections.tools.body.join('\n'))) {
      warn('TOOL_ALLOWLIST_UNRESTRICTED', 'tool allowlist is unrestricted — narrow it to what the subtask needs');
    }
  }

  // --- return schema ---------------------------------------------------------
  if (sections.returns) {
    const body = sections.returns.body.join('\n');
    if (!/\bstatus\b/i.test(body)) {
      err('RETURN_NO_STATUS', 'return schema names no status field — the parent has nothing to branch on');
    }
    if (bulletLines(sections.returns.body).length === 0) {
      err('RETURN_SCHEMA_EMPTY', 'return schema section is empty');
    }
  }

  // --- validation conditions -------------------------------------------------
  if (sections.validation && bulletLines(sections.validation.body).length === 0) {
    err('VALIDATION_CONDITIONS_EMPTY', 'validation-conditions section is empty — name what the parent will check the return against');
  }

  // --- standing lines --------------------------------------------------------
  if (!AUTONOMY_RE.test(text) || !NO_PROMISE_RE.test(text)) {
    err('AUTONOMY_LINE_MISSING', 'brief lacks the autonomy line (nobody is watching; do not end on a promise)');
  }
  if (!CLAIM_AUDIT_RE.test(text)) {
    err('CLAIM_AUDIT_LINE_MISSING', 'brief lacks the claim-audit line (every claim traces to a tool result)');
  }
  if (!RAW_OUTPUT_RE.test(text)) {
    warn('RAW_OUTPUT_RULE_MISSING', 'brief does not tell the worker to keep raw stdout / stack traces out of the return');
  }

  return { errors, warnings };
}

function main(argv) {
  const files = [];
  let json = false;
  let maxInputLines = DEFAULT_MAX_INPUT_LINES;
  for (const arg of argv) {
    if (arg === '--json') json = true;
    else if (arg.startsWith('--max-input-lines=')) maxInputLines = Number(arg.split('=')[1]);
    else if (arg.startsWith('-')) { console.error(`unknown option: ${arg}`); return 2; }
    else files.push(arg);
  }
  if (files.length === 0) {
    console.error('usage: validate-brief.mjs <brief.md> [...] [--json] [--max-input-lines=N]');
    return 2;
  }
  if (!Number.isFinite(maxInputLines) || maxInputLines < 1) {
    console.error('--max-input-lines must be a positive number');
    return 2;
  }

  const results = [];
  for (const file of files) {
    let text;
    try { text = readFileSync(file, 'utf8'); }
    catch (e) { console.error(`cannot read ${file}: ${e.message}`); return 2; }
    const { errors, warnings } = validateBrief(text, { maxInputLines });
    results.push({ file, ok: errors.length === 0, errors, warnings });
  }

  if (json) {
    console.log(JSON.stringify({ ok: results.every((r) => r.ok), results }, null, 2));
  } else {
    for (const r of results) {
      console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.file}`);
      for (const e of r.errors) console.log(`  ERROR   ${e.code}: ${e.message}`);
      for (const w of r.warnings) console.log(`  warning ${w.code}: ${w.message}`);
    }
    const bad = results.filter((r) => !r.ok).length;
    console.log(bad === 0
      ? `\n${results.length} brief(s) valid — dispatchable.`
      : `\n${bad} of ${results.length} brief(s) invalid — fix before dispatching.`);
  }
  return results.every((r) => r.ok) ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
