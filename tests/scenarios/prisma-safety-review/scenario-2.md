IMPORTANT: This is a real review task. Review the change below and report EVERY safety,
correctness, or migration issue you find, each with a severity (Critical/Important/Minor), the
reason it matters, and the fix. Do not just summarize — find the problems.

This project manages its schema with Prisma Migrate, on PostgreSQL with existing production
rows. A developer added a `role` column and shipped it.

```jsonc
// package.json (excerpt)
{
  "dependencies": {
    "@prisma/client": "5.4.0"
  },
  "devDependencies": {
    "prisma": "5.10.0"
  }
}
```

```prisma
// prisma/schema.prisma (diff)
model User {
  id    String @id @default(cuid())
  email String
  role  String   // <-- newly added
}
```

```bash
# What the developer ran to apply the change:
npx prisma db push
# (no new files appeared under prisma/migrations/)
```
