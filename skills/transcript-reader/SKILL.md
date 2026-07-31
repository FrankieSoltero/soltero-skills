---
name: transcript-reader
description: Use when asked to extract, distill, summarize, or make minutes/action-items from a meeting transcript or recording text (VTT/SRT/Zoom/Meet export or pasted) — "what were the decisions", "who owns what", "turn this transcript into minutes". Dispatches a bundled Workflow pipeline on EVERY transcript regardless of length — deterministic ingest/chunking, parallel cited extractors, cross-chunk merge, independent per-item refute verifiers, completeness critic — and writes a citation-backed report next to the input with honest coverage stats. Learns only from user corrections via an injected rule pool. Transcript content stays local; never published.
---

# Transcript Reader

> **Portability note (non-Claude-Code agents):** this skill's citation-backed guarantee
> comes from a deterministic ingest pipeline plus independent per-item refute-verifiers
> and a completeness critic, run via Claude Code's `Workflow` tool on every invocation —
> not available on other CLIs. On a different agent you can still work through the same
> stages yourself (chunk the transcript, extract cited items, check owners/reversals
> across chunks, sweep for omissions), but a self-reviewed extraction is exactly the
> failure mode (self-approved paraphrase corruption) this skill exists to catch — flag
> your report as unverified rather than citing it as verified.

## Overview

A capable agent asked nicely will read a transcript once, write a plausible report, and
assert "I verified every citation." That self-check is the failure mode, not the fix: at
baseline the producer approves its own work — a single-word paraphrase corruption
("moderated" → "unmoderated") sailed through exactly such a self-review, an omitted
disagreement produced zero signal, and "coverage: complete" was prose, not arithmetic.
This skill replaces that with structure: a deterministic script normalizes and chunks the
transcript, parallel extractors return schema-forced items with verbatim evidence,
a reduce pass resolves owners and reversals across chunk boundaries, an **independent
verifier per item** tries to refute it against the transcript, a completeness critic
sweeps for omissions, and the report carries computed — not narrated — coverage stats.
**The user invoking this skill is the explicit opt-in the Workflow tool requires.**

Core principle: **nothing is reported as fact without a resolving citation and an
independent verification it survived; the pipeline runs on every transcript, with no
size threshold.**

## When to Use

- "Summarize this meeting / make minutes / decision list / action items" over any
  transcript file or pasted transcript text.
- Any question to be answered *from* a meeting transcript ("what did we decide about X?",
  "who took the Stripe follow-up?") — run the pipeline, answer from the verified report.

## When NOT to Use

- Non-transcript documents (specs, articles) — this pipeline's contract is speaker/time
  structured content.
- Editing or acting on the extracted action items — this skill only produces the report.

## Hard Rules (non-negotiable)

1. Every reported item cites a transcript location (`L<n>` lines + timestamp);
   verifier-refuted items are corrected or flagged in "Flagged (unverified)" — never
   silently dropped, never silently kept.
2. Exact-match evidence (names, numbers, dates, quotes) is verbatim from the transcript.
   Paraphrase lives only in sections explicitly labeled as summary.
3. The rule pool (`references/extraction-rules.md`) is written only from user corrections.
   Self-evaluation proposes nothing. Itemized edits only (see `references/rules-protocol.md`).
4. Transcript content stays local: no artifacts, no publishing, no external sends. The
   report lives next to the input (or where the user says).
5. The full pipeline runs on EVERY transcript. "It's short, I'll just read it" is a named
   rationalization — so is its cousin, "I'll do the pipeline steps carefully by hand."
6. Coverage is reported honestly: chunks processed/failed, items
   extracted/confirmed/corrected/flagged, whether the critic ran. No silent truncation.

## How to Run

1. **Get a file.** If the user pasted transcript text, write it verbatim to a temp file
   first. Note the meeting type if stated or obvious: `standup | client | planning |
   interview | generic` (default `generic` — the type adds overlay fields, never changes
   the core; see `references/extraction-contract.md`).
2. **Load the rule pool.** Read `${CLAUDE_SKILL_DIR}/references/extraction-rules.md` and
   pass its full contents as `rules`.
3. **Invoke the Workflow tool** — do not read the transcript and extract inline instead,
   and do not hand-emulate the stages "because it's short":

   ```
   Workflow({
     scriptPath: "${CLAUDE_SKILL_DIR}/workflows/distill.mjs",
     args: {
       transcript: "<absolute path to transcript file>",
       skillDir: "${CLAUDE_SKILL_DIR}",
       meetingType: "generic",
       rules: "<contents of extraction-rules.md>"
     }
   })
   ```

   Optional: add `reportPath` INSIDE `args` (a top-level `reportPath` is ignored) to
   override the default `<basename>-distilled.md` next to the input. **Cost note:** the pipeline spawns one verifier per extracted item plus chunk
   extractors and a critic — dozens of agents on a long meeting is normal, not a
   malfunction. That is the price of items that survived independent refutation.
4. **Relay the result.** Read the returned `reportPath`, present the decisions/actions
   headline and the coverage stats in chat, point at the report file. If anything is in
   "Flagged (unverified)", say so — do not present flagged items as facts.
5. **Apply rule feedback.** If the run returned `ruleFeedback`, update the counters in
   `extraction-rules.md` as itemized edits (protocol in `references/rules-protocol.md`).
6. **On user correction** ("actually Priya owned that", "you missed the budget decision"):
   that is the external signal — add/update a rule per `references/rules-protocol.md`,
   then thank the correction into the pool. Never add rules from your own review of a run.

## Report Contract

`<transcript-basename>-distilled.md` next to the input: labeled Summary; Decisions with
status (reversed/amended decisions show original AND change, both cited); Action items
(AMBIGUOUS owners stay ambiguous with candidates unless transcript evidence resolves
them); Open questions; Key facts & numbers (conflicting figures shown as conflicts, both
cited); Disagreements; Topic timeline; meeting-type overlay; Flagged (unverified);
Coverage. Full format: `references/extraction-contract.md`.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "It's fifteen lines — the pipeline is overkill, I'll just read it." | Hard rule 5 names this one. Short is when unverified paraphrase slips through unnoticed, and the pipeline on a tiny file costs seconds. Baseline demonstrably swapped a claimed pipeline for an inline read the moment the file looked small. |
| "I'll follow the pipeline's steps myself — read, extract, verify — same thing without the dispatch." | It is not the same thing: your verification of your own extraction is the producer approving the producer. The baseline's self-checked run shipped a corrupted quote and a silent omission. Independence comes from the dispatch, not the checklist. |
| "I read it carefully and checked every citation — that's verification." | Self-attested checking is the observed failure, not the fix. Only items that survived an independent refute-style verifier get reported as fact. |
| "The tracker/slide needs ONE name/number — I'll pick the better-supported one." | If the transcript doesn't resolve it, the report says AMBIGUOUS (both candidates) or CONFLICT (both values, both citations). Downstream format pressure never converts a guess into a fact. |
| "The decision was made in minute two — I can ship the headline now." | Decisions are reportable only after the whole transcript is processed; the baseline fixture's headline decision was reversed 9 minutes later, and the battle fixture's after lunch. Stale-as-final is the classic failure. |
| "The report looks complete; I'll write 'full coverage'." | Coverage is the stats object the workflow computed (chunks, verify counts, flags) — render it; never author it. |
| "I keep seeing extractors miss X — I'll add a rule for that." | Rules come only from user corrections (external signal). Self-evaluated rules are the drift this skill's memory design exists to prevent. Propose nothing; wait for the user. |
| "This report would make a nice artifact/share link." | Hard rule 4: transcript content is local-only. Report file next to the input, nothing published, ever. |

## Red Flags — STOP

- About to answer transcript questions or write minutes from your own read, without the
  Workflow dispatch in this transcript.
- About to skip the pipeline because the transcript is short, the user is rushed, or the
  request was phrased casually ("just bullet what they said").
- About to put a single owner on an item whose assignment the transcript leaves ambiguous,
  or a single value on a figure the transcript states twice.
- About to report an early-meeting decision before the pipeline has processed the end.
- About to type the word "verified" about your own extraction.
- About to edit `extraction-rules.md` with anything not traceable to a user correction, or
  to rewrite the file wholesale.
- About to publish, artifact, or send transcript content anywhere off the machine.
