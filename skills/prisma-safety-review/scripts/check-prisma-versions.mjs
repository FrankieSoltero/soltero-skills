#!/usr/bin/env node
// Fails (exit 1) if `prisma` and `@prisma/client` are not pinned to the same exact version.
// Usage: node check-prisma-versions.mjs [path/to/package.json]   (default: package.json)
import { readFileSync } from "node:fs";

const path = process.argv[2] ?? "package.json";

let pkg;
try {
  pkg = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error(`Cannot read ${path}: ${e.message}`);
  process.exit(2);
}

const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const cli = deps["prisma"];
const client = deps["@prisma/client"];

// Strip leading range operators so ^5.10.0 and 5.10.0 compare equal.
const norm = (v) => (v ? v.replace(/^[\^~>=<\s]*/, "").trim() : v);

if (!cli && !client) {
  console.log("No Prisma dependencies found — skipping.");
  process.exit(0);
}
if (!cli || !client) {
  console.error(
    `✗ Only one Prisma package is present (prisma=${cli ?? "missing"}, ` +
      `@prisma/client=${client ?? "missing"}). Both are required and must match.`,
  );
  process.exit(1);
}
if (norm(cli) !== norm(client)) {
  console.error(
    `✗ Version mismatch: prisma=${cli} vs @prisma/client=${client}. ` +
      `Pin both to the SAME exact version — mismatches cause runtime query failures.`,
  );
  process.exit(1);
}
console.log(`✓ prisma and @prisma/client both at ${norm(cli)}.`);
process.exit(0);
