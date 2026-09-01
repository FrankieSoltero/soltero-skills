---
name: content-marketing
description: Use when writing or editing any outward-facing marketing/content artifact — launch post, blog post, landing/hero copy, announcement, social post — or when asked to "promote"/"write copy for"/"make it punchy". Enforces the claim-trace gate on YOUR OWN drafting (every factual, feature, policy, or number claim traces to given facts or ships as a visible placeholder — the failure mode is inventing "free forever"-style specifics while correctly refusing the user's fake stats), mechanical platform-constraint checks, a 20-second brief, and a claims-table delivery contract. Parent of soltero-skills:seo-aeo and soltero-skills:email-marketing.
---

# Content Marketing

## Overview

You already refuse the founder's invented statistics. The failure this skill
closes is subtler: **while policing their dishonesty, your own drafting
invents specifics** — "Free forever. No card." when no such policy was
stated, "nothing phones home" as inferred fact, commitments made on the
founder's behalf. A claim doesn't become true because you wrote it in an
honest tone. **Every claim traces, including yours.**

## The Claim-Trace Gate (the hard rule)

Before delivery, every factual assertion in the draft is one of:

1. **Given** — stated in the user's input, the repo/docs, or a named source.
2. **Placeholder** — visibly bracketed for the user to fill or confirm:
   `[CONFIRM: is the free tier permanent? "forever" is a policy commitment]`,
   `[NEED: real benchmark]`, `[real customer story — do not invent one]`.
3. **Cut.**

Claims that need tracing include the easy-to-miss classes: pricing/policy
commitments ("forever", "no credit card", "no sales call"), product behavior
you inferred ("nothing phones home", "setup takes 10 minutes"), capabilities
("learns your API's normal behavior"), support promises ("founders answer
every message"), and case-study narratives (a templated company name with a
fictional story is still fiction — placeholder the whole story). Hypothetical
scenarios are fine when framed as hypothetical.

## The Flow

1. **Brief (20 seconds, before drafting):** audience, goal, ONE CTA,
   platform(s), voice source. Ask batched questions only for blocking
   unknowns; state defaults for the rest and flag them. If the user forbids
   questions, proceed with flagged defaults — the gate below still applies.
2. **Voice:** per [references/voice-and-slop.md](references/voice-and-slop.md)
   — repo brand-voice file if present, else propose paired-example rules;
   respect the slop banlist. Early-stage honesty is an asset, not a
   limitation to write around.
3. **Draft** with the claim-trace gate live.
4. **Mechanical checks:** count characters against
   [references/platform-constraints.md](references/platform-constraints.md)
   for every platform-bound artifact. A "Twitter version" you never counted
   is not a Twitter version.
5. **Fan out when there is more than one platform.** Once the source
   artifact and its claims table exist, dispatch one
   `soltero-skills:content-adapter` subagent per target platform and keep
   working while they run. Each gets the approved artifact, its claims
   table, that platform's constraint row, and the voice rules; each may drop
   claims and may not add one. A single platform, or an artifact whose
   claims table isn't settled yet, stays inline — the adapter blocks without
   a claims table by design.
6. **Deliver with the contract** (required, per artifact):

```
Claims: <claim> ← <source|PLACEHOLDER|cut>   (one line per claim; "none" ok)
Checks: <platform>: <N>/<limit> chars ✓|✗ · CTA: <the one CTA> · voice: <source>
Open: <placeholders the user must fill before publishing>
```

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "It's obviously implied — self-hostable means nothing phones home" | Inference isn't fact. Trace it or bracket it. |
| "'Forever/no card' is standard free-tier language" | It's a policy commitment the founder never made. CONFIRM-bracket it. |
| "The case study is just a template" | A fixed fictional story with a fill-in name becomes a lie the moment it's filled. Placeholder the story itself. |
| "I kept it honest — no need for the claims table" | The table is how invented specifics get CAUGHT. Honest intent is exactly the state in which they ship unnoticed. |
| "Rough char count is fine" | Count exactly. The baseline's 'Twitter version' was 3× over the limit. |

## When NOT to Use

Search-specific optimization → soltero-skills:seo-aeo. Email/sequences →
soltero-skills:email-marketing. Internal docs, README prose → just write.
Product claims verification for legal review → flag for counsel, don't rule.
Publishing is out of scope: deliver the copy and let the user ship it — no
posting, scheduling, or sending it anywhere, and no publishing it as a page
or artifact unless the user asked for one.

---

*Raw material adapted from msitarzewski/agency-agents (MIT, AgentLand
Contributors); rebuilt around the claim-trace gate and delivery contract.*
