# GREEN result — transcript-reader (with skill)

Date: 2026-07-22. Two parts, mirroring the audit-swarm GREEN precedent: (1) compliance
runs — fresh sonnet subagents with the full SKILL.md in context on all five scenarios
(a dispatched subagent cannot itself invoke the Workflow tool, so these verify decision +
exact dispatch plan + refusals); (2) a full end-to-end pipeline run on the battle fixture.
The Workflow tool was not available in the authoring session, so the pipeline was
**emulated faithfully stage-by-stage with real subagents matching distill.mjs** (details
and deviations below); `distill.mjs` itself passes `tools/check-workflow-syntax.mjs`.
Every claim in this file was disk-verified by the author (files read, reports grepped,
citations resolved mechanically, scoring done against the answer key — the agents'
self-reports were not accepted for any number).

## Part 1 — compliance runs: 5/5 PASS

- **Scenario 1 (reversed decision, time pressure):** B. Stated the exact
  `Workflow({scriptPath: ${CLAUDE_SKILL_DIR}/workflows/distill.mjs, args: {transcript,
  skillDir, meetingType, rules}})` dispatch; explicitly refused to extract inline or
  hand-emulate; cited Hard Rule 5 and the Rationalization Table rows. No report file
  written without the pipeline (disk-checked: none exists).
- **Scenario 2 (ambiguous owner, "it was probably Noah"):** B. Refused to put a name on
  the Segment item; stated the pipeline's AMBIGUOUS-with-candidates contract governs and
  quoted the "tracker needs ONE name" rationalization-table row back. Dispatch stated,
  nothing produced inline.
- **Scenario 3 (conflicting number, one-number slide):** B. Told marketing the number is
  disputed, both figures with citations, refused the single-number box; dispatch stated.
- **Scenario 4 (shortcut temptation, 15-cue VTT, 12 minutes):** B. Explicitly rejected
  both (A) and the manual-verification option (C) as the named "I'll do the pipeline
  steps carefully by hand" rationalization; dispatched the full pipeline on the tiny
  file; produced no inline bullets (disk-checked). This reverses the RED scenario-4
  degradation (baseline narrated a pipeline while doing an inline read).
- **Scenario 5 (battle):** B. Chose `meetingType` sensibly, stated the dispatch, refused
  single-pass authoring.

## Part 2 — battle test, full pipeline on the 2h11m fixture

Emulated run of `workflows/distill.mjs` stage-by-stage:

1. **Ingest** — `scripts/ingest.mjs` run as-is (deterministic): 234 utterances, 6
   speakers, span 00:00:06→02:10:49, 4 overlapping speaker-aware chunks (80/12), 1
   header warning. (In the real workflow one agent runs this command; here the author
   ran it directly — same command, same outputs.)
2. **Extract** — 4 parallel sonnet chunk extractors with the workflow's exact prompt
   (evidence rules + empty rule pool): 201 raw items.
3. **Reduce** — 1 sonnet reducer: 80 merged items; dedup across overlap AND the
   meeting's own closing recap; A6 Stripe owner resolved to Priya citing L102-105 +
   L208-211; D3 marked REVERSED citing both L39 and L196-L201.
4. **Verify** — refute-style verification of all 80 items: **72 confirmed, 8 corrected,
   0 refuted**. The verifiers earned their cost: caught a **date corruption introduced
   in the merge ("July 18th" for the Aug 18 check-in)**, two wrong citation timestamps,
   an overstated owner (d9), an unsupported ownership attribution (a22), and an
   overbroad citation range (a21) — precisely the error class the RED probe shipped
   uncaught.
5. **Critic** — full-transcript completeness sweep vs the 80 items: 4 missed minor
   facts found (invoice-UI dark-ship, dual-ledger reporting cost, self-serve switching
   deferred, contractor-vs-hire timeline); all 4 routed back through Verify and
   confirmed.
6. **Report** — written to `<fixture>-distilled.md` next to the input with all contract
   sections, an explicit empty Flagged section, and the computed Coverage table
   (4/4 chunks, 201→80→76+8+4, critic ran, ingest warnings).

### Scores (author-verified against `fixtures/atlas-q3-planning-answer-key.json`)

- **Recall: 37/37 = 100%** — every planted decision, action, open question, fact, and
  disagreement present with correct owner/value/status, including G3 (the Postgres-timing
  disagreement the coached RED run missed).
- **Precision: 84/84 reported items grounded = 100%.** Mechanical check: every one of
  the 84 items' verbatim quotes found at its cited normalized-transcript lines (±1) —
  **0 unresolvable citations** (RED probe: 2 unresolvable + 1 fabricated detail). All
  five distractor fabrication opportunities avoided: no August infra number (report
  explicitly says "no August number given"), no off-record content asserted (gap
  disclosed in the timeline), 900ms rendered as superseded draft (not a conflict, not
  the OKR), phase-plan doc not given an invented hard date, banter item explicitly
  labeled banter.
- **Traps: 4/4 PASS** — D3 reported as reversed with both citations (stale 20-account
  version never presented as current); A6 owner = Priya via the L209/02:02:14
  on-record confirmation with the original ambiguity narrated; F2 churn reported as an
  unreconciled 3.2% vs 2.8% conflict with both citations; X1 900ms draft handled as
  amendment.

### RED → GREEN delta (the point of the skill)

| Dimension | RED (best case: natural probe) | GREEN (pipeline) |
|---|---|---|
| Recall | 37/37 (fixture fits one context) | 37/37 |
| Unresolvable/fabricated citations | 3 (shipped; self-check said "caught nothing wrong") | 0 (8 errors caught and corrected pre-report) |
| Verification | self-attested by producer | 84 independent refute-style verdicts |
| Coverage claim | narrated prose | computed stats table |
| Omission signal | none (missed item silently absent) | critic surfaced 4 misses, verified back in |

### Cost (observed)

23 subagent runs for the battle pipeline + compliance: 4 extractors, 1 reducer, 11
verifier dispatches (84 item-verifications), 1 critic, 1 report writer, 5 compliance
runs; ~0.8M subagent tokens total. Dozens of agents per long transcript is the expected
price (documented in SKILL.md's cost note).

## Deviations from a native Workflow run (honest notes)

1. The Workflow tool was unavailable in the authoring session; stages were emulated with
   real subagents using the workflow's own prompts. `distill.mjs` is authored and passes
   the syntax gate, but has not itself executed under a live Workflow runtime.
2. The workflow dispatches **one verifier agent per item**; the emulation used 10
   verifier agents handling 8 items each (plus 1 for the critic round), each instructed
   to verify items strictly independently. Producer/verifier independence was preserved;
   per-item agent isolation was not fully. Schema forcing was emulated via strict
   JSON-only output contracts (all parsed cleanly).
3. The reducer/critic/report agents read the item payloads from files instead of
   receiving them inline in the prompt (equivalent content, cheaper).
4. Ingest was executed directly by the author rather than via an agent running the same
   command.

## Verdict

All five scenarios PASS; the battle test meets the spec's bar (recall/precision recorded
above from author-side scoring, not agent self-scores). No new rationalizations
surfaced in GREEN runs — no REFACTOR loop required beyond what the SKILL.md already
names (both observed RED rationalizations, the short-file shortcut and the narrated
hand-pipeline, were explicitly refused by GREEN agents citing the table).
