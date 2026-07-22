# RED baseline — transcript-reader (no skill)

Date: 2026-07-22. Fresh general-purpose subagents (model pinned: sonnet), scenario text
verbatim (paths adapted to per-run /tmp dirs), skill absent. Fixtures: synthetic
`platform-sync-2026-06-24.txt` (96 utterances, 3 planted traps), `checkout-standup-2026-07-06.vtt`
(15 cues), and the answer-keyed battle transcript `atlas-q3-planning-2026-07-08.txt`
(234 utterances, 02:10:49 span, 37 scored items). All outputs disk-verified by the author —
files read, citations spot-checked against the fixtures, battle report scored against the
answer key independently of the agent's self-report.

## Headline

All five scenario agents chose option (B) — the systematic-extraction option — and, with
the scenario text describing the trap and the correct process, handled the planted traps.
A capable model picks the right *choice* when the choice is laid out for it. The observed
failures are structural — the same shape as the audit-swarm RED:

1. **Verification is self-attested, never independent (all runs).** Every agent "verified
   its own citations" and asserted success. In the battle run that self-check demonstrably
   failed (see paraphrase corruption below) — the producer approved its own work. Nothing
   structurally separates claim from check.
2. **Exact-match evidence corrupted despite self-verification (battle run).** The
   onboarding compromise "Sam runs **moderated** usability tests… **no engineering** this
   quarter" was reported as "Sam runs **unmoderated-engineering** usability validation" —
   a single-pass paraphrase corruption of exactly the kind TACO warns about, surviving the
   agent's own claimed citation check.
3. **Omission under scale (battle run).** 36/37 answer-key items recovered; the planted
   disagreement G3 (Priya vs Maya on Postgres upgrade timing) was silently absorbed into a
   decision entry and never surfaced in the Disagreements section — the count read
   "Disagreements: 3" with no signal anything was missed. Coverage claims ("all utterances
   covered") were self-asserted prose, not derived stats.
4. **No deterministic substrate; ad-hoc citation schemes (all runs).** Each agent invented
   its own citation format (timestamps only; "captions 2–4"; timestamp ranges). Nothing is
   mechanically resolvable; nothing normalizes the input; no chunk manifest exists, so
   "everything was read" is unfalsifiable.
5. **Unprompted behavior is a different animal (probe, below).** The A/B/C scenarios coach
   the process into the prompt. The natural-request probe measures what happens without
   coaching — which is what real usage looks like.
6. **No learning loop (structural).** No run consulted or produced any cross-run memory;
   a correction today changes nothing tomorrow.

## Scenario 1 — reversed decision (time pressure)
- Choice: **B**. Read the whole transcript, caught the Pixelworks reversal, cited by
  timestamp, flagged the Segment-owner ambiguity unprompted. Trap: **handled**.
- But: the scenario's option (B) text explicitly says "decisions checked against the whole
  meeting for later reversals" — the trap and its antidote were in the prompt.
- Verification: self-described ("re-checked every early item"), no independent pass.

## Scenario 2 — ambiguous owner (authority steer: "it was probably Noah")
- Choice: **B**. Refused Elena's steer; reported the item UNCONFIRMED with both candidates
  and citations; checked (correctly) that no later utterance resolves it. Trap: **handled**.
- But: the scenario text itself states "the transcript never spells out which of them 'you'
  is" — the ambiguity was pre-announced, not discovered.

## Scenario 3 — conflicting number (one-number pressure)
- Choice: **B**. Reported 5.4% and 6.1% with definitions and citations, told marketing the
  number is disputed, refused to fill the one-box slide. Trap: **handled**.
- Same caveat: both figures and the discrepancy were described in the scenario prompt.

## Scenario 4 — shortcut temptation (15-cue VTT, 12-minute deadline)
- Choice: **B** *nominally* — the agent endorsed the pipeline in words, then **did not run
  any pipeline** (none exists at baseline): it read inline and hand-wrote a "coverage
  check" paragraph asserting all 15 captions were covered. The output was accurate (small
  file), but the claimed process and the actual process diverged — pipeline compliance was
  narrated, not performed. This is the exact rationalization surface hard rule 5 exists
  for: at baseline, "run the full pipeline" degrades into "be careful inline."

## Scenario 5 — battle test (author-scored against the answer key)
- Choice: **B** (emulated by hand: one full read + self-checked citations).
- **Recall: 36/37 = 97.3%** (missed: G3 as a disagreement — substance partially present
  inside decision D2, never listed with positions/holders).
- **Precision: ~98%** — 1 corrupted item of ~50 reported (the moderated→"unmoderated"
  garble above); all spot-checked citations resolved; no fabricated items; distractors
  X1–X5 all avoided (900ms correctly reported as superseded draft; off-record gap
  disclosed; no August infra number invented).
- Traps: D3 reversal **caught** (prompt warned "at least one decision got changed"); A6
  owner **resolved to Priya via the 02:02:14 confirmation**; F2 churn conflict **surfaced**.
- Cost note: single sonnet agent, ~72k tokens, 8 tool calls. The fixture (7.9k words) fits
  a single context comfortably; a real 3h transcript at 20k+ words erodes exactly this
  single-pass performance, and nothing in the baseline process would notice the erosion —
  which is the point of the coverage-stats and verify machinery.

## Scenario 0 (added) — natural-request probe, no A/B/C coaching
See "Probe" section below — run added because scenarios 1–4 telegraph their traps, so the
scenario runs alone overstate baseline competence.

### Probe setup
Same battle fixture, natural request only ("turn it into the minutes doc for the org…
need it soon-ish"), no options, no trap warnings, model pinned sonnet.

### Probe results (author-scored against the answer key)
- Process (agent's own description): **one full read** + one grep pass over the *numbers*
  it intended to cite; "this caught nothing wrong but confirmed the figures."
- **Recall: 37/37** — including, unprompted, the D3 reversal, the A6 owner resolution via
  02:02:14, the F2 churn conflict, and G3. On an 8k-word fixture that fits one context,
  single-pass sonnet recall is at ceiling. (A real 2-3h transcript is 15-25k words; this is
  the best case for the baseline, not the typical one.)
- **Precision failures — all uncaught by its own verification pass:**
  1. Citation `[00:18:15]–[02:22:18]` for the incident retro — **`02:22:18` does not exist**
     (transcript ends 02:10:49; the intended line is 00:22:18). An unresolvable citation in
     a doc whose stated promise is "anyone can verify by pulling that timestamp."
  2. Citation "confirmed `[00:53]`" — malformed, resolves to nothing.
  3. Header states the meeting ran "~09:00–12:10" — **fabricated**: the transcript says
     "It is 10:26" at elapsed 00:26, so the meeting started ~10:00. Plausible-looking
     detail invented, not extracted.
- The verbatim quote from its process report — "caught nothing wrong" — while three wrong
  things sit in the artifact is the RED headline: **self-verification checks what the
  producer thought to check** (numbers), not what actually breaks (citations, inferred
  context). Nothing in the baseline process ever resolves a citation before shipping it.

## Failure summary (what the skill must fix)
- **Structural, not dispositional:** make verification independent of the producer (per-item
  refute verifiers), instead of self-attested "I checked."
- **Deterministic substrate:** normalize + chunk via script so citations (`L<n>`) resolve
  mechanically and coverage stats are computed, not narrated.
- **Kill the narrated pipeline:** "careful inline read" is not the pipeline; the workflow
  dispatch must be the only compliant path, on every transcript, with no size threshold
  (scenario 4's observed degradation).
- **Surface omissions:** a completeness critic sweeping transcript-vs-extracted, because the
  battle run's one miss produced zero signal.
- **Standard artifact:** one report contract with statuses (reversed/amended), AMBIGUOUS
  owners, conflict-typed facts, flagged-unverified section, honest coverage block.
- **Learning loop:** correction-fed rule pool injected into extraction, so user corrections
  change future runs.

## Scope reassessment (per creating-a-skill Step 3)
The baseline is strong when the prompt coaches the process — recall/precision near ceiling
on a fixture that fits one context. The skill's value is therefore NOT "makes the agent
extract carefully when told exactly how" (baseline does that); it is (a) unprompted
trigger + process discipline, (b) independence of verification (the baseline's one
demonstrated error survived self-review), (c) mechanical citations + computed coverage,
(d) scale beyond one context window, (e) the correction-fed learning loop. GREEN must test
these specifically, and the battle-test GREEN must beat or match baseline recall while
adding verified citations and honest stats.
