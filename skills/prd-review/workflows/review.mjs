export const meta = {
  name: 'prd-review-council',
  description: 'Grade a PRD with a 6-dimension council: band-anchored graders (sonnet, escalating to opus only on contested high scores), deterministic weighted gate (>=95 overall AND >=80 per dimension)',
  phases: [
    { title: 'Grade', detail: 'one rubric-anchored grader per dimension (sonnet), evidence-quoted scores' },
    { title: 'Skeptic', detail: 'adversarial miss-hunt (opus) on every score >= 90' },
    { title: 'Regrade', detail: 're-grade contested dimensions (opus); take min(grade, regrade)' },
  ],
}

// args: { prdPath, rubricPath, date, round, priorDimensions }
// priorDimensions: the `dimensions` array returned by the previous round's run — when
// present, only dimensions that failed (score < 80 or a blocking violation) are re-graded;
// the rest carry their prior-round result forward unchanged. Omit on round 1.
const opts = typeof args === 'string' ? JSON.parse(args) : (args || {})
const prdPath = opts.prdPath
const rubricPath = opts.rubricPath
const round = opts.round || 1
const priorDimensions = opts.priorDimensions || null
if (!prdPath || !rubricPath) throw new Error('args.prdPath and args.rubricPath are required')

const DIMENSIONS = [
  { key: 'problem-evidence', label: 'D1 Problem & evidence', weight: 15 },
  { key: 'requirements', label: 'D2 Requirements quality', weight: 20 },
  { key: 'stories-criteria', label: 'D3 Stories & acceptance criteria', weight: 15 },
  { key: 'scope', label: 'D4 Scope discipline', weight: 15 },
  { key: 'metrics', label: 'D5 Success metrics', weight: 15 },
  { key: 'consistency', label: 'D6 Consistency & ambiguity', weight: 20 },
]

const GRADE_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', minimum: 0, maximum: 100 },
    band: { type: 'string' },
    violations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          quote: { type: 'string' },
          checklistItem: { type: 'string' },
          severity: { type: 'string', enum: ['blocking', 'minor'] },
          fix: { type: 'string' },
          fixKind: { type: 'string', enum: ['mechanical', 'owner-decision'] },
        },
        required: ['quote', 'checklistItem', 'severity', 'fix', 'fixKind'],
      },
    },
    excellenceEvidence: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['score', 'band', 'violations', 'excellenceEvidence', 'summary'],
}

const SKEPTIC_SCHEMA = {
  type: 'object',
  properties: {
    missedViolations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          quote: { type: 'string' },
          checklistItem: { type: 'string' },
          whyGraderMissedIt: { type: 'string' },
        },
        required: ['quote', 'checklistItem', 'whyGraderMissedIt'],
      },
    },
    reasoning: { type: 'string' },
  },
  required: ['missedViolations', 'reasoning'],
}

const gradePrompt = (d) => `You are one grader on a PRD review council. Grade EXACTLY ONE dimension: ${d.label}.

Read these two files:
1. The rubric: ${rubricPath} — your dimension's checklist and the band anchors. Follow it exactly.
2. The PRD under review: ${prdPath}

Rules (from the rubric, non-negotiable):
- Score 0-100 anchored to the bands; when torn between two bands take the LOWER.
- Every violation must quote the offending PRD line(s) verbatim (or name the absent section) and cite the checklist item.
- A score >= 90 requires affirmative excellenceEvidence quotes; absence of noticed flaws is not evidence.
- For each violation, propose a concrete fix and classify it: "mechanical" (wording, structure, markers, adding a section — appliable without a product decision) or "owner-decision" (targets, scope calls, personas, retention — needs the PRD owner).
- Grade ONLY your dimension; ignore flaws that belong to other dimensions.

Return via the structured output schema. This is round ${round} of review.`

const skepticPrompt = (d, g) => `You are an adversarial skeptic on a PRD review council. A grader scored dimension "${d.label}" at ${g.score}/100 — suspiciously high. Your ONLY job is to find checklist violations the grader MISSED.

Read the rubric (${rubricPath}) — dimension ${d.label}'s checklist — and the PRD (${prdPath}). Check every checklist item explicitly against the PRD. The grader already found these violations (do NOT re-report them): ${JSON.stringify(g.violations.map(v => v.checklistItem + ': ' + v.quote.slice(0, 80)))}

Report only NEW missed violations, each with a verbatim PRD quote and the checklist item it breaks. If after checking every item you genuinely find nothing new, return an empty missedViolations array — but only then.`

const regradePrompt = (d, g, s) => `You are a fresh re-grader on a PRD review council for dimension "${d.label}". A prior grader scored it ${g.score}/100, but a skeptic then confirmed these MISSED violations:
${JSON.stringify(s.missedViolations, null, 2)}

Read the rubric (${rubricPath}) and the PRD (${prdPath}). Re-grade the dimension from scratch with the full violation set (grader's + skeptic's) in view. Same rules: band-anchored, lower band when torn, quotes for every violation, excellenceEvidence required for >= 90. Return via the schema.`

const failedKeys = priorDimensions
  ? new Set(priorDimensions.filter(x => x.finalScore < 80 || x.violations.some(v => v.severity === 'blocking')).map(x => x.key))
  : null
const toGrade = failedKeys ? DIMENSIONS.filter(d => failedKeys.has(d.key)) : DIMENSIONS
const carried = failedKeys ? priorDimensions.filter(x => !failedKeys.has(x.key)) : []
if (failedKeys) {
  log(`Round ${round}: re-grading ${toGrade.length}/${DIMENSIONS.length} dimension(s) that failed round ${round - 1} (${toGrade.map(d => d.key).join(', ') || 'none'}); ${carried.length} carried forward unchanged`)
}

phase('Grade')
const results = toGrade.length ? await pipeline(
  toGrade,
  d => agent(gradePrompt(d), { label: `grade:${d.key}`, phase: 'Grade', schema: GRADE_SCHEMA, model: 'sonnet' }),
  async (g, d) => {
    if (!g) return null
    if (g.score < 90) return { d, g, skeptic: null, regrade: null }
    const s = await agent(skepticPrompt(d, g), { label: `skeptic:${d.key}`, phase: 'Skeptic', schema: SKEPTIC_SCHEMA, model: 'opus', effort: 'low' })
    if (!s || s.missedViolations.length === 0) return { d, g, skeptic: s, regrade: null }
    const rg = await agent(regradePrompt(d, g, s), { label: `regrade:${d.key}`, phase: 'Regrade', schema: GRADE_SCHEMA, model: 'opus' })
    return { d, g, skeptic: s, regrade: rg }
  },
) : []

const scored = results.filter(Boolean)
if (scored.length < toGrade.length) {
  log(`WARNING: ${toGrade.length - scored.length} dimension(s) returned no grade — verdict computed on partial council; treat as BLOCKED`)
}

const fresh = scored.map(({ d, g, skeptic, regrade }) => {
  const final = regrade ? Math.min(g.score, regrade.score) : g.score
  const violations = [
    ...g.violations,
    ...(regrade ? regrade.violations.filter(rv => !g.violations.some(gv => gv.quote === rv.quote)) : []),
  ]
  return {
    key: d.key,
    label: d.label,
    weight: d.weight,
    graderScore: g.score,
    skepticMisses: skeptic ? skeptic.missedViolations.length : 0,
    finalScore: final,
    violations,
    summary: g.summary,
  }
})

const byKey = new Map([...carried, ...fresh].map(x => [x.key, x]))
const dims = DIMENSIONS.map(d => byKey.get(d.key)).filter(Boolean)

const totalWeight = dims.reduce((a, x) => a + x.weight, 0)
const overall = dims.length ? Math.round(dims.reduce((a, x) => a + x.finalScore * x.weight, 0) / totalWeight * 10) / 10 : 0
const floorBreaches = dims.filter(x => x.finalScore < 80).map(x => `${x.label}: ${x.finalScore}`)
const councilComplete = dims.length === DIMENSIONS.length
const pass = councilComplete && overall >= 95 && floorBreaches.length === 0

const blockingFixes = dims.flatMap(x => x.violations.filter(v => v.severity === 'blocking' && v.fixKind === 'mechanical').map(v => ({ dimension: x.label, ...v })))
const ownerQuestions = dims.flatMap(x => x.violations.filter(v => v.fixKind === 'owner-decision').map(v => ({ dimension: x.label, ...v })))
const recommendedFixes = dims.flatMap(x => x.violations.filter(v => v.severity === 'minor' && v.fixKind === 'mechanical').map(v => ({ dimension: x.label, ...v })))

log(`Round ${round}: overall ${overall}/100, verdict ${pass ? 'PASS' : 'BLOCKED'}${floorBreaches.length ? ' (floor breaches: ' + floorBreaches.join('; ') + ')' : ''}`)

return {
  round,
  overall,
  gate: { threshold: 95, floor: 80, floorBreaches, councilComplete },
  verdict: pass ? 'PASS' : 'BLOCKED',
  dimensions: dims,
  blockingFixes,
  recommendedFixes,
  ownerQuestions,
}
