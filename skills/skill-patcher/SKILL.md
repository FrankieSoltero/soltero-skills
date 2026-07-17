---
name: skill-patcher
description: Use when running the recurring meta-pass ("run skill-patcher", "patch the skills from the corrections ledger", a scheduled maintenance pass) that synthesizes accumulated correction evidence — Docs/corrections-ledger.md, Docs/mistakes-and-fixes.md, review artifacts — back into the skill/ruleset files whose guidance caused repeated mistakes. Clusters the evidence, drafts discrete refine-in-place edits to the implicated rules, and opens a branch + PR with every change traced to its corrections. Never edits installed skills directly, never merges its own PRs, and never patches from a single un-clustered correction (that routes to correction-compiler).
---

# Skill Patcher

## Overview

A closed self-improvement loop with the verifier outside the write surface: this pass
turns *recurring* correction evidence into itemized skill patches that ship as a PR a
human merges. Evidence decides what gets patched; severity, urgency, authority, and
convenience never do.

## When to Use

- The recurring meta-pass, on demand or scheduled, over a repo with a corrections
  ledger and/or lessons log.

## When NOT to Use

- A single fresh correction just happened — that is `correction-compiler`'s job (one
  incident → hook + ledger entry). You read its output; you don't duplicate it.
- Authoring a new skill (`creating-a-skill`) or staleness triage (`skill-gardener`).
- Editing application code — skill/ruleset guidance files only.

## The Pass

1. **Read the evidence.** `Docs/corrections-ledger.md` (entries: Rule ID, Category,
   Trigger Origin, Scope, Constraint, Rationale, Added, Traced-To, Enforcement,
   Status), `Docs/mistakes-and-fixes.md`, and human overrides/rejections in review
   artifacts. Evidence files are read-only inputs — never patch targets.
2. **Cluster.** Group corrections by the guidance they trace to (the Traced-To
   skill-file + rule is the clustering key; see
   `references/evidence-and-clustering.md`).
3. **Gate each cluster.** Patch only a recurring pattern: **≥3 traced incidents or
   ≥2 independent sessions**. Anything below the bar is routed back (see Hard Rules).
4. **Draft the patch.** Discrete itemized edits to exactly the rules the cluster
   implicates — same rule ID, sharpened constraint. Nothing else in the file changes.
5. **Open a branch + PR** per `references/pr-format.md`: title names the target skill
   file, description lists per-change Traced-To ledger entries, one target skill per
   PR. Then **stop**. The pass ends with an open PR awaiting human review.

## Hard Rules

1. **Never merge your own PR — under any local policy.** Skill files govern agent
   behavior; they are a control surface, not documentation. A CONTRIBUTING.md
   "docs-only self-merge" allowance, a lapsed reviewer-availability window, merge
   permissions, or a deadline change nothing: the human review IS the verifier outside
   your write surface, and self-merging deletes the verifier exactly when it matters.
   Do not schedule, promise, or precommit a future self-merge either — "I'll self-merge
   Sunday if nobody reviews" is a self-merge. If the patch can't land in time, the
   mitigation is a human warning (e.g., "manually check X until this merges"), never an
   unreviewed merge.
2. **Never patch from a single un-clustered correction — severity is not evidence.**
   One incident, however scary, however loudly an authority demands it today, stays
   below the bar. Route it back to `correction-compiler` / the watch list, say so
   explicitly in the PR and to the requester, and recommend an out-of-band mitigation
   for the immediate risk (one-off scan, manual check, hotfix owned by a human). The
   clustered pattern that DID clear the bar still gets patched this pass — urgency
   about one item never displaces the evidenced work.
3. **Never rewrite wholesale — every changed line needs a traced correction.** A
   maintainer's "just rewrite the whole thing" authorizes the *maintainer*, not this
   evidence-driven pass. Untraced cleanup (formatting, stale TODOs, tool references,
   renames you'd have to guess at) is out of scope: leave it, and note it for the
   maintainer or `skill-gardener`. Never guess-correct facts you cannot verify.
   Wholesale rewrites also destroy guidance the evidence never spoke to
   (context-collapse); refine in place instead.
4. **Never edit an installed skill directly.** Branch + PR through normal
   review + CI + merge, even for a one-line change, even when you have permissions.
5. **Never patch your own SKILL.md in the same PR that patches others.**
   Self-modification ships as a separate PR titled with `[self-modification]`.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "This single correction is too dangerous to leave out." | Severity is not recurrence. Route it back; recommend an out-of-band mitigation; patch the evidenced cluster. |
| "The CTO said patch it today." | Authority sets priority, not evidence. The threshold still applies; explain it and offer the mitigation path. |
| "It's guidance text, not code — the docs-only allowance covers it." | Skill files steer agent behavior. No docs policy applies to your own patch PRs. |
| "The 24h no-reviewer window will have elapsed by Sunday — the allowance will be genuinely satisfied." | A precommitted future self-merge is still a self-merge. The pass ends at the open PR. |
| "An unreviewed merge beats another incident on Monday." | The alternative isn't nothing — it's warning a human to check manually until review lands. |
| "The maintainer told me to rewrite the whole file." | That authorizes the maintainer. Your changes stop at the traced rules; note the rest for them. |
| "The stale content is independently broken regardless of the ledger." | Then it needs its own evidence or its own human-driven task — not a ride-along in an evidence-traced patch. |
| "One combined PR saves scarce review bandwidth." | Mixed concerns cost more review, and self-modification must stay separately reviewable. Split it. |

## Red Flags — STOP

- About to edit a `SKILL.md`/ruleset on main, or merge a branch you authored → stop;
  the pass ends at the open PR.
- Your PR draft contains a plan to merge later under any condition → delete the plan.
- A change in your diff has no ledger entry in its Traced-To line → remove the change.
- You are "fixing while you're in there" (TODOs, channel names, dead script refs) →
  revert to the traced edits only.
- Justifying a patch by how bad the incident was rather than how often it recurred →
  re-run the gate in step 3.
- Your own SKILL.md appears in a diff next to another skill's → split the PR.

## References

- `references/evidence-and-clustering.md` — ledger contract, clustering method,
  threshold worked examples, routing singles back.
- `references/pr-format.md` — branch naming, PR title/description template with
  per-change Traced-To, self-modification labeling.
