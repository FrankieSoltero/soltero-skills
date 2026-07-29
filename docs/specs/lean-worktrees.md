# Skill Spec — lean-worktrees

- **Problem:** Agents starting feature work either pollute the current
  checkout/main, create a second worktree while already inside one (detection
  skipped), bypass the harness's native worktree tool with raw `git worktree
  add` (phantom state), or create a project-local worktree directory that
  isn't gitignored (commits the whole tree). superpowers:using-git-worktrees
  covers this; the lean variant keeps detection → native tool → guarded
  fallback at lower word count.
- **Trigger:** Use when starting feature work that needs isolation from the
  current workspace, or before executing an implementation plan (lean-sdd
  Setup step 1). Lean variant of superpowers:using-git-worktrees.
- **Scope / non-goals:** Detect existing isolation first (GIT_DIR vs
  GIT_COMMON, submodule guard); prefer the platform's native worktree tool
  (e.g. EnterWorktree) over raw git; guarded git fallback (project-local
  `.worktrees/`, MUST verify gitignored before creating, sandbox fallback);
  project setup + clean test baseline before implementing. Consent: ask
  before creating a worktree unless the user's preference is already
  declared. Non-goals: doesn't decide integration (lean-finishing owns that);
  no remote/CI workspace management.
- **Success scenario:** Told to start a feature while already inside a linked
  worktree, the agent detects it and proceeds without creating a nested one;
  in a normal checkout with EnterWorktree available, it uses the native tool
  instead of `git worktree add`; in the git fallback it refuses to create
  `.worktrees/` until the directory is gitignored.
- **Bundled assets:** none. Derived from superpowers:using-git-worktrees
  (MIT, © 2025 Jesse Vincent), condensed.
