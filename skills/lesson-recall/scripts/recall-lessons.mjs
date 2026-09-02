#!/usr/bin/env node
// recall-lessons.mjs — deterministic retrieval over a project's lesson store.
//
// Reads the capture-lesson format (`## YYYY-MM-DD — <symptom>` + Symptom/Root cause/
// Fix/Lesson/Regression test bullets) and, optionally, an auto-memory index
// (`- [Title](file.md) — description`). Ranks entries against the current task by
// weighted term overlap, applies a confidence floor, and clusters entries into
// recurrence classes so the caller can see "this is the Nth time".
//
// Read-only by construction: this file never writes to the lesson store.
//
// Usage:
//   node recall-lessons.mjs --task "<task or bug description>" \
//     [--files src/a.ts,src/b.tsx] [--lessons Docs/mistakes-and-fixes.md] \
//     [--memory .claude/MEMORY.md] [--floor 0.12] [--json]

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---------- tuning constants ----------

export const DEFAULTS = {
  floor: 0.12, // min normalized score for a match to be surfaced at all
  minTerms: 2, // a single shared term is coincidence, not a match
  classThreshold: 0.3, // entry-to-entry overlap that makes two entries the same class
  recurrenceThreshold: 3, // occurrences in one class that force a correction-compiler handoff
};

const FIELD_WEIGHT = { title: 3, symptom: 3, lesson: 2, cause: 2, fix: 1, test: 1, note: 2 };
const PATH_TERM_WEIGHT = 3;
const PATH_LITERAL_WEIGHT = 5;
const RARE_DF_MAX = 2; // a fix term occurring in <= this many entries links exactly those entries

// Generic English + generic engineering words carry no signal about WHICH lesson
// applies; leaving them in makes every entry match every task.
const STOPWORDS = new Set(
  `the and for with from this that then than they them their there here what when where which while
   was were are was not but all any can cad did does done had has have its our out off over under
   after before still just only also into onto per via etc too very much many some most more less
   one two three next last first same other another each every both few own such about above below
   again once during until again
   add added adds change changed changes fix fixed fixes fixing issue issues bug bugs error errors
   fail failed failing failure broken break breaks wrong right work works working
   run running ran use used uses using make made makes call called calls set sets get gets got
   need needs needed want wanted should would could will shall must may might
   code file files line lines repo project function functions method methods class classes
   test tests testing case cases none yet symptom root cause lesson regression
   app apps src lib libs index main app_ component components page pages screen screens
   server client api route routes handler handlers value values thing things stuff
   user users team teams dev devs time times way ways side sides part parts
   new old good bad big small quick fast slow`
    .split(/\s+/)
    .filter(Boolean)
);

// ---------- tokenization ----------

export function tokens(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

export function pathTerms(files = []) {
  const out = new Set();
  for (const f of files) {
    for (const seg of String(f).split(/[\\/]/)) {
      const bare = seg.replace(/\.[a-z0-9]+$/i, '');
      if (bare && bare.length >= 3) out.add(bare.toLowerCase());
      for (const t of tokens(bare)) out.add(t);
    }
  }
  return [...out];
}

// ---------- parsing ----------

const BULLET_FIELDS = [
  [/^\s*[-*]\s*\*\*symptom:?\*\*\s*/i, 'symptom'],
  [/^\s*[-*]\s*\*\*root cause:?\*\*\s*/i, 'cause'],
  [/^\s*[-*]\s*\*\*cause:?\*\*\s*/i, 'cause'],
  [/^\s*[-*]\s*\*\*fix:?\*\*\s*/i, 'fix'],
  [/^\s*[-*]\s*\*\*lesson:?\*\*\s*/i, 'lesson'],
  [/^\s*[-*]\s*\*\*regression test:?\*\*\s*/i, 'test'],
];

/** Parse Docs/mistakes-and-fixes.md (capture-lesson format) into entries. */
export function parseLessons(text, { source = 'lessons' } = {}) {
  const lines = String(text ?? '').split('\n');
  const entries = [];
  let current = null;
  lines.forEach((line, i) => {
    const heading = line.match(/^##\s+(\d{4}-\d{2}-\d{2})\s*[—–-]\s*(.+?)\s*$/);
    if (heading) {
      if (current) entries.push(current);
      current = {
        date: heading[1],
        title: heading[2],
        fields: {},
        raw: line + '\n',
        line: i + 1,
        source,
      };
      return;
    }
    if (!current) return;
    current.raw += line + '\n';
    for (const [re, field] of BULLET_FIELDS) {
      if (re.test(line)) {
        current.fields[field] = line.replace(re, '').trim();
        return;
      }
    }
  });
  if (current) entries.push(current);
  return entries.map((e, idx) => ({ ...e, id: `${source}:${idx}`, raw: e.raw.trimEnd() }));
}

/** Parse an auto-memory index (`- [Title](file.md) — note`) into entries. */
export function parseMemoryIndex(text) {
  const entries = [];
  for (const line of String(text ?? '').split('\n')) {
    const m = line.match(/^\s*[-*]\s*\[([^\]]+)\]\(([^)]+)\)\s*(?:[—–-]\s*(.*))?$/);
    if (!m) continue;
    entries.push({
      date: null,
      title: m[1].trim(),
      fields: { note: (m[3] ?? '').trim() },
      raw: line.trim(),
      target: m[2].trim(),
      line: entries.length + 1,
      source: 'memory',
      id: `memory:${entries.length}`,
    });
  }
  return entries;
}

// ---------- scoring ----------

function entryFieldTerms(entry) {
  const map = new Map(); // term -> best field weight
  const put = (text, weight) => {
    for (const t of tokens(text)) {
      if (!map.has(t) || map.get(t) < weight) map.set(t, weight);
    }
  };
  put(entry.title, FIELD_WEIGHT.title);
  for (const [field, weight] of Object.entries(FIELD_WEIGHT)) {
    if (entry.fields?.[field]) put(entry.fields[field], weight);
  }
  return map;
}

/** All content terms of an entry — used for class clustering, not for scoring. */
export function classTerms(entry) {
  return new Set([
    ...tokens(entry.title),
    ...tokens(entry.fields?.symptom),
    ...tokens(entry.fields?.lesson),
    ...tokens(entry.fields?.cause),
    ...tokens(entry.fields?.note),
  ]);
}

function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const t of a) if (b.has(t)) hits += 1;
  return hits / Math.min(a.size, b.size);
}

/** Group entries into recurrence classes by pairwise term overlap (union-find). */
export function clusterClasses(entries, threshold = DEFAULTS.classThreshold) {
  const parent = entries.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i, j) => {
    const a = find(i);
    const b = find(j);
    if (a !== b) parent[b] = a;
  };
  const termSets = entries.map(classTerms);
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      if (overlap(termSets[i], termSets[j]) >= threshold) union(i, j);
    }
  }
  const groups = new Map();
  entries.forEach((e, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(e);
  });
  return [...groups.values()];
}

/**
 * Rank entries against a task description + file list.
 * Returns every entry scored, sorted descending — filtering is the caller's job.
 */
export function rankMatches(entries, { task = '', files = [] } = {}) {
  const taskTerms = [...new Set(tokens(task))];
  const fTerms = pathTerms(files);
  const denom = 3 * (taskTerms.length + fTerms.length) || 1;

  return entries
    .map((entry) => {
      const fieldTerms = entryFieldTerms(entry);
      const rawLower = entry.raw.toLowerCase();
      let weight = 0;
      const matched = [];
      for (const t of taskTerms) {
        const w = fieldTerms.get(t);
        if (w) {
          weight += w;
          matched.push(t);
        }
      }
      for (const t of fTerms) {
        if (fieldTerms.has(t)) {
          weight += PATH_TERM_WEIGHT;
          if (!matched.includes(t)) matched.push(t);
        }
      }
      for (const f of files) {
        if (f && rawLower.includes(String(f).toLowerCase())) {
          weight += PATH_LITERAL_WEIGHT;
          if (!matched.includes(f)) matched.push(f);
        }
      }
      return { entry, score: Math.min(1, weight / denom), weight, matchedTerms: matched };
    })
    .sort((a, b) => b.score - a.score || String(a.entry.date).localeCompare(String(b.entry.date)));
}

// ---------- top-level recall ----------

export function recall({
  lessonsText = '',
  memoryText = '',
  task = '',
  files = [],
  floor = DEFAULTS.floor,
  minTerms = DEFAULTS.minTerms,
  classThreshold = DEFAULTS.classThreshold,
  recurrenceThreshold = DEFAULTS.recurrenceThreshold,
} = {}) {
  const lessons = parseLessons(lessonsText);
  const memory = parseMemoryIndex(memoryText);
  const all = [...lessons, ...memory];

  // Recurrence classes are computed over the LESSON store only: the memory index
  // is a pointer list, not a record of occurrences.
  const classes = clusterClasses(lessons, classThreshold);
  const classOf = new Map();
  classes.forEach((group, idx) => {
    for (const e of group) {
      classOf.set(e.id, {
        classId: idx,
        occurrences: group.length,
        dates: group.map((g) => g.date).filter(Boolean).sort(),
        titles: group.map((g) => g.title),
      });
    }
  });

  // Document frequency over the lesson store: a term in one entry's fix that occurs in
  // only a couple of entries is distinctive enough to link them.
  const df = new Map();
  for (const e of lessons) {
    for (const t of new Set(tokens(e.raw))) df.set(t, (df.get(t) ?? 0) + 1);
  }

  // A LATER entry that both scores against an earlier entry's fix/cause text AND shares a
  // distinctive term from that fix is a candidate supersession — the store's own record
  // that the recorded fix stopped applying. Same-class entries are excluded: a later
  // occurrence of the same bug is a recurrence, not a supersession.
  const supersessionsFor = (entry) => {
    if (!entry.date) return [];
    const probe = [entry.fields.fix, entry.fields.cause].filter(Boolean).join(' ');
    if (!probe) return [];
    const rare = new Set(tokens(entry.fields.fix).filter((t) => (df.get(t) ?? 0) <= RARE_DF_MAX));
    if (!rare.size) return [];
    const sameClass = classOf.get(entry.id)?.classId;
    const later = lessons.filter(
      (e) =>
        e.date &&
        e.date > entry.date &&
        classOf.get(e.id)?.classId !== sameClass &&
        tokens(e.raw).some((t) => rare.has(t))
    );
    return rankMatches(later, { task: probe })
      .filter((m) => m.score >= floor && m.matchedTerms.length >= minTerms)
      .map((m) => ({
        date: m.entry.date,
        title: m.entry.title,
        score: Number(m.score.toFixed(3)),
        lesson: m.entry.fields.lesson ?? null,
      }));
  };

  const ranked = rankMatches(all, { task, files });
  const matches = ranked
    .filter((m) => m.score >= floor && m.matchedTerms.length >= minTerms)
    .map((m) => ({
      date: m.entry.date,
      title: m.entry.title,
      source: m.entry.source,
      score: Number(m.score.toFixed(3)),
      matchedTerms: m.matchedTerms,
      cause: m.entry.fields.cause ?? null,
      fix: m.entry.fields.fix ?? null,
      lesson: m.entry.fields.lesson ?? m.entry.fields.note ?? null,
      test: m.entry.fields.test ?? null,
      line: m.entry.line,
      recurrence: classOf.get(m.entry.id) ?? null,
      supersededBy: supersessionsFor(m.entry),
    }));

  const top1 = ranked[0]?.score ?? 0;
  const top2 = ranked[1]?.score ?? 0;

  const handoffClasses = [];
  const seen = new Set();
  for (const m of matches) {
    const r = m.recurrence;
    if (!r || r.occurrences < recurrenceThreshold || seen.has(r.classId)) continue;
    seen.add(r.classId);
    handoffClasses.push({
      classId: r.classId,
      occurrences: r.occurrences,
      dates: r.dates,
      titles: r.titles,
      exemplar: m.title,
    });
  }

  return {
    scanned: { lessons: lessons.length, memory: memory.length },
    confidence: {
      top1: Number(top1.toFixed(3)),
      top2: Number(top2.toFixed(3)),
      gap: Number((top1 - top2).toFixed(3)),
      floor,
    },
    silent: matches.length === 0,
    matches,
    handoffRequired: handoffClasses.length > 0,
    handoffClasses,
    recurrenceThreshold,
  };
}

// ---------- text rendering ----------

export function formatText(result) {
  const L = [];
  L.push(
    `Scanned ${result.scanned.lessons} lesson entries` +
      (result.scanned.memory ? ` + ${result.scanned.memory} memory-index entries` : '') +
      ` · top score ${result.confidence.top1} (floor ${result.confidence.floor}, gap ${result.confidence.gap})`
  );
  if (result.silent) {
    L.push('No prior lesson clears the confidence floor — say so in one line and proceed.');
    return L.join('\n');
  }
  L.push(`${result.matches.length} prior lesson(s) match:`);
  for (const m of result.matches) {
    const rec = m.recurrence && m.recurrence.occurrences > 1 ? ` [class x${m.recurrence.occurrences}: ${m.recurrence.dates.join(', ')}]` : '';
    L.push(`  [${m.score}] ${m.date ?? m.source} — ${m.title}${rec}`);
    L.push(`      matched: ${m.matchedTerms.join(', ')}`);
    if (m.cause) L.push(`      cause: ${m.cause}`);
    if (m.fix) L.push(`      fix: ${m.fix}`);
    for (const s of m.supersededBy ?? []) {
      L.push(`      ⚠ possibly superseded by ${s.date} — ${s.title} (${s.score}); check before following the fix above`);
    }
  }
  if (result.handoffRequired) {
    L.push('');
    for (const c of result.handoffClasses) {
      L.push(
        `HANDOFF REQUIRED — class recurred ${c.occurrences}x (>= ${result.recurrenceThreshold}): ${c.dates.join(', ')}`
      );
    }
    L.push('Route to soltero-skills:correction-compiler with this recurrence bundle before hand-fixing again.');
  }
  return L.join('\n');
}

// ---------- CLI ----------

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const task = arg('--task');
  if (!task) {
    console.error(
      'usage: recall-lessons.mjs --task "<description>" [--files a.ts,b.ts] [--lessons PATH] [--memory PATH] [--floor 0.12] [--json]'
    );
    process.exit(2);
  }
  const lessonsPath = arg('--lessons', 'Docs/mistakes-and-fixes.md');
  const memoryPath = arg('--memory');
  const files = (arg('--files', '') || '').split(',').map((s) => s.trim()).filter(Boolean);

  if (!existsSync(lessonsPath)) {
    console.error(`No lesson store at ${lessonsPath} — nothing to recall (this is not an error).`);
    process.exit(0);
  }
  const result = recall({
    lessonsText: readFileSync(lessonsPath, 'utf8'),
    memoryText: memoryPath && existsSync(memoryPath) ? readFileSync(memoryPath, 'utf8') : '',
    task,
    files,
    floor: Number(arg('--floor', DEFAULTS.floor)),
  });
  console.log(process.argv.includes('--json') ? JSON.stringify(result, null, 2) : formatText(result));
}
