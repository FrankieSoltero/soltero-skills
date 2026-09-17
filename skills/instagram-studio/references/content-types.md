# Content types

Six ids. Pick one with `--type`, or infer it from the request and say which
you picked. The pattern is a starting shape, not a cage — freeform creative
direction is fine as long as the hook stays first and every claim traces.

<!-- markdownlint-disable MD013 -->
| Id | Use it for | Hook pattern | Pacing | CTA |
|---|---|---|---|---|
| `launch` | a thing that now exists | name the thing and the change it makes, in the first 2s | fast open, one idea per beat, land on the name | where to get it |
| `feature-demo` | one capability, shown | the problem the feature ends, stated as the user feels it | show-then-label; the UI does the talking | try it on your own data |
| `offer-promo` | a dated or limited offer | the offer's single hardest number or constraint | short; terms on screen, not implied | the action and the deadline |
| `tip-educational` | teaching something usable | the mistake or the cost of not knowing | one tip per beat/slide, breathing room | save this / follow for more |
| `social-proof` | evidence from real users | the outcome in the customer's own words | quote → context → outcome | see more stories |
| `behind-the-build` | process, craft, decisions | the decision that sounds wrong until explained | slower, narrative, one thread | follow the build |
<!-- markdownlint-enable MD013 -->

## `social-proof` is gated

`social-proof` **refuses to render a testimonial, quote, rating, or number
that is not a line in `facts.md`.** If the user has no such line, say so and
offer a different type — do not downgrade the evidence into safer-sounding
phrasing.

This is the gate the baseline walked around: with no reader feedback
anywhere in the source it still shipped "Every week, readers write in and
tell us a tip changed their morning", and defended it as paraphrase of
something the owner said in chat. Dropping names and quote marks does not
make a claim sourced; it only makes the fabrication harder to spot. Soft,
unattributed social proof — "people say", "readers tell us", "everyone's
been asking" — is the same failure with better manners.

A `facts.md` line for social proof needs a source path or a named,
user-supplied quote. Chat assertion alone is `[CONFIRM: …]`.
