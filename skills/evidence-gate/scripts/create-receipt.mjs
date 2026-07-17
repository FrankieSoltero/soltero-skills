#!/usr/bin/env node
// evidence-gate: run a verification command and write a hash-bound receipt.
//
// Usage:
//   node create-receipt.mjs --claim "<lifecycle claim>" [--produced-by <agent/session id>]
//        [--repo <dir>] [--receipts-dir Docs/evidence/receipts] -- <command> [args...]
//
// Always writes the receipt — a non-zero exit is a valid receipt of a FAILED
// verification (an open finding that blocks the gate). Exits with the command's
// exit code so callers see red immediately.
// Receipt filename is deterministic per claim (slug of the claim), so the only way
// to turn a claim's red receipt green is to re-run THAT claim's verification.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  DEFAULT_RECEIPTS_DIR, computeTreeHash, sha256Hex, slugify,
} from './receipt-lib.mjs';

function parseArgs(argv) {
  const opts = { receiptsDir: DEFAULT_RECEIPTS_DIR, repo: process.cwd() };
  let i = 0;
  for (; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { i++; break; }
    else if (a === '--claim') opts.claim = argv[++i];
    else if (a === '--produced-by') opts.producedBy = argv[++i];
    else if (a === '--repo') opts.repo = argv[++i];
    else if (a === '--receipts-dir') opts.receiptsDir = argv[++i];
    else throw new Error(`unknown option before --: ${a}`);
  }
  opts.command = argv[i];
  opts.commandArgs = argv.slice(i + 1);
  return opts;
}

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); }
  catch (e) { console.error(String(e.message ?? e)); process.exit(2); }

  if (!opts.claim) { console.error('error: --claim is required'); process.exit(2); }
  if (!opts.command) { console.error('error: no command given after --'); process.exit(2); }
  const producedBy = opts.producedBy ?? process.env.CLAUDE_SESSION_ID;
  if (!producedBy) {
    console.error('error: --produced-by is required (or set CLAUDE_SESSION_ID)');
    process.exit(2);
  }

  const repo = resolve(opts.repo);
  const receiptsAbs = join(repo, opts.receiptsDir);
  mkdirSync(receiptsAbs, { recursive: true });

  const run = spawnSync(opts.command, opts.commandArgs, {
    cwd: repo, encoding: 'buffer', shell: false, maxBuffer: 64 * 1024 * 1024,
  });
  let exitCode;
  let output;
  if (run.error) {
    exitCode = 127;
    output = Buffer.from(`spawn error: ${run.error.message}\n`);
  } else {
    exitCode = run.status ?? 1; // killed-by-signal counts as failure
    output = Buffer.concat([run.stdout ?? Buffer.alloc(0), run.stderr ?? Buffer.alloc(0)]);
  }

  const slug = slugify(opts.claim);
  const outputName = `${slug}.output.txt`;
  writeFileSync(join(receiptsAbs, outputName), output);

  // Hash the tree AFTER the command ran, so the binding reflects the tree the
  // verification actually saw (commands must not mutate tracked sources).
  const receipt = {
    claim: opts.claim,
    command: opts.command,
    args: opts.commandArgs,
    cwd: repo,
    exitCode,
    outputDigest: 'sha256:' + sha256Hex(output),
    outputPath: outputName,
    treeHash: computeTreeHash(repo, opts.receiptsDir),
    timestamp: new Date().toISOString(),
    producedBy,
  };
  const receiptPath = join(receiptsAbs, `${slug}.json`);
  writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');

  console.log(`receipt: ${receiptPath}`);
  console.log(`exitCode: ${exitCode} (${exitCode === 0 ? 'green' : 'RED — open finding, blocks the gate'})`);
  process.exit(exitCode);
}

main();
