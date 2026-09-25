// Shared deterministic logic for evidence-gate receipts.
// Contract: Docs/specs/evidence-gate.md + references/receipt-format.md. Do not drift.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

export const DEFAULT_RECEIPTS_DIR = 'Docs/evidence/receipts';

export const REQUIRED_FIELDS = [
  'claim', 'command', 'args', 'cwd', 'exitCode',
  'outputDigest', 'treeHash', 'timestamp', 'producedBy',
];

export function sha256Hex(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

export function slugify(claim) {
  const slug = String(claim).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  if (!slug) throw new Error('claim produces an empty slug');
  return slug;
}

/** Tracked file paths from `git ls-tree -r HEAD`, excluding the receipts dir. */
export function listTrackedFiles(repoDir, receiptsDir = DEFAULT_RECEIPTS_DIR) {
  const res = spawnSync('git', ['ls-tree', '-r', 'HEAD', '--name-only', '-z'],
    { cwd: repoDir, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  if (res.error) throw new Error(`git ls-tree failed: ${res.error.message}`);
  if (res.status !== 0) {
    throw new Error(`git ls-tree failed (is ${repoDir} a git repo with a commit?): ${res.stderr.toString('utf8').trim()}`);
  }
  const prefix = receiptsDir.replace(/\/+$/, '') + '/';
  return res.stdout.toString('utf8').split('\0')
    .filter((p) => p.length > 0 && !p.startsWith(prefix))
    .sort();
}

/**
 * Hash of the tracked source tree at this moment: the `git ls-tree`-derived file
 * list of HEAD, each paired with a sha256 of its CURRENT worktree content (so
 * uncommitted edits to tracked files change the hash), receipts dir excluded.
 * Limitations (v1, documented): new untracked files do not affect the hash.
 */
export function computeTreeHash(repoDir, receiptsDir = DEFAULT_RECEIPTS_DIR) {
  const files = listTrackedFiles(repoDir, receiptsDir);
  const lines = files.map((p) => {
    let fileHash;
    try {
      fileHash = sha256Hex(readFileSync(join(repoDir, p)));
    } catch {
      fileHash = 'MISSING';
    }
    return `${p} ${fileHash}`;
  });
  return 'sha256:' + sha256Hex(lines.join('\n'));
}

/** Structural completeness check. Returns array of problems (empty = complete). */
export function checkCompleteness(receipt) {
  const problems = [];
  if (typeof receipt !== 'object' || receipt === null || Array.isArray(receipt)) {
    return ['receipt is not a JSON object'];
  }
  for (const f of REQUIRED_FIELDS) {
    if (!(f in receipt)) { problems.push(`missing field: ${f}`); continue; }
    const v = receipt[f];
    if (f === 'args') {
      if (!Array.isArray(v)) problems.push('args must be an array');
    } else if (f === 'exitCode') {
      if (!Number.isInteger(v)) problems.push('exitCode must be an integer');
    } else if (typeof v !== 'string' || v.length === 0) {
      problems.push(`${f} must be a non-empty string`);
    }
  }
  return problems;
}
