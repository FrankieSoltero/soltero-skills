# Memory Garden Queue

Append-only. Flags raised by task-time sessions and by gardening passes for a human or a
later pass to dispose of. Each gardening pass consumes this queue (turning flags into
edit-plan candidates) and deletes consumed lines as part of the pass commit.

- [2026-09-08] flag (skeptic-rejected edit): proposed `distill` of the three
  scheduled-automation entries (2026-07-24 dev-debrief cron log dir, 2026-08-20 cron
  Keychain/"Not logged in", 2026-08-21 stale cloud routine objects) into one rule "a
  scheduled job's trigger firing is not evidence it ran". REJECTED by memory-skeptic:
  the three share a *symptom shape*, not a root cause (missing log directory vs. headless
  cron unable to read Keychain OAuth credentials vs. stale server-side routine objects
  broken by a platform migration), so `distill`'s "≥3 episodes with the same root cause"
  precondition is not met and the rule would over-generalize. The skeptic also rejected
  the proposal's `after` text for pre-writing a `verified-by: memory-skeptic` stamp the
  proposer is not authorized to give. Deferred, not applied. Human decision needed: is
  "the scheduler's success signal is not the job's output" worth recording as a standalone
  *rule* entry that cites the three episodes without absorbing them? That is an addition,
  not a distillation, and is outside what this pass's edit types allow.

- [2026-09-08] flag (path/case split, live defect): the repo's real lessons file is
  `docs/mistakes-and-fixes.md` (lowercase), but every skill defaults to
  `Docs/mistakes-and-fixes.md` (capital D) — `skills/capture-lesson/scripts/append-lesson.mjs:10`
  and `skills/lesson-recall/scripts/recall-lessons.mjs:407`, plus `README.md:59-60` and
  `skills/lesson-recall/SKILL.md`. Both `Docs/` (764 tracked files) and `docs/` (67) exist
  as *distinct* directories in this Linux checkout. Consequence: on Linux/CI, `capture-lesson`
  would create a second, empty `Docs/mistakes-and-fixes.md` and `lesson-recall` would read
  that empty file instead of the real 9-entry one — silently reporting "no prior lessons".
  On the author's case-insensitive macOS APFS volume this is invisible, which is precisely
  the failure documented by the 2026-09-05 entry in the lessons file itself. Not fixed here:
  the gardener's scope is memory surfaces, and this is a skill-code defect.
  Action needed: pick one canonical path and update the skills' defaults to match.

- [2026-09-08] flag (approaching distill threshold, 2 of 3): the `/tmp` vs `/private/tmp`
  entry-point-guard defect has now recurred — `2026-09-02` (swarm-plan.mjs,
  validate-brief.mjs) and `2026-09-07` (token-economy's three scripts). Same root cause,
  same fix (`realpathSync` both sides of the main-guard), and the 2026-09-07 entry states
  the author wrote the new scripts from memory rather than copying the existing guard.
  Two episodes is one short of `distill`'s ≥3 bar, so no edit was proposed this pass.
  A third occurrence should trigger distillation into a rule (and per `lesson-recall`,
  a handoff to `correction-compiler`). Note: the counters on the 2026-09-02 entry were
  left at `h:0/x:0` deliberately — the entry did not mislead, it simply was not recalled,
  and `x` is reserved for entries that steered a session wrong.

- [2026-09-08] flag (approaching distill threshold, 2 of 3): "the verifier was
  self-consistent with the bug" — `2026-09-02` (a main-guard that fails closed to
  "do nothing, exit 0", which reads as PASS to anything checking only the exit code) and
  `2026-09-07` (`economy-setup.mjs` tests asserting `md.includes(protocolBlock())`, i.e.
  comparing the output to the generator's own wrong extraction, so `--check` reported
  `PROTOCOL_BLOCK OK` on garbled output). Two first-party episodes; below the ≥3 bar.
  Re-evaluate at the next occurrence.
