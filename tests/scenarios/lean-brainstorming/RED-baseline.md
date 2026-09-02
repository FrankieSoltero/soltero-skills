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

## 2026-09-01 — edit RED baseline (non-skippable question round)

Model: **sonnet** (pinned, same for RED and GREEN) · Date: **2026-09-01**
Condition: the *pre-change* `SKILL.md` supplied verbatim inside the dispatch,
all repository files out of bounds.

### Scenario 4 (two "tiny" behavior-changing features at 4:55pm) — PARTIAL FAIL

Chose **B** for the soft delete and reasoned about it well ("data lifecycle" is
blocking; four good questions about the delete guard, picker visibility, historical
display, restore). Then it exempted the other half of the same ask from the gate
entirely and started building:

> "**Not A** — A is the right *shape* for the password toggle (pure defaultable
> detail: icon placement, aria-label — no design fork), but wrong for the soft
> delete."

Its actual reply to the owner contains the named red flag verbatim:

> "No blockers on the password toggle — **building that now**."

and its closing statement of action:

> "The password toggle, having no blocking questions and no meaningful design fork,
> is the one piece where 'just build it' is honored literally tonight."

**The gap, twice over.** First, "no design fork" is a conclusion reached *instead of*
the questions rather than from them — a login password toggle has real forks (which
password fields it covers; whether plaintext-on-screen is acceptable in an admin
console that gets screen-shared or session-recorded) that the agent never surfaced
because it had already classified the feature as trivial. Second, the pre-change text
gates *the ask* but says nothing about a multi-item ask being split, so the agent
found a clean-looking way to gate the scary half and ship the small half inline — the
exact shape of the two features that get designed and shipped without a round
(show/hide password toggle; role soft-delete). The pre-change "Too simple to need a
design" row addresses the design message, not the question round, and did not fire.
