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

- [2026-09-08, RESOLVED 2026-11-08 — distillation proposed and REJECTED; see the first 2026-11-08 flag below] flag: the `/tmp` vs
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

- [2026-09-08] flag (approaching distill threshold, 2 of 3): "the verifier was
  self-consistent with the bug" — `2026-09-02` (a main-guard that fails closed to
  "do nothing, exit 0", which reads as PASS to anything checking only the exit code) and
  `2026-09-07` (`economy-setup.mjs` tests asserting `md.includes(protocolBlock())`, i.e.
  comparing the output to the generator's own wrong extraction, so `--check` reported
  `PROTOCOL_BLOCK OK` on garbled output). Two first-party episodes; below the ≥3 bar.
  Re-evaluate at the next occurrence.

- [2026-11-08] flag (skeptic-rejected edit): proposed `distill` of the three ESM
  entry-point-guard entries (`2026-09-02` swarm-plan.mjs + validate-brief.mjs,
  `2026-09-07` token-economy's three scripts, `2026-09-17` instagram-studio's
  preflight.mjs + check-output.mjs) into one RULE entry retaining all occurrence dates.
  This is the proposal the `[2026-09-08, THRESHOLD NOW MET]` flag above asked this pass to
  make. REJECTED by memory-skeptic, on four grounds: (1) the replacement text **lost
  distinct facts** — the 2026-09-17 Fix line's list of the five files where the old guard
  was then still live, its "they remain open for the defect-class sweep" note, the
  2026-09-07 Lesson's "copy the `isMain()` guard from `swarm-plan.mjs` and test through a
  `/tmp` path before dispatching", the 2026-09-07 eval-copy handicap note, and the
  2026-09-02 Lesson's "or drop the guard for bin-style scripts" option; (2) the proposed
  text **invented a fact** — it asserted "Proximate cause: the guard was written that way
  originally" for the 2026-09-02 episode, which that entry's on-disk Root cause field does
  not say (it records only the string mismatch), i.e. the proposer's inference presented
  as a recorded cause; (3) the three entries' recorded **proximate causes differ**
  (original mismatch / written from memory / deferred-minor at review plus lesson-recall
  not run), so the 2026-09-08 "symptom shape, not a root cause" precedent applies even
  though the code defect is byte-identical; (4) the rule is **redundant** — GP-001 v2 in
  `Docs/golden-principles.md` already states the Wrong/Correct patterns, the symlink-test
  requirement and the silent-exit-0-reads-as-PASS consequence nearly verbatim, with
  detectors in `Docs/defect-classes/esm-entry-guard.rule.json`. Deferred, not applied; the
  three entries are untouched. The skeptic's suggested alternative, for a human or a later
  pass to weigh: keep the three entries intact and add a one-line pointer to GP-001 from
  each — which is not one of this skill's seven edit types, so a human should decide
  whether that is wanted. A re-proposed distillation would have to preserve all of the
  specifics listed in (1) and drop the invented line in (2).

- [2026-11-08] flag (stale claim in a live entry): the `2026-09-17` instagram-studio
  guard entry's **Fix** line says "a repo grep still finds the old guard live in
  skills/destructive-op-gate/scripts/compare-counts.mjs, resolve-target.mjs,
  destructive-shapes.mjs, skills/defect-class-sweep/scripts/sweep.mjs, and
  tools/check-workflow-syntax.mjs", and its **Regression test** line says the repo-wide
  grep "still returns 5 files … they remain open for the defect-class sweep, not fixed by
  this entry". Both claims are **stale as of 2026-11-08**: verified this pass and
  independently by the memory-skeptic, ``grep -rn 'import.meta.url === `file://' skills/
  tools/`` and `grep -rn 'process\.argv\[1\] === fileURLToPath' skills/ tools/` each
  return ZERO hits, so no file is still open for the sweep. A session reading that entry
  today would believe five scripts are still broken. The five filenames are still useful
  as the historical record of which scripts were affected — the stale part is "still
  live" / "remain open". Correcting an entry body is not one of this skill's seven edit
  types (`merge`/`delete`/`distill`/`prune`/`counter`/`flag`/`quarantine`), so this pass
  flagged it rather than editing it. Action needed: a human appends a dated resolution
  line to that entry (the convention the `2026-09-05` entry already uses for its
  "**Recurrence (2026-09-23 …)**" line), or authorises a future pass to do so.

- [2026-11-08] flag (threshold survey, still 2 of 3 — no distill proposed): re-checked
  the `[2026-09-08]` "the verifier was self-consistent with the bug" flag below. The
  nearest candidate third episode is `2026-09-25` ("a skipped required job reports as
  passing"), but its mechanism is a CI gate that never posts a required check name, not a
  test comparing output to the generator's own wrong extraction — an adjacent class ("a
  gate that does not run reads as PASS"), not the same root cause. The other 2026-09-17
  candidates are weaker still: the ffmpeg entry is "the check tests the wrong property"
  (existence vs usability) and the eval-harness entry is a broken measuring instrument.
  The ≥3 same-root-cause bar is therefore **not** met; no distillation proposed this pass.
  Re-evaluate at the next genuine occurrence, and note the 2026-11-08 rejection above:
  identical code mechanism is not by itself sufficient if the recorded proximate causes
  diverge.

- [2026-11-08] flag (provenance gap, not a falsified claim — first found by the 2026-10-08
  pass in unmerged PR #35, re-verified and widened here): commit SHAs cited inside
  `Docs/mistakes-and-fixes.md` entries are **unreachable in this repo**. PR #35 reported
  two; `git cat-file -t` reports **six** are not valid objects: `b5a6e00` and `19293d9`
  (2026-09-17 guard entry), `fada6c9` and `e8c001e` (2026-09-17 ffmpeg and live-render
  entries), `4e2ac9b` (2026-09-17 RED-fixture entry), `39c28e9` (2026-09-17 plan-filename
  entry). All six are branch-local SHAs that did not survive a squash merge (PR #29
  squash-merged as `70ee49b`), so every "fixed in commit <sha>" citation written from
  inside a feature branch is unverifiable once that branch is squashed. This is a
  provenance gap, not evidence the fixes did not happen — the fixes are independently
  confirmed (the `esm-entry-guard` sweep reports 0 matches). **No delete proposed.**
  Action needed: a human decides whether to repoint these to the squash SHAs, and whether
  `capture-lesson` should record the PR number rather than a branch-local SHA — the latter
  is a skill change, which `memory-gardener` is scoped out of.

- [2026-11-08] flag (structural redundancy — first found by the 2026-10-08 pass in
  unmerged PR #35, re-verified here): **12 of 17** entries carry a `- **Symptom:**` bullet
  byte-identical to their own heading line, because
  `skills/capture-lesson/scripts/append-lesson.mjs` writes the same `--symptom` string
  into both the heading and the Symptom line. This wastes roughly a heading's worth of
  tokens per affected entry every time a session loads the file. Deliberately not fixed
  here on two grounds: the root cause is in a skill script, which this skill is scoped out
  of, and rewriting 12 entry bodies is not one of the seven edit types. Action needed: fix
  `append-lesson.mjs` so the Symptom bullet is omitted when it would duplicate the
  heading, then let a later pass or a human drop the redundant bullets.
