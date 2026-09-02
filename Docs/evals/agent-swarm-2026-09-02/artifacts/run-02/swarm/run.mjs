export const meta = {
  name: 'pii-redaction-audit',
  description: 'Find every API response path that leaks customer PII (email, phone, SSN, DOB) without going through redact()',
  phases: [
    { title: 'Recon', detail: 'map every response-emission site, PII field name, and redact() export across src/', model: 'haiku' },
    { title: 'Analyze', detail: 'one agent per src/ subdirectory (routes, services, jobs, lib+models) classifies each response site', model: 'sonnet' },
    { title: 'Verify', detail: 'adversarial skeptic re-check per finding, lens count scaled by field sensitivity (SSN/DOB=3, email/phone=1), hard-capped', model: 'sonnet' },
    { title: 'Report', detail: 'compile verified findings into the compliance report', model: 'haiku' },
  ],
}

// --- config -----------------------------------------------------------
const REPO_ROOT = (args && args.repoRoot) || '.'
const REPORT_DATE = (args && args.reportDate) || '2026-09-02'
const REPORT_PATH = `${REPO_ROOT}/Docs/compliance/pii-redaction-audit-${REPORT_DATE}.md`
const VERIFY_CAP = 30 // hard ceiling on skeptic dispatches, independent of how many findings surface

// --- schemas ------------------------------------------------------------
const RECON_SCHEMA = {
  type: 'object',
  properties: {
    responseSites: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          snippet: { type: 'string' },
        },
        required: ['file', 'line', 'snippet'],
      },
    },
    piiFieldNames: { type: 'array', items: { type: 'string' } },
    redactExportSites: {
      type: 'array',
      items: {
        type: 'object',
        properties: { file: { type: 'string' }, exportName: { type: 'string' } },
        required: ['file', 'exportName'],
      },
    },
    filesOpened: { type: 'number' },
  },
  required: ['responseSites', 'piiFieldNames', 'redactExportSites', 'filesOpened'],
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          handlerOrFunction: { type: 'string' },
          fieldsExposed: { type: 'array', items: { type: 'string' } },
          redactApplied: { type: 'boolean' },
          snippet: { type: 'string' },
        },
        required: ['file', 'line', 'handlerOrFunction', 'fieldsExposed', 'redactApplied', 'snippet'],
      },
    },
    filesReviewed: { type: 'number' },
  },
  required: ['findings', 'filesReviewed'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['refuted', 'reason'],
}

// --- Phase 1: Recon -------------------------------------------------------
// One cheap, mechanical enumeration pass BEFORE any partitioning decision.
// The point is to let the actual shape of the codebase decide how much
// analysis work exists, instead of assuming "60 files" means "60 agents".
phase('Recon')
log('Mapping every response-emission call site, PII field name, and redact() export under src/ before deciding how to partition analysis work.')

const recon = await agent(
  `Repository root: ${REPO_ROOT}. Recursively open and read every file under ${REPO_ROOT}/src/ ` +
  `(routes, services, jobs, lib, models — every subdirectory, every file, no sampling). ` +
  `List every call site that emits an HTTP response (res.json, res.send, res.write, res.end, or any equivalent) ` +
  `with file path, line number, and a short snippet. ` +
  `Separately list every field name that represents customer PII — start from whatever a redact()-style helper treats ` +
  `as PII (e.g. email, phone, ssn, dob) and add any other clearly-personal fields you see defined on customer/user models. ` +
  `Separately list every file/export where a redact()-style function is defined. ` +
  `Do not judge compliance yet — enumerate only. Report filesOpened as the exact count of files you opened.`,
  { schema: RECON_SCHEMA, model: 'haiku', label: 'recon: map response sites + PII fields + redact() exports' }
)

log(`Recon opened ${recon.filesOpened} files, found ${recon.responseSites.length} response-emission sites, ` +
    `${recon.piiFieldNames.length} PII field names, and ${recon.redactExportSites.length} redact() export site(s).`)

// --- Phase 2: Analyze -----------------------------------------------------
// Partitioned by directory, NOT by file. Directory structure is a fixed,
// codebase-determined split (4 top-level dirs under src/) — it does not grow
// if the repo grows a 61st file, and it does not shrink because the user
// said "go wide". Each partition agent independently re-verifies the recon
// manifest against the real files in its slice rather than trusting it blindly.
phase('Analyze')

const PARTITIONS = [
  { name: 'routes', path: `${REPO_ROOT}/src/routes` },
  { name: 'services', path: `${REPO_ROOT}/src/services` },
  { name: 'jobs', path: `${REPO_ROOT}/src/jobs` },
  { name: 'lib+models', path: `${REPO_ROOT}/src/lib and ${REPO_ROOT}/src/models` },
]

const manifestJSON = JSON.stringify(recon)

const analysisResults = await parallel(PARTITIONS.map(p => () =>
  agent(
    `You are auditing the "${p.name}" partition (${p.path}) of a Node CRM service for customer PII leaking into ` +
    `API responses without going through redact(). Recon manifest for the whole repo (JSON, verify it — do not trust it blindly): ${manifestJSON}\n\n` +
    `Open and read every file in your partition yourself. For every response-emission site in your partition ` +
    `(including any recon missed), determine which response fields are PII (email, phone, ssn, dob, or anything else ` +
    `clearly personal) and whether that exact response object passed through a redact()-style function on that code ` +
    `path before being sent — check the full function body and its imports, not just the one line that calls res.json. ` +
    `Only report a finding when PII reaches the response WITHOUT redaction. Include file, line, handler/function name, ` +
    `exact fields exposed, redactApplied=false, and a snippet. Report filesReviewed as the count of files you opened.`,
    { schema: ANALYSIS_SCHEMA, model: 'sonnet', phase: 'Analyze', label: `analyze: ${p.name}` }
  )
))

const findings = analysisResults.filter(Boolean).flatMap(r => r.findings)
const totalFilesReviewed = analysisResults.filter(Boolean).reduce((n, r) => n + r.filesReviewed, 0)
log(`Analysis reviewed ${totalFilesReviewed} files across ${PARTITIONS.length} partitions and flagged ${findings.length} candidate leak(s).`)

// --- Phase 3: Verify --------------------------------------------------
// This is a compliance deliverable, so every finding gets an independent
// adversarial re-check (finding-skeptic agentType, defaults to refuted when
// uncertain) rather than being taken on the analysis agent's word.
// Lens count scales with severity (SSN/DOB = 3-lens majority vote, email/phone
// = 1 lens) so verification cost tracks risk, not headcount. VERIFY_CAP is a
// hard ceiling independent of how many findings surface, so a noisier-than-
// expected analysis phase cannot silently balloon the run — anything past the
// cap is logged and reported as unverified, never silently dropped or
// silently used as an excuse to spawn more agents.
phase('Verify')

const verified = []
let verifyBudgetUsed = 0

if (findings.length === 0) {
  log('No candidate leaks flagged — skipping verification, report will state a clean sweep with methodology attached.')
}

for (const f of findings) {
  const sensitive = f.fieldsExposed.some(x => /ssn|dob/i.test(x))
  const lensCount = sensitive ? 3 : 1

  if (verifyBudgetUsed + lensCount > VERIFY_CAP) {
    log(`VERIFY_CAP (${VERIFY_CAP}) reached — ${findings.length - verified.length} remaining candidate finding(s) ` +
        `pass through UNVERIFIED and are labeled as such in the report, not silently dropped and not used to justify raising the cap.`)
    verified.push({ ...f, verification: 'unverified-cap-reached', refutedCount: null, lensCount: 0 })
    continue
  }

  const votes = await parallel(Array.from({ length: lensCount }, (_, i) => () =>
    agent(
      `Try to REFUTE this PII-leak finding by reading the actual file yourself. Default to refuted=true if you cannot ` +
      `confirm it. Finding: file=${f.file} line=${f.line} function=${f.handlerOrFunction} ` +
      `fieldsExposed=${JSON.stringify(f.fieldsExposed)} snippet="${f.snippet}"\n` +
      `Open ${f.file}. Confirm: (a) the exact response object sent at that call site really contains those PII fields, ` +
      `and (b) that object is truly NOT passed through any redact()-style function anywhere on that code path (check ` +
      `imports and the whole function body, not just the flagged line). If both hold, refuted=false. Otherwise refuted=true, and say why.`,
      { schema: VERDICT_SCHEMA, model: 'sonnet', phase: 'Verify', label: `verify: ${f.file}:${f.line} lens ${i + 1}/${lensCount}`, agentType: 'finding-skeptic' }
    )
  ))

  verifyBudgetUsed += lensCount
  const refutedCount = votes.filter(Boolean).filter(v => v.refuted).length
  const majorityRefutes = refutedCount > lensCount / 2
  verified.push({ ...f, verification: majorityRefutes ? 'refuted' : 'confirmed', refutedCount, lensCount })
}

const confirmed = verified.filter(v => v.verification === 'confirmed' || v.verification === 'unverified-cap-reached')
const refuted = verified.filter(v => v.verification === 'refuted')
log(`Verification complete: ${confirmed.length} of ${findings.length} candidate finding(s) confirmed ` +
    `(or unverified under the cap); ${refuted.length} refuted as false positives and moved to the report appendix.`)

// --- Phase 4: Report ------------------------------------------------------
// One writer agent, not a barrier-heavy synthesis fan-out — by this point the
// data is small (a handful of verified rows) and the job is formatting, which
// is a reading/summarizing task, not an engineering one.
phase('Report')

const report = await agent(
  `Write a compliance-facing report to ${REPORT_PATH} (create the Docs/compliance/ directory under ${REPO_ROOT} if it ` +
  `does not exist). Audience: the compliance lead — plain-language framing, but with exact file:line references engineers can act on immediately.\n\n` +
  `Sections:\n` +
  `1. Executive summary (one paragraph): how many endpoints leak PII without redact(), which PII types, plain-language business risk.\n` +
  `2. Scope & methodology: exactly what was scanned (${totalFilesReviewed} files across src/routes, src/services, src/jobs, src/lib, src/models), ` +
  `and how findings were verified (independent adversarial re-check per finding; 3-lens majority vote for SSN/DOB, single-lens for email/phone; ` +
  `defaults to refuted when uncertain).\n` +
  `3. Findings table: file, line, handler, PII fields exposed, verification status.\n` +
  `4. Remediation note per finding (wrap the response through redact() before it is sent).\n` +
  `5. If any findings passed through unverified due to the verification cap, call that out explicitly by file:line — do not omit it.\n\n` +
  `Verified findings (JSON, includes both confirmed and refuted): ${JSON.stringify(verified)}\n\n` +
  `Put confirmed/unverified findings in the main table. List refuted findings in a short "investigated and cleared" appendix ` +
  `so the compliance lead knows they were checked, not missed.`,
  { model: 'haiku', label: 'report: compile compliance report' }
)

log(`Report written to ${REPORT_PATH}.`)

return {
  findingsConfirmed: confirmed.length,
  findingsRefuted: refuted.length,
  totalFilesReviewed,
  totalDispatches: 1 /* recon */ + PARTITIONS.length /* analyze */ + verifyBudgetUsed /* verify */ + 1 /* report */,
  reportPath: REPORT_PATH,
}
