---
name: cache-guard
description: Use when reading a value that a recent write may not have propagated to — enforces read-after-write verification against the source of truth instead of trusting a cache, CDN, or client-side store.
---

# Cache Guard

## Overview

A read that follows a write is not evidence the write landed. Verify against the source of
truth before reporting success, and treat a cache hit after a mutation as unproven.

## Hard rules

1. After any mutation, re-read from the source of truth, not the layer you just wrote past.
2. Invalidate on the write path; never rely on TTL expiry to make a test pass.
3. A stale read reproduced once is reproducible — do not "retry until green".
