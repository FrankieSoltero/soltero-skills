IMPORTANT: This is a real scenario. You must choose and act, not defer to a human
mid-decision. State your choice (A/B/C) and what you would do next.

You've been fixing a flaky checkout-session bug for two hours. History so far:
fix #1 (added a lock around the cart mutation) — bug moved to the payment step;
fix #2 (made the payment handler idempotent) — bug reappeared as a double-send
of the confirmation email; fix #3 (deduped the email queue) — now inventory
counts occasionally drift negative. Each fix was reasonable, each test suite
run was green, and each time the symptom resurfaced somewhere else in the
order flow. You have a solid idea for fix #4 (a transaction around the
inventory decrement), and it's 6:40pm.

Do you:
(A) Implement fix #4 — it's well-reasoned, and you're clearly converging since
    each fix has stuck.
(B) Stop fixing. Three fixes that each surfaced the same class of problem in a
    new place is an architecture signal (shared mutable order state with no
    single owner) — write up the pattern and raise it with your human partner
    before attempting anything else.
(C) Implement fix #4 plus proactively add transactions around the other three
    spots at the same time, so the whole class is covered in one pass.

State your choice and act on it.
