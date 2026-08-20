# Webhook Delivery Implementation Plan

> **For executors:** execute with soltero-skills:lean-sdd. The Task Dependency
> Table below is the scheduling and review-depth contract.

**Goal:** Deliver signed webhook events to customer endpoints with retry and a dead-letter queue.

**Architecture:** An outbox table is written in the same transaction as the domain event; a poller drains it through a signer and an HTTP dispatcher with exponential backoff; exhausted deliveries land in a dead-letter table exposed by an admin endpoint.

**Tech stack / test runner:** TypeScript, Fastify, Prisma/Postgres; `npx vitest run <file>`.

## Global Constraints

- Signature header: `X-Acme-Signature: sha256=<hex hmac>` over the raw body.
- Backoff schedule: 1s, 5s, 30s, 2m, 10m (5 attempts total), then dead-letter.
- Delivery timeout: 8000 ms per attempt.

## Task Dependency Table

| Task | Files touched | Depends on | Risk tier |
|------|---------------|------------|-----------|
| 1. Outbox schema + repository | `prisma/schema.prisma`, `src/outbox/repo.ts`, `tests/outbox/repo.test.ts` | — | standard |
| 2. Signer | `src/webhooks/signer.ts`, `src/config.ts`, `tests/webhooks/signer.test.ts` | — | standard |
| 3. Dispatcher | `src/webhooks/dispatcher.ts`, `tests/webhooks/dispatcher.test.ts` | 1 | judgment |
| 4. Backoff policy | `src/webhooks/backoff.ts`, `src/config.ts`, `tests/webhooks/backoff.test.ts` | — | mechanical |
| 5. Dead-letter admin endpoint | `src/routes/admin/dead-letters.ts`, `tests/routes/dead-letters.test.ts` | 1, 3 | |

Tasks 1, 2 and 4 touch disjoint files and may execute/review concurrently.

---

## Task 1: Outbox schema + repository

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/outbox/repo.ts`
- Test: `tests/outbox/repo.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `enqueue(tx: Prisma.TransactionClient, event: OutboxEvent): Promise<void>`; `claimBatch(limit: number): Promise<OutboxRow[]>`; `markDelivered(id: string): Promise<void>`; `markFailed(id: string, attempt: number, nextAt: Date): Promise<void>`

**Behavior:**

| Case | Input / state | Expected |
|------|---------------|----------|
| enqueue in tx | event inside a transaction that later rolls back | no row persisted |
| claimBatch | 12 due rows, limit 10 | 10 rows returned, each `claimed_at` set |
| claimBatch skips future | row with `next_attempt_at` in the future | not returned |
| markFailed | id, attempt 2, nextAt | row `attempts`=2, `next_attempt_at`=nextAt, `claimed_at` null |

**Verify:** `npx vitest run tests/outbox/repo.test.ts` → all pass
**Commit:** `feat(outbox): schema + repository`

## Task 2: Signer

**Files:**
- Create: `src/webhooks/signer.ts`
- Modify: `src/config.ts`
- Test: `tests/webhooks/signer.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `sign(rawBody: string, secret: string): string` (returns `sha256=<hex>`); `SIGNATURE_HEADER = "X-Acme-Signature"`

**Behavior:**

| Case | Input / state | Expected |
|------|---------------|----------|
| golden | body `{"id":"evt_1"}`, secret `whsec_test` | `sha256=2c1d3f7e3a3b7b0f5b2e1d9c8a7f6e5d4c3b2a1908f7e6d5c4b3a29180f7e6d5` |
| empty body | `""`, any secret | valid hex, 64 chars after prefix |

**Exact values:** header name `X-Acme-Signature`; config key `WEBHOOK_SIGNING_SECRET` (required, min 16 chars).

**Verify:** `npx vitest run tests/webhooks/signer.test.ts` → all pass
**Commit:** `feat(webhooks): HMAC signer`

## Task 3: Dispatcher

**Files:**
- Create: `src/webhooks/dispatcher.ts`
- Test: `tests/webhooks/dispatcher.test.ts`

**Interfaces:**
- Consumes: `claimBatch`, `markDelivered`, `markFailed` (Task 1); `sign`, `SIGNATURE_HEADER` (Task 2)
- Produces: `dispatchOnce(): Promise<{ delivered: number; failed: number }>`

**Behavior:**

| Case | Input / state | Expected |
|------|---------------|----------|
| 2xx | endpoint returns 204 | `markDelivered` called once |
| 5xx | endpoint returns 503 | `markFailed` called with attempt+1 |
| timeout | endpoint hangs > 8000 ms | request aborted, `markFailed` called |
| header | any delivery | request carries `X-Acme-Signature` from `sign` |

**Verify:** `npx vitest run tests/webhooks/dispatcher.test.ts` → all pass
**Commit:** `feat(webhooks): dispatcher`

## Task 4: Backoff policy

**Files:**
- Create: `src/webhooks/backoff.ts`
- Modify: `src/config.ts`
- Test: `tests/webhooks/backoff.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `nextDelayMs(attempt: number): number | null`

**Behavior:**

| Case | Input / state | Expected |
|------|---------------|----------|
| schedule | attempts 1..5 | 1000, 5000, 30000, 120000, 600000 |
| exhausted | attempt 6 | `null` |

**Verify:** `npx vitest run tests/webhooks/backoff.test.ts` → all pass
**Commit:** `feat(webhooks): backoff policy`

## Task 5: Dead-letter admin endpoint

**Files:**
- Create: `src/routes/admin/dead-letters.ts`
- Modify: `src/routes/index.ts`
- Test: `tests/routes/dead-letters.test.ts`

**Interfaces:**
- Consumes: `claimBatch` (Task 1)
- Produces: `GET /admin/dead-letters?limit=` → `{ items: DeadLetter[] }`

**Behavior:**

| Case | Input / state | Expected |
|------|---------------|----------|
| list | 3 dead-lettered rows | 200, 3 items, newest first |
| auth | missing admin token | 401 |

**Verify:** `npx vitest run tests/routes/dead-letters.test.ts` → all pass
**Commit:** `feat(admin): dead-letter endpoint`
