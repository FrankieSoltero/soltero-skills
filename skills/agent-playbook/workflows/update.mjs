export const meta = {
  name: 'agent-playbook-update',
  description: 'Coding-agent research sweep: 3-lane search, dedupe vs source log, deep-read, skeptic tiering, playbook diffs',
  phases: [
    { title: 'Sweep', detail: 'arXiv, lab engineering blogs, OSS agent frameworks — parallel lanes' },
    { title: 'Read', detail: 'fetch and read each fresh candidate, extract concrete tactics' },
    { title: 'Verify', detail: 'one skeptic per tactic: refute or assign tier (default demote)' },
    { title: 'Synthesize', detail: 'merge survivors into playbook diffs, digest, log entries' },
  ],
}

// Some runtimes deliver the Workflow `args` value as a JSON string rather than a parsed
// object; tolerate both so required fields are never silently undefined.
const opts = typeof args === 'string' ? JSON.parse(args) : (args || {})
const sinceDate = opts.sinceDate
const today = opts.today
const playbook = opts.playbook
const bootstrap = !!opts.bootstrap
const seen = new Set((opts.seenKeys || []).map(k => String(k).toLowerCase().trim()))
if (!sinceDate || !today || typeof playbook !== 'string') {
  throw new Error('args.sinceDate, args.today, and args.playbook (string) are required')
}
const CAP = bootstrap ? 24 : 12

const TOPICS = [
  'Context management',
  'Agentic loop design',
  'Spec & prompting',
  'Tool design',
  'Verification & self-repair',
  'Multi-agent orchestration',
  'Memory',
]

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
          source: { type: 'string' },
          published: { type: 'string' },
          claimedTactic: { type: 'string' },
          relevance: { type: 'string' },
          relevanceScore: { type: 'integer', minimum: 1, maximum: 10 },
        },
        required: ['key', 'title', 'url', 'claimedTactic', 'relevance', 'relevanceScore'],
      },
    },
  },
  required: ['candidates'],
}

const TACTICS_SCHEMA = {
  type: 'object',
  properties: {
    readable: { type: 'boolean' },
    whyUnreadable: { type: 'string' },
    sourceSummary: { type: 'string' },
    tactics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          statement: { type: 'string' },
          topic: { type: 'string', enum: TOPICS },
          evidence: { type: 'string' },
          proposedTier: { type: 'string', enum: ['Proven', 'Promising', 'Watch'] },
          toolNotes: { type: 'string' },
        },
        required: ['statement', 'topic', 'evidence', 'proposedTier'],
      },
    },
  },
  required: ['readable', 'tactics'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    survives: { type: 'boolean' },
    tier: { type: 'string', enum: ['Proven', 'Promising', 'Watch'] },
    reasoning: { type: 'string' },
  },
  required: ['survives', 'reasoning'],
}

const SYNTH_SCHEMA = {
  type: 'object',
  properties: {
    edits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string', enum: TOPICS },
          action: { type: 'string', enum: ['add', 'replace'] },
          replacesHeading: { type: 'string' },
          entryMarkdown: { type: 'string' },
        },
        required: ['topic', 'action', 'entryMarkdown'],
      },
    },
    digest: { type: 'string' },
  },
  required: ['edits', 'digest'],
}

const TOOL_HINT =
  'You have WebSearch and WebFetch available — load them via ToolSearch ' +
  '(query "select:WebSearch,WebFetch") before searching. Never fabricate a source: every ' +
  'candidate must come from a page or listing you actually retrieved. '

phase('Sweep')
const LANES = [
  {
    key: 'arxiv',
    prompt:
      `Search arXiv (cs.SE, cs.AI, cs.CL) for papers published between ${sinceDate} and ${today} ` +
      `about coding agents and agentic loops: agent scaffolds, SWE-bench approaches, context ` +
      `management, tool use/design, self-repair and verification loops, multi-agent coding ` +
      `orchestration, agent memory. Prefer papers with concrete, transferable tactics over pure ` +
      `benchmark announcements. Use arXiv IDs (e.g. "2506.01234") as keys.`,
  },
  {
    key: 'lab-blogs',
    prompt:
      `Search engineering blogs of AI labs and agent-tool companies (Anthropic, OpenAI, Google ` +
      `DeepMind, Cursor, Cognition, Factory, and peers) for posts published between ${sinceDate} ` +
      `and ${today} about coding-agent practice: harness design, prompting/spec technique, context ` +
      `management, evaluation, agentic loop tactics. Battle-tested practice beats speculation. ` +
      `Use the canonical post URL as the key.`,
  },
  {
    key: 'oss',
    prompt:
      `Search release notes, changelogs, and design docs of open-source coding agents ` +
      `(OpenHands, Aider, SWE-agent, Claude Code, and peers) for changes landed between ` +
      `${sinceDate} and ${today} that encode agent-practice lessons: loop/scaffold changes, ` +
      `context strategies, verification steps, tool-design decisions. The tactic is what the ` +
      `change teaches, not the feature itself. Use the canonical URL as the key.`,
  },
]

const laneResults = await parallel(LANES.map(l => () =>
  agent(
    TOOL_HINT +
    `You are one search lane in a research sweep for a coding-agent best-practices playbook. ` +
    l.prompt +
    ` Return up to 15 candidates via structured output; relevanceScore 1-10 reflects how ` +
    `actionable the claimed tactic is for someone driving a coding agent.`,
    { label: `sweep:${l.key}`, phase: 'Sweep', schema: CANDIDATES_SCHEMA, model: 'sonnet' }
  )
))
const lanes = LANES.map((l, i) => ({ lane: l.key, ok: !!laneResults[i] }))
for (const s of lanes.filter(x => !x.ok)) log(`LANE FAILED: ${s.lane} — digest must disclose this`)

const raw = laneResults.filter(Boolean).flatMap(r => r.candidates)
const fresh = []
const inRun = new Set()
for (const c of raw) {
  const k = String(c.key).toLowerCase().trim()
  const u = String(c.url).toLowerCase().trim()
  if (seen.has(k) || seen.has(u)) { log(`Already in source log, skipping: ${c.title}`); continue }
  if (inRun.has(k) || inRun.has(u)) continue
  inRun.add(k)
  inRun.add(u)
  fresh.push(c)
}
fresh.sort((a, b) => b.relevanceScore - a.relevanceScore)
const picked = fresh.slice(0, CAP)
for (const d of fresh.slice(CAP)) log(`Over cap (${CAP}), not evaluated this sweep: ${d.title} (${d.key})`)
log(`Sweep: ${raw.length} raw candidates, ${fresh.length} fresh after dedupe, evaluating ${picked.length}`)

const evaluated = await pipeline(
  picked,
  c => agent(
    TOOL_HINT +
    `Deep-read this source for a coding-agent best-practices playbook:\n` +
    `${c.title}\n${c.url}\nClaimed tactic: ${c.claimedTactic}\n` +
    `Fetch and actually read it. Extract every concrete, actionable tactic a practitioner ` +
    `could apply when building or driving a coding agent — a tactic is a specific practice ` +
    `("do X when Y"), not a finding ("X correlates with Y"). For each: one-sentence statement, ` +
    `which playbook topic it belongs to, the evidence the source offers, a proposed tier ` +
    `(Proven only if the source itself shows multiple independent validations or rigorous ` +
    `benchmarks; Promising for a single credible result; Watch for plausible-but-unvalidated), ` +
    `and tool-specific notes if the tactic is tool-bound. If you cannot fetch/read the source, ` +
    `return readable=false with whyUnreadable and an empty tactics list.`,
    { label: `read:${c.key}`.slice(0, 60), phase: 'Read', schema: TACTICS_SCHEMA, model: 'sonnet' }
  ),
  async (read, c) => {
    if (!read) return { read: null, verdicts: [] }
    if (!read.readable || !read.tactics.length) return { read, verdicts: [] }
    const verdicts = await parallel(read.tactics.map(t => () =>
      agent(
        TOOL_HINT +
        `You are the skeptic gate for a coding-agent best-practices playbook. A deep-read of ` +
        `"${c.title}" (${c.url}) proposes this tactic at tier ${t.proposedTier}:\n` +
        `${JSON.stringify(t, null, 2)}\n` +
        `Try to REFUTE it: is the evidence what the deep-read claims? Is the tactic actionable ` +
        `or vacuous? Is it already-obvious standard practice adding nothing? Does anything ` +
        `contradict it? You may run a quick corroborating search — Proven REQUIRES multiple ` +
        `independent sources or rigorous benchmark results you can point at. Return ` +
        `survives=false for vacuous, unsupported, or redundant tactics. If it survives, assign ` +
        `the final tier — WHEN UNCERTAIN, DEMOTE (Watch, not Promising; Promising, not Proven).`,
        { label: `verify:${t.topic}`.slice(0, 60), phase: 'Verify', schema: VERDICT_SCHEMA, model: 'sonnet' }
      ).then(v => ({ tactic: t, verdict: v }))
    ))
    return { read, verdicts: verdicts.filter(Boolean) }
  }
)

const survivors = []
const logEntries = []
for (let i = 0; i < picked.length; i++) {
  const c = picked[i]
  const res = evaluated[i]
  const base = { key: c.key, title: c.title, url: c.url }
  if (!res || !res.read) {
    logEntries.push({ ...base, disposition: 'rejected', reason: 'deep-read agent failed' })
    continue
  }
  if (!res.read.readable) {
    logEntries.push({ ...base, disposition: 'rejected', reason: res.read.whyUnreadable || 'source not fetchable' })
    continue
  }
  const kept = res.verdicts.filter(v => v.verdict && v.verdict.survives && v.verdict.tier)
  if (!kept.length) {
    const why = res.verdicts.map(v => v.verdict && v.verdict.reasoning).filter(Boolean).join(' | ') || 'no actionable tactics extracted'
    logEntries.push({ ...base, disposition: 'rejected', reason: why.slice(0, 300) })
    continue
  }
  survivors.push({
    candidate: c,
    tactics: kept.map(v => ({ ...v.tactic, tier: v.verdict.tier, skepticReasoning: v.verdict.reasoning })),
  })
  const allWatch = kept.every(v => v.verdict.tier === 'Watch')
  logEntries.push({
    ...base,
    disposition: allWatch ? 'watch' : 'adopted',
    reason: `${kept.length} tactic(s) kept: ${kept.map(v => v.verdict.tier).join(', ')}`,
  })
}
log(`Evaluated ${picked.length}: ${survivors.length} sources contribute tactics, ${logEntries.filter(e => e.disposition === 'rejected').length} rejected`)

const laneNote = `Lanes run: ${lanes.map(s => `${s.lane}=${s.ok ? 'ok' : 'FAILED'}`).join(', ')}.`

if (!survivors.length) {
  return {
    edits: [],
    digest: `## Sweep ${today} (window ${sinceDate} → ${today})\n\nNo tactics survived vetting this sweep. ${laneNote} Evaluated ${picked.length} candidate(s); see source log for dispositions.`,
    logEntries,
    lanes,
    evaluatedCount: picked.length,
    adoptedCount: 0,
  }
}

phase('Synthesize')
const synth = await agent(
  `You maintain a tiered coding-agent best-practices playbook. Merge the vetted tactics below ` +
  `into it as explicit edits.\n\nCURRENT PLAYBOOK:\n${playbook}\n\nVETTED TACTICS (grouped by ` +
  `source, each with final tier and skeptic reasoning):\n${JSON.stringify(survivors, null, 2)}\n\n` +
  `Rules: (1) Merge duplicates — if two sources support the same tactic, one entry citing both, ` +
  `and multiple independent sources justify Proven. (2) If a tactic updates or contradicts an ` +
  `existing playbook entry, emit action="replace" with replacesHeading set to that entry's exact ` +
  `### heading text, and note the supersession inside the new entry. (3) Otherwise emit ` +
  `action="add" under the tactic's topic. (4) Every entryMarkdown follows the playbook's entry ` +
  `format exactly: "### <one actionable sentence>" then Tier (with added ${today}), Sources ` +
  `(markdown links), Detail with optional Tool notes. (5) Write a digest: a "## Sweep ${today} ` +
  `(window ${sinceDate} → ${today})" markdown block summarizing what was added/replaced at which ` +
  `tiers, notable supersessions, and ending with: "${laneNote}"`,
  { label: 'synthesize', phase: 'Synthesize', schema: SYNTH_SCHEMA, model: 'opus' }
)
if (!synth) throw new Error('Synthesis agent failed — sweep results are in the journal; re-run with resumeFromRunId')

return {
  edits: synth.edits,
  digest: synth.digest,
  logEntries,
  lanes,
  evaluatedCount: picked.length,
  adoptedCount: survivors.length,
}
