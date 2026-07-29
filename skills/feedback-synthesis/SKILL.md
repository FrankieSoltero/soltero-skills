---
name: feedback-synthesis
description: Use when synthesizing user feedback of any kind — support tickets, reviews, interviews, surveys, community threads — into themes, priorities, counts, or quotes ("what are users saying", "what should we build next", "give me the numbers for the deck", "pull quotes from feedback"). Enforces the synthesis contract: exact counts with item IDs, verbatim quotes with every edit disclosed, duplicates counted once, contradictions surfaced not averaged, vivid anecdotes held at n=1, and expected-but-ABSENT topics reported. Discovery front-end for soltero-skills:writing-prds.
---

# Feedback Synthesis

## Overview

Synthesis judgment is not the problem — the contract is. This skill makes the
disciplines mandatory and machine-consumable so counts survive a board
follow-up question, a founder's anchor doesn't reweight the data, and
downstream PRD work can consume the output.

## The Contract (every synthesis delivers this)

```
Themes (one row per theme, largest first):
  <theme> | n=<items>/<unique users> | IDs: <list> | verbatim: "<exact quote>" (<ID>) | severity note
Contradictions: <A> (IDs) vs <B> (IDs) — presented as tension, never averaged
Absences: <expected topics with ZERO mentions — check at minimum: pricing,
  security/SSO, performance, onboarding, integrations, reliability — plus
  anything the asker's framing presumes>
Data notes: duplicates (<same-user IDs, counted once in user counts>),
  segment caveats (who this data structurally can't hear from), date range
Handoff: <what this supports building → soltero-skills:writing-prds>
```

## The Rules

1. **Counts are exact and ID-cited.** Never "many"/"roughly a dozen" — the
   number with the ID list, item-count and unique-user-count both when they
   differ. Refuse rounding "for the story"; exact numbers survive follow-ups.
2. **Quotes are verbatim; every edit disclosed.** Typos may be fixed and
   clauses trimmed ONLY with a per-quote edit note ("fixed 'dont'→'doesn't';
   nothing else touched"). Punch-up is fabrication. Quotes from private
   channels (interviews, tickets) need permission flagged before public use.
3. **A vivid story is n=1.** Severity may be high — say so — but frequency
   is what the data shows. Name the anchor when the asker has one, and name
   the survivorship caveat if the dataset structurally undercounts the topic
   (churned/blocked users don't file tickets).
4. **Contradictions are findings.** Surface both sides with IDs; never blend
   into a fake consensus or pick the asker's preferred side silently.
5. **Absence is data.** Report expected topics with zero mentions — an
   absence list is required in every synthesis, not just when asked.
6. **The data's answer beats the wanted answer.** If the asker's hypothesis
   isn't supported, say what is, with the counts.

| Excuse | Reality |
|--------|---------|
| "'Roughly a dozen' tells the story better" | The follow-up question kills the deck. Exact + IDs. |
| "The churn story is too good to rank low" | Memorable ≠ frequent. n=1, severity noted, validate elsewhere. |
| "Cleaning up the quote is harmless" | Undisclosed edits make it not a quote. Disclose or leave verbatim. |
| "Nobody asked about what's missing" | Absences steer roadmaps. The absence list is part of the contract. |

---

*Method keepers adapted from msitarzewski/agency-agents
product-feedback-synthesizer (MIT): channel coverage, verbatim preservation,
edge-case surfacing. Fantasy KPIs discarded.*
