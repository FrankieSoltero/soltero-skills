---
name: email-marketing
description: Use when writing or planning any email that reaches customers or prospects — cold/outbound outreach, onboarding/drip sequences, newsletters, announcements — or when asked about subject lines, deliverability, or cadence. Inherits content-marketing's claim-trace gate and adds the email-specific ones — personalization traces to a real named fact or is cut; product claims trace even inside compliant rewrites (the observed failure: refusing an illegal list while hallucinating the feature list); no fictional case studies, even templated — plus compliance floor and sequence craft. Child of soltero-skills:content-marketing.
---

# Email Marketing

## Overview

Baseline behavior already refuses the illegal asks (purchased lists, missing
unsubscribe, deceptive subjects, fake deadlines) — keep doing that. The
failures this skill closes happen INSIDE the compliant replacement you write
next: a feature list the product doesn't have, a "customer story" with a
templated name and a fictional statistic, "no credit card" or "setup takes 10
minutes" nobody stated or measured, an unsourced reply-rate or deliverability
number offered as fact. Which of these a given draft ships varies run to run;
the gates make it none. **The rewrite that fixes their legality must also
pass your claim gate.**

## The Gates

1. **Product-claim trace (inherited, applies to EVERY draft):** each
   capability, policy, or number traces to the given feature set/docs/user
   input, or ships bracketed: `[CONFIRM: do we have escalation rules?]`.
   Announcing a feature = only the features you were given.
2. **Personalization trace:** every personal touch names its real source
   (provided research, their public work you were given). No research → no
   fake warmth: either honest-cold framing ("I'll be straight: this is a
   cold email"), or a research pass first, or a visible slot
   `[specific fact from their eng blog — research required, do not invent]`.
3. **No fictional case studies.** A story with `{{Company}}` templated but
   fixed invented details becomes a lie when filled. Real story or
   `[real customer example — do not invent]`.
4. **Compliance floor (state per artifact, flag — don't lawyer):** working
   unsubscribe + physical address (CAN-SPAM), one-click unsubscribe/
   List-Unsubscribe for bulk (Gmail/Yahoo bulk-sender requirements, RFC
   8058), honest subject, consent basis named for the list used (opt-in vs
   legitimate-interest cold B2B; EU/UK recipients flagged), suppression on
   reply/unsub/bounce.
5. **You write the email; you don't send it.** The deliverable is copy the
   user reviews and sends themselves. Don't create drafts, schedule sends,
   import or segment a real list, or call a mail or CRM tool — even when one
   is connected and sending looks like the obvious next step. A sent email
   is not reversible, and the compliance basis above is the user's to
   confirm. Offer the send as a follow-up after delivering the copy.

## Craft (reference: [references/sequences-and-craft.md](references/sequences-and-craft.md))

One email = one job = one CTA. Subject ≤ ~50 chars, honest. Each sequence
touch carries a NEW reason to reply (angle → proof → friction-drop → honest
breakup) — never "bumping this" ×3. Explicit exit conditions per sequence
(reply, unsub, bounce, complaint). Urgency only when real; offer to build
real urgency (dated founding-customer window) instead of faking it.

## Delivery contract (required, per email/sequence)

```
Claims: <claim> ← <source|PLACEHOLDER>        (features, numbers, policies)
Personalization: <touch> ← <real source|SLOT>
Compliance: unsub ✓ · address ✓ · consent: <basis> · exits: <list>
Open: <what the user must fill/confirm before sending>
```

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I fixed their illegal ask — the rewrite is the safe part" | The rewrite is where the baseline hallucinated an entire feature set. Gate your own draft hardest. |
| "The story is templated, they'll swap in a real one" | They'll fill the name and ship the fiction. Placeholder the story, not just the company. |
| "'Setup takes 10 minutes' is surely roughly true" | Nobody measured it. Bracket it. |
| "Compliance is in the footer, no need to state it" | The compliance line is how missing consent basis gets caught before 400 sends. |

---

*Raw material adapted from msitarzewski/agency-agents email-strategist (MIT);
rebuilt around trace gates and the per-artifact contract.*
