---
name: code-optimizer
description: Use when asked to clean up, optimize, or slim down a codebase — remove dead and redundant code, dedupe, split oversized files (including ones still in live use), and enforce the project's coding guidelines across the whole repo. Applies changes on a branch driven by a `.code-optimizer.yml` config with a public-API allowlist, one gate-verified commit per category (serial, revert-on-red), so cleanup is systematic and reproducible instead of ad hoc detective work. Whole-repo; not a diff reviewer (use /simplify or /code-review for a diff).
---

# Code Optimizer

## Overview

A capable agent asked to "clean up this repo" will already choose the careful path — it keeps
code it can't prove dead and runs the tests. That is not the gap. The gap is *how*: keep/delete
decisions get made by one-off detective work (reading a function, invoking it by hand to see if
it fires) instead of an explicit allowlist that scales to a real repo; commits and the test gate
get applied inconsistently — one big "clean up" commit instead of a gated commit per category;
and the harder categories — splitting an oversized file that's still imported, deduping a live
block — get flagged and left for later instead of executed. This skill closes those specific
gaps: a `.code-optimizer.yml` config with a public-API allowlist replaces per-symbol detective
work, every category is applied as its own commit behind an observed green/red test gate with
revert-on-red, and all four categories run to completion in every pass — including splitting a
LIVE oversized file, not just deleting orphaned ones.

Core principle: **config-driven, gate-enforced, serial-per-category — a change is kept only
after the project's own verify commands pass with observed output for that commit alone; a
keep/delete decision is never made by ad-hoc reasoning when the allowlist and gate can decide it,
and no category is left "flagged but not done."**

## When to Use

- "Clean up / optimize / slim down this repo", remove dead or redundant code, shorten/simplify,
  split large files, or enforce the project's coding guidelines across the codebase.

## When NOT to Use

- Reviewing a diff / pending changes — use the host `/simplify` or `/code-review`.
- Performance/algorithmic optimization, or any change that alters behavior — out of scope.
- A repo whose test suite is already failing — stop and report; never "optimize" a red baseline.

## Guardrails (do these first, every time)

1. **Clean tree + new branch.** Refuse to start on a dirty tree; create `chore/code-optimizer`.
2. **Config + public-API allowlist.** Read `.code-optimizer.yml` (see `reference.md` for schema).
   If absent, GENERATE one by discovering the project's declared standards (CLAUDE.md/AGENTS.md,
   ESLint/Prettier/ruff/.editorconfig, observed file-size norms), write it, and ask the user to
   review before applying. It defines: verify commands, max file length, tools to run, exclude
   paths, and the **public-API allowlist that must never be treated as dead**. The allowlist
   exists precisely so keep/delete decisions don't depend on someone reading and testing each
   symbol by hand — it is the mechanism that scales past a handful of files.
3. **Green baseline.** Run the verify commands (test + typecheck + lint) and OBSERVE them pass.
   If red, stop and report — do not proceed.

## Phase 1 — Detect (read-only)

Detect the stack and run the ecosystem's real tools for candidates (see `reference.md` for the
per-language matrix): dead code / unused exports, duplication, oversized files, guideline
violations. Produce a categorized, evidence-backed candidate list. **Candidates are tool-flagged,
never eyeballed-only.** "No static caller" is a candidate, not a verdict — check for dynamic/
string-based references and allowlisted entry points before treating anything as dead, and record
the decision in the allowlist rather than relying on having personally verified it this one time.

## Phase 2 — Apply (serial, one commit per category, gate after each)

In this order, each its own commit:
1. **Dead/unused removal** — only tool-flagged AND not allowlisted; confirm reachable-nowhere.
2. **Redundancy & shortening** — dedupe copy-paste, simplify verbose constructs; behavior-preserving.
3. **File splitting** — files over threshold split along export/responsibility seams; rewire
   imports. This applies to files that are still imported and in live use, not only unreferenced
   ones — a live oversized file must be split and gate-verified like any other change.
4. **Guideline fixes** — apply config rules linters/formatters can't auto-fix.

After EACH change: run the verify commands and OBSERVE the output. Green → commit. Red → revert
(`git revert`/reset), log it as skipped, continue. Never batch categories into one commit.

All four categories run to completion every pass. A category that only produces a flag — "this
file is over the limit," "this block looks duplicated" — is not finished; apply the split or the
dedupe and gate-verify it. Only a gate failure or an explicit allowlist entry justifies leaving a
candidate untouched; "I noted it for later" is not a valid stopping point.

## Deliverable

A branch of verified commits + a summary: removed/shortened/split/fixed, what was skipped and why
(gate failure or allowlisted), before/after metrics (LOC, file count, largest file), and changes
that couldn't be automated safely for manual follow-up. Open a PR.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "No caller references it, so it's dead — delete it." | "No static caller" is a candidate, not a verdict. Dynamic dispatch / string-keyed registries / public API look callerless. Confirm with a tool + the gate + the allowlist, or keep it. |
| "I'll just read the code and try invoking it myself to see if it's really used." | That one-off detective work doesn't scale past a single symbol on a small repo. Record the keep decision in the config's public-API allowlist so the next run — and the next reviewer — doesn't have to redo it. |
| "Move fast — delete, shorten, and split in one commit." | Serial, one category per commit, gate after each. A batched commit means a broken test can't be traced and the whole cleanup is suspect. |
| "The change is obviously safe, I don't need to re-run tests." | Every change re-runs the gate with observed output, per commit. "Obviously safe" refactors are precisely the ones that silently break dynamic paths. |
| "I flagged the oversized file / the duplication — that's a good result, I'll leave the actual split for later." | Flag-then-skip leaves a whole category incomplete. A tool-flagged oversized file that's still imported must be split, and the duplication deduped, gate-verified the same as any other change — not merely noted. |

## Red Flags — STOP

- About to remove code on judgment alone (no tool flag), or that's on the public-API allowlist.
- About to keep or delete a callerless candidate by ad-hoc reasoning — reading it, running it by
  hand — instead of recording the decision in the config's allowlist.
- About to start on a dirty tree, on main, or without an observed green baseline.
- About to commit more than one category together, or commit without running the verify gate and
  observing it pass.
- About to leave the file-splitting or deduplication category as "flagged" instead of applying and
  gate-verifying it — including on a file that's still live/imported.
