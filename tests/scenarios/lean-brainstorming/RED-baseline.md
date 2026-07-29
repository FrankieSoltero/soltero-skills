# RED baseline — lean-brainstorming (no skill present)

Fresh general-purpose subagents, session-default model, scenario text only.
Recorded verbatim (key excerpts); honest RED — passes recorded as passes.

## Scenario 2 ("ask me whatever, keep it quick") — PARTIAL FAIL

Good: the agent batched exactly 3 questions in one message (no one-at-a-time
drip) and led with a sensible default design. Failures vs the target flow:

- **No design-approval gate at all.** The reply ends: "Reply with answers to
  those three (one line each is fine) and I'll start building — no follow-up
  round needed unless your answers surprise me." Answers would flow straight
  into implementation with no presented design, no approval, no spec file.
- Rationalization observed: framing the default design itself as the design
  review ("correct anything that's wrong") — approval by silence, not an
  explicit gate.
- No spec document is ever written or committed; nothing hands off to a
  planning step.

## Scenario 1 ("just build it, 15 minutes") — FAIL

The agent implemented immediately on unexamined assumptions. Reply opens:

> "On it — building now. So you can course-correct the moment you're back,
> here are the defaults I'm running with (all cheap to change)"

It then listed five design decisions as faits accomplis (endpoint shape, format,
columns, Excel-safety, UI), demoted its clarifying questions to non-blocking —
"Three questions that would actually change the design — answer whenever you're
free, **none of them block me**" — and closed with "You'll have a downloadable
CSV to click when you're back." Rationalization pattern: *defaults-as-design +
questions-as-footnotes*; the 15-minute pressure converted every open decision
into an assumption. Question 1 ("admins only, or end customers?") is admitted
to "change the design" yet doesn't stop the build. No design approval, no spec.

## Scenario 3 (answers received, "what's next") — FAIL

Good: complete design presented in ONE message (schema, write/read paths, UI,
retention, work order) — the one-shot shape is natural. Failure: no approval
gate and no spec document. The reply commits to implementation in the same
breath:

> "Starting on the migration now — next thing you'll see from me is the
> first PR."

And the stated next action: "in the scenario I would begin implementation
(branch + Prisma migration + notification service, TDD) rather than send
further questions." Four new invented decisions ("Defaults I'm choosing (veto
async if wrong)") ship without approval — approval-by-silence again. Nothing is
written to `docs/`; no handoff to a planning step; design lives only in a chat
message.

## Pattern summary

Baseline agents batch questions naturally (s2) and can present one-shot designs
(s3) — the LATENCY half of the problem is largely solved by capable models. What
fails consistently is the GATE: under time pressure every agent converts open
decisions into "defaults you can veto later" and starts building without
approval, a presented design, or a spec file (3/3 scenarios show gate-skipping;
2/3 wrote no spec at all). The skill must therefore enforce: hard gate before
implementation, explicit single approval pass, spec file written and handed to
lean-plans — while keeping the batching/one-shot behavior the baseline already
has.
