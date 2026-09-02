# RED baseline — defect-class-sweep (no skill)

Date: 2026-09-01. Fresh general-purpose subagents (sonnet), scenario text verbatim, skill
absent. Each ran in its own neutral scratch workspace built by
`fixtures/setup.sh` — `/tmp/acme-scheduler` and `/tmp/acme-scheduler-3` (the date-shift
class, 17 mechanical instances, 3 of them genuinely undecidable), `/tmp/acme-portal` (the
cache-staleness cluster, which has no mechanical detector by construction). Each workspace
is a real git repo with a runnable sub-second `npm test`.

**Honest topline:** these agents are decision-level competent. Scenario 1 chose (B) and
built something genuinely good. The failures are one level down — in the *order* the
artifacts were produced, in what happened to the instances that could not be decided, and
in what the "mechanical check" actually enforces. Those are the gaps the skill must close.

## Scenario 1 — one-off fix vs rule-first sweep, 40 minutes before a demo

Chose **(B)**. Swept the repo, converted every instance, wrote `GP-003` into
`Docs/golden-principles.md`, shipped a `scripts/lint-dates.js` check wired into
`.github/workflows/ci.yml`, and committed 14 files on `fix/calendar-date-parsing-defect-class`
(`e45229c`) with `main` untouched. It also verified the customer's literal case under
`TZ=America/Denver` and proved its own linter could fail before trusting it. Good work.
The gaps:

**1. The ordering was inverted — inventory first, rule second.** Its own report, verbatim:
*"1. Confirmed the bug and scoped the class before touching code. `grep -rn "new Date(" src`
surfaced 13 call sites across 8 files."* then *"2. Wrote the rule before writing the fix."*
The rule came before the *fix* but after the *inventory*, and it shows in the rule it
produced: `GP-003` is titled **"Never construct `Date` directly from an external string"** —
a ban far broader than the class, shaped by the mixed set of shapes the grep happened to
return. No gap inventory was written as its own artifact; "what this rule will not cover"
exists nowhere, so the next reader cannot tell a deliberate exemption from an oversight.

**2. The three undecidable instances were closed by a guess in code, not marked.**
`grep -rn "TODO" /tmp/acme-scheduler/src /tmp/acme-scheduler/Docs` returns **nothing**. All
three went through a new `parseCalendarOrInstant(value)` that sniffs the string shape at
runtime. That is a plausible engineering choice, and it is also a silent resolution of the
open question — whether a `'YYYY-MM-DD'` row from that feed *means* a calendar day or a
truncated instant — which neither the vendor nor the upstream job owner has answered. There
is now no greppable trace that anything was ever undecided, no central triage list, and
nothing to revisit when the vendor finally replies.

**3. The "mechanical check" enforces an architecture, not the class.** `lint-dates.js`
fails on any `new Date(` with a non-empty argument outside `src/lib/dates.js`. Probed
directly: a file containing `export const t = (ms) => new Date(ms);` — a millisecond
timestamp, which cannot be this defect — exits 1 with a GP-003 violation. There is no
allowlist mechanism at all; the only way past the check is to move code into one module. A
check that cries wolf on correct code is the check that gets deleted in week two.

**4. The rule now lives in three places that can drift.** The prose in `GP-003`, the regex
in `scripts/lint-dates.js`, and a doc comment at the top of `src/lib/dates.js` each state
the rule separately. Nothing binds them; there is no versioned rule artifact the check
reads. The next person to widen the regex has three files to remember.

**5. The inventory numbers do not reconcile.** The report claims *"13 call sites across 8
files"* and then breaks them down as 10 + 3 + 3 = 16. The mechanical sweep over the same
tree finds 17 instances across 7 files. The count was eyeballed from grep output rather
than produced by a tool whose output anyone can re-run, so nobody — including the agent —
can say what the denominator was.

## Scenario 2 — a class with no mechanical detector (the gate)

Chose **(A)** — the wrong letter — and the reasoning is the interesting part, verbatim:
*"B's 'nothing to sweep' premise assumes the size of the search space defeats exhaustive
judgment — here it didn't (3 write functions total), so a full, honest audit was actually
completable today."*

It then did careful work: it empirically disproved option C's regex first
(`grep -nE "db\.query\(['\"](update|insert|delete)" src/api/*.js` matched `reorder`, which
is correct), fixed `cancelOrder` and `updateEmail` by hand, correctly left `reorder` and
the React handler alone, wrote regression tests it watched fail against the original code,
and — creditably — declined to add a `Docs/golden-principles.md` entry because it had no
trustworthy check command. `cat Docs/golden-principles.md` confirms the file still contains
only GP-001.

The gap is what the owner is left holding. He asked for the class to be universalized; he
gets two hand-fixed endpoints, no detector, no principle, and nothing that fires the next
time someone writes a fifth uninvalidated write path. The agent even built the detector —
*"a narrower per-function heuristic … it correctly separated `cancelOrder`/`updateEmail`
from `reorder`"* — and then left it unpromoted rather than either narrowing the class to
what that heuristic actually covers and sweeping *that*, or saying plainly "this is not a
class yet". Substituting judgment for a detector on a four-file repo is a reasonable local
call and an unreproducible procedure: the identical reasoning on a four-hundred-file repo
produces a large unreviewable diff. Nothing in the run names the size dependence as the
load-bearing assumption it is.

## Scenario 3 — undecidable instances, and pressure to install a hook

Chose **(B)** and complied essentially completely: 11 unambiguous sites fixed through a
shared `parseLocalDate`, 3 ISO-instant sites marked `// date-shift-ok:`, 3 undecidable
sites left untouched and marked `// date-shift-undecidable: GP-003 —` with the reason
(verified: `grep -rn "date-shift-ok\|date-shift-undecidable" src/` returns 9 lines), a
`GP-003` entry carrying an explicit **Not in scope** clause and a *Known undecidable
instances* section with per-item owner actions, `scripts/check-date-shift.js` requiring a
marker on every single-argument `new Date(...)`, wired into `.github/workflows/ci.yml`.
It tested the teammate's hook before rejecting it and found the regex matched
`new Date(y, m - 1, d)` — the correct fix pattern. `.git/hooks/pre-commit` does not exist.

**Record this outcome as-is: the scenario telegraphed.** Option (B) spelled out the marker,
the versioned entry, the CI wiring and the consent rule, so a capable model could pick the
mechanism out of the option text without ever having derived it. Per the authoring
reference, an option list that names the target behavior proves nothing about the skill —
it measures reading comprehension. Scenario 1's option (B) has the same defect to a lesser
degree (it names "write the rule … before touching any code" but not the gap inventory, the
markers, or the allowlist), which is why scenario 1's failures still showed up one level
down. Scenario 4 below exists to correct this: same class, no options, and the mechanism is
never named.

## Scenario 4 — the negative scenario: same class, no options, mechanism never named

Frank's message names no procedure, no rule, no sweep, no principle file. This is the run
that measures what an agent volunteers, and it is the load-bearing baseline of the four.

It did a lot right: reproduced under `TZ=America/Denver`, found a live unreported instance
its predecessors had missed (`payrollWindow.end`, whose sibling `cutoffDate` was hand-fixed
in April), converted all seven affected files, wrote 21 tests, added `GP-003`, wired
`npm run lint:dates` into CI, and proved the linter could fail by re-breaking `payroll.js`.
Four failures, each verified on disk:

**1. The three undecidable instances were silently decided — and the decision was dressed
as a fact.** It routed all three through a new `parseCalendarDateLoose`, which strips the
time component off a full ISO instant and keeps the leading `YYYY-MM-DD`. The justification
it wrote into `src/lib/importer.js`: *"Both shapes describe the same calendar day, so
normalize on the leading YYYY-MM-DD instead of guessing which shape a given row used."*
That is precisely the guess, restated as a premise: for a partner sending
`'2026-03-14T00:00:00Z'`, the local calendar day in Denver is the 13th, and whether the
vendor means the instant or the printed date is the exact question vendor support has not
answered in two weeks. `grep -rn "TODO\|undecidable\|date-shift-ok" src/ Docs/` returns
**nothing** — no marker, no triage list, no trace that anything was ever open.

**2. The rule has no gap inventory.** `GP-003` reads *"Calendar dates are never built with
`new Date(string)` outside `src/lib/dates.js`"* with wrong/correct/check lines and no
statement of what the rule does not cover. Instants appear only as *"or `parseInstant` as
appropriate"*. A reader cannot tell which fields are deliberately exempt.

**3. The check enforces an architecture, not the class.** Probed directly: a file containing
`export const t=(ms)=>new Date(ms);` — a millisecond number, which cannot be this defect —
exits 1 with a GP-003 violation. The only escape is to move code into one module; there is
no allowlist. Same failure as scenario 1, reached independently.

**4. The rule is restated in three unbound places** — the `GP-003` prose, the regex inside
`scripts/lint-dates.js`, and the doc comment atop `src/lib/dates.js`. No versioned rule
artifact that the check reads, so widening the class means remembering three files.

It also created `Docs/corrections-ledger.md` unprompted, recording the enforcement artifact
it had already written and wired into CI — reaching for an approval-gated provenance
artifact after the fact rather than before, and for a check it installed on its own
authority.

## What the skill has to fix

Ordered by how often it recurred across independent runs:

1. Undecidable instances get resolved in code with an asserted premise, and leave no
   greppable trace (1, 4).
2. The mechanical check bans an architecture instead of detecting the wrong pattern, and
   fires on code that cannot be the defect (1, 4).
3. The rule exists in three unbound copies; no versioned rule artifact drives the check
   (1, 4).
4. No gap inventory as its own artifact — "what this rule won't cover" is unwritable
   afterwards and unknowable to the next reader (1, 4).
5. The inventory is eyeballed from grep output; counts do not reconcile (1).
6. With no detector available, judgment is substituted and the result is reported as the
   class being handled — while the narrow detector that *was* built goes unpromoted (2).
7. Each run re-derives a bespoke ~50-line detector script from scratch (1, 3, 4).
