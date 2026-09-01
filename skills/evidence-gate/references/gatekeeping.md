# Gatekeeping Protocol — Details

## Producer flow (claimant)

1. Finish the work. Commit (or at least stage) it — untracked files are invisible to
   `treeHash` (see receipt-format.md, v1 limits).
2. For each lifecycle claim, run `create-receipt.mjs` with the real verification
   command. Do not run the command separately and paste its output — the script must
   observe the run itself.
3. If the command fails, the red receipt stands as the open finding. Fix the code,
   re-run the SAME claim through the script; the green receipt overwrites the red one.
4. Commit receipts (and their output files) with the work they certify.
5. Your hand-written report may summarize the receipts; it can never replace them.

## Gatekeeper flow

1. Run `verify-receipt.mjs --all` (or per-receipt) in the repo root.
2. Exit 0 → the gate is satisfied; advance the transition and cite the receipt paths.
3. Exit non-zero → block. Quote the printed verdicts verbatim (STALE_TREE,
   OPEN_FINDING, …) to the claimant with the fix: re-run `create-receipt.mjs` against
   the current tree for the named claims.
4. Never substitute inline re-execution for verification as a habit — re-running a
   1-second suite yourself works at toy scale but produces no durable artifact and does
   not scale to 25-minute suites. If you do re-run, do it THROUGH `create-receipt.mjs`
   so a receipt results.
5. If the claimant is gone (session ended), produce the receipt yourself with
   `create-receipt.mjs`. Advancing without a receipt is the only forbidden move.

## Resolving an open finding

A red receipt (exitCode != 0) blocks `--all` gating until its claim re-verifies green
against the current tree. Do not delete red receipts to unblock a gate; deletion is
evidence destruction — the honest paths are (a) fix and re-run the claim, or (b) a
human explicitly decides the claim no longer gates this transition and removes it in a
reviewed commit that says so.

## Custom receipts dir

Both scripts accept `--receipts-dir`. The dir is excluded from `treeHash`, so producer
and verifier MUST use the same value or hashes will disagree. Default
`Docs/evidence/receipts/` unless the repo has a documented reason.

## Sibling-skill integration

Receipts are the interchange format for the gardener/patcher family (built in parallel;
reference by name only — no file dependencies):

- `memory-gardener` — verified-by stamps can point at a receipt path instead of
  restating "verified on <date>" prose.
- `skill-gardener` — audit findings can cite the red receipt that evidences the
  failure, and closure requires that claim's green receipt.
- `skill-patcher` — patch PRs can attach receipts certifying the patched skill's gates
  ran green against the PR's tree.

## Cost model

Measured 2026-07 against Sonnet-class agents, not re-baselined since: ~1.2x token/time
overhead versus a plain retry loop; up to ~3.8x versus fully ungated operation. Treat them
as an order of magnitude. Budget for it at lifecycle gates; keep everything else
advisory-only. If you find yourself gating more than a handful of claims per ticket,
the scope is wrong, not the budget.
