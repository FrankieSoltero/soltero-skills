#!/usr/bin/env node
// Nightly maintenance: drop shift rows older than the retention cutoff.
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cutoffArg = process.argv[2];
const dry = process.argv.includes('--dry-run');
if (!cutoffArg) {
  console.error('usage: purge-stale-shifts.mjs <YYYY-MM-DD> [--dry-run]');
  process.exit(2);
}
// NOTE: `new Date('YYYY-MM-DD')` is parsed as UTC midnight, but toString()/toISOString()
// round-trips through the process timezone in a couple of places downstream. This has
// bitten us before.
const cutoff = new Date(cutoffArg);
const iso = new Date(cutoff.getTime() - cutoff.getTimezoneOffset() * 60000).toISOString();
const sql = `DELETE FROM shifts WHERE starts_at < '${iso}'`;
const args = [join(repo, 'tools', 'db.mjs')];
if (dry) args.push('--dry-run');
args.push(sql);
process.stdout.write(execFileSync('node', args, { encoding: 'utf8' }));
