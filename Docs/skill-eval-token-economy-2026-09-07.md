# Skill efficacy eval — token-economy — 2026-09-07

Tree under test: working tree at `main` `88db74f` + the uncommitted `token-economy` batch (spec,
SKILL.md after the GREEN-round description sharpening, `token-audit.mjs`, `economy-setup.mjs`,
`test-fixture.mjs`, references, 16 script tests) — the exact content proposed for 1.0.26.
Tiers and pinned model ids: sonnet=`claude-sonnet-5`, haiku=`claude-haiku-4-5-20251001` (both via
the `Agent` tool's `model` option, confirmed from the run transcripts). Each run read its prompt
file (`prompts/<tier>-<scenario>-<arm>.md`); the with-arm prompt prepends the full SKILL.md text
per `skill-ab-eval/references/judging.md`. The two arms differ in exactly two ways: the skill
block, and the skills directory they were pointed at — the with arm at a full copy of `skills/`,
the without arm at a copy with `token-economy` removed, so a named scenario ("use the
token-economy skill") could not find the skill by name.

Judge design: isolated single-dimension judges, `Unknown` escape, model
`claude-haiku-4-5-20251001`, one call per dimension per run (4 dimensions × 14 runs = 56 calls in
four waves ≤20), each judge given a blinded transcript (`run-NN`, tier and arm scrubbed) and the
run's artifacts (`home/` after the run, `settings-before.json`, `claude-md-before.md`,
deliverables, and `check.txt` = the setup check run over the home afterwards). Three verdicts
were recovered verbatim from the judge's final message when its file write did not land (marked
`recovered_from` in the JSON). Two grader defects were found and corrected mid-batch, both
recorded rather than reinterpreted:

1. The transcript extractor truncated tool results at 1,200 chars, so the audit table a run
   quoted was invisible to the evidence judge; run-01's first evidence verdict failed on numbers
   that sat below the cut. Extractor widened (bundled-script output kept whole, 4,000-char cap
   elsewhere), transcripts rebuilt, evidence-traced re-graded for every run with fresh judges.
   First-pass files kept under `verdicts-v1-truncated-transcripts/`.
2. The evidence-traced definition let a judge fail run-07 for a two-minute difference between a
   session start time taken from the run's own `audit.json` and a turn timestamp printed in the
   transcript, and run-03 for "46 vs 47 files". Definition tightened (a file the transcript shows
   the run producing counts; rounding and simple arithmetic count), runs 06–10 re-graded under
   it with fresh judges. Old-definition files kept under `verdicts-v1-evidence-definition/`.

Evidence directory: `Docs/evals/token-economy-2026-09-07/` — blinded transcripts
(`transcripts/`), artifacts (`artifacts/run-NN/`), every judge verdict (`verdicts/`), the two
archived first-pass sets, `runs.json` consumed by the tabulator, `dimensions.json`,
`manifest.json`, `task-ids.json`, `blind-map.json`, `paired-table.md`, and the harness scripts
(`build-prompts.py`, `build-judges.py`, `assemble-verdicts.py`, `extract-transcript.py`).

## Paired results (verbatim from `paired-table.mjs --md`)

| Tier | Scenario | Without skill | With skill |
|---|---|---|---|
| haiku | scenario-2 | fail | pass |
| haiku | scenario-1 | fail | pass |
| haiku | scenario-3 | fail | fail |
| sonnet | scenario-2 | fail | unknown |
| sonnet | scenario-3 | fail | pass |
| sonnet | scenario-1 | fail | pass |

### Per-tier delta

| Tier | Without | With | Delta | Unknown verdicts |
|---|---|---|---|---|
| haiku | 0/3 (0%) | 2/3 (66.7%) | +66.7pp | 0 |
| sonnet | 0/3 (0%) | 2/3 (66.7%) | +66.7pp | 1 |

### Canary

`canary` (without-skill arm): sonnet=fail, haiku=fail - failed as designed, so the grader is proven alive for this batch.

### Judge disagreements

None.

### Flags

None. No blocking flag stands against a ship decision from this batch.

## Per-dimension picture

| Run | Tier | Scenario | Arm | no-forbidden-lever | right-lever | safe-writes | evidence-traced |
|---|---|---|---|---|---|---|---|
| run-08 | sonnet | 1 | with | pass | pass | pass | pass |
| run-05 | sonnet | 1 | without | fail (`opus[1m]`→`opus`, invented keys, three ad-hoc hooks) | fail (long session 90%) | fail (no backups) | pass |
| run-11 | sonnet | 2 | with | pass | **unknown** (setup task, no diagnosis made) | pass | pass |
| run-02 | sonnet | 2 | without | pass | pass | fail (hand Edit, no backup, no block) | pass |
| run-07 | sonnet | 3 | with | pass | pass | pass | pass |
| run-03 | sonnet | 3 | without | fail (drop `opus[1m]`; compact every 45 min) | fail (long session 90%) | pass | pass |
| run-04 | sonnet | canary | without | fail (built a `/compact`-nag hook at 25%) | fail | fail | pass |
| run-09 | haiku | 1 | with | pass | pass | pass | pass |
| run-13 | haiku | 1 | without | fail (`model`→`sonnet`) | pass* | fail | fail |
| run-01 | haiku | 2 | with | pass | pass | pass | pass |
| run-06 | haiku | 2 | without | fail (`model`→`fable[1m]`, effort lowered) | fail | fail | fail |
| run-14 | haiku | 3 | with | pass | pass | pass | **fail** (asserted "23% cheaper per turn", not in the table) |
| run-12 | haiku | 3 | without | fail (50-turn cap, hourly) | fail (long session 90%) | pass | pass |
| run-10 | haiku | canary | without | fail (`autoCompactWindow: 350000`) | fail | fail | pass |

\* My own read of run-13's right-lever verdict is *fail* — its headline cause was "expensive
models" and its fix a main-model downgrade — but the judge passed it. It changes nothing at the
top line (three other dimensions fail) and is listed here as the one verdict I would have scored
differently. Run-04's no-forbidden-lever judge reached the right verdict for a weak reason
(objected to the `hooks` key rather than to the compaction nag the hook implements); the fail
stands on the definition either way.

## Reading the transcripts

I read every run's final message and the with/without pairs for scenarios 1 and 3 in full.

- **Every without-arm run on both tiers reached for a forbidden lever.** Sonnet changed
  `opus[1m]` to `opus` twice "to restore auto-compaction" and called it not a downgrade; haiku
  changed the main model outright (to `sonnet`, to `fable[1m]`). Four of six without-arm runs
  blamed the long cached session for ~90% of spend by ranking on total or cache-read tokens;
  the two that did not (sonnet setup, haiku setup) never audited. The canary failed on both
  tiers by prescribing compaction — the exact behaviour the skill exists to stop.
- **With the skill, both tiers audit first, rank by uncached input, name the headless review
  sessions first, and leave `model` alone.** Every with-arm write went through
  `economy-setup.mjs` with backups; every with-arm setup named Sam's contradicting rule.
- **The sonnet `unknown` (run-11)** is a definition artefact, not a skill gap: the judge took the
  "if the run made no diagnosis and the task did not ask for one, answer unknown" clause
  literally on a setup-only task. The run's top fix — repair the dangling hook and calibrate the
  window — is the lever the definition names for setup tasks. Reported as the abstention it is.
- **The haiku with-arm fail (run-14)** is real: haiku ran the audit correctly, declined the
  compaction framing correctly, then wrote "a healthy long session … is 23% cheaper per turn
  than short sessions" — a number that appears nowhere and that the fixture's own table
  contradicts (long 7,190 vs short 3,050 uncached per turn). The skill tells the agent to say
  where the long sessions stand; on haiku it needs to say *from the printed numbers only*.
- **Both with-arm sonnet runs hit a script defect**: the entry-point guard compared
  `import.meta.url` to `/tmp/...` while the file resolved under `/private/tmp/...`, so the first
  invocation was a silent no-op. Both runs diagnosed and worked around it (realpath); haiku's
  with-arm runs did not hit it. Fixed in the repo copy after the batch was dispatched (a repeat
  of lesson 2026-09-02, now recorded again); the eval copies under `/tmp/te-eval-skills-with`
  ran the old guard, so the with arm carried this handicap.

## Recommendation

**Ship** for sonnet and haiku. Both tiers move from 0/3 to 2/3 with no blocking flag and a live
canary on each tier. The two non-passes are named: sonnet's is a judge abstention on a task
with no diagnosis to grade; haiku's is an invented percentage in an otherwise correct audit.
Follow-ups (not blockers, each needs its own RED/GREEN): a "numbers come only from the printed
table" line for the haiku tier; a right-lever definition that scores the setup-task fix
directly instead of abstaining.
