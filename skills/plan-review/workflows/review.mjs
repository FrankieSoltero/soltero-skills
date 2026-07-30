export const meta = {
  name: 'plan-review-council',
  description: 'Grade an implementation plan with a 6-dimension council: band-anchored graders, anti-inflation skeptics on high scores, deterministic weighted gate (>=85 overall AND >=80 per dimension AND zero blocking violations)',
  phases: [
    { title: 'Grade', detail: 'one rubric-anchored grader per dimension, evidence-quoted scores' },
    { title: 'Skeptic', detail: 'adversarial miss-hunt on every score >= 90' },
    { title: 'Regrade', detail: 're-grade contested dimensions; take min(grade, regrade)' },
  ],
}

// args: { planPath, rubricPath, date, round }
const opts = typeof args === 'string' ? JSON.parse(args) : (args || {})
const planPath = opts.planPath
const rubricPath = opts.rubricPath
const round = opts.round || 1
if (!planPath || !rubricPath) throw new Error('args.planPath and args.rubricPath are required')

const DIMENSIONS = [
  { key: 'decomposition', label: 'D1 Task decomposition & ordering', weight: 15 },
  { key: 'verifiability', label: 'D2 Verifiability', weight: 20 },
  { key: 'fidelity', label: 'D3 Spec fidelity & traceability', weight: 20 },
  { key: 'concreteness', label: 'D4 Concreteness', weight: 15 },
  { key: 'risk', label: 'D5 Risk & reversibility', weight: 15 },
  { key: 'consistency', label: 'D6 Consistency & completeness', weight: 15 },
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

const gradePrompt = (d) => `You are one grader on an implementation-plan review council. Grade EXACTLY ONE dimension: ${d.label}.

Read these two files:
1. The rubric: ${rubricPath} — your dimension's checklist and the band anchors. Follow it exactly.
2. The plan under review: ${planPath}

Rules (from the rubric, non-negotiable):
- Score 0-100 anchored to the bands; when torn between two bands take the LOWER.
- Every violation must quote the offending plan line(s) verbatim (or name the absent task/section) and cite the checklist item.
- A score >= 90 requires affirmative excellenceEvidence quotes; absence of noticed flaws is not evidence.
- For each violation, propose a concrete fix and classify it: "mechanical" (rewording, reordering, adding verification steps or rollback notes — appliable without a product/ops decision) or "owner-decision" (scope calls, prod-migration strategy, ownership, targets — needs the plan owner).
- Grade ONLY your dimension; ignore flaws that belong to other dimensions.

Return via the structured output schema. This is round ${round} of review.`

const skepticPrompt = (d, g) => `You are an adversarial skeptic on an implementation-plan review council. A grader scored dimension "${d.label}" at ${g.score}/100 — suspiciously high. Your ONLY job is to find checklist violations the grader MISSED.

Read the rubric (${rubricPath}) — dimension ${d.label}'s checklist — and the plan (${planPath}). Check every checklist item explicitly against the plan. The grader already found these violations (do NOT re-report them): ${JSON.stringify(g.violations.map(v => v.checklistItem + ': ' + v.quote.slice(0, 80)))}

Report only NEW missed violations, each with a verbatim plan quote and the checklist item it breaks. If after checking every item you genuinely find nothing new, return an empty missedViolations array — but only then.`

const regradePrompt = (d, g, s) => `You are a fresh re-grader on an implementation-plan review council for dimension "${d.label}". A prior grader scored it ${g.score}/100, but a skeptic then confirmed these MISSED violations:
${JSON.stringify(s.missedViolations, null, 2)}

Read the rubric (${rubricPath}) and the plan (${planPath}). Re-grade the dimension from scratch with the full violation set (grader's + skeptic's) in view. Same rules: band-anchored, lower band when torn, quotes for every violation, excellenceEvidence required for >= 90. Return via the schema.`

phase('Grade')
const results = await pipeline(
  DIMENSIONS,
  d => agent(gradePrompt(d), { label: `grade:${d.key}`, phase: 'Grade', schema: GRADE_SCHEMA, model: 'opus' }),
  async (g, d) => {
    if (!g) return null
    if (g.score < 90) return { d, g, skeptic: null, regrade: null }
    const s = await agent(skepticPrompt(d, g), { label: `skeptic:${d.key}`, phase: 'Skeptic', schema: SKEPTIC_SCHEMA, model: 'sonnet' })
    if (!s || s.missedViolations.length === 0) return { d, g, skeptic: s, regrade: null }
    const rg = await agent(regradePrompt(d, g, s), { label: `regrade:${d.key}`, phase: 'Regrade', schema: GRADE_SCHEMA, model: 'opus' })
    return { d, g, skeptic: s, regrade: rg }
  },
)

const scored = results.filter(Boolean)
if (scored.length < DIMENSIONS.length) {
  log(`WARNING: ${DIMENSIONS.length - scored.length} dimension(s) returned no grade — verdict computed on partial council; treat as BLOCKED`)
}

const dims = scored.map(({ d, g, skeptic, regrade }) => {
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

const totalWeight = dims.reduce((a, x) => a + x.weight, 0)
const overall = Math.round(dims.reduce((a, x) => a + x.finalScore * x.weight, 0) / totalWeight * 10) / 10
const floorBreaches = dims.filter(x => x.finalScore < 80).map(x => `${x.label}: ${x.finalScore}`)
const councilComplete = scored.length === DIMENSIONS.length
const blockingViolations = dims.flatMap(x => x.violations.filter(v => v.severity === 'blocking').map(v => ({ dimension: x.label, ...v })))
const pass = councilComplete && overall >= 85 && floorBreaches.length === 0 && blockingViolations.length === 0

const blockingFixes = dims.flatMap(x => x.violations.filter(v => v.severity === 'blocking' && v.fixKind === 'mechanical').map(v => ({ dimension: x.label, ...v })))
const ownerQuestions = dims.flatMap(x => x.violations.filter(v => v.fixKind === 'owner-decision').map(v => ({ dimension: x.label, ...v })))
const recommendedFixes = dims.flatMap(x => x.violations.filter(v => v.severity === 'minor' && v.fixKind === 'mechanical').map(v => ({ dimension: x.label, ...v })))

log(`Round ${round}: overall ${overall}/100, verdict ${pass ? 'PASS' : 'BLOCKED'}${floorBreaches.length ? ' (floor breaches: ' + floorBreaches.join('; ') + ')' : ''}${blockingViolations.length ? ` (${blockingViolations.length} blocking violation(s) outstanding)` : ''}`)

return {
  round,
  overall,
  gate: { threshold: 85, floor: 80, floorBreaches, blockingViolationCount: blockingViolations.length, councilComplete },
  verdict: pass ? 'PASS' : 'BLOCKED',
  dimensions: dims,
  blockingFixes,
  recommendedFixes,
  ownerQuestions,
}
