---
name: lean-finishing
description: Use when implementation is complete and a feature branch needs integrating — after lean-sdd's final review or any finished work. Fresh full-suite run on the exact tree first, then the integration menu (merge locally / push + PR / keep) unless the user already explicitly delegated the choice; discard only on the typed word `discard`; protected mains (PR-only, required checks, squash-only) get routed through a PR instead of force-pushed. Lean variant of the finish-a-development-branch step.
---

# Lean Finishing

## Overview

Verify fresh → detect environment → decide (menu or delegated) → execute →
clean up. Integration is the human's decision unless they have explicitly
handed it to you; deletion is never inferred from tone.

## Step 1 — Fresh verification, on this exact tree

Run the full suite (+ typecheck/lint where they exist) AFTER the last
change. A green run from an hour ago does not cover the amend you made
since. Red → stop and report; the menu comes after green.

## Step 2 — Detect environment & base

- `git rev-parse --git-dir` vs `--git-common-dir` → normal repo, linked
  worktree, or detached HEAD (detached: no local-merge option; push as a new
  branch instead).
- Confirm the base branch (plan, conversation, or upstream); if unsure, ask —
  merging into the wrong base is expensive to undo.
- Check protection BEFORE choosing a path:
  `gh api repos/{owner}/{repo}/branches/<base> --jq .protected` (or just
  attempt and read the rejection).

## Step 3 — Decide

**Default: present the menu and wait.**

```
Implementation complete, suite green (fresh run: <evidence>).
1. Merge back to <base> locally
2. Push and create a Pull Request
3. Keep the branch as-is
Which option?
```

**Explicit-delegation conditional:** if the user has already said in so many
words that the choice is yours ("wrap it up however you think is best, just
get it integrated"), skip the menu, pick the path that fits the repo's
conventions and protection rules, and report what you did. "They seem done
with it" is not delegation; only their explicit words are.

**Discard** is never a menu item and never inferred. On an explicit
get-rid-of-it request, itemize exactly what dies (branch, each commit
hash+subject, worktree path, "never pushed — no remote copy") and require
the typed word `discard`. Anything else → leave everything in place.

## Step 4 — Execute

- **Merge locally:** from the main checkout — checkout base, pull, merge,
  re-run the suite on the merged result (red → stop, nothing pushed,
  recoverable), push.
- **Protected base (GH013 / "changes must be made through a pull request"):**
  do NOT retry or force-push — rulesets ignore `--force`. Reset local base to
  origin, push the feature branch, open the PR, watch the required checks,
  merge with the repo's ALLOWED method (query
  `--jq '{merge:.allow_merge_commit,squash:.allow_squash_merge,rebase:.allow_rebase_merge}'`
  — squash-only repos reject the rest), sync local, report the URL. If a
  human approval is required, hand the user the PR URL — that gate is policy,
  not an obstacle.
- **Push + PR:** push -u, create the PR against the confirmed base per repo
  conventions, keep the worktree (PR feedback lands there).
- **Keep as-is:** report branch + worktree path.

## Step 5 — Cleanup (merge and confirmed-discard only)

From outside the worktree, and only for worktrees under `.worktrees/` or
`worktrees/` (ours to clean): `git worktree remove <path> && git worktree
prune`, then `git branch -d <branch>` (`-d`, not `-D` — it proves the merge;
`-D` only for confirmed discards). Anything elsewhere belongs to the host —
leave it.

| Excuse | Reality |
|--------|---------|
| "Tests passed earlier" | Only the tree they ran on. Fresh run on what you're integrating. |
| "They obviously want it merged" | Menu and wait — unless they explicitly delegated, in words. |
| "'Get rid of it I guess' is confirmation" | Itemize the loss; only typed `discard` deletes. |
| "Force-push will get past the rejection" | Rulesets ignore force. Route through the PR. |
| "It's merged" (locally, push rejected) | Nothing is merged until it's on the remote. Say the true state. |

---

*Derived from superpowers:finishing-a-development-branch (MIT, © 2025 Jesse
Vincent), condensed; adds the explicit-delegation conditional and
protected-branch routing.*
