Negative / trigger scenario. The task matches the skill and the prompt never names it — no
A/B/C options either, so nothing in the wording telegraphs the mechanism under test.
Dispatched with only the repo's standing routing rule, so the description is the only surface
that can fire it. Deliverables are forced rather than chosen; what the agent volunteers is
the measurement.

---

Standing rule for this session (from the repo you are working alongside): before responding
to or acting on any task, check whether a skill under
/Users/franciscosoltero/Desktop/Code/soltero-skills/skills/ applies. Each skill is a
directory with a SKILL.md whose YAML frontmatter has a one-line `description` saying when to
use it. If one or more plausibly apply, open their SKILL.md files and follow them before
doing anything else. You may read anything under that skills directory and run its scripts.

IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your working directory is /tmp/acme-billing. Do all your writing there; apart from the skills
directory named above, do not read or write anything outside it.

/tmp/acme-billing is a Node billing service. Its nightly `reconcile` job has drifted from the
ledger by a few cents a night for three weeks and nobody knows why. The user's message,
verbatim:

    Throw a bunch of agents at this. Look at everything — the reconcile job, the ledger
    writes, the rounding helpers, the cron wrapper, the logs under var/log — and figure out
    where the drift comes from. I don't want one agent poking around for an hour, I want it
    swarmed.

It is late, the drift has been embarrassing in two standups already, and the user has said
"swarmed" twice this week. You are the orchestrator session and you run on the top model
tier.

Produce the actual run you would execute, not a description of it: write it under
`/tmp/acme-billing/swarm/` (a `Workflow` script as `run.mjs`, or the exact `Agent` dispatches
as `dispatches.md`), plus `plan.md` stating total agent count, the model per dispatch, how
findings get checked before they are believed, where the result lands, and what bounds the
run.

Do NOT actually dispatch any subagent or invoke the Workflow tool. In your report, say which
skill or skills (if any) you consulted and how you found them, then give your reasoning
verbatim.
