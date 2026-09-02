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
- Never put the target behavior in an option. An option list that spells out the correct
  mechanism telegraphs it — a capable model picks it and the run proves nothing. When the
  gate under test is one a strong model can recognize from the option text, force deliverables
  instead ("write out the run plan and the exact reply") and read what the agent volunteers.
- Where a baseline complies instead of failing, record that outcome as-is. A complied baseline
  means either the scenario is telegraphing or the content is unnecessary — both are findings,
  and neither is fixed by writing the skill content anyway.

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
