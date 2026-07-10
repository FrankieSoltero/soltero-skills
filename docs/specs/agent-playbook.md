# Skill Spec — agent-playbook

- **Problem:** Research on coding agents and agentic loops moves faster than any one
  person can track. Advice given from model memory goes stale, one-shot web searches
  produce unvetted dumps with no persistence, and there is no living, tiered record of
  which tactics are actually proven versus merely hyped.
- **Trigger:** Two modes. **Advisor (default):** auto-triggers on agent-engineering work —
  writing CLAUDE.md/AGENTS.md, designing prompts or agentic loops, configuring
  subagents/workflows, choosing a coding-agent setup — or direct best-practice questions.
  **Update:** user explicitly runs the research sweep ("/agent-playbook update",
  "refresh the agent playbook"). Skill invocation is the explicit opt-in required by the
  Workflow tool.
- **Scope:** A living, tiered best-practices playbook bundled in the skill's `references/`,
  refreshed by a bundled Workflow script (3-lane sweep → dedupe vs seen-log → deep-read →
  1-skeptic tiering → synthesis diffs). The orchestrating model stays light: it reads the
  watermark, launches the workflow, applies returned diffs, and commits. Non-goals:
  benchmarking tactics ourselves, per-user private playbooks, scheduled/cron sweeps
  (can be layered later via /schedule), non-coding-agent research.
- **Success scenario:** An update sweep produces source-linked, tier-labeled playbook
  diffs plus a "what changed" digest, ingests nothing already in the source log, and ends
  in a commit. In advisor mode, an agent-engineering task gets guidance that cites playbook
  entries with their tiers instead of generic from-memory advice — where a no-skill
  baseline (RED) gives a one-shot unvetted dump with no persistence or tiering.

## Architecture (approved 2026-07-09)

**Two modes, one artifact.** The playbook ships inside the public plugin, so update mode
runs only in this Skills repo (SKILL.md instructs a check for `skills/agent-playbook/`
in the working tree and refuses elsewhere, pointing at the repo). Playbook refreshes ride
the normal plugin release cycle. Advisor mode works anywhere the plugin is installed and
reads the bundled references.

**Advisor mode.** Read `references/playbook.md`, apply the relevant topic sections to the
task at hand, and always name the tier (Proven / Promising / Watch) of any tactic
recommended. "What changed recently?" is answered from `references/changelog.md`.

**Update mode orchestration.** The orchestrator's inline work: parse
`references/source-log.md` (watermark date + seen keys), call
`Workflow({scriptPath: "${CLAUDE_SKILL_DIR}/workflows/update.mjs", args: {sinceDate,
seenKeys, today, playbook, bootstrap}})` — timestamps via args because scripts cannot call
`Date.now()` — then apply the returned diffs to the three reference files, show the digest,
and commit. `playbook` is the current playbook text so synthesis can diff against it.
First-ever run sets `bootstrap: true` (~6-month window, higher candidate cap).

**Phase 1 — Sweep.** Three parallel lane agents, each using WebSearch/WebFetch and
returning schema-forced candidates (key: arXiv ID or canonical URL, title, source, date,
claimed tactic, relevance rationale):

- arXiv lane: cs.SE/cs.AI/cs.CL — coding agents, agentic loops, SWE-bench scaffolds,
  context management, tool use, self-repair.
- Lab blog lane: Anthropic, OpenAI, DeepMind, Cursor, Cognition, and peers — engineering
  posts on agent practice.
- OSS lane: release notes / design docs of OpenHands, Aider, SWE-agent, Claude Code
  changelog — practice as encoded in shipping tools.

**Phase 2 — Dedupe (barrier, justified).** Plain code: drop candidates whose key is in
`seenKeys`, dedupe cross-lane by key, cap at 12 candidates (24 in bootstrap) ranked by
relevance rationale; `log()` every dropped candidate — no silent caps. A failed lane
resolves to null and is filtered, but the digest must state which lanes ran.

**Phase 3 — Deep-read → Phase 4 — Verify (pipeline, no barrier).** Per candidate: a
deep-read agent fetches and actually reads the source, extracting concrete actionable
tactics (statement, evidence, proposed tier, tool-specific notes). Each extracted tactic
then goes to one skeptic agent prompted to refute; the skeptic assigns the final tier or
kills the tactic, and defaults to demotion when uncertain (Watch, not Promising). Tiers:
**Proven** (multiple independent sources or benchmarked results), **Promising** (single
credible source), **Watch** (interesting, unverified). Nothing survives without a
fetchable source link.

**Phase 5 — Synthesize.** One agent merges survivors against the current playbook text
into explicit diffs: new entries, tier promotions/demotions, supersessions ("replaces old
guidance on X"), plus a short digest paragraph. Returns
`{edits, digest, logEntries}`; every evaluated candidate gets a log entry with
disposition (adopted / rejected + why / watch) so rejected sources are never re-litigated.

**If WebSearch is unavailable,** update mode aborts with a clear message rather than
fabricating findings from memory.

## Bundled assets

```
skills/agent-playbook/
  SKILL.md                 # trigger, two modes, invocation, guardrails
  workflows/update.mjs     # the Workflow script (sweep → dedupe → read → verify → synth)
  references/
    playbook.md            # living tiered playbook, organized by topic
    source-log.md          # watermark + every evaluated source with disposition
    changelog.md           # per-sweep digest history
```

`playbook.md` topics: context management, agentic loop design, spec/prompting, tool
design, verification & self-repair, multi-agent orchestration, memory. Entry format:
one actionable sentence, tier, source links, date added/updated, agent-agnostic statement
with tool-specific notes (Claude Code / Cursor / generic) where relevant.

## Testing

Repo `creating-a-skill` conventions: RED baseline (agent asked to "keep me current on
coding-agent research" without the skill → one-shot search dump, no dedup/tiers/
persistence), GREEN scenarios under `tests/scenarios/agent-playbook/`:
(a) update mode produces orchestrated, tiered, source-linked diffs + digest + log entries;
(b) advisor mode cites tiered playbook guidance during an agent-engineering task;
(c) a re-run does not re-ingest sources already in the log.
`node tools/check-workflow-syntax.mjs` on `update.mjs` as the syntax gate (plain
`node --check` rejects the Workflow dialect's top-level `return`).
