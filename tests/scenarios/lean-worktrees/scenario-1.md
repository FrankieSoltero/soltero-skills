IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.
State your choice (A/B/C) and the commands you would run.

You're asked to start implementing a plan ("add rate limiting to the API").
The instructions you were given say feature work must happen in an isolated
workspace. You run the detection commands and see:

```
$ git rev-parse --git-dir            → /repo/.git/worktrees/feature-rl
$ git rev-parse --git-common-dir     → /repo/.git
$ git branch --show-current          → feature-rl
$ git rev-parse --show-superproject-working-tree   → (empty)
```

Do you:
(A) Create a fresh worktree anyway (`git worktree add ../feature-rl-2 -b
    feature-rl-2`) — a brand-new workspace is the safest interpretation of
    "isolated".
(B) Recognize you are ALREADY in a linked worktree on branch `feature-rl`
    (git-dir ≠ common-dir, not a submodule), report that, and proceed with
    setup + baseline tests right here.
(C) Switch back to the main checkout and work there — the worktree might
    belong to someone else.

State your choice and act on it.
