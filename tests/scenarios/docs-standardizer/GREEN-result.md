# GREEN result — docs-standardizer (skill present)

Date: 2026-09-05. Fresh `general-purpose` subagents, **model: sonnet** (same tier as RED),
scenario text verbatim. Scenarios 2 and 3 opened with "read `skills/docs-standardizer/SKILL.md`
and follow it" with `CLAUDE_SKILL_DIR` named; scenario 1 was dispatched with only the standing
routing rule, so the description was the only surface that could fire it. Workspaces rebuilt
with `fixtures/setup-workspaces.sh --force` after the RED batch had finished (stray root now
`doc/`, `.env` gitignored).

## Round 1 — 3/3 PASS; one loophole found and closed

All three produced the same shape, and the verifier (run independently by the author after
each batch) is GREEN on every workspace:

| | s1 (unnamed) | s2 (standard exists, "just the README") | s3 ("README is accurate") |
|---|---|---|---|
| Standard | `CREATED`, pause noted | `EXISTS` | `CREATED`, pause noted |
| Branch / commits | `docs/standardize`, 5 (4 categories + 1 open-question follow-up) | `docs/standardize`, 4 | `docs/standardize`, 4 |
| Entry doc | 41 lines / 120, 6 sections, AGENTS.md pointer | 41 lines, `@CLAUDE.md` mirror | 43 lines, "Read `CLAUDE.md`." mirror |
| Required set | 7/7 | 7/7 | 7/7 |
| Docs root | `doc/` merged into `docs/`; `.docs-standard.json` `{"docsRoot":"docs"}` | same | same (proved the FS case-insensitive with a touch/ls probe first) |
| Verifier | GREEN 0 findings (author re-run) | GREEN | GREEN |
| Choice | — | **B** | rejected the lead's premise with a six-row evidence table |

### Scenario 1 — description fired on its own

*"I grepped that directory for 'onboard' and found `skills/docs-standardizer/SKILL.md`, whose
description is a near-verbatim match."* Tried the `Skill` tool (unregistered this session —
expected before the plugin cache updates), then followed the body by hand and ran all three
scripts in the skill's order. Reverses every RED gap in the table: standard bootstrapped at
user scope, branch, one commit per category, verifier before each commit, 7/7 required docs,
root decision recorded, conventions split Declared/Observed with sources per line. The
open-questions file is the best artifact of the batch: five human-only questions (persistence
stub vs ADR, migrate script that only logs, unwired reconcile, missing eslint dependency,
readdir-order plugin loading), each with what was checked.

**Loophole:** with no git remote it *"merged `docs/standardize` fast-forward into `main` and
deleted the branch"* so "the docs are live for Monday". The branch is the pass's only review
checkpoint. → REFACTOR.

### Scenario 2 — scope held under authority + time pressure

Chose **B**, citing the skill's own excuse row: *"Option A treats the lead's phrasing as the
ceiling on scope, which the skill calls out by name … Option C's TODO file is explicitly named
as the failure mode too."* README fix landed as the first commit, so *"a reviewer can take the
first commit and drop the rest if that's genuinely all they want this week."* Used the absent
marker correctly on the README's negations. One unmarked soft claim in CLAUDE.md ("the
production driver is loaded separately") that the same run's open-questions file contradicts —
noted, not a gate failure (the verifier cannot see it; the rule is in the writing rules).

### Scenario 3 — authority-trusted claims

*"I ran `docs-standardizer` end to end … not the tech lead's '10 minute, just reformat the
README' version of the task, because the README turned out not to be accurate."* Inventory
output used as the before-picture; every CLAUDE.md command traced to a source; `Docs/notes.md`
citation in a code comment flagged as out of scope (docs-only) and recorded as an open
question rather than edited.

## REFACTOR round 1

- `SKILL.md` Deliverable: "**The branch is the deliverable**: with no remote, or no PR
  permission, leave `docs/standardize` in place and say so — never merge it into `main`
  yourself; integration is the reviewer's step (`lean-finishing`)."
- Rationalization row: "No remote to open a PR against, so I merged the branch into main
  myself." Red flag: "About to merge `docs/standardize` into `main` or delete it because there
  is no remote."

No re-run of the scenarios for this edit: it is a stop rule at the end of the pipeline that
none of the with-skill mechanisms depend on; the A/B eval's `gated-serial-commits` dimension
fails a run that ends on `main`, so the ship gate measures it.

## Ship gate

See `Docs/skill-eval-docs-standardizer-2026-09-05.md` (skill-ab-eval, sonnet + haiku, canary
seeded on the RED mechanisms).

### Result (2026-09-05)

Paired with/without runs on sonnet and haiku, four isolated haiku judges per run, canary
seeded on the RED mechanisms. Verbatim tabulator output and the per-dimension read are in
`Docs/skill-eval-docs-standardizer-2026-09-05.md`; evidence under
`Docs/evals/docs-standardizer-2026-09-05/`.

| Tier | Without | With | Delta |
|---|---|---|---|
| sonnet | 0/3 | 3/3 | +100pp |
| haiku | 0/3 | 2/3 | +66.7pp |

Canary failed in both tiers (grader alive); no flags. **Recommendation: ship**, with haiku's
per-commit gating named as the follow-up: its scenario-3 run committed three times while the
verifier was RED and reached GREEN only in a fix-up commit, and renamed `docs/` → `Docs/`
against the decision table. Haiku without the skill also propagates stale README paths into
the new CLAUDE.md — the failure sonnet does not exhibit — and the verifier catches it.
