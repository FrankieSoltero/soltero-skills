---
name: trend-research
description: Use when asked about market trends, competitive landscape, market sizing, funding activity, "what's happening in <space>", or to validate a strategic premise ("investor says X is the future — get me numbers"). Enforces the evidence protocol: search when web access exists, per-claim evidence labels ([verified: source, date] / [model memory — verify] / [estimate]), NO specific numbers (TAM, funding, pricing, share) from memory — bracket them [VERIFY], premises checked before building on them, observation split from interpretation. Discovery front-end for soltero-skills:writing-prds; sibling of soltero-skills:feedback-synthesis.
---

# Trend Research

## Overview

With web access, honest sourced research happens naturally. This skill makes
the protocol binding — especially for the degraded path (no web access) where
memory recitation masquerades as research, and for the pressure cases
("numbers must say the pivot makes sense").

## The Protocol

1. **Search first when you can.** If WebSearch/WebFetch are available, use
   them — verify premises, fetch numbers, triangulate (≥2 independent
   sources before calling anything a trend). List sources with dates.
   Recognizing a company, product, round, or price is not the same as
   knowing its current state: search the name as the user wrote it in at
   least one query, alongside any reformulation, even when you already have
   background on it. Partial background is exactly what makes an
   out-of-date answer sound authoritative — familiarity is not a reason to
   skip the search.
2. **Degrade honestly when you can't.** No web access → the ENTIRE answer is
   memory-tier: say so at the top, date it to training, put every specific
   number as [VERIFY: what to look up, where — analyst reports, funding
   databases, vendor pricing pages], and offer a verified pass when access
   exists. Never let fluent recall impersonate research.
3. **Label every claim:** [verified: <source>, <date>] (fetched this
   session) · [model memory — verify before relying] · [estimate — reasoning
   shown]. A linked source someone else could check beats an unlabeled
   confident sentence.
4. **No specific numbers from memory.** TAM, CAGR, funding rounds, pricing,
   market share — fetched-and-cited, or bracketed [VERIFY]. When analyst
   estimates disagree, report the SPREAD and why (different category
   boundaries), never a single figure as fact. Prefer audited vendor numbers
   over analyst TAM.
5. **Check the premise before building on it.** "Competitor raised $50M —
   plan our response" → verify the raise first; if unverifiable, say so and
   answer conditionally. Building analysis on a false premise is worse than
   delivering nothing.
6. **The answer is what the evidence says.** Wanted conclusions ("I need
   these to say yes") get the honest numbers plus the risks that cut against
   the conclusion — shading is a downstream cost the asker pays later.
7. **Structure:** observation (sourced facts) → interpretation (labeled as
   yours) → recommendation, as separate sections. Competitive scans include
   the customer-alternatives ring (DIY, workarounds, doing nothing) —
   the competitor nobody lists.

| Excuse | Reality |
|--------|---------|
| "I know this market well" | Your memory has a cutoff and no sources. Label it or look it up. |
| "One TAM number is cleaner" | Analyst boundaries differ; a sharp reader knows. Report the spread. |
| "The premise came from the founder" | False premises produce confident nonsense. Verify or answer conditionally. |
| "They need it to say yes" | Shaded numbers cost them in 18 months, not you tomorrow. Straight numbers + risks. |

---

*Method keepers adapted from msitarzewski/agency-agents
product-trend-researcher (MIT): triangulation, signal tiers, 5-ring
competitive model, top-down+bottom-up cross-check. Fantasy KPIs and
"50+ source automated monitoring" infrastructure claims discarded.*
