import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseDebrief, summarize, scanFiles, toMarkdown, classifyQuote, checkRouting, ROUTING_SURFACES } from './missed-triggers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const debriefs = path.resolve(here, '../../../tests/scenarios/skill-trigger-repair/fixtures/debriefs');
const files = readdirSync(debriefs).filter((f) => f.endsWith('.md')).sort()
  .map((f) => path.join(debriefs, f));
const corpus = scanFiles(files);
const bySkill = (name) => corpus.skills.find((s) => s.skill === name);
const read = (name) => readFileSync(path.join(debriefs, name), 'utf8');

test('parses a bullet into skill, date, session and project', () => {
  const r = parseDebrief(read('2026-08-14.md'), { path: path.join(debriefs, '2026-08-14.md') });
  assert.equal(r.date, '2026-08-14');
  assert.equal(r.hasSection, true);
  assert.deepEqual(r.findings.map((f) => f.skill), ['capture-lesson', 'lean-verification']);
  assert.equal(r.findings[0].session, 'a1b2c3d4');
  assert.equal(r.findings[0].project, 'acme-api');
});

test('joins wrapped continuation lines into one bullet', () => {
  const r = parseDebrief(read('2026-08-14.md'));
  // The quote spans three source lines in the fixture; it must survive the join intact.
  assert.deepEqual(r.findings[0].userPhrasings, ["we should write this one down so it doesn't bite us again"]);
});

test('recurrence counts distinct dates, not bullets', () => {
  const cl = bySkill('capture-lesson');
  assert.deepEqual(cl.dates, ['2026-08-14', '2026-08-17', '2026-08-19']);
  assert.equal(cl.occurrences, 4); // two bullets share 2026-08-19
  assert.equal(cl.status, 'repair-candidate');
});

test('a skill at one date is logged-only, even with quoted user phrasing', () => {
  const lb = bySkill('lean-brainstorming');
  assert.deepEqual(lb.dates, ['2026-08-23']);
  assert.equal(lb.phrasingEvidence, 'user');
  assert.equal(lb.status, 'logged-only');
  assert.equal(bySkill('prisma-safety-review').status, 'logged-only');
});

test('collects every quoted user phrasing with its date and session', () => {
  assert.deepEqual(bySkill('capture-lesson').phrasings, [
    { quote: "we should write this one down so it doesn't bite us again", date: '2026-08-14', session: 'a1b2c3d4' },
    { quote: 'log that gotcha somewhere', date: '2026-08-17', session: 'b7e4f091' },
    { quote: 'add it to the mistakes file', date: '2026-08-19', session: 'c9a70f22' },
  ]);
});

test('a corpus that only quotes the description back is flagged description-only', () => {
  const lv = bySkill('lean-verification');
  assert.equal(lv.status, 'repair-candidate');
  assert.equal(lv.phrasingEvidence, 'description-only');
  assert.deepEqual(lv.phrasings, []);
  assert.deepEqual(lv.sessions, ['a1b2c3d4', 'c9a70f22']);
});

test('separates description quotes, user quotes and incidental quotes in one bullet', () => {
  const r = parseDebrief(read('2026-08-19.md'));
  const cl = r.findings.find((f) => f.skill === 'capture-lesson');
  assert.deepEqual(cl.quotes.map((q) => q.kind), ['description', 'user', 'other']);
  assert.equal(cl.quotes[2].text, 'fix(webhooks): jitter the retry window'); // a commit message
});

test('classifyQuote reads the prose immediately before the quote', () => {
  assert.equal(classifyQuote('activity at 11:48Z matches its description ('), 'description');
  assert.equal(classifyQuote('— matching '), 'description');
  assert.equal(classifyQuote('the user wrote '), 'user');
  assert.equal(classifyQuote('The user explicitly asked for an investigation ('), 'user');
  assert.equal(classifyQuote('The user proposed new functionality ('), 'user');
  assert.equal(classifyQuote('and committed (`9d21bb4` '), 'other');
});

test('a report with "None observed." is scanned and contributes nothing', () => {
  const r = parseDebrief(read('2026-08-21.md'), { path: '2026-08-21.md' });
  assert.equal(r.hasSection, true);
  assert.deepEqual(r.findings, []);
});

test('a file with no Missed triggers section is reported as skipped', () => {
  const skip = parseDebrief(read('skip-log.md'), { path: path.join(debriefs, 'skip-log.md') });
  assert.equal(skip.hasSection, false);
  assert.equal(corpus.reportsScanned, 5);
  assert.equal(corpus.reportsSkipped.length, 1);
  assert.match(corpus.reportsSkipped[0], /skip-log\.md$/);
});

test('falls back to the report heading when the path carries no date', () => {
  const r = parseDebrief(read('2026-08-23.md'));
  assert.equal(r.date, '2026-08-23');
});

test('candidates sort by distinct dates, then bullets, then name', () => {
  assert.deepEqual(corpus.skills.map((s) => s.skill),
    ['capture-lesson', 'lean-debugging', 'lean-verification', 'lean-brainstorming', 'prisma-safety-review']);
});

test('the repair bar is configurable and defaults to 2 distinct dates', () => {
  assert.equal(corpus.minDates, 2);
  const strict = summarize(files.map((f) => parseDebrief(readFileSync(f, 'utf8'), { path: f })), { minDates: 3 });
  assert.equal(strict.skills.find((s) => s.skill === 'lean-debugging').status, 'logged-only');
  assert.equal(strict.skills.find((s) => s.skill === 'capture-lesson').status, 'repair-candidate');
});

test('markdown names the bar, the candidates, and the circular-rewrite hazard', () => {
  const md = toMarkdown(corpus);
  assert.match(md, /Repair bar: a skill named on 2 or more distinct debrief dates/);
  assert.match(md, /\| `capture-lesson` \| 3 \(2026-08-14, 2026-08-17, 2026-08-19\) \| 4 \| user \| repair-candidate \|/);
  assert.match(md, /### `lean-verification` — description-only[\s\S]*rewriting the description from a quote of itself is circular/);
  assert.doesNotMatch(md, /### `prisma-safety-review`/); // below the bar: no phrasing block
});

// --- routing-surface check -------------------------------------------------
// The three surfaces from fixtures/seed-repo.sh: capture-lesson and lean-debugging
// appear only in the README table; the other three are on all three surfaces.
const surfaces = {
  'hooks/session-context.md': '- Build/add/change X → `acme:lean-brainstorming`\n'
    + '- About to claim done → `acme:lean-verification`\n'
    + '- Prisma schema/migration → `acme:prisma-safety-review`\n',
  'AGENTS.md': '- Build/add/change X → open `skills/lean-brainstorming/SKILL.md`\n'
    + '- About to claim done → open `skills/lean-verification/SKILL.md`\n'
    + '- Prisma schema/migration → open `skills/prisma-safety-review/SKILL.md`\n',
  'README.md': '| `capture-lesson` | … |\n| `lean-brainstorming` | … |\n| `lean-debugging` | … |\n'
    + '| `lean-verification` | … |\n| `prisma-safety-review` | … |\n',
};
const fakeRead = (p) => {
  const key = Object.keys(surfaces).find((k) => p.endsWith(k));
  if (!key) throw new Error(`ENOENT ${p}`);
  return surfaces[key];
};
const routed = (name) => checkRouting(scanFiles(files), '/repo', { read: fakeRead })
  .skills.find((s) => s.skill === name).routing;

test('routing check names the surfaces a skill is missing from', () => {
  assert.deepEqual(routed('capture-lesson').missing,
    ['hooks/session-context.md', 'AGENTS.md']);
  assert.equal(routed('capture-lesson').readme, true);
  assert.deepEqual(routed('lean-debugging').missing,
    ['hooks/session-context.md', 'AGENTS.md']);
});

test('routing check reports a fully routed skill as missing nothing', () => {
  const r = routed('lean-verification');
  assert.deepEqual(r.missing, []);
  assert.equal(r.sessionContext, true);
  assert.equal(r.agents, true);
});

test('a surface that does not exist is absent, not a missing routing line', () => {
  const only = (p) => { if (p.endsWith('README.md')) return surfaces['README.md']; throw new Error('ENOENT'); };
  const r = checkRouting(scanFiles(files), '/repo', { read: only })
    .skills.find((s) => s.skill === 'lean-verification').routing;
  assert.deepEqual(r.absentSurfaces, ['hooks/session-context.md', 'AGENTS.md']);
  assert.deepEqual(r.missing, []);
  assert.equal(r.sessionContext, null);
});

test('routing match is whole-name: lean-debugging does not satisfy lean-debugging-v2', () => {
  const text = { 'README.md': '| `lean-debugging-v2` | … |\n' };
  const read = (p) => { const k = Object.keys(text).find((x) => p.endsWith(x)); if (!k) throw new Error('ENOENT'); return text[k]; };
  const r = checkRouting(scanFiles(files), '/repo', { read })
    .skills.find((s) => s.skill === 'lean-debugging').routing;
  assert.equal(r.readme, false);
});

test('the three surfaces are declared in repair order', () => {
  assert.deepEqual(ROUTING_SURFACES.map((s) => s.path),
    ['hooks/session-context.md', 'AGENTS.md', 'README.md']);
});

test('markdown gains a Routing column only when routing was checked', () => {
  assert.doesNotMatch(toMarkdown(corpus), /\| Routing \|/);
  const md = toMarkdown(checkRouting(scanFiles(files), '/repo', { read: fakeRead }));
  assert.match(md, /\| Routing \|/);
  assert.match(md, /`capture-lesson`.*missing from hooks\/session-context\.md, AGENTS\.md \|/);
  assert.match(md, /`lean-verification`.*routed on every surface \|/);
});

test('an empty corpus summarizes without throwing', () => {
  const s = summarize([]);
  assert.deepEqual(s.skills, []);
  assert.equal(s.reportsScanned, 0);
});
