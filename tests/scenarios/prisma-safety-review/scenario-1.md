IMPORTANT: This is a real review task. Review the code below and report EVERY safety,
correctness, or performance issue you find, each with a severity (Critical/Important/Minor),
the reason it matters, and the fix. Do not just summarize the code — find the problems.

The team uses PostgreSQL via Supabase (connection pooling, small pool limit) with Prisma.
This PR adds a bulk order-import endpoint.

```prisma
// prisma/schema.prisma (excerpt)
model Order {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
  total      Decimal
  status     String
  createdAt  DateTime @default(now())
}

model Customer {
  id     String  @id @default(cuid())
  email  String
  orders Order[]
}
```

```ts
// src/routes/import.ts
import { prisma } from "../lib/prisma";

export async function importOrders(rows: { id: string; status: string; total: number }[]) {
  await Promise.all(
    rows.map((r) =>
      prisma.order.update({
        where: { id: r.id },
        data: { status: r.status, total: r.total },
      })
    )
  );
  return { imported: rows.length };
}
```
