#!/usr/bin/env node
// destructive-op-gate: compare what a dry run predicted against what actually happened,
// and mint the idempotency key for the call. FAIL-CLOSED: MISMATCH and INDETERMINATE both
// exit non-zero, and "I could not extract a number" is INDETERMINATE, never MATCH.
//
// Usage:
//   node compare-counts.mjs --expected 131 --actual 215
//   node compare-counts.mjs --expected-file dryrun.txt --actual-file result.txt
//   node compare-counts.mjs --expected-ids enumerated.txt --actual-file dryrun.txt --op purge
//   node compare-counts.mjs --expected-ids enumerated.txt --actual-ids live.txt
//   node compare-counts.mjs --expected-ids enumerated.txt --op purge          # mint key only
//   ... [--op <name>] [--target <resolved host/db>] [--json]
//
// ID files: one id per line, or any text the ids can be pulled out of (a `SELECT id`
// dump, a JSON array of ids, a comma list). Blank lines, `(N rows)` footers and a
// leading `id` header are ignored.
//
// Exit codes: 0 MATCH or KEY_ONLY, 1 MISMATCH or INDETERMINATE, 2 usage error.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Statements of how many rows an operation touched.
const COUNT_PATTERNS = [
  /would\s+affect\s+(\d+)\s+row/i,               // dry-run output
  /^\s*(?:DELETE|UPDATE|INSERT)\s+(\d+)\s*$/im,   // psql command tags
  /\bcount\b[^\d]{0,20}?(\d+)/is,                 // count(*) result
];
// Only consulted when no statement above matched: `(N rows)` describes the shape of a
// result set, and next to a count(*) result it is the wrong number (`count\n83\n(1 row)`).
const ROW_FOOTER = /\((\d+)\s+rows?\)/i;

/** Pull a single row count out of command output. Ambiguity is a failure, not a guess. */
export function extractCount(text) {
  const found = new Set();
  for (const re of COUNT_PATTERNS) {
    const m = re.exec(text);
    if (m) found.add(Number(m[1]));
  }
  if (found.size > 1) {
    return { error: `output contains more than one candidate row count (${[...found].sort((a, b) => a - b).join(', ')})` };
  }
  if (found.size === 1) return { count: [...found][0] };
  const footer = ROW_FOOTER.exec(text);
  if (footer) return { count: Number(footer[1]) };
  const bare = /^\s*(\d+)\s*$/.exec(text);
  if (bare) return { count: Number(bare[1]) };
  return { error: 'no row count found in the output' };
}

/**
 * Pull ids out of an id dump: one per line, a psql single-column result, a JSON array, or
 * a comma list. Composite ids (`org:1`, `employee:1001`) are kept whole. `#` comment lines
 * are ignored, and a leading all-alphabetic line is treated as a column header and dropped
 * (`id`, `id | name`); real ids in these systems carry digits.
 */
export function extractIds(text) {
  const ids = [];
  let seenContent = false;
  for (let line of String(text).split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('#') || /^\(\d+\s+rows?\)$/i.test(line) || /^[-+|\s]+$/.test(line)) continue;
    const tokens = line
      .split(/[\s,|[\]"']+/)
      .map((t) => t.trim().replace(/[.;]$/, ''))
      .filter((t) => t && /^[A-Za-z0-9_:-]+$/.test(t));
    if (!seenContent) {
      seenContent = true;
      if (tokens.length && tokens.every((t) => /^[A-Za-z_]+$/.test(t))) continue;
    }
    ids.push(...tokens);
  }
  return ids;
}

/** Stable across retries: derived from the target and the sorted, de-duplicated ID set. */
export function idempotencyKey(op, ids, target = '') {
  const unique = [...new Set(ids)].sort();
  const digest = createHash('sha256')
    .update(`${target}\n${unique.join('\n')}`)
    .digest('hex')
    .slice(0, 16);
  return `${op}:${digest}`;
}

export function compare({ expectedCount, actualCount, expectedIds, actualIds, errors = [] }) {
  const notes = [...errors];
  if (notes.length) return { verdict: 'INDETERMINATE', notes };
  if (expectedIds && actualIds) {
    const e = new Set(expectedIds);
    const a = new Set(actualIds);
    const missing = [...e].filter((x) => !a.has(x));
    const extra = [...a].filter((x) => !e.has(x));
    if (missing.length || extra.length) {
      return {
        verdict: 'MISMATCH',
        expected: e.size,
        actual: a.size,
        missing,
        extra,
        notes: [`${missing.length} enumerated id(s) absent from the actual set, ${extra.length} unexpected id(s) present`],
      };
    }
    return { verdict: 'MATCH', expected: e.size, actual: a.size, missing: [], extra: [] };
  }
  if (expectedCount === undefined || actualCount === undefined) {
    return { verdict: 'INDETERMINATE', notes: ['both an expected and an actual figure are required'] };
  }
  if (expectedCount !== actualCount) {
    return {
      verdict: 'MISMATCH',
      expected: expectedCount,
      actual: actualCount,
      notes: [`actual differs from the dry run by ${actualCount - expectedCount > 0 ? '+' : ''}${actualCount - expectedCount} row(s)`],
    };
  }
  return { verdict: 'MATCH', expected: expectedCount, actual: actualCount };
}

function usage(msg) {
  const out = msg ? process.stderr : process.stdout;
  out.write(`${msg ? msg + '\n' : ''}usage: compare-counts.mjs (--expected N --actual N | --expected-file F --actual-file F | --expected-ids F [--actual-ids F | --actual N | --actual-file F]) [--op NAME] [--target T] [--json]\n`);
  process.exit(msg ? 2 : 0);
}

function readOr(path, errors, label) {
  try {
    return readFileSync(path, 'utf8');
  } catch (e) {
    errors.push(`${label} unreadable: ${path} (${e.code || e.message})`);
    return null;
  }
}

export function main(argv) {
  const o = { json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { usage(''); }
    else if (a === '--expected') o.expected = argv[++i];
    else if (a === '--actual') o.actual = argv[++i];
    else if (a === '--expected-file') o.expectedFile = argv[++i];
    else if (a === '--actual-file') o.actualFile = argv[++i];
    else if (a === '--expected-ids') o.expectedIdsFile = argv[++i];
    else if (a === '--actual-ids') o.actualIdsFile = argv[++i];
    else if (a === '--op') o.op = argv[++i];
    else if (a === '--target') o.target = argv[++i];
    else if (a === '--json') o.json = true;
    else usage(`unknown option: ${a}`);
  }

  const errors = [];
  let expectedCount;
  let actualCount;
  let expectedIds;
  let actualIds;

  const haveActualCount = o.actual !== undefined || o.actualFile !== undefined;
  if (o.actualIdsFile && !o.expectedIdsFile) usage('--actual-ids needs --expected-ids: the enumeration is what the actual set is judged against');
  if (o.expectedIdsFile && !o.actualIdsFile && !haveActualCount && !o.op) {
    usage('--expected-ids alone needs either an actual side (--actual-ids / --actual / --actual-file) or --op to mint a key');
  }

  if (o.expectedIdsFile) {
    const et = readOr(o.expectedIdsFile, errors, 'expected id file');
    if (et !== null) expectedIds = extractIds(et);
    if (expectedIds && expectedIds.length === 0) errors.push(`no ids found in ${o.expectedIdsFile}`);
    if (o.actualIdsFile) {
      const at = readOr(o.actualIdsFile, errors, 'actual id file');
      if (at !== null) actualIds = extractIds(at);
      if (actualIds && actualIds.length === 0) errors.push(`no ids found in ${o.actualIdsFile}`);
    } else if (haveActualCount) {
      // Pre-write shape: the enumeration is the expected side, the dry run is the actual
      // side. Compared by count, since a dry run reports a number and not a row set.
      if (expectedIds) expectedCount = new Set(expectedIds).size;
      if (o.actual !== undefined) {
        if (!/^\d+$/.test(o.actual)) errors.push(`--actual must be a non-negative integer, got "${o.actual}"`);
        else actualCount = Number(o.actual);
      } else {
        const text = readOr(o.actualFile, errors, 'actual file');
        if (text !== null) {
          const r = extractCount(text);
          if (r.error) errors.push(`actual (${o.actualFile}): ${r.error}`);
          else actualCount = r.count;
        }
      }
    }
  } else {
    for (const [flag, file, raw, set] of [
      ['expected', o.expectedFile, o.expected, (v) => { expectedCount = v; }],
      ['actual', o.actualFile, o.actual, (v) => { actualCount = v; }],
    ]) {
      if (raw !== undefined) {
        if (!/^\d+$/.test(raw)) errors.push(`--${flag} must be a non-negative integer, got "${raw}"`);
        else set(Number(raw));
      } else if (file) {
        const text = readOr(file, errors, `${flag} file`);
        if (text !== null) {
          const r = extractCount(text);
          if (r.error) errors.push(`${flag} (${file}): ${r.error}`);
          else set(r.count);
        }
      } else {
        errors.push(`no --${flag} or --${flag}-file given`);
      }
    }
  }

  const keyOnly = Boolean(o.expectedIdsFile) && !o.actualIdsFile && !haveActualCount;
  const result = keyOnly && !errors.length
    ? { verdict: 'KEY_ONLY', expected: new Set(expectedIds).size, actual: undefined,
        notes: ['no actual side given — key minted from the enumeration, no comparison performed'] }
    : compare({ expectedCount, actualCount, expectedIds, actualIds, errors });
  let key = null;
  let keyNote = null;
  if (o.op) {
    if (expectedIds && expectedIds.length) key = idempotencyKey(o.op, expectedIds, o.target || '');
    else keyNote = 'no key minted — a row count cannot identify rows; enumerate the target set by id and pass --expected-ids';
  }

  if (o.json) {
    process.stdout.write(JSON.stringify({ ...result, key, keyNote }, null, 2) + '\n');
  } else {
    process.stdout.write(`COMPARE: ${result.verdict}\n`);
    if (result.expected !== undefined) process.stdout.write(`  expected  ${result.expected}\n`);
    if (result.actual !== undefined) process.stdout.write(`  actual    ${result.actual}\n`);
    for (const n of result.notes || []) process.stdout.write(`  note      ${n}\n`);
    const show = (label, arr) => {
      if (!arr || !arr.length) return;
      const head = arr.slice(0, 20).join(', ');
      process.stdout.write(`  ${label} ${head}${arr.length > 20 ? `, … (${arr.length} total)` : ''}\n`);
    };
    show('missing  ', result.missing);
    show('extra    ', result.extra);
    if (key) process.stdout.write(`  key       ${key}\n`);
    if (keyNote) process.stdout.write(`  key       ${keyNote}\n`);
  }
  return result.verdict === 'MATCH' || result.verdict === 'KEY_ONLY' ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
