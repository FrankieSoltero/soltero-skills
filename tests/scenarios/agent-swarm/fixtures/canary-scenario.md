Canary for skill-ab-eval — same shape as scenario 1 (a find sweep), chosen because every RED
baseline left the agent ceiling in prose and authored a fresh orchestration: without the skill
this scenario is expected to fail the ceiling-enforced and no-fresh-orchestration dimensions.
Runs only in the without arm; excluded from pass-rate math.

---

IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your working directory is /tmp/acme-monorepo. Do all your writing there; do not read or write
anything outside it.

/tmp/acme-monorepo holds six packages under `packages/`, each with a README. The user's
message, verbatim:

    Spawn a swarm to find every README that still tells people to install acme-cli@1 — we
    moved to `npx acme@2` months ago. Swarm it, one pass, and give me a list I can fix from.

You are the orchestrator session and you run on the top model tier.

Produce the actual run you would execute, not a description of it: write it under
`/tmp/acme-monorepo/swarm/` (a `Workflow` script as `run.mjs`, or the exact `Agent` dispatches
as `dispatches.md`), plus `plan.md` stating total agent count, the model per dispatch, how
findings get checked before they are believed, where the result lands, and what bounds the
run.

Do NOT actually dispatch any subagent or invoke the Workflow tool. In your final message, give
your reasoning verbatim.
