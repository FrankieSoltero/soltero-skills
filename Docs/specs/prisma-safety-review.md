# Skill Spec — prisma-safety-review

- **Problem:** Prisma code review by a general agent reliably catches the obvious issues but
  misses the high-cost, non-obvious ones that bite in production: connection-pool exhaustion
  from `Promise.all` over per-row writes outside a transaction, unstable cursor pagination
  (no unique tiebreaker), `prisma`/`@prisma/client` version drift, `db push` on a
  migration-managed DB, non-null columns added without a default/backfill, missing indexes on
  foreign keys, and N+1 query loops. These recur across Prisma-heavy codebases.

- **Trigger:** Use when reviewing or writing Prisma schema, migrations, or query code — or
  before merging any database change. Symptoms: a PR touches `schema.prisma`, `prisma/migrations/`,
  `package.json` Prisma deps, or files that call `prisma.*` query methods.

- **Scope:** A judgment review skill. It runs a structured checklist over the changed Prisma
  code (diff-first) or a target path (audit mode), bundles small detection scripts for the
  mechanical checks, and emits severity-tagged findings (Critical / Important / Minor) with
  file:line, why it matters, and the fix. It reviews; it does not auto-rewrite code.

  **Non-goals:** Not a general code reviewer (Prisma/DB concerns only). Not a migration runner.
  Not a replacement for `security-compliance-review` (RLS/authz overlap is flagged, not deeply
  audited here).

- **Checks (the heart):**
  1. **Pool exhaustion** — `Promise.all` / `Promise.allSettled` over N `prisma.*` writes
     outside a single `$transaction` (Supabase/pgBouncer pools are small). Also non-atomic
     partial-failure data integrity.
  2. **Pagination stability** — cursor/offset `orderBy` without a unique tiebreaker (e.g. `id`),
     and cursor field not matching `orderBy` field.
  3. **N+1** — per-row `findUnique`/`findFirst` in a loop instead of `include`/`in` batch.
  4. **Version drift** — `prisma` and `@prisma/client` not on the exact same version.
  5. **Migration hygiene** — `db push` on a migration-managed project (no migration file);
     non-null column added with no `@default` and no backfill on a populated table; destructive
     changes (drop column / type change) without a plan.
  6. **Indexing** — foreign-key columns and frequent `where`/`orderBy` columns without
     `@@index`; missing `@unique` where business logic assumes uniqueness.
  7. **Connection config** — pool `max` vs actual concurrency; missing idle timeout (advisory).

- **Success scenario:** Given a PR that adds a bulk-import route using `Promise.all` over
  `prisma.order.update` plus a schema with an unindexed foreign key, the agent flags the
  pool-exhaustion risk (Critical) and the missing FK index (Important) with fixes — issues a
  baseline review misses.

- **Bundled assets (scripts, for the mechanical checks):**
  - `scripts/check-prisma-versions.mjs` — fails if `prisma` ≠ `@prisma/client` exact version.
  - `scripts/scan-prisma-antipatterns.mjs` — greps changed/target files for `Promise.all(` near
    `prisma.` writes and per-row `findUnique` in loops; advisory, points the human at lines.
  - `reference.md` — the full checklist with the fix for each finding + good/bad examples.

- **Assumptions to confirm in review:** (a) diff-first with an audit fallback is the right
  default; (b) Postgres/Supabase is the primary target (the pool-exhaustion emphasis); (c)
  scripts are advisory aids, the judgment lives in SKILL.md.
