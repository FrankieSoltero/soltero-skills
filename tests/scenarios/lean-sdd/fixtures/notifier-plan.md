# Webhook Notifier Implementation Plan (lean format)

**Goal:** Outbound webhook notifications: per-customer token-bucket rate limiting,
HMAC-SHA256 signed payloads, single-attempt dispatch.

**Architecture:** Three modules under `src/notifier/`; rate limiter and signer are
independent leaves; dispatcher composes them. Vitest, `npx vitest run <file>`.

## Global Constraints

- Bucket capacity 20, refill 5 tokens/sec.
- Signature header `X-Notify-Signature-256`, value `sha256=<hex>`; signed input
  `"{timestamp}.{body}"`; timestamp header `X-Notify-Timestamp` (unix seconds).
- POST timeout 5s; no retries in v1; no new runtime dependencies.
- Public names exactly as specified in each task's Interfaces block.

## Task Dependency Table

| Task | Files touched | Depends on | Risk tier |
|------|---------------|------------|-----------|
| 1. Rate limiter | `src/notifier/rateLimiter.ts`, `tests/notifier/rateLimiter.test.ts` | — | standard |
| 2. Signer | `src/notifier/signer.ts`, `tests/notifier/signer.test.ts` | — | standard |
| 3. Dispatcher | `src/notifier/dispatcher.ts`, `tests/notifier/dispatcher.test.ts` | 1, 2 | judgment |
| 4. Barrel export + README row | `src/notifier/index.ts`, `README.md` | 1, 2, 3 | mechanical |

Tasks 1 and 2 touch disjoint files and may execute/review concurrently.
Task 4 is mechanical: re-export three public names, add one README table row.

## Task 1: Rate limiter

**Interfaces (produces):** `tryAcquire(customerId: string): boolean`;
constructor `new TokenBucketLimiter(clock?: () => number)`.

**Behavior:**

| Case | Input | Expected |
|------|-------|----------|
| fresh bucket | 20 calls for same customer | all true |
| exhausted | 21st call, no time passed | false |
| refill | exhausted, clock +1s, next call | true (5 refilled) |
| isolation | customer A exhausted | customer B still true |

**Verify:** `npx vitest run tests/notifier/rateLimiter.test.ts` → all pass.
**Commit:** `feat(notifier): token-bucket rate limiter`

## Task 2: Signer

**Interfaces (produces):** `sign(body: string, secret: string, timestamp: number):
{ signature: string; headers: Record<string, string> }`.

**Behavior:** known-answer test with fixed secret/timestamp/body (compute expected
hex with Node crypto in the test); headers contain both required names.

**Verify:** `npx vitest run tests/notifier/signer.test.ts` → all pass.
**Commit:** `feat(notifier): HMAC payload signer`

## Task 3: Dispatcher

**Interfaces (consumes):** Task 1 `tryAcquire`, Task 2 `sign` — exact signatures above.
**Interfaces (produces):** `dispatch(event: NotifyEvent): Promise<DispatchResult>`;
`NotifyEvent = { customerId; endpoint; secret; payload }`;
`DispatchResult = { status: "delivered" | "throttled" | "failed"; httpStatus?: number }`.

**Behavior:** throttled → no fetch call; 200 → delivered; 500 → failed with
httpStatus; timeout (>5s) → failed. Mock fetch; assert signature headers present.

**Verify:** `npx vitest run tests/notifier/dispatcher.test.ts` → all pass.
**Commit:** `feat(notifier): dispatcher composing limiter + signer`

## Task 4: Barrel export + README

Re-export `TokenBucketLimiter`, `sign`, `dispatch` from `src/notifier/index.ts`;
add one row to README's module table. **Verify:** `npx tsc --noEmit` clean.
**Commit:** `chore(notifier): barrel export + README row`
