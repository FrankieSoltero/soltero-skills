# Webhook Notifier — Design Spec (approved)

Node 20 / TypeScript service module inside an existing Express codebase
(`src/`, tests in `tests/` with vitest, run via `npx vitest run <file>`).

## Goal

Deliver outbound webhook notifications to customer endpoints, rate-limited per
customer, with signed payloads.

## Components

### 1. Token-bucket rate limiter (`src/notifier/rateLimiter.ts`)

- Per-customer token bucket: capacity **20**, refill **5 tokens/second**.
- `tryAcquire(customerId: string): boolean` — consumes one token or returns false.
- Buckets created lazily on first use; injectable clock for tests.

### 2. Payload signer (`src/notifier/signer.ts`)

- HMAC-SHA256 over the raw JSON body using the customer's secret.
- Signature sent as hex in header **`X-Notify-Signature-256`**, prefixed `sha256=`.
- Timestamp header **`X-Notify-Timestamp`** (unix seconds) is part of the signed
  input: `"{timestamp}.{body}"`.
- `sign(body: string, secret: string, timestamp: number): { signature: string; headers: Record<string, string> }`

### 3. Dispatcher (`src/notifier/dispatcher.ts`)

- `dispatch(event: NotifyEvent): Promise<DispatchResult>` where
  `NotifyEvent = { customerId: string; endpoint: string; secret: string; payload: object }`.
- Uses the rate limiter: over-limit events return `{ status: "throttled" }` without
  an HTTP call.
- Signs every outgoing request with the signer.
- POSTs JSON with a **5s** timeout; non-2xx or timeout returns
  `{ status: "failed", httpStatus?: number }`; success returns `{ status: "delivered" }`.
- No retries in v1 (explicitly out of scope).

## Constraints

- No new runtime dependencies (Node `crypto` and global `fetch` only).
- All public names exactly as given above.
- Rate limiter and signer must not import each other; only the dispatcher composes them.
