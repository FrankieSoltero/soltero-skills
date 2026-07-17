#!/usr/bin/env node
// evidence-gate: mechanically re-verify receipts, offline. FAIL-CLOSED.
//
// Usage:
//   node verify-receipt.mjs [--repo <dir>] <receipt.json> [more.json ...]
//   node verify-receipt.mjs [--repo <dir>] --all [--receipts-dir Docs/evidence/receipts]
//
// Checks per receipt (no LLM judgment; any failure blocks):
//   INCOMPLETE            missing/mistyped required fields or unparseable JSON
//   MISSING_OUTPUT        stored full output not found
//   OUTPUT_DIGEST_MISMATCH sha256 of stored output != outputDigest
//   STALE_TREE            recomputed live tree hash != treeHash
//   OPEN_FINDING          exitCode != 0 (a valid receipt of a FAILED verification)
//
// --all verifies EVERY receipt in the dir and fails if any receipt fails — a newer
// clean pass never masks a still-open earlier finding. Zero receipts => NO_EVIDENCE
// (fail-closed: absence of evidence blocks the gate).
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  DEFAULT_RECEIPTS_DIR, checkCompleteness, computeTreeHash, sha256Hex,
} from './receipt-lib.mjs';

function parseArgs(argv) {
  const opts = { repo: process.cwd(), receiptsDir: DEFAULT_RECEIPTS_DIR, all: false, files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo') opts.repo = argv[++i];
    else if (a === '--receipts-dir') opts.receiptsDir = argv[++i];
    else if (a === '--all') opts.all = true;
    else if (a.startsWith('--')) throw new Error(`unknown option: ${a}`);
    else opts.files.push(a);
  }
  return opts;
}

function verifyOne(receiptPath, liveTreeHash) {
  const failures = [];
  let receipt;
  try {
    receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
  } catch (e) {
    return { failures: [`INCOMPLETE: unreadable/unparseable JSON (${e.message})`] };
  }
  const problems = checkCompleteness(receipt);
  if (problems.length) {
    return { receipt, failures: problems.map((p) => `INCOMPLETE: ${p}`) };
  }

  const outputPath = join(dirname(receiptPath),
    receipt.outputPath ?? basename(receiptPath).replace(/\.json$/, '.output.txt'));
  try {
    const digest = 'sha256:' + sha256Hex(readFileSync(outputPath));
    if (digest !== receipt.outputDigest) {
      failures.push(`OUTPUT_DIGEST_MISMATCH: stored output != outputDigest (${outputPath})`);
    }
  } catch {
    failures.push(`MISSING_OUTPUT: full output not found at ${outputPath}`);
  }

  if (receipt.treeHash !== liveTreeHash) {
    failures.push(`STALE_TREE: receipt treeHash ${receipt.treeHash} != live tree ${liveTreeHash}`);
  }
  if (receipt.exitCode !== 0) {
    failures.push(`OPEN_FINDING: exitCode ${receipt.exitCode} — a failed verification blocks until re-run green`);
  }
  return { receipt, failures };
}

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); }
  catch (e) { console.error(String(e.message ?? e)); process.exit(2); }

  const repo = resolve(opts.repo);
  let files = opts.files.map((f) => resolve(f));
  if (opts.all) {
    const dir = join(repo, opts.receiptsDir);
    let names = [];
    try { names = readdirSync(dir).filter((n) => n.endsWith('.json')).sort(); }
    catch { /* missing dir => zero receipts */ }
    files = names.map((n) => join(dir, n));
    if (files.length === 0) {
      console.error(`GATE: FAIL — NO_EVIDENCE: no receipts under ${dir} (fail-closed)`);
      process.exit(1);
    }
  }
  if (files.length === 0) {
    console.error('error: pass one or more receipt files, or --all');
    process.exit(2);
  }

  let liveTreeHash;
  try { liveTreeHash = computeTreeHash(repo, opts.receiptsDir); }
  catch (e) {
    console.error(`GATE: FAIL — cannot hash live tree: ${e.message}`);
    process.exit(1);
  }

  let anyFail = false;
  for (const f of files) {
    const { receipt, failures } = verifyOne(f, liveTreeHash);
    const label = receipt?.claim ? `"${receipt.claim}"` : basename(f);
    if (failures.length === 0) {
      console.log(`PASS  ${label}  (${basename(f)})`);
    } else {
      anyFail = true;
      console.log(`FAIL  ${label}  (${basename(f)})`);
      for (const r of failures) console.log(`      - ${r}`);
    }
  }
  console.log(anyFail
    ? 'GATE: FAIL — do not advance the lifecycle. Fix, re-run the claim verification, re-verify.'
    : 'GATE: PASS — all checked receipts verify against the live tree.');
  process.exit(anyFail ? 1 : 0);
}

main();
