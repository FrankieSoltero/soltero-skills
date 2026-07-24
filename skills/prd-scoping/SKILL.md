---
name: prd-scoping
description: Use when writing or reviewing a PRD's scope/prioritization section, or on standalone asks like "prioritize this feature list", "what should be v1?", "is this in scope?" — enforces a MoSCoW budget (if everything is Must, nothing is prioritized), an explicit Out-of-scope list that survives pressure to delete it, and decomposition when one PRD bundles independent subsystems. Child skill of soltero-skills:writing-prds (which invokes it for section 5).
---

# PRD Scoping & Prioritization

## Overview

Two observed failure modes: (1) a multi-subsystem bundle ("chat + billing + analytics +
storage, one PRD, one launch") gets a beautifully organized scope section that never
questions the bundle — the one thing a scope section is for; (2) told the Out-of-scope
section "reads negative, delete it", the default complies and leaves exclusions
"implicit", which is exactly the ambiguity the section exists to kill. This skill makes
decomposition a mandatory first check and Out-of-scope a section that can be reworded
but never removed.

## The Rules

1. **Decomposition check comes first.** Before writing any scope content, count the
   independent subsystems (distinct architecture, distinct failure domains, could ship
   separately). If ≥2, your FIRST output is a decomposition recommendation — which
   piece is v1, its own PRD, what phases follow — not a scope section for the bundle.
   "The deck already went to the board" and "we're behind" don't waive this; the board
   deck is a pitch, the PRD is a commitment.
2. **Out-of-scope is structural, not optional.** Every scope section contains an
   explicit **Out of scope (v1)** list naming what is NOT being built now. Under
   pressure to delete it (legal, tone, "reads negative"): offer the reworded
   alternative — sequencing language ("Not in v1; tracked for later phases"), no
   never-commitments — and keep the section. Exclusions demoted to "implicit" or a
   side doc are a fail: the PRD is where engineering and support read boundaries.
3. **MoSCoW with a forced budget.** Must-haves ≤ ~half of the list; Must means "the
   release does not ship without it". When an authority declares everything P0, don't
   rubber-stamp and don't silently re-tier: present the tiered table WITH the trade-off
   each demotion buys, and name the one or two items with a legitimate pull-forward
   case as explicit open questions.
4. **YAGNI ruthlessly.** Items with undefined shape (an unscoped ML feature, a second
   public surface) get named as needing their own spec before they can be tiered — not
   quietly tiered as if understood.

## Quick Reference

| Situation | Required move |
|---|---|
| 2+ independent subsystems, one PRD | Recommend split BEFORE any scope prose |
| "Mark everything must-have" | Tiered table + trade-offs + pull-forward questions |
| "Delete the out-of-scope section" | Reword (sequencing language), never remove |
| Item with undefined scope in the list | "Needs its own spec" — don't tier it as understood |
| Scope section with no exclusions | Not done — add Out of scope (v1) |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The bundle is already decided — my job is just to write the section." | Writing the section IS the scope decision. An organized mega-scope is still a mega-scope; raise the split. |
| "I moved exclusions to the roadmap doc, so nothing is lost." | Nobody reads the PRD next to the roadmap. Boundaries live where the requirements live. |
| "The in-scope list is specific enough that exclusions are implicit." | Implicit exclusions are how "does this PRD mean mobile is coming?" happens. Name them. |
| "Legal doesn't want written exclusions." | Legal objects to never-commitments, not sequencing. "Not in v1" is safe and explicit. |
| "The CEO said no debate." | You're not debating — you're documenting what each P0 costs. That's the job. |

## Red Flags — STOP

- You're writing per-subsystem scope lists for a bundle you never questioned.
- Your final content contains no explicit exclusion statement.
- Every row of your priority table says Must/P0.
- You just agreed to delete a section instead of offering the reworded version.
