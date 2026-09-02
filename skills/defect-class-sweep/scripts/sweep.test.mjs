import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  DEFAULT_EXCLUDES, globToRegExp, listFiles, loadRule, parseArgs, sweep, validateRule,
  formatText,
} from './sweep.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(here, '../../../tests/scenarios/defect-class-sweep/fixtures');
const rulePath = path.join(fixtures, 'utc-date-shift.rule.json');
const rule = loadRule(rulePath);
const cases = path.join(fixtures, 'sweep-cases');
const scheduler = path.join(fixtures, 'acme-scheduler');
const cli = path.join(here, 'sweep.mjs');

const at = (r, file, line) => r.matches.find((m) => m.file === file && m.line === line);

// --- glob ---------------------------------------------------------------
test('globToRegExp handles **, *, ? and {a,b}', () => {
  assert.ok(globToRegExp('src/**/*.{js,ts}').test('src/a/b/c.ts'));
  assert.ok(globToRegExp('src/**/*.{js,ts}').test('src/a.js'));
  assert.ok(!globToRegExp('src/**/*.{js,ts}').test('src/a.md'));
  assert.ok(!globToRegExp('src/*.js').test('src/a/b.js'));
  assert.ok(globToRegExp('**/node_modules/**').test('a/node_modules/pkg/index.js'));
  assert.ok(globToRegExp('f?o.js').test('foo.js'));
  assert.ok(!globToRegExp('f?o.js').test('fooo.js'));
});

// `node_modules/` is gitignored, so an excluded-dir fixture cannot be committed — the tree
// is built here instead, which also proves the exclusion rather than asserting an absence
// that would hold vacuously if the fixture were missing.
function makeExcludeTree() {
  const root = mkdtempSync(path.join(tmpdir(), 'sweep-excl-'));
  for (const [rel, body] of [
    ['src/live.js', 'export const a = (o) => new Date(o.dueDate);\n'],
    ['node_modules/pkg/index.js', 'module.exports = (s) => new Date(s.startDate);\n'],
    ['dist/bundle.js', 'export const x = (o) => new Date(o.endDate);\n'],
  ]) {
    mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    writeFileSync(path.join(root, rel), body);
  }
  return root;
}

test('listFiles applies include and the default excludes', () => {
  const root = makeExcludeTree();
  try {
    const files = listFiles(root, { include: ['**/*.js'], exclude: DEFAULT_EXCLUDES });
    assert.deepEqual(files, ['src/live.js']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('sweep skips node_modules and dist even when the same defect is in them', () => {
  const root = makeExcludeTree();
  try {
    const r = sweep(root, { ...rule, include: ['**/*.js'] });
    assert.equal(r.summary.matches, 1);
    assert.equal(r.matches[0].file, 'src/live.js');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// --- rule validation ----------------------------------------------------
test('validateRule rejects a rule with no detectors (the gate, mechanically)', () => {
  const problems = validateRule({ name: 'cache-staleness', detectors: [] });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /non-empty array/);
  assert.match(problems[0], /lesson, not a class/);
});

test('validateRule rejects an unnamed rule and an invalid detector regex', () => {
  const problems = validateRule({ name: '  ', detectors: [{ id: 'x', regex: 'new Date( [' }] });
  assert.ok(problems.some((p) => /`name` must be a non-empty string/.test(p)));
  assert.ok(problems.some((p) => /not a valid regex/.test(p)));
});

test('loadRule throws with the file path on malformed JSON', () => {
  assert.throws(() => loadRule(path.join(fixtures, 'sweep-cases/src/clean.js')), /not valid JSON/);
  assert.throws(() => loadRule(path.join(fixtures, 'nope.json')), /cannot read rule file/);
});

test('the shipped rule file is valid', () => {
  assert.deepEqual(validateRule(JSON.parse(readFileSync(rulePath, 'utf8'))), []);
  assert.deepEqual(validateRule(JSON.parse(readFileSync(path.join(here, '../templates/rule.json'), 'utf8'))), []);
});

// --- detection ----------------------------------------------------------
test('reports every date-shift instance with file:line:column and detector id', () => {
  const r = sweep(cases, rule);
  const hit = at(r, 'src/allowlisted.js', 11);
  assert.ok(hit, 'expected the unannotated new Date(row.workDate) to be reported');
  assert.equal(hit.detector, 'new-date-single-arg');
  assert.equal(hit.column, 10);
  assert.equal(hit.text, 'return new Date(row.workDate);');
  assert.ok(at(r, 'src/parsed.js', 2));
  assert.equal(at(r, 'src/parsed.js', 2).detector, 'date-parse');
});

test('does not flag the correct pattern: no-arg and multi-part Date construction', () => {
  const r = sweep(cases, rule);
  assert.equal(r.matches.filter((m) => m.file === 'src/clean.js').length, 0);
});

test('allowlist markers suppress a hit on the same line and the previous line', () => {
  const r = sweep(cases, rule);
  assert.equal(at(r, 'src/allowlisted.js', 2), undefined);
  assert.equal(at(r, 'src/allowlisted.js', 7), undefined);
  const allowed = r.suppressed.filter((s) => s.file === 'src/allowlisted.js');
  assert.equal(allowed.length, 2);
  assert.equal(allowed[0].allowedBy, 'date-class:instant');
});

test('a marked-undecidable instance is deferred, not counted as an unreviewed match', () => {
  const r = sweep(cases, rule);
  assert.equal(at(r, 'src/marked.js', 3), undefined);
  assert.equal(at(r, 'src/marked.js', 8), undefined);
  assert.equal(r.deferred.length, 2);
  assert.equal(r.deferred[0].file, 'src/marked.js');
  assert.match(r.deferred[0].marker, /vendor sends both/);
});

test('triage markers are reported as an open inventory, not silently swallowed', () => {
  const r = sweep(cases, rule);
  assert.equal(r.markers.length, 2);
  assert.deepEqual(r.markers.map((m) => `${m.file}:${m.line}`), ['src/marked.js:2', 'src/marked.js:7']);
  assert.match(r.markers[0].text, /vendor sends both/);
  assert.equal(r.summary.openMarkers, 2);
});

test('skipFileWhen drops a generated file from the sweep entirely', () => {
  const r = sweep(cases, rule);
  assert.equal(r.matches.filter((m) => m.file === 'src/generated.js').length, 0);
  const noSkip = sweep(cases, { ...rule, skipFileWhen: undefined });
  assert.equal(noSkip.matches.filter((m) => m.file === 'src/generated.js').length, 1);
});

test('detector `unless` skips a single line the rule declares out of scope', () => {
  const r = sweep(cases, {
    ...rule,
    skipFileWhen: undefined,
    detectors: [{ id: 'd', regex: 'new\\s+Date\\s*\\(', unless: 'someDate' }],
  });
  assert.equal(r.matches.filter((m) => m.file === 'src/generated.js').length, 0);
  assert.ok(r.matches.some((m) => m.file === 'src/allowlisted.js'));
});

// --- whole-repo sweep over the date-shift fixture repo -------------------
test('sweeps the whole acme-scheduler fixture and finds all 17 instances', () => {
  const r = sweep(scheduler, rule);
  assert.equal(r.summary.matches, 17);
  assert.equal(r.summary.suppressed, 0);
  const byFile = {};
  for (const m of r.matches) byFile[m.file] = (byFile[m.file] ?? 0) + 1;
  assert.deepEqual(byFile, {
    'src/invoices/export.js': 2,
    'src/invoices/render.js': 3,
    'src/lib/importer.js': 2,
    'src/reports/payroll.js': 2,
    'src/reports/weekly.js': 2,
    'src/shifts/roster.js': 4,
    'src/shifts/swap.js': 2,
  });
  // The hand-fixed cutoffDate (correct pattern) and `new Date()` are not reported.
  assert.equal(at(r, 'src/reports/payroll.js', 12), undefined);
  assert.equal(at(r, 'src/lib/dates.js', 8), undefined);
});

test('the reported line for the originally-reported bug is exact', () => {
  const r = sweep(scheduler, rule);
  const due = at(r, 'src/invoices/render.js', 6);
  assert.equal(due.text, 'const due = new Date(invoice.dueDate);');
  assert.equal(due.column, 15);
});

// --- output + cli --------------------------------------------------------
test('text output carries the rule, both patterns, and file:line:column rows', () => {
  const out = formatText(sweep(cases, rule), rule);
  assert.match(out, /^sweep: utc-date-shift \(GP-003\)$/m);
  assert.match(out, /^wrong: {3}new Date\(s\)/m);
  assert.match(out, /^correct: split the string/m);
  assert.match(out, /src\/allowlisted\.js:11:10 {2}\[new-date-single-arg\]/);
  assert.match(out, /open triage markers \(2\)/);
  assert.match(out, /deferred to triage \(2\)/);
  assert.match(out, /allowlisted \(2\)/);
  assert.match(out, /\d+ files scanned, \d+ matches, 2 allowlisted, 2 deferred, 2 open markers\./);
});

test('parseArgs requires --rule and validates --format', () => {
  assert.deepEqual(parseArgs(['--rule', 'r.json', '--root', '/tmp/x', '--format', 'json']),
    { rule: 'r.json', root: '/tmp/x', format: 'json' });
  assert.throws(() => parseArgs([]), /--rule <rule.json> is required/);
  assert.throws(() => parseArgs(['--rule', 'r.json', '--format', 'yaml']), /--format must be text or json/);
  assert.throws(() => parseArgs(['--wat']), /unknown argument: --wat/);
});

const run = (args, opts = {}) => {
  try {
    const stdout = execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', ...opts });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
};

test('CLI exits 1 when the class is present, so it works as a CI check', () => {
  const r = run(['--rule', rulePath, '--root', scheduler]);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /matches \(17\)/);
});

test('CLI exits 0 on a clean tree', () => {
  const r = run(['--rule', rulePath, '--root', path.join(cases, 'src'), '--format', 'json'],
    { env: { ...process.env } });
  // src/ as root has no `src/**` paths under it, so nothing is included -> clean.
  assert.equal(r.code, 0);
  assert.equal(JSON.parse(r.stdout).summary.matches, 0);
});

test('CLI exits 2 on a bad rule file and says why', () => {
  const r = run(['--rule', path.join(fixtures, 'nope.json'), '--root', scheduler]);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /cannot read rule file/);
});

test('CLI --format json emits the machine-readable inventory', () => {
  const r = run(['--rule', rulePath, '--root', cases, '--format', 'json']);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.rule, 'utc-date-shift');
  assert.equal(parsed.principle, 'GP-003');
  assert.ok(parsed.matches.every((m) => m.file && m.line > 0 && m.column > 0 && m.detector));
  assert.equal(parsed.markers.length, 2);
});
