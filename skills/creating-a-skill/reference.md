# Creating a Skill — Reference

## Subagent testing protocol

- Scenarios must feel like real work: preface with "This is a real scenario. You must choose
  and act," use concrete paths (`/tmp/acme-api`, not "a project"), and force either an A/B/C
  choice or a concrete deliverable — never leave an "I'd ask the human" escape.
- Combine 3+ pressures: time, sunk cost, authority, exhaustion, social proof.
- RED: run the scenario on a fresh subagent WITHOUT the skill. Record verbatim.
- GREEN: run the same scenario WITH the skill. The agent should choose correctly AND cite the
  skill's sections.
- Pin an explicit model on every scenario dispatch (a standard tier like sonnet, same for
  RED and GREEN so runs are comparable) — an omitted model inherits the session model, which
  makes baselines expensive and non-reproducible across sessions.
- One scenario in every set is the **negative** one: the task matches the skill and the prompt
  never names it. A named scenario measures the body; only the unnamed one measures the
  description, and the description is the only part loaded before the skill fires.
- **Verify the setup before dispatching, never after.** Run the fixture's own condition and
  watch it fail the way the scenario says it does. A condition written only into the prompt is
  not a condition: a "missing ffmpeg" scenario whose fixture leaves ffmpeg on `PATH` has the
  baselines run `ffmpeg -version`, find it, and ignore the premise — simulate the absence in the
  real environment and confirm the simulated failure first. A condition that only holds on the
  author's machine is not a condition either: a case-only `docs/` vs `Docs/` clash is one
  directory on APFS, so the clash under test never existed and the baselines reported duplicate
  content instead.
- Never put the target behavior in an option — or in a fixture. An option list that spells out
  the correct mechanism telegraphs it — a capable model picks it and the run proves nothing. A
  fixture states only what a real artifact would state and never a negative inventory of what is
  absent: "there is no press kit yet" hands a probe about discovering absence its own answer, and
  the baseline quotes that sentence back as its reasoning. A probe question must not presuppose
  the answer it is meant to test for. When the gate under test is one a strong model can
  recognize from the option text, force deliverables instead ("write out the run plan and the
  exact reply") and read what the agent volunteers.
- **Clear the search path, then check that it stayed clear.** A baseline is only as unaided as
  the file system the agent can search: before dispatching, nothing named after the skill may
  exist in the repo tree, the session scratchpad (every subagent inherits that path), or `/tmp`
  — move the spec, the scenario files and any draft scripts somewhere unadvertised outside the
  repo for the duration of RED and restore them at GREEN, rather than leaving the evaluator's
  own pass criteria sitting where a `find` will reach them. A scenario that names the skill
  sends the agent hunting for that name, and what it finds is those criteria. Before accepting a run, grep its transcript for reads of
  `Docs/specs/`, `scenario-*.md`, and the scratchpad path.
- Where a baseline complies instead of failing, record that outcome as-is. A complied baseline
  means the scenario is telegraphing, the run was never unaided, the condition under test never
  existed, or the content is unnecessary — all four are findings, and none is fixed by writing
  the skill content anyway. Rule out the middle two first: those are defects in the measurement
  rather than results from it.

## Meta-testing

If an agent reads the skill and still chooses wrong, ask: "You read the skill and chose X —
how should the skill have been written so the correct choice was the only acceptable one?"

- Clarity gap → add their suggestion verbatim.
- Organization gap → move the key point earlier/more prominent.
- Willpower gap → strengthen the foundational principle.

## Ship gate — the A/B eval

GREEN answers "did the skill get followed"; it does not answer "did the skill help". Before a
skill ships, run `soltero-skills:skill-ab-eval`: the same task set with the skill and without,
on at least two model tiers, compared on pass rate. Ship only when the numbers move, and read
where they don't — a skill that lifts a mid tier and flattens on a stronger one is telling you
its content is already in the stronger model, and the gap is the finding worth keeping.

## Authoring principles

- Progressive disclosure: only `name`+`description` preload; keep `SKILL.md` tight (recurring
  token cost once loaded). Move 100+-line reference and reusable scripts to sibling files,
  one level deep, forward slashes, `${CLAUDE_SKILL_DIR}` for bundled scripts.
- Description = when to use (lead with trigger) AND what it does. Never paste the whole
  workflow into the description — it becomes a shortcut Claude follows instead of the body.
- One excellent example beats five mediocre ones. No narrative storytelling, no dated logs.
- Skills are for judgment. Anything a regex/validator can enforce becomes a bundled script
  (with a `*.test.mjs` beside it) or a CI hook, not prose in a skill — see Hard Rule 2. This
  applies to a two-line deterministic step buried in a judgment-heavy skill just as it does to
  a skill that is nothing but the deterministic step.
