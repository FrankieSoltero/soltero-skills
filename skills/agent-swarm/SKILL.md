---
name: agent-swarm
description: Use when asked to "spawn a swarm", "spin up a sub agent swarm", "spawn sub agents for this", "fan out agents", "throw a bunch of agents at this", "parallelize this across agents", "run a workflow on this", or "swarm it" for a purpose no purpose-specific swarm skill already owns (audit-swarm, plan-review, prd-review, lean-sdd, skill-ab-eval, transcript-reader) — and before writing any ad-hoc Workflow script or dispatching four or more Agent calls for one task. Turns the request into a JSON swarm spec (shape, lanes over an inline-scouted work-list, a standard tier pinned at every dispatch site, an agent ceiling, severity-scaled verification, one synthesis agent writing a file, a capped loop), gates it with a bundled planner that prints the agent count per tier and refuses unpinned or orchestrator-tier dispatches, and runs it through one parameterized universal workflow. A new purpose is a new spec file, never a new skill or a fresh 300-line script.
---

# Agent Swarm

> **Portability note (non-Claude-Code agents):** the runner is a Claude Code `Workflow`
> script and does not port. The planner is dependency-free Node and runs anywhere. Outside
> Claude Code, write and validate the spec exactly as below, then execute its lanes yourself,
> sequentially, holding each item to the same return shape — and treat your own findings as
> unverified where the spec would have run a skeptic panel.

## Overview

A capable agent already sizes a swarm sensibly — baselines scouted first, refused
one-agent-per-file, scaled verification. The usage burn is one level down, and it is the same
three things every time:

1. **Inheritance.** A dispatch with no `model` runs on the session's orchestrator tier, the
   most expensive one. Baselines pinned seven of eight dispatches and left the synthesis
   agent — the one that reads everything — to inherit.
2. **Re-authoring.** Every new purpose got a fresh 200–300-line workflow script: new schemas,
   new scout, new verify, new report prompt. The third migration swarm of the month was
   written from scratch *after* the user said the last one cost more than the migration.
3. **Prose ceilings.** "Hard ceiling: 9 agents" in the plan, and nothing in the artifact that
   enforces it or could be checked before dispatch.

This skill replaces all three with one artifact: a **spec** the planner validates and the
**universal runner** executes. Core principle: **the swarm is data, not code — a new purpose
is a new spec, the tier comes from the standard, and the ceiling is enforced by the runner,
not promised by the plan.** The user asking for a swarm is the explicit opt-in the `Workflow`
tool requires; invoke it from the main session (subagents cannot call `Workflow`).

## When to Use

- "Spawn a swarm", "spin up sub agents", "fan out", "throw agents at this", "parallelize
  across agents", "run a workflow on this", "swarm it" — for any purpose: a sweep, a
  migration, a research fan-out, a mapping pass, a design bake-off, a drift investigation.
- You are about to write an ad-hoc `Workflow` script, or dispatch four or more `Agent` calls
  for one task.

## When NOT to Use

- A purpose-specific swarm skill already owns it: whole-repo security/legal audit →
  `audit-swarm`; plan/PRD grading → `plan-review` / `prd-review`; executing an approved
  implementation plan → `lean-sdd`; skill efficacy → `skill-ab-eval`; meeting transcripts →
  `transcript-reader`. Route there first.
- The work fits in one context, or the planner says `mode: agents` (three agents or fewer):
  dispatch those with the `Agent` tool under `dispatch-contract` briefs. A workflow adds
  orchestration cost for nothing there.
- Writing the per-dispatch brief for an `Agent` call — `dispatch-contract` owns that.

## The procedure

1. **Scout inline first.** The work-list is almost always one command away: `grep -rl`,
   `ls`, `git diff --name-only`, a manifest. Run it yourself and paste the result into the
   spec's `items`. A scout *agent* is for work-lists a command cannot produce; it costs an
   agent and a round-trip, and the baselines never needed one.
2. **Pick the shape.** One row; the reference has a worked spec for each.

   | Shape | Lanes | Schema | Verify | Synth |
   |---|---|---|---|---|
   | understand | readers over subsystems | result | none | opus map |
   | find / review | finders over files or dimensions | findings | 1 lens, escalate high/critical to 3 | opus report |
   | research | one lane per search angle | findings | 1 lens | opus synthesis |
   | transform / migrate | writers over write-scopes (a directory, ~10 files — not one per file), `writes: true` + `serial: true` or `isolation: "worktree"` | result | none (the item's own test run is the evidence) | sonnet status list |
   | judge panel | one lane, items = angles | findings | 1 lens, refute-style | opus pick-and-graft |

3. **Write the spec** to `.soltero/swarm/<name>.json` — format in
   [references/spec-format.md](references/spec-format.md). Three fields carry the cost:
   - `model` at **every** dispatch site (scout, each lane, verify, synth), from the standard
     below. Never omitted. Never the orchestrator tier.
   - `ceiling.agents`, sized to the ask, before you know what the lanes will return:

     | The user said | Ceiling | Width |
     |---|---|---|
     | "quick", "find any", "take a look" | ≤ 10 | one lane, ≤ 8 items, 1 lens |
     | unmarked | ≤ 25 | items = the inline work-list, escalate high/critical |
     | "thorough", "go wide", "plenty of budget" | ≤ 50 | every angle as a lane, `loop.maxRounds: 2` |
     | above 50 | only a number the user actually said | — |

     "Go wide" widens lanes and rounds. It never removes the ceiling, the pins, or the single
     synthesis — those are what make width affordable. `ceiling.units` is the optional second
     cap on relative cost when opus dispatches are in play.
   - **Items are units of work, not files.** Width is the cost line the tier standard cannot
     lower, so it is yours to set: a uniform rewrite over forty files is four write-scopes,
     not forty writers; forty-five inert files are one sweep item, not forty-five; eight
     instances of one leak pattern are one title, so the runner escalates the wide panel once
     and reproduces the repeats at one lens. One agent per file only when each file needs
     its own judgment.
   - `synth.outputPath`: one agent writes the file; the run returns a path and a summary.
     Results that come back as prose get re-summarized in your context at orchestrator
     prices.
4. **Gate it.** Never dispatch on a spec the planner has not passed:

   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/swarm-plan.mjs .soltero/swarm/<name>.json
   ```

   Exit 0 prints the verdict, the agent count per tier and per stage, and the relative cost
   units — that line goes in your message *before* the run, so the number is a commitment,
   not a recollection. Exit 1 lists what to change (`MODEL_MISSING`, `MODEL_FORBIDDEN`,
   `CEILING_MISSING`, `OVER_CEILING`, `LOOP_UNCAPPED`, `SYNTH_MISSING`,
   `FINDINGS_UNVERIFIED`, `WRITER_UNISOLATED`, `WRITER_OVERLAP`, `ITEMS_UNKNOWN`,
   `ITEM_PLACEHOLDER_MISSING`, `OVER_UNITS`). A `SMALL_FANOUT` warning means `mode: agents` —
   use the `Agent` tool, not the workflow. A `WIDE_WRITE_LANE` warning means you sized a
   rewrite by file count — re-chunk before dispatching.
5. **Run it** through the universal runner — not a script you wrote for this purpose:

   ```
   Workflow({
     scriptPath: "${CLAUDE_SKILL_DIR}/workflows/swarm.mjs",
     args: { spec: <the validated spec object, items as arrays>, root: "<absolute path>", date: "<date +%F>" }
   })
   ```

   The runner re-checks the pins and the ceiling, drops dispatches past the ceiling and
   *names them* in `dropped`, dedupes findings, runs the severity-scaled panel, and returns
   `outputPath`, `summary`, `agentsSpent`, `byTier`, `dropped`. To re-run after editing the
   spec, resume with `resumeFromRunId` — unchanged agent calls return cached results instead
   of being paid for twice.
6. **Relay.** The headline carries three facts from the return, not from memory: agents spent
   by tier against the ceiling, the output path, and whether anything was dropped (a
   `PARTIAL COVERAGE` summary is never reported as complete). Every count or claim you
   repeat from the file is a worker claim — `dispatch-contract`'s parent-side gate applies
   before you speak it.

## Model tiers

The standard, not a per-job judgment. Per-job reasoning produced "code-writing on sonnet",
"synthesis on haiku" and "report inherits the session default" in the same afternoon.

| Tier | Work class |
|------|-----------|
| `opus` | Engineering — code-writing lanes, judgment reviews, synthesis |
| `sonnet` | Grunt — find/research sweeps, skeptic passes, triage, status lists |
| `haiku` | Reading and summarizing — scouts, file scans, extraction |
| orchestrator (`fable`) | This session only. Never assigned to dispatched work; the planner refuses it. |

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "The last swarm script worked — I'll copy it and adapt." | That is how the third 300-line script of the month gets written. The runner already has the scout, the lanes, the panel and the synthesis; what differs is the spec. |
| "This purpose is special; the universal runner won't fit." | Five shapes cover sweep, migration, research, mapping and bake-off. If yours truly does not fit, the spec's `prompt`, `lensInstructions` and `synth.prompt` are the extension points — a new script is not. |
| "The synthesis agent can inherit the session model; it needs the best reasoning." | It inherits the most expensive model for the job that reads the most tokens. Synthesis is `opus`, pinned. "Inherit" is never a tier. |
| "It's just a grep-and-rewrite — sonnet is plenty for the edit." | Tiers come from the standard. Code-writing is `opus`; what the standard makes cheap is the *width* (four scopes, not forty writers), not the tier. |
| "Forty files, forty writers — the runner isolates them, so why not." | Forty opus dispatches for one uniform rule is the most expensive thing this skill can produce, and a GREEN run produced it. The rule is the work; a scope of ~10 files is the item. |
| "Every one of the eight leaks is critical, so each gets the three-lens panel." | Eight instances of one title are one judgment. The runner escalates the first and reproduces the rest at one lens; title the findings by pattern and let it. |
| "I'll put the ceiling in plan.md — 26 agents, computed from evidence." | A number in prose bounds nothing. `ceiling.agents` in the spec is what the planner checks and the runner enforces. |
| "The user said plenty of budget and go wide." | Then raise the ceiling deliberately and add lanes and rounds. Width is a spec value; it is not permission to skip the gate. |
| "Verification needs the full three-lens panel on everything — it's compliance." | One lens for low/medium, three where severity says so. The flat panel is the single largest cost line in a find swarm and changes no outcome on a repeated pattern. |
| "I'll dispatch a scout agent to build the file list." | `grep -rl` builds it in one command, for free, and you can read it before committing agents to it. Scout agents are for work-lists a command cannot produce. |
| "Loop until dry — the harness caps at 1000 anyway." | The harness backstop is a runaway-loop guard, not a budget. `loop.maxRounds` ≤ 5, or no loop. |
| "Four agents is small enough to skip the planner." | It takes one second and prints the count you are about to spend. Skipping it is how the eighth dispatch loses its model. |
| "The run returned 40 findings — I'll summarize them in my reply." | The synthesis agent already wrote the file. Relay the path, the headline, and the accounting; re-summarizing forty findings in the orchestrator context is the cost the file exists to avoid. |

## Red Flags — STOP

- About to write `export const meta = {` for a swarm — the runner already exists; write a spec.
- An `agent(` call, in any script, with no `model` — or with the orchestrator tier.
- A ceiling that exists in a plan, a message, or your head, and not in `ceiling.agents`.
- Dispatching before the planner has exited 0 on this exact spec.
- A findings lane with `verify: null`, or three lenses on every finding regardless of severity.
- A writing lane with more items than distinct decisions — one writer per file for a rewrite
  the scout showed is uniform.
- Two writing lanes sharing an item, or a writing lane with neither `isolation` nor `serial`.
- A scout agent for a work-list `grep`, `ls`, or `git diff --name-only` would have produced.
- A headline that omits agents spent by tier, or reports a `PARTIAL COVERAGE` run as complete.
- Reaching for `parallel(Array.from({length: N})…)` in the session because "it's quicker
  than the spec" — that is the ad-hoc fan-out this skill exists to replace.

## Details

[references/spec-format.md](references/spec-format.md) — the spec schema, placeholders, the
tier standard, one worked spec per shape, and the sizing table.
