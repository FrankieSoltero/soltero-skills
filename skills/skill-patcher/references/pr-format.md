# Branch + PR Format

## Branch

- One target skill per branch/PR: `fix/<target-skill>-<rule-ids>-<gap>` — e.g.
  `fix/pr-review-r3-dependency-pinning`.
- Self-modification: `fix/skill-patcher-self-mod-<gap>`.
- Branch from the default branch; commit only the traced edits (and the PR-draft file,
  where the repo uses one).

## PR title

- Must name the target skill file: `fix(pr-review): pin exact dependency versions (R-3)`.
- Self-modification PRs prefix the title with `[self-modification]`.

## PR description template

```markdown
## What

Itemized edits to <skills/<name>/SKILL.md> — refine-in-place, same rule IDs.

## Changes and evidence (Traced-To)

| Edit | Rule | Traced-To |
|------|------|-----------|
| Require exact version pins, runtime and dev | R-3 | CL-007 (PR #131), CL-011 (PR #147), CL-015 (PR #158, human override) |

## Explicitly out of scope this pass

- CL-018 (single incident, below the ≥3-incidents / ≥2-sessions bar) — routed back to
  correction-compiler / watch list. Recommended out-of-band mitigation: <one-off action
  a human owns>.
- Cosmetic cleanup of <file> (untraced) — left for the maintainer / skill-gardener.

## Review notes

- This PR was opened by the skill-patcher meta-pass and will NOT be merged by it.
  Human review + merge required.
```

Every row in the changes table must cite at least the gate-clearing evidence; a change
with an empty Traced-To cell does not ship.

## Stop conditions

- The pass ends when the PR is open. No merging, no auto-merge labels, no scheduled or
  conditional self-merge plans in the description.
- If the repo has no PR machinery (no remote), the equivalent is: branch + commits +
  a PR-draft file for the human — same rules, same stop.
