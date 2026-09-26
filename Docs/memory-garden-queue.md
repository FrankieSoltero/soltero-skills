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

- [2026-09-08, RESOLVED 2026-09-23 by PR #31] flag (path/case split, live defect): the
  repo's real lessons file was `docs/mistakes-and-fixes.md` (lowercase) while every skill
  defaulted to `Docs/mistakes-and-fixes.md` (capital D) — `skills/capture-lesson/scripts/append-lesson.mjs:10`
  and `skills/lesson-recall/scripts/recall-lessons.mjs:407`, plus `README.md:59-60` and
  `skills/lesson-recall/SKILL.md`. Both `Docs/` and `docs/` existed as *distinct*
  directories on Linux, so `capture-lesson` would have created a second, empty
  `Docs/mistakes-and-fixes.md` and `lesson-recall` would have read that empty file —
  silently reporting "no prior lessons". Invisible on the author's case-insensitive macOS
  volume, which is precisely the failure the 2026-09-05 entry documents.
  **Resolved independently of this pass:** PR #31 collapsed the split by renaming `docs/`
  → `Docs/` at the index level (blob SHAs unchanged) and recorded the recurrence on the
  2026-09-05 entry. No action needed; retained here as the audit trail for how the flag
  was closed. Detection command for the future: `git ls-files | cut -d/ -f1 | sort -u |
  sort -f | uniq -di` — any output is a case-split tree.

- [2026-09-08, THRESHOLD NOW MET — re-evaluate next pass] flag: the `/tmp` vs
  `/private/tmp` entry-point-guard defect stood at 2 episodes when this pass ran
  (`2026-09-02` swarm-plan.mjs + validate-brief.mjs; `2026-09-07` token-economy's three
  scripts), one short of `distill`'s ≥3 bar, so no edit was proposed. It has since
  reached **four**: the `2026-09-17` instagram-studio entry records the fourth shipment,
  and PR #30 (GP-001) fixed the guard across five scripts with a CI hard gate.
  The ≥3 bar for `distill` is now satisfied on a genuinely identical root cause — the
  next pass should propose that distillation to a skeptic (and per `lesson-recall`, the
  3+ threshold routes to `correction-compiler` / `defect-class-sweep`). Note the
  2026-09-17 entry states a repo grep still finds the old guard live in five files
  (`destructive-op-gate` ×3, `defect-class-sweep/sweep.mjs`, `tools/check-workflow-syntax.mjs`).
  Counters on the 2026-09-02 entry stay `h:0/x:0` deliberately — it did not mislead, it
  simply was not recalled, and `x` is reserved for entries that steered a session wrong.

- [2026-09-26] flag (counters owed on new entries): seven entries landed on
  `Docs/mistakes-and-fixes.md` after this pass inventoried the file — six dated
  `2026-09-17` (instagram-studio guard/worktree/eval-harness/fixture/ffmpeg/plan-filename
  and the live-render gap) and one `2026-09-25` (PR #31's required-check name blocked by
  a Node matrix). They carry no `meta:` line. This pass deliberately did **not** annotate
  them: they were never inventoried or provenance-assessed here, and adding them during a
  merge-conflict resolution would widen the PR past what was reviewed. Action needed: the
  next pass inventories all sixteen entries and adds counters/provenance to these seven.

- [2026-09-08] flag (approaching distill threshold, 2 of 3): "the verifier was
  self-consistent with the bug" — `2026-09-02` (a main-guard that fails closed to
  "do nothing, exit 0", which reads as PASS to anything checking only the exit code) and
  `2026-09-07` (`economy-setup.mjs` tests asserting `md.includes(protocolBlock())`, i.e.
  comparing the output to the generator's own wrong extraction, so `--check` reported
  `PROTOCOL_BLOCK OK` on garbled output). Two first-party episodes; below the ≥3 bar.
  Re-evaluate at the next occurrence.
