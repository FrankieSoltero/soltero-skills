import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { audit, analyzeSession, computeLevers, walk } from "./token-audit.mjs";
import { makeFixture } from "./test-fixture.mjs";

function seeded(variant = "s1") {
  const home = mkdtempSync(join(tmpdir(), "te-audit-"));
  makeFixture(home, { variant, force: true });
  return home;
}
const opt = (home) => ({ root: join(home, ".claude", "projects"), since: "0000-00-00", ttlMinutes: 60, top: 5 });

test("ranks headless sessions first, then cache-TTL breaks, then compactions", async () => {
  const home = seeded();
  const r = await audit(opt(home));
  const keys = r.levers.map((l) => l.key);
  assert.deepEqual(keys.slice(0, 3), ["HEADLESS_SESSIONS", "CACHE_TTL_BREAKS", "COMPACTIONS"]);
  assert.equal(r.main.filter((s) => s.headless).length, 40);
  assert.equal(r.levers[0].uncached, 40 * (18000 + 72000 + 7 * (900 + 1500)));
  assert.match(r.levers[0].detail, /sdk-py: 40/);
  rmSync(home, { recursive: true });
});

test("costs a break longer than the TTL as the cold re-prime it caused", async () => {
  const home = seeded();
  const orch = (await Promise.all(walk(join(home, ".claude", "projects")).map((f) => analyzeSession(f, { ttlMs: 3600e3 })))).find((s) => s.name === "orch-0001");
  assert.equal(orch.gaps, 1);
  assert.ok(orch.gapReprime > 600000, `re-prime ${orch.gapReprime}`);
  assert.equal(orch.compactions, 0);
  assert.equal(orch.agents.length, 30);
  assert.equal(orch.agents.filter((a) => a.model === "inherit").length, 18);
  assert.equal(orch.handoffWrites, 3);
  assert.ok(orch.tokens.cache_read / (orch.uncached + orch.tokens.cache_read) > 0.98, "long session is the cached one");
  rmSync(home, { recursive: true });
});

test("counts compactions and the re-prime turn after each", async () => {
  const home = seeded();
  const c = (await Promise.all(walk(join(home, ".claude", "projects")).map((f) => analyzeSession(f, { ttlMs: 3600e3 })))).find((s) => s.name === "compact-0001");
  assert.equal(c.compactions, 2);
  assert.equal(c.compactReprime, 2 * (150000 + 80));
  rmSync(home, { recursive: true });
});

test("measures tool-result bytes landing in the main context and whole-file reads", async () => {
  const home = seeded();
  const r = await audit(opt(home));
  const whole = r.levers.find((l) => l.key === "WHOLE_FILE_READS");
  assert.match(whole.detail, /151 whole-file Read calls vs 0 ranged/);
  const readBytes = r.main.reduce((a, s) => a + (s.resultBytes.Read || 0), 0);
  // 74 orchestrator + 37 compact-session reads carry tool_result blocks; the headless reviews return plain text
  assert.equal(readBytes, (74 + 37) * 6000);
  rmSync(home, { recursive: true });
});

test("renders a markdown report whose lever table is ranked by uncached tokens, never cache reads", async () => {
  const home = seeded();
  const r = await audit(opt(home));
  assert.match(r.markdown, /## Levers, ranked by uncached input/);
  const rows = r.markdown.split("\n").filter((l) => /^\| \d+ \| [A-Z_]+ \|/.test(l));
  assert.equal(rows.length, 5);
  assert.match(rows[0], /HEADLESS_SESSIONS/);
  assert.match(r.markdown, /Long sessions vs short sessions/);
  rmSync(home, { recursive: true });
});

test("computeLevers marks un-costed levers as null share and sorts them last", () => {
  const { levers } = computeLevers([], { ttlMinutes: 60 });
  assert.equal(levers.filter((l) => l.uncached == null).length, 2);
  assert.ok(levers.slice(-2).every((l) => l.uncached == null));
});

test("rejects a missing transcripts root", async () => {
  await assert.rejects(() => audit({ ...opt("/nonexistent-te"), root: "/nonexistent-te/x" }), /not found/);
});
