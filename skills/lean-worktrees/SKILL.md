---
name: lean-worktrees
description: Use when starting feature work that needs isolation from the current workspace, or before executing an implementation plan (lean-sdd Setup) — detect existing isolation first, prefer the platform's native worktree tool (e.g. EnterWorktree) over raw git, and only then fall back to a guarded project-local git worktree that is verified gitignored before creation. Lean variant of superpowers:using-git-worktrees.
---

# Lean Worktrees

## Overview

Ensure work happens in an isolated workspace. **Detect → native tool →
guarded git fallback.** Isolation is a state requirement, not an action
requirement — creating a worktree you're already in duplicates state;
bypassing a native tool creates workspace state the harness can't see or
clean up.

## Step 0 — Detect existing isolation

```bash
git rev-parse --git-dir          # vs
git rev-parse --git-common-dir
git rev-parse --show-superproject-working-tree   # submodule guard
```

- git-dir ≠ common-dir AND the superproject check is empty → you are already
  in a linked worktree: report it ("already in isolated workspace at <path>
  on branch <name>") and skip to setup. Do NOT nest a second worktree.
- git-dir ≠ common-dir but superproject returns a path → submodule, not a
  worktree: treat as a normal checkout.
- Equal → normal checkout: if the user hasn't already declared a worktree
  preference, ask consent before creating one; if declined, work in place.

## Step 1 — Create (native first)

**Native tool (preferred):** if the platform has a worktree tool
(`EnterWorktree`, `/worktree`, `--worktree`), use it — it owns placement,
branching, and cleanup (paired with `ExitWorktree`). Raw `git worktree add`
next to a native tool is the #1 mistake: phantom state the harness can't
manage. The mechanism is your call, not a question for the user — consent to
"a worktree" was already given.

**Git fallback (only when no native tool exists):**

1. Directory: declared preference > existing `.worktrees/` > existing
   `worktrees/` > default `.worktrees/`.
2. **MUST verify ignored before creating** — worktree contents are ordinary
   untracked files to the parent checkout, and a broad `git add` commits the
   whole nested tree:

```bash
git check-ignore -q .worktrees || {
  echo '.worktrees/' >> .gitignore
  git add .gitignore && git commit -m "chore: ignore .worktrees/"
  git check-ignore -q .worktrees   # hard stop if still non-zero
}
git worktree add .worktrees/<branch> -b <branch>
```

3. Sandbox denial on `git worktree add` → say so and work in place.

## Step 2 — Setup + clean baseline

Run the project's install (`npm ci` / `cargo build` / `pip install` /
`go mod download`), then the test suite BEFORE writing any code — a dirty
baseline makes every later failure ambiguous. Failures → report and ask;
green → "Worktree ready at <path>, <N> tests passing."

## Quick Reference

| Situation | Action |
|-----------|--------|
| Already in linked worktree | Skip creation; setup + baseline in place |
| Submodule tripping the check | Normal-repo path |
| Native tool exists | Use it — never raw git beside it |
| Fallback dir not ignored | gitignore + commit + re-verify, THEN create |
| Baseline tests red | Report + ask; don't build on it |

---

*Derived from superpowers:using-git-worktrees (MIT, © 2025 Jesse Vincent),
condensed to the detect/native/guarded-fallback procedure.*
