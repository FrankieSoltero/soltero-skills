# transcript-reader — verified meeting-transcript extraction that learns from corrections

**Status:** Spec approved 2026-07-22 (brainstormed in-session; approach A, no size
threshold by user decision — the full pipeline runs on every transcript).
**Domain note:** non-coding skill; architecture applies agent-playbook tactics
(tiers cited) generalized from the coding domain — labeled as such.

## Problem

Long meeting transcripts (1-3h) exceed what a single read reliably extracts:
items get missed in the middle, owners misattributed across chunk boundaries,
numbers paraphrased wrong, and reversed decisions reported as final. Generic
"summarize this" has no verification and no memory of past mistakes.

## Solution shape

One skill, `transcript-reader`, that ALWAYS dispatches a bundled Workflow
pipeline (audit-swarm precedent — the user invoking the skill is the Workflow
opt-in) over a user-provided transcript file, producing an evidence-cited
extraction report, and improving via a correction-fed rule pool.

## Inputs

- A file the user provides (txt / VTT / SRT / Zoom / Google Meet export, with
  or without speaker labels) or pasted text (written to a temp file first).
- Optional meeting type: standup | client | planning | interview | generic
  (default generic; type selects an overlay, never changes the core).

## Extraction contract

**Fixed core (every run):** decisions (what/who/why, and whether later
reversed/amended), action items (owner + deadline + verbatim ask), open
questions, key facts & numbers (verbatim), disagreements (positions + holders),
timeline of major topics. **Overlays** add fields per meeting type (e.g.
client: commitments made to/by client; interview: candidate claims + evidence).
**Every item carries a citation** to its transcript location (timestamp if
present, else line range). No citation → the item cannot appear as fact.

## Pipeline (bundled `workflows/distill.mjs`; runs on EVERY transcript, no size threshold)

1. **Ingest (deterministic script, not LLM):** normalize format, preserve
   timestamps/speakers, write normalized transcript to disk, chunk
   speaker-aware with overlap. Playbook: offload large content to disk with
   retrieval hints (Proven); files+grep over context-stuffing (Promising).
2. **Map:** parallel chunk extractors (schema-forced) returning structured
   items only, each with citation + verbatim evidence span. Names, numbers,
   dates, quotes are preserved literally, never paraphrased (playbook Watch —
   TACO: paraphrase corrupts exact-match values; load-bearing here). Rule pool
   (see Learning) is injected into every extractor prompt. Playbook: workers
   return typed results, never raw dumps (Promising, CodeDelegator −4.7pp).
3. **Reduce (barrier, justified):** cross-chunk merge — dedupe, resolve
   owners/pronouns across boundaries, mark decisions later reversed/amended,
   assemble timeline.
4. **Verify:** one independent verifier per extracted item greps the
   normalized transcript at the citation and tries to REFUTE it (wrong owner,
   out-of-context quote, number mismatch, reversal missed). Refuted → corrected
   or moved to a flagged "unverified" section — never silently dropped, never
   silently kept. Playbook: verifier independent of producer (Promising,
   arXiv 2604.25850 + METR); house skeptic pattern.
5. **Completeness critic:** one agent sweeps the transcript for
   extraction-worthy content absent from the merged output; findings loop back
   through Verify. (Completeness-critic pattern; the dominant long-transcript
   failure mode is omission, not hallucination.)
6. **Report:** `<transcript-basename>-distilled.md` next to the input (or a
   user-specified path): core sections + overlay, citations on every item,
   flagged-unverified section, and a coverage note (chunks processed, items
   verified/refuted/flagged — no silent caps).

## Learning loop (correction-fed ONLY)

- `references/extraction-rules.md` — ACE-style itemized rules with
  helpful/harmful counters. A rule is added ONLY from an external signal: the
  user corrects an extraction (missed item, wrong owner, misattributed quote).
  The skill NEVER writes rules from self-evaluation. Playbook: episodic memory
  keyed off external feedback (Proven, Reflexion); cross-task rule pool is the
  component that beats baseline (Promising, TACO); itemized grow-and-refine,
  never wholesale rewrites (unvetted-fresh, ACE arXiv 2510.04618).
- Each rule: trigger pattern, correction, origin (which transcript/correction,
  date), helpful/harmful counters incremented by later runs' verify outcomes.
- Maintenance: `memory-gardener` gardens the pool; recurring rule themes
  escalate through `skill-patcher` as SKILL.md patch candidates.

## Hard rules

1. Every reported item cites a transcript location; verifier-refuted items are
   corrected or flagged, never silently dropped or kept.
2. Exact-match evidence (names, numbers, dates, quotes) is verbatim from the
   transcript — paraphrase only in summaries clearly marked as summary.
3. The rule pool is written only from user corrections (external signal);
   self-eval may PROPOSE nothing. Rule edits are itemized, never rewrites.
4. Transcript content stays local: no publishing, no artifacts, no external
   sends; the report lives next to the input or where the user says.
5. The full pipeline runs on every transcript — no "it's short, I'll just read
   it" inline shortcut (named rationalization).
6. Coverage is reported honestly (chunks, verify counts, flags) — no silent
   truncation.

## Testing (creating-a-skill process)

Fixture transcripts (synthetic, realistic speaker-labeled), planted traps:

1. **Reversed decision** — decided in hour 1, reversed in hour 3; correct:
   reported as reversed, not final.
2. **Ambiguous owner** — "you take that" across a chunk boundary; correct:
   resolved via reduce pass or flagged ambiguous, never guessed silently.
3. **Conflicting number** — figure stated twice with different values; correct:
   both cited, conflict surfaced.
4. **Shortcut temptation** — a short transcript + user urgency; correct: full
   pipeline anyway (hard rule 5).
5. **Battle test** — full pipeline on a 2h+-scale synthetic transcript with an
   answer key; scored recall/precision recorded in GREEN-result.md with the
   actual numbers.

RED baselines on real subagents without the skill; GREEN disk-verified.

## Open questions (encoded defaults)

- Overlay set v1: standup/client/planning/interview/generic — extend later.
- Report location default: sibling file — revisit if the user wants a central
  meetings archive.
- Rule-pool location is inside the skill (references/) and therefore updated
  via skill-patcher-style PRs when it lives in the plugin; when running from a
  repo checkout it may be edited directly on a branch. v1 accepts this split.
