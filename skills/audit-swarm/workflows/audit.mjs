export const meta = {
  name: 'audit-swarm',
  description: 'Whole-repo security + legal audit: scout, adaptive finder swarm, severity-scaled skeptic verification (1 lens for low/medium, 3-lens majority vote for high/critical), synthesized report',
  phases: [
    { title: 'Canary', detail: 'plant-and-detect a seeded defect to prove the finder+skeptic harness is live' },
    { title: 'Scout', detail: 'inventory stack, deps, licenses, attack surface (real commands)' },
    { title: 'Find', detail: 'one read-only specialist finder per applicable dimension' },
    { title: 'Verify', detail: 'severity-scaled skeptic panel per deduped finding' },
    { title: 'Report', detail: 'synthesize severity-ranked report into Docs/' },
  ],
}

// Some runtimes deliver the Workflow `args` value as a JSON string rather than a parsed
// object; tolerate both so `args.root` is never silently undefined.
const opts = typeof args === 'string' ? JSON.parse(args) : (args || {})
const root = opts.root
const date = opts.date
const thorough = opts.mode === 'thorough'
// Seeded-defect canary: the caller writes a fixture file containing one deliberate,
// unambiguous defect (the script has no filesystem access) and passes its path here. A run
// without one cannot distinguish "this repo is clean" from "the harness never fired", so the
// canary is required, not optional.
const canaryPath = opts.canaryPath
const canaryToken = opts.canaryToken || ''
const canaryExpect = opts.canaryExpect || 'a hard-coded credential assigned in source'
if (!root || !date) throw new Error('args.root and args.date are required')
if (!canaryPath) throw new Error(
  'args.canaryPath is required: write the seeded-defect canary fixture first (SKILL.md step 2, ' +
  '"Plant the canary") and pass its absolute path. Without it a zero-finding run cannot be told ' +
  'apart from a dead harness, and this audit would have no way to earn the word "clean".'
)

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

const LENSES = [
  { key: 'reproduce', instruction: 'Verify the cited file and line exist and the quoted evidence matches what is actually there, and that the flagged path is reachable (not dead or test-only code).' },
  { key: 'exploitability', instruction: 'Take the code as cited — is there a realistic attacker, input, and impact at the claimed severity, or does a guard, configuration, or trust boundary neutralize it?' },
  { key: 'missing-context', instruction: 'Hunt for context the finder missed: upstream sanitization, framework defaults, compensating controls, documented intent, or licensing/legal facts that change the conclusion.' },
]

const skepticPrompt = (f, lens, target) =>
  `A finder in a security/legal audit of ${target} reported this finding:\n${JSON.stringify(f, null, 2)}\n` +
  `Your lens: ${lens.key}. ${lens.instruction} ` +
  `Inspect the actual code at that path. Try to REFUTE the finding. If you cannot confirm it stands ` +
  `under your lens, return refuted=true (default to refuted when uncertain), with your reasoning.`

// Severity-scaled panel: high/critical findings get the full 3-lens majority vote;
// low/medium findings get a single reproduce-lens check (does the cited file:line and
// evidence actually exist) since a false positive there costs report noise, not a missed
// real risk — the expensive adversarial panel is reserved for where it changes the outcome.
const lensesFor = f => (f.severity === 'critical' || f.severity === 'high') ? LENSES : LENSES.slice(0, 1)

// One finding through its panel. Used by both the audit swarm and the canary phase, so the
// canary exercises the very same verification path the real findings take — a canary that
// went through a different code path would prove nothing about this run.
const judgeFinding = (f, target = root, labelPrefix = 'verify') => {
  const lenses = lensesFor(f)
  return parallel(lenses.map(lens => () =>
    agent(skepticPrompt(f, lens, target), {
      label: `${labelPrefix}:${lens.key}:${f.category}`,
      phase: 'Verify',
      schema: VERDICT_SCHEMA,
      agentType: 'finding-skeptic',
      model: 'sonnet',
      effort: 'low',
    })
  )).then(votes => {
    const cast = votes.filter(Boolean)
    const kills = cast.filter(v => v.refuted).length
    // Quorum: a panel that reports fewer than it was sent did not actually verify this
    // finding. Defaulting to "confirmed" there would invert the skill's promise
    // ("verified before reported") and the skeptics' own default-to-refuted posture, so
    // an under-quorum panel refutes. Full panels need 2-of-3; a single-lens panel needs
    // its one vote to actually come back.
    const requiredQuorum = lenses.length >= 3 ? 2 : 1
    const hasQuorum = cast.length >= requiredQuorum
    const survives = hasQuorum && (lenses.length >= 3 ? kills < 2 : kills === 0)
    return {
      ...f,
      panelVotes: cast.length,
      panelSize: lenses.length,
      panelRefutes: kills,
      panelReasons: hasQuorum
        ? cast.map(v => `${v.refuted ? 'REFUTED' : 'STANDS'}: ${v.reasoning}`)
        : [`REFUTED (no quorum): only ${cast.length} of ${lenses.length} skeptic(s) reported; cannot confirm without a panel.`],
      survives,
    }
  })
}

// ---- Canary: prove the harness is live before trusting anything it says --------------
// A finder swarm that silently fails returns exactly what a clean repo returns: nothing.
// So every run first re-discovers a defect we already know is there. Two directions are
// checked, because a harness can fail either way:
//   detection  — a finder must independently report the seeded defect, and
//   judgement  — the skeptic panel must CONFIRM that true finding and REFUTE a fabricated
//                one (a panel that rubber-stamps or that kills everything is not verifying).
// Any miss means the run's silence is uninformative: the audit reports HARNESS NOT LIVE
// rather than "clean".
phase('Canary')
const canaryFile = canaryPath.split('/').pop()
const canaryFound = await agent(
  `Audit the file at ${canaryPath} for security defects — hardcoded secrets, credentials, API ` +
  `keys, and tokens above all. Read the file and report every defect you find, each with its ` +
  `file path, line, severity, and the offending excerpt as evidence. Report nothing you have not ` +
  `read. Read-only: modify nothing.`,
  { label: 'canary:find', phase: 'Canary', schema: FINDINGS_SCHEMA, agentType: 'security-auditor', model: 'sonnet' }
)

const canaryHit = ((canaryFound && canaryFound.findings) || []).find(f => {
  const inFixture = (f.file || '').includes(canaryFile)
  const matchesToken = !canaryToken || `${f.evidence || ''} ${f.title || ''}`.includes(canaryToken)
  return inFixture && matchesToken
})

// A finding the fixture does NOT support: same file, a defect class that is not in it, at a
// line that does not exist. The panel must kill this. Fabricated on purpose — it never reaches
// the report as a finding. Severity 'medium' on purpose too: that routes it to the single
// reproduce lens, which is precisely the check a fabricated citation must fail, for one call
// instead of three.
const decoyFinding = {
  file: canaryPath,
  line: 99999,
  category: 'injection',
  severity: 'medium',
  title: 'Unsanitized user input concatenated into a SQL query',
  evidence: `db.query("SELECT * FROM users WHERE id = " + req.params.id) at ${canaryPath}:99999`,
  impact: 'Full database read/write via SQL injection.',
  remediation: 'Use a parameterized query.',
}

const [canaryJudged, decoyJudged] = await parallel([
  () => canaryHit ? judgeFinding(canaryHit, canaryPath, 'canary-verify') : Promise.resolve(null),
  () => judgeFinding(decoyFinding, canaryPath, 'canary-decoy'),
])

const canary = {
  path: canaryPath,
  expected: canaryExpect,
  detected: Boolean(canaryHit),
  confirmed: canaryJudged ? canaryJudged.survives : false,
  decoyRefuted: decoyJudged ? !decoyJudged.survives : false,
}
canary.live = canary.detected && canary.confirmed && canary.decoyRefuted
canary.note = canary.live
  ? 'Harness live: the seeded defect was independently found and confirmed by the skeptic panel, and a fabricated finding on the same file was refuted.'
  : [
      !canary.detected ? `NOT DETECTED: no finder reported the seeded ${canaryExpect} in ${canaryFile}.` : '',
      canary.detected && !canary.confirmed ? 'DETECTED BUT REFUTED: the skeptic panel killed a defect that is really there — the panel is over-refuting.' : '',
      !canary.decoyRefuted ? 'DECOY CONFIRMED: the skeptic panel let a fabricated finding through — it is rubber-stamping, not verifying.' : '',
    ].filter(Boolean).join(' ')
log(`Canary: ${canary.live ? 'LIVE' : 'NOT LIVE'} — ${canary.note}`)

phase('Scout')
const inv = await agent(
  `You are the scout for a whole-repo security/legal audit of ${root}. Build a factual ` +
  `inventory using real commands — never guess. (1) Detect the stack and frameworks from ` +
  `manifests and lockfiles. (2) List dependencies with their licenses (npm ls --all, license ` +
  `fields in package metadata, or the pip/poetry/cargo equivalent) — summarize copyleft ` +
  `(GPL/AGPL/LGPL) hits explicitly. (3) Run the ecosystem vulnerability scanner if available ` +
  `(npm audit --json, pip-audit, osv-scanner) and capture the salient output. (4) Grep tracked ` +
  `files for secret patterns (AWS keys, private key blocks, api_key/token/password assignments). ` +
  `When reporting a secret match, MASK the value — give the variable/name, file:line, and key ` +
  `type, never the full credential — so the audit report never persists a live secret. ` +
  `(5) Map entry points: HTTP routes, CLI mains, exported handlers. (6) Map the data layer ` +
  `(ORM schemas, SQL, storage of user data) and auth surfaces (login, sessions, middleware). ` +
  `(7) Note regulatory signals: payment, health, biometric, analytics/tracking, or PII terms. ` +
  `(8) Note vendored/copied third-party code and LICENSE/NOTICE file state. Read-only: modify nothing.`,
  { label: 'scout', phase: 'Scout', schema: INVENTORY_SCHEMA, agentType: 'security-auditor', model: 'sonnet' }
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

const finderPrompt = (d, round, prior) =>
  `You are one specialist in a security/legal audit swarm for the repository at ${root}. ` +
  `Your single dimension: ${d.key} — ${d.focus}. ` +
  `Project summary from the scout: ${inv.summary} ` +
  (d.context ? `Scout context for your dimension:\n${d.context}\n` : '') +
  `Rules: whole-repo scope; read the code before claiming anything; every finding cites file and ` +
  `line with the offending excerpt as evidence; report only your dimension; severity is realistic ` +
  `impact. Return findings via structured output.` +
  (round > 1 ? ` This is deep-dive round ${round}: the following file|category|title findings are already reported — do NOT re-report them; dig into areas not yet covered: ${prior.join(', ')}` : '')

const seen = new Set()
const confirmed = []
const refuted = []
// Key on title too: two distinct issues in the same file+category are different findings and
// must not collapse into one (matters across rounds in thorough mode).
const keyOf = f => `${f.file}|${f.category}|${f.title}`
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
      model: 'sonnet',
    })
  ))).filter(Boolean).flatMap(r => r.findings)

  const fresh = found.filter(f => !seen.has(keyOf(f)))
  if (!fresh.length) { dry++; log(`Round ${round}: nothing new (${dry} dry)`); continue }
  dry = 0
  fresh.forEach(f => seen.add(keyOf(f)))
  log(`Round ${round}: ${found.length} raw findings, ${fresh.length} new — sending to skeptic panels`)

  const judged = await parallel(fresh.map(f => () => judgeFinding(f)))
  for (const j of judged.filter(Boolean)) {
    (j.survives ? confirmed : refuted).push(j)
  }
  log(`Round ${round}: ${judged.filter(j => j && j.survives).length} confirmed, ${judged.filter(j => j && !j.survives).length} refuted`)
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
  `(5) "Harness canary" — this run planted one known defect (${canaryExpect}) in a fixture at ` +
  `${canaryPath}, outside the audited repo, and pushed it through the same finder and skeptic ` +
  `path as every real finding. State, from the CANARY JSON below: whether a finder detected it, ` +
  `whether the skeptic panel confirmed it, whether the panel refuted a deliberately fabricated ` +
  `finding, and the resulting verdict. Do not list the canary among the repository's findings — ` +
  `it is not in the audited repo. If any secret VALUE ` +
  `appears in the data below, mask it in the report (keep the name, file:line, and key type). ` +
  (canary.live
    ? `The canary was caught and judged correctly, so this run's results are interpretable as stated. `
    : `HARNESS NOT LIVE: the canary check FAILED (${canary.note}). This run cannot support a clean or ` +
      `reassuring verdict — its silence is uninformative, not evidence of safety. The executive summary ` +
      `MUST open with "HARNESS NOT LIVE — this run's seeded canary defect was not detected and confirmed, ` +
      `so absence of findings is not evidence of absence of risk; re-run before relying on this report." ` +
      `Nowhere in the report may you describe the repository as clean, secure, or free of issues. `) +
  `Data follows as JSON.\n\nCANARY:\n${JSON.stringify(canary, null, 2)}\n\n` +
  `CONFIRMED:\n${JSON.stringify(confirmed, null, 2)}\n\nREFUTED:\n` +
  `${JSON.stringify(refuted, null, 2)}\n\nINVENTORY:\n${JSON.stringify(inv, null, 2)}\n\n` +
  `After writing the file, read it back to confirm it exists and contains every section, ` +
  `then return its path and a summary of the top findings — as long as it needs to be for ` +
  `a reader who sees only that summary, and no longer. Never return a path you have not ` +
  `confirmed on disk; if the write failed, say so instead of returning a path.`,
  { label: 'synthesize', phase: 'Report', schema: REPORT_SCHEMA, model: 'opus' }
)

if (report) {
  return {
    reportPath: report.reportPath,
    // A run whose canary was missed is not a clean bill of health, so its summary never
    // reads as one — whatever the synthesis agent wrote is prefixed with the verdict.
    summary: canary.live
      ? report.summary
      : `HARNESS NOT LIVE — the seeded canary defect was not detected and confirmed by this run ` +
        `(${canary.note}), so this audit proves nothing about ${root}; a zero-finding result here means ` +
        `"unverified", never "clean". Re-run before relying on it. Synthesis summary follows: ${report.summary}`,
    verdict: canary.live ? (confirmed.length ? 'findings' : 'clean') : 'harness-not-live',
    harnessLive: canary.live,
    canary,
    confirmedCount: confirmed.length,
    refutedCount: refuted.length,
    dimensions: dims.map(d => d.key),
  }
}

// Synthesis agent failed: it is the only agent that writes the file, so no report exists.
// Return the actual findings (not just counts) so the caller can still relay/persist them
// and the audit's work is not lost.
const fallbackLines = confirmed.map(f =>
  `- [${f.severity}] ${f.title} — ${f.file}${f.line ? `:${f.line}` : ''} (${f.category})`
)
return {
  reportPath: null,
  reportWritten: false,
  summary: (canary.live ? '' : `HARNESS NOT LIVE — the seeded canary defect was not detected and ` +
    `confirmed (${canary.note}); nothing below supports a clean verdict. `) +
    `Synthesis agent failed — no report file was written. ${confirmed.length} confirmed and ` +
    `${refuted.length} refuted findings are returned in this object (confirmed/refuted). ` +
    `Relay them and, if wanted, write them to ${root}/Docs/audit-${date}.md manually.`,
  verdict: canary.live ? (confirmed.length ? 'findings' : 'clean') : 'harness-not-live',
  harnessLive: canary.live,
  canary,
  confirmedCount: confirmed.length,
  refutedCount: refuted.length,
  confirmed,
  refuted,
  fallbackMarkdown: `# Audit findings (synthesis failed) — ${date}\n\n## Confirmed\n${fallbackLines.join('\n')}`,
  dimensions: dims.map(d => d.key),
}
