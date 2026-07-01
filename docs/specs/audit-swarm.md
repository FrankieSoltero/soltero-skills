# Skill Spec — audit-swarm

- **Problem:** A single-pass review can't cover a whole repo's security and legal surface.
  The built-in /security-review is diff-scoped; nothing audits the full project for
  security, license, privacy, and compliance risk with verified (low-false-positive) output.
- **Trigger:** User asks for a security audit, legal/compliance review, license check, or
  full-project risk assessment. Skill invocation is the explicit opt-in required by the
  Workflow tool.
- **Scope:** Whole-repo audit via a bundled Workflow script (scout → adaptive fan-out →
  dedup → 3-skeptic verification → synthesized report). Findings only — no code changes.
  Non-goals: diff review (built-in covers it), auto-fixing findings, CI integration (later).
- **Success scenario:** On a seeded-vulnerable fixture repo, the skill produces
  `Docs/audit-YYYY-MM-DD.md` with severity-ranked confirmed findings (file:line, impact,
  remediation), a refuted-findings appendix, and the scout inventory — and catches the
  seeded issues a no-skill baseline (RED) misses or reports without verification.

## Architecture (approved 2026-07-01)

**Orchestration:** `SKILL.md` instructs Claude to call
`Workflow({scriptPath: "${CLAUDE_SKILL_DIR}/workflows/audit.mjs", args: {root, date, mode}})`.
`date` is passed via args because workflow scripts cannot call `Date.now()`.

**Phase 1 — Scout (deterministic first).** One scout agent inventories the project with
real commands, not guesses: stack detection, package manifests + license extraction
(`npm ls` / ecosystem equivalent), `npm audit` / `pip-audit` / `osv-scanner` when available,
secret-pattern grep, entry points, data-layer and auth-surface mapping. Returns a
schema-forced structured inventory.

**Phase 2 — Adaptive fan-out.** The script builds the finder list from the inventory.

- Always-on dimensions: secrets/credentials, injection, authz/access-control, crypto &
  transport config, supply chain, dependency licenses.
- Conditional dimensions: PII/data-privacy (data layer present), regulatory posture
  (SOC 2/HIPAA/PCI signals such as payment or health terms), terms & attribution
  (copied code, NOTICE files), one stack-specific finder chosen from the inventory.

Each finder receives the relevant inventory slice in its prompt and returns schema-forced
findings (file, line, category, severity, evidence, impact). Dimension config lives as a
`const` in `audit.mjs` — workflow scripts have no filesystem access, so a YAML data file
would only add plumbing.

**Phase 3 — Dedup + verification.** Findings dedup by file+category (plain code at a
barrier). Each unique finding goes to a 3-skeptic majority-vote panel with distinct lenses
(does-it-reproduce, exploitability/real-impact, context-the-finder-missed). Majority refute
kills the finding; survivors keep consolidated evidence.

**Phase 4 — Synthesis & report.** One synthesis agent writes `Docs/audit-YYYY-MM-DD.md`
in the audited project: executive summary, severity-ranked confirmed findings with
file:line and remediation, refuted-findings appendix, scout inventory. Chat gets a short
top-findings summary.

**Thorough mode (opt-in).** If the user says "thorough"/"exhaustive" (or passes
`mode: "thorough"`), Phase 2 switches to loop-until-dry: repeated finder rounds, deduping
against everything seen, until two consecutive rounds surface nothing new. SKILL.md warns
about cost before running this mode.

## Bundled assets

```
agents/                          # plugin-level (shared by future swarm skills)
  security-auditor.md            # read-only finder: Read/Grep/Glob/Bash only
  finding-skeptic.md             # read-only adversarial verifier
skills/audit-swarm/
  SKILL.md                       # trigger, phases, invocation, report contract
  workflows/audit.mjs            # the Workflow script (agentType: 'security-auditor' / 'finding-skeptic')
```

Agent definitions carry shared posture (read-only tool restriction, evidence-required,
output discipline); per-dimension behavior stays in prompts built by the script.

## Testing

Repo `creating-a-skill` conventions: RED baseline (agent audits a seeded-vulnerable
fixture without the skill), GREEN run with the skill, scenario under
`tests/scenarios/audit-swarm/`. `node --check` on `audit.mjs` as a syntax gate.
