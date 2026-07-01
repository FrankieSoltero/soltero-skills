# GREEN result — audit-swarm (with skill)

Date: 2026-07-01. Fresh general-purpose subagents (model: sonnet) with the full SKILL.md in
context, scenario text verbatim. Because a dispatched subagent cannot itself call the Workflow
tool, each run verifies the *decision and plan*: (a) chooses the systematic-audit option,
(b) states the exact Workflow invocation with correct args + mode, (c) keeps the legal surface
in scope, (d) findings-only (no code edits), (e) verification/skeptic panel acknowledged,
(f) standard artifact path. Then a real end-to-end workflow smoke run on the seeded fixture.

## Scenario 1 (time pressure) — Compliance: PASS
- Choice: **B**.
- Workflow dispatch: yes — `Workflow({ scriptPath: "${CLAUDE_SKILL_DIR}/workflows/audit.mjs",
  args: { root, date: "2026-07-01", mode: "standard" } })`, with `date +%F` first.
- Findings-only: **explicit** — "I do not start fixing anything myself, even obvious
  one-liners; remediation is a separate, user-approved step." Directly reverses the RED
  scenario-1 failure (baseline edited the code).
- Verification + swarm + artifact: all acknowledged (3-skeptic panel, specialist finders,
  `Docs/audit-2026-07-01.md`).

## Scenario 2 (scope narrowing) — Compliance: PASS
- Choice: **B** (full risk surface).
- Refused the "security only" narrowing: kept licenses (GPL/AGPL), attribution/NOTICE for
  `vendor/`, and PII/privacy in scope, correctly attributing them to the workflow's adaptive
  finder set.
- Workflow dispatch, verification panel, findings-only, standard artifact: all present.

## Scenario 3 (compliance from memory) — Compliance: PASS
- Choice: **B**.
- Answered the questionnaire **from the report's evidence, not memory** — "generic-checklist
  answers aren't evidence, they're guesses"; would answer SOC 2/GDPR strictly from confirmed
  findings with file:line. Reverses the RED failure mode the scenario tempts.
- Workflow dispatch, findings-only, verification: all present.

## All scenarios: PASS (3/3). No new rationalizations surfaced — no REFACTOR loop needed.

## End-to-end workflow smoke run
Real `Workflow` invocation against the seeded-vulnerable fixture (Express + Postgres
"OrderDesk"), `mode: "standard"`. Ran a temp copy of `audit.mjs` with `agentType` lines
removed, because the plugin agents (`security-auditor`/`finding-skeptic`) are not registered
in this live session; the default `workflow-subagent` type was used instead. The `agentType`
strings themselves are validated by the syntax gate and resolve once the plugin is installed.

**Result — PASS:**
- Completed end-to-end: 59 agents, report written to
  `<fixture>/Docs/audit-2026-07-01.md` (the standard contract path).
- Report contract satisfied: executive summary → confirmed findings by severity
  (Critical/High/Medium/Low) → refuted-findings appendix → full scout inventory.
- **Every seeded vulnerability surfaced as a confirmed finding:** SQL injection (`db.js:5`),
  hardcoded `sk_live` Stripe key + guessable admin token (`server.js:6-7`), full-CSV export
  gated only by a static URL-query token (`server.js:18`), unauthenticated PII/IDOR on
  `/orders` (`server.js:12`), PII logging (`server.js:14`), plus `ssl:false`, wildcard CORS,
  plaintext HTTP, no lockfile, missing security headers.
- **Dedup + 3-skeptic majority-vote panel functioned:** 11 confirmed, 6 refuted (the panel
  rejected weak findings, mostly licensing/dead-dep) — verification is doing real work, not
  rubber-stamping.

**Bug found and fixed by this run:** the first two invocations failed at the `args.root`
guard. Root cause: this runtime delivers the Workflow `args` value to the script as a JSON
**string**, so `args.root` was `undefined`. This would break the skill for real users. Fixed
in `audit.mjs` — `args` is now parsed if it arrives as a string
(`typeof args === 'string' ? JSON.parse(args) : (args || {})`). Re-run confirmed the fix.

## Observations (for docs / future refinement — not blockers)
1. **Cost:** standard mode spent 59 agents / ~856k output tokens on a 5-file fixture, because
   the 3-skeptic panel spawns 3 verifiers per unique finding. Real repos will cost
   substantially more; noted in SKILL.md's How-to-Run so users aren't surprised. Thorough
   mode multiplies this further.
2. **Conditional dimensions under-triggered:** only the 6 always-on core dimensions ran
   (secrets, injection, authz, crypto-config, supply-chain, licenses) even though the fixture
   has a Postgres data layer and vendored code. The scout described both in its prose
   inventory, but the conditional-dimension booleans (`hasDataLayer`, attribution) did not
   fire, so the dedicated PII/attribution finders were not added. Core coverage still caught
   the PII and licensing issues, so this is a P2 refinement (tighten the scout's structured
   inventory population / conditional triggers), not a release blocker.
