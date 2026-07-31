export const meta = {
  name: 'transcript-reader-distill',
  description: 'Verified meeting-transcript extraction: deterministic ingest, parallel cited chunk extraction, cross-chunk reduce, per-item refute verification, completeness critic, cited report',
  phases: [
    { title: 'Ingest', detail: 'run the deterministic ingest script: normalize, chunk speaker-aware with overlap' },
    { title: 'Extract', detail: 'parallel schema-forced chunk extractors, verbatim evidence + citations, rule pool injected' },
    { title: 'Reduce', detail: 'cross-chunk merge: dedupe, resolve owners/pronouns, detect reversals, assemble timeline' },
    { title: 'Verify', detail: 'one independent refute-style verifier per item against the normalized transcript' },
    { title: 'Critic', detail: 'completeness sweep for extraction-worthy content missing from the merge' },
    { title: 'Report', detail: 'write the cited report next to the input with honest coverage stats' },
  ],
}

// Some runtimes deliver the Workflow `args` value as a JSON string rather than a parsed
// object; tolerate both so required fields are never silently undefined.
const opts = typeof args === 'string' ? JSON.parse(args) : (args || {})
const transcript = opts.transcript      // absolute path to the input transcript file
const skillDir = opts.skillDir          // absolute path of the transcript-reader skill dir
const meetingType = opts.meetingType || 'generic' // standup | client | planning | interview | generic
const reportPath = opts.reportPath      // optional; default: <basename>-distilled.md next to input
const rules = opts.rules || ''          // current contents of references/extraction-rules.md
if (!transcript || !skillDir) throw new Error('args.transcript and args.skillDir are required')
const TYPES = ['decision', 'action', 'open_question', 'fact', 'disagreement', 'timeline']

const OVERLAYS = {
  generic: 'No overlay fields — the fixed core only.',
  standup: 'Overlay fields: blockers (who is blocked, on what, since when, unblock owner) and per-person commitments (yesterday/today).',
  client: 'Overlay fields: commitments made TO the client and BY the client (exact wording, who committed), risks or complaints the client raised, and promised follow-ups with dates.',
  planning: 'Overlay fields: scope decisions (in/out/deferred with what was traded away), estimates and deadlines committed (verbatim numbers), and priority calls (what outranks what).',
  interview: 'Overlay fields: candidate claims (skill/experience assertions, verbatim) each with the evidence offered or its absence, interviewer commitments (next steps, timelines), and red flags raised by any party.',
}
const overlay = OVERLAYS[meetingType] || OVERLAYS.generic

const INGEST_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    error: { type: 'string' },
    normalizedPath: { type: 'string' },
    manifestPath: { type: 'string' },
    utterances: { type: 'integer' },
    firstTimestamp: { type: 'string' },
    lastTimestamp: { type: 'string' },
    warnings: { type: 'array', items: { type: 'string' } },
    chunks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          path: { type: 'string' },
          startLine: { type: 'integer' },
          endLine: { type: 'integer' },
          startTimestamp: { type: 'string' },
          endTimestamp: { type: 'string' },
        },
        required: ['id', 'path', 'startLine', 'endLine'],
      },
    },
  },
  required: ['ok'],
}

const ITEM_PROPS = {
  type: { type: 'string', enum: TYPES },
  content: { type: 'string' },
  owner: { type: 'string' },
  ownerAmbiguous: { type: 'boolean' },
  ownerCandidates: { type: 'array', items: { type: 'string' } },
  deadline: { type: 'string' },
  value: { type: 'string' },
  status: { type: 'string', enum: ['final', 'reversed', 'amended', 'unresolved', 'resolved', 'n/a'] },
  verbatimQuote: { type: 'string' },
  citationLines: { type: 'string' },
  citationTimestamp: { type: 'string' },
  appliedRuleIds: { type: 'array', items: { type: 'string' } },
}
const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: ITEM_PROPS,
        required: ['type', 'content', 'verbatimQuote', 'citationLines'],
      },
    },
  },
  required: ['items'],
}

const REDUCE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { ...ITEM_PROPS, id: { type: 'string' }, mergeNotes: { type: 'string' } },
        required: ['id', 'type', 'content', 'verbatimQuote', 'citationLines'],
      },
    },
    timeline: { type: 'array', items: { type: 'string' } },
  },
  required: ['items', 'timeline'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['confirmed', 'corrected', 'refuted'] },
    reasoning: { type: 'string' },
    correctedItem: { type: 'object', properties: { ...ITEM_PROPS, id: { type: 'string' } } },
    ruleFeedback: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ruleId: { type: 'string' },
          effect: { type: 'string', enum: ['helpful', 'harmful'] },
          note: { type: 'string' },
        },
        required: ['ruleId', 'effect'],
      },
    },
  },
  required: ['verdict', 'reasoning'],
}

const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    missedItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: ITEM_PROPS,
        required: ['type', 'content', 'verbatimQuote', 'citationLines'],
      },
    },
    coverageNotes: { type: 'string' },
  },
  required: ['missedItems', 'coverageNotes'],
}

const REPORT_SCHEMA = {
  type: 'object',
  properties: { reportPath: { type: 'string' }, summary: { type: 'string' } },
  required: ['reportPath', 'summary'],
}

const EVIDENCE_RULES =
  'Evidence rules (non-negotiable): every item cites its normalized-transcript line(s) ' +
  '(the L<n> numbers) and timestamp when present. verbatimQuote is copied EXACTLY from the ' +
  'transcript — names, numbers, dates, and quotes are never paraphrased, reworded, or ' +
  'rounded; paraphrase is allowed only in the content field, which must be consistent with ' +
  'the quote. An item without a resolving citation must not be returned. If an owner is ' +
  'ambiguous (e.g. "you take that" with an unclear addressee), set ownerAmbiguous=true and ' +
  'list ownerCandidates instead of guessing. If a figure is stated twice with different ' +
  'values, return BOTH as separate cited facts and say they conflict — never pick one. '

phase('Ingest')
const ing = await agent(
  `Run this exact command with the Bash tool and relay its output faithfully:\n` +
  `node "${skillDir}/scripts/ingest.mjs" "${transcript}"\n` +
  `It prints a JSON manifest (normalized transcript path, chunk list with per-chunk file ` +
  `paths and line ranges, warnings). Return ok=true with the manifest fields mapped into ` +
  `the schema. If the command fails, return ok=false with the error text. Do not summarize, ` +
  `edit, or re-chunk anything yourself — the script's output is the ground truth.`,
  { label: 'ingest', phase: 'Ingest', schema: INGEST_SCHEMA, model: 'haiku', effort: 'low' }
)
if (!ing || !ing.ok || !ing.chunks || !ing.chunks.length) {
  throw new Error(`Ingest failed: ${ing && ing.error ? ing.error : 'no manifest returned'}`)
}
log(`Ingested ${ing.utterances} utterances into ${ing.chunks.length} chunk(s); warnings: ${(ing.warnings || []).length}`)

phase('Extract')
const rulePoolBlock = rules.trim()
  ? `LEARNED RULE POOL (from past user corrections; apply when a rule's trigger matches, and tag matching items with appliedRuleIds):\n${rules}\n`
  : ''
const extractions = await parallel(ing.chunks.map(c => () =>
  agent(
    `You are one chunk extractor in a meeting-transcript distillation pipeline. Read the ` +
    `chunk file at ${c.path} (lines L${c.startLine}-L${c.endLine} of the normalized ` +
    `transcript; this chunk overlaps its neighbors, so boundary content may repeat — extract ` +
    `it anyway, the reducer dedupes). Extract every item of these types: decisions (what/who/` +
    `why; note in-chunk reversals), action items (owner, deadline, the verbatim ask), open ` +
    `questions, key facts & numbers (verbatim values), disagreements (positions + holders), ` +
    `and timeline entries (major topic starts). ${overlay} ` + EVIDENCE_RULES + rulePoolBlock +
    `Cite citationLines as "L<start>-L<end>". Return structured items only — no prose report.`,
    { label: `extract:${c.id}`, phase: 'Extract', schema: EXTRACT_SCHEMA, model: 'haiku' }
  )
))
const failedChunks = ing.chunks.filter((c, i) => !extractions[i])
const rawItems = extractions.filter(Boolean).flatMap(r => r.items)
if (!rawItems.length) throw new Error('No items extracted from any chunk — aborting rather than writing an empty report')
for (const c of failedChunks) log(`EXTRACTOR FAILED on ${c.id} (L${c.startLine}-L${c.endLine}) — coverage stats must disclose this`)
log(`Extracted ${rawItems.length} raw items from ${ing.chunks.length - failedChunks.length}/${ing.chunks.length} chunks`)

phase('Reduce')
const red = await agent(
  `You are the cross-chunk reducer in a meeting-transcript distillation pipeline. The ` +
  `normalized transcript is at ${ing.normalizedPath} (cite lines as L<n>). Below are raw ` +
  `items from overlapping chunk extractors. Your job, with the full transcript available to ` +
  `you for cross-checking: (1) DEDUPE items the overlap produced twice (merge citations). ` +
  `(2) RESOLVE owners and pronouns across chunk boundaries: an item flagged ownerAmbiguous ` +
  `may be resolved ONLY by other transcript evidence (e.g. a later utterance where someone ` +
  `claims or confirms the task) — cite that evidence in the merged citation; if nothing in ` +
  `the transcript resolves it, keep ownerAmbiguous=true with the candidates. Never resolve ` +
  `by plausibility. (3) DETECT REVERSALS: a decision later reversed, superseded, or amended ` +
  `anywhere in the transcript gets status "reversed"/"amended" with citations to BOTH the ` +
  `original and the reversal — never report the stale version as final. (4) Keep conflicting ` +
  `facts as conflicts (both values, both citations). (5) Assemble a topic timeline. Assign ` +
  `each merged item a stable id (d1, a1, q1, f1, g1...). Preserve verbatim quotes exactly. ` +
  EVIDENCE_RULES +
  `\nRAW ITEMS:\n${JSON.stringify(rawItems)}`,
  { label: 'reduce', phase: 'Reduce', schema: REDUCE_SCHEMA, model: 'sonnet' }
)
if (!red || !red.items || !red.items.length) throw new Error('Reduce step failed — aborting')
log(`Reduced to ${red.items.length} merged items`)

const verifyBatch = (items, tag) => parallel(items.map(it => () =>
  agent(
    `You are an independent verifier in a meeting-transcript distillation pipeline. You did ` +
    `NOT produce this item; your job is to try to REFUTE it against the transcript. The ` +
    `normalized transcript is at ${ing.normalizedPath} — line N of that file is citation ` +
    `L<N> (use Read/Grep/sed to inspect the cited lines AND surrounding context).\n` +
    `ITEM:\n${JSON.stringify(it, null, 2)}\n` +
    `Check, at minimum: (a) the citation resolves and the verbatimQuote matches the ` +
    `transcript text exactly at those lines; (b) names/numbers/dates/values are verbatim, ` +
    `not paraphrased or rounded; (c) the owner is actually supported — if the transcript ` +
    `leaves the owner ambiguous, an unflagged single owner is WRONG; (d) the quote is not ` +
    `out of context (hedged speculation reported as fact, off-record content, sarcasm); ` +
    `(e) for decisions: search the REST of the transcript for a later reversal or amendment ` +
    `— a decision reported final that was later reversed is WRONG; (f) for facts: search for ` +
    `the same figure stated elsewhere with a different value — an unreported conflict is ` +
    `WRONG. Verdicts: "confirmed" (it stands), "corrected" (fixable error — return the full ` +
    `correctedItem with accurate citations), "refuted" (citation does not resolve, quote not ` +
    `in transcript, or claim unsupported and not fixable). When uncertain, do not confirm. ` +
    (rulePoolBlock ? `\nIf the item lists appliedRuleIds, report ruleFeedback: "helpful" if the rule led it right, "harmful" if the rule caused an error you found.\n${rulePoolBlock}` : ''),
    { label: `verify:${tag}:${it.id || it.type}`.slice(0, 60), phase: 'Verify', schema: VERDICT_SCHEMA, model: 'sonnet', effort: 'low' }
  ).then(v => ({ item: it, verdict: v }))
))

phase('Verify')
const judged = await verifyBatch(red.items, 'r1')
const confirmed = []
const corrected = []
const flaggedUnverified = []
const ruleFeedback = []
for (const j of judged) {
  const v = j.verdict
  if (v && v.ruleFeedback) ruleFeedback.push(...v.ruleFeedback)
  if (!v) {
    // Verifier failed to report: the item is NOT silently kept (that would report an
    // unverified claim as fact) and NOT silently dropped — it goes to the flagged section.
    flaggedUnverified.push({ ...j.item, flagReason: 'verifier did not report — unverified' })
  } else if (v.verdict === 'confirmed') {
    confirmed.push(j.item)
  } else if (v.verdict === 'corrected' && v.correctedItem) {
    corrected.push({ ...v.correctedItem, id: j.item.id, correctionNote: v.reasoning })
  } else {
    flaggedUnverified.push({ ...j.item, flagReason: v.reasoning })
  }
}
log(`Verify round 1: ${confirmed.length} confirmed, ${corrected.length} corrected, ${flaggedUnverified.length} flagged unverified`)

phase('Critic')
const verifiedSoFar = [...confirmed, ...corrected]
const critic = await agent(
  `You are the completeness critic in a meeting-transcript distillation pipeline. The ` +
  `dominant failure mode in long transcripts is OMISSION, not hallucination. Read the ENTIRE ` +
  `normalized transcript at ${ing.normalizedPath} (line N = citation L<N>; it has ` +
  `${ing.utterances} lines — sweep all of it, especially the middle) and compare against the ` +
  `already-extracted items below. Return every extraction-worthy item that is MISSING: ` +
  `decisions, action items, open questions, key facts & numbers, disagreements, plus ` +
  `overlay content (${overlay}). Do not re-report items already in the list; do not report ` +
  `filler. ` + EVIDENCE_RULES +
  `\nALREADY EXTRACTED (id, type, content, citations):\n` +
  JSON.stringify(verifiedSoFar.concat(flaggedUnverified).map(i => ({ id: i.id, type: i.type, content: i.content, citationLines: i.citationLines }))),
  { label: 'critic', phase: 'Critic', schema: CRITIC_SCHEMA, model: 'sonnet' }
)
let criticAdded = 0
if (critic && critic.missedItems && critic.missedItems.length) {
  log(`Critic found ${critic.missedItems.length} candidate missed item(s) — routing through Verify`)
  const criticItems = critic.missedItems.map((it, i) => ({ ...it, id: `c${i + 1}` }))
  const judged2 = await verifyBatch(criticItems, 'r2')
  for (const j of judged2) {
    const v = j.verdict
    if (v && v.ruleFeedback) ruleFeedback.push(...v.ruleFeedback)
    if (!v) flaggedUnverified.push({ ...j.item, flagReason: 'verifier did not report — unverified' })
    else if (v.verdict === 'confirmed') { confirmed.push(j.item); criticAdded++ }
    else if (v.verdict === 'corrected' && v.correctedItem) { corrected.push({ ...v.correctedItem, id: j.item.id, correctionNote: v.reasoning }); criticAdded++ }
    else flaggedUnverified.push({ ...j.item, flagReason: v.reasoning })
  }
} else if (!critic) {
  log('CRITIC FAILED — coverage stats must disclose that no completeness sweep ran')
}

phase('Report')
const finalItems = [...confirmed, ...corrected]
const stats = {
  transcript,
  utterances: ing.utterances,
  span: `${ing.firstTimestamp || 'n/a'} → ${ing.lastTimestamp || 'n/a'}`,
  chunksProcessed: `${ing.chunks.length - failedChunks.length}/${ing.chunks.length}`,
  failedChunks: failedChunks.map(c => `${c.id} (L${c.startLine}-L${c.endLine})`),
  itemsExtracted: rawItems.length,
  itemsAfterMerge: red.items.length,
  itemsConfirmed: confirmed.length,
  itemsCorrectedByVerifier: corrected.length,
  itemsFlaggedUnverified: flaggedUnverified.length,
  criticAdded,
  criticRan: !!critic,
  ingestWarnings: ing.warnings || [],
}
const defaultReport = transcript.replace(/\.[^./\\]+$/, '') + '-distilled.md'
const outPath = reportPath || defaultReport
const rep = await agent(
  `Write the final distillation report for the meeting transcript ${transcript} to the file ` +
  `${outPath} (overwrite if present; keep everything LOCAL — no publishing, no artifacts, no ` +
  `external sends). Meeting type: ${meetingType}. Sections in order: (1) "Summary" — a short ` +
  `prose summary clearly labeled as summary (paraphrase allowed here only). (2) "Decisions" — ` +
  `each with what/who/why, STATUS (final/reversed/amended — reversed decisions must show ` +
  `both the original and the reversal with both citations, never just the stale version). ` +
  `(3) "Action items" — owner (or explicit AMBIGUOUS with candidates), deadline, verbatim ` +
  `ask. (4) "Open questions". (5) "Key facts & numbers" — verbatim values; conflicting ` +
  `figures shown as conflicts with both citations. (6) "Disagreements" — positions and ` +
  `holders, resolution state. (7) "Topic timeline". ` +
  (meetingType !== 'generic' ? `(8) "${meetingType} overlay" — the overlay fields (${overlay}). ` : '') +
  `Then "Flagged (unverified)" — every flagged item with its flag reason; these are NOT ` +
  `facts and the section must say so. Then "Coverage" — render this stats object honestly ` +
  `and completely (including failed chunks and whether the completeness critic ran): ` +
  `${JSON.stringify(stats)}. EVERY item line carries its citation (L-lines + timestamp). ` +
  `Copy quotes and citations exactly from the data — do not invent, merge, drop, or reword ` +
  `items. DATA:\nVERIFIED ITEMS:\n${JSON.stringify(finalItems)}\n` +
  `FLAGGED UNVERIFIED:\n${JSON.stringify(flaggedUnverified)}\nTIMELINE:\n${JSON.stringify(red.timeline)}\n` +
  `After writing, return the report path and a 5-line-max summary.`,
  { label: 'report', phase: 'Report', schema: REPORT_SCHEMA, model: 'sonnet' }
)
if (!rep) {
  return {
    reportPath: null,
    reportWritten: false,
    summary: 'Report agent failed — no file written. Verified items, flagged items, and stats are returned in this object; relay them or re-run.',
    stats,
    items: finalItems,
    flaggedUnverified,
    timeline: red.timeline,
    ruleFeedback,
  }
}
return { reportPath: rep.reportPath, summary: rep.summary, stats, ruleFeedback }
