# Corrections Ledger

Written by correction-compiler. One entry per compiled correction.

### CL-007

- **Rule ID:** CL-007
- **Category:** review/dependencies
- **Trigger Origin:** human correction (PR #131 review thread)
- **Scope:** repo
- **Constraint:** Never approve a PR that adds a dependency with a floating version
  range.
- **Rationale:** Agent approved `lodash: ^4.17.0`; a caret-drift minor broke the build
  two weeks later.
- **Added:** 2026-06-18
- **Traced-To:** session 2026-06-18-a; PR #131; skills/pr-review/SKILL.md R-3
- **Enforcement:** hook (pre-approve advisory)
- **Status:** active

### CL-011

- **Rule ID:** CL-011
- **Category:** review/dependencies
- **Trigger Origin:** human correction (PR #147 review thread)
- **Scope:** repo
- **Constraint:** Dependency additions must pin an exact version; lockfile alone is not
  sufficient.
- **Rationale:** Agent approved `dayjs: ~1.11`; reviewer had to revert after a
  transitive bump changed timezone behavior.
- **Added:** 2026-06-29
- **Traced-To:** session 2026-06-29-c; PR #147; skills/pr-review/SKILL.md R-3
- **Enforcement:** hook (pre-approve advisory)
- **Status:** active

### CL-015

- **Rule ID:** CL-015
- **Category:** review/dependencies
- **Trigger Origin:** human rejection (PR #158 approval overridden)
- **Scope:** repo
- **Constraint:** Treat dev-dependencies the same as runtime dependencies for version
  pinning during review.
- **Rationale:** Agent approved an unpinned dev-dependency (`vitest: ^2`) reasoning
  "dev-only, low risk"; CI images drifted and the suite went red for two days.
- **Added:** 2026-07-10
- **Traced-To:** session 2026-07-10-b; PR #158; skills/pr-review/SKILL.md R-3
- **Enforcement:** hook (pre-approve advisory)
- **Status:** active

### CL-018

- **Rule ID:** CL-018
- **Category:** review/secrets
- **Trigger Origin:** human correction (incident INC-42 postmortem)
- **Scope:** repo
- **Constraint:** Review must run a secrets scanner over the full file contents of every
  touched file, not just the diff hunks.
- **Rationale:** A hardcoded API key sat 30 lines above a diff hunk in a touched file;
  the agent's diff-only scan (per R-4) missed it and it reached a client-visible branch.
- **Added:** 2026-07-14
- **Traced-To:** session 2026-07-14-a; incident INC-42; skills/pr-review/SKILL.md R-4
- **Enforcement:** hook (pre-approve advisory)
- **Status:** active
