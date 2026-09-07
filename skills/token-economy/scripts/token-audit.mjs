#!/usr/bin/env node
// token-audit.mjs — token-efficiency audit over Claude Code transcripts.
//
//   node token-audit.mjs [--root DIR | --home DIR] [--since YYYY-MM-DD] [--ttl-minutes 60]
//                        [--json out.json] [--top N]
//
// Reads every *.jsonl under the transcripts root (default ~/.claude/projects), computes
// per-session and aggregate token metrics from the assistant `usage` blocks, and ranks the
// levers by UNCACHED input tokens (input + cache_creation). Cache reads are reported but never
// ranked on: they are the cheap half, and a large cache-read count is what a healthy long
// session looks like. Exit 0 always (it is a report), 2 on bad input.
import { readdirSync, statSync, createReadStream, writeFileSync, existsSync, realpathSync } from "node:fs";
import { join, basename, dirname, sep } from "node:path";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

export const CACHE_WEIGHTS = { input: 1, cache_create: 1.25, cache_read: 0.1 }; // standard API multipliers

function parseArgs(argv) {
  const o = { root: null, home: null, since: "0000-00-00", ttlMinutes: 60, json: null, top: 10 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = argv[i + 1];
    if (a === "--root") o.root = v, i++;
    else if (a === "--home") o.home = v, i++;
    else if (a === "--since") o.since = v, i++;
    else if (a === "--ttl-minutes") o.ttlMinutes = Number(v), i++;
    else if (a === "--json") o.json = v, i++;
    else if (a === "--top") o.top = Number(v), i++;
    else { console.error(`unknown argument: ${a}`); process.exit(2); }
  }
  if (!o.root) o.root = join(o.home || homedir(), ".claude", "projects");
  return o;
}

export function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (e.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

function textOf(content) {
  if (typeof content === "string") return content;
  return (content || []).filter((b) => b && b.type === "text").map((b) => b.text).join("\n");
}

export async function analyzeSession(file, { ttlMs }) {
  const s = {
    file, name: basename(file, ".jsonl"), project: basename(dirname(file)),
    isSubagentFile: file.split(sep).includes("subagents"),
    start: null, end: null, turns: 0, sideTurns: 0, entrypoint: null, firstPrompt: "",
    models: {}, tokens: { input: 0, cache_create: 0, cache_read: 0, output: 0 },
    peakCtx: 0, finalCtx: 0, tools: {}, agents: [], workflows: 0, skills: [],
    handoffWrites: 0, compactions: 0, compactReprime: 0, gaps: 0, gapReprime: 0,
    resultBytes: {}, wholeFileReads: 0, rangedReads: 0,
  };
  let lastTs = null, afterCompaction = false;
  const toolNames = new Map();
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.isCompactSummary) { s.compactions++; afterCompaction = true; }
    const ts = o.timestamp ? Date.parse(o.timestamp) : null;
    if (ts) { s.start = s.start ? Math.min(s.start, ts) : ts; s.end = s.end ? Math.max(s.end, ts) : ts; }
    const m = o.message;
    if (o.type === "user" && m) {
      if (!s.entrypoint && o.entrypoint) s.entrypoint = o.entrypoint;
      if (!o.isSidechain && !o.isMeta && !o.isCompactSummary) {
        const t = textOf(m.content);
        if (t && !s.firstPrompt && !/^\[tool result\]/.test(t)) s.firstPrompt = t.slice(0, 120).replace(/\s+/g, " ");
        for (const b of Array.isArray(m.content) ? m.content : []) {
          if (b.type !== "tool_result") continue;
          const name = toolNames.get(b.tool_use_id) || "unknown";
          const size = typeof b.content === "string" ? b.content.length : JSON.stringify(b.content || "").length;
          s.resultBytes[name] = (s.resultBytes[name] || 0) + size;
        }
      }
      continue;
    }
    if (o.type !== "assistant" || !m) continue;
    if (o.isSidechain) { s.sideTurns++; continue; }
    s.turns++;
    if (m.model) s.models[m.model] = (s.models[m.model] || 0) + 1;
    const u = m.usage || {};
    const inp = u.input_tokens || 0, cc = u.cache_creation_input_tokens || 0, cr = u.cache_read_input_tokens || 0, out = u.output_tokens || 0;
    s.tokens.input += inp; s.tokens.cache_create += cc; s.tokens.cache_read += cr; s.tokens.output += out;
    const ctx = inp + cc + cr;
    if (ctx > 0) {
      s.peakCtx = Math.max(s.peakCtx, ctx); s.finalCtx = ctx;
      if (ts && lastTs && ts - lastTs > ttlMs) { s.gaps++; s.gapReprime += cc + inp; }
      if (afterCompaction) { s.compactReprime += cc + inp; afterCompaction = false; }
      if (ts) lastTs = ts;
    }
    for (const b of m.content || []) {
      if (b.type !== "tool_use") continue;
      toolNames.set(b.id, b.name);
      s.tools[b.name] = (s.tools[b.name] || 0) + 1;
      const inpt = b.input || {};
      if (b.name === "Agent") s.agents.push({ model: inpt.model || "inherit", type: inpt.subagent_type || "general-purpose", bg: !!inpt.run_in_background, promptChars: (inpt.prompt || "").length });
      if (b.name === "Workflow") s.workflows++;
      if (b.name === "Skill" && inpt.skill) s.skills.push(inpt.skill);
      if (b.name === "Read") { if (inpt.offset != null || inpt.limit != null) s.rangedReads++; else s.wholeFileReads++; }
      if (["Write", "Edit"].includes(b.name) && /HANDOFF\.md$/.test(inpt.file_path || "")) s.handoffWrites++;
    }
  }
  s.mainModel = Object.entries(s.models).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
  s.day = s.start ? new Date(s.start).toISOString().slice(0, 10) : "unknown";
  s.uncached = s.tokens.input + s.tokens.cache_create;
  s.headless = !!s.entrypoint && s.entrypoint !== "cli";
  return s;
}

const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + "%" : "n/a");
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const median = (arr) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
const cnt = (arr, f) => { const c = {}; for (const x of arr) { const k = f(x); c[k] = (c[k] || 0) + 1; } return Object.entries(c).sort((a, b) => b[1] - a[1]); };

export function computeLevers(main, { ttlMinutes }) {
  const U = sum(main, (s) => s.uncached);
  const headless = main.filter((s) => s.headless);
  const agents = main.flatMap((s) => s.agents);
  const unpinned = agents.filter((a) => a.model === "inherit");
  const whole = sum(main, (s) => s.wholeFileReads), ranged = sum(main, (s) => s.rangedReads);
  const readBytes = sum(main, (s) => s.resultBytes.Read || 0), bashBytes = sum(main, (s) => s.resultBytes.Bash || 0);
  const levers = [
    { key: "HEADLESS_SESSIONS", uncached: sum(headless, (s) => s.uncached), detail: `${headless.length} sessions with a non-interactive entrypoint (${cnt(headless, (s) => s.entrypoint).map(([k, v]) => `${k}: ${v}`).join(", ") || "none"}); models: ${cnt(headless, (s) => s.mainModel).map(([k, v]) => `${k}: ${v}`).join(", ") || "n/a"}; first prompt: "${headless[0]?.firstPrompt || ""}"`, fix: "Find the hook or plugin that spawns them and decide whether every firing is worth a cold-context model call; pin it to a cheaper tier or fire it less often." },
    { key: "CACHE_TTL_BREAKS", uncached: sum(main, (s) => s.gapReprime), detail: `${sum(main, (s) => s.gaps)} gaps longer than ${ttlMinutes} min inside a session; each re-wrote the whole context cold on return`, fix: "Before stepping away for longer than the cache TTL, refresh HANDOFF.md and /clear; resume from the handoff instead of re-priming the full context." },
    { key: "COMPACTIONS", uncached: sum(main, (s) => s.compactReprime), detail: `${sum(main, (s) => s.compactions)} compaction events in ${main.filter((s) => s.compactions).length} sessions; the turn after each rebuilt context from a lossy summary`, fix: "Replace compaction with handoff + /clear (agent-handoff at the ~40% reminder)." },
    { key: "UNPINNED_DISPATCHES", uncached: null, detail: `${unpinned.length} of ${agents.length} Agent dispatches carry no model (they inherit the orchestrator's tier); subagent spend is billed in the subagent transcript, not here`, fix: "Pin every dispatch: opus for engineering, sonnet for grunt work, haiku for reading; never inherit." },
    { key: "WHOLE_FILE_READS", uncached: null, detail: `${whole} whole-file Read calls vs ${ranged} ranged; ${fmt(readBytes)} bytes of Read results and ${fmt(bashBytes)} bytes of Bash output landed in the main context`, fix: "Workers read, the orchestrator decides: ranged reads (sed -n, head, grep) in the main thread; a haiku reader for anything long." },
  ];
  for (const l of levers) l.share = l.uncached == null ? null : pct(l.uncached, U);
  levers.sort((a, b) => (b.uncached ?? -1) - (a.uncached ?? -1));
  return { levers, totalUncached: U };
}

export function renderReport(main, files, opt) {
  const T = { input: sum(main, (s) => s.tokens.input), cc: sum(main, (s) => s.tokens.cache_create), cr: sum(main, (s) => s.tokens.cache_read), out: sum(main, (s) => s.tokens.output) };
  const turns = sum(main, (s) => s.turns);
  const weighted = T.input * CACHE_WEIGHTS.input + T.cc * CACHE_WEIGHTS.cache_create + T.cr * CACHE_WEIGHTS.cache_read;
  const L = []; const P = (...a) => L.push(a.join(""));
  P(`# Token-efficiency audit — ${new Date().toISOString().slice(0, 10)}`);
  P(``); P(`Root: ${opt.root} — ${files.length} transcript files, ${main.length} main-thread sessions with ≥1 assistant turn${opt.since !== "0000-00-00" ? ` since ${opt.since}` : ""}. Cache TTL assumed ${opt.ttlMinutes} min.`);
  P(``); P(`## Totals`); P(`| Metric | Value |`); P(`|---|---|`);
  P(`| Assistant turns | ${fmt(turns)} |`);
  P(`| Uncached input (input + cache_creation) | ${fmt(T.input + T.cc)} |`);
  P(`| Cache reads | ${fmt(T.cr)} |`);
  P(`| Cache hit ratio | ${pct(T.cr, T.input + T.cc + T.cr)} |`);
  P(`| Output tokens | ${fmt(T.out)} |`);
  P(`| Uncached input per turn | ${fmt((T.input + T.cc) / Math.max(1, turns))} |`);
  P(`| Input-equivalent tokens (weights ${CACHE_WEIGHTS.input}/${CACHE_WEIGHTS.cache_create}/${CACHE_WEIGHTS.cache_read}) | ${fmt(weighted)} |`);
  const { levers, totalUncached } = computeLevers(main, opt);
  P(``); P(`## Levers, ranked by uncached input`); P(`| # | Lever | Uncached tokens | Share | Evidence |`); P(`|---|---|---|---|---|`);
  levers.forEach((l, i) => P(`| ${i + 1} | ${l.key} | ${l.uncached == null ? "n/a (not costed here)" : fmt(l.uncached)} | ${l.share ?? "—"} | ${l.detail} |`));
  P(``); levers.forEach((l) => P(`- **${l.key}** — ${l.fix}`));
  P(``); P(`## By main model`); P(`| Model | Sessions | Turns | Uncached in | Cache read | Hit ratio | Output | Median peak ctx |`); P(`|---|---|---|---|---|---|---|---|`);
  const byModel = {}; for (const s of main) (byModel[s.mainModel] ||= []).push(s);
  for (const [m, ss] of Object.entries(byModel).sort((a, b) => b[1].length - a[1].length)) { const i = sum(ss, (s) => s.uncached), r = sum(ss, (s) => s.tokens.cache_read); P(`| ${m} | ${ss.length} | ${fmt(sum(ss, (s) => s.turns))} | ${fmt(i)} | ${fmt(r)} | ${pct(r, i + r)} | ${fmt(sum(ss, (s) => s.tokens.output))} | ${fmt(median(ss.map((s) => s.peakCtx)))} |`); }
  P(``); P(`## Long sessions vs short sessions`);
  const big = main.filter((s) => s.peakCtx >= 200e3), small = main.filter((s) => s.peakCtx < 200e3 && s.turns >= 10);
  const row = (n, ss) => { const t = sum(ss, (s) => s.turns) || 1, i = sum(ss, (s) => s.uncached), r = sum(ss, (s) => s.tokens.cache_read); P(`| ${n} | ${ss.length} | ${fmt(i / t)} | ${fmt(r / t)} | ${pct(r, i + r)} | ${sum(ss, (s) => s.gaps)} | ${ss.filter((s) => s.handoffWrites).length} |`); };
  P(`| Bucket | Sessions | Uncached/turn | Cache read/turn | Hit ratio | TTL breaks | Handoff sessions |`); P(`|---|---|---|---|---|---|---|`);
  row("peak ctx ≥ 200K", big); row("peak ctx < 200K, ≥10 turns", small);
  P(``); P(`Interactive sessions: ${main.filter((s) => !s.headless).length}; headless: ${main.filter((s) => s.headless).length}; compactions: ${sum(main, (s) => s.compactions)}; HANDOFF.md writes: ${sum(main, (s) => s.handoffWrites)} in ${main.filter((s) => s.handoffWrites).length} sessions.`);
  const agents = main.flatMap((s) => s.agents);
  P(``); P(`## Dispatches (Agent tool, main thread)`); P(`Total ${agents.length}; background ${agents.filter((a) => a.bg).length}; median prompt ${fmt(median(agents.map((a) => a.promptChars)))} chars. Workflow calls: ${sum(main, (s) => s.workflows)}.`);
  P(`| model | count | share |`); P(`|---|---|---|`); for (const [k, v] of cnt(agents, (a) => a.model)) P(`| ${k} | ${v} | ${pct(v, agents.length)} |`);
  const tools = {}; for (const s of main) for (const [k, v] of Object.entries(s.tools)) tools[k] = (tools[k] || 0) + v;
  const ttot = Object.values(tools).reduce((a, b) => a + b, 0);
  P(``); P(`## Tool mix (main thread)`); P(`| Tool | Calls | Share | Result bytes into context |`); P(`|---|---|---|---|`);
  for (const [k, v] of Object.entries(tools).sort((a, b) => b[1] - a[1]).slice(0, 12)) P(`| ${k} | ${fmt(v)} | ${pct(v, ttot)} | ${fmt(sum(main, (s) => s.resultBytes[k] || 0))} |`);
  P(``); P(`## Top ${opt.top} sessions by uncached input`); P(`| Session | Day | Project | Model | Entry | Turns | Uncached | Cache read | Hit | Peak ctx | TTL breaks | Compactions | Dispatches (unpinned) |`); P(`|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const s of [...main].sort((a, b) => b.uncached - a.uncached).slice(0, opt.top)) P(`| ${s.name.slice(0, 12)} | ${s.day} | ${s.project.slice(-28)} | ${s.mainModel.replace("claude-", "")} | ${s.entrypoint || "?"} | ${s.turns} | ${fmt(s.uncached)} | ${fmt(s.tokens.cache_read)} | ${pct(s.tokens.cache_read, s.uncached + s.tokens.cache_read)} | ${fmt(s.peakCtx)} | ${s.gaps} | ${s.compactions} | ${s.agents.length} (${s.agents.filter((a) => a.model === "inherit").length}) |`);
  return { markdown: L.join("\n"), levers, totalUncached, totals: T };
}

export async function audit(opt) {
  if (!existsSync(opt.root)) throw new Error(`transcripts root not found: ${opt.root}`);
  const files = walk(opt.root);
  const sessions = [];
  for (const f of files) {
    const s = await analyzeSession(f, { ttlMs: opt.ttlMinutes * 60e3 });
    if (s.turns === 0 || s.isSubagentFile || s.day < opt.since) continue;
    sessions.push(s);
  }
  return { files, main: sessions, ...renderReport(sessions, files, opt) };
}

// Entry-point guard that survives /tmp → /private/tmp symlinks on macOS (lesson 2026-09-02).
function isMain() {
  try { return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; }
}

if (isMain()) {
  const opt = parseArgs(process.argv.slice(2));
  try {
    const r = await audit(opt);
    console.log(r.markdown);
    if (opt.json) writeFileSync(opt.json, JSON.stringify({ generated: new Date().toISOString(), root: opt.root, levers: r.levers, totals: r.totals, sessions: r.main.map(({ file, ...rest }) => ({ file: basename(file), ...rest })) }, null, 1));
  } catch (e) { console.error(e.message); process.exit(2); }
}
