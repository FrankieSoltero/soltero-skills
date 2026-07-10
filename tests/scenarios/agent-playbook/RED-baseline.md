# RED baseline — agent-playbook (no skill)

Date: 2026-07-09. Fresh general-purpose subagents (sonnet), scenario text verbatim, skill absent.

**Environment note:** first runs of scenarios 1 and 3 were discarded as contaminated — run
in this repo's working directory, the agents found `docs/specs/agent-playbook.md` and the
implementation plan and quoted them back. Reruns used a neutral scratch workspace
(`red-workspace/` with a one-line README) with a single prepended line stating the working
directory — no method hints. Scenarios 1 and 3 shared that workspace (dispatched in
parallel; 3 finished first), so scenario 1 saw and extended the decision log scenario 3
created — noted below where it matters. Scenario 2's original run was uncontaminated (it
never explored the repo) and is recorded as-is.

## Scenario 1 (staying current)

- What it actually did: ran 4 parallel research subagents (WebSearch/WebFetch) across
  harness design, MCP, memory/caching, evals; spot-checked the 3 highest-stakes claims
  itself; appended 6 dated entries to the `Docs/technology-evaluations.md` log (created
  minutes earlier by the scenario-3 agent in the shared workspace) with statuses
  `Adopted`/`Watching`; wrote `Docs/agent-research-cadence.md` (re-read log first, delta-only
  research, re-check dates); added a dry-run monthly GitHub Actions cron scaffold.
- Freshness mechanism: yes — cadence doc + cron scaffold (dry-run, needs remote+secret).
- Dedup/no-relearn mechanism: yes in-protocol — "read the log before researching, scope to
  the delta." But the whole system was invented ad hoc this run; a fresh agent in a fresh
  repo next month invents a different one (it only extended this log because scenario 3 had
  just created it in the same directory).
- Vetting of claims: partial — its own spot-checks of 3 surprising claims; no adversarial
  gate; granted `Adopted` status from a single research pass. Status vocabulary
  (Adopted/Watching/Spiking/Rejected) tracks *decision*, not *evidence strength* — a
  single-pass "broad consensus" impression yields Adopted with nothing structurally
  requiring multiple independent sources.
- Cost shape: the main agent did heavy inline synthesis/verification itself (~88k tokens,
  25 tool calls) rather than staying an orchestrator.
- Rationalizations (verbatim): "I extended it rather than building a parallel system"
  (possible only because the log happened to exist); "verify proportional to stakes"
  (self-judged, no independent skeptic).

## Scenario 2 (advisor / from-memory advice)

- Practices recommended and their stated basis: delivered a full CLAUDE.md + 5 subagents +
  hooks scaffold. Every practice justified rhetorically from model memory: "I trust this
  because it's the direct, low-context-cost fix for the most common complaint…". Zero web
  searches, zero sources cited — despite the scenario stating "It is mid-2026; assume the
  state of the art has moved since your training data."
- Any tiering or confidence labels: none. Stale-vs-current-vs-speculative all presented
  with equal confidence.
- Rationalizations (verbatim): each practice framed as trustworthy because plausible —
  "what actually holds under agent-scale usage" — with no evidence newer than training data.

## Scenario 3 (hype vetting)

- Decision on the technique: NOT adopted — status `Watching`, configs untouched. Sound
  skeptical reasoning (single self-reported source, replication track record, threat-model
  change, blast radius), promotion criteria + re-check date recorded.
- Vetting performed: reasoning only (no fetch of the paper — acceptable given the premise).
- Status recorded anywhere durable: yes — but in `Docs/technology-evaluations.md`, a file
  format it invented on the spot ("this repo had none"). The disposition exists; nothing
  connects it to a shared, evidence-tiered body of practice, and no reusable guidance
  artifact results — the next team/repo starts from zero.
- Rationalizations (verbatim): none problematic — this scenario is where baseline behavior
  is strongest.

## Failure summary (what the skill must fix)

Baseline agents are strong at hype-skepticism and can improvise research logs. The
observed, material gaps are narrower than predicted — the skill must address THESE:

1. **From-memory advisor answers**: when asked to apply "current best practices," the agent
   confidently ships training-data memory with rhetorical justification — no sources, no
   freshness check, no confidence labels (scenario 2, the clearest failure).
2. **No evidence-strength tiering**: improvised status vocabularies track decisions
   (Adopted/Watching), not evidence. `Adopted` was granted from one un-adversarial research
   pass; nothing structurally requires multiple independent sources for top-tier trust
   (scenarios 1, 3).
3. **No adversarial verification gate**: claim vetting is self-judged spot-checking by the
   same agent that gathered the claims (scenario 1).
4. **Per-run reinvented machinery, not a durable shared artifact**: each agent invents its
   own log/format/cadence in whatever repo it's in; consistency across runs happened only
   by workspace accident. Nothing persists across machines/projects or ships with the
   toolchain, and no reusable best-practices playbook results — only decision entries
   (scenarios 1, 3).
5. **Orchestrator does the heavy lifting**: the main agent burned its own context on inline
   research/synthesis instead of delegating to a structured, resumable pipeline
   (scenario 1).
