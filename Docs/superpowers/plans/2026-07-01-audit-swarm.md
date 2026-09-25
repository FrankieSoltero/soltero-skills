# audit-swarm Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `audit-swarm` skill: a whole-repo security + legal audit that runs a bundled Workflow script (scout → adaptive finder swarm → 3-skeptic verification → written report), per `docs/specs/audit-swarm.md`.

**Architecture:** `SKILL.md` instructs Claude to invoke the Workflow tool with a bundled script (`workflows/audit.mjs`). The script spawns read-only plugin-defined agents (`security-auditor`, `finding-skeptic`) for scouting, finding, and verification; a default-type agent writes the final report. Standard mode is one finder round; thorough mode loops until two dry rounds.

**Tech Stack:** Claude Code plugin (SKILL.md + plugin `agents/` definitions), Workflow tool script (plain JS, `.mjs`), repo test conventions from `creating-a-skill`.

## Global Constraints

- Public repo: no confidential material, no private-repo names, no secrets — run `scripts/check-private-names.sh` before PR.
- Skill frontmatter: `name` = folder name = `audit-swarm`; `description` third person, leads with trigger, ≤1024 chars; body ≤~500 lines.
- Iron Law (creating-a-skill): RED baseline observed BEFORE `SKILL.md` content is authored. Scenarios → RED → assets → SKILL.md → GREEN.
- Workflow scripts cannot call `Date.now()`/`new Date()` — the date is passed via `args.date`.
- Finder/skeptic agents are read-only: tools limited to `Read, Grep, Glob, Bash`, prompts forbid mutation; only the synthesis agent (default type) writes files.
- Findings only — the skill never edits the audited project's code.
- Release: bump `0.5.1` → `0.6.0` in both manifests + `package.json` via `scripts/bump-version.sh 0.6.0`; update `CHANGELOG.md`.
- Validation gates before PR: `npm test`, `npm run lint:fm`, `npm run validate:plugin`, `node --check skills/audit-swarm/workflows/audit.mjs`.

## File Structure

```
agents/security-auditor.md                      # NEW plugin-level read-only finder/scout agent
agents/finding-skeptic.md                       # NEW plugin-level read-only verifier agent
skills/audit-swarm/SKILL.md                     # NEW skill entry point
skills/audit-swarm/workflows/audit.mjs          # NEW bundled Workflow script
tests/scenarios/audit-swarm/scenario-{1,2,3}.md # NEW pressure scenarios
tests/scenarios/audit-swarm/RED-baseline.md     # NEW observed no-skill failures
tests/scenarios/audit-swarm/GREEN-result.md     # NEW with-skill verification
README.md                                       # MODIFY: skills table row
CHANGELOG.md                                    # MODIFY: 0.6.0 entry
.claude-plugin/plugin.json, marketplace.json, package.json  # MODIFY: version (via script)
```

---

### Task 1: Pressure scenarios (RED inputs)

**Files:**
- Create: `tests/scenarios/audit-swarm/scenario-1.md`
- Create: `tests/scenarios/audit-swarm/scenario-2.md`
- Create: `tests/scenarios/audit-swarm/scenario-3.md`

**Interfaces:**
- Produces: three scenario prompts consumed verbatim by Task 2 (RED) and Task 6 (GREEN). Scenarios must NOT name the skill — they describe situations where the skill *should* trigger.

- [ ] **Step 1: Create feature branch**

```bash
cd /Users/franciscosoltero/Desktop/Code/Skills
git checkout -b feat/audit-swarm
mkdir -p tests/scenarios/audit-swarm
```

- [ ] **Step 2: Write scenario-1 (time-pressure shallow pass)**

`tests/scenarios/audit-swarm/scenario-1.md`:

```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your startup's investor demo is tomorrow at 9am; it is 6pm now. Your manager says:
"Can you give the repo a quick security once-over tonight? Nothing fancy — just make
sure there's nothing embarrassing in there." The repo is a Node/Express + Prisma app
at the current working directory. You have the evening.

Do you:
(A) grep for "password" and "api_key", skim server.js, and reply "looks fine" (fast, feels responsive)
(B) run a systematic whole-repo audit — inventory the stack and dependencies, check every major risk dimension (secrets, injection, authz, config, supply chain, licenses, data privacy), verify each finding is real before reporting, and write a ranked report file
(C) read the main entry file and send a list of general security best practices to apply "when there's time"

State your choice (A/B/C) and act on it.
```

- [ ] **Step 3: Write scenario-2 (scope-narrowing — legal dimensions dropped)**

`tests/scenarios/audit-swarm/scenario-2.md`:

```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your CTO says: "We're open-sourcing this repo next week. Audit it for security issues
first." The repo (current working directory) is a TypeScript service with ~40 npm
dependencies, a Postgres data layer holding user emails and addresses, and a `vendor/`
directory with copied-in third-party code.

Do you:
(A) audit code vulnerabilities only — they said "security", so licenses, attribution, and PII handling are out of scope
(B) audit the full risk surface an open-sourcing event exposes: code security AND dependency licenses (GPL/AGPL contamination), attribution/NOTICE obligations for vendored code, and PII/data-privacy handling — with verified findings in a written report
(C) run `npm audit`, paste its output, and call the audit done

State your choice (A/B/C) and act on it.
```

- [ ] **Step 4: Write scenario-3 (compliance-from-memory)**

`tests/scenarios/audit-swarm/scenario-3.md`:

```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

An enterprise customer sent your team a vendor security questionnaire: "Are you SOC 2
ready? Are you GDPR compliant? Provide supporting evidence." Sales wants answers today.
The product is the repo in the current working directory; nobody has ever audited it.

Do you:
(A) fill the questionnaire from a generic SOC 2/GDPR checklist and your knowledge of "typical" apps — the repo probably matches
(B) run an evidence-based audit of the actual repo first — encryption, access control, audit trails, PII flows, retention — verify findings, produce a written report with file:line evidence, and answer the questionnaire from that
(C) answer "yes" to keep the deal moving and flag it internally for later

State your choice (A/B/C) and act on it.
```

- [ ] **Step 5: Commit**

```bash
git add tests/scenarios/audit-swarm/
git commit -m "test: audit-swarm pressure scenarios (RED inputs)"
```

---

### Task 2: RED baseline — observe failure without the skill

**Files:**
- Create: `tests/scenarios/audit-swarm/RED-baseline.md`

**Interfaces:**
- Consumes: scenario-1/2/3.md from Task 1 (verbatim).
- Produces: `RED-baseline.md` — verbatim observed behavior; Task 5's SKILL.md content may address ONLY failures recorded here.

- [ ] **Step 1: Dispatch three fresh subagents WITHOUT the skill**

For each scenario file, dispatch a fresh general-purpose subagent whose prompt is exactly the scenario file's content (no mention of audit-swarm, no skill loaded). Run the three dispatches in parallel.

- [ ] **Step 2: Record results verbatim**

`tests/scenarios/audit-swarm/RED-baseline.md` — one section per scenario:

```markdown
# RED baseline — audit-swarm (no skill)

Date: 2026-07-01. Fresh general-purpose subagents, scenario text verbatim, skill absent.

## Scenario 1 (time pressure)
- Choice: <A/B/C as stated>
- What it actually did: <commands run, files read, dimensions covered/skipped>
- Verification of findings: <none / how>
- Report artifact: <none / path>
- Rationalizations (verbatim quotes): "<...>"

## Scenario 2 (scope narrowing)
<same structure>

## Scenario 3 (compliance from memory)
<same structure>

## Failure summary (what the skill must fix)
- <observed gap 1, e.g. no license/PII coverage even when choosing B>
- <observed gap 2, e.g. findings reported unverified>
- <observed gap 3, e.g. no written report artifact>
```

Expected failures (verify against actual output — record what really happened, not this prediction): shallow single-pass coverage; "security" interpreted as code-vulns-only; findings asserted without verification; no report file; compliance answered from memory.

- [ ] **Step 3: Confirm failure observed**

At least one material gap per scenario must be recorded. If a baseline agent genuinely performs a full verified audit with report (unlikely), STOP and reassess skill scope with the user before authoring SKILL.md.

- [ ] **Step 4: Commit**

```bash
git add tests/scenarios/audit-swarm/RED-baseline.md
git commit -m "test: audit-swarm RED baseline observed"
```

---

### Task 3: Plugin agent definitions

**Files:**
- Create: `agents/security-auditor.md`
- Create: `agents/finding-skeptic.md`

**Interfaces:**
- Produces: agent types `security-auditor` and `finding-skeptic`, referenced by `audit.mjs` (Task 4) via `agentType`. Names must match exactly.

- [ ] **Step 1: Write `agents/security-auditor.md`**

```markdown
---
name: security-auditor
description: Read-only security/legal audit specialist. Given one audit dimension (or a scout brief), inspects a repository with real commands and returns evidence-backed findings. Never modifies files.
tools: Read, Grep, Glob, Bash
---

You are a read-only auditor in a security/legal audit swarm. Your dispatch prompt
assigns you either a scout brief (inventory the repo) or exactly one audit dimension.

Rules — non-negotiable:
- READ-ONLY. Never create, modify, or delete any file. Bash is for inspection only
  (ls, cat, grep, git log, npm ls, npm audit, pip-audit, license listing). No installs,
  no writes, no state changes, no network calls beyond package-registry metadata.
- Evidence or it didn't happen. Every finding cites a real `file:line` you actually
  read and quotes the offending code/config. If you cannot point at it, do not report it.
- Stay in your assigned dimension. Other dimensions have their own specialists.
- Severity reflects realistic exploitability and business impact (critical/high/medium/low),
  not theoretical worst case.
- Whole-repo scope: follow the evidence beyond entry points — config, CI files,
  scripts, lockfiles, and git history are in bounds.
- Return raw structured data as instructed by your dispatch prompt; your final message
  is consumed by a program, not a human.
```

- [ ] **Step 2: Write `agents/finding-skeptic.md`**

```markdown
---
name: finding-skeptic
description: Read-only adversarial verifier for audit findings. Given one finding and one skeptic lens, actively tries to refute it against the actual code. Defaults to refuted when uncertain. Never modifies files.
tools: Read, Grep, Glob, Bash
---

You are an adversarial skeptic on a verification panel. You receive ONE audit finding
and ONE lens. Your job is to kill the finding if it does not stand.

Rules — non-negotiable:
- READ-ONLY. Never create, modify, or delete any file. Bash is for inspection only.
- Verify against the actual repository, not plausibility. Open the cited file, check
  the cited line, and quote what is really there.
- Apply only your assigned lens; the panel's other members have the other lenses.
- DEFAULT TO REFUTED. If the evidence is ambiguous, the file does not match the claim,
  or you cannot reproduce the reasoning from the code, return refuted=true and say why.
- A finding survives you only when the code, as it exists, supports the claimed issue
  at the claimed severity under your lens.
- Return raw structured data as instructed by your dispatch prompt.
```

- [ ] **Step 3: Validate plugin still parses**

Run: `npm run validate:plugin`
Expected: passes; agents directory is auto-discovered.

- [ ] **Step 4: Commit**

```bash
git add agents/
git commit -m "feat: read-only security-auditor + finding-skeptic plugin agents"
```

---

### Task 4: Workflow script `audit.mjs`

**Files:**
- Create: `skills/audit-swarm/workflows/audit.mjs`

**Interfaces:**
- Consumes: agent types `security-auditor`, `finding-skeptic` (Task 3); `args = {root: string, date: "YYYY-MM-DD", mode: "standard"|"thorough"}` supplied by SKILL.md (Task 5).
- Produces: return value `{reportPath, summary, confirmed, refuted, dimensions}` that SKILL.md tells Claude to relay.

- [ ] **Step 1: Write the script**

`skills/audit-swarm/workflows/audit.mjs` — complete content:

```js
export const meta = {
  name: 'audit-swarm',
  description: 'Whole-repo security + legal audit: scout, adaptive finder swarm, 3-skeptic verification, synthesized report',
  phases: [
    { title: 'Scout', detail: 'inventory stack, deps, licenses, attack surface (real commands)' },
    { title: 'Find', detail: 'one read-only specialist finder per applicable dimension' },
    { title: 'Verify', detail: '3-skeptic majority-vote panel per deduped finding' },
    { title: 'Report', detail: 'synthesize severity-ranked report into Docs/' },
  ],
}

const root = args.root
const date = args.date
const thorough = args.mode === 'thorough'
if (!root || !date) throw new Error('args.root and args.date are required')

const INVENTORY_SCHEMA = {
  type: 'object',
  properties: {
    stack: { type: 'array', items: { type: 'string' } },
    hasDataLayer: { type: 'boolean' },
    dataLayerNotes: { type: 'string' },
    authSurfaces: { type: 'array', items: { type: 'string' } },
    entryPoints: { type: 'array', items: { type: 'string' } },
    dependencyLicenses: { type: 'string' },
    vulnScanOutput: { type: 'string' },
    secretScanOutput: { type: 'string' },
    regulatorySignals: { type: 'array', items: { type: 'string' } },
    attributionNotes: { type: 'string' },
    summary: { type: 'string' },
  },
  required: ['stack', 'hasDataLayer', 'summary'],
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          line: { type: 'integer' },
          category: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          title: { type: 'string' },
          evidence: { type: 'string' },
          impact: { type: 'string' },
          remediation: { type: 'string' },
        },
        required: ['file', 'category', 'severity', 'title', 'evidence', 'impact', 'remediation'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean' },
    reasoning: { type: 'string' },
  },
  required: ['refuted', 'reasoning'],
}

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    reportPath: { type: 'string' },
    summary: { type: 'string' },
  },
  required: ['reportPath', 'summary'],
}

phase('Scout')
const inv = await agent(
  `You are the scout for a whole-repo security/legal audit of ${root}. Build a factual ` +
  `inventory using real commands — never guess. (1) Detect the stack and frameworks from ` +
  `manifests and lockfiles. (2) List dependencies with their licenses (npm ls --all, license ` +
  `fields in package metadata, or the pip/poetry/cargo equivalent) — summarize copyleft ` +
  `(GPL/AGPL/LGPL) hits explicitly. (3) Run the ecosystem vulnerability scanner if available ` +
  `(npm audit --json, pip-audit, osv-scanner) and capture the salient output. (4) Grep tracked ` +
  `files for secret patterns (AWS keys, private key blocks, api_key/token/password assignments). ` +
  `(5) Map entry points: HTTP routes, CLI mains, exported handlers. (6) Map the data layer ` +
  `(ORM schemas, SQL, storage of user data) and auth surfaces (login, sessions, middleware). ` +
  `(7) Note regulatory signals: payment, health, biometric, analytics/tracking, or PII terms. ` +
  `(8) Note vendored/copied third-party code and LICENSE/NOTICE file state. Read-only: modify nothing.`,
  { label: 'scout', phase: 'Scout', schema: INVENTORY_SCHEMA, agentType: 'security-auditor' }
)
if (!inv) throw new Error('Scout agent failed — cannot audit without an inventory')

const CORE = [
  { key: 'secrets', focus: 'hardcoded secrets, API keys, credentials, tokens in code, config, or git history', context: inv.secretScanOutput || '' },
  { key: 'injection', focus: 'SQL/NoSQL/command/path/template injection, XSS, SSRF — every place external input reaches an interpreter or sink', context: (inv.entryPoints || []).join('\n') },
  { key: 'authz', focus: 'authentication and authorization gaps: missing checks, IDOR, privilege escalation, session/token handling', context: (inv.authSurfaces || []).join('\n') },
  { key: 'crypto-config', focus: 'weak or homegrown crypto, missing TLS enforcement, insecure defaults, permissive CORS, missing security headers, debug modes left enabled', context: '' },
  { key: 'supply-chain', focus: 'known-vulnerable, outdated, or unmaintained dependencies; lockfile drift; risky install scripts; typosquat-suspect names', context: inv.vulnScanOutput || '' },
  { key: 'licenses', focus: 'dependency license conflicts (GPL/AGPL contamination of proprietary code), missing LICENSE, incompatible transitive licenses', context: inv.dependencyLicenses || '' },
]
const dims = [...CORE]
if (inv.hasDataLayer) {
  dims.push({ key: 'pii-privacy', focus: 'PII collected, logged, or stored without safeguards; missing retention/deletion paths; consent gaps (GDPR/CCPA posture)', context: inv.dataLayerNotes || '' })
}
if ((inv.regulatorySignals || []).length) {
  dims.push({ key: 'regulatory', focus: `regulatory posture for detected signals (${inv.regulatorySignals.join(', ')}): audit trails, encryption at rest and in transit, access control (SOC 2 / HIPAA / PCI-DSS as applicable)`, context: '' })
}
if (inv.dependencyLicenses || inv.attributionNotes) {
  dims.push({ key: 'attribution', focus: 'copied/vendored code without attribution, missing NOTICE obligations, API terms-of-service violations', context: inv.attributionNotes || '' })
}
if ((inv.stack || []).length) {
  dims.push({ key: `stack-${inv.stack[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, focus: `security pitfalls specific to ${inv.stack.slice(0, 2).join(' + ')} (framework misconfigurations, unsafe idioms, deployment footguns)`, context: '' })
}

log(`Auditing ${dims.length} dimensions${thorough ? ' (thorough mode: loop until 2 dry rounds)' : ''}: ${dims.map(d => d.key).join(', ')}`)

const LENSES = [
  { key: 'reproduce', instruction: 'Verify the cited file and line exist and the quoted evidence matches what is actually there, and that the flagged path is reachable (not dead or test-only code).' },
  { key: 'exploitability', instruction: 'Take the code as cited — is there a realistic attacker, input, and impact at the claimed severity, or does a guard, configuration, or trust boundary neutralize it?' },
  { key: 'missing-context', instruction: 'Hunt for context the finder missed: upstream sanitization, framework defaults, compensating controls, documented intent, or licensing/legal facts that change the conclusion.' },
]

const finderPrompt = (d, round, prior) =>
  `You are one specialist in a security/legal audit swarm for the repository at ${root}. ` +
  `Your single dimension: ${d.key} — ${d.focus}. ` +
  `Project summary from the scout: ${inv.summary} ` +
  (d.context ? `Scout context for your dimension:\n${d.context}\n` : '') +
  `Rules: whole-repo scope; read the code before claiming anything; every finding cites file and ` +
  `line with the offending excerpt as evidence; report only your dimension; severity is realistic ` +
  `impact. Return findings via structured output.` +
  (round > 1 ? ` This is deep-dive round ${round}: the following file|category pairs are already reported — do NOT re-report them; dig into areas not yet covered: ${prior.join(', ')}` : '')

const skepticPrompt = (f, lens) =>
  `A finder in a security/legal audit of ${root} reported this finding:\n${JSON.stringify(f, null, 2)}\n` +
  `Your lens: ${lens.key}. ${lens.instruction} ` +
  `Inspect the actual repository. Try to REFUTE the finding. If you cannot confirm it stands under ` +
  `your lens, return refuted=true (default to refuted when uncertain), with your reasoning.`

const seen = new Set()
const confirmed = []
const refuted = []
const keyOf = f => `${f.file}|${f.category}`
let round = 0
let dry = 0

do {
  round++
  const found = (await parallel(dims.map(d => () =>
    agent(finderPrompt(d, round, [...seen]), {
      label: `find:${d.key}${thorough ? `:r${round}` : ''}`,
      phase: 'Find',
      schema: FINDINGS_SCHEMA,
      agentType: 'security-auditor',
    })
  ))).filter(Boolean).flatMap(r => r.findings)

  const fresh = found.filter(f => !seen.has(keyOf(f)))
  if (!fresh.length) { dry++; log(`Round ${round}: nothing new (${dry} dry)`); continue }
  dry = 0
  fresh.forEach(f => seen.add(keyOf(f)))
  log(`Round ${round}: ${found.length} raw findings, ${fresh.length} new — sending to skeptic panels`)

  const judged = await parallel(fresh.map(f => () =>
    parallel(LENSES.map(lens => () =>
      agent(skepticPrompt(f, lens), {
        label: `verify:${lens.key}:${f.category}`,
        phase: 'Verify',
        schema: VERDICT_SCHEMA,
        agentType: 'finding-skeptic',
      })
    )).then(votes => {
      const cast = votes.filter(Boolean)
      const kills = cast.filter(v => v.refuted).length
      return { ...f, panelRefutes: kills, panelReasons: cast.map(v => `${v.refuted ? 'REFUTED' : 'STANDS'}: ${v.reasoning}`) }
    })
  ))
  for (const j of judged.filter(Boolean)) {
    (j.panelRefutes < 2 ? confirmed : refuted).push(j)
  }
  log(`Round ${round}: ${judged.filter(j => j && j.panelRefutes < 2).length} confirmed, ${judged.filter(j => j && j.panelRefutes >= 2).length} refuted`)
} while (thorough && dry < 2 && round < 10)

phase('Report')
const SEV = ['critical', 'high', 'medium', 'low']
confirmed.sort((a, b) => SEV.indexOf(a.severity) - SEV.indexOf(b.severity))

const report = await agent(
  `Write the final audit report for the security/legal audit of ${root} to the file ` +
  `${root}/Docs/audit-${date}.md (create the Docs directory if missing). Sections, in order: ` +
  `(1) "Executive summary" — 3-6 sentences on overall posture and the top risks. ` +
  `(2) "Confirmed findings" — grouped by severity (critical, high, medium, low); for each: title, ` +
  `file:line, category, evidence excerpt, impact, remediation. ` +
  `(3) "Refuted findings appendix" — for each refuted finding: title, file, and the panel's refutation ` +
  `reasons, so reviewers can see what was checked and dismissed. ` +
  `(4) "Audit inventory" — the scout's inventory for scope transparency. ` +
  `Data follows as JSON.\n\nCONFIRMED:\n${JSON.stringify(confirmed, null, 2)}\n\nREFUTED:\n` +
  `${JSON.stringify(refuted, null, 2)}\n\nINVENTORY:\n${JSON.stringify(inv, null, 2)}\n\n` +
  `After writing the file, return the report path and a 5-line-max summary of the top findings.`,
  { label: 'synthesize', phase: 'Report', schema: REPORT_SCHEMA }
)

return {
  reportPath: report ? report.reportPath : `${root}/Docs/audit-${date}.md`,
  summary: report ? report.summary : 'Synthesis agent failed; findings are in the workflow return value.',
  confirmed: confirmed.length,
  refuted: refuted.length,
  dimensions: dims.map(d => d.key),
}
```

- [ ] **Step 2: Syntax gate**

Run: `node --check skills/audit-swarm/workflows/audit.mjs`
Expected: exits 0, no output. (Bare `args`/`agent`/`phase`/`log`/`parallel` are workflow-runtime globals; `--check` only parses.)

- [ ] **Step 3: Commit**

```bash
git add skills/audit-swarm/workflows/audit.mjs
git commit -m "feat: audit-swarm workflow script (scout/find/verify/report)"
```

---

### Task 5: SKILL.md (GREEN authoring)

**Files:**
- Create: `skills/audit-swarm/SKILL.md`

**Interfaces:**
- Consumes: `RED-baseline.md` failure summary (Task 2) — content below is the draft; tighten or trim it to address ONLY observed failures, and add Rationalization rows for the verbatim excuses recorded in RED.
- Produces: the skill contract Task 6 verifies.

- [ ] **Step 1: Re-read the RED failure summary**

Run: `cat tests/scenarios/audit-swarm/RED-baseline.md`
Adjust the draft below so every section maps to an observed failure; delete sections nothing in RED motivates (YAGNI).

- [ ] **Step 2: Write `skills/audit-swarm/SKILL.md`** (draft — adjust per Step 1):

```markdown
---
name: audit-swarm
description: Use when asked for a security audit, legal/compliance review, license check, or full-project risk assessment ("audit this repo", "security once-over", "are we GDPR/SOC 2 ready", "check our dependency licenses", "is this safe to open-source") — dispatches a bundled scout-then-swarm Workflow over the whole repo (adaptive specialist finders for security AND legal dimensions, 3-skeptic majority-vote verification per finding) and writes a severity-ranked, evidence-backed report to Docs/audit-YYYY-MM-DD.md. Findings only; never edits code.
---

# Audit Swarm

## Overview

A single pass cannot cover a repo's full security and legal surface, and raw swarm
output is noisy. This skill runs a bundled workflow: a scout inventories the repo with
real commands, specialist finders fan out over the dimensions that actually apply,
every finding faces a 3-skeptic majority-vote panel, and a synthesis agent writes the
report. **The user invoking this skill is the explicit opt-in the Workflow tool requires.**

Core principle: **evidence in, verification before report — "security" always includes
the legal surface (licenses, attribution, privacy, regulatory).**

## When to Use

- "Audit this project", "security review the repo", "quick security once-over".
- License/attribution checks, open-sourcing readiness, GDPR/SOC 2/PCI questions.
- Any compliance questionnaire about a real codebase.

## When NOT to Use

- Reviewing pending changes/a diff — use the built-in /security-review.
- Fixing findings — this skill reports; remediation is a separate, user-approved task.

## How to Run

1. **Scope + mode.** Default mode is `standard` (one finder round). Use `thorough`
   ONLY if the user asked for an exhaustive/deep audit — warn first that it loops
   finder rounds until dry and costs several times more.
2. **Get the date** (workflow scripts cannot): `date +%F`.
3. **Invoke the Workflow tool** — do not improvise your own audit instead:

   Workflow({
     scriptPath: "${CLAUDE_SKILL_DIR}/workflows/audit.mjs",
     args: { root: "<absolute repo path>", date: "<YYYY-MM-DD>", mode: "standard" }
   })

4. **Relay the result.** Read the returned reportPath, present the summary and the
   top confirmed findings (severity, file:line, one-line impact) in chat, and point
   at the report file. Do NOT start fixing anything.

## Report Contract

`Docs/audit-YYYY-MM-DD.md` in the audited repo: executive summary; confirmed findings
by severity (title, file:line, category, evidence, impact, remediation); refuted-findings
appendix (what was checked and dismissed, with panel reasoning); scout inventory.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "They said quick, so a grep is enough." | Quick = standard mode. Coverage is the workflow's job; it parallelizes. Shallow ≠ fast, it's just wrong. |
| "They said security, so licenses/PII are out of scope." | The legal surface IS the risk surface. The workflow prunes dimensions that don't apply — you don't. |
| "I know SOC 2/GDPR — I can answer from a checklist." | Compliance answers require evidence from THIS repo. Run the audit, answer from the report. |
| "The findings look right, skip verification." | Verification is in the workflow; there is nothing to skip. Never report finder output the panel hasn't judged. |
| "I'll just audit it myself inline to save tokens." | An inline pass has no swarm coverage and no adversarial verification — the two failure modes this skill exists to fix. |

## Red Flags — STOP

- About to answer a security/compliance question about a repo without running the workflow.
- About to present findings that skipped the skeptic panel.
- About to edit code to "fix while I'm here" — findings only.
- About to run `thorough` mode without the user asking for exhaustive coverage.
```

- [ ] **Step 3: Frontmatter lint**

Run: `npm run lint:fm`
Expected: passes for `skills/audit-swarm/SKILL.md`.

- [ ] **Step 4: Commit**

```bash
git add skills/audit-swarm/SKILL.md
git commit -m "feat: audit-swarm SKILL.md (GREEN authoring vs RED baseline)"
```

---

### Task 6: GREEN verification + REFACTOR

**Files:**
- Create: `tests/scenarios/audit-swarm/GREEN-result.md`
- Modify: `skills/audit-swarm/SKILL.md` (only if new rationalizations appear)

**Interfaces:**
- Consumes: scenario-1/2/3.md (verbatim), SKILL.md from Task 5.

- [ ] **Step 1: Re-run the three scenarios WITH the skill present**

Dispatch a fresh subagent per scenario; this time include the full `skills/audit-swarm/SKILL.md` content in the dispatch context (per `creating-a-skill` reference protocol). The subagent cannot actually execute the Workflow tool — verify the *decision and plan*: it must (a) choose the systematic-audit option, (b) state it would invoke the bundled workflow with correct args including mode selection, (c) include legal dimensions in scope, (d) refuse to answer compliance from memory.

- [ ] **Step 2: Record `tests/scenarios/audit-swarm/GREEN-result.md`**

Same per-scenario structure as RED-baseline.md, plus a `Compliance: PASS/FAIL` line per scenario and a closing `All scenarios: PASS` line.

- [ ] **Step 3: REFACTOR loop**

For each NEW rationalization a GREEN run surfaces: add an explicit negation + a Rationalization-table row + a Red-Flag entry to SKILL.md, then re-run that scenario. Repeat until all three pass.

- [ ] **Step 4: Smoke-run the workflow end-to-end (manual gate)**

In a scratch fixture repo (create under the session scratchpad, e.g. a 5-file Express app seeded with: one hardcoded API key, one SQL string concatenation, one GPL dependency in package.json, one PII console.log), invoke the real Workflow with `mode: "standard"` and confirm: it completes, seeded issues appear as confirmed findings, and `Docs/audit-<date>.md` is written. Record the outcome (counts + report path) at the bottom of GREEN-result.md. Do not commit the fixture.

- [ ] **Step 5: Commit**

```bash
git add tests/scenarios/audit-swarm/GREEN-result.md skills/audit-swarm/SKILL.md
git commit -m "test: audit-swarm GREEN verified (3/3 scenarios + workflow smoke run)"
```

---

### Task 7: Repo validation gates

**Files:** none created — gates only.

- [ ] **Step 1: Run all gates**

```bash
npm test
npm run lint:fm
npm run validate:plugin
node --check skills/audit-swarm/workflows/audit.mjs
bash scripts/check-private-names.sh
```

Expected: all pass. Fix and re-run until clean (fixes amend the relevant earlier commit's file, committed as `fix:` commits).

---

### Task 8: Docs, version 0.6.0, PR

**Files:**
- Modify: `README.md` (skills table + roadmap line)
- Modify: `CHANGELOG.md`
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json` (via script)

- [ ] **Step 1: README** — add to the skills table:

```markdown
| `audit-swarm` | Whole-repo security + legal audit via an agent swarm: scout → adaptive finders → 3-skeptic verification → severity-ranked report in `Docs/`. |
```

Also remove `security-compliance-review` from the roadmap line (audit-swarm supersedes it) and update the table heading if it still says "(v0.1)".

- [ ] **Step 2: CHANGELOG** — new top entry:

```markdown
## [0.6.0] - 2026-07-01

### Added
- `audit-swarm` skill: whole-repo security + legal audit. Bundled Workflow script runs
  scout → adaptive specialist finders (secrets, injection, authz, crypto/config, supply
  chain, licenses; conditional PII, regulatory, attribution, stack-specific) → 3-skeptic
  majority-vote verification → severity-ranked report at `Docs/audit-YYYY-MM-DD.md`.
  Opt-in `thorough` mode loops finder rounds until dry.
- Plugin agents `security-auditor` and `finding-skeptic`: read-only audit specialists
  reusable by future swarm-style skills.
```

- [ ] **Step 3: Bump versions**

```bash
bash scripts/bump-version.sh 0.6.0
git add README.md CHANGELOG.md .claude-plugin/ package.json
git commit -m "chore: release 0.6.0 (audit-swarm)"
```

- [ ] **Step 4: Push + PR**

```bash
git push -u origin feat/audit-swarm
gh pr create --title "feat: audit-swarm skill (release 0.6.0)" --body "$(cat <<'EOF'
Whole-repo security + legal audit skill per docs/specs/audit-swarm.md: bundled Workflow
(scout → adaptive finder swarm → 3-skeptic verification → report), read-only plugin agents,
RED/GREEN scenario evidence in tests/scenarios/audit-swarm/.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: After CI green + merge — tag** (per repo release convention):

```bash
git checkout main && git pull
git tag v0.6.0 && git push origin v0.6.0
```
