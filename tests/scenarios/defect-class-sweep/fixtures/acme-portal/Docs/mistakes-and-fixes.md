# Mistakes and fixes

## 2026-06-11 — Cancelled order still showed as open after a refresh
The cancel handler updated the row and the local component state, but the orders cache
still held the pre-cancel list. Added an explicit invalidate in the UI layer for that one
screen.

## 2026-07-02 — Profile email change did not appear for ~30 seconds
Same shape: write went through, read came from the cache until the TTL expired. We told
the customer to wait.

## 2026-08-04 — Address change silently reverted in the checkout summary
Write succeeded, checkout read a stale cached profile, then wrote the stale copy back over
the new address. Frank: "this is the third time this month. it's always the cache."

## 2026-08-26 — Team roster showed a removed member
Cache again. Patched the one endpoint.
