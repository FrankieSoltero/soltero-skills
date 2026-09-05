#!/usr/bin/env node
// Inventory every documentation surface in a repo, extract its command and path claims, and
// score coverage against the effective docs standard. Read-only. Plain Node, no dependencies.
//
//   node docs-inventory.mjs <repo> [--home <dir>] [--json | --md]
import { readdirSync, readFileSync, statSync, existsSync, realpathSync } from 'node:fs';
import { join, relative, dirname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadStandard, matchesPattern, StandardError } from './standard.mjs';

const DOC_EXT = /\.(md|mdx|markdown|rst)$/i;
const DOCS_ROOT_NAMES = new Set(['docs', 'doc', 'documentation']);
const PATH_EXT = /\.(md|mdx|js|mjs|cjs|ts|tsx|jsx|json|ya?ml|toml|py|rb|go|rs|java|kt|sql|sh|bash|txt|cfg|ini|xml|html|css|scss|graphql|proto|lock)$/i;
// A line that says something is absent is not claiming it exists. The explicit marker in the
// standard is the deterministic override; this is the natural-language fallback.
const ABSENCE = /\b(no such|does not exist|doesn't exist|don't exist|do not exist|not exist|no longer|there is no|there's no|there are no|is not a|isn't a|was removed|were removed|removed|deleted|renamed|gone|instead of|rather than|not wired|unused|nonexistent|never existed)\b|\*\*not\*\*|\*\*no\*\*|\bno `|\bnot `/i;
const SHELL_LANGS = new Set(['', 'sh', 'bash', 'shell', 'zsh', 'console', 'text']);
const NPM_BUILTIN = new Set(['install', 'i', 'ci', 'run', 'exec', 'init', 'link', 'publish', 'update', 'audit', 'x']);

// ---------------------------------------------------------------- claim extraction
function commandFromToken(tok) {
  const t = tok.trim().replace(/^\$\s+/, '');
  const m = t.match(/^(npm|pnpm|yarn|bun)\s+(?:run\s+)?([\w:.-]+)/) || t.match(/^(make|just)\s+([\w.-]+)/);
  if (!m) return null;
  return { tool: m[1], name: m[2], claim: m[0] };
}

function looksLikePath(tok) {
  const t = tok.trim();
  if (!t || /\s/.test(t)) return false;
  if (/^(https?|file|mailto):/i.test(t)) return false;
  if (/[*<>{}$=@#|;()]/.test(t)) return false;
  if (t.startsWith('-')) return false;
  if (t.startsWith('/') || t.startsWith('~')) return false; // absolute, URL or home paths are not repo claims
  if (/^[\w.-]+:\d+/.test(t)) return false; // file:line refs are citations, not claims
  if (commandFromToken(t)) return false;
  if (t.startsWith('./') || t.startsWith('../')) return true;
  if (t.includes('/')) return /^[\w.\/@-]+$/.test(t) && !/^\d+\/\d+$/.test(t);
  if (t.startsWith('.') && /^\.[\w.-]+$/.test(t)) return !PATH_EXT.test(t) || t.slice(1).includes('.'); // dotfiles, not bare extensions like `.sql`
  return PATH_EXT.test(t) && /^[\w.-]+$/.test(t);
}

/**
 * Pull command and path claims out of a markdown document.
 * Commands: inline code + shell-ish fenced blocks. Paths: inline code + relative markdown links.
 * A line carrying the unverified marker contributes no claims.
 */
export function extractClaims(md, { unverifiedMarker = '(unverified)', absentMarker = '(does not exist)' } = {}) {
  const commands = [];
  const paths = [];
  const skipsLine = (raw) => raw.includes(unverifiedMarker) || raw.includes(absentMarker) || ABSENCE.test(raw);
  const lines = md.split('\n');
  let fence = null;
  lines.forEach((raw, i) => {
    const line = i + 1;
    const fenceOpen = raw.match(/^\s*(```+|~~~+)\s*([\w-]*)/);
    if (fence === null && fenceOpen) { fence = fenceOpen[2].toLowerCase(); return; }
    if (fence !== null && /^\s*(```|~~~)/.test(raw)) { fence = null; return; }
    if (skipsLine(raw)) return;
    if (fence !== null) {
      if (SHELL_LANGS.has(fence)) {
        const c = commandFromToken(raw);
        if (c) commands.push({ ...c, line });
      }
      return;
    }
    const found = [];
    for (const m of raw.matchAll(/`([^`]+)`/g)) {
      const tok = m[1];
      const c = commandFromToken(tok);
      if (c) { commands.push({ ...c, line }); continue; }
      if (looksLikePath(tok)) found.push({ col: m.index, path: tok.replace(/\/$/, ''), line, via: 'code' });
    }
    for (const m of raw.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = m[1].split('#')[0];
      if (!target || /^(https?|mailto):/i.test(target)) continue;
      if (looksLikePath(target) || target.includes('/')) found.push({ col: m.index, path: target.replace(/\/$/, ''), line, via: 'link' });
    }
    found.sort((a, b) => a.col - b.col);
    for (const { col, ...p } of found) paths.push(p);
  });
  return { commands, paths };
}

// ---------------------------------------------------------------- command evidence
function commandEvidence(repo) {
  const ev = { npm: {}, make: [], just: [] };
  const pkg = join(repo, 'package.json');
  if (existsSync(pkg)) {
    try { ev.npm = JSON.parse(readFileSync(pkg, 'utf8')).scripts ?? {}; } catch { /* unreadable manifest = no evidence */ }
  }
  const names = readdirSync(repo);
  for (const [file, key] of [['Makefile', 'make'], ['makefile', 'make'], ['GNUmakefile', 'make'], ['justfile', 'just'], ['Justfile', 'just']]) {
    if (!names.includes(file)) continue; // exact-case match, so a case-insensitive FS reads each file once
    for (const l of readFileSync(join(repo, file), 'utf8').split('\n')) {
      const m = l.match(/^([A-Za-z0-9_.-]+)\s*:(?!=)/);
      if (m && m[1] !== '.PHONY' && !ev[key].includes(m[1])) ev[key].push(m[1]);
    }
  }
  return ev;
}

function commandStatus(c, ev) {
  if (c.tool === 'make') return ev.make.includes(c.name) ? 'ok' : 'missing';
  if (c.tool === 'just') return ev.just.includes(c.name) ? 'ok' : 'missing';
  if (NPM_BUILTIN.has(c.name)) return 'ok';
  if (c.name in ev.npm) return 'ok';
  if (['start', 'test', 'stop', 'restart'].includes(c.name)) return c.name in ev.npm ? 'ok' : 'missing';
  return 'missing';
}

// ---------------------------------------------------------------- walk
function gitignorePatterns(repo) {
  const p = join(repo, '.gitignore');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('!') && !l.startsWith('#'))
    .map((l) => l.replace(/^\//, '').replace(/\/$/, ''));
}

function isRuntimePath(rel, standard, ignored) {
  const first = rel.replace(/^\.\//, '').split('/')[0];
  if ((standard.exclude ?? []).includes(first)) return true;
  const clean = rel.replace(/^\.\//, '');
  return ignored.some((g) => clean === g || clean.startsWith(g + '/') || first === g || matchesPattern(clean, g));
}

/** Every doc file (sorted) plus the set of every file/dir basename outside excluded dirs. */
function walk(repo, standard) {
  const docs = [];
  const basenames = new Set();
  const excl = new Set(standard.exclude ?? []);
  const rec = (dir) => {
    for (const name of readdirSync(dir)) {
      if (excl.has(name) || name === '.git') continue;
      const full = join(dir, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      basenames.add(name);
      if (st.isDirectory()) rec(full);
      else if (DOC_EXT.test(name)) docs.push(relative(repo, full).split('\\').join('/'));
    }
  };
  rec(repo);
  return { docs: docs.sort(), basenames };
}

function classify(rel, standard) {
  const base = posix.basename(rel);
  const top = rel.split('/')[0];
  if (!rel.includes('/')) {
    if (/^(README|CLAUDE|AGENTS)\.md$/i.test(base)) return 'entry';
    if (/^CONTRIBUTING/i.test(base)) return 'contributing';
    if (/^CHANGELOG/i.test(base)) return 'changelog';
    if (/^HANDOFF/i.test(base)) return 'handoff';
  }
  if (/(^|\/)(adr|adrs|decisions)\//i.test(rel)) return 'adr';
  if (top === standard.docsRoot || DOCS_ROOT_NAMES.has(top.toLowerCase())) return 'docs';
  return 'other';
}

function headings(md) {
  const out = [];
  let fence = false;
  md.split('\n').forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return; }
    if (fence) return;
    const m = l.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (m) out.push({ level: m[1].length, text: m[2].trim(), line: i + 1 });
  });
  return out;
}

/** Case-exact existence check: a macOS run must report what a Linux checkout would see. */
export function existsExact(repo, rel) {
  const root = resolve(repo);
  const target = resolve(root, rel);
  if (!target.startsWith(root)) return false;
  const parts = relative(root, target).split(/[\\/]/).filter(Boolean);
  let cur = root;
  for (const part of parts) {
    let names;
    try { names = readdirSync(cur); } catch { return false; }
    if (!names.includes(part)) return false;
    cur = join(cur, part);
  }
  return true;
}

function resolvesInRepo(repo, docRel, p, basenames) {
  if (existsExact(repo, p) || existsExact(repo, posix.join(dirname(docRel), p))) return true;
  // a bare basename (`registry.js`, `adr/`) claims only that such a file or dir exists somewhere
  if (p.includes('/')) return false;
  if (basenames.has(p)) return true;
  // a dotted suffix (`.test.js`, `.d.ts`) claims that files ending that way exist
  if (p.startsWith('.') && p.slice(1).includes('.')) for (const b of basenames) if (b.endsWith(p)) return true;
  return false;
}

// ---------------------------------------------------------------- inventory
export function inventory({ repo, home }) {
  repo = resolve(repo);
  const { standard, source, warnings } = loadStandard({ home, repo });
  const ignored = gitignorePatterns(repo);
  const ev = commandEvidence(repo);
  const { docs: files, basenames } = walk(repo, standard);
  const docsRoots = readdirSync(repo).filter((n) => {
    try { return statSync(join(repo, n)).isDirectory() && (n === standard.docsRoot || DOCS_ROOT_NAMES.has(n.toLowerCase())); } catch { return false; }
  }).sort();

  const docs = files.map((rel) => {
    const md = readFileSync(join(repo, rel), 'utf8');
    const kind = classify(rel, standard);
    const historical = kind === 'adr' || kind === 'changelog' || kind === 'handoff' ||
      (standard.historical ?? []).some((pat) => matchesPattern(rel, pat));
    const { commands, paths } = extractClaims(md, { unverifiedMarker: standard.unverifiedMarker, absentMarker: standard.absentMarker });
    return {
      file: rel,
      kind,
      historical,
      lines: md.split('\n').length,
      headings: headings(md),
      commands: commands.map((c) => ({ claim: c.claim, line: c.line, status: commandStatus(c, ev) })),
      paths: paths.filter((p) => !isRuntimePath(p.path, standard, ignored))
        .map((p) => ({ path: p.path, line: p.line, via: p.via, status: resolvesInRepo(repo, rel, p.path, basenames) ? 'ok' : 'missing' })),
      links: paths.filter((p) => /\.(md|mdx|markdown)$/i.test(p.path)).map((p) => p.path),
      // Claude Code `@path` imports: a line that is just `@AGENTS.md` pulls that file in
      imports: md.split('\n').map((l) => l.trim().match(/^@([\w./-]+\.md)$/)).filter(Boolean).map((m) => m[1].replace(/^\.\//, '')),
    };
  });

  const byFile = new Map(docs.map((d) => [d.file, d]));
  const sectionPresent = (doc, section) => doc.headings.some((h) => h.text.toLowerCase().includes(section.toLowerCase()));

  const coverage = standard.required.map((req) => {
    const doc = byFile.get(req.file);
    if (!doc) return { file: req.file, status: 'missing', missingSections: req.sections ?? [] };
    const missingSections = (req.sections ?? []).filter((s) => !sectionPresent(doc, s));
    return { file: req.file, status: missingSections.length ? 'failing' : 'present', missingSections };
  });

  const entryFile = standard.entryDoc.file;
  const entry = byFile.get(entryFile);
  const entryDoc = {
    file: entryFile,
    present: Boolean(entry),
    lines: entry ? entry.lines : 0,
    maxLines: standard.entryDoc.maxLines,
    missingSections: entry ? (standard.entryDoc.requiredSections ?? []).filter((s) => !sectionPresent(entry, s)) : (standard.entryDoc.requiredSections ?? []),
    mirror: standard.entryDoc.mirror ?? null,
    mirrorPresent: standard.entryDoc.mirror ? byFile.has(standard.entryDoc.mirror) : null,
  };

  const staleClaims = docs.filter((d) => !d.historical)
    .reduce((n, d) => n + d.commands.filter((c) => c.status === 'missing').length + d.paths.filter((p) => p.status === 'missing').length, 0);

  return {
    repo,
    standard,
    source,
    warnings,
    docsRoots,
    commandEvidence: ev,
    entryDoc,
    docs,
    coverage,
    summary: {
      docs: docs.length,
      docsRoots: docsRoots.length,
      staleClaims,
      requiredPresent: coverage.filter((c) => c.status === 'present').length,
      requiredTotal: coverage.length,
    },
  };
}

export function renderMarkdown(inv) {
  const L = [];
  L.push(`# Documentation inventory — ${posix.basename(inv.repo)}`, '');
  L.push(`Standard: ${inv.source.user ?? 'bundled default (no user-scope file yet)'}${inv.source.project ? ` + project override ${inv.source.project}` : ''}`);
  for (const w of inv.warnings) L.push(`- warning: ${w}`);
  L.push('', `Docs roots: ${inv.docsRoots.length ? inv.docsRoots.map((r) => `\`${r}\``).join(', ') : 'none'} (standard: \`${inv.standard.docsRoot}\`)`);
  L.push(`Entry doc \`${inv.entryDoc.file}\`: ${inv.entryDoc.present ? `${inv.entryDoc.lines} lines (budget ${inv.entryDoc.maxLines})` : 'MISSING'}` +
    (inv.entryDoc.missingSections.length ? ` — missing sections: ${inv.entryDoc.missingSections.join(', ')}` : ''));
  L.push(`Command evidence: npm scripts [${Object.keys(inv.commandEvidence.npm).join(', ')}], make [${inv.commandEvidence.make.join(', ')}], just [${inv.commandEvidence.just.join(', ')}]`);
  L.push('', `## Coverage — ${inv.summary.requiredPresent}/${inv.summary.requiredTotal} required docs present`, '');
  for (const c of inv.coverage) L.push(`- \`${c.file}\` — ${c.status}${c.missingSections.length ? ` (missing: ${c.missingSections.join(', ')})` : ''}`);
  L.push('', `## Docs found (${inv.summary.docs})`, '');
  for (const d of inv.docs) {
    const bad = d.commands.filter((c) => c.status === 'missing').length + d.paths.filter((p) => p.status === 'missing').length;
    L.push(`- \`${d.file}\` — ${d.kind}${d.historical ? ' (historical)' : ''}, ${d.lines} lines, ${d.headings.length} headings, ${bad} stale claim${bad === 1 ? '' : 's'}`);
  }
  L.push('', `## Stale claims (${inv.summary.staleClaims}, non-historical docs)`, '');
  for (const d of inv.docs) {
    if (d.historical) continue;
    for (const c of d.commands) if (c.status === 'missing') L.push(`- ${d.file}:${c.line} command \`${c.claim}\` — not in any command source`);
    for (const p of d.paths) if (p.status === 'missing') L.push(`- ${d.file}:${p.line} path \`${p.path}\` — does not exist`);
  }
  return L.join('\n') + '\n';
}

// ---------------------------------------------------------------- CLI
function main(argv) {
  const args = argv.slice(2);
  let repo = null; let home = process.env.HOME; let mode = 'md';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--home') home = args[++i];
    else if (args[i] === '--json') mode = 'json';
    else if (args[i] === '--md') mode = 'md';
    else if (!repo) repo = args[i];
  }
  if (!repo) { console.error('usage: docs-inventory.mjs <repo> [--home <dir>] [--json|--md]'); return 2; }
  try {
    const inv = inventory({ repo, home });
    process.stdout.write(mode === 'json' ? JSON.stringify(inv, null, 2) + '\n' : renderMarkdown(inv));
    return 0;
  } catch (e) {
    if (e instanceof StandardError) { console.error(`MALFORMED ${e.message}`); return 2; }
    throw e;
  }
}

const invokedDirectly = (() => {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
})();
if (invokedDirectly) process.exit(main(process.argv));
