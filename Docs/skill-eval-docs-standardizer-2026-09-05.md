# Skill efficacy eval — docs-standardizer — 2026-09-05

Tree under test: working tree at `main` `34757f3` + the uncommitted `docs-standardizer` batch
(spec, SKILL.md after REFACTOR round 1, the four scripts, reference, templates, default
standard) — the exact content proposed for 1.0.25.
Tiers and pinned model ids: sonnet=`claude-sonnet-5`, haiku=`claude-haiku-4-5-20251001` (both
via the `Agent` tool's `model` option; the with-arm SKILL.md was loaded by prepending its full
text to the scenario, per `skill-ab-eval/references/judging.md`; each run read its prompt file
so the two arms were byte-identical apart from the skill block).
Judge design: isolated single-dimension judges, `Unknown` escape, model=`claude-haiku-4-5-20251001`,
one call per dimension per run (56 calls; 14 re-dispatched after the 20-concurrent-subagent
cap rejected the first launch; 3 verdicts recovered verbatim from a judge's final message
when its file write did not land, marked `recovered_from` in the JSON), each judge given the
blinded transcript and the run's artifacts under a neutral `run-NN/` name (repo docs,
`git-log.txt`, `home-standard.json`, and `verify.txt` from the bundled verifier run after the
run finished).

Evidence directory: `Docs/evals/docs-standardizer-2026-09-05/` — blinded transcripts
(`transcripts/`), copied artifacts (`artifacts/`), every judge verdict (`verdicts/`),
`runs.json` consumed by the tabulator, `dimensions.json`, `manifest.json`, `runs.tsv`, and
the harness scripts.

## Paired results (verbatim from `paired-table.mjs --md`)

| Tier | Scenario | Without skill | With skill |
|---|---|---|---|
| sonnet | scenario-1 | fail | pass |
| sonnet | scenario-2 | fail | pass |
| sonnet | scenario-3 | fail | pass |
| haiku | scenario-1 | fail | pass |
| haiku | scenario-2 | fail | pass |
| haiku | scenario-3 | fail | fail |

### Per-tier delta

| Tier | Without | With | Delta | Unknown verdicts |
|---|---|---|---|---|
| sonnet | 0/3 (0%) | 3/3 (100%) | +100pp | 0 |
| haiku | 0/3 (0%) | 2/3 (66.7%) | +66.7pp | 0 |

### Canary

`canary` (without-skill arm): sonnet=fail, haiku=fail — failed as designed, so the grader is
proven alive for this batch. Sonnet's canary did write a standard at user scope (a markdown
checklist, prompted by the "six more repos" cue) but after writing the repo docs, on `main`,
in one commit, with the required set incomplete; haiku's recorded the "way to do all of them"
in a commit message only. Both fail three of four dimensions — the mechanisms the canary was
seeded from (every RED baseline missed the same three).

### Judge disagreements

None (script output). Flags: none. Exit 0.

## Per-dimension breakdown

Rubric: one dimension per hard rule of the skill — standard read/created at user scope before
writing; branch + category-scoped commits + a claim verifier run green before the last commit;
the required set complete under one root within the entry-doc budget; every command/path claim
true (negations and markers excepted).

| Tier | Scenario | Arm | standard-at-user-scope | gated-serial-commits | required-set-complete | claims-true | Verdict |
|---|---|---|---|---|---|---|---|
| sonnet | scenario-1 | with | pass | pass | pass | pass | pass |
| sonnet | scenario-1 | without | fail | fail | fail | pass | fail |
| sonnet | scenario-2 | with | pass | pass | pass | pass | pass |
| sonnet | scenario-2 | without | pass | fail | fail | pass | fail |
| sonnet | scenario-3 | with | pass | pass | pass | pass | pass |
| sonnet | scenario-3 | without | fail | fail | fail | pass | fail |
| sonnet | canary | without | fail | fail | fail | pass | fail |
| haiku | scenario-1 | with | pass | pass | pass | pass | pass |
| haiku | scenario-1 | without | fail | fail | fail | fail | fail |
| haiku | scenario-2 | with | pass | pass | pass | pass | pass |
| haiku | scenario-2 | without | pass | fail | fail | pass | fail |
| haiku | scenario-3 | with | pass | fail | pass | pass | fail |
| haiku | scenario-3 | without | fail | fail | fail | fail | fail |
| haiku | canary | without | fail | fail | fail | fail | fail |

## What the transcripts show (author's read, not the judges')

- **Sonnet without the skill is a good writer and a non-standardizer.** All three sonnet
  baselines verified the README's commands against the manifest (claims-true pass), and all
  three committed once on `main`, none ran a claim check on their own output, none produced
  the required set, and only scenario 2 (where the standard already existed) read it — then
  chose A and deferred it. Same picture as RED.
- **Haiku without the skill propagates stale claims.** Scenario 3's baseline caught the
  README's wrong *commands* and still listed `config/` and `docs/ARCHITECTURE.md` as existing
  in CLAUDE.md's "Project Structure" (verified in `artifacts/run-13/CLAUDE.md:48,50`);
  scenario 1's wrote 500+ lines across six files plus a HANDOFF.md with example paths
  presented as real. The RED note that "stale-claim propagation is not a sonnet failure"
  stands; it is a haiku failure, and the skill's verifier catches it (both haiku with-arm
  runs that passed ended GREEN).
- **The haiku gap (scenario 3, with):** the run followed the pipeline — standard `CREATED`,
  branch, four commits, all seven docs, entry doc 45 lines, final verifier GREEN — but
  committed three times while the verifier was RED (transcript lines 432, 557, 1074, 1137,
  1190, 1414: RED before each commit; GREEN only at 1503 after a "fix verifier findings"
  commit) and renamed `docs/` → `Docs/` via `git mv` on a case-insensitive filesystem, which
  the reference's decision table says never to do unasked. Judge verdict: fail on
  gated-serial-commits, correct. Haiku treats the verifier as an end-of-pass check, not a
  per-commit gate. Scenario 2's haiku run (pass) collapsed four categories into two commits
  (reconcile + entry doc together) — the judge accepted "two or more scoped commits"; the
  skill asks for four.
- **Judge calibration checked by hand on the claims-true dimension**, the one that reads a
  mechanical artifact: run-04 (sonnet s2 without) and run-02 (sonnet s1 without) carry
  `PATH_MISSING` lines from the verifier that sit inside wrapped negations ("No `Docs/` root,
  … or `open-questions.md`"); both judges applied the negation exception and passed — the
  right call, and a known verifier limit (line-level absence heuristic). run-13's fail was
  checked against the artifact and is a real stale claim.
- **Verifier false positives surfaced by the without arms**, recorded for a post-eval script
  fix, not a skill edit during the eval: a URL path (`/entries`) and an extension chain
  (`.test.js`) were read as repo paths; placeholder example paths (`src/plugins/my-plugin.js`)
  are correctly flagged and belong under `(unverified)`.

## Recommendation

**ship.** Both tiers move: sonnet +100pp, haiku +66.7pp; the canary failed on both tiers; no
flags. The named follow-up is haiku's per-commit gating (commits while the verifier is RED,
and a case-only root rename) — it is a stop-rule the body states in three places already, so
the repair is a scenario-4 RED/GREEN on haiku with a sharper "RED means no commit, not
commit-then-fix" line, not a rewrite. Post-eval script fix: skip absolute/URL paths and
extension chains in claim extraction (tests added), noted in the CHANGELOG.
