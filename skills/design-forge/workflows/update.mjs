export const meta = {
  name: 'design-forge-update',
  description: 'Design-source catalog sweep: 3-lane search, dedupe vs source log, independent license verification per candidate (default-reject), mechanical catalog diffs',
  phases: [
    { title: 'Sweep', detail: 'component libraries/blocks, design galleries, releases of cataloged sources — parallel lanes' },
    { title: 'Verify', detail: 'one independent license-verifier per candidate: read the actual LICENSE file, default-reject' },
    { title: 'Synthesize', detail: 'build catalog entries mechanically from verified verdicts, digest, log rows' },
  ],
}

// Some runtimes deliver the Workflow `args` value as a JSON string rather than a parsed
// object; tolerate both so required fields are never silently undefined.
const opts = typeof args === 'string' ? JSON.parse(args) : (args || {})
const sinceDate = opts.sinceDate
const today = opts.today
const catalog = opts.catalog
const bootstrap = !!opts.bootstrap
const priority = Array.isArray(opts.priority) ? opts.priority : []
const seen = new Set((opts.seenKeys || []).map(k => String(k).toLowerCase().trim()))
if (!sinceDate || !today || typeof catalog !== 'string') {
  throw new Error('args.sinceDate, args.today, and args.catalog (string) are required')
}
const CAP = bootstrap ? 12 : 8

const CATEGORIES = ['component-library', 'animation-effects', 'gallery', 'icon-font-color']
const SECTION_FOR = {
  'component-library': '## Component libraries',
  'animation-effects': '## Animation & effects blocks',
  gallery: '## Design galleries (vocabulary only — never installable)',
  'icon-font-color': '## Icons, fonts & color resources',
}
const FRAMEWORKS = ['react', 'vue', 'svelte', 'web-components', 'css-only']

const CANDIDATES_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          title: { type: 'string' },
          url: { type: 'string' },
          category: { type: 'string', enum: CATEGORIES },
          frameworks: { type: 'array', items: { type: 'string', enum: FRAMEWORKS } },
          claimedLicense: { type: 'string' },
          claimedInstall: { type: 'string' },
          relevance: { type: 'string' },
          relevanceScore: { type: 'integer', minimum: 1, maximum: 10 },
        },
        required: ['key', 'title', 'url', 'category', 'claimedLicense', 'relevance', 'relevanceScore'],
      },
    },
  },
  required: ['candidates'],
}

// The license-verifier's verdict. licenseVerified may only be true when the verifier
// actually retrieved and read the project's LICENSE file; licenseEvidence is that
// file's URL. Marketing pages, README badges, and npm "license" fields are claims,
// not evidence.
const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    accept: { type: 'boolean' },
    category: { type: 'string', enum: CATEGORIES },
    licenseVerified: { type: 'boolean' },
    spdx: { type: 'string' },
    licenseEvidence: { type: 'string' },
    installVerified: { type: 'boolean' },
    installLine: { type: 'string' },
    frameworks: { type: 'array', items: { type: 'string', enum: FRAMEWORKS } },
    goodFor: { type: 'string' },
    health: { type: 'string' },
    reasoning: { type: 'string' },
  },
  required: ['accept', 'licenseVerified', 'reasoning'],
}

const TOOL_HINT =
  'You have WebSearch and WebFetch available — load them via ToolSearch ' +
  '(query "select:WebSearch,WebFetch") before searching. Never fabricate a source or a ' +
  'license: every claim must come from a page or file you actually retrieved. '

phase('Sweep')

// Lane 3 targets already-cataloged sources: extract their canonical URLs from the
// catalog text mechanically so the lane cannot invent its own target list.
const catalogedUrls = [...catalog.matchAll(/^\s*-\s*\*\*URL:\*\*\s*(\S+)/gm)].map(m => m[1])

const LANES = [
  {
    key: 'libraries',
    prompt:
      `Search the current free/open-source front-end ecosystem for component libraries and ` +
      `copy-paste block collections active between ${sinceDate} and ${today}: React, Vue, ` +
      `Svelte, web-components, and CSS-only libraries; animation/effects collections; and ` +
      `icon/font/color resources. ` +
      (priority.length
        ? `Evaluate these named priorities FIRST and include each as a candidate: ${priority.join(', ')}. Then add `
        : `Include `) +
      `notable sources a design-savvy front-end developer would reach for today. For each: ` +
      `canonical URL as key, what license the project CLAIMS (from its site/README — this will ` +
      `be independently verified later, so report the claim faithfully, including "free tier" ` +
      `wording that smells commercial), and the documented install path.`,
  },
  {
    key: 'galleries',
    prompt:
      `Search for design galleries, awards sites, and curated showcase collections useful as ` +
      `aesthetic-direction vocabulary for front-end design (the class of awwwards / godly / ` +
      `land-book and peers), live and active between ${sinceDate} and ${today}. These are ` +
      `category "gallery": inspiration vocabulary ONLY, never installable, never copied. Use ` +
      `the canonical URL as key; claimedLicense should describe their published terms of use.`,
  },
  {
    key: 'news',
    prompt:
      `Check releases, changelogs, and major announcements between ${sinceDate} and ${today} ` +
      `for these already-cataloged design sources:\n${catalogedUrls.join('\n') || '(none cataloged yet)'}\n` +
      `Surface only material changes: license changes, project abandonment/archival, major ` +
      `versions, install-path changes. Return each affected source as a candidate (its ` +
      `canonical URL as key) so it gets re-verified; return zero candidates if nothing material.`,
  },
]

const runnableLanes = LANES.filter(l => l.key !== 'news' || catalogedUrls.length > 0)
const laneResults = await parallel(runnableLanes.map(l => () =>
  agent(
    TOOL_HINT +
    `You are one search lane in a research sweep for a license-verified catalog of free ` +
    `front-end design sources. ` + l.prompt +
    ` Return up to 15 candidates via structured output; relevanceScore 1-10 reflects how ` +
    `useful the source is for styling real production front ends today.`,
    { label: `sweep:${l.key}`, phase: 'Sweep', schema: CANDIDATES_SCHEMA, model: 'sonnet' }
  )
))
const lanes = LANES.map(l => {
  const i = runnableLanes.indexOf(l)
  return { lane: l.key, ok: i === -1 ? 'skipped-empty-target-set' : !!laneResults[i] }
})
for (const s of lanes.filter(x => x.ok === false)) log(`LANE FAILED: ${s.lane} — digest must disclose this`)

const raw = laneResults.filter(Boolean).flatMap(r => r.candidates)
const fresh = []
const inRun = new Set()
for (const c of raw) {
  const k = String(c.key).toLowerCase().trim()
  const u = String(c.url).toLowerCase().trim()
  const isRecheck = catalogedUrls.some(cu => cu.toLowerCase().trim() === u)
  // Already-cataloged sources resurfaced by the news lane are re-verified, not deduped away.
  if (!isRecheck && (seen.has(k) || seen.has(u))) { log(`Already in source log, skipping: ${c.title}`); continue }
  if (inRun.has(k) || inRun.has(u)) continue
  inRun.add(k)
  inRun.add(u)
  fresh.push(c)
}
const prio = s => priority.some(p => String(s.title).toLowerCase().includes(p.toLowerCase())) ? 1 : 0
fresh.sort((a, b) => (prio(b) - prio(a)) || (b.relevanceScore - a.relevanceScore))
const picked = fresh.slice(0, CAP)
for (const d of fresh.slice(CAP)) log(`Over cap (${CAP}), not evaluated this sweep: ${d.title} (${d.key})`)
log(`Sweep: ${raw.length} raw candidates, ${fresh.length} fresh after dedupe, evaluating ${picked.length}`)

phase('Verify')
// One independent license-verifier per candidate — never the lane that found it, and
// never the orchestrator vouching for its own research. Default-reject on doubt.
const verdicts = await parallel(picked.map(c => () =>
  agent(
    TOOL_HINT +
    `You are the independent license-verifier for a catalog of free front-end design ` +
    `sources. You did NOT find this candidate; your job is to try to REJECT it. Candidate:\n` +
    `${JSON.stringify(c, null, 2)}\n` +
    `Verify from PRIMARY sources only:\n` +
    `1. LICENSE: locate and actually fetch the project's LICENSE file (e.g. the raw file in ` +
    `its source repository). licenseVerified=true ONLY if you read the license text yourself; ` +
    `licenseEvidence must be the exact URL you fetched it from. The marketing page, README ` +
    `badge, and npm "license" field are claims, not evidence. If the license is not a ` +
    `genuinely free/open license (OSI-approved, or an equally permissive public license) — ` +
    `including "free tier" of a commercial product, non-commercial-only, or ` +
    `no-LICENSE-file-found — REJECT with the license language quoted in reasoning.\n` +
    `2. INSTALL: confirm the documented install path exists (real npm package / CLI docs / ` +
    `copy-paste docs). Summarize as installLine: "cli — ..." | "npm — ..." | "copy-paste — ...".\n` +
    `3. HEALTH: confirm commit/release activity; report the last release/commit date you saw. ` +
    `A project with no activity for ~18 months is REJECTED unless it is deliberately finished ` +
    `and framework-independent (say so in reasoning).\n` +
    `Exception — category "gallery": galleries are inspiration vocabulary only and are never ` +
    `installed or copied, so no LICENSE file is expected: set licenseVerified=false, verify ` +
    `instead that the site is live, browsable, and curated; licenseEvidence may be its terms ` +
    `page. accept=true for a gallery means "useful, live vocabulary source" only.\n` +
    `Also confirm/correct category and frameworks, and write goodFor (one line, what it's ` +
    `good for). DEFAULT-REJECT: any doubt, any unverifiable claim, any paywall ambiguity → ` +
    `accept=false with the evidence in reasoning.`,
    { label: `verify:${c.key}`.slice(0, 60), phase: 'Verify', schema: VERDICT_SCHEMA, model: 'sonnet' }
  ).then(v => ({ candidate: c, verdict: v }))
))

phase('Synthesize')
// Entries are built mechanically from verified verdicts — the entry format is rigid, so
// no synthesis agent gets a chance to smooth over a missing licenseEvidence URL.
const accepted = []
const logEntries = []
for (const { candidate: c, verdict: v } of verdicts.filter(Boolean)) {
  const base = { key: c.key, title: c.title, url: c.url }
  if (!v) { logEntries.push({ ...base, disposition: 'rejected', reason: 'license-verifier agent failed' }); continue }
  const category = v.category || c.category
  const installable = category !== 'gallery'
  if (!v.accept) {
    logEntries.push({ ...base, disposition: 'rejected', reason: String(v.reasoning).slice(0, 300) })
    continue
  }
  if (installable && (!v.licenseVerified || !v.spdx || !v.licenseEvidence)) {
    // An accept without read-the-file license evidence is a verifier omission → reject.
    logEntries.push({ ...base, disposition: 'rejected', reason: `accepted without license evidence (licenseVerified=${v.licenseVerified}, spdx=${v.spdx || '—'}, evidence=${v.licenseEvidence || '—'}) — default-reject` })
    continue
  }
  const frameworks = (v.frameworks && v.frameworks.length ? v.frameworks : c.frameworks) || []
  const entryMarkdown = [
    `### ${c.title}`,
    `- **URL:** ${c.url}`,
    `- **Frameworks:** ${frameworks.join(' | ') || 'css-only'}`,
    installable
      ? `- **License:** ${v.spdx} (verified ${today} from ${v.licenseEvidence})`
      : `- **License:** n/a — inspiration vocabulary only, never installable${v.licenseEvidence ? ` (terms: ${v.licenseEvidence})` : ''}`,
    installable
      ? `- **Install:** ${v.installLine || c.claimedInstall || 'see docs'}`
      : `- **Install:** n/a — never installable (vocabulary only)`,
    `- **Good for:** ${v.goodFor || c.relevance}`,
    `- **Health:** ${v.health || 'active at verification time'}`,
    `- **last-verified:** ${today}`,
  ].join('\n')
  accepted.push({ candidate: c, verdict: v, category, entryMarkdown })
  logEntries.push({ ...base, disposition: 'adopted', reason: installable ? `${v.spdx} verified from LICENSE file; ${v.installVerified ? 'install path confirmed' : 'install per docs'}` : 'gallery — vocabulary only, live and curated' })
}

const edits = accepted.map(a => ({
  section: SECTION_FOR[a.category],
  action: catalogedUrls.some(u => u.toLowerCase().trim() === a.candidate.url.toLowerCase().trim()) ? 'replace' : 'add',
  replacesUrl: a.candidate.url,
  entryMarkdown: a.entryMarkdown,
}))

const laneNote = `Lanes run: ${lanes.map(s => `${s.lane}=${s.ok === true ? 'ok' : s.ok === false ? 'FAILED' : s.ok}`).join(', ')}.`
const rejectedCount = logEntries.filter(e => e.disposition === 'rejected').length
const byCat = {}
for (const a of accepted) byCat[a.category] = (byCat[a.category] || 0) + 1
const digest =
  `## Sweep ${today} (${bootstrap ? 'bootstrap; ' : ''}window ${sinceDate} → ${today})\n\n` +
  `Evaluated ${picked.length} candidate(s): ${accepted.length} adopted (` +
  (Object.entries(byCat).map(([k, n]) => `${k}: ${n}`).join(', ') || 'none') +
  `), ${rejectedCount} rejected by the license-verifier (see source log for evidence). ` +
  `Every adopted installable entry carries an SPDX id verified ${today} from the project's ` +
  `actual LICENSE file URL. ${laneNote}`

log(`Verify: ${accepted.length} adopted, ${rejectedCount} rejected of ${picked.length} evaluated`)

return {
  edits,
  digest,
  logEntries,
  lanes,
  evaluatedCount: picked.length,
  adoptedCount: accepted.length,
}
