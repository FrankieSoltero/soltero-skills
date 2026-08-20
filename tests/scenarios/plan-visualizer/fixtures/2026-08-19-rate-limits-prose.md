# Rate Limiting Implementation Plan

**Goal:** Per-API-key token-bucket rate limiting on the public API.

**Architecture:** A Redis-backed bucket store, a limiter middleware, and response headers.

**Tech stack / test runner:** TypeScript, Fastify, ioredis; `npx vitest run <file>`.

## Global Constraints

- Bucket capacity 20, refill 5 tokens/second.
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` (seconds, integer).

## Tasks

### Task 1: Bucket store
Create `src/ratelimit/store.ts` and `tests/ratelimit/store.test.ts`. Produces
`take(key: string, now: number): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }>`.
Uses a Lua script for atomic take.

### Task 2: Limiter middleware
Create `src/ratelimit/middleware.ts` and its test. Uses the store's `take`. Sets the three
headers; 429 with `Retry-After` when not allowed.

### Task 3: Key extraction
Create `src/ratelimit/key.ts` and its test. `apiKeyFrom(req): string | null` reading
`Authorization: Bearer <key>`; null → 401 upstream. Should be done before the middleware
is wired, obviously.

### Task 4: Wire into app
Modify `src/app.ts` to register the middleware on `/v1/*`. Smoke test in
`tests/app.ratelimit.test.ts`.

### Task 5: Docs
Add the headers section to `docs/api.md`.
