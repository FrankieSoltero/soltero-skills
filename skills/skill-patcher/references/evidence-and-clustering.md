# Evidence and Clustering

## Inputs (read-only)

| Source | What it contributes |
|--------|---------------------|
| `Docs/corrections-ledger.md` | Compiled corrections written by `correction-compiler`. Fields per entry: **Rule ID, Category, Trigger Origin, Scope, Constraint, Rationale, Added, Traced-To, Enforcement, Status**. |
| `Docs/mistakes-and-fixes.md` | Structured lessons (symptom, cause, fix, lesson) — corroborating signal for a cluster and often the clearest statement that "the rule is the gap". |
| Review artifacts (e.g. `Docs/reviews/`) | Human overrides/rejections of agent decisions — the strongest signal, since a human already diagnosed the guidance failure. |
| `skill-gardener` staleness reports (if present) | Optional extra signal for where guidance is rotting. Cite when available; never require. |

Never edit these files during the pass. If a ledger entry needs a status change after a
patch merges, that is the reviewer/merger's call, noted in the PR description as a
suggested follow-up.

## Clustering method

The clustering key is what the correction **traces to**: the skill file + rule ID named
in `Traced-To` (fall back to Category + target file when a rule ID is absent). A
cluster is a set of corrections that indict the same piece of guidance — not merely the
same topic.

Independence checks when counting:

- **Incidents:** distinct sessions/PRs/incidents in Traced-To. Two corrections from the
  same session about the same event count once.
- **Sessions:** distinct session identifiers across the cluster.

## The gate

Patch a cluster only when it shows a recurring pattern across **≥3 traced incidents or
≥2 independent sessions**. Everything below the bar — including a severe, fresh,
authority-escalated single correction — is routed back, not patched.

### Worked example — clears the bar

Three ledger entries (three sessions, three PRs) each add a pinning constraint after an
approval slipped through rule R-3's vague "appropriate and maintained"; a staff
engineer's review note says "this is a guidance problem now". → One itemized edit:
R-3, same ID, constraint sharpened to require exact pins (runtime and dev), Traced-To
all three entries + the review artifact.

### Worked example — does not clear the bar

One entry: a hardcoded key was missed because the review scanned diff hunks, not full
file contents. Client-visible, CTO furious, the entry even proposes the fix. → Still
one incident, one session. Do NOT patch the rule. Instead: (a) route it back to
`correction-compiler` / the watch list and say so to the requester; (b) recommend an
out-of-band mitigation a human owns now (e.g., a one-off full-tree secrets scan, a CI
scanner); (c) note that a second independent occurrence promotes it next pass. The
enforcement hook `correction-compiler` compiled already guards the immediate gap —
that is the layer built for single corrections.

## Why the bar is severity-proof

A rule change generalizes to every future session; one data point cannot distinguish
"the guidance is wrong" from "one execution went wrong despite the guidance". Severity
raises the urgency of *mitigation*, which has its own channel (hooks, human hotfixes,
incident response) — it adds nothing to the *recurrence* question the gate asks.
