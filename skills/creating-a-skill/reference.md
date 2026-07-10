# Creating a Skill — Reference

## Subagent testing protocol

- Scenarios must feel like real work: preface with "This is a real scenario. You must choose
  and act," use concrete paths (`/tmp/acme-api`, not "a project"), and force an A/B/C choice
  with no "I'd ask the human" escape.
- Combine 3+ pressures: time, sunk cost, authority, exhaustion, social proof.
- RED: run the scenario on a fresh subagent WITHOUT the skill. Record verbatim.
- GREEN: run the same scenario WITH the skill. The agent should choose correctly AND cite the
  skill's sections.
- Pin an explicit model on every scenario dispatch (a standard tier like sonnet, same for
  RED and GREEN so runs are comparable) — an omitted model inherits the session model, which
  makes baselines expensive and non-reproducible across sessions.

## Meta-testing

If an agent reads the skill and still chooses wrong, ask: "You read the skill and chose X —
how should the skill have been written so the correct choice was the only acceptable one?"
- Clarity gap → add their suggestion verbatim.
- Organization gap → move the key point earlier/more prominent.
- Willpower gap → strengthen the foundational principle.

## Authoring principles

- Progressive disclosure: only `name`+`description` preload; keep `SKILL.md` tight (recurring
  token cost once loaded). Move 100+-line reference and reusable scripts to sibling files,
  one level deep, forward slashes, `${CLAUDE_SKILL_DIR}` for bundled scripts.
- Description = when to use (lead with trigger) AND what it does. Never paste the whole
  workflow into the description — it becomes a shortcut Claude follows instead of the body.
- One excellent example beats five mediocre ones. No narrative storytelling, no dated logs.
- Skills are for judgment. Anything a regex/validator can enforce becomes a bundled script
  or CI hook, not a skill.
