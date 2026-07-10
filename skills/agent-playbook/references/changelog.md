# Playbook Changelog

One digest per sweep, newest first. Each digest states which lanes ran.

## Sweep 2026-07-09 (window 2026-01-09 → 2026-07-09)

Foundational sweep populating a previously empty playbook across all seven topics from 23 vetted sources (arXiv papers, Anthropic/OpenAI/Cursor/Cognition/GitHub lab blogs, and OSS changelogs). All edits are `add` (no prior entries to replace). Duplicate tactics were merged into single entries citing multiple sources.

**Proven (~24):** on-demand tool-search over preloading schemas (opendev + tool-use survey + Anthropic tool-search); ruthless tool-set curation / disable unused MCP tools; compose verified tools into super-tools; runtime tool synthesis with creator/user split; pre/post tool lifecycle hooks; verify final state not transcript; read raw transcripts+grader outputs; pass@k vs pass^k; calibrate/isolate LLM judges; verifier-quality is load-bearing (anti-reward-hacking); gate decisions on deterministic execution signals; multi-seed paired-Wilcoxon ablations; clean isolated eval env stripping .git; staged synthetic-data validation; transaction semantics for multi-tool writes; test non-linear tool-dependency graphs; multi-tier permission model with human approval; red-green TDD; Plan Mode before coding; explicit tool-call DAG with parallel branches; code-not-CoT for computation; place high-signal content at window edges; start fresh session on task switch; precise spec + clarifying-question plan agent.

**Promising (~68):** context compaction (adaptive, two-phase, mandatory, cache-preserving, mid-turn reinjection); short root-map instructions; observability-as-context; filesystem-backed versioned plans; episodic/tiered/curated memory; shadow-git rollback; differentiated error-recovery injection; diff-only isolated review agent; linter-messages-as-remediation; CI regression gating; eval methodology cluster (layered graders, small-early suites, Swiss-Cheese cadences, saturation→regression, isolate-harness, ±1σ, $/solved, leak-audit, mixed benchmarks); mutation-adequacy test validation; separate-critic/separate-test-gen; adversarial counterexamples; resource floor/ceiling calibration; boring dependencies; multi-pass fuzzy edits; LSP tools; agent-facing harness output; manager/child map-reduce; capability/cost routing; shared substrate over implicit state; sub-agent spawning/depth-caps; structured task graphs; golden principles; reactive rule generation.

**Watch (~60):** doom-loop/format-error caps, self-critique phases, unattended loops, drift resets, per-node tool scoping, state-graph loops, shadow-state branching, imagined execution, evidence bundles, change contracts, deep telemetry, DOM-vs-screenshot, cache-boundary model switching, git-tracked memory files, cross-tool config filenames, and many single-source-but-actionable observations.

Notable convergences promoted to Proven by multiple independent sources: on-demand tool loading, execution-grounded gating, TDD, eval-state verification, and permission tiers. No supersessions (empty starting playbook).

Lanes run: arxiv=ok, lab-blogs=ok, oss=ok.
