import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  tokens,
  pathTerms,
  parseLessons,
  parseMemoryIndex,
  clusterClasses,
  rankMatches,
  recall,
  formatText,
} from './recall-lessons.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'recall-lessons.mjs');
const fixtures = path.resolve(here, '../../../tests/scenarios/lesson-recall/fixtures');
const read = (f) => readFileSync(path.join(fixtures, f), 'utf8');

const startup = read('startup-mistakes.md');
const recurring = read('startup-mistakes-recurring.md');
const lastcall = read('lastcall-mistakes.md');
const memory = read('MEMORY.md');

const S1 = {
  task: 'schedule screen shows every shift one calendar day earlier than what the manager saved for staff in Arizona',
  files: ['src/lib/dates.ts', 'src/screens/ScheduleScreen.tsx'],
};
const S2 = {
  task: "shift swap approval queue shows yesterday's date to the manager",
  files: ['src/features/swaps/ApprovalQueue.tsx'],
};
const S3 = {
  task: 'after an admin deletes an org the org switcher keeps listing it until a hard reload; stale cached list',
  files: ['app/api/orgs/[id]/route.ts', 'app/(admin)/components/OrgSwitcher.tsx'],
};

test('tokens drops stopwords, short tokens, and bare numbers', () => {
  const t = tokens('The bug in the schedule screen was 42 days off for Arizona staff');
  assert.ok(t.includes('schedule'));
  assert.ok(t.includes('arizona'));
  assert.ok(!t.includes('the'));
  assert.ok(!t.includes('bug'), 'generic engineering words carry no signal');
  assert.ok(!t.includes('42'));
  assert.ok(!t.includes('in'));
});

test('pathTerms extracts directory and basename terms from file paths', () => {
  const t = pathTerms(['src/features/swaps/ApprovalQueue.tsx']);
  assert.ok(t.includes('approvalqueue'));
  assert.ok(t.includes('swaps'));
  assert.ok(t.includes('features'));
});

test('parseLessons reads the capture-lesson entry format', () => {
  const entries = parseLessons(startup);
  assert.equal(entries.length, 8);
  const e = entries.find((x) => x.date === '2026-06-02');
  assert.equal(e.title, 'Shift dates rendered one day earlier for staff west of UTC');
  assert.match(e.fields.cause, /parses a bare ISO date as midnight UTC/);
  assert.match(e.fields.fix, /local calendar dates/);
  assert.match(e.fields.lesson, /Never feed a bare/);
  assert.equal(e.fields.test, '`src/lib/__tests__/dates.test.ts` — asserts a bare date string renders the same day at UTC-7.');
  assert.equal(e.source, 'lessons');
});

test('parseLessons is tolerant of an empty or headerless file', () => {
  assert.deepEqual(parseLessons(''), []);
  assert.deepEqual(parseLessons('# Mistakes and Fixes\n\nnothing here yet\n'), []);
});

test('parseMemoryIndex reads the auto-memory index format', () => {
  const entries = parseMemoryIndex(memory);
  assert.equal(entries.length, 4);
  assert.equal(entries[0].title, 'Calendar days are strings');
  assert.equal(entries[0].target, 'calendar-days-are-strings.md');
  assert.match(entries[0].fields.note, /YYYY-MM-DD/);
  assert.equal(entries[0].source, 'memory');
});

test('rankMatches puts the matching lesson first and scores noise near zero', () => {
  const ranked = rankMatches(parseLessons(startup), S1);
  assert.equal(ranked[0].entry.date, '2026-06-02');
  assert.ok(ranked[0].score > 0.4, `expected a strong top score, got ${ranked[0].score}`);
  const pool = ranked.find((r) => r.entry.title.includes('connection pool'));
  assert.ok(pool.score < 0.12, `unrelated entry should fall under the floor, got ${pool.score}`);
});

test('clusterClasses groups repeat occurrences of one bug class', () => {
  const groups = clusterClasses(parseLessons(recurring));
  const dateClass = groups.find((g) => g.some((e) => e.date === '2026-08-21'));
  assert.deepEqual(
    dateClass.map((e) => e.date).sort(),
    ['2026-05-02', '2026-06-02', '2026-06-25', '2026-07-08', '2026-08-21']
  );
  assert.ok(groups.some((g) => g.length === 1), 'unrelated entries stay in their own class');
});

test('recall (scenario 1) surfaces the matching lessons, the memory entry, and a below-threshold count', () => {
  const r = recall({ lessonsText: startup, memoryText: memory, ...S1 });
  assert.equal(r.silent, false);
  assert.equal(r.scanned.lessons, 8);
  assert.equal(r.scanned.memory, 4);
  assert.equal(r.matches[0].date, '2026-06-02');
  assert.match(r.matches[0].fix, /local calendar dates/);
  assert.ok(r.matches[0].matchedTerms.includes('arizona'));
  assert.equal(r.matches[0].recurrence.occurrences, 2);
  assert.equal(r.handoffRequired, false, 'two occurrences is under the compile threshold');
  assert.ok(r.matches.some((m) => m.source === 'memory' && m.title === 'Calendar days are strings'));
  assert.ok(r.confidence.top1 > r.confidence.top2);
});

test('recall (scenario 2) counts the class and demands the correction-compiler handoff', () => {
  const r = recall({ lessonsText: recurring, ...S2 });
  assert.equal(r.matches[0].date, '2026-08-21');
  assert.equal(r.matches[0].recurrence.occurrences, 5);
  assert.equal(r.handoffRequired, true);
  assert.equal(r.handoffClasses.length, 1);
  assert.deepEqual(r.handoffClasses[0].dates, [
    '2026-05-02',
    '2026-06-02',
    '2026-06-25',
    '2026-07-08',
    '2026-08-21',
  ]);
  assert.match(formatText(r), /HANDOFF REQUIRED — class recurred 5x/);
  assert.match(formatText(r), /correction-compiler/);
});

test('recall (scenario 3) flags the later entry that supersedes a matched fix', () => {
  const r = recall({ lessonsText: lastcall, memoryText: memory, ...S3 });
  assert.equal(r.matches[0].date, '2026-04-30');
  assert.match(r.matches[0].fix, /revalidateTag/);
  assert.deepEqual(
    r.matches[0].supersededBy.map((s) => s.date),
    ['2026-07-02'],
    'only the entry sharing a distinctive fix term counts as a supersession'
  );
  assert.match(formatText(r), /possibly superseded by 2026-07-02/);
});

test('same-class repeats are recurrences, not supersessions', () => {
  const r = recall({ lessonsText: recurring, ...S2 });
  assert.deepEqual(r.matches[0].supersededBy, []);
});

test('recall stays silent when nothing clears the floor', () => {
  const r = recall({
    lessonsText: lastcall,
    task: 'add a dark mode toggle to the settings sheet with a persisted preference',
  });
  assert.equal(r.silent, true);
  assert.deepEqual(r.matches, []);
  assert.match(formatText(r), /No prior lesson clears the confidence floor/);
});

test('a single shared term is not a match', () => {
  const r = recall({
    lessonsText: startup,
    task: 'notification badge styling',
    minTerms: 2,
  });
  for (const m of r.matches) assert.ok(m.matchedTerms.length >= 2);
});

test('an absent lesson store yields silence, not an error', () => {
  const r = recall({ lessonsText: '', memoryText: '', ...S1 });
  assert.equal(r.silent, true);
  assert.equal(r.scanned.lessons, 0);
  assert.equal(r.handoffRequired, false);
});

test('CLI: --task is required, a missing lesson store is not an error', () => {
  const noTask = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(noTask.status, 2);
  assert.match(noTask.stderr, /usage: recall-lessons\.mjs/);

  const missing = spawnSync(
    process.execPath,
    [script, '--task', 'anything', '--lessons', path.join(fixtures, 'does-not-exist.md')],
    { encoding: 'utf8' }
  );
  assert.equal(missing.status, 0);
  assert.match(missing.stderr, /nothing to recall/);
});

test('CLI: --json emits the machine-readable recall result', () => {
  const run = spawnSync(
    process.execPath,
    [
      script,
      '--task',
      S2.task,
      '--files',
      S2.files.join(','),
      '--lessons',
      path.join(fixtures, 'startup-mistakes-recurring.md'),
      '--json',
    ],
    { encoding: 'utf8' }
  );
  assert.equal(run.status, 0);
  const parsed = JSON.parse(run.stdout);
  assert.equal(parsed.handoffRequired, true);
  assert.equal(parsed.matches[0].recurrence.occurrences, 5);
});

test('the lesson store is never written by a recall run', () => {
  const before = readFileSync(path.join(fixtures, 'startup-mistakes-recurring.md'), 'utf8');
  spawnSync(
    process.execPath,
    [script, '--task', S2.task, '--lessons', path.join(fixtures, 'startup-mistakes-recurring.md')],
    { encoding: 'utf8' }
  );
  assert.equal(readFileSync(path.join(fixtures, 'startup-mistakes-recurring.md'), 'utf8'), before);
});
