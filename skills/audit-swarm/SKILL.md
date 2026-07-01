---
name: audit-swarm
description: Use when asked for a security audit, legal/compliance review, license check, or full-project risk assessment ("audit this repo", "security once-over", "are we GDPR/SOC 2 ready", "check our dependency licenses", "is this safe to open-source") — dispatches a bundled scout-then-swarm Workflow over the whole repo (adaptive specialist finders, 3-skeptic majority-vote verification per finding) and writes a severity-ranked, evidence-backed report to Docs/audit-YYYY-MM-DD.md. Findings only, verified by a skeptic panel; never edits code and never audits inline without the workflow.
---

# Audit Swarm

## Overview

A capable agent will already choose to audit when asked — that's not the gap. The gap is
*how*: a single agent reading the tree once, asserting findings straight from its own read,
with no artifact discipline, and — under time pressure — "fixing while I'm here" instead of
just reporting. This skill runs a bundled workflow instead: a scout inventories the repo with
real commands, specialist finders fan out so coverage doesn't depend on one pass being enough,
every finding faces a 3-skeptic majority-vote panel before it's trusted, and a synthesis agent
writes one standard report. **The user invoking this skill is the explicit opt-in the Workflow
tool requires.**

Core principle: **swarm for coverage, skeptic panel before anything is reported as true,
findings only — never edit the code under audit, no matter how obvious the fix or how much
time there is.**

## When to Use

- "Audit this project", "security review the repo", "quick security once-over".
- License/attribution checks, open-sourcing readiness, GDPR/SOC 2/PCI questions.
- Any compliance questionnaire that needs to be answered from the actual codebase.

## When NOT to Use

- Reviewing pending changes/a diff — use the built-in `/security-review`.
- Fixing findings — this skill only reports; remediation is a separate, user-approved task
  after the report exists. Never fold remediation into the audit, even if a fix looks
  unambiguous and there's spare time — that is exactly the shortcut this skill blocks.

## How to Run

1. **Get the date** (the workflow script cannot call `Date.now()`): run `date +%F`.
2. **Invoke the Workflow tool** — do not read the tree and eyeball findings yourself instead:

   ```
   Workflow({
     scriptPath: "${CLAUDE_SKILL_DIR}/workflows/audit.mjs",
     args: { root: "<absolute repo path>", date: "<YYYY-MM-DD from date +%F>", mode: "standard" }
   })
   ```

   `mode: "standard"` runs one finder round; use `"thorough"` only if the user explicitly
   asked for an exhaustive/deep pass, since it loops rounds until dry and costs more.
3. **Relay the result.** Read the returned `reportPath`, present the summary and the top
   confirmed findings (severity, file:line, one-line impact) in chat, and point at the report
   file. Do not start fixing anything, even trivially.

## Report Contract

`Docs/audit-YYYY-MM-DD.md` in the audited repo, written by the workflow — one predictable
path every run, not a per-run guess. Contains: executive summary; confirmed findings by
severity (title, file:line, category, evidence, impact, remediation) that survived the
skeptic panel; a refuted-findings appendix (what was checked and dismissed, with panel
reasoning); scout inventory.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The findings look right, I can skip the verification step." | Verification is the workflow's job, not optional polish. Never assert a finding the skeptic panel hasn't judged — that's how false positives ship as fact. |
| "These fixes are unambiguous and there's time, so I'll just apply them while I audit." | Findings only — always. "Unambiguous" and "there's time" are the exact excuse that turned an audit into an unreviewed rewrite of the audited code last time. Report it; remediation is a separate, user-approved step. |
| "I'll just audit it myself inline instead of dispatching the workflow — faster." | An inline pass is a single agent doing a single read: no specialist swarm for coverage and no adversarial verification. Those are the two failure modes this skill exists to close; skipping the workflow reintroduces both. |
| "They said quick, so one pass over the files is enough." | Quick = `mode: "standard"`, not skip-the-workflow. One pass only looks adequate on a small fixture; it does not scale to a real dependency tree. Dispatch the workflow either way. |

## Red Flags — STOP

- About to state a finding as fact without it having gone through the skeptic panel.
- About to edit, refactor, or delete anything in the audited codebase — findings only, ever.
- About to read the repo and write up findings yourself instead of invoking the Workflow tool.
- About to write the report anywhere other than `Docs/audit-YYYY-MM-DD.md`.
