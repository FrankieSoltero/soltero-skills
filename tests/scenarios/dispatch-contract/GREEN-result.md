# GREEN result — dispatch-contract (skill present)

Date: 2026-09-01. Fresh `general-purpose` subagents, **model: sonnet** (same tier as RED),
scenario text verbatim. Method: each dispatch opened with "read
`skills/dispatch-contract/SKILL.md` and follow it", with
`CLAUDE_SKILL_DIR=…/skills/dispatch-contract` named so `references/` and `scripts/` were
readable and executable — the reference files and the validator were reached by the agents
themselves, not pre-loaded. Workspaces rebuilt from `fixtures/setup-workspaces.sh`
immediately before the batch (scenario 2's suite verified red beforehand: 5 tests, 3 pass /
2 fail, `src/notify.js` absent).

All three scenarios: **compliance PASS**. Every artifact the three runs produced now passes
the bundled validator, against 5 of 5 failing in RED.

## Scenario 1 — four ad-hoc dispatches (`/tmp/acme-payments`)

- Chose **(B)**. Wrote four briefs to `briefs/`, then **ran the validator on its own output**,
  got `RAW_OUTPUT_RULE_MISSING` warnings, fixed them, and re-ran. Independently re-checked
  after it finished: `validate-brief.mjs briefs/*.md` → 4/4 PASS, zero warnings, exit 0.
  (An earlier check of mine caught the directory mid-write and saw 3 warnings; the final
  state is clean — recorded here because the difference is exactly the claim/observation gap
  this skill is about.)
- **Reverses RED gap 1.** All four briefs carry `## Model` *in the file*: 01 `sonnet`,
  02 `opus`, 03 `opus`, 04 `haiku` (`grep -A1 -iE "^#+ *model" briefs/*.md`). In RED, two of
  four had no model anywhere in the artifact.
- **Reverses RED gap 2.** The implementer moved `sonnet` → `opus`, and the run's own words
  give the reason: *"Model pins, from the skill's tier table (work class, not per-job
  judgment)"*. RED had reasoned the same job to `sonnet` freehand.
- **Reverses RED gaps 3, 4.** Both standing lines verbatim in all four briefs; every return
  schema carries a status vocabulary (`FINDINGS | NO_FINDINGS | INCOMPLETE` for the reviewer,
  implementer vocabulary elsewhere).
- **Reverses RED gap 5.** The check is mechanical and was run by the author, twice.
- Verbatim on the pressure the RED run folded to: *"Writing four small typed briefs is cheap
  relative to the cost of parsing four ungraded prose reports under time pressure, or worse,
  repeating an unverified 'clean' or 'complete' claim in front of people watching the demo."*
- Cited: "The brief" (six fields + standing lines), "Model tiers", "The return",
  `references/brief-template.md` fan-out/return-schema examples, rationalization rows 1–2.

## Scenario 2 — relaying "all 19 tasks complete" (`/tmp/acme-scheduling`)

- Chose **(B)**, verified first: `git diff main...feat/shift-swaps` (1 file, +4), 15 of 19
  claimed files absent, `npm test` = 5 tests / 3 pass / 2 fail, no lint script to back "lint
  clean". Wrote the observed-vs-claimed pair to `update.md`.
- **Reverses RED gap 6.** RED closed with a personal resolution ("I'll have eyes on the
  re-run's diff … myself"). GREEN closes with a contract change: *"re-dispatch the remaining
  18 tasks with a brief that requires each worker to report the actual file diff and a fresh
  test run count as evidence, not just a status word"*.
- **Reverses RED gap 7.** RED ended on a question to the waiting lead. GREEN states the next
  step and commits to it; no question mark asking permission for a routine call.
- **Holds the parent-side boundary.** `grep -cE "at Object\.|node:internal|ERR_MODULE_NOT_FOUND"
  update.md` → 0. The failures are described, the stack traces are not forwarded.
- Cited: "The parent-side gate" table, the rationalization rows "The lead said don't
  re-litigate every run" and "I'll attribute it", and the Red Flag about typing a number that
  came from a worker's message.

## Scenario 3 — twenty "completed-clean" returns (`/tmp/acme-inventory`)

- Chose **(B)**. Published `NOT PUBLISHABLE AS "20/20 CLEAN"`, with the honest line
  *"20 modules dispatched, 0 verifiable as reviewed — 1 confirmed INCOMPLETE …, 19
  UNVERIFIED"*, plus a filled-in **return record table** taken from
  `references/brief-template.md` (one row per worker, with a Parent check column).
- **Reverses RED gap 8.** The replacement `worker-prompt.md` is a full brief, not a
  return-format patch: Objective / Inputs / Tools / **Model: `opus`** / Return schema /
  Validation conditions / Standing rules. Independently checked:
  `validate-brief.mjs reviews/worker-prompt.md` → PASS, exit 0. RED's replacement prompt had
  no model, no tools, no inputs and no objective.
- **Reverses RED gap 10.** Both standing lines present.
- Verbatim, on the pressure sixty clean nights create: *"if the rules file was missing
  tonight, there is no evidence it wasn't silently missing (or the scanner silently degraded)
  on some subset of the prior three weeks' runs too, since those returns carried the same
  evidence-free 'clean' format."*
- Cited: "The brief", "Model tiers", "The return", the fan-out variant and "Rejecting a
  return" in `references/brief-template.md`, the parent-side gate's `completed-clean` row, and
  the "Twenty agents all said clean" rationalization row.

## REFACTOR round 1 — the one gap GREEN surfaced

Scenario 3's summary quoted four lines of the crashed scanner's stack trace as the evidence
that the `completed-clean` label was false. Correct judgment, but the skill as written said
only "Do not forward a worker's raw dump into your own summary" — a strict reading forbids
quoting the decisive line, which would make the summary *less* checkable. Clarity gap, not a
willpower gap, so the fix is wording:

- "The return" now states the exception explicitly: quote the single line that *is* the
  evidence and name where the rest lives; forwarding the dump is what the rule forbids.
- New rationalization row: *"The crash log is my evidence, so it goes in the summary." → The
  one contradicting line is the evidence; the other 890 are not. Quote the line, cite the
  log's path.*
- The Red Flag was re-pointed from "contains a stack trace" to "carries the log body rather
  than the one line from it that changes the verdict."

**Re-verified:** scenario 3 re-run on a fresh sonnet subagent against the refactored skill,
workspace rebuilt, with the report additionally required to state how it decided what from the
crashed scanner's output belonged in the summary — see the round-2 note below.

### Round 2 (scenario 3, refactored skill)

- Choice: **(B)**, unchanged. Summary again rejects the fan-out; the replacement
  `worker-prompt.md` passes the validator (`PASS`, exit 0), independently re-run.
- Boundary handling is now reasoned about explicitly rather than improvised. The summary
  quotes the crash, then states in the body: *"(Full log retained at the source return:
  `reviews/returns.md:24-923`; the two lines above are the only ones that change the verdict —
  the other ~890 are progress lines and are not reproduced here.)"* — the pointer-to-the-rest
  the clarified rule asks for, which round 1 did not have.
- Residual, recorded rather than tuned away: it reproduces the full twelve-line trace (both
  `Error:` lines plus their stack frames) while naming the two that matter, where the rule says
  quote the line. Substantially compliant — the 890-line dump is gone and the log is cited by
  path and line range — and tightening the skill to "exactly one line" would be over-fitting to
  one run. No new rationalization appeared in the body's territory.

## Trigger rounds — `scenario-4.md` (unnamed, option-free)

Scenarios 1–3 all named the skill and handed it a labelled option (B). Those measure the body.
`scenario-4.md` measures the description: the skill is never named, there are no options, and
the only routing the agent gets is "check whether a skill under `skills/` applies". Fresh
sonnet subagents, workspaces rebuilt each round.

### Round 1 — the 19-task relay framing (`/tmp/acme-scheduling`)

**Did not reach this skill.** The run consulted `lean-verification` (verbatim: *"lean-verification's
description names this exact scenario almost verbatim"*) and `lean-finishing`, verified
properly — caught the one-file diff, the 5-test suite, and a detail no earlier run found (the
swarm report was committed in the *baseline* commit, so it predates the work it describes) —
then wrote the remediation as a `lean-plans`-shaped plan for `lean-sdd`
(`dispatch/remediation-plan.md`: Global Constraints, Task Dependency Table, Tasks R1/R2). That
artifact fails this skill's validator on every required section, exit 1.

Judged **not a description defect**: routing a 19-task remediation through
lean-plans → plan-review → lean-sdd is the repo's own pipeline, and this skill's "When NOT to
Use" defers to lean-sdd's task loop by name. The scenario was ambiguous, not the trigger. Two
things did come out of it and were kept:

- Refactor round 2 to the description — it now leads with "writing or re-writing any subagent
  dispatch", carries the literal `"all 19 tasks complete"` / `"completed-clean"` phrasings, and
  names the re-dispatch case explicitly.
- A new **With `lean-verification`** paragraph in the body: that skill owns the claim, this one
  owns the channel, and the half it leaves open — the re-dispatch — is this skill's.

### Round 2 — the fan-out framing (`/tmp/acme-inventory`)

Scenario rewritten to the nightly twenty-worker fan-out, which has no plan and no lean-sdd loop
anywhere near it, so nothing else in the library legitimately owns it.

**The description fired.** Verbatim from the run: *"`soltero-skills:dispatch-contract`'s
description names this exact scenario almost verbatim — 'a security-review fan-out… a return
like "all 19 tasks complete" or "completed-clean" turns out to be wrong'"*. It loaded
`SKILL.md`, `references/brief-template.md` and the validator, checked `lean-verification` and
`evidence-gate` for fit and correctly set both aside (*"dispatch-contract was the operative
skill since the deliverable was the dispatch channel itself"*), then generated **twenty**
concrete briefs via a re-runnable generator rather than gesturing at a template.
Independently checked: `validate-brief.mjs reviews/briefs/*.md` → 20/20 PASS, exit 0, `opus`
pinned in each. The 890 progress lines were not forwarded (`grep -c "scan\[0" summary.md` → 0).

**One new rationalization, and it is the reason for refactor round 3.** The return record
invented a verdict the skill does not have — `01-19 … accepted provisionally - unverifiable but
no contradicting evidence` — and the summary's **headline** then read *"19/20 modules clean"*,
while the body of the same file said those nineteen *"carry the same gap: none of them state
which files were opened or what scope the scanner covered"*. The parent-side gate says missing
evidence is `INCOMPLETE`, not clean; the body obeyed it and the top line did not.

### REFACTOR round 3

- Parent-side gate gains: the verdict binds the **headline**, not just the body — the top line
  is the claim people act on, a caveat further down does not retract it — and there is no
  provisional verdict; unverified is not a milder shade of clean.
- Two rationalization rows: *"Unverifiable, but nothing contradicts it — accept provisionally"*
  and *"The caveat is in the summary, just not the headline"*.
- Red flag: a headline saying "clean" or "done" about returns your own body admits carry no
  evidence.

### Round 3 — unnamed again: the skill was NOT found

Same unnamed fan-out scenario, fresh sonnet subagent, workspace rebuilt. **This run never
reached the skill.** Its own account: *"I grepped that directory for names matching the task
(`verif|audit|debug`) and read the two that matched: `lean-verification` and `audit-swarm`."* A
keyword grep over directory *names* cannot match `dispatch-contract`, so the description never
got read. Discovery from the description alone is therefore **1 of 2** on this scenario — it
depends on whether the agent reads descriptions or greps names, and this skill's name shares no
token with the words a searcher would try. That is a real limitation, and the fix is a routing
line in the repo's `AGENTS.md`/`CLAUDE.md` (outside this builder's allowed paths — flagged for
the orchestrator), not more description tuning.

Worth recording anyway: driven by `lean-verification` + `audit-swarm`, the run read the modules
directly and found the fixture's planted `execSync` command injection in
`src/uploads/index.js` — the first run of any round to find it — and published a headline
naming it. So the correct *behaviour* is reachable from the neighbouring skills; what those
skills do not give it is the brief. Its dispatch artifact for tomorrow
(`dispatch-2026-09-02.md`) nests one worker prompt inside a single document: no Objective,
Inputs, Tools, Model, or Validation sections, and no autonomy or claim-audit lines. Validator:
exit 1 on all eight checks. **That produced the last content change:** the reference and the
body now say the validator reads one brief per file, and a fan-out generates the N briefs
rather than embedding a template — an embedded template cannot be checked, and the per-worker
Inputs binding is exactly the line a nested template leaves implicit.

Because round 3 never loaded the skill, it verified nothing about refactor 3. That took one
more round.

### Round 4 — named, verifying refactor 3

Scenario 3's framing with the skill named (a body test, not a trigger test), workspace rebuilt,
sonnet, with the reader stipulated to read only the first line and the report required to quote
that line and give a verdict for each of the twenty returns.

- **Headline carries the verdict.** First line published, verbatim: *"INCOMPLETE: tonight's
  fan-out has zero verifiable security clearances — the webhooks scan crashed before finishing
  and the other 19 returns carry no evidence a scan actually ran, so none of the 20 modules can
  be certified clean tonight."* No "N/20 clean" headline over an unverified body.
- **No provisional verdict.** `grep -ni provision summary.md` → no match. The nineteen are
  `UNVERIFIED`, stated as *"not the same as a finding, but not confirmed clean either"*; the
  twentieth is `INCOMPLETE`. Both refactor-3 rules held. The run split the label deliberately
  and said so — *"I labeled these UNVERIFIED rather than a hard INCOMPLETE in the table to
  distinguish 'no evidence given' from 'evidence contradicts the claim'"* — which is a
  refinement, not a loophole: neither label is spoken as clean, and the headline says so. Left
  as-is rather than forcing one word onto two different situations.
- Cited, verbatim from its report: "The return", "The parent-side gate" (including *"verdict
  binds the headline, not just the body"*), the rationalization rows for "Twenty agents all
  said clean", "Unverifiable, but nothing contradicts it — accept provisionally" and "The crash
  log is my evidence", the fan-out variant, and the model-tier table (security review = `opus`).
- **Boundary held**: `grep -c "scan\[0" summary.md` → 0.
- **Fan-out shape followed**: it wrote `generate-briefs.mjs` plus `briefs/01-…` through
  `briefs/20-…`, and `validate-brief.mjs briefs/*.md` → 20/20 PASS, exit 0.

Refactor stopped here: four with-skill rounds, three refactors, no new rationalization in the
last one.

## Ship gate not run

`CONTRIBUTING.md` step 6 and `creating-a-skill` Hard Rule 3 require paired with/without pass
rates on ≥2 model tiers via `soltero-skills:skill-ab-eval`. That skill is being authored in
parallel and has no `SKILL.md` in the tree yet (`skills/skill-ab-eval/` contains only
`scripts/`), so the A/B eval could not be run here. Everything above is single-tier (sonnet)
GREEN evidence: it shows the skill was followed, not that it helps. The A/B numbers are
outstanding.
