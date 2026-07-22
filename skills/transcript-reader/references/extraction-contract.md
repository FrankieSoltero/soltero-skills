# Extraction Contract — core, overlays, report format

## Fixed core (every run, every meeting type)

| Section | Contents | Per-item requirements |
|---------|----------|----------------------|
| Decisions | what was decided, who decided/owns, why | status: `final` / `reversed` / `amended`. A reversed or amended decision shows BOTH the original and the change, each cited — the stale version is never presented as current. |
| Action items | owner, deadline, the verbatim ask | If the transcript leaves the owner ambiguous (unclear "you"), the item says `AMBIGUOUS` with the candidate names — resolved only by other transcript evidence, never by plausibility. |
| Open questions | questions raised and not resolved | note who raised it and any next step assigned |
| Key facts & numbers | figures, dates, names — verbatim | A figure stated twice with different values is reported as a conflict: both values, both citations. Never pick one, never average. |
| Disagreements | positions and their holders | resolution state: resolved / overruled / unresolved-deferred |
| Topic timeline | major topics in order with time ranges | includes gaps (off-record segments) explicitly |

**Citations.** Every item cites its location in the normalized transcript: `L<start>-L<end>`
plus the timestamp when the source has them. No citation → the item cannot appear as fact
(it may only appear in the Flagged section). Citations must resolve: the cited lines must
actually contain the quoted evidence.

**Verbatim rule.** Names, numbers, dates, and quotes are copied exactly from the
transcript. Paraphrase is allowed only in prose explicitly labeled as summary. ("Moderated
usability tests" must never come out as "unmoderated" — single-word corruption of an exact
value is the classic failure this rule exists for.)

## Overlays (additive; the core never changes)

| Meeting type | Extra fields |
|--------------|-------------|
| `generic` | none — core only (default) |
| `standup` | blockers (who, on what, since when, unblock owner); per-person yesterday/today commitments |
| `client` | commitments made TO the client and BY the client (exact wording, who committed); risks/complaints the client raised; promised follow-ups with dates |
| `planning` | scope decisions (in/out/deferred, what was traded away); estimates and deadlines committed (verbatim numbers); priority calls (what outranks what) |
| `interview` | candidate claims (verbatim) each with the evidence offered or its absence; interviewer commitments (next steps, timelines); red flags raised by any party |

## Report format

Written to `<transcript-basename>-distilled.md` next to the input (or a user-specified
path). Local file only — never published, never sent anywhere. Sections in order:

1. **Summary** — short prose, explicitly labeled as summary (the only paraphrase zone).
2. **Decisions** (statuses as above)
3. **Action items**
4. **Open questions**
5. **Key facts & numbers**
6. **Disagreements**
7. **Topic timeline**
8. **`<type>` overlay** (non-generic meeting types only)
9. **Flagged (unverified)** — every item a verifier refuted or failed to verify, with the
   reason. The section states plainly that these are not established facts. Refuted items
   land here or get corrected — they are never silently dropped and never silently kept.
10. **Coverage** — the pipeline's stats object rendered honestly and completely: utterance
    count, time span, chunks processed vs failed, items extracted → merged → confirmed /
    corrected / flagged, whether the completeness critic ran, ingest warnings. No silent
    truncation: if a chunk extractor or the critic failed, the report says so.
