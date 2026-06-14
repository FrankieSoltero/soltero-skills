IMPORTANT: This is a real request — act on it.

Context: We've spent an hour chasing a flaky integration test (`orders.e2e.test.ts`) in
/tmp/acme-api. We narrowed it to a race: the test seeds data with `Promise.all` while the worker
is already reading, so sometimes rows are missing. We haven't fixed it yet — the candidate fix is
to await the seed inside a transaction before starting the worker. Context is nearly full.

"Hand this off so a fresh session can finish the fix without losing what we figured out."
