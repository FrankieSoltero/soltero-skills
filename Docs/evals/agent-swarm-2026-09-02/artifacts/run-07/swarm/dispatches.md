# Dispatches — README acme-cli@1 sweep

Orchestrator does two things itself, no dispatch:

## Step 0 — enumerate (orchestrator, no agent)
```
Glob("packages/*/README.md")
```
Expected 6 results (this run's actual tree):
```
packages/api/README.md
packages/cli/README.md
packages/docs/README.md
packages/sdk/README.md
packages/web/README.md
packages/worker/README.md
```
If the count is not 6, or any path falls outside `packages/*/README.md`,
STOP and report the mismatch instead of proceeding — the fan-out below is
sized to exactly 6.

## Step 1 — finders (6 agents, ONE message, parallel)

All six `Agent` calls below go in a single message (independent, no
dependencies between them). Each finder gets exactly one file, not the
directory, so it cannot wander.

```
Agent({
  subagent_type: "Explore",
  model: "haiku",
  name: "finder-api",
  description: "Check api README for acme-cli@1",
  prompt: "Read exactly this file and nothing else: \
    /tmp/ab-agent-swarm/ws-07/packages/api/README.md. \
    Determine whether it still instructs the reader to install via \
    `acme-cli@1` (e.g. `npm install -g acme-cli@1`, or any acme-cli \
    install pinned to major version 1), as opposed to already having \
    moved to `npx acme@2`. Report back exactly: (1) verdict — OUTDATED \
    (still tells people to install acme-cli@1) or CURRENT (already on \
    npx acme@2) or UNCLEAR; (2) the verbatim line(s) that justify the \
    verdict, quoted exactly as they appear in the file; (3) the 1-indexed \
    line number(s) of that quote. Do not read or infer anything about \
    other packages. Do not edit the file."
})

Agent({
  subagent_type: "Explore",
  model: "haiku",
  name: "finder-cli",
  description: "Check cli README for acme-cli@1",
  prompt: "Read exactly this file and nothing else: \
    /tmp/ab-agent-swarm/ws-07/packages/cli/README.md. \
    [same instructions as finder-api]"
})

Agent({
  subagent_type: "Explore",
  model: "haiku",
  name: "finder-docs",
  description: "Check docs README for acme-cli@1",
  prompt: "Read exactly this file and nothing else: \
    /tmp/ab-agent-swarm/ws-07/packages/docs/README.md. \
    [same instructions as finder-api]"
})

Agent({
  subagent_type: "Explore",
  model: "haiku",
  name: "finder-sdk",
  description: "Check sdk README for acme-cli@1",
  prompt: "Read exactly this file and nothing else: \
    /tmp/ab-agent-swarm/ws-07/packages/sdk/README.md. \
    [same instructions as finder-api]"
})

Agent({
  subagent_type: "Explore",
  model: "haiku",
  name: "finder-web",
  description: "Check web README for acme-cli@1",
  prompt: "Read exactly this file and nothing else: \
    /tmp/ab-agent-swarm/ws-07/packages/web/README.md. \
    [same instructions as finder-api]"
})

Agent({
  subagent_type: "Explore",
  model: "haiku",
  name: "finder-worker",
  description: "Check worker README for acme-cli@1",
  prompt: "Read exactly this file and nothing else: \
    /tmp/ab-agent-swarm/ws-07/packages/worker/README.md. \
    [same instructions as finder-api]"
})
```

Any finder report missing a verdict, or missing a verbatim quote for a
non-CURRENT verdict, is treated as UNCLEAR regardless of what it claims, and
routed straight to "needs manual check" in the output (no verifier is
dispatched for UNCLEAR — a verifier refutes a specific claim, it can't
verify the absence of one).

## Step 2 — verifiers (0–6 agents, dispatched only for OUTDATED findings, ONE message if more than one)

For every finder that returned OUTDATED, dispatch exactly one
`finding-skeptic` agent, in parallel with any others from this step:

```
Agent({
  subagent_type: "finding-skeptic",
  model: "haiku",
  name: "verify-<package>",
  description: "Verify acme-cli@1 finding for <package>",
  prompt: "Finding to verify: package <package>, file \
    /tmp/ab-agent-swarm/ws-07/packages/<package>/README.md \
    is claimed OUTDATED because line <N> reads: '<verbatim quote>'. \
    Try to refute this: re-read the actual file yourself, confirm or deny \
    that this exact text appears at that exact line, and confirm or deny \
    that it actually instructs installing acme-cli pinned to major \
    version 1 (not, e.g., a comment saying NOT to do that, or already-\
    superseded text elsewhere in the same file). Default to REFUTED if \
    anything about the claim doesn't check out exactly. Report CONFIRMED \
    or REFUTED plus your reasoning. Read-only — do not edit the file."
})
```

## Step 3 — orchestrator spot-check + aggregation (no agent)
Orchestrator re-reads all 6 files directly (cheap: 6 files, <10 lines each)
and cross-checks every finder verdict — CURRENT included — against that
direct read. Any mismatch (finder vs. orchestrator's own read, or finder vs.
verifier) is written to the output as "disagreement — needs manual check,"
never silently resolved. Orchestrator then writes
`/tmp/ab-agent-swarm/ws-07/swarm/results.md` with one row
per package: package, file path, verdict, evidence quote + line number
(outdated rows only), verification status.
