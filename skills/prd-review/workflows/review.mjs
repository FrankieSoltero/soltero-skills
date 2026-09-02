export const meta = {
  name: 'prd-review-council',
  description: 'Grade a PRD with a 6-dimension council: band-anchored graders (sonnet, escalating to opus only on contested high scores), deterministic weighted gate (>=95 overall AND >=80 per dimension AND zero blocking violations AND no dimension returned ungradable). Flags non-convergence between rounds',
  phases: [
    { title: 'Grade', detail: 'one rubric-anchored grader per dimension (sonnet), evidence-quoted scores' },
    { title: 'Skeptic', detail: 'adversarial miss-hunt (opus) on every score >= 90' },
    { title: 'Regrade', detail: 're-grade contested dimensions (opus); take min(grade, regrade)' },
  ],
}

// args: { prdPath, rubricPath, date, round, priorDimensions, priorOverall }
// priorDimensions: the `dimensions` array returned by the previous round's run — when
// present, only dimensions that failed (score < 80, a blocking violation, or an unknown
// verdict) are re-graded;
// the rest carry their prior-round result forward unchanged. Omit on round 1.
const opts = typeof args === 'string' ? JSON.parse(args) : (args || {})
const prdPath = opts.prdPath
const rubricPath = opts.rubricPath
const round = opts.round || 1
const priorDimensions = opts.priorDimensions || null
// priorOverall: the previous round's `overall`. Feeds the non-convergence circuit breaker below;
// without it a stalled loop is invisible to the script and only the caller's memory catches it.
const priorOverall = typeof opts.priorOverall === 'number' ? opts.priorOverall : null
if (!prdPath || !rubricPath) throw new Error('args.prdPath and args.rubricPath are required')

const MAX_ROUNDS = 3
if (round > MAX_ROUNDS) {
  throw new Error(`Round ${round} exceeds the ${MAX_ROUNDS}-round cap. A PRD still BLOCKED after ${MAX_ROUNDS} rounds goes back to soltero-skills:writing-prds; report what blocks and stop. Do not convene another council round.`)
}

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
    // score is null exactly when verdict is 'unknown': the PRD gave this dimension no basis to
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

Rules (from the rubric):
- Score 0-100 anchored to the bands. The bands run in both directions: a section that meets a band's description earns that band's score, and when you are genuinely torn between two bands take the lower one. Do not withhold a score the PRD has earned, and do not deduct for anything you cannot quote.
- Every violation must quote the offending PRD line(s) verbatim — copied from the file you read in this session, not recalled or paraphrased — or name the absent section, and cite the checklist item.
- A score >= 90 requires affirmative excellenceEvidence quotes; absence of noticed flaws is not evidence.
- For each violation, propose a concrete fix and classify it: "mechanical" (wording, structure, markers, adding a section — appliable without a product decision) or "owner-decision" (targets, scope calls, personas, retention — needs the PRD owner).
- Grade ONLY your dimension; ignore flaws that belong to other dimensions.
- Escape hatch, for absent basis only: if the PRD gives you nothing to check this dimension against — the material your checklist tests is neither in the PRD nor in anything the PRD makes readable to you (it defers to a deck, research doc, or ticket you cannot open) — return score null, verdict "unknown", and a one-sentence unknownReason naming exactly what you would need. Unknown is routed to the PRD owner; it is not a low score and not a pass. A PRD you CAN check and find weak is graded, not unknown — take the low band it earns. Otherwise return verdict "graded".

Return via the structured output schema. This is round ${round} of review.`

const skepticPrompt = (d, g) => `You are the independent verifier on a PRD review council. A grader scored dimension "${d.label}" at ${g.score}/100. Scores in this band get a second pass because a generous grade and a genuinely excellent section read the same way from one pass; your job is to tell those two apart by re-checking the checklist yourself.

Read the rubric (${rubricPath}) — dimension ${d.label}'s checklist — and the PRD (${prdPath}). Check every checklist item explicitly against the PRD. The grader already found these violations (do NOT re-report them): ${JSON.stringify(g.violations.map(v => v.checklistItem + ': ' + v.quote.slice(0, 80)))}

Report a missed violation only when you can name the checklist item it breaks and quote the PRD line that breaks it, copied verbatim from the file you read in this session — not paraphrased, not inferred, and never a stylistic preference. Where a checklist item is satisfied, or the evidence is ambiguous, that item yields nothing.

Both outcomes are correct results. An empty missedViolations array is the right answer when the grade was earned; say so in reasoning, naming the items you checked.`

const regradePrompt = (d, g, s) => `You are a fresh re-grader on a PRD review council for dimension "${d.label}". A prior grader scored it ${g.score}/100, but a skeptic then confirmed these MISSED violations:
${JSON.stringify(s.missedViolations, null, 2)}

Read the rubric (${rubricPath}) and the PRD (${prdPath}). Re-grade the dimension from scratch with the full violation set (grader's + skeptic's) in view. Same rules: band-anchored, lower band when torn, quotes for every violation, excellenceEvidence required for >= 90. Return via the schema.`

const failedKeys = priorDimensions
  ? new Set(priorDimensions.filter(x => x.finalScore === null || x.finalScore === undefined || x.finalScore < 80 || x.violations.some(v => v.severity === 'blocking')).map(x => x.key))
  : null
const toGrade = failedKeys ? DIMENSIONS.filter(d => failedKeys.has(d.key)) : DIMENSIONS
const carried = failedKeys ? priorDimensions.filter(x => !failedKeys.has(x.key)) : []
// Which dimensions this round actually re-graded — the recurrence check below only means anything
// for those (a carried-forward dimension repeats its prior violations by construction).
const regradedKeys = new Set(toGrade.map(d => d.key))
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
    // No effort override: the skeptic has to read the rubric and the PRD and quote them, and at low
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
const dims = DIMENSIONS.map(d => byKey.get(d.key)).filter(Boolean)

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
// Blocking-severity violations veto the verdict, exactly as in plan-review: a PRD can average
// >=95 while one dimension still carries a do-not-build flaw, and the re-grade selector above
// already treats such a dimension as failed — without this term it would be re-graded every
// round without the verdict ever reflecting it.
const blockingViolations = dims.flatMap(x => x.violations.filter(v => v.severity === 'blocking').map(v => ({ dimension: x.label, ...v })))
const pass = councilComplete && unknownDimensions.length === 0 && overall >= 95 && floorBreaches.length === 0 && blockingViolations.length === 0

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
// PRD: another round costs 6-18 model calls to reproduce the same disagreement. (Playbook, Proven:
// detect repair-loop dead-ends by recurrence and switch strategy instead of iterating a stuck
// trajectory; Promising: bound retries on recognizable failure loops rather than on a step budget.)
// The script only detects it — SKILL.md step 4 carries the routing.
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
    action: 'Stop the fix -> re-review loop; do NOT convene another round. Sample this round\'s and the prior round\'s grader summaries (and any skeptic reasoning) for the recurring item, name the reviewer-prompt or rubric ambiguity that let two graders read the same checklist item two ways, and route that to the owner as a rubric/prompt fix proposal quoting both rounds. The PRD itself goes back to soltero-skills:writing-prds.',
  }
  : null
if (stalled) {
  log(`Round ${round}: NON-CONVERGENCE — ${overallDelta !== null ? `overall moved ${overallDelta} point(s) from ${priorOverall}` : 'no prior overall supplied'}${recurringViolations.length ? `; ${recurringViolations.length} violation(s) recurred verbatim in a re-graded dimension` : ''}. Stop the loop and route the rubric/prompt ambiguity to the owner.`)
}

log(`Round ${round}: overall ${overall}/100, verdict ${pass ? 'PASS' : 'BLOCKED'}${floorBreaches.length ? ' (floor breaches: ' + floorBreaches.join('; ') + ')' : ''}${blockingViolations.length ? ` (${blockingViolations.length} blocking violation(s) outstanding)` : ''}${unknownDimensions.length ? ` (${unknownDimensions.length} dimension(s) ungradable — owner input needed)` : ''}`)

return {
  round,
  overall,
  gate: { threshold: 95, floor: 80, floorBreaches, blockingViolationCount: blockingViolations.length, unknownDimensions: unknownDimensions.map(u => u.dimension), councilComplete },
  verdict: pass ? 'PASS' : 'BLOCKED',
  nonConvergence,
  unknownDimensions,
  dimensions: dims,
  blockingFixes,
  recommendedFixes,
  ownerQuestions,
}
