# Receipt Format — SHARED CONTRACT

This is the contract sibling tools consume (`memory-gardener` verified-by stamps,
`skill-gardener` audit findings, `skill-patcher` patch PRs). Changes here are breaking
changes and require coordination — do not drift, do not fork per-repo variants.

## Storage

- One JSON file per claim under `Docs/evidence/receipts/` in the target repo.
- Filename: `<slug(claim)>.json` — lowercase, non-alphanumerics collapsed to `-`,
  max 60 chars. Deterministic per claim: re-running a claim's verification OVERWRITES
  its receipt. This is the mechanism behind "a newer clean pass never masks a still-open
  earlier finding": only re-running claim X's own command can change claim X's receipt.
- Full command output stored alongside as `<slug>.output.txt` (or wherever the
  receipt's `outputPath` points, relative to the receipt file).

## Fields (all required)

| Field | Type | Meaning |
|-------|------|---------|
| `claim` | string | The lifecycle claim certified, e.g. `"unit tests pass for ACME-4477"` |
| `command` | string | Executable run (no shell interpretation) |
| `args` | array of strings | Arguments passed |
| `cwd` | string | Absolute directory the command ran in |
| `exitCode` | integer | Exit code. `0` = green; anything else = red receipt / open finding |
| `outputDigest` | string | `sha256:<hex>` of the full combined stdout+stderr bytes |
| `outputPath` | string (optional) | Path to the stored output, relative to the receipt; defaults to `<slug>.output.txt` |
| `treeHash` | string | `sha256:<hex>` binding to the tracked source tree (algorithm below) |
| `timestamp` | string | ISO-8601 run time. Informational only — never a substitute for `treeHash` |
| `producedBy` | string | Agent/session id of the producer |

## treeHash algorithm (normative)

1. List tracked files via `git ls-tree -r HEAD --name-only -z` in the repo root.
2. Exclude every path under the receipts dir (`Docs/evidence/receipts/` by default —
   receipts must not invalidate themselves).
3. Sort paths lexicographically.
4. For each path, sha256 the file's CURRENT worktree bytes (so uncommitted edits to
   tracked files change the hash); a tracked file missing from the worktree hashes as
   the literal string `MISSING`.
5. Join lines `"<path> <hex>"` with `\n`; treeHash = `"sha256:" + sha256(joined)`.

Implemented once in `scripts/receipt-lib.mjs` — never re-derive it by hand.

## Known v1 limits (stated, not hidden)

- **Untracked files are invisible** to `treeHash`: a brand-new file not yet `git add`ed
  does not change the hash. Committing (or staging) work before certifying it closes
  this gap; gates on commit-shaped transitions (merge-ready) inherit git's tracking.
- **No cryptographic signing in v1.** Hash-binding + digests defeat staleness and
  accidental drift, not a deliberate forger with write access to the receipts dir.
  HMAC signing (receipt-body HMAC, key from the environment, additive `signature` +
  `keyId` fields) is specced as an optional hardening level and intentionally NOT
  implemented in v1.
- `timestamp` and `producedBy` are self-reported by the producer; trust anchors are the
  hashes, not these fields.
