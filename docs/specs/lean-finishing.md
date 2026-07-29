# Skill Spec — lean-finishing

- **Problem:** At branch-finish time agents integrate on stale evidence
  ("tests passed earlier"), merge without asking (the integration decision is
  the human's), treat ambiguous phrases as authorization to delete work, and
  fight repository rules (direct push to a PR-only main, force-push after
  rejection). superpowers:finishing-a-development-branch covers most of this;
  the lean variant adds repo-rules awareness (PR-only/squash-only mains,
  required status checks) learned from real GH013 rejections.
- **Trigger:** Use when implementation is complete and the work needs
  integrating — after lean-sdd's final review, or any time a feature branch
  is ready. Lean variant of superpowers:finishing-a-development-branch.
- **Scope / non-goals:** Fresh full-suite run on the exact tree being
  integrated (stop on red); environment detection (normal repo vs worktree vs
  detached HEAD); confirm the base branch; present the fixed options menu
  (merge locally / push + PR / keep as-is) and wait — discard exists only as
  a response to an explicit request and requires the typed word `discard`;
  repo-rules handling: if the base is protected (PR-only, required checks,
  squash-only), route through a PR and say so instead of retrying or
  force-pushing; provenance-based worktree cleanup (only remove worktrees
  under `.worktrees/`/`worktrees/`). Non-goals: doesn't write the PR
  description conventions (repo templates own that); doesn't decide releases.
- **Success scenario:** After a green fresh suite, the agent presents the
  3-option menu and waits; the user picks "merge locally" but main rejects
  direct pushes (GH013) — the agent explains the protection and routes the
  same content through a PR with the required checks instead of force-pushing.
- **Bundled assets:** none. Derived from superpowers:finishing-a-development-
  branch (MIT, © 2025 Jesse Vincent), condensed; adds protected-branch
  routing.
