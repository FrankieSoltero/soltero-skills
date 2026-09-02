# Lesson Recall — Reference

## The recall report

One block, before any other work on the task. It has four parts and no preamble:

1. **How many matched, and the top score** — `Recall: 2 prior lessons match (top 0.58)`.
   Include the score so the reader can tell a strong hit from a weak one.
2. **Each surviving match**: date, the symptom in a few words, and its recorded fix. Entries
   you dropped after the relevance pass get one clause saying why — "2026-07-19 deploy skew
   scored 0.19 but this change ships in one service, dropped".
3. **The class count** — `Class "calendar-day shift" has occurred 2x`. Always state it, even
   at 1; it is the number the threshold reads.
4. **What you are doing with it** — the recalled fix as a hypothesis handed to
   `lean-debugging`, or the `correction-compiler` handoff at N ≥ 3.

When nothing clears the floor, the whole report is one line: `Recall: 12 entries scanned,
nothing above the floor for this task.` Say it anyway — silence is indistinguishable from
having skipped the gate.

## The correction-compiler recurrence bundle (N ≥ 3)

`correction-compiler` opens on evidence of a repeat and writes `Docs/corrections-ledger.md` in
the format its `references/ledger-format.md` fixes. Hand it the fields it needs, filled from
the script's output, so it does not have to re-derive them:

| Field it needs | Where it comes from |
|---|---|
| **Category** | The class, named in the store's vocabulary (`date-handling`, `cache-invalidation`) |
| **Trigger Origin** | Every occurrence date from `handoffClasses[].dates`, one line each, plus the user's own words if they named the count |
| **Scope** | Where the class keeps landing — the files/dirs the matched entries name |
| **Constraint** | What a deterministic check would have to block, stated from the recorded fixes (proposed, not decided — `correction-compiler` owns the artifact choice) |
| **Traced-To** | `Docs/mistakes-and-fixes.md` entries by date — every one must resolve to a real entry |
| **Rationale** | That prose has now failed N times; N is the count, from the script |

Worked handoff, from the scenario-2 fixture:

```
Recall: this is the 5th recorded occurrence of the calendar-day-shift class
(2026-05-02, 2026-06-02, 2026-06-25, 2026-07-08, 2026-08-21), and the owner puts it at ~15.
Handing off to soltero-skills:correction-compiler before fixing the queue.

  Category:      date-handling
  Trigger Origin: 5 recorded occurrences, 2026-05-02 through 2026-08-21 — bare `YYYY-MM-DD`
                  strings routed through `new Date()` / `toISOString()` in five surfaces
  Scope:         src/**/*.ts(x) outside src/lib/dates.ts
  Constraint:    (proposed) no `new Date(<string>)` or `.toISOString()` on a calendar day
                 outside the dates helper
  Traced-To:     Docs/mistakes-and-fixes.md entries 2026-05-02, 2026-06-02, 2026-06-25,
                 2026-07-08, 2026-08-21
  Rationale:     a helper and five lesson entries already exist; nothing forces their use
```

Then stop and let `correction-compiler` run. It drafts, records, and **presents for human
approval** — it installs nothing, and neither do you. Approving your own enforcement artifact
is the failure mode that skill exists to prevent.

The threshold is per class, not per file or per project: five surfaces of one root cause is
one class at 5, not five classes at 1. The script's clustering already does this — read
`recurrence.occurrences` rather than counting titles by eye.

## Reading the script's output

- `score` — normalized weighted term overlap, not a probability. Use it to order, and to tell
  a 0.58 from a 0.13; never as proof of relevance.
- `confidence.gap` — the distance from top-1 to top-2. A large gap means one entry stands out;
  a flat spread across several near-identical scores usually means the task terms are generic,
  so re-run with a sharper symptom sentence before trusting any of them.
- `silent: true` — nothing cleared the floor. Report it; do not lower `--floor` to manufacture
  a hit.
- `supersededBy` — a later entry sharing a distinctive term from this entry's fix. It is a
  pointer, not a verdict: read both entries before acting on either.
- `matchedTerms` — why this entry surfaced. If the matched terms are all incidental
  vocabulary, that is your cue to drop it in the relevance pass.

## When the store is missing, tiny, or malformed

- **No `Docs/mistakes-and-fixes.md`** — the script says so and exits 0. Report "no lesson
  store in this project" in one line and proceed. Creating the file is `capture-lesson`'s job,
  after there is a lesson to put in it.
- **Entries that do not parse** — the parser keys on `## YYYY-MM-DD — <symptom>` headings.
  Hand-written entries in another shape are invisible to it; if the file is visibly larger
  than `scanned.lessons` suggests, say so in the recall line and skim the unparsed part by
  hand. Do not reformat the file to make it parse (that is `memory-gardener`).
- **Other stores** — a project may keep lessons elsewhere (`Docs/corrections-ledger.md` for
  compiled rules, `HANDOFF.md` for in-flight state). Point `--lessons` at any file in the
  capture-lesson format; the ledger and handoff files belong to `correction-compiler` and
  `agent-handoff` and are read by those skills, not this one.
