# RED baseline — prd-review (no skill)

Date: 2026-07-24. Fresh general-purpose subagents (model: sonnet), one per scenario,
skill absent. Open-ended realistic scenarios against the planted-flaw fixture
`fixtures/flawed-widget-prd.md` (contradiction, 8/9 Must + no out-of-scope, untestable
requirements, unvalidated story-bearing persona, 12 unsourced metrics, TBD owner).

## Headline — flaws get caught; the GATE does not exist

All three baselines spotted most planted flaws and none rubber-stamped outright (the
fixture is loud; credit recorded honestly). The failures are structural, and identical
across runs:

1. **Verdict by vibe, not rubric.** No scores, no bar, no evidence discipline —
   severity triage is one reviewer's unverified judgment. Scenario 2 demoted the
   12-unsourced-metrics mess to "Not blocking, but will bite later" and the unvalidated
   load-bearing persona to "Fine to proceed on a reasonable bet." Nothing makes round 2
   comparable to round 1, and nothing checks the reviewer.
2. **Proceed-workarounds against a failing doc.** Every run invented a way to keep
   moving without the PRD passing anything: scenario 1 — "don't cancel kickoff, just
   narrow it — walk in tomorrow scoped to items 1–2"; scenario 2 — "fixable in under an
   hour ... that gets you to Monday with a real spec"; scenario 3 — "early build work on
   the Must items ... can run in parallel" with open decisions outstanding.
3. **Fixer = approver, no re-review.** Scenario 3 refused the immediate stamp (credit:
   "NOT approved / NOT passing") but closed with "fold your decisions on those two
   points straight into the doc and then call it approved" — self-certification after
   edits, with no independent re-review contemplated. Scenario 2 likewise: "happy to
   mark this up directly if you want to move now."
4. **Single reviewer, no council, no verification** in all three runs — nobody hunts
   what the reviewer missed, and a subtler PRD than this fixture would sail through on
   generosity with no floor to catch it.

## What the skill must fix

- Convene the 6-dimension council (bundled workflow) — never review solo.
- Scores anchored to the rubric bands with quoted evidence; skeptics on high scores.
- Hard gate: overall ≥95 AND every dimension ≥80, else BLOCKED — and BLOCKED means no
  design, no partial build, no parallel eng start, no deadline exception.
- Separation of powers: the fixer applies mechanical fixes and escalates owner
  decisions but NEVER changes the verdict; only a fresh council round can.

---

# 2026-09-01 recalibration

Fresh general-purpose subagents, **model: sonnet**, **date: 2026-09-01**, one per
scenario, run against the **pre-change** artifacts (a byte copy of
`references/rubric.md` and `SKILL.md` taken before the edits; sibling agents were
working this branch in parallel, so an in-place snapshot was the only way to hold the
pre-change state). Fixture: `fixtures/ambiguous-prd.md` — a PRD whose D1 evidence is an
internal deck the grader cannot open ("the Q3 customer research deck (shared internally
by the research team)") and whose acceptance criteria are reader-dependent ("email
notifications stop arriving promptly", "the layout is usable and nothing important is
cut off").

## Scenario 4 — grader has no basis to grade D1 (change: per-dimension `unknown` escape)

Baseline verdict: **FAIL — invented a number over an absent basis.** The grader could
not open the cited evidence, and graded anyway. Verbatim result:

```json
{
  "dimension": "D1",
  "score": 78,
  "band": "70-84",
  "violations": [
    {
      "quote": "Support has flagged this repeatedly.",
      "checklistItem": "Problem states who hurts, how, with evidence (tickets, interviews, data) — not \"customers have been asking\".",
      "severity": "moderate",
      "fix": "Replace the vague, unquantified claim with concrete evidence: a ticket count/date range, or a specific quoted finding from the Q3 research deck (e.g., \"X% of surveyed users cited notification overload, per Q3 deck slide N\"). As written, \"flagged this repeatedly\" is an assertion, not evidence, and is functionally the same pattern the checklist explicitly bars (\"customers have been asking\").",
      "fixKind": "owner-decision"
    },
    {
      "quote": "Users cannot control which notifications they receive.",
      "checklistItem": "Every user group marked validated/unvalidated honestly; no story-bearing personas that are unvalidated.",
      "severity": "moderate",
      "fix": "Name the specific affected user segment (e.g., \"signed-in users receiving ≥X notifications/week\") and state explicitly whether that population is validated or unvalidated, backed by the cited research deck. Stories S1 and S2 build acceptance criteria on a \"signed-in user\" persona that Section 1 never introduces or validates, so the problem section leaves that persona's validation status undefined.",
      "fixKind": "owner-decision"
    }
  ],
  "excellenceEvidence": [],
  "summary": "The problem section names real evidence sources (Q3 research deck, support themes) rather than inventing a solution or citing bare hearsay, and correctly avoids any solution/tech-stack language. But it falls short of the checklist on two counts: the support-side evidence is asserted (\"flagged this repeatedly\") without any quantification or citation of a specific ticket/count, and the affected user group is left as an undifferentiated \"Users\" with no validated/unvalidated status — even though Stories S1/S2 later build acceptance criteria on a \"signed-in user\" persona that Section 1 never establishes or validates. These are two real, repeated gaps a builder would have to guess at (which users, how confident the evidence is), placing this below the 85+ minor-violation band; being torn between 85-94 and 70-84, the lower band applies."
}
```

Failure detail: the grader credits the PRD for "nam[ing] real evidence sources (Q3
research deck…)" it never read, and lands on 78 — a number that enters the weighted
total and the ≥80 floor as if the evidence had been checked. Both fixes it proposes are
`owner-decision`, i.e. the grader already knows only the owner can close this; the
missing piece was a way to say so without a score. It also emitted `"severity":
"moderate"`, which is not in the schema enum — the same improvisation the plan-review
baseline showed.

## Scenario 6 — D6 grader on split-verdict criteria (change: verdict reproducibility)

Baseline verdict: **PARTIAL FAIL — one ambiguity found by another route, the
reproducibility test never applied.** The grader caught the R3/S1 "promptly" tension as
a *cross-section semantics* problem, but never applied a two-readers test, and left S2's
criterion ("Then the layout is usable and nothing important is cut off") unremarked.
Verbatim result:

```json
{
  "dimension": "D6",
  "dimensionName": "Consistency & ambiguity",
  "score": 82,
  "band": "70-84",
  "violations": [
    {
      "quote": "R3: Preference changes take effect for subsequently sent notifications. ... S1 Given/When/Then: \"Given I am on the settings screen, When I toggle \\\"Email notifications\\\" off, Then email notifications stop arriving promptly.\"",
      "checklistItem": "D6 item 3 — \"No sentence a reasonable reader could take two ways on a decision that matters\" (compounded by item 1, cross-section contradiction between Requirements and Stories)",
      "severity": "major",
      "fix": "State explicitly whether a toggle-off cancels notifications already queued/in-flight at the moment of the change, or only prevents notifications not yet triggered. Reword R3 to something like: \"Preference changes apply to notifications triggered after the toggle event; notifications already queued or in transmission at the time of the toggle are not retracted.\" Then align S1's Then clause to the same semantics (e.g., \"Then no further email notifications are triggered after this change; a notification already in flight at toggle time may still be delivered\") instead of the unqualified \"stop arriving promptly,\" which a reader could take to mean immediate cancellation of in-flight sends.",
      "fixKind": "owner-decision"
    }
  ],
  "excellenceEvidence": [],
  "summary": "The PRD is largely internally consistent — Goals, Scope, and Requirements line up (per-channel Musts match G1, the Won't list doesn't collide with any Must/Should item), Owner is a named individual rather than a placeholder (\"Owner: Priya R. (PM)\"), and Open Questions/Owner/other builder-dependent fields carry no literal TBD markers. The one real D6 fault is a genuine two-reading ambiguity on a decision that matters: R3 (\"Preference changes take effect for subsequently sent notifications\") and S1's acceptance criterion (\"Then email notifications stop arriving promptly\") can be read as either (a) only future-triggered notifications are suppressed while anything already queued still arrives, or (b) toggling off immediately halts anything in flight — and a builder has no way to tell which is intended, which affects whether cancellation/retraction logic needs to be built at all. That's not cosmetic vagueness (it would mislead a builder into guessing the actual system behavior), so it caps the score below the 85-94 band; with only this single instance rather than a pattern of repeated cross-section conflicts, it sits at the higher end of the 70-84 band rather than lower."
}
```

Failure detail: "with only this single instance rather than a pattern" is the tell — the
grader treated ambiguity as a scarce, section-level event rather than a per-criterion
test, so S2's Then survived the pass. (`"severity": "major"` is again outside the schema
enum.)

## Scenario 5 — round 2 moved 0.2 points with the same violation back (change: circuit breaker)

Baseline verdict: **FAIL — queued another council round.** Given 93.4 → 93.6 and the
identical D3 checklist item cited both rounds (round 1: the Then is "not observable to a
tester"; round 2: "prorated amount" is not observable because the formula is not
stated), the baseline escalated the owner question correctly but committed to round 3 as
the next step. No sampling of council outputs, no naming of the rubric/prompt ambiguity,
no rubric fix proposal. Verbatim reply (excerpted at full length):

> Actual next action taken (per the skill's fix-round step, section 3 of "The Loop"): I
> did **not** invent a proration formula and paste it into S4 (and the two sibling
> stories) myself. […] The round-2 grader's objection — "prorated amount" isn't
> observable because the formula isn't stated — is a business-logic gap, not a wording
> gap, so it's an owner question, not a mechanical fix. I posted it to the PRD owner on
> Slack and am now waiting […]
>
> Once I have the real numbers/rule I'll write them into the story text as confirmed fact
> […] and re-run the review. Flagging that this is the last of our 3 allowed review
> rounds before the PRD has to go back through writing-prds for a fuller rework […]
>
> I'm holding here — no PRD edit, no round-3 council run, no self-graded verdict — until
> the owner replies with the real proration logic. Once that answer lands, I'll write it
> into S4 and the two sibling stories as stated fact (not invented), then re-convene the
> council for round 3 with `priorDimensions` carried forward from round 2, since only D3
> failed.

Credit where due: the owner question was escalated, not answered, and no verdict was
self-issued — existing skill behavior held. The failure is the same as plan-review's:
the plan is "re-convene the council for round 3", and the round-over-round shift in what
the *same* checklist item was taken to mean ("not observable to a tester" →
"the formula is not stated") is treated as a normal finding rather than as evidence that
the checklist item, not the PRD, is what is unstable.
