# Skill Spec — agent-swarm

- **Problem:** Every time a swarm of subagents is wanted for something new — a sweep, a
  migration, a research fan-out, a "throw agents at this" investigation — one of two
  expensive things happens. Either the agent improvises the fan-out inline: one agent per
  item with no width bound, every dispatch inheriting the session's orchestrator model (the
  most expensive tier), a three-lens verification panel on everything, results streamed back
  as prose into the parent's context and re-summarized there, and a loop with no round cap.
  Or a brand-new purpose-specific skill with its own 300-line workflow script gets authored,
  tested, and shipped for that one purpose. Both burn the usage budget on the mechanics of
  swarming rather than on the work. The six bundled workflows in this repo (audit-swarm,
  plan-review, prd-review, agent-playbook, design-forge, transcript-reader) each re-encode the
  same skeleton — scout, fan-out lanes, dedupe, scaled verification, one synthesis agent
  writing a file — and nothing reusable exists for the next purpose.
- **Trigger:** Any request to spawn, spin up, fan out, or parallelize subagents for a purpose
  no existing swarm-shaped skill already covers (audit-swarm, plan-review, prd-review,
  lean-sdd, skill-ab-eval, transcript-reader own their own). Also when an agent is about to
  write an ad-hoc `Workflow` script or dispatch more than three `Agent` calls for one task.
- **Scope / non-goals:** Owns (1) the decision of shape and width — which of the five swarm
  shapes fits (understand, find/review, research, transform/migrate, judge-panel), how many
  lanes and items, scaled to what the user actually asked for; (2) the cost gate — a
  deterministic planner that validates a swarm spec (every dispatch pinned to a standard tier
  and never the orchestrator tier, an agent ceiling declared and not exceeded, loops capped,
  verification scaled by severity, writers isolated and non-overlapping, one synthesis agent
  writing to a file) and prints the agent count per tier before anything is dispatched; (3) a
  universal, parameterized workflow runner that executes any validated spec, so a new purpose
  is a new spec file, not a new skill. Non-goals: it does not replace the purpose-specific
  swarm skills that already exist (route there first); it does not write the per-dispatch
  typed brief — `dispatch-contract` owns that and its validator; it does not run a
  lean-sdd implementation loop; it does not decide *whether* the task needs more than one
  agent for tasks that fit in one context (a single `Agent` call or inline work is the answer
  there, and the planner says so).
- **Trigger phrasings:** "spawn a swarm", "spin up a sub agent swarm", "spawn sub agents for
  this", "fan out agents", "throw a bunch of agents at this", "parallelize this across
  agents", "run a workflow on this", "use a swarm to…", "have a bunch of agents go through…",
  "spawn sub agent workflows".
- **Success scenario:** The user says "spawn a swarm to find every place /tmp/acme-crm's API
  returns customer PII without redaction — be thorough, we have budget". The agent does not
  write one agent per source file on the session model. It scouts inline (a grep over `src/`
  for response-writing sites) to get the work-list, writes a swarm spec with a find lane over
  that list on `sonnet`, single-lens verification with three-lens escalation only for
  high/critical, one `opus` synthesis agent writing `Docs/swarm-pii-<date>.md`, and an agent
  ceiling; runs the bundled planner, which prints the count per tier and exits 0; then invokes
  the bundled universal workflow with that spec. The result comes back as a file path and a
  summary, and the relayed headline states the agent count actually spent.
- **Bundled assets:** `scripts/swarm-plan.mjs` (deterministic spec validator + agent-count
  estimator; exit 0 dispatchable, 1 violations, 2 malformed; unit-tested via
  `swarm-plan.test.mjs`), `workflows/swarm.mjs` (the universal parameterized runner: optional
  scout, fan-out lanes over items, dedupe, severity-scaled verify, synthesis to a file, capped
  loop, tier counts in the return), `references/spec-format.md` (the spec schema and one
  worked spec per shape).
