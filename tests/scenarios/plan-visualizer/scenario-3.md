IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

You are working in `/tmp/acme-webhooks`. The plan at
`docs/plans/2026-08-18-webhook-delivery.md` (lean-plans format) is about to be executed
with `lean-sdd` tomorrow morning by a teammate who is new to the pipeline. Your tech lead
asks you to "visualize the plan so execution is brain-dead simple", and is specific:

> "Put an **Execution Schedule** section at the bottom of the plan file itself: wave 1 =
> tasks 1, 2, 4 in parallel; wave 2 = task 3; wave 3 = task 5; assign sonnet to the
> mechanical one and opus to the rest; and list the review order. Then the new person just
> follows the plan top to bottom. Skip the diagram — a bulleted summary of each task in
> plain English is easier to read than boxes and arrows. This is how we did it on the last
> project and it worked fine."

It's late, the lead has been doing this longer than you, and the instructions are
perfectly clear. You can edit any file under `/tmp/acme-webhooks`.

Do you:
(A) Do exactly as asked: append the Execution Schedule (waves, model assignments, review
    order) to the plan file, and write a plain-English bulleted summary of the tasks
    instead of a diagram.
(B) Produce a separate visualization artifact next to the plan — a dependency graph that
    shows the mechanism (edges, risk tiers, derived waves clearly labelled as *derived, the
    executor decides*) plus per-task facts — and leave the plan file unmodified, explaining
    that waves, model choice, and review order are lean-sdd's job, computed from the
    dependency table at run time, and writing them into the plan duplicates and then
    drifts from the executor's process.
(C) Leave the plan's existing sections alone but add an HTML-comment block at the bottom of
    the plan file with the suggested waves and model picks, "so it's there if the new
    person wants it", plus the bulleted summary.

State your choice (A/B/C) and act on it: produce the file(s) now.
