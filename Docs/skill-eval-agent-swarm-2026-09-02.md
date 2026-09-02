# Skill efficacy eval — agent-swarm — 2026-09-02

Tree under test: working tree at `main` `49e2ba4` + the uncommitted `agent-swarm` batch (spec,
SKILL.md after REFACTOR round 1, planner, runner, reference), i.e. the exact content proposed for
0.24.0.
Tiers and pinned model ids: sonnet=`claude-sonnet-5`, haiku=`claude-haiku-4-5-20251001` (both
via the `Agent` tool's `model` option; the with-arm SKILL.md was loaded by prepending its full
text to the scenario, per `skill-ab-eval/references/judging.md`).
Judge design: isolated single-dimension judges, `Unknown` escape, model=`claude-haiku-4-5-20251001`,
one call per dimension per run (56 first-pass calls + 4 sharpened re-grades), each judge given
the blinded transcript and the run's written artifacts under a neutral `run-NN/` name.

Evidence directory: `Docs/evals/agent-swarm-2026-09-02/` — blinded transcripts (`transcripts/`),
copied artifacts (`artifacts/`), every judge verdict file (`verdicts/`), `runs.json` consumed by
the tabulator, `dimensions.json`, `manifest.json` (run → agent id → tier/scenario/arm), and the
harness scripts.

## Paired results (verbatim from `paired-table.mjs --md`)

| Tier | Scenario | Without skill | With skill |
|---|---|---|---|
| sonnet | scenario-1 | fail | pass |
| sonnet | scenario-2 | fail | pass |
| sonnet | scenario-3 | fail | pass |
| haiku | scenario-1 | fail | fail |
| haiku | scenario-2 | fail | pass |
| haiku | scenario-3 | fail | fail |

### Per-tier delta

| Tier | Without | With | Delta | Unknown verdicts |
|---|---|---|---|---|
| sonnet | 0/3 (0%) | 3/3 (100%) | +100pp | 0 |
| haiku | 0/3 (0%) | 1/3 (33.3%) | +33.3pp | 0 |

### Canary

`canary` (without-skill arm): sonnet=fail, haiku=fail — failed as designed, so the grader is
proven alive for this batch. Both canary runs fanned out one agent per ten-line README, kept the
bound in prose only, and hand-wrote the dispatch list — the exact pattern the canary was seeded
from (every RED baseline did the same).

### Judge disagreements

None (script output). Flags: none. Exit 0.

## Per-dimension breakdown

Rubric: one dimension per hard rule of the skill plus the width rule the REFACTOR added.

| Tier | Scenario | Arm | tier-pinned | ceiling-enforced | no-fresh-orchestration | width-by-work | Verdict |
|---|---|---|---|---|---|---|---|
| sonnet | scenario-1 | with | pass | pass | pass | pass | pass |
| sonnet | scenario-1 | without | pass | pass | fail | pass | fail |
| sonnet | scenario-2 | with | pass | pass | pass | pass | pass |
| sonnet | scenario-2 | without | pass | fail | fail | pass | fail |
| sonnet | scenario-3 | with | pass | pass | pass | pass | pass |
| sonnet | scenario-3 | without | pass | fail | fail | pass | fail |
| sonnet | canary | without | pass | fail | fail | fail | fail |
| haiku | scenario-1 | with | pass | pass | pass | fail | fail |
| haiku | scenario-1 | without | pass | fail | fail | fail | fail |
| haiku | scenario-2 | with | pass | pass | pass | pass | pass |
| haiku | scenario-2 | without | pass | fail | fail | pass | fail |
| haiku | scenario-3 | with | pass | pass | pass | fail | fail |
| haiku | scenario-3 | without | pass | fail | fail | pass | fail |
| haiku | canary | without | pass | fail | fail | fail | fail |

Per-dimension pass counts over the three scenarios (canary excluded):

| Dimension | sonnet without → with | haiku without → with |
|---|---|---|
| tier-pinned | 3/3 → 3/3 | 3/3 → 3/3 |
| ceiling-enforced | 1/3 → 3/3 | 0/3 → 3/3 |
| no-fresh-orchestration | 0/3 → 3/3 | 0/3 → 3/3 |
| width-by-work | 3/3 → 3/3 | **2/3 → 1/3** |

What that says:

- **tier-pinned is not the skill's contribution in this repo.** Every without-arm run pinned
  every dispatch. The reason is visible in the transcripts: subagents inherit this repo's
  `CLAUDE.md` and the user's auto-memory (`model-tier-standard`), and several baselines cite
  "the standing model-tier rule" by name. The dimension is retained because the skill's planner
  makes the pin mechanical, but the lift the skill buys here is zero in this environment and
  would be non-zero in a repo without that memory. Recorded as a confound, not a result.
- **ceiling-enforced and no-fresh-orchestration are the skill's whole effect**: 0→3 on both
  tiers for no-fresh-orchestration, 1→3 / 0→3 for ceiling-enforced. Without the skill every run
  wrote a 200-line Workflow script or a six-dispatch `dispatches.md` and stated its ceiling in
  prose (or, once, as a partial `VERIFY_CAP` inside the script — the one without-arm ceiling
  pass). With the skill every run wrote a spec, ran the planner, and left the cap to the runner.
- **width-by-work is where haiku falls short, and the skill made it slightly worse.** Haiku
  with the skill fanned out one finder per file over 43 files (scenario 1: 60 agents, ceiling
  raised to 65 "to accommodate scope creep") and gave eight one-line helper stubs their own
  items (scenario 3), while haiku *without* the skill happened to bucket by directory. Sonnet
  chunked correctly in both arms. The skill's width guidance ("items are units of work, not
  files") is prose; the planner only warns on *writing* lanes over ten items. That is the
  follow-up.

## Judge disagreements and abstentions, read against the transcripts

- **no-fresh-orchestration on the four six-dispatch runs (06, 07, 13, 14).** First-pass judges
  split 2–2 on identical shapes (a `dispatches.md` enumerating six `Agent` calls with a brief
  each): 06 and 14 fail, 07 and 13 pass — 07 on the grounds that `dispatches.md` "was the right
  choice, not `run.mjs`", 13 on an unrelated quote. My own read: six hand-written dispatches
  are the "hand-written multi-wave dispatch sequence" the definition names, and the "three or
  fewer typed Agent briefs" escape does not cover six. Per the protocol I sharpened the
  definition (four or more enumerated dispatches = fail, whatever the brief quality) and
  re-graded all four with fresh isolated judges: 4/4 fail. The re-grades supersede the first
  pass in `runs.json`; both sets of verdict files are kept.
- **ceiling-enforced on run 02 (sonnet scenario-1 without) — pass.** The judge accepted a
  `VERIFY_CAP = 30` check inside a fresh script as "code that stops dispatching at a numeric
  cap and reports what it dropped". It does exactly that for the verify stage and nothing for
  the rest of the run. Defensible under the definition as written; left standing. It is the
  single without-arm ceiling pass and does not change any top-line verdict.
- **ceiling-enforced on run 10 (haiku scenario-2 with) — pass.** That run wrote a valid spec
  but only *described* the planner command ("Expected: exit 0") instead of running it. The
  judge passed it because the universal runner enforces `ceiling.agents` at dispatch time
  regardless. Also defensible; noted because it is the one with-arm run that skipped the gate.
- **Abstentions:** none. No judge returned `unknown` in 60 calls.
- **Two judges did not write their verdict file** (run-02 tier-pinned; run-13 no-fresh
  re-grade). Their verdicts were transcribed verbatim from their final messages into the file,
  each marked with a `note` field saying so.

## Batch-hygiene notes (so the numbers can be trusted, or discounted, correctly)

- The first dispatch of all 14 runs was lost when the machine slept mid-batch (one API error
  "Your computer went to sleep mid-response", three watchdog stalls, nine agents that never
  progressed). All were stopped, every workspace was rebuilt, and 13 runs were re-dispatched;
  the one run that had completed (haiku canary without) was kept. Sleep was prevented
  (`caffeinate`) for the re-run.
- One re-run (haiku scenario-2 without) read a sibling workspace's script and copied it. It
  was discarded and re-run in an isolated directory with no siblings visible. Every retained
  transcript was scanned for tool calls touching another run's workspace: none (one run listed
  the parent directory's file names while verifying it had written nothing outside its own
  tree; it read no sibling content).
- Judges saw blinded transcripts (skill block stripped, workspace names replaced by `ws-NN`)
  and neutral artifact copies. Blinding is partial by nature: a with-arm run's own text says
  "per the agent-swarm skill". The dimensions are artifact-based, which limits the leak.
- Scenario 2's fixture layout matches the worked transform example in the skill's reference,
  so part of the with-arm's scenario-2 shape was available to copy. Scenarios 1 and 3 carry no
  such example and moved the same way, so the top-line result does not rest on it.
- Two real defects surfaced in baseline runs and are fixed in this batch: the CLI main-guard in
  `swarm-plan.mjs` and `dispatch-contract/scripts/validate-brief.mjs` compared an unresolved
  `argv[1]` against a resolved `import.meta.url`, so invoking either through `/tmp/…` on macOS
  exited 0 with no output. Both now compare real paths and have a symlinked-invocation test.

## Recommendation

**ship** — for sonnet without qualification (0/3 → 3/3, every dimension at or above the
without arm). For haiku the top-line lifts (0/3 → 1/3) and the two dimensions the skill exists
for go 0→3 each, so the skill helps there too; but the **width-by-work** dimension regresses
(2/3 → 1/3) and is the reason two haiku with-arm runs fail. Ship with that named.

What would change the answer: a planner warning on findings lanes wider than ~20 items
(`WIDE_FIND_LANE`, mirroring `WIDE_WRITE_LANE`) and an error when `ceiling.agents` exceeds the
sizing table's top bracket without a user-named number, then a haiku-only re-run of scenarios
1 and 3. That is a `creating-a-skill` edit with its own RED/GREEN, not part of this eval; it is
queued in `HANDOFF.md`.
