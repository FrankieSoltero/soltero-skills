# Prisma Safety Review — Reference

Detailed rationale and exact fixes for each checklist item. Consult on demand; the SKILL.md
table is the quick pass.

## Table of contents
1. Bulk writes (transactions + pool)
2. Pagination stability
3. N+1 queries
4. Version drift
5. Migration hygiene
6. Indexes & uniqueness
7. Pool configuration

---

## 1. Bulk writes — transactions + connection pool

Per-row writes fanned out with `Promise.all` open one pooled connection each. On a small pool
(Supabase/pgBouncer default ~10–20) this exhausts the pool and you get `P2024` timeouts that
also starve unrelated requests. It is **also non-atomic**: if row 200 fails, rows 1–199 are
already committed, leaving a half-applied state.

```ts
// BAD — N connections, non-atomic
await Promise.all(rows.map((r) =>
  prisma.order.update({ where: { id: r.id }, data: { status: r.status } })));

// GOOD — one transaction (atomic, one connection)
await prisma.$transaction(
  rows.map((r) => prisma.order.update({ where: { id: r.id }, data: { status: r.status } }))
);

// BETTER for large N — a single set-based statement
await prisma.$executeRaw`
  UPDATE "Order" AS o SET status = v.status
  FROM (VALUES ${Prisma.join(rows.map((r) => Prisma.sql`(${r.id}, ${r.status})`))}) AS v(id, status)
  WHERE o.id = v.id`;
```

Also watch sequential `await prisma.…` inside a `for` loop — correct but slow; batch it.

## 2. Pagination stability

`orderBy` on a non-unique column (e.g. `createdAt`) has undefined order within ties, so cursor
or offset pages silently skip or duplicate rows. The cursor field must also match the sort.

```ts
// BAD — non-unique sort, cursor field (id) != sort field (createdAt)
prisma.post.findMany({ take: 20, cursor: { id }, skip: 1, orderBy: { createdAt: "desc" } });

// GOOD — total order with a unique tiebreaker, keyset on the same tuple
prisma.post.findMany({
  take: 20,
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  ...(cursor ? { cursor: { createdAt_id: cursor }, skip: 1 } : {}),
});
```

## 3. N+1 queries

A query per row in a loop multiplies round-trips.

```ts
// BAD — 1 + N queries
for (const p of posts) p.author = await prisma.user.findUnique({ where: { id: p.authorId } });

// GOOD — relation include (one query)
prisma.post.findMany({ include: { author: true } });
// GOOD — or one batched lookup, then map
const authors = await prisma.user.findMany({ where: { id: { in: posts.map((p) => p.authorId) } } });
```

Pair with `select` to avoid over-fetching sensitive columns (password hashes, tokens).

## 4. Version drift

`prisma` (CLI/engine) and `@prisma/client` must be the **same exact version**; a mismatch
produces runtime query failures and engine errors. The bundled
`scripts/check-prisma-versions.mjs` enforces this. Pin both (no `^`/`~` skew across them).

## 5. Migration hygiene

- **`db push` on a Migrate-managed project** generates no migration file and desyncs the DB from
  `prisma/migrations` history (drift). Use `prisma migrate dev` locally and `migrate deploy` in
  CI/prod. `db push` is only for prototyping on a non-migration DB.
- **`NOT NULL` column with no `@default` on a populated table** fails the `ALTER TABLE` on
  existing rows. Add a `@default`, or do expand → backfill → contract (add nullable → backfill →
  set NOT NULL).
- **Destructive changes** (drop column, change type) need a data plan and ideally a backup; never
  let them ride along silently.

## 6. Indexes & uniqueness

Postgres does **not** auto-index foreign-key columns. Add `@@index` on FK columns and on columns
used in frequent `where`/`orderBy`. Add `@unique` where business logic assumes uniqueness (e.g.
`email`) — its absence is both a correctness and a data-integrity bug.

```prisma
model Order {
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  @@index([customerId])
}
```

## 7. Pool configuration

Match the pool `max` to real concurrency and set a sane idle timeout. On serverless/edge,
prefer a pooled connection string (pgBouncer) and keep per-invocation concurrency low. This is
advisory — flag obvious mismatches, don't prescribe a number blindly.
