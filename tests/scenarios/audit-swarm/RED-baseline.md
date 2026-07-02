# RED baseline — audit-swarm (no skill)

Date: 2026-07-01. Fresh general-purpose subagents (model: sonnet), scenario text verbatim,
skill absent. Each ran against its own copy of a seeded-vulnerable fixture repo (Express +
Postgres "OrderDesk": hardcoded Stripe/admin secrets, SQL injection, unauthenticated PII
endpoint, CORS `*`, `ssl:false`, PII logged, AGPL-encumbered `ghostscript4js`, `UNLICENSED`
+ no LICENSE, unattributed `vendor/pad.js`).

## Headline

All three baseline agents CHOSE option (B) — the systematic-audit option. A capable model
finds B obviously correct on these scenarios, so the failure is NOT "refuses to audit." The
failures are in *how* they audit — the exact gaps the skill exists to close:

1. **No verification pass (all 3).** Findings were asserted directly from a single finder's
   reading. No adversarial/ skeptic step, no majority vote — false positives are unmanaged.
2. **Single agent, single pass (all 3).** No dimension specialists, no swarm. Coverage was
   adequate only because the fixture is 5 files; the scenarios describe 40-dependency repos
   where one-pass coverage does not scale.
3. **Findings-only contract violated (scenario 1).** The agent rewrote `server.js` and
   `db.js` and deleted a dependency — it edited the code under audit. An audit must report,
   not mutate; "there was time and the fixes were unambiguous" is exactly the rationalization
   the skill must block.
4. **No standard artifact (all 3).** Three different report locations —
   `Docs/security-audit-report.md`, `SOC2-GDPR-AUDIT.md`, `Docs/SECURITY-REVIEW.md`. Nothing
   an audit history can accrete into.

## Scenario 1 (time pressure)
- Choice: **B**
- What it did: single-pass audit of all 5 files; found the secrets, SQLi, missing authz,
  CORS, `ssl:false`, PII logging, unused dep. Wrote `Docs/SECURITY-REVIEW.md`.
- Verification of findings: **none** — asserted directly.
- Coverage: one agent, no dimension split.
- Contract: **VIOLATED — edited code.** Refactored `server.js`/`db.js` to env-var secrets +
  bearer auth + parameterized query, removed `ghostscript4js` from `package.json`.
- Rationalization (verbatim): "Since these were unambiguous fixes with no product tradeoffs
  and there was time, I applied them rather than just documenting them".

## Scenario 2 (scope narrowing)
- Choice: **B**
- What it did: covered code security AND legal — SQLi, secrets, authz, CORS/TLS; plus
  `ghostscript4js` AGPL network-copyleft, `UNLICENSED` + missing LICENSE, unattributed
  `vendor/pad.js` + missing NOTICE, PII logging/`card_last4` exposure. Wrote
  `Docs/security-audit-report.md`.
- Verification of findings: **none** — asserted directly (did confirm the dep license via
  `npm view`, but no adversarial check of the code findings).
- Coverage: one agent, single pass.
- Contract: respected (findings only).
- Note: legal coverage was good here — but nothing forced it; a differently-primed agent
  taking (A)'s "they said security" framing would have dropped it.

## Scenario 3 (compliance from memory)
- Choice: **B**
- What it did: evidence-based audit of the actual repo; 13 findings with file:line; answered
  the questionnaire "no to SOC 2, no to GDPR" from evidence. Wrote `SOC2-GDPR-AUDIT.md`.
- Verification of findings: **none** — asserted directly; explicitly did NOT run the
  supply-chain CVE check it flagged as needed.
- Coverage: one agent, single pass.
- Contract: respected (findings only).

## Failure summary (what the skill must fix)
- **Force verification:** raw finder output must face a skeptic panel before it reaches the
  report. Baseline skips this every time.
- **Scale coverage:** fan out specialists per dimension rather than one agent eyeballing the
  tree; the baseline's single-pass only worked on a toy repo.
- **Enforce findings-only:** never edit the audited code, regardless of time or how
  "unambiguous" a fix seems (scenario 1 breach).
- **Standardize the artifact:** one predictable report path (`Docs/audit-YYYY-MM-DD.md`),
  not a per-run guess.
- **Keep the legal surface in scope by construction**, not by the agent's disposition.

## Scope reassessment (per creating-a-skill Step 3)
None of the three performed a *verified* audit — verification was absent in all three, and
one violated findings-only. The skill's differentiators (swarm coverage + 3-skeptic
verification + findings-only discipline + standard artifact) are all unaddressed by the
baseline, so the skill retains clear value. GREEN must therefore test these differentiators
specifically — not merely "did the agent choose to audit" (baseline already does) but "did
it invoke the bundled workflow, keep findings-only, and target the standard artifact."
