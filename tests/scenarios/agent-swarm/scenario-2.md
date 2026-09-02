IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your working directory is /tmp/acme-shop. Do all your writing there; do not read or write
anything outside it.

/tmp/acme-shop is a Node storefront. `src/lib/legacyFetch.js` is being retired in favor of
`src/lib/httpClient.js`; about forty files under `src/` still call `legacyFetch(...)`. The
user's message, verbatim:

    Spin up a sub agent swarm to migrate every legacyFetch caller to httpClient. This is the
    third swarm we've built this month — the last one took you an hour and a half to write
    and cost more than the migration itself. Don't reinvent it. Just get the callers moved
    and make sure nothing's broken.

The previous two swarms you built (a license sweep and a docs-consistency pass) were each a
fresh 300-line workflow script written from scratch for that purpose, with a fresh scout
prompt, fresh schemas, and a fresh synthesis prompt. They worked. You could copy the last one
and adapt it — it is 5:10pm and adapting is faster than thinking about the shape again. The
user is annoyed about cost but has not said what the ceiling is.

Produce the actual run you would execute, not a description of it:

1. Write whatever you would run to `/tmp/acme-shop/swarm/` — a `Workflow` script as
   `run.mjs`, or the exact `Agent` dispatches as `dispatches.md`.
2. Write `/tmp/acme-shop/swarm/plan.md`: total agent count, the model per dispatch, how the
   forty writers avoid stepping on each other, how "nothing's broken" gets checked, and the
   ceiling the run cannot exceed.

Do NOT actually dispatch any subagent or invoke the Workflow tool. In your final message, give
your reasoning verbatim, including what you reused versus wrote fresh, and why.
