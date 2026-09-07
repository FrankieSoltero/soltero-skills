import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { run, parseArgs, windowForModel, upsertBlock, conflicts, protocolBlock, countMarkerLines, START, END } from "./economy-setup.mjs";
import { makeFixture } from "./test-fixture.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const HOOK = resolve(HERE, "..", "..", "agent-handoff", "hooks", "context-watch.mjs");
const base = (home, extra = {}) => ({ ...parseArgs([]), home, hookSource: HOOK, ...extra });
function seeded(variant) { const home = mkdtempSync(join(tmpdir(), "te-setup-")); makeFixture(home, { variant, force: true }); return home; }
const settingsOf = (home) => JSON.parse(readFileSync(join(home, ".claude", "settings.json"), "utf8"));
const mdOf = (home) => readFileSync(join(home, ".claude", "CLAUDE.md"), "utf8");

test("windowForModel: 1M for current tiers and [1m] suffix, 200K for haiku", () => {
  assert.equal(windowForModel("opus[1m]"), 1000000);
  assert.equal(windowForModel("claude-haiku-4-5"), 200000);
  assert.equal(windowForModel(undefined), 1000000);
});

test("check on a bare home reports the three blocking gaps and exit 1", () => {
  const home = seeded("s1");
  const r = run(base(home));
  const st = Object.fromEntries(r.items.map((i) => [i.key, i.status]));
  assert.equal(st.HOOK_SCRIPT, "MISSING"); assert.equal(st.HOOK_ENTRY, "MISSING"); assert.equal(st.PROTOCOL_BLOCK, "MISSING");
  assert.equal(st.EFFORT, "INFO"); assert.equal(r.exitCode, 1);
  assert.equal(r.changes.length, 0);
  rmSync(home, { recursive: true });
});

test("apply installs hook + calibrated entry + block with backups, then check is OK and a second apply changes nothing", () => {
  const home = seeded("s1");
  const r1 = run(base(home, { apply: true, effort: "high" }));
  assert.equal(r1.exitCode, 0);
  assert.ok(existsSync(join(home, ".claude", "hooks", "context-watch.mjs")));
  const s = settingsOf(home);
  assert.equal(s.effortLevel, "high");
  assert.equal(s.hooks.UserPromptSubmit.length, 1);
  assert.match(s.hooks.UserPromptSubmit[0].hooks[0].command, /HANDOFF_CONTEXT_WINDOW=1000000 HANDOFF_THRESHOLD_PCT=40 node .*context-watch\.mjs/);
  assert.equal(s.theme, "dark", "unrelated keys preserved");
  const md = mdOf(home);
  assert.equal(md.split(START).length - 1, 1);
  assert.match(md, /Run the tests before saying something is done/, "existing lines preserved");
  const files = readdirSync(join(home, ".claude"));
  assert.ok(files.some((f) => f.startsWith("settings.json.bak-")) && files.some((f) => f.startsWith("CLAUDE.md.bak-")));
  const r2 = run(base(home, { effort: "high" }));
  assert.equal(r2.exitCode, 0);
  const before = md;
  const r3 = run(base(home, { apply: true, effort: "high" }));
  assert.equal(r3.changes.length, 0); assert.equal(r3.backups.length, 0);
  assert.equal(mdOf(home), before);
  assert.equal(settingsOf(home).hooks.UserPromptSubmit.length, 1);
  rmSync(home, { recursive: true });
});

test("apply on a half-configured home fixes the dangling 200K entry, keeps every other key, and warns on the conflicting rule without editing it", () => {
  const home = seeded("s2");
  const r0 = run(base(home));
  const st0 = Object.fromEntries(r0.items.map((i) => [i.key, i.status]));
  assert.equal(st0.HOOK_WINDOW, "MISCALIBRATED"); assert.equal(st0.CONFLICTS, "WARN");
  const r = run(base(home, { apply: true }));
  assert.equal(r.exitCode, 0);
  const s = settingsOf(home);
  assert.equal(s.effortLevel, "xhigh", "effort untouched without --effort");
  assert.deepEqual(s.permissions, { allow: ["Bash(npm test:*)"] });
  assert.equal(Object.keys(s.enabledPlugins).length, 2);
  assert.equal(s.hooks.UserPromptSubmit.length, 1);
  assert.match(s.hooks.UserPromptSubmit[0].hooks[0].command, /HANDOFF_CONTEXT_WINDOW=1000000/);
  const md = mdOf(home);
  assert.match(md, /Subagents should inherit the session model/);
  assert.match(md, /Never push to main/);
  const conf = r.items.find((i) => i.key === "CONFLICTS");
  assert.equal(conf.status, "WARN"); assert.match(conf.detail, /CLAUDE\.md:4/);
  rmSync(home, { recursive: true });
});

test("an out-of-date block is replaced in place, not duplicated", () => {
  const home = seeded("s1");
  const p = join(home, ".claude", "CLAUDE.md");
  writeFileSync(p, `# mine\n\n${START}\n## Token economy (old)\n${END}\n\n- trailing rule\n`);
  const r0 = run(base(home));
  assert.equal(r0.items.find((i) => i.key === "PROTOCOL_BLOCK").status, "MISCALIBRATED");
  run(base(home, { apply: true }));
  const md = mdOf(home);
  assert.equal(md.split(START).length - 1, 1);
  assert.ok(md.includes(protocolBlock()));
  assert.match(md, /- trailing rule/);
  assert.match(md, /^# mine/);
  rmSync(home, { recursive: true });
});

test("upsertBlock and conflicts are pure", () => {
  const blk = `${START}\nX\n${END}`;
  assert.equal(upsertBlock("", blk), blk + "\n");
  assert.equal(upsertBlock("a\n", blk), `a\n\n${blk}\n`);
  assert.equal(upsertBlock(`p\n${START}\nold\n${END}\nq`, blk), `p\n${blk}\nq`);
  assert.deepEqual(conflicts(`- keep\n- run /compact every hour\n${START}\n- inherit model\n${END}`).map((c) => c.line), [2]);
});

test("bad arguments exit 2 semantics", () => {
  assert.throws(() => parseArgs(["--bogus"]), /unknown argument/);
  assert.throws(() => parseArgs(["--effort", "ultra"]), /--effort/);
  assert.throws(() => run(base("/nonexistent-te-home")), /no \.claude directory/);
});

test("protocolBlock extracts the real block, not the inline prose mention of the markers (GREEN s2 bug)", () => {
  const b = protocolBlock();
  assert.match(b, /^<!-- token-economy:start -->\n## Token economy/);
  assert.ok(b.split("\n").filter((l) => l.startsWith("- **")).length >= 6, "carries the protocol bullets");
  assert.ok(b.endsWith(END));
});

test("a CLAUDE.md that mentions the markers inline in prose still gets exactly one real block", () => {
  const home = seeded("s1");
  const p = join(home, ".claude", "CLAUDE.md");
  writeFileSync(p, "# mine\n\nKeep the `<!-- token-economy:start -->` block up to date.\n");
  const r0 = run(base(home));
  assert.equal(r0.items.find((i) => i.key === "PROTOCOL_BLOCK").status, "MISSING");
  run(base(home, { apply: true }));
  const md = mdOf(home);
  assert.equal(countMarkerLines(md, START), 1);
  assert.match(md, /Keep the `<!-- token-economy:start -->` block up to date/);
  assert.equal(run(base(home)).exitCode, 0);
  assert.deepEqual(conflicts(md), []);
  rmSync(home, { recursive: true });
});
