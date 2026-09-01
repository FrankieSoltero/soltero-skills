export const meta = {
  name: 'plan-review-council',
  description: 'Grade an implementation plan with a 6-dimension council: band-anchored graders (sonnet, escalating to opus only on contested high scores), deterministic weighted gate (>=85 overall AND >=80 per dimension AND zero blocking violations). A lite single-reviewer mode is available for small all-mechanical plans.',
  phases: [
    { title: 'Grade', detail: 'one rubric-anchored grader per dimension (sonnet), evidence-quoted scores' },
    { title: 'Skeptic', detail: 'adversarial miss-hunt (opus) on every score >= 90' },
    { title: 'Regrade', detail: 're-grade contested dimensions (opus); take min(grade, regrade)' },
  ],
}

// args: { planPath, rubricPath, date, round, priorDimensions, mode }
// priorDimensions: the `dimensions` array returned by the previous round's run — when
// present, only dimensions that failed (score < 80 or a blocking violation) are re-graded;
// the rest carry their prior-round result forward unchanged. Omit on round 1.
// mode: 'lite' runs a single sonnet reviewer across all 6 dimensions in one pass, no
// skeptic/regrade escalation — for small, all-mechanical-tier plans only (caller decides
// eligibility before invoking; see SKILL.md's size gate).
const opts = typeof args === 'string' ? JSON.parse(args) : (args || {})
const planPath = opts.planPath
const rubricPath = opts.rubricPath
const round = opts.round || 1
const priorDimensions = opts.priorDimensions || null
const lite = opts.mode === 'lite'
const structuralFindings = opts.structuralFindings || []
if (!planPath || !rubricPath) throw new Error('args.planPath and args.rubricPath are required')

const MAX_ROUNDS = 3
if (round > MAX_ROUNDS) {
  throw new Error(`Round ${round} exceeds the ${MAX_ROUNDS}-round cap. A plan still BLOCKED after ${MAX_ROUNDS} rounds goes back to soltero-skills:lean-plans for a rewrite; report what blocks and stop. Do not convene another council round.`)
}

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

const LITE_SCHEMA = {
  type: 'object',
  properties: {
    dimensions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', enum: DIMENSIONS.map(d => d.key) },
          score: { type: 'integer', minimum: 0, maximum: 100 },
          violations: GRADE_SCHEMA.properties.violations,
          summary: { type: 'string' },
        },
        required: ['key', 'score', 'violations', 'summary'],
      },
    },
  },
  required: ['dimensions'],
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

const structuralBlock = structuralFindings.length
  ? `\nA deterministic parser has already analyzed this plan's dependency table and contract blocks. These findings are established facts with plan line numbers — do not re-derive them, and do not contradict them. Count any that fall under your dimension's checklist as violations you did not have to find, and spend your pass on what the parser cannot judge:\n${JSON.stringify(structuralFindings, null, 2)}\n`
  : ''

const gradePrompt = (d) => `You are one grader on an implementation-plan review council. Grade EXACTLY ONE dimension: ${d.label}.

Read these two files:
1. The rubric: ${rubricPath} — your dimension's checklist and the band anchors. Follow it exactly.
2. The plan under review: ${planPath}
${structuralBlock}
Rules (from the rubric):
- Score 0-100 anchored to the bands. The bands run in both directions: a section that meets a band's description earns that band's score, and when you are genuinely torn between two bands take the lower one. Do not withhold a score the plan has earned, and do not deduct for anything you cannot quote.
- Every violation must quote the offending plan line(s) verbatim — copied from the file you read in this session, not recalled or paraphrased — or name the absent task/section, and cite the checklist item.
- A score >= 90 requires affirmative excellenceEvidence quotes; absence of noticed flaws is not evidence.
- For each violation, propose a concrete fix and classify it: "mechanical" (rewording, reordering, adding verification steps or rollback notes — appliable without a product/ops decision) or "owner-decision" (scope calls, prod-migration strategy, ownership, targets — needs the plan owner).
- Grade ONLY your dimension; ignore flaws that belong to other dimensions.

Return via the structured output schema. This is round ${round} of review.`

const skepticPrompt = (d, g) => `You are the independent verifier on an implementation-plan review council. A grader scored dimension "${d.label}" at ${g.score}/100. Scores in this band get a second pass because a generous grade and a genuinely excellent plan read the same way from one pass; your job is to tell those two apart by re-checking the checklist yourself.

Read the rubric (${rubricPath}) — dimension ${d.label}'s checklist — and the plan (${planPath}). Check every checklist item explicitly against the plan. The grader already found these violations (do NOT re-report them): ${JSON.stringify(g.violations.map(v => v.checklistItem + ': ' + v.quote.slice(0, 80)))}

Report a missed violation only when you can name the checklist item it breaks and quote the plan line that breaks it, copied verbatim from the file you read in this session — not paraphrased, not inferred from what the plan omits unless the checklist item is about an omission, and never a stylistic preference. Where a checklist item is satisfied, or the evidence is ambiguous, that item yields nothing.

Both outcomes are correct results. An empty missedViolations array is the right answer when the grade was earned; say so in reasoning, naming the items you checked.`

const regradePrompt = (d, g, s) => `You are a fresh re-grader on an implementation-plan review council for dimension "${d.label}". A prior grader scored it ${g.score}/100, but a skeptic then confirmed these MISSED violations:
${JSON.stringify(s.missedViolations, null, 2)}

Read the rubric (${rubricPath}) and the plan (${planPath}). Re-grade the dimension from scratch with the full violation set (grader's + skeptic's) in view. Same rules: band-anchored, lower band when torn, quotes for every violation, excellenceEvidence required for >= 90. Return via the schema.`

let dims

if (lite) {
  phase('Grade')
  const litePrompt = `You are the sole reviewer for a lite plan review (small, all-mechanical-tier plan). Grade ALL SIX dimensions below against the rubric.

Read the rubric (${rubricPath}) and the plan (${planPath}).

Dimensions: ${DIMENSIONS.map(d => `${d.key} — ${d.label}`).join('; ')}.

Rules (from the rubric):
- Score each dimension 0-100 anchored to the bands. The bands run in both directions: a section that meets a band's description earns that band's score, and when you are genuinely torn between two bands take the lower one. Do not withhold a score the plan has earned, and do not deduct for anything you cannot quote.
- Every violation must quote the offending plan line(s) verbatim (or name the absent task/section) and cite the checklist item.
- For each violation, propose a concrete fix and classify it: "mechanical" or "owner-decision" (see rubric).
- Grade every dimension independently — do not let one low score bleed into another.

Return one entry per dimension via the schema. This is round ${round} of review (lite mode — no skeptic escalation).`
  const lg = await agent(litePrompt, { label: 'grade:lite', phase: 'Grade', schema: LITE_SCHEMA, model: 'sonnet' })
  if (!lg || lg.dimensions.length < DIMENSIONS.length) {
    log(`WARNING: lite reviewer returned ${lg ? lg.dimensions.length : 0}/${DIMENSIONS.length} dimensions — treat as BLOCKED`)
  }
  dims = DIMENSIONS.map(d => {
    const g = (lg?.dimensions || []).find(x => x.key === d.key)
    return {
      key: d.key,
      label: d.label,
      weight: d.weight,
      graderScore: g ? g.score : 0,
      skepticMisses: 0,
      finalScore: g ? g.score : 0,
      violations: g ? g.violations : [],
      summary: g ? g.summary : 'No grade returned by lite reviewer.',
    }
  })
} else {
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
  dims = DIMENSIONS.map(d => byKey.get(d.key)).filter(Boolean)
}

const totalWeight = dims.reduce((a, x) => a + x.weight, 0)
const overall = dims.length ? Math.round(dims.reduce((a, x) => a + x.finalScore * x.weight, 0) / totalWeight * 10) / 10 : 0
const floorBreaches = dims.filter(x => x.finalScore < 80).map(x => `${x.label}: ${x.finalScore}`)
const councilComplete = dims.length === DIMENSIONS.length
const blockingViolations = dims.flatMap(x => x.violations.filter(v => v.severity === 'blocking').map(v => ({ dimension: x.label, ...v })))
const pass = councilComplete && overall >= 85 && floorBreaches.length === 0 && blockingViolations.length === 0

const blockingFixes = dims.flatMap(x => x.violations.filter(v => v.severity === 'blocking' && v.fixKind === 'mechanical').map(v => ({ dimension: x.label, ...v })))
const ownerQuestions = dims.flatMap(x => x.violations.filter(v => v.fixKind === 'owner-decision').map(v => ({ dimension: x.label, ...v })))
const recommendedFixes = dims.flatMap(x => x.violations.filter(v => v.severity === 'minor' && v.fixKind === 'mechanical').map(v => ({ dimension: x.label, ...v })))

log(`Round ${round}: overall ${overall}/100, verdict ${pass ? 'PASS' : 'BLOCKED'}${floorBreaches.length ? ' (floor breaches: ' + floorBreaches.join('; ') + ')' : ''}${blockingViolations.length ? ` (${blockingViolations.length} blocking violation(s) outstanding)` : ''}`)

return {
  round,
  mode: lite ? 'lite' : 'council',
  overall,
  gate: { threshold: 85, floor: 80, floorBreaches, blockingViolationCount: blockingViolations.length, councilComplete },
  verdict: pass ? 'PASS' : 'BLOCKED',
  dimensions: dims,
  blockingFixes,
  recommendedFixes,
  ownerQuestions,
}
