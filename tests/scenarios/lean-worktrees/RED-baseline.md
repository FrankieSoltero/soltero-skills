# RED baseline — lean-worktrees (no skill present)

Fresh general-purpose subagents; docs/, skills/, agents/ out of bounds.
Honest RED — all three default-model runs PASSED.

## Default model (session model): 3/3 PASS

- **s1 (already in a linked worktree):** chose B, read the git-dir vs
  common-dir signature correctly, applied the submodule guard, refused the
  nested worktree ("'Isolated workspace' is a state requirement, not an
  action requirement"), and ran setup + baseline tests in place.
- **s2 (fallback dir not gitignored):** chose B; called out that option A's
  premise is false ("the very check already run proves it: check-ignore
  exited 1"), committed the .gitignore line FIRST, re-verified with
  check-ignore before `git worktree add`, with an explicit hard stop on
  failure.
- **s3 (native tool vs muscle memory):** chose B — "the decision criterion is
  not which mechanism I trust or know best — it's which mechanism the harness
  can see and manage"; used ToolSearch to load EnterWorktree and planned
  ExitWorktree for teardown. Rejected asking the user (C) as burning a turn
  on an implementation detail.

Caveat: the scenarios hand the agent the detection outputs and the correct
policy inside option B — they test choosing, not recalling. The detection
commands, submodule guard, ignore-verification, and native-tool-first order
are reference content an agent must be ABLE to reproduce cold; that is what
the skill carries.

## Cheap-tier probe (haiku, s2): PASS

Correct order (gitignore → commit → check-ignore verify → worktree add) with
the right reasoning ("someone running `git add .` ... could accidentally
commit the worktree contents").

## Conclusion → skill scope

Judgment passes at the default tier; the skill is the recallable procedure
(detect → native tool → guarded fallback → baseline) plus the floor for
cheaper tiers, referenced by lean-sdd's Setup step.
