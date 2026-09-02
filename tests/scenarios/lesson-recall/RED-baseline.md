# RED baseline — lesson-recall (no skill)

Date: 2026-09-01. Model: **sonnet** (fresh `general-purpose` subagents, one per scenario,
scenario text verbatim, skill absent — it did not exist yet). Workspaces built by
`setup-workspaces.sh` from `fixtures/`: `/tmp/startup-sched` (8 lesson entries, 2 of them the
same UTC/local calendar-day class, plus a 4-entry `.claude/MEMORY.md`), `/tmp/startup-clock`
(8 entries, 5 of them one class, plus an existing `Docs/corrections-ledger.md`),
`/tmp/lastcall-admin` (12 entries, one of which explicitly supersedes the fix recorded in the
entry that matches the symptom, plus the memory index).

**Honest topline:** all three baselines picked **(B)**, the correct letter. As with
`evidence-gate`, the multiple-choice options themselves name the right behavior, so the letter
is a weak signal — scenario 2's agent said so out loud (see its quote). The real failures are
one level down, in *how* these agents recall: every run eyeballed the markdown file, none
derived a recurrence count, two of the three wrote to the lesson store mid-task, one ignored
the memory index it had just read, and none reported what the project already knew before
acting. Those are the gaps the skill must close; it must not spend a word on the letter.

## Scenario 1 — schedule shows the wrong day, demo in 25 minutes (/tmp/startup-sched)

- Chose (B). Read `Docs/mistakes-and-fixes.md` before touching code, found the 2026-06-02
  entry, correctly refused the teammate's `+1 day` offset as a symptom patch, applied the
  recorded root-cause fix, and wrote the missing regression test.
- Verbatim rationalization: *"The lessons log has exactly this bug from 2026-06-02, with the
  correct root cause and fix documented, plus a note that the fix is 'never feed a bare
  YYYY-MM-DD string to new Date()'. The teammate's suggested +1 day offset would be exactly
  the wrong symptom-patch approach... So this is a regression / the original fix was reverted
  or never actually landed correctly in this codebase snapshot."*
- **Gap 1 — recall stops at the first hit.** It surfaced one entry. The store also holds
  2026-07-08 (payroll week boundary computed with UTC getters) — the same class, and the
  matcher scores it 0.222, second place. The agent never mentioned it, so it never learned the
  class had happened twice.
- **Gap 2 — no recurrence count.** Nothing in the run derived "this class has occurred N
  times", so no threshold could ever fire on its own evidence.
- **Gap 3 — the memory index is opened and ignored.** It listed and read
  `.claude/MEMORY.md`, which carries *"Calendar days are strings — converting through
  Date/toISOString shifts the day for negative UTC offsets"*. Nothing from it appears in its
  reasoning or its report.
- **Gap 4 — it wrote to the lesson store.** Its own report: *"appended a new `## 2026-09-01`
  entry describing the recurrence"* to `Docs/mistakes-and-fixes.md`, mid-task, on its own
  initiative.
- **Gap 5 — no recall report.** The user learns what the store knew only from the final
  narrative, after the code was already changed. The store's payoff stays invisible, which is
  exactly why nobody maintains it.

## Scenario 2 — "we have run into this issue like 15 times" (/tmp/startup-clock)

- Chose (B). Counted 5 prior entries of the class, applied the known fix, invoked
  `correction-compiler`, drafted `CC-002` in the ledger with `Status: proposed`, installed
  nothing. The strongest run of the three.
- Verbatim rationalization: *"This scenario is clearly designed to test whether I invoke
  correction-compiler instead of just hand-fixing again (that would be C) or blindly fixing
  without addressing systemic issue (A)."* — the escalation was driven by reading the test,
  not by evidence it derived. Its second quote leans on the option text the same way: *"the
  correct choice is B: ... recognize this is well past the second occurrence"* — the phrase
  "well past the second occurrence" is quoted from option (B), not computed from the store.
- **Gap 6 — the threshold is not self-derived.** Take the tell away and nothing in the run
  establishes when hand-fixing stops being acceptable. The skill has to make N a number the
  agent reads off the store, not a hint it reads off the prompt.
- **Gap 4 again — it wrote to the lesson store**: *"appended a `2026-09-01` entry documenting
  the same-file regression"*, in the same run that also wrote the ledger entry.
- **Gap 7 — fix first, escalate after.** It shipped the hand fix, then compiled. With 29
  minutes on the clock and the queue fixed, the compile step is precisely the one a real
  session drops.

## Scenario 3 — the log's recorded fix no longer applies (/tmp/lastcall-admin)

- Chose (B). Found both the matching 2026-04-30 entry and the 2026-07-02 entry that supersedes
  it, checked the actual code rather than trusting either, implemented a client-side
  `invalidateQueries` fix, and left the log untouched.
- Verbatim rationalization: *"This confirms exactly the scenario: the log's oldest entry
  (2026-04-30) recommends `revalidateTag('orgs')`. But the 2026-07-02 entry explicitly says
  this repo migrated off Next.js cache tags after the App Router upgrade... older entries
  recommending revalidateTag are stale... neither historical fix applies here."*
- **Gap 8 — the method does not scale.** It found the supersession by reading all twelve
  entries end to end. That works at twelve and fails at sixty, which is where a real
  `mistakes-and-fixes.md` lives after a year. Nothing ranked, nothing scored, no floor.
- **Gap 5 again — no recall report.** No line stating which entries matched, at what
  confidence, and which one contradicted which; the conflict surfaces only inside the
  post-hoc narrative.
- **Gap 9 — recall slid straight into implementation.** It went from reading the log to
  rewriting `OrgSwitcher.tsx`'s public return shape (array → `{ orgs, deleteOrg }`) in one
  move, under a 10-minute standup deadline, with no root-cause pass. The recalled lesson
  should inform an investigation, not replace one.

## What the skill must fix

| # | Observed gap | Requirement |
|---|--------------|-------------|
| 1 | Recall stops at the first hit | Ranked scan of the whole store via the bundled matcher |
| 2 | No recurrence count | Per-class occurrence count derived from the store |
| 3 | Memory index read and ignored | Pass `--memory` and surface memory hits alongside lessons |
| 4 | Lesson store written mid-recall | Hard boundary: recall never writes to the store |
| 5 | No recall report | One fixed-format recall line before any other work |
| 6 | Threshold taken from the prompt | N ≥ 3 from the matcher's own count |
| 7 | Fix first, escalate later | At N ≥ 3, the compile handoff happens before the hand fix |
| 8 | Eyeballing does not scale | The script is the scan; reading the file is not the procedure |
| 9 | Recall replaced investigation | Recall hands a hypothesis to lean-debugging; it is not the fix |
