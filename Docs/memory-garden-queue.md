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

- [2026-09-08] flag (approaching distill threshold, 2 of 3): "the verifier was
  self-consistent with the bug" — `2026-09-02` (a main-guard that fails closed to
  "do nothing, exit 0", which reads as PASS to anything checking only the exit code) and
  `2026-09-07` (`economy-setup.mjs` tests asserting `md.includes(protocolBlock())`, i.e.
  comparing the output to the generator's own wrong extraction, so `--check` reported
  `PROTOCOL_BLOCK OK` on garbled output). Two first-party episodes; below the ≥3 bar.
  Re-evaluate at the next occurrence.

- [2026-10-08] flag (skeptic-rejected edit): proposed `distill` of the three ESM
  entry-point-guard entries (2026-09-02 `swarm-plan.mjs`/`validate-brief.mjs`, 2026-09-07
  token-economy ×3, 2026-09-17 instagram-studio ×2 incl. its 2026-09-25 fifth-occurrence
  recurrence) into one rule entry. This closes the 2026-09-08 "THRESHOLD NOW MET" flag,
  which asked this pass to put the distillation to a skeptic. REJECTED by memory-skeptic.
  The skeptic confirmed the ≥3 bar *is* met and that the shared root cause is genuine (an
  unresolved `process.argv[1]` compared with the symlink-resolved `import.meta.url`), and
  explicitly rejected the counter-argument that entries B/C are a different root cause —
  their `lesson-recall`-timing and detector-width lessons are secondary lessons about the
  same defect. It rejected on three other grounds: (1) the proposed `after` text dropped
  specifics present in the sources — entry B's process root cause ("the author wrote new
  scripts from memory instead of copying the guard those files already carry"), B's
  instruction to copy the `isMain()` guard from `swarm-plan.mjs` and test through a `/tmp`
  path before dispatching, B's note that the fix was verified from a `/tmp` copy, and
  entry A's alternative "or drop the guard for bin-style scripts"; (2) the distilled rule
  would be largely redundant with `Docs/golden-principles.md` GP-001 v2, which already
  carries the wrong pattern, the correct `isMain()`, the CI hard gate, the symlink-test
  requirement and an Origin section citing the same dates and sweep counts — so absorbing
  three episodic records buys little and destroys per-episode history; (3) retitling to
  2026-09-25 would break date-keyed references that live outside this file
  (`Docs/specs/docs-standardizer.md:100` and `Docs/skill-eval-token-economy-2026-09-07.md:122`
  both cite "lesson 2026-09-02", and the 2026-09-07/2026-09-17 entries cross-cite each other).
  Deferred, not applied. **Human decision needed:** the skeptic's own cheaper alternative is
  to keep all three entries and add a one-line pointer to GP-001 on each. That is an
  addition, not a distillation, and is outside what this pass's edit types allow — the same
  boundary the 2026-09-08 scheduled-automation flag ran into. Resolving both may need a new
  additive edit type (`annotate`) in `skills/memory-gardener/references/operations.md`.

- [2026-10-08] flag (unverifiable commit SHAs in an entry, NOT falsified): the 2026-09-17
  instagram-studio entry cites commits `b5a6e00` and `19293d9` for the guard fix; `git
  cat-file -t` reports neither is a valid object in this repo. The entry says the work was
  on branch `feat/instagram-studio`, and PR #29 landed squash-merged (`70ee49b`), so the
  branch SHAs are legitimately unreachable rather than wrong — this is a provenance gap,
  not a falsified claim, and NO delete was proposed. Action needed: a human may want to
  re-point those SHAs at `70ee49b`, or the lessons template may want to record the merge
  commit rather than branch-local SHAs, which do not survive a squash merge.

- [2026-10-08] flag (structural redundancy across the surface, needs a skill fix not a
  memory edit): 12 of 17 entries in `Docs/mistakes-and-fixes.md` have a `- **Symptom:**`
  bullet whose text is byte-identical to the entry's own `##` heading (lines 23, 32, 41,
  50, 87, 96, 104, 112, 120, 128, 136, 144 as of this pass). Cause is deterministic, not
  per-entry sloppiness: `skills/capture-lesson/scripts/append-lesson.mjs` writes the same
  `--symptom` string into both the heading (line 28) and the Symptom bullet (line 30).
  Every entry written by that script will carry the duplication. Deliberately NOT fixed
  here: de-duplicating 12 entries is not one of this pass's edit types, and the real fix is
  in a skill, which `memory-gardener` is scoped out of ("Editing skills or reference docs —
  memory surfaces only"). Action needed: have `capture-lesson` derive a short heading
  separately from the symptom, then a later pass can retire the redundant bullets.

- [2026-10-08] flag (re-evaluated, still below bar): this pass re-examined the 2026-09-08
  "verifier was self-consistent with the bug" flag (2 of 3) against the seven entries added
  since. Candidates for a third episode are 2026-09-17's ffmpeg entry (a PATH shim file
  named `ffmpeg` passed a preflight that only checks existence) and 2026-09-17's A/B
  transcript harness (the report claimed blinding nobody grepped for). Assessment: these are
  three *distinct* mechanisms sharing one symptom shape — a tautological assertion
  (output compared to the generator's own extraction, 2026-09-07), a guard that fails closed
  to a silent `exit 0` (2026-09-02, already covered by GP-001), and an existence check
  standing in for a usability check (2026-09-17 ffmpeg). That is precisely the ground the
  2026-09-08 scheduled-automation distill was rejected on, so no `distill` was proposed this
  pass. Re-evaluate when two episodes share one of those mechanisms exactly.
