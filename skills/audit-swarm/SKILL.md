---
name: audit-swarm
description: Use when asked for a security audit, legal/compliance review, license check, or full-project risk assessment ("audit this repo", "security once-over", "are we GDPR/SOC 2 ready", "check our dependency licenses", "is this safe to open-source") — dispatches a bundled scout-then-swarm Workflow over the whole repo (adaptive specialist finders, severity-scaled skeptic verification: 1 lens for low/medium findings, 3-lens majority vote for high/critical) and writes a severity-ranked, evidence-backed report to Docs/audit-YYYY-MM-DD.md. Every run plants a seeded canary defect and must re-find it, so a zero-finding run reports "harness not live" instead of "clean". Findings only, verified by a skeptic panel; never edits code and never audits inline without the workflow.
---

# Audit Swarm

> **Portability note (non-Claude-Code agents):** this skill's coverage guarantee comes
> from parallel specialist finders plus a severity-scaled skeptic panel, run via Claude
> Code's `Workflow` tool — not available on other CLIs. On a different agent you can
> still serve this skill's purpose: work through the same finding categories a
> scout/finder pass would cover, hold every finding to the same bar (findings only,
> never fix inline, cite real evidence) — but treat a solo pass as unverified, since you
> lose the independent skeptic panel that catches false positives.

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
time there is.** And because a swarm that silently fails returns exactly what a clean repo
returns — nothing — every run re-finds one defect it planted itself before its silence
counts as evidence.

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
2. **Plant the canary.** The workflow script has no filesystem access, so you write the
   fixture. Create a scratch file **outside the audited repo** — `$TMPDIR` or
   `/tmp/audit-canary-<date>/` — holding one deliberate, unambiguous defect: a hard-coded
   fake credential, assigned in plain source, containing a distinctive token so the run can
   recognize it. For example:

   ```bash
   mkdir -p /tmp/audit-canary-$(date +%F)
   cat > /tmp/audit-canary-$(date +%F)/config.js <<'EOF'
   // Canary fixture — NOT part of the audited repository. The secret below is fake and
   // deliberately does not match any real provider's key format (push protection would
   // otherwise reject a commit that merely documents it).
   const PAYMENT_API_SECRET = "canary_secret_CANARY0000NOTAREALKEY0000"
   module.exports = { PAYMENT_API_SECRET }
   EOF
   ```

   Outside the repo, always: the audited tree is never written to, and the fixture's fake
   credential never lands in the customer's code or the report. Never reuse a fixture from a
   previous run — plant it fresh each time, so the check covers *this* run's harness.
3. **Invoke the Workflow tool** — do not read the tree and eyeball findings yourself instead:

   ```
   Workflow({
     scriptPath: "${CLAUDE_SKILL_DIR}/workflows/audit.mjs",
     args: {
       root: "<absolute repo path>",
       date: "<YYYY-MM-DD from date +%F>",
       mode: "standard",
       canaryPath: "/tmp/audit-canary-<date>/config.js",
       canaryToken: "canary_secret_CANARY0000NOTAREALKEY0000",
       canaryExpect: "a hard-coded payment API secret assigned in source"
     }
   })
   ```

   The script refuses to run without `canaryPath` — that refusal is the gate working, not a
   bug to route around.

   `mode: "standard"` runs one finder round; use `"thorough"` only if the user explicitly
   asked for an exhaustive/deep pass, since it loops rounds until dry and costs more.

   **Cost note:** even standard mode is not cheap — every high/critical finding still gets
   the full 3-lens majority-vote panel; low/medium findings get a cheaper 1-lens check
   (a false positive there costs report noise, not a missed real risk). A swarm of dozens of
   agents is still normal on a repo with many findings. That's the price of verified,
   low-false-positive findings; it is expected, not a malfunction. Reserve `"thorough"` for
   when the user has accepted that cost.
4. **Read `harnessLive` before you read anything else.** The result carries `verdict`
   (`findings` / `clean` / `harness-not-live`), `harnessLive`, and a `canary` object.
   - `harnessLive: true` → report normally.
   - `harnessLive: false` → the run's seeded defect was not found, or the skeptic panel
     misjudged it. **Report "harness not live — this run proves nothing about the repo" and
     never the word clean**, whatever `confirmedCount` says. Say which direction failed (from
     `canary.note`), then re-run. A zero-finding run with a dead canary is an unrun audit.
5. **Relay the result.** Read the returned `reportPath`, present the summary and the top
   confirmed findings (severity, file:line, one-line impact) in chat, state the canary
   verdict, and point at the report file. Then delete the canary fixture directory. Do not
   start fixing anything, even trivially.

## Report Contract

`Docs/audit-YYYY-MM-DD.md` in the audited repo, written by the workflow — one predictable
path every run, not a per-run guess. Contains: executive summary; confirmed findings by
severity (title, file:line, category, evidence, impact, remediation) that survived the
skeptic panel; a refuted-findings appendix (what was checked and dismissed, with panel
reasoning); scout inventory; and a **Harness canary** section recording the seeded defect,
whether a finder detected it, whether the panel confirmed it and refuted the fabricated
control finding, and the verdict. A report whose canary failed opens with `HARNESS NOT
LIVE` and describes the repo as clean nowhere.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The findings look right, I can skip the verification step." | Verification is the workflow's job, not optional polish. Never assert a finding the skeptic panel hasn't judged — that's how false positives ship as fact. |
| "These fixes are unambiguous and there's time, so I'll just apply them while I audit." | Findings only — always. "Unambiguous" and "there's time" are the exact excuse that turned an audit into an unreviewed rewrite of the audited code last time. Report it; remediation is a separate, user-approved step. |
| "I'll just audit it myself inline instead of dispatching the workflow — faster." | An inline pass is a single agent doing a single read: no specialist swarm for coverage and no adversarial verification. Those are the two failure modes this skill exists to close; skipping the workflow reintroduces both. |
| "They said quick, so one pass over the files is enough." | Quick = `mode: "standard"`, not skip-the-workflow. One pass only looks adequate on a small fixture; it does not scale to a real dependency tree. Dispatch the workflow either way. |
| "Zero confirmed findings — the repo is clean." | Only if the canary was caught. A broken swarm, a bad path, a failed dispatch and a genuinely clean repo all return the same silence; the canary is the one thing that tells them apart. No canary, no clean. |
| "The canary is a fake defect in a temp file — skipping it doesn't change the real audit." | It changes what the real audit's *silence* means, which is the entire product when there are no findings. Skipping it means reporting an unverified result as a verified one. |
| "The canary failed but the swarm still found real issues, so it worked." | It found *some*. A harness that misses a hard-coded credential sitting in plain source is missing others too — the findings are a floor, not a result. Re-run before reporting. |

## Red Flags — STOP

- About to state a finding as fact without it having gone through the skeptic panel.
- About to edit, refactor, or delete anything in the audited codebase — findings only, ever.
- About to read the repo and write up findings yourself instead of invoking the Workflow tool.
- About to write the report anywhere other than `Docs/audit-YYYY-MM-DD.md`.
- About to invoke the workflow without a freshly planted `canaryPath`.
- About to say "clean", "no issues", or "nothing found" on a run whose `harnessLive` is false
  — or to soften it into a caveat ("clean, though no audit is exhaustive") instead of
  reporting the run as unverified.
- About to plant the canary fixture inside the audited repo — it goes in a scratch path
  outside it, always.
