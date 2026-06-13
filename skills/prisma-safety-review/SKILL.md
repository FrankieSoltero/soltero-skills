---
name: prisma-safety-review
description: Use when reviewing or writing Prisma schema, migrations, or queries, or before merging a database change — triggers a systematic safety pass for the high-cost issues a quick review skips (transaction-less bulk writes, pagination tiebreakers, version drift, db push, N+1, missing indexes) and runs deterministic checks.
---

# Prisma Safety Review

## Overview

A capable review already catches the obvious Prisma issues. This skill exists for two things a
quick pass misses: it **triggers a systematic review before a DB change merges**, and it nails
the quiet, high-cost items (atomicity, indexes, pagination tiebreakers). Run the two scripts,
then walk the checklist.

## When to Use

- A change touches `schema.prisma`, `prisma/migrations/`, the Prisma deps in `package.json`,
  or code that calls `prisma.*`.
- Before merging any database change — even a "small" one.

## When NOT to Use

- Non-Prisma database code, or general (non-DB) code review.

## Step 1 — Run the deterministic checks

```bash
node ${CLAUDE_SKILL_DIR}/scripts/check-prisma-versions.mjs            # prisma vs @prisma/client exact-match
node ${CLAUDE_SKILL_DIR}/scripts/scan-prisma-antipatterns.mjs <paths> # Promise.all-over-writes + N+1 loops (heuristic)
```

## Step 2 — Walk the checklist (high-cost, easy-to-skip)

| Check | Look for | Fix |
|-------|----------|-----|
| **Bulk writes** | `Promise.all`/`allSettled` over per-row `prisma` writes; `await prisma` in a loop | one `$transaction` (atomic) or a batch op (`updateMany`, `INSERT … ON CONFLICT`) — also avoids pool exhaustion |
| **Pagination** | cursor/offset `orderBy` with no unique tiebreaker; cursor field ≠ `orderBy` field | order by `[sortField, id]` and keyset on the same tuple |
| **N+1** | `findUnique`/`findFirst` per row in a loop | `include: { relation: true }` or one `findMany({ where: { id: { in: [...] } } })` |
| **Versions** | `prisma` ≠ `@prisma/client` exact version | pin both to the same exact version |
| **Migrations** | `db push` on a Migrate-managed project; `NOT NULL` column added with no `@default` on a populated table; drop/type-change with no plan | `migrate dev`/`deploy`; add `@default` or expand → backfill → contract |
| **Indexes** | FK columns and frequent `where`/`orderBy` columns without `@@index` | add `@@index`; `@unique` where business logic assumes it |
| **Pool config** | pool `max` vs real concurrency; missing idle timeout (advisory) | size the pool to the workload; cap concurrency |

Full rationale, good/bad examples, and exact fixes: `reference.md`.

## Output

Report findings as **Critical / Important / Minor**, each with `file:line`, why it matters, and
the fix. Review only — don't rewrite code unless asked.

## Red Flags — STOP

- A bulk write hits the DB per-row with no `$transaction` → **Critical** (pool exhaustion *and*
  non-atomic partial failure).
- A migration adds a `NOT NULL` column with no default to a populated table → it fails on deploy.
- Cursor pagination whose cursor field isn't the `orderBy` field → pages are silently wrong
  (skips/dupes). Key the cursor on the **exact `orderBy` tuple**, and make that tuple unique.
- "Looks fine, it's a small DB change" → run the two scripts and the checklist anyway; the quiet
  issues (atomicity, missing index, tiebreaker) are exactly the ones a glance misses.
