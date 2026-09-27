#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// A flag followed by another flag (or by nothing) has no value. Values are
// collapsed to one line so a pasted newline cannot break the entry format.
function arg(flag) {
  const i = process.argv.indexOf(flag);
  const v = i !== -1 ? process.argv[i + 1] : undefined;
  if (v === undefined || v.startsWith('--')) return undefined;
  return v.replace(/\s*[\r\n]+\s*/g, ' ').trim();
}

const file = arg('--file') ?? 'Docs/mistakes-and-fixes.md';
const symptom = arg('--symptom');
const cause = arg('--cause');
const fix = arg('--fix');
const lesson = arg('--lesson');
const testIdea = arg('--test') ?? '(none yet)';

if (!symptom || !cause || !fix || !lesson) {
  console.error('Usage: append-lesson.mjs --symptom S --cause C --fix F --lesson L [--test T] [--file PATH]');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const entry = [
  `## ${date} — ${symptom}`,
  ``,
  `- **Symptom:** ${symptom}`,
  `- **Root cause:** ${cause}`,
  `- **Fix:** ${fix}`,
  `- **Lesson:** ${lesson}`,
  `- **Regression test:** ${testIdea}`,
  ``,
].join('\n');

mkdirSync(dirname(file), { recursive: true });
const header = '# Mistakes and Fixes\n\nA running log of bugs, root causes, fixes, and lessons.\n';
const body = existsSync(file) ? readFileSync(file, 'utf8') : header;
writeFileSync(file, body.trimEnd() + '\n\n' + entry);
console.log(`Appended lesson to ${file}`);
