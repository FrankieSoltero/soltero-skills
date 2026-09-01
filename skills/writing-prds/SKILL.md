---
name: writing-prds
description: Use when asked for a PRD, requirements doc, or product spec, or when a raw product idea needs requirements before any design or code ("we should build…", "write up the requirements for…") — turns the idea into a PRD through collaborative dialogue instead of one-shotting a document full of invented decisions. Asks one question at a time, makes owner decisions blocking (no assumption-flag-and-proceed), forces decomposition of multi-subsystem bundles, builds the PRD section by section with approval, and delegates stories/scope/metrics to its child skills (prd-user-stories, prd-scoping, prd-success-metrics). Hard gate — no design, tech-stack, or implementation work until the PRD is approved. Sits upstream of soltero-skills:lean-brainstorming (PRD = what and why; brainstorming = technical design = how).
---

# Writing PRDs

## Overview

Asked for a PRD, the default is to write the whole document immediately: invent every
decision the owner never made, label the inventions "ASSUMPTION", ship the finished doc,
and park the questions at the bottom where they block nothing. The result reads like
requirements but is fiction — and the team designs and builds against it.

This skill replaces that with dialogue: requirements are **elicited, not defaulted**. The
PRD says what to build and why; how to build it belongs to soltero-skills:lean-brainstorming,
which this skill hands off to at the end.

<HARD-GATE>
Do NOT write code, scaffold schemas or endpoints, invoke any design or implementation
skill, or make tech-stack decisions until the PRD is written and the user has approved
it. "We'll write the PRD after the code" is the failure this skill exists to prevent —
the schema bakes in decisions nobody made. This applies regardless of urgency or who is
asking.
</HARD-GATE>

## When to Use / When NOT to Use

- **Use:** any request for a PRD / requirements doc / product spec; any raw feature or
  product idea that needs requirements agreed before design.
- **Don't use:** technical design of an already-agreed feature (soltero-skills:lean-brainstorming),
  implementation planning (soltero-skills:lean-plans), or filling in a single PRD section
  when a PRD already exists (use the matching child skill directly).

## Checklist

Create a task per item and complete them in order:

1. **Explore context** — repo, existing docs/prds, recent commits. No PRD prose yet.
2. **Scope check first** — if the ask bundles multiple independent subsystems, raise
   decomposition NOW (via soltero-skills:prd-scoping), before any drafting. Never inside
   the finished doc as an aside.
3. **Elicit** — clarifying questions ONE AT A TIME (multiple choice preferred): problem,
   users, constraints, success criteria. Blocking questions stop the draft (see below).
4. **Draft section by section** — using `references/prd-template.md`; after each section,
   ask whether it looks right before writing the next.
5. **Delegate specialist sections** — user stories & acceptance criteria →
   soltero-skills:prd-user-stories; scope & prioritization → soltero-skills:prd-scoping;
   success metrics → soltero-skills:prd-success-metrics.
6. **Write the doc** — `docs/prds/YYYY-MM-DD-<topic>-prd.md` (user's preferred location
   overrides).
7. **Self-review** — scan for placeholders/TBDs, contradictions, ambiguity, scope creep,
   and any unconfirmed invented specific. Fix inline.
8. **Council review gate** — invoke soltero-skills:prd-review. The PRD must PASS its
   council (overall ≥95 AND every dimension ≥80) before anything downstream; BLOCKED
   means fix and re-review, never proceed.
9. **User review gate** — "PRD written to `<path>` (council: PASS <score>). Please
   review before we move to design." Wait. Revise until approved (revisions re-enter
   step 8).
10. **Hand off** — offer soltero-skills:lean-brainstorming for technical design. That is the
    ONLY next step; never jump to implementation.

## Blocking vs. defaultable — the anti-"flag-and-proceed" rule

An assumption label is not an answer. Classify every gap before drafting:

| Gap | Class | What you do |
|-----|-------|-------------|
| Who the users are; the problem being solved | BLOCKING | Ask and wait |
| Data retention, privacy, consent, compliance posture | BLOCKING | Ask and wait |
| What's in v1 vs. out; success targets | BLOCKING | Ask and wait (or child skill's proposed-pending-confirmation form) |
| Where feedback/data flows (which tools of record) | BLOCKING | Ask and wait |
| Wording, section order, formatting details | Defaultable | Pick sensibly, note it |

If the user is truly unavailable and delivery is forced, deliver a **partial** PRD:
completed sections plus a "Blocked on decisions" section at the TOP — never a finished-
looking doc whose core decisions you invented.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "They said they're slammed — I'll just pick good defaults and flag them." | A flagged invention is still an invention. Skimmed flags become requirements. Ask the blocking questions; they take the owner two minutes. |
| "It's faster to write it all and let them correct it." | Correcting a confident 10-section doc is harder than answering one question. Wrong anchors survive review. |
| "The PRD is a formality; code first, document reality after." | The schema bakes in retention/consent/scope decisions nobody made. HARD-GATE: requirements before code. |
| "Everyone's aligned already, don't slow them down with questions." | If alignment exists, questions cost minutes. If it doesn't, the PRD launders the disagreement. |
| "I proposed phasing inside the doc, so the mega-scope is handled." | An aside inside a delivered mega-PRD changes nothing. Decomposition is raised before drafting, as its own decision. |

## Red Flags — STOP

- You are writing PRD prose and have asked zero questions this session.
- You typed "ASSUMPTION:" next to a decision the owner should make → convert it to a
  blocking question.
- You are about to deliver the full PRD in one message.
- You (or a pairing partner) are creating models/endpoints and the PRD isn't approved.
- The request contains 3+ independent subsystems and you're drafting one doc for all.

## Bundled assets

- `references/prd-template.md` — canonical section template the draft follows.
