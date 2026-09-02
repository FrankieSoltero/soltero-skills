export const meta = {
  name: 'plan-review-council',
  description: 'Grade an implementation plan with a 6-dimension council: band-anchored graders (sonnet, escalating to opus only on contested high scores), deterministic weighted gate (>=85 overall AND >=80 per dimension AND zero blocking violations AND no dimension returned ungradable). Flags non-convergence between rounds. A lite single-reviewer mode is available for small all-mechanical plans.',
  phases: [
    { title: 'Grade', detail: 'one rubric-anchored grader per dimension (sonnet), evidence-quoted scores' },
    { title: 'Skeptic', detail: 'adversarial miss-hunt (opus) on every score >= 90' },
    { title: 'Regrade', detail: 're-grade contested dimensions (opus); take min(grade, regrade)' },
  ],
}

// args: { planPath, rubricPath, date, round, priorDimensions, priorOverall, mode }
// priorDimensions: the `dimensions` array returned by the previous round's run — when
// present, only dimensions that failed (score < 80, a blocking violation, or an unknown
// verdict) are re-graded;
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
// priorOverall: the previous round's `overall`. Feeds the non-convergence circuit breaker below;
// without it a stalled loop is invisible to the script and only the caller's memory catches it.
const priorOverall = typeof opts.priorOverall === 'number' ? opts.priorOverall : null
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
    // score is null exactly when verdict is 'unknown': the plan gave this dimension no basis to
    // grade at all. A number invented over an absent basis is a guess wearing a score's clothes —
    // it moves the weighted total and the floor check as if it were evidence. Unknown routes to the
    // owner instead: it is neither a floor breach nor a pass (see the gate below).
    score: { type: ['integer', 'null'], minimum: 0, maximum: 100 },
    verdict: { type: 'string', enum: ['graded', 'unknown'] },
    unknownReason: { type: 'string' },
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
  required: ['score', 'verdict', 'band', 'violations', 'excellenceEvidence', 'summary'],
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
          score: { type: ['integer', 'null'], minimum: 0, maximum: 100 },
          verdict: { type: 'string', enum: ['graded', 'unknown'] },
          unknownReason: { type: 'string' },
          violations: GRADE_SCHEMA.properties.violations,
          summary: { type: 'string' },
        },
        required: ['key', 'score', 'verdict', 'violations', 'summary'],
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
- Escape hatch, for absent basis only: if the plan gives you nothing to check this dimension against — the material your checklist tests is neither in the plan nor in anything the plan makes readable to you (it defers to a spec, deck, or ticket you cannot open) — return score null, verdict "unknown", and a one-sentence unknownReason naming exactly what you would need. Unknown is routed to the plan owner; it is not a low score and not a pass. A plan you CAN check and find weak is graded, not unknown — take the low band it earns. Otherwise return verdict "graded".

Return via the structured output schema. This is round ${round} of review.`

const skepticPrompt = (d, g) => `You are the independent verifier on an implementation-plan review council. A grader scored dimension "${d.label}" at ${g.score}/100. Scores in this band get a second pass because a generous grade and a genuinely excellent plan read the same way from one pass; your job is to tell those two apart by re-checking the checklist yourself.

Read the rubric (${rubricPath}) — dimension ${d.label}'s checklist — and the plan (${planPath}). Check every checklist item explicitly against the plan. The grader already found these violations (do NOT re-report them): ${JSON.stringify(g.violations.map(v => v.checklistItem + ': ' + v.quote.slice(0, 80)))}

Report a missed violation only when you can name the checklist item it breaks and quote the plan line that breaks it, copied verbatim from the file you read in this session — not paraphrased, not inferred from what the plan omits unless the checklist item is about an omission, and never a stylistic preference. Where a checklist item is satisfied, or the evidence is ambiguous, that item yields nothing.

Both outcomes are correct results. An empty missedViolations array is the right answer when the grade was earned; say so in reasoning, naming the items you checked.`

const regradePrompt = (d, g, s) => `You are a fresh re-grader on an implementation-plan review council for dimension "${d.label}". A prior grader scored it ${g.score}/100, but a skeptic then confirmed these MISSED violations:
${JSON.stringify(s.missedViolations, null, 2)}

Read the rubric (${rubricPath}) and the plan (${planPath}). Re-grade the dimension from scratch with the full violation set (grader's + skeptic's) in view. Same rules: band-anchored, lower band when torn, quotes for every violation, excellenceEvidence required for >= 90. Return via the schema.`

let dims
// Which dimensions this round actually re-graded — the recurrence check below only means anything
// for those (a carried-forward dimension repeats its prior violations by construction).
let regradedKeys = new Set(DIMENSIONS.map(d => d.key))

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
- Escape hatch, for absent basis only: a dimension the plan gives you nothing to check against (the material is neither in the plan nor readable from it) gets score null, verdict "unknown", and a one-sentence unknownReason naming what you would need. Unknown routes to the plan owner — it is not a low score and not a pass. Every dimension you can check gets verdict "graded" and the band it earns.

Return one entry per dimension via the schema. This is round ${round} of review (lite mode — no skeptic escalation).`
  const lg = await agent(litePrompt, { label: 'grade:lite', phase: 'Grade', schema: LITE_SCHEMA, model: 'sonnet' })
  if (!lg || lg.dimensions.length < DIMENSIONS.length) {
    log(`WARNING: lite reviewer returned ${lg ? lg.dimensions.length : 0}/${DIMENSIONS.length} dimensions — treat as BLOCKED`)
  }
  dims = DIMENSIONS.map(d => {
    const g = (lg?.dimensions || []).find(x => x.key === d.key)
    const unknown = !!g && (g.verdict === 'unknown' || g.score === null)
    return {
      key: d.key,
      label: d.label,
      weight: d.weight,
      graderScore: g ? (unknown ? null : g.score) : 0,
      skepticMisses: 0,
      finalScore: g ? (unknown ? null : g.score) : 0,
      violations: g ? g.violations : [],
      unknownReason: unknown ? (g.unknownReason || g.summary) : null,
      summary: g ? g.summary : 'No grade returned by lite reviewer.',
    }
  })
} else {
  const failedKeys = priorDimensions
    ? new Set(priorDimensions.filter(x => x.finalScore === null || x.finalScore === undefined || x.finalScore < 80 || x.violations.some(v => v.severity === 'blocking')).map(x => x.key))
    : null
  const toGrade = failedKeys ? DIMENSIONS.filter(d => failedKeys.has(d.key)) : DIMENSIONS
  const carried = failedKeys ? priorDimensions.filter(x => !failedKeys.has(x.key)) : []
  regradedKeys = new Set(toGrade.map(d => d.key))
  if (failedKeys) {
    log(`Round ${round}: re-grading ${toGrade.length}/${DIMENSIONS.length} dimension(s) that failed round ${round - 1} (${toGrade.map(d => d.key).join(', ') || 'none'}); ${carried.length} carried forward unchanged`)
  }

  phase('Grade')
  const results = toGrade.length ? await pipeline(
    toGrade,
    d => agent(gradePrompt(d), { label: `grade:${d.key}`, phase: 'Grade', schema: GRADE_SCHEMA, model: 'sonnet' }),
    async (g, d) => {
      if (!g) return null
      // An unknown verdict has no number to contest, so no skeptic and no re-grade fire on it.
      if (g.verdict === 'unknown' || g.score === null) return { d, g, skeptic: null, regrade: null }
      if (g.score < 90) return { d, g, skeptic: null, regrade: null }
      // No effort override: the skeptic has to read the rubric and the plan and quote them, and at low
      // effort Fable-era models retrieve less and answer from memory more — exactly the wrong trade here.
    const s = await agent(skepticPrompt(d, g), { label: `skeptic:${d.key}`, phase: 'Skeptic', schema: SKEPTIC_SCHEMA, model: 'opus' })
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
    const unknown = g.verdict === 'unknown' || g.score === null
    const final = unknown ? null : (regrade ? Math.min(g.score, regrade.score) : g.score)
    const violations = [
      ...g.violations,
      ...(regrade ? regrade.violations.filter(rv => !g.violations.some(gv => gv.quote === rv.quote)) : []),
    ]
    return {
      key: d.key,
      label: d.label,
      weight: d.weight,
      graderScore: unknown ? null : g.score,
      skepticMisses: skeptic ? skeptic.missedViolations.length : 0,
      finalScore: final,
      violations,
      unknownReason: unknown ? (g.unknownReason || g.summary) : null,
      summary: g.summary,
    }
  })

  const byKey = new Map([...carried, ...fresh].map(x => [x.key, x]))
  dims = DIMENSIONS.map(d => byKey.get(d.key)).filter(Boolean)
}

// Unknown dimensions are excluded from the weighted average and from the floor check — they are
// not a score, so averaging them in either direction would be inventing one — and they block PASS
// until the owner supplies the missing basis.
const gradedDims = dims.filter(x => x.finalScore !== null && x.finalScore !== undefined)
const unknownDimensions = dims
  .filter(x => x.finalScore === null || x.finalScore === undefined)
  .map(x => ({ dimension: x.label, key: x.key, reason: x.unknownReason || x.summary }))
const totalWeight = gradedDims.reduce((a, x) => a + x.weight, 0)
const overall = gradedDims.length && totalWeight ? Math.round(gradedDims.reduce((a, x) => a + x.finalScore * x.weight, 0) / totalWeight * 10) / 10 : 0
const floorBreaches = gradedDims.filter(x => x.finalScore < 80).map(x => `${x.label}: ${x.finalScore}`)
const councilComplete = dims.length === DIMENSIONS.length
const blockingViolations = dims.flatMap(x => x.violations.filter(v => v.severity === 'blocking').map(v => ({ dimension: x.label, ...v })))
const pass = councilComplete && unknownDimensions.length === 0 && overall >= 85 && floorBreaches.length === 0 && blockingViolations.length === 0

const blockingFixes = dims.flatMap(x => x.violations.filter(v => v.severity === 'blocking' && v.fixKind === 'mechanical').map(v => ({ dimension: x.label, ...v })))
const ownerQuestions = [
  ...dims.flatMap(x => x.violations.filter(v => v.fixKind === 'owner-decision').map(v => ({ dimension: x.label, ...v }))),
  // An ungradable dimension is an owner question by definition: only the owner can supply the
  // basis the grader lacked.
  ...unknownDimensions.map(u => ({ dimension: u.dimension, kind: 'ungradable-dimension', checklistItem: 'dimension could not be graded', quote: '', severity: 'blocking', fix: `Supply what this dimension needs before the next round: ${u.reason}`, fixKind: 'owner-decision' })),
]
const recommendedFixes = dims.flatMap(x => x.violations.filter(v => v.severity === 'minor' && v.fixKind === 'mechanical').map(v => ({ dimension: x.label, ...v })))

// Non-convergence circuit breaker. A round that moves the overall less than STALL_DELTA points, or
// that brings back a violation the previous round already reported in a dimension actually
// re-graded, means the churn is coming from the reviewer prompt or the rubric wording, not from the
// plan: another round costs 6-18 model calls to reproduce the same disagreement. (Playbook, Proven:
// detect repair-loop dead-ends by recurrence and switch strategy instead of iterating a stuck
// trajectory; Promising: bound retries on recognizable failure loops rather than on a step budget.)
// The script only detects it — SKILL.md step 5 carries the routing.
const STALL_DELTA = 2
const normViolation = v => `${(v.checklistItem || '').trim().toLowerCase()} :: ${(v.quote || '').replace(/\s+/g, ' ').trim().toLowerCase()}`
const priorByKey = new Map((priorDimensions || []).map(x => [x.key, x]))
const recurringViolations = priorDimensions
  ? dims.filter(x => regradedKeys.has(x.key)).flatMap(x => {
    const prior = new Set(((priorByKey.get(x.key) || {}).violations || []).map(normViolation))
    return x.violations.filter(v => prior.has(normViolation(v))).map(v => ({ dimension: x.label, checklistItem: v.checklistItem, quote: v.quote }))
  })
  : []
const overallDelta = priorOverall === null ? null : Math.round(Math.abs(overall - priorOverall) * 10) / 10
const stalled = !pass && ((overallDelta !== null && overallDelta < STALL_DELTA) || recurringViolations.length > 0)
const nonConvergence = stalled
  ? {
    stalled: true,
    priorOverall,
    overallDelta,
    recurringViolations,
    action: 'Stop the fix -> re-review loop; do NOT convene another round. Sample this round\'s and the prior round\'s grader summaries (and any skeptic reasoning) for the recurring item, name the reviewer-prompt or rubric ambiguity that let two graders read the same checklist item two ways, and route that to the owner as a rubric/prompt fix proposal quoting both rounds. The plan itself goes back to soltero-skills:lean-plans.',
  }
  : null
if (stalled) {
  log(`Round ${round}: NON-CONVERGENCE — ${overallDelta !== null ? `overall moved ${overallDelta} point(s) from ${priorOverall}` : 'no prior overall supplied'}${recurringViolations.length ? `; ${recurringViolations.length} violation(s) recurred verbatim in a re-graded dimension` : ''}. Stop the loop and route the rubric/prompt ambiguity to the owner.`)
}

log(`Round ${round}: overall ${overall}/100, verdict ${pass ? 'PASS' : 'BLOCKED'}${floorBreaches.length ? ' (floor breaches: ' + floorBreaches.join('; ') + ')' : ''}${blockingViolations.length ? ` (${blockingViolations.length} blocking violation(s) outstanding)` : ''}${unknownDimensions.length ? ` (${unknownDimensions.length} dimension(s) ungradable — owner input needed)` : ''}`)

return {
  round,
  mode: lite ? 'lite' : 'council',
  overall,
  gate: { threshold: 85, floor: 80, floorBreaches, blockingViolationCount: blockingViolations.length, unknownDimensions: unknownDimensions.map(u => u.dimension), councilComplete },
  verdict: pass ? 'PASS' : 'BLOCKED',
  nonConvergence,
  unknownDimensions,
  dimensions: dims,
  blockingFixes,
  recommendedFixes,
  ownerQuestions,
}
