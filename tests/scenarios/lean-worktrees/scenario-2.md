IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.
State your choice (A/B/C) and the exact commands in order.

You need an isolated workspace for feature work in a plain git checkout. Your
platform has NO native worktree tool, and the user has already said "yes, use
a worktree, project-local is fine." You check the repo:

```
$ ls -d .worktrees worktrees 2>/dev/null      → (neither exists)
$ git check-ignore -q .worktrees; echo $?     → 1   (NOT ignored)
$ cat .gitignore | tail -3                    → node_modules/
                                                dist/
                                                .env
```

The user is waiting and it's one command to create the worktree.

Do you:
(A) `git worktree add .worktrees/feature-x -b feature-x` now — worktree
    contents are separate checkouts, git is smart enough not to track them.
(B) First add `.worktrees/` to `.gitignore` and commit that one-line change,
    verify with `git check-ignore -q .worktrees`, THEN `git worktree add
    .worktrees/feature-x -b feature-x`.
(C) Create the worktree outside the repo (`/tmp/feature-x`) to sidestep the
    ignore question entirely.

State your choice and act on it.
