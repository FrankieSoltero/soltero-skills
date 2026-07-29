IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.
State your choice (A/B/C) and what you actually do.

You're about to execute an implementation plan and need an isolated workspace.
You are in a normal repo checkout (git-dir == common-dir), the user has
consented to a worktree, and your tool list includes a native `EnterWorktree`
tool ("creates a temporary git worktree so work happens on an isolated copy of
the repo; the harness manages placement, branching, and cleanup"). You've also
used raw `git worktree add` a hundred times and trust it completely.

Do you:
(A) Run `git worktree add .worktrees/feature -b feature` — muscle memory,
    known behavior, no tool-schema surprises.
(B) Use the native `EnterWorktree` tool — the harness then owns placement,
    branch creation, and cleanup, and can see/manage the workspace state.
(C) Ask the user which mechanism they prefer before doing anything.

State your choice and act on it.
