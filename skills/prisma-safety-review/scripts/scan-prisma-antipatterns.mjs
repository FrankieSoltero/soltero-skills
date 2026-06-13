#!/usr/bin/env node
// Heuristic scanner for two high-cost Prisma antipatterns. ADVISORY — verify each hit; it can
// false-positive. Always exits 0 (it is a review aid, not a gate).
//   1. Promise.all/allSettled over per-row prisma writes -> pool exhaustion + non-atomic.
//   2. per-row prisma read inside a loop -> N+1.
// Usage: node scan-prisma-antipatterns.mjs [paths...]   (default: current directory)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);

function collect(p, out) {
  let st;
  try {
    st = statSync(p);
  } catch {
    return;
  }
  if (st.isDirectory()) {
    if (SKIP.has(p.split("/").pop())) return;
    for (const e of readdirSync(p)) collect(join(p, e), out);
  } else if (EXTS.has(extname(p))) {
    out.push(p);
  }
}

const targets = process.argv.slice(2);
const files = [];
for (const t of (targets.length ? targets : ["."])) collect(t, files);

const WRITE = /prisma\.\w+\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\b/;
const READ = /prisma\.\w+\.(findUnique|findFirst|findMany|count|aggregate)\b/;
const LOOP = /\b(for|while)\s*\(|\.(map|forEach|reduce|flatMap)\s*\(/;

let hits = 0;
for (const f of files) {
  let lines;
  try {
    lines = readFileSync(f, "utf8").split("\n");
  } catch {
    continue;
  }
  for (let i = 0; i < lines.length; i++) {
    if (/Promise\.(all|allSettled)\s*\(/.test(lines[i])) {
      const win = lines.slice(i, Math.min(lines.length, i + 10)).join("\n");
      if (WRITE.test(win)) {
        console.log(
          `${f}:${i + 1}: POOL/ATOMICITY — Promise.all over Prisma writes; wrap in one ` +
            `$transaction or batch (updateMany).`,
        );
        hits++;
      }
    }
    if (LOOP.test(lines[i])) {
      const win = lines.slice(i, Math.min(lines.length, i + 12)).join("\n");
      if (READ.test(win)) {
        console.log(
          `${f}:${i + 1}: N+1 — per-row Prisma query inside a loop; use include/select or a ` +
            `single findMany where id in [...].`,
        );
        hits++;
      }
    }
  }
}

console.log(
  hits
    ? `\n${hits} potential issue(s) flagged (heuristic — verify each).`
    : "No Promise.all-over-writes or in-loop query patterns found.",
);
process.exit(0);
