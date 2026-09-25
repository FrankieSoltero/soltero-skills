# Lean Agency — scoping (NOT yet green-lit for build)

Source of raw material: [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents)
(MIT, "AgentLand Contributors") — 269 persona subagents across 17 divisions.
Assessed 2026-07-29 against the agent playbook (see tiers cited inline in the
session record). Verdict: the catalog and ~4 operational designs are valuable;
the median agent is a 236-line persona with capability-summary descriptions
(13/269 have trigger conditions), zero model pins, tools in 17/269, prose
orchestration, and aspirational "Success Metrics" instead of executable
verification. We adopt the MAP, curate a small roster, and rebuild to house
standards — never bulk-import.

## Adoption principle

**Usage pull, not catalog push.** A division earns a build slot when real work
in our sessions would invoke it. dev-debrief/session-miner telemetry can
arbitrate ordering when in doubt. Playbook basis: small fixed rosters of
narrowly-scoped agents (Watch, cross-vendor); extra specialists add noise
(Watch, Anthropic C-compiler); knowledge-injection skills structured as
overview → current specifics → minimal examples → canonical-docs links
(Promising, Google/Vercel).

## House standards for every adopted piece

1. **Skill-vs-agent split:** default to SKILLS with reference files (knowledge
   injection in-context). Dispatchable AGENTS only where fresh context or
   parallel fan-out genuinely helps (e.g. per-platform content adaptation via
   a lean-sdd-style brief → workers → reviewer pipeline).
2. Trigger-first descriptions ("Use when …"), valid slug names, model pinned
   per tier, minimal tool lists, typed brief/report contracts (lean-sdd
   conventions).
3. **Executable verification, never KPI wallpaper:** platform constraint
   checks, readability/keyword/link checks, claim→source tracing (transcript-
   reader-style refute-verifiers), reviewer gates with two verdicts.
4. **Freshness discipline:** fast-rotting practice (platform algorithms, AEO,
   engine APIs) lives in sweep-maintained references (agent-playbook update
   machinery pattern), not frozen personas.
5. Full creating-a-skill RED→GREEN loop per piece; MIT attribution on lifted
   material.

## Phasing

### Phase 1 — Marketing/content (GREEN-LIT INTEREST, highest gap × importance)
Curate ~6–8 from their 36 (≈13 are China-market-specific — excluded unless
that market becomes real): content-creator, seo-specialist, aeo/agentic-search
pair (AI-search citation optimization — genuinely current), email-strategist,
social strategist (or linkedin + x split), growth-hacker, pr-communications.
Likely shape: `content-marketing` parent skill + 2–3 child skills (seo/aeo,
email, social-adaptation) + ONE dispatchable fan-out agent. RED scenarios test
measurable failures: invented statistics, platform-limit violations, off-brand
voice, uncited claims.

### Phase 2 — Product discovery (cheapest win, same batch as 1 if desired)
Adapt `feedback-synthesizer` + `trend-researcher` as the missing discovery
front-end of the existing PRD pipeline: synthesize → writing-prds →
prd-review. Verification: every synthesized insight traces to a quoted
feedback item/source.

### Phase 3 — Game development (scoped to the multiplayer AI project)
Their 20 agents span unity/unreal/godot/roblox/blender; adopt ONLY the stack
the multiplayer AI project actually uses. Shape: one knowledge-injection
skill (current engine/netcode API references, docs as source of truth) +
possibly one playtest/balance-review agent. **OPEN QUESTION: project stack —
unanswered as of 2026-07-29; blocks scoping detail.**

### Phase 4 — Sales (CONFIRMED REAL: startup repo, active customer acquisition)
Curate from their 9 (outbound-strategist, discovery-coach,
proposal-strategist, pipeline-analyst most relevant). Shape: outreach +
proposal skills with hard anti-hallucination gates — every product claim in
outbound/proposal copy traces to real repo/docs facts; personalization traces
to actual research on the prospect. This is customer-facing output; the
verification bar is highest here.

### Fold-ins (do with any phase)
- `security-senior-secops`'s regex/SAST pattern library → audit-swarm
  reference file.

### Passed on (with reasons)
- **Testing:** lean-tdd, evidence-gate, plan-review, audit-swarm, lean-sdd
  reviewer contracts already exceed their personas.
- **Design:** design-forge + frontend-design plugin + dataviz +
  scaffold-frontend cover it; remainder is costume.
- **Finance:** smallest division, highest hallucinated-numbers risk, hardest
  verification; defer until a concrete review-gated use case exists.
- **Academic:** only if paper-writing becomes real; citation verification is
  cheap to adapt from transcript-reader when it does.
- engineering / specialized / project-management / gis / spatial-computing /
  support / healthcare: superseded by the lean suite or no usage pull.

## Open questions (blocking respective phases)
1. Multiplayer AI project stack? (phase 3)
2. Marketing platforms that matter first? (phase 1 curation)
3. China market ever relevant? (phase 1 exclusions)
4. Startup sales motion: outbound email? demos/proposals? (phase 4 shape)
