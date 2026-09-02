export const meta = {
  name: 'agent-swarm',
  description: 'Universal parameterized swarm: optional scout, fan-out lanes over items on pinned tiers, dedupe, severity-scaled skeptic verification, one synthesis agent writing a file. Enforces the spec\'s agent ceiling.',
  phases: [
    { title: 'Scout', detail: 'optional: one agent derives the work-list for lanes whose items are "scout"' },
    { title: 'Fan-out', detail: 'one agent per lane × item, pinned tier, structured output' },
    { title: 'Verify', detail: 'severity-scaled skeptic panel per deduped finding' },
    { title: 'Synthesize', detail: 'one agent writes the output file and returns its path' },
  ],
}

// args: { spec, root, date }
//   spec — the swarm spec that ALREADY passed scripts/swarm-plan.mjs (this script re-checks
//          only what it cannot run without: models, ceiling, lanes, synth). Items must be
//          arrays here (or "scout"); counts are for planning only.
//   root — absolute path of the tree the agents work in.
//   date — YYYY-MM-DD from `date +%F` (scripts cannot call Date).
const opts = typeof args === 'string' ? JSON.parse(args) : (args || {})
const spec = typeof opts.spec === 'string' ? JSON.parse(opts.spec) : opts.spec
const root = opts.root
const date = opts.date || ''
if (!spec || !Array.isArray(spec.lanes) || !spec.lanes.length) throw new Error('args.spec with a non-empty lanes array is required — run scripts/swarm-plan.mjs on the spec first')
if (!root) throw new Error('args.root (absolute path of the working tree) is required')
if (!spec.synth || !spec.synth.outputPath) throw new Error('spec.synth.outputPath is required — every swarm ends in one synthesis agent writing a file')

const TIERS = ['opus', 'sonnet', 'haiku']
const ceiling = spec.ceiling && Number.isInteger(spec.ceiling.agents) && spec.ceiling.agents > 0 ? spec.ceiling.agents : null
if (ceiling === null) throw new Error('spec.ceiling.agents is required — declare the maximum agent count before dispatching')

const tierOf = (model, where) => {
  if (!TIERS.includes(model)) throw new Error(`${where}: model "${model}" is not one of ${TIERS.join('/')} — every dispatch names a standard tier, never the orchestrator tier`)
  return model
}
if (spec.scout) tierOf(spec.scout.model, 'scout')
spec.lanes.forEach((l, i) => tierOf(l.model, `lanes[${i}]`))
if (spec.verify) tierOf(spec.verify.model, 'verify')
tierOf(spec.synth.model, 'synth')

// ---- ceiling-enforced dispatch ---------------------------------------------------------------
// Every agent() goes through here. Once the ceiling is reached, further dispatches are DROPPED
// and logged (never silently), so the run's return can say what it did not cover.
const spent = { total: 0, opus: 0, sonnet: 0, haiku: 0 }
const dropped = []
let ceilingAnnounced = false
const dispatch = (prompt, o) => {
  if (spent.total >= ceiling) {
    if (!ceilingAnnounced) { ceilingAnnounced = true; log(`Ceiling reached (${ceiling} agents) — further dispatches dropped, see result.dropped`) }
    dropped.push(o.label || 'unlabelled')
    return Promise.resolve(null)
  }
  spent.total++
  spent[o.model]++
  return agent(prompt, o)
}

const fill = (template, vars) => String(template).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
const base = { root, date, goal: spec.goal || '', name: spec.name || 'swarm' }

// ---- schemas ----------------------------------------------------------------------------------
const SCOUT_SCHEMA = {
  type: 'object',
  properties: {
    items: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['items', 'summary'],
}
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'string', description: 'file:line or the item this finding is about' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
          title: { type: 'string' },
          evidence: { type: 'string', description: 'the quoted excerpt or tool output that supports the finding' },
          detail: { type: 'string' },
        },
        required: ['ref', 'severity', 'title', 'evidence'],
      },
    },
  },
  required: ['findings'],
}
const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    item: { type: 'string' },
    status: { type: 'string', enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED', 'NEEDS_CONTEXT'] },
    summary: { type: 'string' },
    artifacts: { type: 'array', items: { type: 'string' } },
    evidence: { type: 'array', items: { type: 'string' }, description: 'commands run and their observed result lines' },
    concerns: { type: 'string' },
  },
  required: ['item', 'status', 'summary', 'evidence'],
}
const VERDICT_SCHEMA = {
  type: 'object',
  properties: { refuted: { type: 'boolean' }, reasoning: { type: 'string' } },
  required: ['refuted', 'reasoning'],
}
const SYNTH_SCHEMA = {
  type: 'object',
  properties: { outputPath: { type: 'string' }, summary: { type: 'string' } },
  required: ['outputPath', 'summary'],
}

const STANDING =
  ' You are operating autonomously: nobody is watching and no one can answer questions mid-task. ' +
  'Every claim in your return traces to a tool result from this session; never write a success line before the command has run. ' +
  'Return only the structure asked for — raw logs and stack traces stay with you; name a path instead.'

// ---- Scout -----------------------------------------------------------------------------------
let scouted = null
if (spec.scout) {
  phase('Scout')
  scouted = await dispatch(
    fill(spec.scout.prompt, base) +
      ` Working tree: ${root}. Return the work-list as items (one string each — file paths, module names, or whatever the lanes expect) plus a summary. Read-only.` +
      STANDING,
    { label: 'scout', phase: 'Scout', schema: SCOUT_SCHEMA, model: spec.scout.model, effort: spec.scout.effort || 'low', agentType: spec.scout.agentType }
  )
  if (!scouted) throw new Error('Scout agent failed — no work-list to fan out over')
  log(`Scout: ${scouted.items.length} items — ${scouted.summary}`)
}

const itemsFor = (lane) => {
  if (Array.isArray(lane.items)) return lane.items
  if (lane.items === 'scout') {
    if (!scouted) throw new Error(`lane ${lane.key || ''} takes items from the scout but the spec has no scout`)
    const max = Number.isInteger(lane.maxItems) ? lane.maxItems : Infinity
    if (scouted.items.length > max) log(`lane ${lane.key}: scout returned ${scouted.items.length} items, capped to ${max} (dropping ${scouted.items.length - max})`)
    return scouted.items.slice(0, max)
  }
  throw new Error(`lane ${lane.key || ''}: items must be an array or "scout" at run time`)
}

// ---- Fan-out (+ per-round verify) --------------------------------------------------------------
const maxRounds = spec.loop && Number.isInteger(spec.loop.maxRounds) ? Math.min(spec.loop.maxRounds, 5) : 1
const verify = spec.verify || null
const DEFAULT_LENSES = [
  { key: 'reproduce', instruction: 'Open the cited ref and check the quoted evidence is really there and means what the finding says.' },
  { key: 'missing-context', instruction: 'Hunt for context the finder missed — a guard, a caller, a config, documented intent — that changes the conclusion.' },
  { key: 'impact', instruction: 'Take the code as cited: is the claimed severity realistic, or is the effect smaller, unreachable, or already handled?' },
]
const lenses = (verify && Array.isArray(verify.lensInstructions) && verify.lensInstructions.length)
  ? verify.lensInstructions.map((instruction, i) => ({ key: `lens${i + 1}`, instruction }))
  : DEFAULT_LENSES
// Pattern-aware panels: the expensive escalated panel runs ONCE per distinct finding title
// (the pattern); every repeat of that title gets the base panel. Eight identical "raw customer
// object in res.json" leaks are one judgment and eight reproductions, not eight judgments.
// Set verify.panelPerFinding: true to escalate every finding individually instead.
const patternSeen = new Set()
const patternKey = (f) => `${f.lane || ''}|${String(f.title || '').trim().toLowerCase()}`
const lensesFor = (f) => {
  if (!verify) return []
  const baseN = Number.isInteger(verify.lenses) && verify.lenses > 0 ? verify.lenses : 1
  const esc = verify.escalate
  let n = baseN
  if (esc && Array.isArray(esc.severities) && esc.severities.includes(f.severity) && Number.isInteger(esc.lenses)) {
    const firstOfPattern = verify.panelPerFinding === true || !patternSeen.has(patternKey(f))
    n = firstOfPattern ? esc.lenses : baseN
  }
  patternSeen.add(patternKey(f))
  return lenses.slice(0, Math.min(n, lenses.length))
}

const judge = (f) => {
  const panel = lensesFor(f)
  return parallel(panel.map((lens) => () =>
    dispatch(
      `A finder in a swarm (${base.goal}) reported this finding in ${root}:\n${JSON.stringify(f, null, 2)}\n` +
        `Your lens: ${lens.key}. ${lens.instruction} Try to REFUTE it against the actual tree. ` +
        `If you cannot confirm it stands under your lens, return refuted=true (default to refuted when uncertain). Read-only.` + STANDING,
      { label: `verify:${lens.key}:${(f.ref || '').slice(-40)}`, phase: 'Verify', schema: VERDICT_SCHEMA, model: verify.model, effort: verify.effort || 'low', agentType: verify.agentType }
    )
  )).then((votes) => {
    const cast = votes.filter(Boolean)
    const kills = cast.filter((v) => v.refuted).length
    const quorum = panel.length >= 3 ? 2 : 1
    const hasQuorum = cast.length >= quorum
    const survives = hasQuorum && (panel.length >= 3 ? kills < 2 : kills === 0)
    return { ...f, panelSize: panel.length, panelVotes: cast.length, panelRefutes: kills, survives,
      panelReasons: hasQuorum ? cast.map((v) => `${v.refuted ? 'REFUTED' : 'STANDS'}: ${v.reasoning}`) : ['REFUTED (no quorum)'] }
  })
}

const keyOf = (f) => `${f.ref}|${f.title}`
const seen = new Set()
const confirmed = []
const refuted = []
const results = []
let round = 0

do {
  round++
  const roundLabel = maxRounds > 1 ? `:r${round}` : ''
  const priorKeys = [...seen]

  const laneRuns = spec.lanes.map((lane) => () => {
    const items = itemsFor(lane)
    const schema = lane.schema === 'findings' ? FINDINGS_SCHEMA : RESULT_SCHEMA
    const one = (item) => dispatch(
      fill(lane.prompt, { ...base, item, seen: priorKeys.join(', ') }) +
        ` Working tree: ${root}.` +
        (lane.schema === 'findings'
          ? ' Report only what you read; every finding cites a ref and quotes its evidence. Read-only.'
          : ' Return status, a two-sentence summary, artifact paths, and the commands you ran with their observed results.') +
        (round > 1 ? ` Already reported (do not repeat): ${priorKeys.join('; ') || 'nothing yet'}.` : '') +
        STANDING,
      { label: `${lane.key || 'lane'}${roundLabel}:${String(item).slice(-40)}`, phase: 'Fan-out', schema, model: lane.model, effort: lane.effort || 'low', isolation: lane.isolation, agentType: lane.agentType }
    ).then((r) => (r ? { lane: lane.key, item, r } : null))
    if (lane.serial) {
      return (async () => { const out = []; for (const item of items) out.push(await one(item)); return out })()
    }
    return parallel(items.map((item) => () => one(item)))
  })

  const roundOut = (await parallel(laneRuns)).filter(Boolean).flat().filter(Boolean)
  const found = roundOut.filter((x) => x.r && Array.isArray(x.r.findings)).flatMap((x) => x.r.findings.map((f) => ({ ...f, lane: x.lane, item: x.item })))
  results.push(...roundOut.filter((x) => x.r && !Array.isArray(x.r.findings)).map((x) => ({ lane: x.lane, ...x.r })))

  const fresh = found.filter((f) => !seen.has(keyOf(f)))
  fresh.forEach((f) => seen.add(keyOf(f)))
  log(`Round ${round}/${maxRounds}: ${roundOut.length} agents returned, ${found.length} findings (${fresh.length} new), ${results.length} results so far`)
  if (!fresh.length && !roundOut.some((x) => x.r && !Array.isArray(x.r.findings))) { log('Dry round — stopping'); break }

  if (verify && fresh.length) {
    const judged = (await parallel(fresh.map((f) => () => judge(f)))).filter(Boolean)
    for (const j of judged) (j.survives ? confirmed : refuted).push(j)
    log(`Round ${round}: ${judged.filter((j) => j.survives).length} confirmed, ${judged.filter((j) => !j.survives).length} refuted`)
  } else if (fresh.length) {
    confirmed.push(...fresh.map((f) => ({ ...f, unverified: true })))
  }
  if (!fresh.length) break
} while (round < maxRounds)

// ---- Synthesize --------------------------------------------------------------------------------
phase('Synthesize')
const SEV = ['critical', 'high', 'medium', 'low', 'info']
confirmed.sort((a, b) => SEV.indexOf(a.severity) - SEV.indexOf(b.severity))
const outputPath = fill(spec.synth.outputPath, base)
const blocked = results.filter((r) => r.status === 'BLOCKED' || r.status === 'NEEDS_CONTEXT')

const synth = await dispatch(
  `Write the final report for the swarm "${base.name}" (goal: ${base.goal}) over ${root} to ${outputPath} ` +
    `(create parent directories if missing). ` +
    (spec.synth.prompt ? fill(spec.synth.prompt, base) + ' ' : '') +
    `Sections, in order: (1) Summary — what was asked, what was covered, what was not (the dropped list below is coverage the run did NOT do). ` +
    `(2) Confirmed findings by severity, each with ref, evidence, and the panel's reasoning — omit this section if there are none. ` +
    `(3) Results per item (status, summary, artifacts, evidence) — omit if there are none. ` +
    `(4) Refuted findings appendix with the panel's reasons. (5) Blocked / needs-context items. ` +
    `(6) Run accounting: agents spent by tier, ceiling, rounds, dropped dispatches. ` +
    `Never describe coverage the run did not do as done. Data as JSON follows.\n\n` +
    `CONFIRMED:\n${JSON.stringify(confirmed, null, 2)}\n\nREFUTED:\n${JSON.stringify(refuted, null, 2)}\n\n` +
    `RESULTS:\n${JSON.stringify(results, null, 2)}\n\nBLOCKED:\n${JSON.stringify(blocked, null, 2)}\n\n` +
    `ACCOUNTING:\n${JSON.stringify({ spent, ceiling, rounds: round, dropped }, null, 2)}\n\n` +
    `After writing, read the file back to confirm it exists with every section, then return its path and a summary sized for a reader who sees only the summary. ` +
    `Never return a path you have not confirmed on disk.` + STANDING,
  { label: 'synthesize', phase: 'Synthesize', schema: SYNTH_SCHEMA, model: spec.synth.model, effort: spec.synth.effort || 'medium' }
)

const accounting = { agentsSpent: spent.total, byTier: { opus: spent.opus, sonnet: spent.sonnet, haiku: spent.haiku }, ceiling, rounds: round, dropped }
if (synth) {
  return {
    outputPath: synth.outputPath,
    summary: (dropped.length ? `PARTIAL COVERAGE — ${dropped.length} dispatch(es) dropped at the ceiling. ` : '') + synth.summary,
    confirmedCount: confirmed.length,
    refutedCount: refuted.length,
    resultCount: results.length,
    blockedCount: blocked.length,
    ...accounting,
  }
}

return {
  outputPath: null,
  outputWritten: false,
  summary: `Synthesis agent failed — no report written. ${confirmed.length} confirmed, ${refuted.length} refuted, ${results.length} results are returned in this object.` +
    (dropped.length ? ` PARTIAL COVERAGE — ${dropped.length} dispatch(es) dropped at the ceiling.` : ''),
  confirmed,
  refuted,
  results,
  blocked,
  ...accounting,
}
