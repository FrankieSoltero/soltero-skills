#!/usr/bin/env node
// test-fixture.mjs — seeds a stand-in home directory for token-economy tests and scenarios:
//   <home>/.claude/settings.json, CLAUDE.md, projects/<project>/*.jsonl (synthetic transcripts
//   in the real Claude Code schema — enough fields for token-audit.mjs and for a human reader).
// CLI:    node test-fixture.mjs <homeDir> [--variant s1|s2|s3] [--force]
// Module: import { makeFixture } from "./test-fixture.mjs"; makeFixture(home, { variant, force })
import { mkdirSync, writeFileSync, existsSync, rmSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const VARIANTS = ["s1", "s2", "s3"];

export function makeFixture(home, { variant = "s1", force = false } = {}) {
if (!VARIANTS.includes(variant)) throw new Error(`unknown variant ${variant}`);
const claude = join(home, ".claude");
if (existsSync(claude)) { if (!force) throw new Error(`${claude} exists; pass --force to rebuild`); rmSync(claude, { recursive: true }); }
const proj = join(claude, "projects", "-Users-alex-Desktop-Code-acme");
mkdirSync(proj, { recursive: true });

// ---- settings + CLAUDE.md ------------------------------------------------------------------
const settings = {
  s1: { model: "opus[1m]", enabledPlugins: { "soltero-skills@soltero-skills-marketplace": true }, theme: "dark" },
  s3: { model: "opus[1m]", enabledPlugins: { "soltero-skills@soltero-skills-marketplace": true }, theme: "dark" },
  s2: {
    model: "opus[1m]", effortLevel: "xhigh", theme: "light",
    enabledPlugins: { "soltero-skills@soltero-skills-marketplace": true, "code-review@claude-plugins-official": true },
    permissions: { allow: ["Bash(npm test:*)"] },
    hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "node ~/.claude/hooks/context-watch.mjs", timeout: 10 }] }] },
  },
}[variant];
writeFileSync(join(claude, "settings.json"), JSON.stringify(settings, null, 2) + "\n");
const claudeMd = {
  s1: "# Alex's global rules\n\n- Prefer TypeScript.\n- Run the tests before saying something is done.\n",
  s3: "# Alex's global rules\n\n- Prefer TypeScript.\n",
  s2: "# Sam's global rules\n\n- Prefer TypeScript.\n- Subagents should inherit the session model so quality stays consistent across the team.\n- Never push to main.\n",
}[variant];
writeFileSync(join(claude, "CLAUDE.md"), claudeMd);

// ---- transcripts ---------------------------------------------------------------------------
const T0 = Date.parse("2026-08-24T14:00:00Z");
const iso = (ms) => new Date(ms).toISOString();
let uuid = 0; const id = () => `u${String(++uuid).padStart(6, "0")}`;
function session(name, entries) {
  writeFileSync(join(proj, `${name}.jsonl`), entries.map((e) => JSON.stringify(e)).join("\n") + "\n");
}
const user = (sid, ts, text, extra = {}) => ({ type: "user", uuid: id(), sessionId: sid, timestamp: iso(ts), isSidechain: false, cwd: "/Users/alex/Desktop/Code/acme", entrypoint: "cli", ...extra, message: { role: "user", content: text } });
// A user turn carrying the result of the previous assistant turn's tool call (sized per tool).
const RESULT_CHARS = { Read: 6000, Bash: 700, Agent: 1800, Grep: 300, Write: 60 };
const result = (sid, ts, prev) => { const tu = (prev.message.content || []).find((b) => b.type === "tool_use"); if (!tu) return user(sid, ts, "ok, next"); return { ...user(sid, ts, ""), message: { role: "user", content: [{ type: "tool_result", tool_use_id: tu.id, content: "x".repeat(RESULT_CHARS[tu.name] || 200) }] } }; };
const asst = (sid, ts, model, usage, content) => ({ type: "assistant", uuid: id(), sessionId: sid, timestamp: iso(ts), isSidechain: false, message: { model, role: "assistant", type: "message", content, usage: { input_tokens: usage.i, cache_creation_input_tokens: usage.cc, cache_read_input_tokens: usage.cr, output_tokens: usage.o } } });
const text = (t) => ({ type: "text", text: t });
const tool = (name, input) => ({ type: "tool_use", id: `toolu_${id()}`, name, input });

// 1. The long orchestrator session: 400 turns, context climbs to ~600K, 98% cache hits, one
//    3-hour break at turn 200 (cache expired → full re-prime), 30 dispatches, 18 unpinned.
{
  const sid = "orch-0001"; const e = []; let ts = T0; let ctx = 20000;
  e.push(user(sid, ts, "Pick up from HANDOFF.md and finish the invoicing feature."));
  for (let t = 1; t <= 400; t++) {
    ts += 2 * 60e3; let cc = 4000 + (t % 7) * 300, cr = ctx;
    if (t === 200) { ts += 3 * 3600e3; cc = ctx + 4000; cr = 0; } // the break
    const content = [];
    if (t % 13 === 0) content.push(tool("Agent", { description: `Review module ${t}`, prompt: "Read the module and report findings.".padEnd(2400, " ."), subagent_type: "general-purpose", ...(t / 13 <= 18 ? {} : { model: t % 39 === 0 ? "haiku" : "opus" }) }));
    else if (t % 5 === 0) content.push(tool("Read", { file_path: `/Users/alex/Desktop/Code/acme/src/module${t}.ts` }));
    else if (t % 3 === 0) content.push(tool("Bash", { command: `sed -n 1,80p src/module${t}.ts`, description: "Read the top of the module" }));
    else if (t % 97 === 0) content.push(tool("Write", { file_path: "/Users/alex/Desktop/Code/acme/HANDOFF.md", content: "# HANDOFF\n..." }));
    else content.push(text(`Turn ${t}: continuing.`));
    const a = asst(sid, ts, "claude-opus-5", { i: 60, cc, cr, o: 900 }, content); e.push(a);
    e.push(result(sid, ts + 1000, a));
    ctx += cc;
  }
  session(sid, e);
}
// 2. Forty headless review sessions (a plugin hook fires an SDK session on every edit).
for (let n = 1; n <= 40; n++) {
  const sid = `review-${String(n).padStart(4, "0")}`; const e = []; let ts = T0 + n * 40 * 60e3;
  e.push(user(sid, ts, "Review this change for security vulnerabilities.\n\nChanged files (you may Read these and any other file in the repo):\n  - src/billing/invoice.ts", { entrypoint: "sdk-py" }));
  e.push(asst(sid, ts + 5e3, "claude-opus-4-7", { i: 18000, cc: 72000, cr: 0, o: 400 }, [tool("Read", { file_path: "/Users/alex/Desktop/Code/acme/src/billing/invoice.ts" })]));
  for (let t = 2; t <= 8; t++) { ts += 20e3; e.push(user(sid, ts, "[tool result]")); e.push(asst(sid, ts + 3e3, "claude-opus-4-7", { i: 900, cc: 1500, cr: 90000, o: 300 }, [t === 8 ? text("No vulnerabilities found.") : tool("Grep", { pattern: "invoice" })])); }
  session(sid, e);
}
// 3. A session that auto-compacted twice (context rebuilt cold after each).
{
  const sid = "compact-0001"; const e = []; let ts = T0 + 5 * 86400e3; let ctx = 15000;
  e.push(user(sid, ts, "Refactor the scheduler."));
  for (let t = 1; t <= 150; t++) {
    ts += 90e3; let cc = 4500, cr = ctx;
    if (t === 60 || t === 120) { e.push({ type: "user", uuid: id(), sessionId: sid, timestamp: iso(ts), isCompactSummary: true, message: { role: "user", content: "This session is being continued from a previous conversation that ran out of context. Summary: ..." } }); ctx = 12000; cc = 150000; cr = 0; }
    const a = asst(sid, ts + 2e3, "claude-opus-5", { i: 80, cc, cr, o: 800 }, [t % 4 === 0 ? tool("Read", { file_path: `/Users/alex/Desktop/Code/acme/src/sched${t}.ts` }) : text(`Turn ${t}.`)]); e.push(a);
    e.push(result(sid, ts + 4e3, a));
    ctx += cc;
  }
  session(sid, e);
}
// 4. Five ordinary short sessions.
for (let n = 1; n <= 5; n++) {
  const sid = `short-${n}`; const e = []; let ts = T0 + n * 86400e3; let ctx = 12000;
  e.push(user(sid, ts, `Fix the failing test in module ${n}.`));
  for (let t = 1; t <= 12; t++) { ts += 60e3; const cc = 3000; const a = asst(sid, ts, "claude-opus-5", { i: 50, cc, cr: ctx, o: 500 }, [tool("Bash", { command: "npm test" })]); e.push(a); e.push(result(sid, ts + 1e3, a)); ctx += cc; }
  session(sid, e);
}
return claude;
}

// Entry-point guard that survives /tmp → /private/tmp symlinks on macOS (lesson 2026-09-02).
function isMain() {
  try { return process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; }
}

if (isMain()) {
  const args = process.argv.slice(2);
  const home = args.find((a) => !a.startsWith("--"));
  if (!home) { console.error("usage: test-fixture.mjs <homeDir> [--variant s1|s2|s3] [--force]"); process.exit(2); }
  const variant = args.includes("--variant") ? args[args.indexOf("--variant") + 1] : "s1";
  try { const out = makeFixture(home, { variant, force: args.includes("--force") }); console.log(`fixture ${variant} written to ${out}`); }
  catch (e) { console.error(e.message); process.exit(1); }
}
