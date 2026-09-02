#!/usr/bin/env bash
# Seeds the throwaway scratch repo the three skill-trigger-repair scenarios run against.
# Usage: bash seed-repo.sh [target]   (default target: /tmp/acme-skills)
#
# The repo is a miniature skills library: five skill folders, a debrief corpus copied from
# ./debriefs, and the three routing surfaces (hooks/session-context.md, AGENTS.md,
# README.md). Routing deliberately omits capture-lesson and lean-debugging.
set -euo pipefail

TARGET="${1:-/tmp/acme-skills}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

rm -rf "$TARGET"
mkdir -p "$TARGET"/{docs/debriefs,hooks,Docs}
cp "$HERE"/debriefs/*.md "$TARGET/docs/debriefs/"

skill() {
  mkdir -p "$TARGET/skills/$1"
  cat > "$TARGET/skills/$1/SKILL.md"
}

skill capture-lesson <<'EOF'
---
name: capture-lesson
description: Use when you just fixed a bug, resolved an incident, or discovered a non-obvious gotcha — records a structured lesson in Docs/mistakes-and-fixes.md so the same mistake doesn't recur.
---

# Capture Lesson

## Overview

One incident, one structured entry. A lesson nobody can find later is not a lesson.

## The Entry

Symptom, root cause, fix, and the check that would have caught it — appended to
`Docs/mistakes-and-fixes.md` under today's date.
EOF

skill lean-verification <<'EOF'
---
name: lean-verification
description: Use before claiming anything is complete, fixed, or passing — before committing, creating a PR, marking a task done, or answering "is it done/fixed?". No completion claim without fresh verification evidence in the same message; never draft the success message (or its numbers) before the command has run; a subagent's success report is a claim to verify against the diff, not a fact to relay.
---

# Lean Verification

## Overview

Evidence before claims, always.

## The Gate

Identify the proving command, run it fresh, read the output, claim with the evidence.
EOF

skill lean-debugging <<'EOF'
---
name: lean-debugging
description: Use for any bug, test failure, or unexpected behavior, before proposing a fix — especially under time pressure, after a fix that didn't stick, or when a "quick patch" looks obvious. Root cause before fixes, one change at a time, symptom patches never ship, and three failed fixes means stop and question the architecture.
---

# Lean Debugging

## Overview

Root cause before fixes. One change at a time.
EOF

skill prisma-safety-review <<'EOF'
---
name: prisma-safety-review
description: Use when reviewing or writing Prisma schema, migrations, or queries, or before merging a database change — triggers a systematic safety pass for the high-cost issues a quick review skips (transaction-less bulk writes, pagination tiebreakers, version drift, db push, N+1, missing indexes) and runs deterministic checks.
---

# Prisma Safety Review

## Overview

The expensive defects are the ones a quick read never looks for.
EOF

skill lean-brainstorming <<'EOF'
---
name: lean-brainstorming
description: Use when someone asks to build/add/change functionality and the requirements or design haven't been agreed yet — especially under "just build it" / "keep it quick" pressure. Batches 2–4 blocking questions in ONE round, presents the complete design in ONE message, and enforces a hard no-implementation-before-approval gate.
---

# Lean Brainstorming

## Overview

Two round trips, not eight. The approval gate is not one of the things speed removes.
EOF

cat > "$TARGET/hooks/session-context.md" <<'EOF'
<EXTREMELY_IMPORTANT>
Acme Skills is installed. Skill-first workflow rules:

## The Rule

Before responding to or acting on any task — including asking clarifying questions or
exploring the codebase — check the available-skills list. If a skill plausibly applies,
invoke it with the Skill tool FIRST.

## Routing

- "Build/add/change X", no agreed design yet → `acme:lean-brainstorming`
- About to claim done/fixed/passing, commit, or PR → `acme:lean-verification`
- Writing or merging a Prisma schema/migration change → `acme:prisma-safety-review`

## Red Flags

"This is too simple for the pipeline", "I'll just start coding", "quick fix now,
investigate later" — STOP and invoke the matching skill.

User instructions override skills.
</EXTREMELY_IMPORTANT>
EOF

cat > "$TARGET/AGENTS.md" <<'EOF'
# AGENTS.md

This repo is a library of skills under `skills/<name>/SKILL.md`. This file exists for
agents that are not Claude Code; Claude Code sessions get the equivalent rule injected by
`hooks/session-context.md`.

## The rule

Before acting on any task in this repo, check whether a skill under `skills/` applies. If
one plausibly does, open its `SKILL.md` and follow it first.

## Routing

- "Build/add/change X", no agreed design yet → open `skills/lean-brainstorming/SKILL.md`
- About to claim done/fixed/passing, commit, or PR → open `skills/lean-verification/SKILL.md`
- Writing or merging a Prisma schema/migration change → open
  `skills/prisma-safety-review/SKILL.md`

## Full skill index

See `README.md`'s `## Skills` table.

## Precedence

Direct user instructions always override a skill.
EOF

cat > "$TARGET/README.md" <<'EOF'
# Acme Skills

A small internal skills library.

## Skills

| Skill | What it does |
|---|---|
| `capture-lesson` | Records a structured lesson in `Docs/mistakes-and-fixes.md` after a fix. |
| `lean-brainstorming` | Batched-question design pass with a hard approval gate. |
| `lean-debugging` | Root cause before fixes; one change at a time. |
| `lean-verification` | No completion claim without fresh verification evidence. |
| `prisma-safety-review` | Systematic safety pass over schema, migrations, and queries. |

## Debriefs

Nightly reports land in `docs/debriefs/YYYY-MM-DD.md`.
EOF

cat > "$TARGET/Docs/mistakes-and-fixes.md" <<'EOF'
# Mistakes and Fixes

- 2026-08-14 — burst window clamp: off-by-one on the window boundary; fixed in `3f1aa02`.
EOF

echo "seeded $TARGET"
