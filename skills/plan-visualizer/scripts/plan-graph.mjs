#!/usr/bin/env node
// plan-graph.mjs — deterministic analysis of a lean-plans implementation plan.
//
// Parses the Task Dependency Table and the per-task contract blocks, derives
// topological waves from DECLARED dependencies only, and reports integrity
// findings (table↔block drift, consumes-without-dependency, concurrent file
// overlaps, dangling deps, cycles, missing tiers, missing table). Never edits
// the plan. Output: JSON (default), --mermaid, or --md <planPath>.
//
//   node plan-graph.mjs docs/plans/x.md            # JSON analysis
//   node plan-graph.mjs docs/plans/x.md --mermaid  # mermaid flowchart only
//   node plan-graph.mjs docs/plans/x.md --md       # full visualization markdown

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TIERS = new Set(['mechanical', 'standard', 'judgment']);
const NONE = /^(?:—|-|–|none|n\/a|)$/i;

const backticked = (s) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
const uniq = (a) => [...new Set(a)];
const nums = (s) => uniq([...s.matchAll(/\d+/g)].map((m) => Number(m[0])));

// ---------- parsing ----------

function parseTable(lines) {
  const start = lines.findIndex((l) => /^##\s+Task Dependency Table/i.test(l));
  if (start === -1) return { found: false, rows: [] };
  const rows = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^##\s/.test(l)) break;
    if (!/^\|/.test(l)) continue;
    const cells = l.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    if (/^-+$/.test(cells[0].replace(/[:\s]/g, ''))) continue; // separator
    const m = cells[0].match(/^(\d+)\.?\s*(.*)$/);
    if (!m) continue; // header row
    rows.push({
      id: Number(m[1]),
      title: m[2].trim(),
      tableFiles: backticked(cells[1]),
      dependsOn: NONE.test(cells[2]) ? [] : nums(cells[2]),
      tier: cells[3].trim().toLowerCase(),
      line: i + 1,
    });
  }
  return { found: true, rows };
}

function parseBlocks(lines) {
  const blocks = [];
  let cur = null;
  const flush = () => { if (cur) blocks.push(cur); cur = null; };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const h = l.match(/^#{2,3}\s+Task\s+(\d+)\s*[:.—-]\s*(.*)$/i);
    if (h) {
      flush();
      cur = { id: Number(h[1]), title: h[2].trim(), line: i + 1, blockFiles: [], consumesFrom: [],
        consumesLine: null, produces: null, behaviorRows: 0, verify: null, commit: null, section: null };
      continue;
    }
    if (!cur) continue;
    if (/^##\s/.test(l) && !/^##\s+Task/i.test(l)) { flush(); continue; }
    if (/^\*\*Files:?\*\*/i.test(l)) { cur.section = 'files'; continue; }
    if (/^\*\*Interfaces:?\*\*/i.test(l)) { cur.section = 'interfaces'; continue; }
    if (/^\*\*Behavior:?\*\*/i.test(l)) { cur.section = 'behavior'; continue; }
    if (/^\*\*Exact values:?\*\*/i.test(l)) { cur.section = 'exact'; continue; }
    const v = l.match(/^\*\*Verify:?\*\*\s*(.*)$/i); if (v) { cur.verify = v[1].trim(); cur.section = null; continue; }
    const c = l.match(/^\*\*Commit:?\*\*\s*(.*)$/i); if (c) { cur.commit = c[1].trim(); cur.section = null; continue; }
    if (cur.section === 'files' && /^\s*-\s*(Create|Modify|Test|Delete)\s*:/i.test(l)) cur.blockFiles.push(...backticked(l));
    if (cur.section === 'interfaces') {
      const co = l.match(/^\s*-\s*Consumes:\s*(.*)$/i);
      if (co) { cur.consumesLine = i + 1; cur.consumesFrom = uniq([...co[1].matchAll(/Tasks?\s+([\d,\s&and]+)/gi)].flatMap((m) => nums(m[1]))); }
      const pr = l.match(/^\s*-\s*Produces:\s*(.*)$/i);
      if (pr) cur.produces = pr[1].trim();
    }
    if (cur.section === 'behavior' && /^\|/.test(l)) {
      const cells = l.split('|').slice(1, -1).map((c) => c.trim());
      const isSep = cells.every((c) => /^:?-+:?$/.test(c));
      const isHeader = /^case$/i.test(cells[0] ?? '');
      if (!isSep && !isHeader) cur.behaviorRows++;
    }
  }
  flush();
  return blocks;
}

// ---------- graph ----------

function ancestorsOf(tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const memo = new Map();
  const visit = (id, stack = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (stack.has(id)) return new Set();
    stack.add(id);
    const out = new Set();
    for (const d of byId.get(id)?.dependsOn ?? []) {
      if (!byId.has(d)) continue;
      out.add(d);
      for (const a of visit(d, stack)) out.add(a);
    }
    stack.delete(id);
    memo.set(id, out);
    return out;
  };
  for (const t of tasks) visit(t.id);
  return memo;
}

function computeWaves(tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const level = new Map();
  const inCycle = new Set();
  const visiting = new Set();
  const depth = (id) => {
    if (level.has(id)) return level.get(id);
    if (visiting.has(id)) { inCycle.add(id); return Infinity; }
    visiting.add(id);
    let d = 0;
    for (const dep of byId.get(id).dependsOn) {
      if (!byId.has(dep)) continue;
      const dd = depth(dep);
      if (dd === Infinity) { inCycle.add(id); d = Infinity; break; }
      d = Math.max(d, dd + 1);
    }
    visiting.delete(id);
    level.set(id, d);
    return d;
  };
  for (const t of tasks) depth(t.id);
  const waves = [];
  for (const t of tasks) {
    const d = level.get(t.id);
    if (d === Infinity) continue;
    (waves[d] ??= []).push(t.id);
  }
  return { waves: waves.map((w) => w.sort((a, b) => a - b)), inCycle: [...inCycle].sort((a, b) => a - b) };
}

// ---------- analysis ----------

export function analyzePlan(markdown) {
  const lines = markdown.split(/\r?\n/);
  const title = (lines.find((l) => /^#\s/.test(l)) ?? '# Plan').replace(/^#\s*/, '').trim();
  const table = parseTable(lines);
  const blocks = parseBlocks(lines);
  const findings = [];
  const add = (f) => findings.push(f);

  // Merge table rows + blocks into tasks (table is the authority for deps/tiers).
  const ids = uniq([...table.rows.map((r) => r.id), ...blocks.map((b) => b.id)]).sort((a, b) => a - b);
  const tasks = ids.map((id) => {
    const r = table.rows.find((x) => x.id === id);
    const b = blocks.find((x) => x.id === id);
    return {
      id,
      title: r?.title || b?.title || `Task ${id}`,
      tableFiles: r?.tableFiles ?? [],
      blockFiles: b?.blockFiles ?? [],
      files: uniq([...(r?.tableFiles ?? []), ...(b?.blockFiles ?? [])]),
      dependsOn: r?.dependsOn ?? [],
      tier: r?.tier ?? '',
      consumesFrom: b?.consumesFrom ?? [],
      produces: b?.produces ?? null,
      behaviorRows: b?.behaviorRows ?? 0,
      verify: b?.verify ?? null,
      commit: b?.commit ?? null,
      tableLine: r?.line ?? null,
      blockLine: b?.line ?? null,
      consumesLine: b?.consumesLine ?? null,
      inTable: !!r,
      hasBlock: !!b,
    };
  });

  if (!table.found) {
    add({ kind: 'no-dependency-table', severity: 'blocking', task: null,
      message: 'No "## Task Dependency Table" section — dependencies, risk tiers, and waves cannot be derived; regenerate the plan with lean-plans.',
      evidence: null });
  }

  for (const t of tasks) {
    if (table.found && !t.inTable) add({ kind: 'task-missing-from-table', severity: 'blocking', task: t.id,
      message: `Task ${t.id} has a contract block but no dependency-table row.`, evidence: `line ${t.blockLine}` });
    if (table.found && !t.hasBlock) add({ kind: 'task-missing-block', severity: 'warn', task: t.id,
      message: `Task ${t.id} is in the dependency table but has no contract block.`, evidence: `line ${t.tableLine}` });
    if (table.found && t.inTable && !TIERS.has(t.tier)) add({ kind: 'missing-risk-tier', severity: 'warn', task: t.id,
      message: `Task ${t.id} risk tier is ${t.tier ? `"${t.tier}"` : 'empty'} (expected mechanical | standard | judgment).`,
      evidence: `line ${t.tableLine}` });
    for (const d of t.dependsOn) if (!ids.includes(d)) add({ kind: 'dangling-dependency', severity: 'blocking', task: t.id, relatedTask: d,
      message: `Task ${t.id} depends on Task ${d}, which does not exist.`, evidence: `line ${t.tableLine}` });
    if (t.inTable && t.hasBlock) {
      for (const f of t.blockFiles) if (!t.tableFiles.includes(f)) add({ kind: 'file-drift', severity: 'warn', task: t.id, file: f,
        message: `Task ${t.id} block lists \`${f}\` but the dependency-table row omits it (the executor's disjointness check uses the table).`,
        evidence: `block line ${t.blockLine}, table line ${t.tableLine}` });
      for (const f of t.tableFiles) if (!t.blockFiles.includes(f)) add({ kind: 'file-drift', severity: 'warn', task: t.id, file: f,
        message: `Task ${t.id} table row lists \`${f}\` but the contract block omits it.`,
        evidence: `table line ${t.tableLine}, block line ${t.blockLine}` });
    }
  }

  const anc = ancestorsOf(tasks);
  for (const t of tasks) {
    for (const src of t.consumesFrom) {
      if (src === t.id || !ids.includes(src)) continue;
      if (!anc.get(t.id)?.has(src)) add({ kind: 'consumes-without-dependency', severity: 'blocking', task: t.id, relatedTask: src,
        message: `Task ${t.id} consumes an interface from Task ${src}, but its dependency-table row does not depend on ${src} (directly or transitively) — the executor may run them concurrently or in the wrong order.`,
        evidence: `Consumes: line ${t.consumesLine}; table line ${t.tableLine}` });
    }
  }

  let waves = null;
  if (table.found) {
    const w = computeWaves(tasks);
    waves = w.waves;
    if (w.inCycle.length) add({ kind: 'cycle', severity: 'blocking', task: w.inCycle[0], relatedTasks: w.inCycle,
      message: `Dependency cycle among tasks ${w.inCycle.join(', ')} — no valid execution order.`, evidence: 'dependency table' });
    // Concurrent file overlap: two tasks neither of which is an ancestor of the other, sharing a file.
    for (let i = 0; i < tasks.length; i++) for (let j = i + 1; j < tasks.length; j++) {
      const a = tasks[i], b = tasks[j];
      if (anc.get(a.id)?.has(b.id) || anc.get(b.id)?.has(a.id)) continue;
      for (const f of a.files) if (b.files.includes(f)) add({ kind: 'concurrent-file-overlap', severity: 'blocking', task: a.id, relatedTask: b.id, file: f,
        message: `Tasks ${a.id} and ${b.id} are unordered (may run concurrently) yet both touch \`${f}\` — violates lean-sdd's one-writer-per-file-set invariant; add a dependency or split the file.`,
        evidence: `table lines ${a.tableLine}, ${b.tableLine}` });
    }
  }

  const sev = { blocking: 0, warn: 1 };
  findings.sort((x, y) => sev[x.severity] - sev[y.severity] || (x.task ?? 0) - (y.task ?? 0));
  return { title, hasDependencyTable: table.found, tasks, waves, findings,
    summary: { tasks: tasks.length, blocking: findings.filter((f) => f.severity === 'blocking').length,
      warn: findings.filter((f) => f.severity === 'warn').length } };
}

// ---------- rendering ----------

const esc = (s) => String(s).replace(/"/g, '#quot;').replace(/[\[\]{}()<>|]/g, ' ');

export function toMermaid(r) {
  const out = ['flowchart LR'];
  const node = (t) => `T${t.id}["${esc(`${t.id}. ${t.title}`)}<br/><i>${TIERS.has(t.tier) ? t.tier : 'no tier'}</i>"]`;
  if (r.waves) {
    r.waves.forEach((w, i) => {
      out.push(`  subgraph W${i + 1}["Wave ${i + 1} (derived)"]`);
      for (const id of w) out.push(`    ${node(r.tasks.find((t) => t.id === id))}`);
      out.push('  end');
    });
    const placed = new Set(r.waves.flat());
    for (const t of r.tasks) if (!placed.has(t.id)) out.push(`  ${node(t)}`);
  } else {
    for (const t of r.tasks) out.push(`  ${node(t)}`);
  }
  for (const t of r.tasks) for (const d of t.dependsOn) if (r.tasks.some((x) => x.id === d)) out.push(`  T${d} --> T${t.id}`);
  for (const f of r.findings) if (f.kind === 'consumes-without-dependency') out.push(`  T${f.relatedTask} -.->|undeclared| T${f.task}`);
  for (const f of r.findings) if (f.kind === 'concurrent-file-overlap') out.push(`  T${f.task} <-. "shares ${esc(f.file)}" .-> T${f.relatedTask}`);
  out.push('  classDef mechanical fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20');
  out.push('  classDef standard fill:#e3f2fd,stroke:#1565c0,color:#0d47a1');
  out.push('  classDef judgment fill:#fff3e0,stroke:#ef6c00,color:#e65100');
  out.push('  classDef untiered fill:#fce4ec,stroke:#c62828,color:#b71c1c,stroke-dasharray:4 3');
  for (const t of r.tasks) out.push(`  class T${t.id} ${TIERS.has(t.tier) ? t.tier : 'untiered'}`);
  return out.join('\n');
}

export function toMarkdown(r, { planPath = 'plan.md' } = {}) {
  const L = [];
  L.push(`# Plan visualization — ${r.title}`, '');
  L.push(`Source: \`${planPath}\` (read-only; this file is generated by plan-visualizer and is NOT the plan).`, '');
  L.push(`**${r.summary.tasks} tasks · ${r.summary.blocking} blocking · ${r.summary.warn} warnings**`, '');
  L.push('## Dependency graph', '');
  L.push('Nodes colored by risk tier (green mechanical · blue standard · orange judgment · red dashed = no tier). Solid arrows are dependencies declared in the table; dashed `undeclared` arrows are interfaces consumed without a declared dependency.', '');
  L.push('```mermaid', toMermaid(r), '```', '');
  L.push('## Waves', '');
  if (r.waves) {
    L.push('Waves are **derived** from the declared dependencies for illustration only — the executor (lean-sdd) decides actual scheduling, concurrency, review depth, and model choice at run time from the dependency table.', '');
    L.push('| Wave | Tasks | Concurrency note |', '|---|---|---|');
    r.waves.forEach((w, i) => {
      const overlaps = r.findings.filter((f) => f.kind === 'concurrent-file-overlap' && w.includes(f.task) && w.includes(f.relatedTask));
      L.push(`| ${i + 1} | ${w.map((id) => `${id}. ${r.tasks.find((t) => t.id === id).title}`).join(', ')} | ${overlaps.length ? `⚠ file overlap: ${overlaps.map((o) => `\`${o.file}\` (${o.task}↔${o.relatedTask})`).join(', ')}` : w.length > 1 ? 'disjoint files — may run concurrently' : '—'} |`);
    });
  } else {
    L.push('_Not derivable: the plan has no Task Dependency Table. Nothing above is inferred._');
  }
  L.push('', `## Integrity findings (${r.findings.length})`, '');
  if (!r.findings.length) L.push('No table↔block drift, undeclared consumes, overlaps, cycles, or missing tiers detected.');
  else {
    L.push('| Severity | Kind | Task | Finding | Evidence |', '|---|---|---|---|---|');
    for (const f of r.findings) L.push(`| ${f.severity} | \`${f.kind}\` | ${f.task ?? '—'} | ${f.message.replace(/\|/g, '\\|')} | ${f.evidence ?? '—'} |`);
    L.push('', 'Findings are reported, never fixed here — route them back through lean-plans (edit) and plan-review (re-gate).');
  }
  L.push('', '## Tasks', '');
  L.push('| # | Task | Tier | Depends on | Files | Consumes from | Behavior rows | Verify |', '|---|---|---|---|---|---|---|---|');
  for (const t of r.tasks) L.push(`| ${t.id} | ${t.title} | ${t.tier || '—'} | ${t.dependsOn.join(', ') || '—'} | ${t.files.map((f) => `\`${f}\``).join('<br>') || '—'} | ${t.consumesFrom.join(', ') || '—'} | ${t.behaviorRows} | ${t.verify ? `\`${t.verify.replace(/`/g, '')}\`` : '—'} |`);
  L.push('');
  return L.join('\n');
}

// ---------- CLI ----------

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [, , file, mode] = process.argv;
  if (!file) { console.error('usage: plan-graph.mjs <plan.md> [--mermaid|--md]'); process.exit(2); }
  const r = analyzePlan(readFileSync(file, 'utf8'));
  if (mode === '--mermaid') console.log(toMermaid(r));
  else if (mode === '--md') console.log(toMarkdown(r, { planPath: file }));
  else console.log(JSON.stringify(r, null, 2));
  process.exitCode = r.summary.blocking ? 1 : 0;
}
