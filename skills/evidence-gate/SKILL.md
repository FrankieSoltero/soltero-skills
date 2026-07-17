---
name: evidence-gate
description: Use when making, accepting, or acting on a lifecycle-advancing claim — phase change, review pass, test certification, "done", "merge-ready" — as claimant or gatekeeper. Replaces prose claims with hash-bound, fail-closed JSON receipts under Docs/evidence/receipts/, produced and mechanically re-verified by bundled scripts; missing, stale, incomplete, or red evidence blocks the transition, and an agent's own "tests pass" report is never evidence.
---

# Evidence Gate

## Overview

Lifecycle claims advance on receipts, not prose. A receipt binds a real command run
(exit code + output digest) to the exact source tree it ran against (tree hash), so a
later gate can re-verify it mechanically, offline, with zero trust in anyone's report.
The gate is FAIL-CLOSED: the default answer is no.

## When to Use

- You are about to claim a lifecycle transition: phase change, review pass, test
  certification, "done", "merge-ready" → produce a receipt.
- You are about to accept or act on someone else's such claim → demand and verify a
  receipt.

## When NOT to Use

- Advisory content — developer notes, rationale, design docs, ordinary progress
  updates. No receipts required; do NOT extend the gate to cover them. The machinery is
  expensive (see Cost) — spend it only on claims that actually move the lifecycle.

## Producing evidence (claimant)

Run the verification command through the bundled script — it records exit code, digests
the full output, and hashes the tracked tree:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/create-receipt.mjs \
  --claim "unit tests pass for <ticket/branch>" \
  --produced-by "<agent/session id>" \
  -- npm test
```

- Writes `Docs/evidence/receipts/<claim-slug>.json` + the full output alongside it.
- A failing command still writes the receipt (red, `exitCode != 0`) and that is the
  point: **a red receipt is a durable open finding that blocks the gate** — never record
  a failure only in ticket/chat prose.
- Receipt filenames are deterministic per claim: the only way to turn a claim's red
  receipt green is to re-run *that claim's* verification, so a newer clean pass on some
  other claim never masks a still-open finding.
- Commit the receipt with the work it certifies.

## Gating (gatekeeper)

Never improvise hashing or verification logic, and never re-derive it inline — the
deterministic logic ships in the bundled script; use it:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/verify-receipt.mjs --all          # gate everything
node ${CLAUDE_SKILL_DIR}/scripts/verify-receipt.mjs <receipt.json> # gate one claim
```

Exit 0 = advance. Exit non-zero = the transition is blocked; report the printed reasons
and require the claimant to fix and re-run `create-receipt.mjs` against the current tree.

| Verdict | Meaning | Your move |
|---------|---------|-----------|
| `NO_EVIDENCE` | No receipts exist for the gate | Block. Prose is not a fallback. |
| `INCOMPLETE` | Missing/mistyped required fields | Block. Regenerate via the script. |
| `MISSING_OUTPUT` / `OUTPUT_DIGEST_MISMATCH` | Stored output absent or altered | Block. Evidence is unauthorized/tampered. |
| `STALE_TREE` | Live tree no longer matches `treeHash` | Block. No exceptions (below). |
| `OPEN_FINDING` | Receipt records a failed run | Block until that claim re-verifies green. |

**STALE_TREE is not a judgment call.** Do not read the diff to decide the change was
"only a comment", "only docs", "can't affect tests". Commit messages lie, diffs get
misread, and the whole value of hash-binding is that no one has to make that call.
Stale means re-run the verification against the current tree — even when the suite is
slow and the deadline is real. If the deadline can't absorb a re-run, the transition
waits; that is what fail-closed means.

## Hard rules

1. Natural-language reports — including your own, including relayed-by-orchestrator —
   are NEVER evidence for a gated claim. Neither is pasted command output: unscripted
   text has no digest and no tree binding, and is exactly as forgeable as prose.
2. Only receipts produced by `create-receipt.mjs` (or byte-compatible with the contract
   in `references/receipt-format.md`) count. One shared contract — do not invent per-repo
   evidence formats; sibling tools consume this one.
3. The gate verifies *binding*, not *adequacy*. Whether `npm test` is the right command
   or the coverage is sufficient is a human/reviewer decision — flag adequacy concerns
   separately; do not silently widen the gate into a coverage/lint audit.
4. If the claimant is unavailable, the gatekeeper may produce the receipt itself by
   running `create-receipt.mjs` — what is forbidden is advancing without one.

## Cost (honest)

Expect roughly ~1.2x token/time overhead versus a plain retry loop and up to ~3.8x
versus fully ungated operation. That is the price of machine-checkable lifecycle state;
pay it only at lifecycle gates (see When NOT to Use).

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "The report is specific and the agent is reliable." | Specific prose is still prose. Receipts or block. |
| "The lead pre-approved green suites." | Pre-approval assumed evidence would exist. It doesn't. Block. |
| "The last commit only touched a comment." | You don't know that, and you don't need to. STALE_TREE blocks. |
| "Re-running the suite misses the deploy window." | Fail-closed means the window moves, not the gate. |
| "I'll advance now and attach evidence after." | Post-hoc evidence is decoration. The gate runs before the transition. |
| "I'll paste the test output into the receipts dir." | Undigested, unbound text. Use `create-receipt.mjs`. |
| "I'll write my own quick hash check." | Improvised hashing produced three wrong answers in baseline testing. Use `verify-receipt.mjs`. |
| "The failure is noted in the ticket, that's recorded." | Prose findings get masked by the next green run. Red receipts don't. |
| "This progress note needs a receipt too, to be safe." | Advisory content is exempt. Gating it burns the overhead budget for nothing. |

## Red Flags — STOP

- About to advance a lifecycle state with an empty `Docs/evidence/receipts/` → run the gate; it will say NO_EVIDENCE for a reason.
- About to reason about a diff to excuse a treeHash mismatch → stop; re-run verification.
- Writing sha256/tree-hash logic by hand → stop; the bundled script is the algorithm.
- Recording a verification failure anywhere other than a red receipt → stop; run `create-receipt.mjs` and let it fail.
- Demanding receipts for a design note → stop; you're gating advisory content.

## Details

`references/receipt-format.md` — the shared receipt contract (field-by-field, treeHash
algorithm, naming, v1 limits, HMAC hardening as a future option).
`references/gatekeeping.md` — producer/gatekeeper protocol details, resolving open
findings, sibling-skill integration (`memory-gardener`, `skill-gardener`, `skill-patcher`).
