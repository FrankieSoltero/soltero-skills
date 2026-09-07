#!/usr/bin/env node
// economy-setup.mjs — check (default) or --apply the token-economy system at user scope.
//
//   node economy-setup.mjs [--home DIR] [--check | --apply] [--window N] [--threshold 40]
//                          [--effort high] [--hook-source PATH] [--json]
//
// Items: HOOK_SCRIPT, HOOK_ENTRY, HOOK_WINDOW, PROTOCOL_BLOCK (blocking), EFFORT (info unless
// --effort given), CONFLICTS (warn). Every file write is preceded by <file>.bak-<timestamp>.
// Exit 0 = every blocking item OK, 1 = gaps remain, 2 = bad input.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, realpathSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
export const START = "<!-- token-economy:start -->", END = "<!-- token-economy:end -->";
export const DEFAULT_HOOK_SOURCE = resolve(HERE, "..", "..", "agent-handoff", "hooks", "context-watch.mjs");
export const PROTOCOL_SOURCE = resolve(HERE, "..", "references", "protocol.md");

export function parseArgs(argv) {
  const o = { home: homedir(), apply: false, window: null, threshold: 40, effort: null, hookSource: DEFAULT_HOOK_SOURCE, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = argv[i + 1];
    if (a === "--home") o.home = v, i++;
    else if (a === "--apply") o.apply = true;
    else if (a === "--check") o.apply = false;
    else if (a === "--window") o.window = Number(v), i++;
    else if (a === "--threshold") o.threshold = Number(v), i++;
    else if (a === "--effort") o.effort = v, i++;
    else if (a === "--hook-source") o.hookSource = v, i++;
    else if (a === "--json") o.json = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  if (o.window != null && !(o.window > 0)) throw new Error("--window must be a positive number");
  if (o.effort && !["low", "medium", "high", "xhigh", "max"].includes(o.effort)) throw new Error(`--effort must be low|medium|high|xhigh|max`);
  return o;
}

// Context window for the configured model string ("opus[1m]", "claude-haiku-4-5", unset …).
export function windowForModel(model) {
  const m = String(model || "").toLowerCase();
  if (/\[1m\]/.test(m)) return 1000000;
  if (/haiku/.test(m)) return 200000;
  return 1000000; // every current opus / sonnet / fable tier is 1M
}

// Markers must occupy an entire line by themselves — protocol.md's own prose mentions the
// marker strings inline (describing the format), and a plain indexOf() would match those
// inline mentions instead of the real block, truncating everything installed downstream.
function findMarkerLine(txt, marker) {
  const re = new RegExp(`^${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m");
  const m = re.exec(txt);
  return m ? m.index : -1;
}

// Number of lines that consist of exactly this marker (prose mentioning the marker inline does not count).
export function countMarkerLines(txt, marker) {
  return txt.split("\n").filter((l) => l.trim() === marker).length;
}

export function protocolBlock(source = PROTOCOL_SOURCE) {
  const txt = readFileSync(source, "utf8");
  const a = findMarkerLine(txt, START), b = findMarkerLine(txt, END);
  if (a < 0 || b < 0 || b < a) throw new Error(`protocol markers not found in ${source}`);
  return txt.slice(a, b + END.length);
}

export function upsertBlock(claudeMd, block) {
  const a = findMarkerLine(claudeMd, START), b = findMarkerLine(claudeMd, END);
  if (a >= 0 && b > a) return claudeMd.slice(0, a) + block + claudeMd.slice(b + END.length);
  const sep = claudeMd.length === 0 ? "" : claudeMd.endsWith("\n\n") ? "" : claudeMd.endsWith("\n") ? "\n" : "\n\n";
  return claudeMd + sep + block + "\n";
}

export function findHookEntries(settings) {
  const out = [];
  for (const [event, groups] of Object.entries(settings.hooks || {})) {
    if (!Array.isArray(groups)) continue;
    groups.forEach((g, gi) => (g.hooks || []).forEach((h, hi) => { if (/context-watch\.mjs/.test(h.command || "")) out.push({ event, gi, hi, hook: h }); }));
  }
  return out;
}

export function hookCommand(home, window, threshold) {
  return `HANDOFF_CONTEXT_WINDOW=${window} HANDOFF_THRESHOLD_PCT=${threshold} node ${join(home, ".claude", "hooks", "context-watch.mjs")}`;
}

function backup(path) {
  if (!existsSync(path)) return null;
  const b = `${path}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  copyFileSync(path, b);
  return b;
}

export function conflicts(claudeMd) {
  const a = findMarkerLine(claudeMd, START), b = findMarkerLine(claudeMd, END);
  const outside = a >= 0 && b > a ? claudeMd.slice(0, a) + claudeMd.slice(b + END.length) : claudeMd;
  const hits = [];
  outside.split("\n").forEach((line, i) => {
    const l = line.toLowerCase();
    if ((/inherit/.test(l) && /model/.test(l)) || /\/compact\b/.test(l) || (/compact/.test(l) && /(every|often|regular|hour)/.test(l))) hits.push({ line: i + 1, text: line.trim() });
  });
  return hits;
}

export function run(o) {
  const claudeDir = join(o.home, ".claude");
  const settingsPath = join(claudeDir, "settings.json"), claudeMdPath = join(claudeDir, "CLAUDE.md");
  const hookPath = join(claudeDir, "hooks", "context-watch.mjs");
  if (!existsSync(claudeDir)) throw new Error(`no .claude directory under ${o.home}`);
  let settings = {};
  if (existsSync(settingsPath)) { try { settings = JSON.parse(readFileSync(settingsPath, "utf8")); } catch (e) { throw new Error(`settings.json is not valid JSON: ${e.message}`); } }
  const claudeMd = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, "utf8") : "";
  const window = o.window || windowForModel(settings.model);
  const wantCmd = hookCommand(o.home, window, o.threshold);
  const items = []; const changes = []; const backups = [];
  const item = (key, status, detail, blocking = true) => items.push({ key, status, detail, blocking });

  // HOOK_SCRIPT
  const scriptOk = existsSync(hookPath);
  if (scriptOk) item("HOOK_SCRIPT", "OK", hookPath);
  else if (o.apply) { if (!existsSync(o.hookSource)) throw new Error(`hook source not found: ${o.hookSource}`); mkdirSync(dirname(hookPath), { recursive: true }); copyFileSync(o.hookSource, hookPath); changes.push(`created ${hookPath} (copied from ${o.hookSource})`); item("HOOK_SCRIPT", "OK", `installed ${hookPath}`); }
  else item("HOOK_SCRIPT", "MISSING", `${hookPath} does not exist (would copy from ${o.hookSource})`);

  // HOOK_ENTRY + HOOK_WINDOW
  const entries = findHookEntries(settings);
  const good = entries.filter((e) => e.event === "UserPromptSubmit" && e.hook.command === wantCmd);
  let settingsChanged = false;
  if (good.length === 1 && entries.length === 1) { item("HOOK_ENTRY", "OK", "UserPromptSubmit → context-watch.mjs"); item("HOOK_WINDOW", "OK", `HANDOFF_CONTEXT_WINDOW=${window} HANDOFF_THRESHOLD_PCT=${o.threshold}`); }
  else if (entries.length === 0) {
    if (o.apply) { settings.hooks ||= {}; settings.hooks.UserPromptSubmit ||= []; settings.hooks.UserPromptSubmit.push({ hooks: [{ type: "command", command: wantCmd, timeout: 10 }] }); settingsChanged = true; changes.push("added UserPromptSubmit hook entry"); item("HOOK_ENTRY", "OK", "added"); item("HOOK_WINDOW", "OK", `HANDOFF_CONTEXT_WINDOW=${window}`); }
    else { item("HOOK_ENTRY", "MISSING", "no UserPromptSubmit hook runs context-watch.mjs"); item("HOOK_WINDOW", "MISSING", `would set HANDOFF_CONTEXT_WINDOW=${window} for model "${settings.model || "(unset)"}"`); }
  } else {
    const desc = entries.map((e) => `${e.event}: "${e.hook.command}"`).join("; ");
    if (o.apply) {
      // Rewrite every existing context-watch entry to the calibrated command; keep the first, drop duplicates.
      for (const e of entries) { const g = settings.hooks[e.event][e.gi]; g.hooks = g.hooks.filter((h) => !/context-watch\.mjs/.test(h.command || "")); }
      for (const ev of Object.keys(settings.hooks)) settings.hooks[ev] = settings.hooks[ev].filter((g) => (g.hooks || []).length > 0);
      settings.hooks.UserPromptSubmit ||= []; settings.hooks.UserPromptSubmit.push({ hooks: [{ type: "command", command: wantCmd, timeout: 10 }] });
      settingsChanged = true; changes.push(`replaced ${entries.length} context-watch hook entr${entries.length === 1 ? "y" : "ies"} (${desc}) with the calibrated one`);
      item("HOOK_ENTRY", "OK", "rewritten"); item("HOOK_WINDOW", "OK", `HANDOFF_CONTEXT_WINDOW=${window}`);
    } else {
      item("HOOK_ENTRY", entries.some((e) => e.event === "UserPromptSubmit") ? "OK" : "MISCALIBRATED", desc);
      const m = entries[0].hook.command.match(/HANDOFF_CONTEXT_WINDOW=(\d+)/);
      const have = m ? Number(m[1]) : 200000;
      item("HOOK_WINDOW", have === window && entries.length === 1 && good.length === 1 ? "OK" : "MISCALIBRATED", `hook runs with window ${have}${m ? "" : " (default, env unset)"}; model "${settings.model || "(unset)"}" needs ${window}${entries.length > 1 ? `; ${entries.length} entries found` : ""}`);
    }
  }

  // EFFORT
  if (o.effort) { if (settings.effortLevel !== o.effort) { if (o.apply) { const was = settings.effortLevel; settings.effortLevel = o.effort; settingsChanged = true; changes.push(`effortLevel ${was ?? "(unset)"} → ${o.effort}`); } item("EFFORT", o.apply ? "OK" : "MISCALIBRATED", `effortLevel ${settings.effortLevel ?? "(unset)"}${o.apply ? "" : ` (would set ${o.effort})`}`); } else item("EFFORT", "OK", `effortLevel ${o.effort}`); }
  else item("EFFORT", settings.effortLevel ? "INFO" : "INFO", `effortLevel ${settings.effortLevel ?? "(unset — Claude Code's default is xhigh; the protocol recommends high; pass --effort high to set it)"}`, false);

  if (settingsChanged) { const b = backup(settingsPath); if (b) backups.push(b); mkdirSync(claudeDir, { recursive: true }); writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n"); }

  // PROTOCOL_BLOCK
  const block = protocolBlock();
  const count = countMarkerLines(claudeMd, START);
  const present = count === 1 && claudeMd.includes(block);
  if (present) item("PROTOCOL_BLOCK", "OK", `${claudeMdPath} carries the current block`);
  else if (o.apply) { const b = backup(claudeMdPath); if (b) backups.push(b); writeFileSync(claudeMdPath, upsertBlock(claudeMd, block)); changes.push(count >= 1 ? `replaced the protocol block in ${claudeMdPath}` : `appended the protocol block to ${claudeMdPath}`); item("PROTOCOL_BLOCK", "OK", count >= 1 ? "updated" : "added"); }
  else item("PROTOCOL_BLOCK", count >= 1 ? "MISCALIBRATED" : "MISSING", count >= 1 ? `block present ${count}× but differs from references/protocol.md` : `no token-economy block in ${claudeMdPath}`);

  // CONFLICTS (never edited)
  const finalMd = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, "utf8") : "";
  const c = conflicts(finalMd);
  item("CONFLICTS", c.length ? "WARN" : "OK", c.length ? c.map((h) => `CLAUDE.md:${h.line} "${h.text}"`).join("; ") + " — contradicts the protocol; left untouched, surface it to the owner" : "no contradicting lines outside the block", false);

  const gaps = items.filter((i) => i.blocking && i.status !== "OK");
  return { items, changes, backups, gaps: gaps.length, window, exitCode: gaps.length ? 1 : 0 };
}

// Entry-point guard that survives /tmp → /private/tmp symlinks on macOS (lesson 2026-09-02).
function isMain() {
  try { return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; }
}

if (isMain()) {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(2); }
  try {
    const r = run(o);
    if (o.json) console.log(JSON.stringify(r, null, 2));
    else {
      console.log(`token-economy setup ${o.apply ? "APPLY" : "CHECK"} — home ${o.home} — window ${r.window}`);
      for (const i of r.items) console.log(`  ${i.status.padEnd(13)} ${i.key.padEnd(15)} ${i.detail}`);
      if (r.changes.length) console.log(`changes:\n${r.changes.map((c) => `  - ${c}`).join("\n")}`);
      if (r.backups.length) console.log(`backups:\n${r.backups.map((c) => `  - ${c}`).join("\n")}`);
      console.log(r.gaps ? `${r.gaps} blocking item(s) not OK` : "all blocking items OK");
    }
    process.exit(r.exitCode);
  } catch (e) { console.error(e.message); process.exit(2); }
}
