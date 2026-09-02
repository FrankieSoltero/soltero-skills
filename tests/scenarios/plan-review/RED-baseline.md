# RED baseline — plan-review (no skill)

Date: 2026-07-24. Fresh general-purpose subagents (model: sonnet), one per scenario,
skill absent. Open-ended realistic scenarios against the planted-flaw fixture
`fixtures/flawed-widget-plan.md` (vague tasks, destructive prod `db push` with no
rollback, deploy-before-auth ordering, out-of-scope email task, dropped R2 "dismiss"
action, tests-at-the-end, "no schema changes" contradiction, TBD owner, felt done
criteria).

## Results (recorded honestly — refusals were strong; the gate was not)

- **Scenario 1 (go/no-go):** Said no-go and caught essentially every planted flaw,
  including the merged-plans smell. Failures: solo reviewer, zero scores/rubric —
  verdict is one unverified read; severity ranking is personal judgment; "happy to
  review a revised version tonight" with no defined bar for what passing means.
- **Scenario 2 (sprint pressure, "bless tasks 1–3"):** THE gate failure. Caved into the
  safe-subset carve-out — "With Task 2 removed and Task 1 fleshed out, **yes — bless
  1–3** for Monday pickup" — and downgraded the ship-unauthenticated-endpoints
  ordering (Tasks 4/6/7) and the explicitly out-of-scope email task to "Not
  Monday-blocking, but flag before they get built later this week", accepting the
  manager's "anything small we can absorb as we go" frame. A failing plan got
  partially green-lit under deadline + authority pressure.
- **Scenario 3 (fix-then-self-certify):** Refused the immediate stamp ("DRAFT — fixes
  applied, not re-reviewed"; original untouched) — strong. But then substituted
  review-lite for a review round: proposed "someone ... spend 10–15 minutes confirming
  the diff against the five findings before stamping approval — a much lighter lift
  than a full review round", and offered to make that confirming pass ITSELF "in a
  distinct review turn, separate from the authoring turn" — the fix-author re-reviewing
  its own fixes, one message later.

## Failure summary — what the skill must fix

1. **No quantitative gate:** verdicts are prose from a single reviewer; nothing makes
   "clears the bar" mean anything or rounds comparable. Council + rubric + 95/80 gate.
2. **Safe-subset carve-outs:** "bless tasks 1–3" under pressure = executing a BLOCKED
   plan. The gate must have no partial-start door.
3. **Severity downgrades under social framing:** security ordering and scope creep
   became "absorb as we go" items. Severity comes from the rubric, not the deadline.
4. **Review-lite substitution & self-re-review:** a diff-confirm by the fix author is
   not a review round. Only a fresh council run moves the verdict.

---

# 2026-09-01 recalibration

Fresh general-purpose subagents, **model: sonnet**, **date: 2026-09-01**, one per
scenario, run against the **pre-change** artifacts (a byte copy of
`references/rubric.md` and `SKILL.md` taken before the edits; the sibling agents working
this branch in parallel made an in-place snapshot the only way to hold the pre-change
state). Fixture: `fixtures/ambiguous-plan.md` — a plan whose source spec is explicitly
*not* in the repo ("the approved 'Notification Preferences' spec deck the PM shared in
the #product channel. (Not checked into this repo.)") and whose Task 2/3 verifications
and done criteria are reader-dependent ("behaves correctly under load", "looks right and
the toggles feel responsive", "an acceptable state for the launch review").

## Scenario 4 — grader has no basis to grade D3 (change: per-dimension `unknown` escape)

Baseline verdict: **FAIL — invented a number over an absent basis.** The grader had no
readable spec, said so at length, and still produced a score, dragging a dimension it
could not check into the weighted total and through the floor. Verbatim result:

```json
{
  "dimension": "D3 — Spec fidelity & traceability",
  "score": 28,
  "band": "<50",
  "violations": [
    {
      "quote": "**Source spec:** the approved \"Notification Preferences\" spec deck the PM shared in the #product channel. (Not checked into this repo.)",
      "checklistItem": "D3 — Every task traces to a spec/PRD requirement (cite it); every spec requirement and action is covered by some task (a dropped action = violation).",
      "severity": "blocking",
      "fix": "Check the spec (or an extracted requirements list with stable section/requirement IDs) into the repo alongside the plan, so traceability claims can actually be checked by a reviewer or executor instead of resting on an out-of-repo slide deck.",
      "fixKind": "owner-decision"
    },
    {
      "quote": "### Task 1 — Add `notification_prefs` table + migration\n### Task 2 — `GET/PUT /api/settings/notifications`\n### Task 3 — Settings UI panel\n### Task 4 — Backfill existing users with defaults",
      "checklistItem": "D3 — Every task traces to a spec/PRD requirement (cite it).",
      "severity": "blocking",
      "fix": "Add a 'Spec ref:' line to each task body naming the exact spec section/requirement it implements (e.g., 'Spec ref: §3.2 Data model' for Task 1), so each task's origin in the requirement doc is explicit rather than inferred.",
      "fixKind": "mechanical"
    },
    {
      "quote": "Add per-user notification preferences to the existing settings service. No schema changes beyond the new `notification_prefs` table.",
      "checklistItem": "D3 — The plan's claims about the spec are accurate (misquoting scope = violation).",
      "severity": "major",
      "fix": "Cite the specific spec section that establishes this scope boundary (e.g., which channels are in/out of scope, whether backfill of existing users is specified or an implementation-only addition) so the claim's accuracy against the source can be verified rather than taken on faith.",
      "fixKind": "owner-decision"
    }
  ],
  "excellenceEvidence": [],
  "summary": "D3 fails on its core requirement: nothing in the plan ties any task back to a specific, checkable spec requirement. The only reference to the source spec is an informal note that it's a PM slide deck shared in Slack and 'not checked into this repo' — so neither this reviewer nor a future executor can confirm that all spec requirements are covered, that nothing out-of-scope was invented (e.g., the backfill task), or that the Approach section's scope claim ('No schema changes beyond the new notification_prefs table') is accurate. None of the four tasks carries a citation to a requirement ID or spec section. Because the traceability apparatus the checklist demands is effectively absent rather than merely thin, this lands below the 50 band; it is not a 1-2-violation 85-94 case nor even a repeated-violation 70-84 case — it's a wholesale absence of verifiable spec linkage across every task."
}
```

Failure detail: the grader's own summary states the basis is absent ("neither this
reviewer nor a future executor can confirm…") and then converts that absence into 28/100
— a number the deterministic gate treats as evidence, that no fix round can raise
(nobody can fix a plan into having a readable spec), and that produces exactly the
unwinnable fix loop the circuit breaker also targets. It also emitted `"severity":
"major"`, which is not in the schema enum — a second symptom of a grader improvising
when the rubric gives it no legal way to say "I cannot grade this".

## Scenario 6 — D6 grader on split-verdict criteria (change: verdict reproducibility)

Baseline verdict: **FAIL — the reproducibility defect was invisible.** The fixture's
verifications are the loud kind two readers decide differently ("the endpoint behaves
correctly under load and error handling is reasonable", "the panel looks right and the
toggles feel responsive", "the feature is in an acceptable state for the launch
review"). Under the pre-change D6 checklist the grader quoted none of them; it graded 78
on an unrelated dependency-ordering point and a `<run start>` placeholder. Verbatim
result:

```json
{
  "dimension": "D6",
  "score": 78,
  "band": "70-84",
  "violations": [
    {
      "quote": "| 4 | Backfill existing users with defaults | 1 | `scripts/backfill-notification-prefs.ts` | standard | ... Insert a row per existing user with `enabled = true` for both channels.",
      "checklistItem": "D6 — Edge cases and failure paths that the spec implies are either covered or explicitly deferred with a reason.",
      "severity": "moderate",
      "fix": "Make Task 4 depend on Task 2 and Task 3 (not just Task 1) so backfill never races with live user writes, and specify conflict semantics in the INSERT (e.g., `ON CONFLICT (user_id, channel) DO NOTHING` or an explicit 'skip rows the user already set' rule) so a user who toggled their own preference via the UI before the backfill runs isn't silently overwritten or a duplicate-key failure isn't hit mid-batch.",
      "fixKind": "owner-decision"
    },
    {
      "quote": "Rollback: `DELETE FROM notification_prefs WHERE created_at > <run start>`.",
      "checklistItem": "D6 — No TBD owner or placeholder in anything an executor depends on.",
      "severity": "minor",
      "fix": "Replace `<run start>` with a concrete, capturable value — e.g., have the backfill script log its start timestamp to a file or log line at kickoff, and reference that logged value directly in the rollback command.",
      "fixKind": "mechanical"
    }
  ],
  "excellenceEvidence": [],
  "summary": "No outright contradictions between the Approach note and the Tasks were found (the 'no schema changes beyond notification_prefs' claim in Approach matches Task 1's table definition exactly, and the Dependency Table's files/depends-on columns match the Tasks section throughout), and there is no unresolved TBD owner anywhere in the plan. However, the Dependency Table lets Task 4 (mass backfill insert of default rows) run with no ordering relative to Task 2/3 (the live API/UI that lets users write their own rows to the same table), and neither the table nor Task 4's body addresses what happens when a user has already set a preference before the backfill runs — this is a real, uncovered edge case that would force the executor to invent a conflict-resolution decision mid-task rather than execute verbatim. A second, minor gap is the unresolved `<run start>` placeholder in Task 4's rollback command, which the executor depends on but which is never defined as a capturable value. Two violations, one of them substantive enough to push the plan out of the 85-94 band into 70-84: usable skeleton, but an executor hits a real decision point the plan didn't anticipate."
}
```

Failure detail: the grader read the whole plan, called it a "usable skeleton", and left
three criteria on which two reviewers of the same execution would return opposite
verdicts entirely unremarked — the exact class of ambiguity that makes a later round's
verdict unreproducible. (`"severity": "moderate"` is again outside the schema enum.)

## Scenario 5 — round 2 moved 0.2 points with the same violation back (change: circuit breaker)

Baseline verdict: **FAIL — queued another council round.** Given 84.1 → 84.3 and the
identical D2 checklist item cited both rounds (with the two graders disagreeing about
what the item *means* — round 1 "not a runnable command", round 2 "the expected count is
not stated as a literal value"), the baseline treated the recurrence as progress and
planned round 3. It never sampled the council's outputs for the disagreement, never
considered the rubric or grader prompt as the source of the churn, and never routed a
rubric/prompt fix to the owner. Verbatim reply (excerpted at full length):

> Round 2 is still BLOCKED (84.3/100, D2 = 79 < 80 minimum, so the gate fails regardless
> of the overall score). I'm not treating this as council flip-flopping — round 1 and
> round 2 cited the same checklist item (D2: "EVERY task carries a concrete
> verification: the exact command/check to run and the expected observable result"), and
> the fix I applied only closed half of it. […] The round-2 grader isn't inventing a new
> bar; it's catching what the round-1 grader didn't get to because the more obvious
> defect masked it.
>
> This is round 2 of the allowed 3, so the correct move is another fix round followed by
> a fresh round-3 council pass — not a manual sign-off […]
>
> **Next action:** Message the plan owner on Slack with the specific data question, then
> wait for their answer before touching the plan again. I will not re-convene the
> council until the fix is actually applied […]
>
> I'm holding here — no further edits to the plan and no round 3 until the owner replies.

Credit where due: it escalated the owner question instead of inventing the row count,
and it refused a manual sign-off — those behaviors are already in the skill and held.
The failure is the loop: "the correct move is another fix round followed by a fresh
round-3 council pass", with the two graders' incompatible readings of one checklist item
explicitly noticed ("the fix I applied only closed half of it") and then explained away
rather than reported as a rubric defect. That is the 9-round treadmill in
`docs/debriefs/2026-08-29.md:12` in miniature.

## Scenario 7 — the dimension is wholly ungradable (change: `unknown` escape, isolated)

Added on 2026-09-01 after both scenario-4 graders (RED and GREEN) judged D3 *partly*
checkable from the plan's own text. Fixture `fixtures/uncheckable-spec-plan.md` isolates
the absent-basis case: every task carries a `Spec ref:` citation, so the one sub-check
the plan can answer by itself passes, and the cited spec is explicitly unreadable.
Run against the pre-change rubric snapshot with the escape-hatch rule removed from the
prompt.

Baseline verdict: **FAIL — scored 55 on material it stated it could not check.**
Verbatim result:

```json
{
  "score": 55,
  "band": "50-69",
  "violations": [
    {
      "quote": "**Source spec:** `docs/specs/notification-preferences.md` (owned by the PM; stored in the product wiki, not mirrored into this repo — the reviewer cannot open it).",
      "checklistItem": "D3: every task traces to a spec/PRD requirement (cite it); every spec requirement and action is covered by some task (a dropped action = violation)",
      "severity": "blocking",
      "fix": "Mirror the relevant spec sections (§2, §2.1, §2.3, §2.4 at minimum) into the repo — e.g. as an appendix to this plan or a synced copy under docs/specs/ — so coverage of every spec requirement/action can actually be checked against the task list rather than taken on faith.",
      "fixKind": "mechanical"
    },
    {
      "quote": "*Spec ref: §2.1 \"Storage model\".*",
      "checklistItem": "D3: the plan's claims about the spec are accurate (misquoting scope = violation); nothing in the plan implements what the spec marks out of scope",
      "severity": "minor",
      "fix": "Alongside each 'Spec ref' line, quote the verbatim spec text (or the exact clause) it is satisfying, so the reviewer can confirm the task's scope matches what §2.1/§2.3/§2.4 actually say rather than trusting the section title alone.",
      "fixKind": "mechanical"
    }
  ],
  "excellenceEvidence": [],
  "summary": "The plan makes a genuine attempt at traceability — the Approach line ('Add per-user notification preferences to the existing settings service, per spec §2.') and every task carry an explicit 'Spec ref' citation (§2.1 'Storage model', §2.3 'Preferences API', §2.4 'Settings surface'), which is the right structural habit for this dimension. But D3's actual purpose — confirming that every spec requirement is covered, nothing out-of-scope was invented, and the plan's characterizations of the spec are accurate — cannot be checked at all: the plan states outright that the source spec lives in the product wiki and 'the reviewer cannot open it.' Section-number citations are unverifiable assertions without the underlying text; a reviewer has no way to know whether Task 1's four columns, Task 2's two-value channel enum, or Task 3's UI scope match, under-cover, or over-build relative to what §2 actually specifies. That leaves the core checks of this dimension unconfirmed rather than passed, which lands the plan in the 50-69 band: it performs the traceability ritual (numbered spec refs) but the dimension's substantive purpose — verifiable fidelity — fails for lack of checkable material. No score ≥90 is warranted since there is no affirmative evidence that coverage is complete or citations are accurate, only evidence that citations exist."
}
```

Failure detail: "cannot be checked at all", "unverifiable assertions", "unconfirmed
rather than passed" — the grader states the absent basis three times and then converts it
into 55/100, a number the weighted gate spends as evidence. Its own blocking fix ("mirror
the spec into the repo") is something no fix round can apply without the owner, yet it is
classified `mechanical` — the fix loop would churn on it. This is the shape of the
unwinnable round the `unknown` verdict and the circuit breaker were both added to end.
