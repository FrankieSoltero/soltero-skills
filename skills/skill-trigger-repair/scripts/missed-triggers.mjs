#!/usr/bin/env node
// missed-triggers.mjs — deterministic reader of dev-debrief `## Missed triggers` sections.
//
// Extracts one record per missed-trigger bullet (skill, debrief date, cited session,
// project, every quoted span with its kind), then counts recurrence per skill across the
// corpus and classifies the phrasing evidence available for a description repair.
//
// It reports. It never edits a debrief, a skill, or a routing file.
//
//   node missed-triggers.mjs docs/debriefs                 # JSON summary
//   node missed-triggers.mjs docs/debriefs --markdown      # ledger-ready tables
//   node missed-triggers.mjs docs/debriefs/2026-08-19.md   # one report
//   node missed-triggers.mjs docs/debriefs --routing .     # + which routing surfaces
//                                                          #   name each skill
//
// Quote kinds:
//   user        — the words the user actually typed ("the user wrote …", "asked …")
//   description — the skill's own description quoted back by the debrief
//   other       — commit messages, log lines, anything else in quotes
//
// A description repair needs `user` phrasing. `description-only` means the corpus quotes
// the description at itself: rewriting from it is circular, so the phrasing has to be
// recovered from the cited session or recorded as unrecovered.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SECTION = /^##\s+Missed\s+triggers\s*$/i;
const NEXT_SECTION = /^#{1,2}\s+\S/;
const BULLET = /^[-*]\s+\*\*([a-z0-9][a-z0-9-]*)\*\*/;
const HEADING_DATE = /^#\s.*?(\d{4}-\d{2}-\d{2})/m;
const FILE_DATE = /(\d{4}-\d{2}-\d{2})\.md$/;
const QUOTE = /[“"]([^”"]{2,600})[”"]/g;
const USER_MARKER = /\b(?:the user|the owner|user|owner|they)\b[^"“]{0,40}\b(?:wrote|said|asked|typed|proposed|requested|reported|put it)\b[^"“]{0,60}$/i;
const DESC_MARKER = /\b(?:match|matches|matched|matching|per)\b(?:\s+(?:the|its|his|her|their)\b)?(?:\s+(?:own\s+)?description)?[^"“]{0,25}$/i;
const SESSION_TOKEN = /^[0-9a-f]{8,}[^\s]*$/i;

const squash = (s) => s.replace(/\s+/g, ' ').trim();

/** Classify one quoted span by the prose immediately before it. */
export function classifyQuote(prefix) {
  const tail = prefix.slice(-90);
  if (USER_MARKER.test(tail)) return 'user';
  if (DESC_MARKER.test(tail)) return 'description';
  return 'other';
}

function extractQuotes(bullet) {
  const out = [];
  for (const m of bullet.matchAll(QUOTE)) {
    out.push({ text: squash(m[1]), kind: classifyQuote(bullet.slice(0, m.index)) });
  }
  return out;
}

function extractSession(bullet) {
  for (const m of bullet.matchAll(/`([^`]+)`/g)) {
    const raw = m[1].trim();
    if (raw.includes('_') || raw.includes(' ') || raw.includes('/')) continue;
    const bare = raw.replace(/(?:…|\.\.\.)/g, '').replace(/\.?jsonl$/i, '');
    if (!SESSION_TOKEN.test(bare) || bare.length < 8) continue;
    const after = bullet.slice(m.index + m[0].length);
    const proj = after.match(/^\s*(?:…|\.\.\.)?\s*\(([^)]{1,60})\)/);
    return { session: bare, project: proj ? squash(proj[1]) : null };
  }
  return { session: null, project: null };
}

/** Split the `## Missed triggers` section of one report into bullet strings. */
function sectionBullets(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => SECTION.test(l));
  if (start === -1) return null;
  const bullets = [];
  let current = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (NEXT_SECTION.test(line)) break;
    if (/^[-*]\s/.test(line)) {
      if (current) bullets.push(squash(current));
      current = line;
    } else if (current !== null) {
      if (line.trim() === '') { bullets.push(squash(current)); current = null; }
      else current += ' ' + line;
    }
  }
  if (current) bullets.push(squash(current));
  return bullets;
}

/** Parse one debrief report. Returns { path, date, hasSection, findings }. */
export function parseDebrief(text, { path: filePath = null } = {}) {
  const fromFile = filePath && FILE_DATE.exec(filePath);
  const fromHeading = HEADING_DATE.exec(text);
  const date = (fromFile && fromFile[1]) || (fromHeading && fromHeading[1]) || null;
  const bullets = sectionBullets(text);
  if (bullets === null) return { path: filePath, date, hasSection: false, findings: [] };
  const findings = [];
  for (const bullet of bullets) {
    const m = BULLET.exec(bullet);
    if (!m) continue; // "None observed." and other non-skill bullets
    const { session, project } = extractSession(bullet);
    const quotes = extractQuotes(bullet);
    findings.push({
      skill: m[1],
      date,
      path: filePath,
      session,
      project,
      quotes,
      userPhrasings: quotes.filter((q) => q.kind === 'user').map((q) => q.text),
      text: bullet,
    });
  }
  return { path: filePath, date, hasSection: true, findings };
}

/**
 * Roll findings up per skill.
 * `dates` counts DISTINCT debrief dates: two bullets on one night are one night's evidence.
 * A skill at two or more distinct dates is a repair candidate; one date is logged, not edited.
 */
export function summarize(reports, { minDates = 2 } = {}) {
  const bySkill = new Map();
  for (const r of reports) {
    for (const f of r.findings) {
      if (!bySkill.has(f.skill)) bySkill.set(f.skill, []);
      bySkill.get(f.skill).push(f);
    }
  }
  const skills = [];
  for (const [skill, findings] of bySkill) {
    const dates = [...new Set(findings.map((f) => f.date).filter(Boolean))].sort();
    const sessions = [...new Set(findings.map((f) => f.session).filter(Boolean))];
    const phrasings = findings.flatMap((f) =>
      f.userPhrasings.map((quote) => ({ quote, date: f.date, session: f.session })));
    const kinds = new Set(findings.flatMap((f) => f.quotes.map((q) => q.kind)));
    const phrasingEvidence = phrasings.length ? 'user'
      : kinds.has('description') ? 'description-only' : 'none';
    skills.push({
      skill,
      dates,
      occurrences: findings.length,
      sessions,
      projects: [...new Set(findings.map((f) => f.project).filter(Boolean))],
      phrasings,
      phrasingEvidence,
      status: dates.length >= minDates ? 'repair-candidate' : 'logged-only',
      findings,
    });
  }
  skills.sort((a, b) =>
    b.dates.length - a.dates.length || b.occurrences - a.occurrences || a.skill.localeCompare(b.skill));
  return {
    reportsScanned: reports.filter((r) => r.hasSection).length,
    reportsSkipped: reports.filter((r) => !r.hasSection).map((r) => r.path),
    minDates,
    skills,
  };
}

export function scanFiles(files) {
  return summarize(files.map((f) => parseDebrief(readFileSync(f, 'utf8'), { path: f })));
}

/** The three routing surfaces, in repair order. */
export const ROUTING_SURFACES = [
  { key: 'sessionContext', path: 'hooks/session-context.md' },
  { key: 'agents', path: 'AGENTS.md' },
  { key: 'readme', path: 'README.md' },
];

/**
 * Which routing surfaces name each skill. "Does this file mention this skill" has exactly
 * one right answer, and eyeballing three files gets it wrong — so it is checked here.
 * A surface that does not exist is reported `absent`, never as a missing routing line.
 */
export function checkRouting(summary, root = '.', { read = readFileSync } = {}) {
  const texts = new Map();
  for (const s of ROUTING_SURFACES) {
    try { texts.set(s.key, read(path.join(root, s.path), 'utf8')); }
    catch { texts.set(s.key, null); }
  }
  for (const skill of summary.skills) {
    const re = new RegExp(`(?<![A-Za-z0-9-])${skill.skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9-])`);
    const routing = { missing: [], absentSurfaces: [] };
    for (const s of ROUTING_SURFACES) {
      const text = texts.get(s.key);
      if (text === null) { routing[s.key] = null; routing.absentSurfaces.push(s.path); continue; }
      routing[s.key] = re.test(text);
      if (!routing[s.key]) routing.missing.push(s.path);
    }
    skill.routing = routing;
  }
  summary.routingRoot = root;
  return summary;
}

const routingCell = (s) => {
  if (!s.routing) return null;
  if (s.routing.missing.length) return `missing from ${s.routing.missing.join(', ')}`;
  return 'routed on every surface';
};

export function toMarkdown(summary) {
  const withRouting = summary.skills.some((s) => s.routing);
  const rows = summary.skills.map((s) =>
    `| \`${s.skill}\` | ${s.dates.length} (${s.dates.join(', ')}) | ${s.occurrences} | ${s.phrasingEvidence} | ${s.status} |`
    + (withRouting ? ` ${routingCell(s) ?? '—'} |` : ''));
  const out = [
    `# Missed-trigger recurrence — ${summary.reportsScanned} report(s) scanned`,
    '',
    `Repair bar: a skill named on ${summary.minDates} or more distinct debrief dates. Below the bar is a ledger line, not an edit.`,
    '',
    '| Skill | Distinct dates | Bullets | Phrasing evidence | Status |'
      + (withRouting ? ' Routing |' : ''),
    '|---|---|---|---|---|' + (withRouting ? '---|' : ''),
    ...rows,
  ];
  const candidates = summary.skills.filter((s) => s.status === 'repair-candidate');
  if (candidates.length) {
    out.push('', '## Quoted user phrasing per candidate', '');
    for (const c of candidates) {
      out.push(`### \`${c.skill}\` — ${c.phrasingEvidence}`);
      if (c.phrasings.length) {
        for (const p of c.phrasings) out.push(`- "${p.quote}" — ${p.date}, session \`${p.session ?? 'n/a'}\``);
      } else {
        out.push('- No user phrasing quoted in the corpus. Recover it from the cited sessions'
          + ` (${c.sessions.map((s) => `\`${s}\``).join(', ') || 'none cited'}) or record it as unrecovered —`
          + ' rewriting the description from a quote of itself is circular.');
      }
      out.push('');
    }
  }
  return out.join('\n');
}

function collect(args) {
  const files = [];
  for (const a of args) {
    if (statSync(a).isDirectory()) {
      for (const name of readdirSync(a).sort()) {
        if (name.endsWith('.md')) files.push(path.join(a, name));
      }
    } else files.push(a);
  }
  return files;
}

function main(argv) {
  const routingAt = argv.indexOf('--routing');
  let routingRoot = null;
  const rest = [...argv];
  if (routingAt !== -1) {
    const next = rest[routingAt + 1];
    routingRoot = next && !next.startsWith('--') ? next : '.';
    rest.splice(routingAt, next && !next.startsWith('--') ? 2 : 1);
  }
  const args = rest.filter((a) => !a.startsWith('--'));
  if (!args.length) {
    console.error('usage: missed-triggers.mjs <debrief-dir|file...> [--markdown] [--routing <repo-root>]');
    process.exit(2);
  }
  let summary = scanFiles(collect(args));
  if (routingRoot !== null) summary = checkRouting(summary, routingRoot);
  console.log(argv.includes('--markdown') ? toMarkdown(summary) : JSON.stringify(summary, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
