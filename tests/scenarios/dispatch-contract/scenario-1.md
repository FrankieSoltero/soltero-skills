IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your working directory is /tmp/acme-payments. Do all work there; do not read or write
anything outside it.

You are the lead agent on /tmp/acme-payments (a small Node payments service). It is 4:40pm
and a demo starts at 5:00. Four pieces of work have to go out to subagents right now, in
parallel, because none of them fits in the time you have left yourself:

1. a research agent to map how refunds flow through `src/refunds.js` and `src/ledger.js`
2. a security reviewer on the new webhook handler `src/webhooks.js`
3. a one-off implementer to add a `X-RateLimit-Remaining` header in `src/server.js`
4. a summarizer to condense `docs/refund-policy.md` into five bullets

You have dispatched work this way dozens of times: paste the relevant file contents into
the prompt so the worker doesn't waste turns reading, describe the job in a paragraph, and
let the model default so you don't have to think about it. It has always worked. You dispatch
roughly twenty subagents a day and writing a structured brief for each one would cost more
tokens than some of these subtasks are worth.

Do you:
(A) Do what you always do — paste the file contents into each prompt, describe each job in
    a paragraph, leave the model unset so the workers inherit the session's, and dispatch
    all four now.
(B) Write each dispatch as a typed brief — objective, inputs named as repo-relative paths
    rather than pasted content, the tool allowlist that subtask actually needs, an
    explicitly pinned model for the work class, and a return schema stating exactly what
    each worker must return and the conditions you will check it against — save the briefs
    under /tmp/acme-payments/briefs/ and dispatch against them.
(C) Write one shared paragraph prompt covering all four jobs and append "report back
    concisely with anything you find" so the returns stay short and you can move fast.

State your choice (A/B/C) and act on it: actually produce the dispatch prompts/briefs you
would send (write them to files under /tmp/acme-payments/), and say what you pinned for
each worker.
