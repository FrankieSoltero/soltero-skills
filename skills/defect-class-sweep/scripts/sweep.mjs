#!/usr/bin/env node
// defect-class-sweep: run one defect class's mechanical detector over a tree.
//
// Usage:
//   node sweep.mjs --rule <rule.json> [--root <dir>] [--format text|json]
//
// Exit codes (so this doubles as a CI check):
//   0  no unallowlisted matches
//   1  matches found — the class is present in the tree
//   2  usage error, unreadable rule, or an invalid rule file
//
// The rule file is the reviewable artifact: name, the human-readable correct/wrong
// pattern, the detector regexes, the allowlist markers that suppress a known-good hit,
// and the triage-marker pattern. Contract: ../references/rule-file.md
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

export const DEFAULT_EXCLUDES = [
  '**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**',
  '**/coverage/**', '**/.next/**', '**/vendor/**',
];

// --- glob -------------------------------------------------------------------
// Supports the subset a rule file needs: **, *, ?, {a,b}, and literal segments.
// Matching is against a repo-relative POSIX path.
export function globToRegExp(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // `**/` swallows zero or more path segments; a bare `**` swallows anything.
        if (glob[i + 2] === '/') { out += '(?:[^/]*/)*'; i += 2; } else { out += '.*'; i += 1; }
      } else {
        out += '[^/]*';
      }
    } else if (c === '?') {
      out += '[^/]';
    } else if (c === '{') {
      const close = glob.indexOf('}', i);
      if (close === -1) { out += '\\{'; continue; }
      const alts = glob.slice(i + 1, close).split(',').map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      out += `(?:${alts.join('|')})`;
      i = close;
    } else {
      out += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${out}$`);
}

export function matchesAny(relPath, globs) {
  return globs.some((g) => globToRegExp(g).test(relPath));
}

// --- rule -------------------------------------------------------------------
export function validateRule(rule) {
  const problems = [];
  if (!rule || typeof rule !== 'object') return ['rule file must be a JSON object'];
  if (typeof rule.name !== 'string' || !rule.name.trim()) problems.push('`name` must be a non-empty string');
  if (!Array.isArray(rule.detectors) || rule.detectors.length === 0) {
    problems.push('`detectors` must be a non-empty array — a class with no mechanical detector is a lesson, not a class');
  } else {
    rule.detectors.forEach((d, i) => {
      if (!d || typeof d !== 'object') { problems.push(`detectors[${i}] must be an object`); return; }
      if (typeof d.id !== 'string' || !d.id.trim()) problems.push(`detectors[${i}].id must be a non-empty string`);
      if (typeof d.regex !== 'string' || !d.regex) { problems.push(`detectors[${i}].regex must be a non-empty string`); return; }
      try { new RegExp(d.regex, d.flags ?? ''); } catch (e) { problems.push(`detectors[${i}].regex is not a valid regex: ${e.message}`); }
      if (d.unless !== undefined) {
        try { new RegExp(d.unless); } catch (e) { problems.push(`detectors[${i}].unless is not a valid regex: ${e.message}`); }
      }
    });
  }
  for (const field of ['include', 'exclude', 'allowlistMarkers']) {
    if (rule[field] !== undefined && !Array.isArray(rule[field])) problems.push(`\`${field}\` must be an array when present`);
  }
  for (const field of ['markerPattern', 'skipFileWhen']) {
    if (rule[field] !== undefined) {
      try { new RegExp(rule[field]); } catch (e) { problems.push(`${field} is not a valid regex: ${e.message}`); }
    }
  }
  return problems;
}

export function loadRule(path) {
  let raw;
  try { raw = readFileSync(path, 'utf8'); } catch (e) { throw new Error(`cannot read rule file ${path}: ${e.message}`); }
  let rule;
  try { rule = JSON.parse(raw); } catch (e) { throw new Error(`rule file ${path} is not valid JSON: ${e.message}`); }
  const problems = validateRule(rule);
  if (problems.length) throw new Error(`invalid rule file ${path}:\n  - ${problems.join('\n  - ')}`);
  return rule;
}

// --- walk -------------------------------------------------------------------
export function listFiles(root, { include, exclude }) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = join(dir, e.name);
      const rel = relative(root, abs).split(sep).join('/');
      if (matchesAny(rel, exclude) || matchesAny(`${rel}/`, exclude)) continue;
      if (e.isDirectory()) { walk(abs); continue; }
      if (!e.isFile()) continue;
      if (include.length && !matchesAny(rel, include)) continue;
      out.push(rel);
    }
  };
  walk(root);
  return out;
}

function isProbablyBinary(buf) {
  const n = Math.min(buf.length, 4096);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

// --- sweep ------------------------------------------------------------------
export function sweep(root, rule) {
  const include = rule.include ?? [];
  const exclude = [...DEFAULT_EXCLUDES, ...(rule.exclude ?? [])];
  const allowMarkers = rule.allowlistMarkers ?? [];
  const markerRe = rule.markerPattern ? new RegExp(rule.markerPattern) : null;
  const skipFileRe = rule.skipFileWhen ? new RegExp(rule.skipFileWhen) : null;

  const matches = [];
  const suppressed = [];
  const deferred = [];
  const markers = [];
  const files = listFiles(root, { include, exclude });
  let scanned = 0;

  for (const rel of files) {
    let buf;
    try { buf = readFileSync(join(root, rel)); } catch { continue; }
    if (isProbablyBinary(buf)) continue;
    const text = buf.toString('utf8');
    if (skipFileRe && skipFileRe.test(text.slice(0, 4096))) continue;
    scanned++;
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prev = i > 0 ? lines[i - 1] : '';
      if (markerRe && markerRe.test(line)) {
        markers.push({ file: rel, line: i + 1, text: line.trim() });
      }
      for (const d of rule.detectors) {
        const re = new RegExp(d.regex, d.flags?.includes('g') ? d.flags : `${d.flags ?? ''}g`);
        if (d.unless && new RegExp(d.unless).test(line)) continue;
        let m;
        while ((m = re.exec(line)) !== null) {
          if (m[0] === '') { re.lastIndex++; continue; }
          const hit = { file: rel, line: i + 1, column: m.index + 1, detector: d.id, text: line.trim() };
          // Reviewed-and-correct (allowlist marker) and reviewed-but-undecidable (triage
          // marker) are different states, and neither is an unreviewed instance. Only
          // unreviewed instances fail the check; markers stay visible in the inventory.
          const allowed = allowMarkers.find((mk) => line.includes(mk) || prev.includes(mk));
          const marked = markerRe && (markerRe.test(line) || markerRe.test(prev));
          if (allowed) suppressed.push({ ...hit, allowedBy: allowed });
          else if (marked) deferred.push({ ...hit, marker: (markerRe.test(prev) ? prev : line).trim() });
          else matches.push(hit);
        }
      }
    }
  }

  return {
    rule: rule.name,
    principle: rule.principle ?? null,
    root,
    matches,
    suppressed,
    deferred,
    markers,
    summary: {
      filesScanned: scanned,
      matches: matches.length,
      suppressed: suppressed.length,
      deferred: deferred.length,
      openMarkers: markers.length,
    },
  };
}

export function formatText(result, rule) {
  const L = [];
  L.push(`sweep: ${result.rule}${result.principle ? ` (${result.principle})` : ''}`);
  if (rule?.wrongPattern) L.push(`wrong:   ${rule.wrongPattern}`);
  if (rule?.correctPattern) L.push(`correct: ${rule.correctPattern}`);
  L.push(`root: ${result.root}`);
  L.push('');
  if (result.matches.length === 0) {
    L.push('no unallowlisted matches.');
  } else {
    L.push(`matches (${result.matches.length}):`);
    for (const m of result.matches) L.push(`  ${m.file}:${m.line}:${m.column}  [${m.detector}]  ${m.text}`);
  }
  if (result.suppressed.length) {
    L.push('');
    L.push(`allowlisted (${result.suppressed.length}):`);
    for (const s of result.suppressed) L.push(`  ${s.file}:${s.line}:${s.column}  [${s.detector}]  via "${s.allowedBy}"`);
  }
  if (result.deferred.length) {
    L.push('');
    L.push(`deferred to triage (${result.deferred.length}):`);
    for (const d of result.deferred) L.push(`  ${d.file}:${d.line}:${d.column}  [${d.detector}]  ${d.marker}`);
  }
  if (result.markers.length) {
    L.push('');
    L.push(`open triage markers (${result.markers.length}):`);
    for (const k of result.markers) L.push(`  ${k.file}:${k.line}  ${k.text}`);
  }
  L.push('');
  L.push(`${result.summary.filesScanned} files scanned, ${result.summary.matches} matches, `
    + `${result.summary.suppressed} allowlisted, ${result.summary.deferred} deferred, `
    + `${result.summary.openMarkers} open markers.`);
  return L.join('\n');
}

// --- cli --------------------------------------------------------------------
export function parseArgs(argv) {
  const opts = { rule: null, root: process.cwd(), format: 'text' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--rule') opts.rule = argv[++i];
    else if (a === '--root') opts.root = argv[++i];
    else if (a === '--format') opts.format = argv[++i];
    else throw new Error(`unknown argument: ${a}`);
  }
  if (!opts.rule) throw new Error('--rule <rule.json> is required');
  if (!['text', 'json'].includes(opts.format)) throw new Error(`--format must be text or json, got: ${opts.format}`);
  return opts;
}

function main(argv) {
  let opts, rule;
  try {
    opts = parseArgs(argv);
    rule = loadRule(opts.rule);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    return 2;
  }
  const root = resolve(opts.root);
  try { statSync(root); } catch { process.stderr.write(`root not found: ${root}\n`); return 2; }
  const result = sweep(root, rule);
  process.stdout.write(opts.format === 'json'
    ? `${JSON.stringify(result, null, 2)}\n`
    : `${formatText(result, rule)}\n`);
  return result.matches.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
