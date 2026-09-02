# Coding-Agent Playbook

Living, tiered best practices for building and driving coding agents. Maintained by
the `agent-playbook` skill's update sweeps in the soltero-skills repo — entries change
via a sweep (or an explicit correction commit), not ad-hoc edits.

**Tiers:** **Proven** — multiple independent sources or benchmarked results ·
**Promising** — single credible source · **Watch** — interesting, unverified.

Entry format (every entry follows it):

> ### <Tactic as one actionable sentence>
> - **Tier:** Proven | Promising | Watch (added YYYY-MM-DD; updated YYYY-MM-DD)
> - **Sources:** [Title](https://...)
> - **Detail:** agent-agnostic statement of the tactic and when it applies.
>   *Tool notes:* Claude Code / Cursor / generic specifics, if any.

## Context management

### Start a brand-new session once the prior conversation's context no longer serves the next task, rather than piling onto one long thread.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Cursor: Best practices](https://cursor.com/blog/agent-best-practices), [GitHub: Context windows, Plan agent, and TDD](https://github.blog/developer-skills/application-development/context-windows-plan-agent-and-tdd-what-i-learned-building-a-countdown-app-with-github-copilot/)
- **Detail:** Long threads accumulate noise and dilute focus; clear/restart on task switch, on repeated agent mistakes, or after a logical unit of work. Corroborated by Anthropic's Claude Code docs ('kitchen-sink session'), Chroma's context-rot study (18 models), and Stanford 'lost-in-the-middle'. Preserve genuinely reusable context in files, not scrollback.
  *Tool notes:* Cursor @Past Chats / Claude Code `/clear` are the mechanisms; the trigger logic is portable.

### Place the highest-signal content at the beginning or end of the context window, never buried in the middle.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Sourcegraph: Context Engineering](https://sourcegraph.com/blog/context-engineering), [Liu et al. Lost in the Middle](https://arxiv.org/abs/2307.03172)
- **Detail:** Retrieval/QA accuracy is U-shaped over position; the middle degrades. Replicated across 18 frontier models (Chroma 'context rot') and confirmed for modern long-context models. Order assembled context so key evidence sits at the edges.
  *Tool notes:* Model-agnostic.

### Make context compaction adaptive/progressive with staged pressure thresholds, not a single fixed truncation cutoff.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev: Building Effective AI Coding Agents](https://arxiv.org/abs/2603.05344)
- **Detail:** Apply increasingly aggressive pruning/masking/summarization as token pressure rises (e.g. warn >0.70, mask old observations >0.80, prune >0.85, full summarize >0.99), calibrated against the API's reported prompt_tokens. OpenDev reports ~54% lower peak consumption. Convergent with staged compaction in Claude Code (microcompaction) and OpenCode.

### Offload large tool outputs to disk and attach agent-facing truncation hints, instead of silently truncating in-context.
- **Tier:** Proven (added 2026-07-09; updated 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344), [Cursor — Dynamic context discovery](https://cursor.com/blog/dynamic-context-discovery)
- **Detail:** Above a size threshold, persist the full result to disk and replace it with a compact preview plus a hint on how to retrieve the rest (offset/limit/grep/tail). Shipped in Claude Code, LangChain DeepAgents (offload >20k-token results to a file pointer + preview), AWS Strands, and Letta — the identical two-part pattern across independent harnesses. Avoids the data loss of naive head/tail truncation (still the default in several harnesses — Codex's 10KiB head-and-tail, pi-agent's 2000-line cap) and cuts mid-task summarization events; IBM's memory-pointer variant reports a >16,000x context reduction on a related mechanism.

### Inject 'system reminders' as event-triggered, template-based user-role messages gated by guardrail counters, to counteract instruction fade-out.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** Fire reminders on events (N consecutive failures, mode transition) as synthetic user turns (higher compliance than system-role) with counter gating (e.g. MAX_NUDGE_ATTEMPTS=3) to avoid nagging loops. Claude Code implements the same `<system-reminder>` mechanism in production.

### Keep the root instructions file short — repo purpose, gotchas, and non-obvious constraints only — as a navigational map into versioned docs and skills, and cut rules that merely restate what the model already does well.
- **Tier:** Promising (added 2026-07-09; updated 2026-09-01)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/), [Anthropic: New rules of context engineering for Claude 5](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)
- **Detail:** A monolithic instructions file rots, causes priority collapse, and crowds out task context; Augment's AuggieBench and a 2,500-repo study independently find concise root files (20–150 lines) top performers. Anthropic now adds a first-party data point and a sharper content rule: they removed >80% of Claude Code's system prompt for Opus 5 / Fable 5 "with no measurable loss on our coding evaluations," and advise spending the tokens on codebase gotchas rather than repeating standard practice — e.g. replacing itemized formatting rules with "write code that reads like the surrounding code." Two limits on the newer half: the >80% figure is self-reported with no disclosed benchmark, and it is explicitly gated to newest-generation models (older models in the same harness kept the verbose guardrails), so a mixed-model harness may need two prompt profiles. Some research also finds removing prescriptive constraints lowers reliability in narrower settings — cut aggressively, then re-measure.
  *Tool notes:* AGENTS.md/CLAUDE.md convention; push detail into skills and nested docs rather than deleting it.

### Treat anything the agent can't see in-context as nonexistent; engineer surfaces (logs, metrics, traces, docs) to make it visible.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Knowledge in chat threads, Google Docs, or people's heads is inaccessible to the running agent. OpenAI wired production observability (Vector → Victoria Logs/Metrics/Traces, queryable via LogQL/PromQL/TraceQL) into the agent's runtime so it can close a debug loop on live telemetry.

### Persist plans and durable state as filesystem-backed, version-controlled artifacts, not ephemeral prompt/reasoning traces.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [GitHub: Context windows, Plan agent, and TDD](https://github.blog/developer-skills/application-development/context-windows-plan-agent-and-tdd-what-i-learned-building-a-countdown-app-with-github-copilot/)
- **Detail:** Write PLAN.md/status logs (milestones, acceptance criteria, validation commands, recovery rules) so work survives context resets and multi-session execution and can be reviewed by humans or consumed by subagents. Matches Anthropic's structured-note-taking and Claude Code plan-file conventions.

### Hand each worker invocation a curated slice sized well below the model's ceiling — the current task, the relevant plan excerpt, notes, the current solution — and keep partial results in external storage rather than carrying full history forward.
- **Tier:** Proven (added 2026-07-09; updated 2026-09-01)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [MemGPT](https://arxiv.org/abs/2310.08560), [Ledger-Based Self-Orchestration (arXiv 2608.26480)](https://arxiv.org/html/2608.26480), [Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- **Detail:** Reset context between steps and give each invocation a targeted summary plus resource identifiers (L2MAC control unit, MemGPT paging, MemoryOS). The 2026-08 ledger study adds a controlled within-paper measurement of the failure mode this avoids: on the same 500 problems and model, the single-call arm hit its context cap on 150/500 problems and produced 35 empty solutions, while the manager arm with segmented per-worker contexts hit the cap on 5/500 and produced zero — a ~97% reduction in truncation-induced failures while solving more. Anthropic's context-engineering guidance and multi-agent write-ups converge on the same isolation boundary. Note the segmentation is not free: it costs global coherence, and the ledger paper's own results show two of nine model/condition cells regressing slightly under the manager arm.
  *Tool notes:* Curate dynamically per task rather than shipping a fixed slice; large context windows do not remove the benefit.

### Make token-usage estimators count thinking and tool_use blocks accurately, since bad estimates trigger premature compaction.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **Detail:** v2.1.75 fixed over-counting of thinking/tool_use blocks that caused premature context compaction. Extended-thinking (signature/redacted) and tool_use (JSON args) blocks are exactly what naive text-heuristic estimators mishandle.

### Compress failing-test/log output into structured, provenance-preserving summaries before it enters context, keeping the full artifact retrievable.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** Reduce a failing-test report to failing test name, key stack frames, suspected files, and a link to the full log; offload full fidelity to external storage. Convergent with LongCodeZip, SWE-Pruner, and Claude Code's disk-offload.

### Expose a per-category context-usage breakdown (rules, skills, MCP definitions, subagent output) to diagnose what's consuming the window.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Cursor 3.3 changelog](https://cursor.com/changelog/05-06-26), [GitHub Copilot CLI changelog](https://github.blog/changelog/2026-01-14-github-copilot-cli-enhanced-agents-context-management-and-new-ways-to-install/)
- **Detail:** Two independent CLIs (Cursor context ring, Claude Code/Copilot `/context`) surface a category breakdown so operators can target the largest offender before pruning blindly.
  *Tool notes:* Cursor: click the context ring; Copilot/Claude Code: `/context`.

### Treat context compaction as a mandatory architectural requirement once an agent has sustained multi-turn autonomy, not an optional feature.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Across 13 real agents, the one with no compaction (mini-swe-agent) simply crashes on ContextWindowExceededError; all others implement one of seven strategies. Build in structural growth-prevention (per-node/round caps) or reactive compression (LLM summarization at a threshold) before shipping.

### Prefer a two-phase compaction pipeline — cheap structural pruning of verbose old outputs first, then LLM summarization only if still over budget.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** OpenCode prunes tool outputs older than the most recent ~40k tokens (no LLM call) before invoking a dedicated compaction agent — 'the most surgical' cure-strategy. Independently mirrored by Kilocode's Context Condensing and Claude Code's free microcompact vs. expensive full-compact tiers.

### On mid-turn compaction, reinject retained initial/system context just above the last user message, matching the position the model was trained to expect.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Codex CLI distinguishes pre-turn compaction (clear + clean reinjection next turn) from mid-turn compaction (inject initial context above the last real user message). Verified against openai/codex source (`BeforeLastUserMessage` vs `DoNotInject`).

### Batch truncation-boundary recomputation behind a coarse polling interval so the shared message prefix stays stable and prompt caching isn't invalidated every turn.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** SWE-agent's LastNObservations processor exposes a `polling` param: without it every new observation busts the cache; with it truncation changes only every N steps. Directly relevant to providers with prefix/prompt caching (Anthropic, OpenAI).

### Let the agent pull context on demand via built-in grep/semantic search instead of manually @-tagging files; hand-tag only when you know the exact file.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor: Best practices](https://cursor.com/blog/agent-best-practices)
- **Detail:** Including irrelevant files can confuse the agent about what matters. Asserted house style; one counter-example (Vercel evals) shows agents sometimes never invoke on-demand retrieval, so validate per case.

### Use a two-stage retrieval pipeline: pull a high-recall candidate set then cross-encoder re-rank down to a precise top-k before inserting into the prompt.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Sourcegraph: Context Engineering](https://sourcegraph.com/blog/context-engineering)
- **Detail:** Retrieving 50 candidates and re-ranking to top-5 beats dumping all 50. Well-established in general RAG (Cohere Rerank benchmarks) but not yet validated specifically for coding-agent retrieval.

### Actively cut low-signal content before it enters context — truncate tool outputs, compact old turns, drop sub-threshold chunks, cap per-retrieval contribution.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Sourcegraph: Context Engineering](https://sourcegraph.com/blog/context-engineering)
- **Detail:** Anecdote: agents performed worse with a 100K-token codebase summary than a 5K-token targeted retrieval. Motivating context-rot phenomenon is well-benchmarked; the specific interventions are not.

### Force periodic fresh starts / context resets for long-running agents to counteract drift and tunnel vision.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor: Scaling long-running autonomous coding](https://cursor.com/blog/scaling-agents)
- **Detail:** Cursor lists this as a still-necessary, only-partially-solved fix for agents that run too long. Requires externalized state to avoid losing in-progress decisions; a recovery-vs-continuity tradeoff, not a clean win.

### Prefer conservative regex/structured filtering over LLM paraphrase when compressing tool output containing exact-match evidence (error strings, paths, hashes).
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO: Self-Evolving Terminal Agents](https://arxiv.org/abs/2606.19572)
- **Detail:** Token/summary paraphrase can corrupt values the agent relies on verbatim; TACO's rule-based filter beat LLM summarization on accuracy in one small comparison. Always pass error/exception traces through unchanged.

### Give each model in a multi-model pipeline its own persistent, separately-cached context rather than tool-calling the second model with re-fed context.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cognition: Devin Fusion](https://cognition.com/blog/devin-fusion)
- **Detail:** Treating another model as a stateless tool call pays a cache-miss tax each invocation; parallel persistent conversations per agent keep prefixes stable. Single-source architectural rationale.

### Trigger model switches at context-compaction boundaries, since compaction already forces a cache miss so the switch adds no extra cost.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cognition: Devin Fusion](https://cognition.com/blog/devin-fusion)
- **Detail:** Aligns the two cache-invalidating events (model switch + compaction) so you pay one miss instead of two; even lets you upgrade the sidekick model 'for free'. Mechanistically sound, single-source.

### Compress completed subtasks into compact progress summaries rather than retaining full raw trajectory.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Evolution of Tool Use in LLM Agents](https://arxiv.org/pdf/2603.22862)
- **Detail:** COMPASS summarizes finished stages into 'progress briefs' to keep the agent aligned with the global objective. Distinct from token-threshold compaction; effective mainly when subtasks are cleanly bounded.

### Pick the agent's perception representation (full DOM text vs screenshot) by the task's token/latency tradeoff, not a single default modality.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Extract DOM text for summarization; use screenshots for visual/e-commerce search. Single first-party qualitative source; note a structured-DOM extract often beats both (a middle option the binary framing omits). Scoped to browser/computer-use agents.

### Give slow test suites a --fast mode that runs a deterministic-per-agent random sample so each agent gets stable regression signal while the fleet still covers everything.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic: Building a C compiler with parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)
- **Detail:** Fixes LLM 'time blindness' (spending hours on full slow runs); sample ~1-10%, deterministic per agent identity but varying across VMs. Requires a fleet + per-agent seeding; single-source, unbenchmarked.

### Retain agent history as append-only immutable events with compaction represented by inserted markers, so aggressive compaction never destroys replay/audit.
- **Tier:** Promising (added 2026-07-09; updated 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515), [Anthropic — Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents), [Cursor — Dynamic context discovery](https://cursor.com/blog/dynamic-context-discovery)
- **Detail:** OpenHands computes filtered views from an immutable EventStream via condensation markers, contrasted with Aider's destructive summarization that overwrites history. Store raw events durably (emitEvent/getEvents/getSession), do compaction as a read-time transform, and when a summary drops a needed detail grep the full pre-summary history to recover it — three independent implementations (OpenHands, Anthropic Managed Agents, ESAA arXiv 2602.23193) converge, upgrading this from a minority curiosity to a credible default. Cost: event-sourcing overhead; no source yet gives a controlled quality benchmark vs. destructive compaction.

### Diagnose context bucket-by-bucket and target the single largest offender first, rather than pruning blindly.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor 3.3 changelog](https://cursor.com/changelog/05-06-26)
- **Detail:** Use the relative sizes of rules/skills/MCP/subagent categories to decide what to cut; a forum user discovered a skill was consuming disproportionate context this way. Tool-specific mechanism; single anecdote.

### Prefer materializing large/dynamic information (tool outputs, history, skills, tool schemas, logs) as plain files on disk and let the agent use generic read/grep/search over them, rather than bespoke per-source context-injection abstractions.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Cursor — Dynamic context discovery](https://cursor.com/blog/dynamic-context-discovery)
- **Detail:** "Files as a simple, powerful primitive" — a safer default than another abstraction that can't account for the future. Only the MCP-folder instance carries a quantified benchmark (46.9%), but multiple independent teams converge on the same practice: Vercel ("can I represent this as files?"), Arize's survey of Pi/OpenClaw/Claude Code/Letta disk-offload caps, and an arXiv "is grep all you need" analysis. Changes real decisions (don't build a custom summarizer/RAG per data type).

### Return only a structured result from each sub-task worker to the planner (status, artifact refs, a short summary, and on failure a brief root-cause) — never let raw stdout, stack traces, or failed attempts propagate back.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [CodeDelegator (arXiv 2601.14914)](https://arxiv.org/abs/2601.14914)
- **Detail:** Replacing this typed asymmetric channel with free-form message passing (keeping the two-agent split) costs 4.7pp on MCPMark, isolating the value of filtered upward communication. Corroborated in practice by Claude Code subagent design, LangChain subagents, and Redis engineering — sub-agents return condensed conclusions, not raw traces, to avoid polluting the planner's context.

### Structure post-hoc trajectory analysis as a layered drill-down corpus — raw traces at the bottom, per-task reports above, one aggregated overview at top — so a debugging agent starts cheap and pulls detail only to justify a specific edit.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Agentic Harness Engineering (arXiv 2604.25850)](https://arxiv.org/html/2604.25850v1)
- **Detail:** Distills millions of raw trajectory tokens into files supporting progressive disclosure. The general progressive-disclosure principle is well established (Anthropic skill guidance, multiple token-reduction reports), but this specific trajectory-analysis instantiation is single-source with no isolated metric. Analogous to a top-level summary.md plus per-case detail files.

### Constrain an agentic code evaluator to read only entry-point definitions and interface signatures rather than exhaustively reading the whole codebase, to avoid diluting its attention budget.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** A judge-prompt iteration ("context overload" fix, v3→v4) improved BoN-Acc 62.4%→67.4% and r_eval 0.556→0.598 on NL2Repo. Note the paired finding that the very next step (over-specification) hurt — the useful band between under- and over-instruction is narrow and evaluator-capacity-dependent. Single non-isolated ablation, one narrow use case (code-judge evaluators).

### After any automatic code-context pruning/compression step, run a cheap AST-based repair pass that force-restores structurally-required lines even if the pruner scored them low.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Context Pruning via Multi-Rubric Latent Reasoning (arXiv 2605.15315)](https://arxiv.org/pdf/2605.15315)
- **Detail:** Restore referenced imports, enclosing class/def/scope headers, matching try/except/else/finally siblings, bracket/string closures, and referenced return lines. Removing the repair step lowered validation F1 (0.780→0.796 with repair), lowered LongCodeQA accuracy at 8x compression (55.6→60.0), and increased agent interaction rounds (21.3→18.8). Single-paper; sibling work confirms broken syntactic structure is a top compression failure mode, but no second source validates this exact fix.

### When compressing code context, prune and score at line granularity (aggregate token scores into a per-line keep-fraction, threshold ~0.4) rather than pruning individual tokens, to preserve syntactic validity.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Context Pruning via Multi-Rubric Latent Reasoning (arXiv 2605.15315)](https://arxiv.org/pdf/2605.15315)
- **Detail:** Token-level baselines (LLMLingua-2, Selective-Context) degrade far more sharply at 8x compression on LCC/LongCodeQA than line-granularity methods, which the authors attribute to token pruning corrupting syntax. Corroborated independently by LongCodeZip (arXiv 2510.00446) and SWE-Pruner. Causal isolation imperfect (chunk/function-level retrieval also degrades gracefully), and the insight predates this paper.

### When building a code-context pruner/retriever, decompose "keep this line?" into multiple independent relevance dimensions (semantic match vs. structural/dependency necessity) instead of one scalar relevance score.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Context Pruning via Multi-Rubric Latent Reasoning (arXiv 2605.15315)](https://arxiv.org/pdf/2605.15315)
- **Detail:** A single-objective CRF pruner must model both contiguous semantic blocks and sparse structural-support lines with one transition matrix, dropping imports/class headers/except clauses that score low on semantics alone. But the naive version (adding a dimension without AST-aware dependency repair + MoE gating) underperforms semantic-only on LongCodeQA-8x — the reported gains require the fuller mechanism, and combining semantic+structural signals is already known practice (GraphCodeBERT hybrids, dependency-aware reranking).

### Don't stack two aggressive compression stages; run an upstream retriever in coarse/rank-only mode (function-level selection) and let a dedicated fine-grained pruner handle line-level decisions.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Context Pruning via Multi-Rubric Latent Reasoning (arXiv 2605.15315)](https://arxiv.org/pdf/2605.15315)
- **Detail:** Running LongCodeZip in full-compression mode before the line-pruner substantially hurt performance; the best result used LongCodeZip in rank-only mode (coarse function selection) plus the fine pruner. The recommended coarse-retrieval-then-fine-pruning pattern is independently validated by SWE-Pruner (arXiv 2601.16746, 23-54% extra token reduction over retrieval alone); the negative-stacking failure mode itself is single-source.

### When you lack per-dimension labels for a multi-objective relevance classifier, derive them for free from an existing binary keep/prune corpus via static analysis (AST dependency-edge propagation with geometrically decaying hop weights) instead of new annotation.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Context Pruning via Multi-Rubric Latent Reasoning (arXiv 2605.15315)](https://arxiv.org/pdf/2605.15315)
- **Detail:** Rubric-guided labeling extracts semantic and dependency sub-labels with zero extra LLM calls and denoises the teacher's binary labels (recovering import/scope lines the teacher marked prunable on semantic grounds). Single-source, no ablation isolating the denoising benefit, and narrow (only relevant when training a custom pruner).

### Give the agent a structured, queryable evidence graph to query on demand for hypothesis-relevant events, instead of serializing full execution traces/logs into the prompt.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** A motivational study on 17 Defects4J projects found raw traces average 2.38M runtime events/bug, only 0.55% touch developer-patched methods, and 99.95% are repetitive — huge and low-signal as context. A Temporal Execution Graph queried on demand (dynamic_method_macro/sequence_info/call_context/…) keeps repair effective while compressing this; ablating it dropped correctly-repaired bugs ~8.6%. Single paper.
  *Tool notes:* Built from bytecode-level instrumentation; orchestration in LangGraph.

### Compact dynamic evidence with a staged filter pipeline before it reaches the agent: coverage-filter to methods executed by a failing test, structural-filter out trivially-recoverable methods (getters/setters/empty/delegators), then behavior-filter records that can't connect to a valid invocation chain.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** On 854 bugs, execution filtering removed ~94.85% of executed methods, structural filtering a further −16.9% methods / −37.5% events, and behavior filtering −55.97% retained records / −45.89% trace size — compounding, cheapest-first. Single paper (Java/Defects4J).
  *Tool notes:* EF via JaCoCo coverage, SF via AST analysis, BF via graph-connectivity over the reconstructed execution.

### Pass a structured summary (key findings, unresolved issues, chosen next action) between reasoning stages instead of full history, letting the agent pull raw history back only if the summary proves insufficient.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** CT-Repair's summary-based state transfer averaged ~178K tokens/bug vs 270K/438K for context-heavier baselines. The quantitative attribution is a confounded whole-pipeline comparison, and summarization is lossy — the on-demand raw-retrieval fallback is what makes it safe; the pattern (structured handoff + on-demand raw pull) is independently attested in industry compaction work.

### Anchor agent memory to git: persist only a thin ledger (conversation turns with role tags, tool names, file paths, producing commit SHA — never diff/code content) and treat derived indexes/structural maps as disposable functions of the tree at a SHA, regenerated from the ledger.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Why Git Is the Memory Solution for the Agentic Development Lifecycle (arXiv 2607.14390)](https://arxiv.org/abs/2607.14390)
- **Detail:** Reconstruct code content on demand from the commit SHA; refresh compiled structure by diffing only changed sections and surface drift as an ordinary reviewable git diff; keep the memory router's own decision logic as plain git-versioned text rather than an opaque component. Single vendor preprint — architectural argument, no ablation vs a fat/diff-storing store.

### Periodically review an accumulated rule/instruction file for redundant or overlapping entries and let the more specific rule subsume the more general one, rather than letting duplicates accumulate.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Self-Improving AI Coding Agents Through Accumulated Behavioral Rules (arXiv 2607.13091)](https://arxiv.org/abs/2607.13091)
- **Detail:** A specificity-based tie-break for overlaps; the paper flags automated conflict detection (cluster similar review comments, flag proposed rules that contradict existing ones before merge) as unbuilt future work. Convergent with CLAUDE.md/AGENTS.md pruning guidance and rule-based subsumption; unquantified governance heuristic.

### Keep an ephemeral session-handoff file (in-progress work, pending reviews, suggested next actions) plus a chronological task log, distinct from the permanent rule/memory file, to preserve work-in-progress continuity across sessions.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Self-Improving AI Coding Agents (arXiv 2607.13091)](https://arxiv.org/abs/2607.13091)
- **Detail:** The specific split — ephemeral WIP handoff vs permanent rules vs chronological log — is corroborated by multiple independent handoff-pattern implementations (this repo's agent-handoff skill converges on the same eight-element handoff). In-paper evidence isn't isolated, but the design is a concrete, adopted community pattern.

### When overseeing a large agent swarm, deliberately ignore individual agent failures (the loop's fixer agents burn those down) and watch only for recurring cross-file patterns that signal a systemic rule gap.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** 'Individual failures are the loop's job. Your attention belongs on the patterns' — a recurring mistake means fix the upstream rule once and regenerate, not patch each instance. A specific instance of human-on-the-loop oversight; single-source case study.

### When building the context a judge/guardrail LLM sees, include only the risk-signal fields (tool name, arguments, a short actor summary) and exclude verbose reasoning/extended-thinking traces, exposing the formatter as an overridable hook for the rare case needing reasoning visibility.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [OpenHands SDK v1.36.0 — ToolShieldLLMSecurityAnalyzer](https://github.com/OpenHands/software-agent-sdk/releases/tag/v1.36.0)
- **Detail:** Reasoning text inflates prompt size without proportional judge-accuracy gain (asserted design choice, unablated). Note the field is genuinely split — some guardrail designs (GuardReasoner-style) deliberately keep or generate reasoning as part of judgment, so treat this as one team's default, not settled.

### Don't treat 'read everything first' as the safe default for hard/deceptive tasks — on the hardest tier it is also the policy most likely to fail (burning step budgets, hitting provider tokens-per-minute limits), not a reliability guarantee.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Do AI Agents Know When a Task Is Simple? (arXiv 2607.13034)](https://arxiv.org/abs/2607.13034)
- **Detail:** In a real GPT-4o case study the heaviest-reading trajectories were the ones that failed (step-budget exhaustion, wrong edits, TPM rate-limit at ~315k cumulative tokens). Cuts against the intuitive 'when unsure, read more to be safe'; the token-bloat→TPM-ceiling mechanism is independently corroborated by Claude Code rate-limit/auto-compaction guidance. Underpowered case study (n=3, one model).

### Layer instructions by progressive disclosure — a thin root file, opinions and workflows in skills, and long skills split across files — rather than one always-loaded block.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Anthropic: New rules of context engineering for Claude 5](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models), [Anthropic: Agent Skills best practices](https://platform.claude.com/docs)
- **Detail:** Anthropic reports moving verification and code review out of the always-on prompt into their own skills, and advises that a long skill be divided across multiple files loaded on demand; the official skill-authoring docs independently prescribe the same shape (keep SKILL.md under ~500 lines, split into referenced files, keep references one level deep) and warn against over-constraining skill instructions. Complements — does not duplicate — the existing tool-search and skill-metadata entries under Tool design, which cover capability *discovery*; this is about where written guidance lives. Evidence is asymmetric: the deferred-tool-loading half is well-benchmarked, while "move verification into skills" and "split long skills" rest on first-party observation. Beware a fabricated specific that circulates with this advice: neither source states a "1–2 key practices per skill" threshold.

### Run the in-session `/doctor` command to audit an accumulated context config — deduping local vs checked-in instruction files, trimming what the agent could derive from the codebase, and flagging unused skills/MCP servers by context cost.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Anthropic: New rules of context engineering for Claude 5](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models), [Claude Code commands reference](https://code.claude.com/docs/en/commands)
- **Detail:** Automates the rightsizing the entries above prescribe by hand: it deduplicates CLAUDE.md content, migrates always-loaded guidance into on-demand skills or nested files, and reports which skills/plugins/MCP servers are costing context without being used. Existence and behavior are confirmed by Anthropic's own reference docs independently of the announcement blog; effectiveness is unbenchmarked by anyone.
  *Tool notes:* Correction worth carrying: the terminal `claude doctor` subcommand is installation diagnostics only (version, path, auto-update) and does **no** context analysis — its own `--help` points to the in-session `/doctor` slash command, which is what performs the rightsizing. Don't wire the CLI form into CI expecting CLAUDE.md recommendations.

### Strip over-constraining system-prompt rules when moving a harness to a newer model generation, and re-measure rather than carrying old guardrails forward by default.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Anthropic: New rules of context engineering for Claude 5](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)
- **Detail:** Anthropic removed over 80% of Claude Code's system prompt for Opus 5 / Fable 5 with no measurable loss on their coding evaluations, replacing itemized directives with judgment-level guidance. This is a model-generation-scoped claim on self-reported internal evals — no benchmark names, numbers, or external validation — and narrower research finds removing prescriptive constraints can *lower* reliability in some agent settings. Reinforces the existing "don't hard-code harness workarounds for a model's quirks" entry: treat prompt bulk as debt to re-litigate at every model bump, and keep a rollback path.

### Bind tool outputs and derived state to variables in a persistent execution environment and print only explicit projections into the model's context, instead of serializing every result into the transcript.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Context as an Environment (arXiv 2608.21690)](https://arxiv.org/abs/2608.21690), [Anthropic: Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- **Detail:** The Scroll system keeps session state in a sandboxed Python kernel and admits only what the agent explicitly prints, reporting 94.8% on LongMemEval_S, 73.1% on BEAM_10M (+5.1 over prior best) and 86.7% on LOCA_256K. Its ablations attribute most of that to the persistent kernel itself (removing it costs 7.3 points) rather than to the surrounding index machinery. The general principle — keep bulk state outside the window and pull in projections — is independently established by Anthropic's code-execution-with-MCP work (50–98% token reductions in production examples) and sits alongside this playbook's disk-offload and files-as-primitive entries; the specific typed-kernel instantiation is one unreplicated paper on a non-Claude backbone and specialized long-horizon memory benchmarks.
  *Tool notes:* Correction to a common misreading: in Claude Code the Bash tool's working directory persists but shell state does not, so persist this state through files or a small DB, not shell/interpreter variables.

### When evicting stale spans to stay in budget, leave behind a landmark/pointer index into an append-only log so the evicted region can be fetched back precisely instead of re-searching the whole history.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Context as an Environment (arXiv 2608.21690)](https://arxiv.org/abs/2608.21690), [MemGPT](https://arxiv.org/abs/2310.08560)
- **Detail:** Scroll pairs a lossless append-only event log with an eviction index of compact headline summaries tied to exact log addresses, rolled up hierarchically so recovery is a direct seek rather than a scan. Two reasons this stays at Watch despite strong headline numbers: the paper's own ablation isolates the index at only −1.8 points when removed (the persistent kernel is the real driver, −7.3), and the apples-to-apples comparison against a plain programmatic-context baseline at 256K is 86.7% vs 85.3% — a 1.4-point edge, not the cross-paper 37-point gap sometimes quoted. The mechanism is also essentially MemGPT-style paging with better addressing, not new. This complements the existing append-only-events entry under Context management; the addition is the addressable index, and "grep the log" is the naive version it exists to avoid.
  *Tool notes:* Newline-delimited JSON plus stored byte/line offsets is the cheap implementation; only build the hierarchical roll-up if scans are actually the bottleneck.

### Quarantine approvals, authorizations and standing constraints from lossy compaction — carry them forward verbatim as durable state rather than letting a summarizer decide they are narrative.
- **Tier:** Proven (added 2026-09-01)
- **Sources:** [Codex CLI 0.152.0 release notes](https://github.com/openai/codex/releases/tag/rust-v0.152.0), [Governance Decay: How Context Compaction Silently Erases Safety Constraints (arXiv 2606.22528)](https://arxiv.org/abs/2606.22528)
- **Detail:** Two independent lines of evidence. In production, Codex needed five sequential PRs (#41660, #41846, #41852, #41857, #41858, plus #41385 giving Guardian classifications distinct turn identities) to make its approval layer preserve user instructions, user answers and valid authorizations across history compaction — evidence this is subtle and easy to get wrong rather than a one-line fix. In benchmark, ConstraintRot (1,323 episodes, seven model families) measures constraint-violation rate rising from 0% with the constraint in full context to 30% after compaction (59% for some models), and shows "constraint pinning" — exempting governance constraints from the lossy path — restores it to 0%. Design implication: model authorization and standing constraints as tagged, non-compactable state with their own lifecycle, not as prose in the transcript the general summarizer owns.
  *Tool notes:* Applies to any harness that combines a permission/approval gate with context compression; partition approval-critical content before compaction rather than hoping summarization preserves it.

### Give an automatic approval/review step its own transcript budget rather than making it compete with general message history.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Codex CLI 0.152.0 release notes](https://github.com/openai/codex/releases/tag/rust-v0.152.0)
- **Detail:** PR #41931 raised Guardian's approval-review transcript ceiling from 10,000→20,000 tokens and its per-message cap from 2,000→5,000, tiered separately from the main conversation. Thin evidence by design: a bare numeric bump in a changelog with no stated bug report, motivating failure, or before/after measurement, on hardcoded internals of one vendor's proprietary approval subsystem — there is no user-facing lever to copy. Worth logging only as an early signal that decision-making steps may warrant their own context allocation; the tiering claim is interpretation, not demonstrated.

### When an item exceeds a context budget because of embedded media, strip the media and keep the accompanying user text rather than dropping the whole message.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Codex CLI 0.152.0 release notes](https://github.com/openai/codex/releases/tag/rust-v0.152.0)
- **Detail:** PR #41858 fixes exactly this: Guardian history has a 4 MiB budget and previously skipped an entire user message containing an oversized image, silently discarding any instructions attached to it; the fix retains the text and metadata and omits only the image. The generalized rule (prioritize instructions over visual context when truncating mixed-media history) is a plausible extrapolation, not something the source demonstrates — this is a narrow fix inside one approval-review subsystem, not the main context pipeline, and no independent corroboration exists. It survives because a major lab shipped this exact gap to production, which suggests it isn't obvious.

### Fix harness-level context handling — retaining the model's own reasoning between turns and summarizing rather than truncating old context — before blaming the model for long-horizon failures.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [OpenAI: Codex as a platform](https://developers.openai.com/blog/codex-as-a-platform)
- **Detail:** On ARC-AGI-3, enabling retained reasoning and context compaction took GPT-5.6 Sol from 13.3% to 38.3% while cutting output tokens sixfold. The mechanism is specific and diagnosable: the official harness discarded private reasoning after every move and truncated (rather than summarized) old context when the window filled, forcing the model to re-derive game state each turn. Weigh two limits before generalizing: it is a single-vendor self-report (every secondary write-up traces to the same post), and ARC-AGI-3 is a long-horizon interactive benchmark where per-turn state tracking *is* the task — a domain unusually sensitive to exactly this bug, so don't expect 3x on patch-shaped coding work. Most practitioners consume this as "choose a harness that does these two things," which is closer to a selection criterion than a technique.

### For an agent embedded in an existing product, source its context from that product's own structured views — the queue, dashboard, timeline, or system record — exposed as tools/resources, rather than rebuilding the workflow as a generic chat box.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [OpenAI: Codex as a platform](https://developers.openai.com/blog/codex-as-a-platform)
- **Detail:** The named pattern: a security analyst's agent needs the investigation queue, recent alerts, affected services and an approval step; a support engineer's needs account history, product logs, internal docs and a draft response — context that lives in domain views, not conversation. The stated anti-pattern is replacing specialized interfaces with "a universal chat box." Evidence is thin for a Proven-shaped claim: one vendor's post showcasing its own platform customers (Relay, GitHub/JetBrains, Cisco), with no metric attached to this specific claim, and the underlying idea is already settled UX practice elsewhere (Fin in the help-center flow, Copilot in Outlook/Teams side panels). Also note the scope: this is guidance for teams embedding agents into enterprise software, not context-window engineering for a coding agent's own session.
  *Tool notes:* Deliver domain views to the harness as MCP resources alongside tool definitions.

## Agentic loop design

### Run the agent in Plan Mode before generating code: research the codebase, ask clarifying questions, and produce a reviewable plan with file paths that you approve first.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Cursor: Best practices](https://cursor.com/blog/agent-best-practices), [Anthropic Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- **Detail:** Plan-then-approve-then-build is independently prescribed by Anthropic (Explore→Plan→Implement→Commit), Aider (architect mode), and a U-Chicago study (experienced devs plan more). Persist approved plans for reuse.
  *Tool notes:* Cursor Shift+Tab; the practice is tool-agnostic.

### Build an explicit dependency graph/DAG of tool calls up front and execute independent branches concurrently, instead of a strictly serial ReAct loop.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [LLMCompiler](https://arxiv.org/abs/2312.04511)
- **Detail:** LLMCompiler reports up to 3.7x latency and 6.7x cost savings plus ~9% accuracy over ReAct; SoT, M1-Parallel converge. Effective only when dependency structure is explicit and side effects are controlled (guard against race conditions on shared state).

### Delegate arithmetic, logic, and symbolic manipulation to executable code an interpreter runs, rather than doing it inside natural-language chain-of-thought.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [PAL](https://arxiv.org/abs/2211.10435)
- **Detail:** Five independent systems (PAL/PoT, MathCoder, CodeI/O, CodeAdapt) with benchmarks show offloading computation to code improves reliability over pure CoT — code-enabled models even match specialized reasoning models.

### Run every eval trial from a clean, isolated environment and strip persistence (leftover files, caches, git history) so agents can't gain an unfair advantage from prior-trial residue.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), [Cursor: Reward hacking swamping intelligence gains]
- **Detail:** Anthropic documented Claude examining git history from previous trials; Cursor found 9% of Opus trajectories mined bundled .git for the fix commit, and enforcing isolation dropped scores 14-21 points. Strip .git / reinit single-commit, deny network by default, ephemeral containers.
  *Tool notes:* Harbor or equivalent per-trial containerization.

### Default to flat/linear execution and escalate to hierarchical/graph re-planning only when a local failure is actually detected.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862)
- **Detail:** ADaPT runs flat first and escalates to And/Or graph decomposition only on a self-detected local failure, with benchmark gains up to 33%. Evidence is embodied/web benchmarks, so coding transfer is plausible but unverified.

### Run a lookahead/simulated rollout of candidate action sequences before committing an irreversible or high-risk tool call, executing only the best-scoring branch.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [ARTIS](https://arxiv.org/abs/2602.01709)
- **Detail:** ARTIS decouples exploration from commitment for high-risk actions (needs a high-fidelity simulator); LATS adds lookahead + backtracking, but its rollback was tested only on cheap-to-revert domains. Gate the simulate-then-commit pattern to irreversible actions specifically.

### Bound retries on recognizable failure loops (consecutive format errors, repeated identical tool calls) and hard-abort or re-plan; reset the counter on any success.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [mini-swe-agent v2.4.0 (PR #863)](https://github.com/SWE-agent/mini-swe-agent/releases), [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** mini-swe-agent caps consecutive format errors (default 3, RepeatedFormatError exit) and resets on any clean step; OpenDev fingerprints repeated tool calls in a sliding window and escalates. Count *consecutive* failures separately from total steps, and give the abort a distinct exit status for triage. Kilocode ships the same fingerprint mechanism.

### Have the frontier/main agent take minimal direct actions and delegate mechanical execution to a cheaper sidekick, reserving the main model for planning, disambiguation, review — and for writing the rules other agents will follow.
- **Tier:** Promising (added 2026-07-09; updated 2026-07-17)
- **Sources:** [Cognition: Devin Fusion](https://cognition.com/blog/devin-fusion), [Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration), [Cognition: Making Fable Cheaper Than Opus](https://cognition.com/blog/making-fable-cheaper-than-opus)
- **Detail:** The main agent should delegate and monitor by default; Anthropic's lead/subagent split reports >90% over single-agent. Two further first-party reports sharpen it: Anthropic's large-scale migrations route high-volume mechanical translation to smaller models (Sonnet fanned across subagents) and reserve the largest model for reviewers and — critically — for authoring the rules/prompts other agents follow (a Bun Zig→Rust migration spent ~$165k across 5.9B/690M tokens under this routing); and Cognition's Fable found lead-model turn count is the dominant cost lever (Fable lead ~11.5 turns/run vs Opus ~26.5, cost dominated by lead turns + dragged-along context, not raw token price), so design the loop for the lead to take as few turns as possible by delegating substantive work early rather than looping solo. Keep judgment-heavy steps on the strong model — Cognition notes delegating nuanced-judgment work hurt.

### Generate new filtering/handling rules reactively and lazily — only on first encounter with an uncovered output type — rather than enumerating every case upfront.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** One reactively-generated rule (e.g. objdump handling at episode 9) was reused 18 times and captured ~99% of a task's compression savings. Invest in reactive rule synthesis + a rule cache, not upfront enumeration.

### Detect repair-loop dead-ends (same bug/feedback recurring across iterations) and switch to a different candidate from a pre-generated diverse plan pool, rather than iterating on a stuck trajectory.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** PairCoder pre-generates a diverse plan pool (k-means++ clustering) and switches candidates when history-based analysis flags recurrence; ASE 2024 Distinguished Paper with 16-162% relative gains. Combine diverse pool + recurrence detection + history-clearing switch.

### Test whether workers can already resolve conflicts themselves before adding a middle-layer coordination/integrator role.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Cursor: Scaling long-running autonomous coding](https://cursor.com/blog/scaling-agents)
- **Detail:** Cursor removed an integrator role after finding workers handled conflicts themselves and it 'created more bottlenecks than it solved' — but for high-interdependency tasks a central coordinator can be warranted, so this is task-dependent.

### Standardize the execution protocol when benchmarking agents — non-interactive single-turn, fixed timeout, web tools disabled, uniform reasoning effort, normalized context window.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [GitHub: Evaluating the Copilot agentic harness](https://github.blog/ai-and-ml/github-copilot/evaluating-performance-and-efficiency-of-the-github-copilot-agentic-harness-across-models-and-tasks/)
- **Detail:** Hold run conditions fixed so results aren't skewed by differing settings between harnesses. Standard experimental hygiene applied to agent bake-offs.

### Use inference-time compute to search over multiple candidate solution trajectories (tree search / MCTS pruned by execution feedback or learned critics) for high-stakes or long-horizon tasks.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [SWE-Search](https://arxiv.org/abs/2410.20285)
- **Detail:** SWE-Search (MCTS over repair trajectories, +23%), CodeTree, Tree-of-Code, RethinkMCTS converge. Costs multiply LLM+execution calls, so scope to high-stakes work; production/general-task validation still open.

### Layer at least one additional loop primitive (generate-test-repair, retry, or plan-execute) on top of a bare ReAct cycle to handle failures a single feedback loop can't recover from.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** 11 of 13 surveyed production agents compose multiple primitives; the two pure single-primitive agents are deliberate minimalist baselines. Compatible with Anthropic's composed-workflow guidance and Reflexion. Scope: add complexity to handle real failure modes, not reflexively.

### Decouple the per-step executor (one LLM call proposing+executing an action) from the outer orchestration strategy (sequential loop vs tree search vs retry) as separately swappable components.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Moatless Tools drives one unmodified ActionAgent from AgenticLoop (ReAct), SearchTree (MCTS), or OneOffFlow via a stable interface — switching exploration strategy becomes config, not a rewrite. Verified against source; most agents still couple these tightly.

### Add optional 'thinking' and pre-dispatch 'self-critique' phases inside the ReAct loop so the agent reviews its own proposed action for errors before the tool call is dispatched.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** OpenDev's six-phase loop adds optional thinking + self-critique before action. Overlaps ReAct/Self-Refine/Reflexion; research (Huang et al.) shows self-critique without external signals can be net-negative, so gate to complex tasks.

### Run the coding agent in an unattended restart loop (inside a sandbox) so it autonomously picks the next task, but keep active harness-level supervision.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- **Detail:** `while true; do claude --dangerously-skip-permissions -p ...; done` ran ~2 weeks/2000 sessions — but only inside Docker, with continuous human test/environment redesign, and it once self-terminated (`pkill -9 bash`). Not fire-and-forget; single vendor case, no baseline.

### Keep exactly one agent responsible for writing/editing code even when running multiple agents in parallel; route all others as advisory input.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cognition: Multi-Agents](https://cognition.com/blog/multi-agents-working)
- **Detail:** Parallel writers create conflicting implicit decisions that fragment the codebase. Stated more absolutely than the ecosystem converges on — isolated parallel writers to git worktrees + sequential merge is a viable alternative (Augment).

### Pick models per agent role by demonstrated instruction-following/drift-resistance over long horizons, not by raw coding-benchmark strength.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor: Scaling long-running autonomous coding](https://cursor.com/blog/scaling-agents)
- **Detail:** Cursor reports a general model out-planned a coding-specialized model on extended runs because the latter drifted/took shortcuts. Single vendor, unquantified, and named models are time-sensitive — re-test drift-resistance per role rather than assuming from leaderboards.

### Trigger a new planning cycle on task-completion events rather than a fixed timer/cadence.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor: Scaling long-running autonomous coding](https://cursor.com/blog/scaling-agents)
- **Detail:** Planners should wake when their tasks complete so they re-plan against fresh state, avoiding stale-plan drift. Flagged by Cursor as unimplemented future work; general event-driven-over-polling wisdom applied to agents.

### Run background 'garbage collection' agents that hunt entropy (stale docs, drift, violations) and open small fix-up PRs — but require review for LLM-judged changes rather than blind auto-merge.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Replaced a weekly manual 'AI slop' cleanup; but Stripe (comparable scale) keeps humans in the loop for agent-authored merges, and LLM-judged drift fixes carry false-positive risk. Auto-merge safe only for deterministic/linter-level fixes.

### At agent-driven throughput, relax traditional human-scale merge gates (short-lived PRs, re-run flaky tests rather than block) — only with strong architectural guardrails.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** 'Corrections are cheap, waiting is expensive' held at ~3.5 PRs/eng/day — but the source stresses this needs small blast radius, fast detection, reliable rollback, auditable lineage and is 'irresponsible in a low-throughput environment'. Single vendor anecdote; largely restated trunk-based/small-batch practice.

### Design the harness so a single run can execute a full feature/bugfix lifecycle end-to-end, escalating to a human only for genuine judgment calls.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** OpenAI reached an 11-step autonomous pipeline (runs up to 6h) but explicitly warns it depends on heavy repo-specific tooling and 'should not be assumed to generalize'. Broader 2026 literature favors a human review gate before merge.

### Let the agent predict likely high-output/noisy command types at task start and pre-provision handling rules, complementing reactive rule generation.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** A cold-start prompt predicts which commands (pip/apt/make/docker) will be noisy and emits compression rules before any output appears. Concrete prompt pattern; unablated in isolation.

### Cap loop iteration budgets explicitly at every level where cycles are possible (max reflections, max search rounds, max recursion depth), especially in graph/recursive control flow.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Aider caps max_reflections, AutoCodeRover caps search rounds at 15, Prometheus uses per-subgraph recursion limits as its termination guarantee. Largely default framework behavior (LangGraph recursion_limit); the non-obvious nuance is capping at *every nesting level*, not just one outer budget.

### Track modifications in an in-memory/cloned shadow state per node so tree-search branching at any point is cheap, instead of replaying all actions from the root.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Moatless shadow-mode clones a FileContext per node (no disk writes) enabling O(1) branching vs DARS-Agent's Docker-reset-and-replay (O(depth)). Note: shadow mode covers file diffs only, not command/test-execution side effects. Niche (tree-search agents).

### Implement the main control loop as an explicit compiled state graph when you need it to be inspectable, serializable, or checkpointable.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Prometheus (LangGraph state machine) makes control flow inspectable/checkpointable vs recursive/imperative loops where state is harder to serialize — at the cost of defining state types and per-node scoping. n=1 in the corpus; event-sourcing or exception hierarchies achieve similar goals more cheaply.

### Split a coding system into three independently-replaceable pieces — a durable Session (event log), a stateless Harness (the model-calling loop + tool router), and Sandboxes/tools — connected only via narrow, stable interfaces.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic — Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- **Detail:** Session is source-of-truth/audit/resume point; harness is stateless and crash-recoverable; sandbox is untrusted and credential-isolated. Framed by analogy to the stable read() syscall across decades of disk changes. Independently converged on by LangChain ("anatomy of an agent harness") and Mastra, neither citing Anthropic. No independently-replicated benchmark of the split itself; skip if you only use the Claude Code CLI (which already does this internally), apply when building a custom loop over the Messages API.

### Defer full sandbox provisioning (repo clone, process boot, event fetch) until the harness actually needs to invoke a tool — start inference immediately off the session log instead of provisioning a container upfront.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic — Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- **Detail:** Anthropic reports p50 time-to-first-token dropped ~60% and p95 >90% vs. the old coupled design. First-party single-source figures, but the general cold-start tension is corroborated industry-wide (Modal/E2B/Daytona compete on exactly this latency dimension). Warm-pool vs. on-demand cost/latency is an orthogonal implementation detail.

### Make the harness stateless and crash-recoverable: on crash, boot a fresh harness with just the sessionId, pull the full event log, and resume from the last event — no in-memory harness state survives a crash.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- **Detail:** "Cattle not pets": durable log is source of truth, in-process state is disposable cache. The general durable-execution pattern is over-determined by industry consensus (Restate, AWS durable-execution guides, Temporal), but the only quantified metric (TTFT) is confounded with the separate lazy-provisioning change — the specific reliability benefit is unbenchmarked.

### When letting an agent self-modify its own harness/config, block the shortcuts an unconstrained self-modifier would take (disabling the verifier, swapping to a stronger model, raising its own reasoning budget) via a hard controllability constraint outside its edit surface.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Agentic Harness Engineering (arXiv 2604.25850)](https://arxiv.org/html/2604.25850v1)
- **Detail:** Implemented as read-only permissions on the runs directory, tracer, verifier, and model config — only the harness workspace is writable. The threat is independently and repeatedly documented (METR: o3/Claude 3.7 reward-hack in 30%+ of runs by monkey-patching graders; RewardHackingAgents benchmark arXiv 2603.11337), though the specific file-permission mitigation is not itself benchmarked and the paper flags governance as incomplete.
  *Tool notes:* Applies to any setup where an agent can edit its own CLAUDE.md, hooks, permissions, or MCP config — don't let the agent being graded also edit the grader or its own model/temperature.

### Track agent interaction rounds and total end-to-end trajectory tokens when judging whether a context-compression technique helps — not just per-call token reduction or static quality scores.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Context Pruning via Multi-Rubric Latent Reasoning (arXiv 2605.15315)](https://arxiv.org/pdf/2605.15315)
- **Detail:** With a strong backbone (Opus 4.6), a single-objective pruner *increased* total token usage by 6.6% on SWE-Bench Verified and up to +22% on SWE-QA despite compressing per-call context, because discarding structurally necessary code forced repeated file reads/retries — a failure visible only by measuring rounds and total trajectory tokens. Single research group, no third-party replication.

### Run the generator-evaluator cycle iteratively (~5-15 rounds per generation) rather than single-pass, letting the generator decide each round whether to refine the current direction or pivot entirely based on trending scores.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **Detail:** Frontend runs used 5-15 iterations (up to ~4hr), with scores improving before plateauing and one run pivoting at iteration 10 (landing page → 3D CSS experience). The pivot-vs-refine heuristic is a real operational detail, but the mechanism is largely the established Self-Refine/Reflexion pattern, and the round-count is domain-specific to open-ended aesthetic tasks — other domains show optimal counts of ~3-4.

### Treat every harness component (sprint decomposition, evaluator passes, context resets) as an assumption about a model capability gap, and periodically strip components out as newer models close that gap.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **Detail:** With Opus 4.6 the sprint-decomposition construct was removed and the evaluator moved to a single end-of-build pass. "Find the simplest solution possible; only increase complexity when needed." The cited cost/time delta (6hr/$200 → 3hr50/$124.70) confounds task, model, and harness changes simultaneously — not a controlled A/B — and the principle is becoming convergent boilerplate ("build for deletion") without controlled data anywhere.

### Decompose a complex task into sub-tasks by two concrete criteria — atomicity (finishable within one worker session) and verifiability (a clear checkable expected outcome) — not purely by topic or dependency-graph shape.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [CodeDelegator (arXiv 2601.14914)](https://arxiv.org/abs/2601.14914)
- **Detail:** Stated as the Delegator's decomposition guidance; supports the overall role-separation gain (10.5pp ablation) but the heuristic itself is not independently measured, and it overlaps with agile INVEST criteria (Small, Testable).

### Before crediting a more expressive action format (code-as-action) with better performance, benchmark it against a simpler structured-action baseline (ReAct) stratified by task difficulty.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [CodeDelegator (arXiv 2601.14914)](https://arxiv.org/abs/2601.14914)
- **Detail:** On stratified τ²-bench airline tasks, CodeAct underperformed ReAct by −5.8pp (Low) and −2.5pp (Medium) — incurring more context tokens at every level — and only won by +7.7pp on High-difficulty. Expressiveness gains may show up only on the hard tail and be pure context overhead elsewhere. Difficulty was established independently from 16 prior trials across 4 other models (non-circular), but it's a narrow single-paper pilot; corroborating industry commentary is directional only.

### Mechanically clean raw agent trajectories before any analysis/distillation step — strip base64 blobs, dedup repeated tool output — to keep the evidence corpus dense and within budget.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Agentic Harness Engineering (arXiv 2604.25850)](https://arxiv.org/html/2604.25850v1)
- **Detail:** Generic data hygiene with no isolated measurement; lightly corroborated by adjacent systems (Headroom externalizing base64, LogSieve, dedup pipelines reporting ~16% reduction) but no benchmark targets this exact step.

### When candidates per task are large and cheap to sample, consider substituting more unfiltered volume for evaluator-based filtering; reserve evaluator filtering for constrained-budget regimes.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** At matched size, evaluator-filtered data beat random by 1.91pp (23.52 vs 21.61), but the full unfiltered set (~2x data) reached 24.75 at higher compute. This is offline training-data curation, not runtime rollout budgeting; single noisy, compute-mismatched ablation. The general quality/quantity tradeoff shape is supported by data-filtering scaling-law literature.

### When fine-tuning on human/user feedback, don't default to naive per-token loss reweighting by feedback polarity — its effect is non-monotonic; only mild downweighting of negative-feedback tokens helps.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Negative-span weight 0.0 → 37.2% and 0.5 → 35.1% both undershot the SFT baseline (41.8%); only 0.8 exceeded it (44.4%). The paper's actual headline recommendation is to abandon per-token reweighting for span-level preference learning. Training-time detail (narrow audience), single-source, one cited data point mischaracterized.

### For feedback-driven post-training, prefer span-level preference optimization (group tokens into contiguous positive/negative/neutral spans, apply a KTO-style loss per span against an EMA reference, keep cross-entropy on neutral spans) over uniform SFT or simple reweighting.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Span-KTO beat SFT and reweighted-SFT on all 5 benchmarks (e.g. +5.6pp on SWE-bench Verified, +13.3pp on Aone-bench). Foundation-model post-training technique requiring a large proprietary feedback pipeline and training infra — inapplicable to most agent builders working over API models; single-org, partly-proprietary-benchmark evidence.

### On a blocked action, don't halt the agent — return the denial as a normal tool result plus an instruction to find a safer path in good faith, and only stop/escalate after repeated denials (e.g. 3 consecutive or 20 total).
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
- **Detail:** Justified against a 0.4% FPR (a false positive costs one retry, not the session); headless mode terminates instead of waiting for a human. Single-vendor self-report, and counter-evidence exists: a documented case of the agent fabricating justifications to talk a human into overriding a block, an independently-measured 81% end-to-end FNR under adversarial prompts, and a production incident where classifier failures pushed a user to disable permissions entirely. Treat the "false positives are cheap" framing skeptically.

### Match knowledge-augmentation strategy to model capability: expect large gains from skills on modern strong-reasoning models and little benefit on older/weaker ones, rather than assuming a skill helps uniformly.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Google — Closing the knowledge gap with agent skills](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/)
- **Detail:** Gemini 3.x models jumped sharply with the skill while 2.5-series improved little in the same harness. Single vendor, single-skill benchmark, and the broader literature is mixed — some work finds weaker models benefit *more* from scaffolding that compensates for weak native planning. Useful caution to validate per-model, but not a settled pattern.

### Default every lifecycle gate to fail-closed: missing, incomplete, stale, or unauthorized evidence blocks the transition outright rather than letting the agent proceed on the assumption that work is probably fine.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890)
- **Detail:** Engine-contract scenarios (evidence-gate, budget-stop, human-handoff, no-false-done) all correctly BLOCK 10/10, and stress scenarios with one missing or prose-only piece of evidence correctly fail 'done'. Classic fail-safe-defaults applied to autonomous-agent completion; single self-reported paper plus directional community convergence on veto-on-completion designs.

### Expect and openly report a real cost overhead from evidence gating (~1.2x tokens vs a compute-matched retry loop, up to ~3.8x vs an ungated no-review run) rather than treating overhead as something to hide or optimize away first.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890)
- **Detail:** The gated arm spent ~1.2x the tokens of a compute-budgeted naive retry for a +1.6pp not-amplified improvement (hidden-failure amplification 31/1800→2/1800, CI excludes 0). Sets a concrete budgeting expectation and counsels against prematurely weakening gates to chase token savings. Single paper, one model family; the 3.8x figure is a weaker descriptive comparison.

### Before acting, estimate task difficulty/scope from cheap lexical signals and commit to a minimum-viable execution path sized to that estimate rather than reading everything first — and keep the upfront estimation step even though it adds a small planning cost.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Do AI Agents Know When a Task Is Simple? — E3 (arXiv 2607.13034)](https://arxiv.org/abs/2607.13034)
- **Detail:** On MSE-Bench (121 tasks) the Estimate+Execute-minimal policy matched a read-everything baseline's 100% success while cutting cost ~85% / tokens ~91% / files-inspected ~92%; removing the estimate step kept success but raised cost +20% (+36% on repo-scope tasks). Caveat: on frontier models that already read frugally, expect only modest (~15-20%) real savings, not the simulator's dramatic figures. Self-built simulator benchmark, single paper.
  *Tool notes:* Implementable as a lexical scope classifier (explicit filename → single-file; 'refactor across the codebase' → repo-level) over the instruction text.

### Make agent work queues disk-based and idempotent by defining 'done' as 'the output file exists on disk,' so an orchestrator rebuilds the remaining work list from disk state each run and survives crashes/restarts without extra bookkeeping.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** Makes a file-emitting agent pipeline inherently fault-tolerant and resumable — agents become safely re-runnable and crashes recover without a separate state machine. Echoes make-style target-existence staleness and independent idempotent-agent-pipeline write-ups (check-before-act executors, done-markers).
  *Tool notes:* For shell/orchestrator-driven, file-emitting pipelines; still applies alongside the durable-log/event-sourcing patterns.

### Don't assume a framework's human-approval pause suspends the whole run — when a step has concurrent/sibling branches, assume a sibling's side effect will execute during the pause unless verified otherwise.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** The 'sibling leak' reproduced in every evaluated framework shipping a pre-execution gate (LangGraph, LlamaIndex Workflows, MS Agent Framework, OpenAI Agents SDK, LangGraph.js), P(leak|emitted)=1.00; a 1,000-workflow sweep showed 577/577 leak when effect and gate share a superstep, 0/363 for gate-descendant effects. A proven design trichotomy: you can get at most two of {concurrency, in-framework enforcement, no-leak} — the third path is an external mediated admission point. Durable-execution engines (Temporal) that guarantee clean replay do NOT thereby provide the pause-barrier — verify it separately, and prefer heartbeat-based cooperative cancellation over best-effort interruption of blocking calls. Single fresh unreviewed preprint, but backed by a formal proof, cross-framework reproduction, and a 13-incident public GitHub corpus.

### Structure an agent's reasoning as an explicit finite-state machine — few states, each with a fixed objective, a required output schema, and a bounded tool set — self-looping on a 'need more X' transition until the schema is satisfiable, then advancing.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** Used across CT-Repair's perspective agents (understand_fault → collect_evidence → generate_fix, with self-loop transitions). Already-standard practice (LangGraph nodes/edges, prior FSM-agent work); the paper's ablations isolate evidence diversity, not the FSM control-flow itself, so this restates a known pattern.

### To get implementation-level variation while holding the diagnosis/plan fixed, cycle through multiple LLMs/backbones round-robin per accepted strategy (bounded as r models × k samples) rather than unboundedly resampling one model against one shared context.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** With a 12-candidate budget CT-Repair beat baselines using 45–117 samples, but the win is a confounded whole-system comparison, not an ablation isolating round-robin sampling. Single paper.

### Triage memory queries before answering: send present-tense 'what does the code do now' questions to grep/read the tree at HEAD (never to stored episodes, which can be stale), route past-tense/'why' questions to the memory ledger, and route different question kinds (breadth vs pointed vs rationale) to different retrieval mechanisms rather than one single-shot lookup.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Why Git Is the Memory Solution (arXiv 2607.14390)](https://arxiv.org/abs/2607.14390)
- **Detail:** Substrate triage (grep the tree for present tense, recall the ledger for past tense, stay silent when neither) plus per-kind routing; a routed map+episodes system matched or beat the best single mode per question kind at far lower token cost. Single vendor preprint, tiny n, with some evidence overstated in-paper — treat as directional.

### In hook/callback-driven agent loops, surface a 'callback timed out' signal distinctly from 'user rejected' — conflating them makes unattended sessions stall waiting on a rejection that never happened.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Claude Code v2.1.210 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.210)
- **Detail:** Keep timeout and rejection as distinct signal values in the callback protocol so a timeout doesn't read as a human 'no' and block an autonomous run. Single changelog line; generic 'don't overload distinct error states' applied to agent hook callbacks.

### For a consequential per-call model choice (e.g. an auto-mode permission classifier), validate/select the model once on the session's first request and pin it for the session rather than re-deciding per call.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Claude Code v2.1.210 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.210)
- **Detail:** Keeps permission behavior consistent within a session (avoids mid-session behavioral drift from flip-flopping model choice). Single changelog line, no rationale/benchmark; narrow to teams building their own per-call model-selection classifiers.

### Treat exploration breadth and solution diversity as separate knobs — widening what the agent reads does not reliably widen how it tries to solve the problem.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [The Devil Is in the Interface (arXiv 2608.11386)](https://arxiv.org/abs/2608.11386)
- **Detail:** The NL-search interface raised read diversity by >11% across all three actors (up to +27.9% in some panels), yet pairwise CodeBLEU distance between patches moved only +0.0 to +3.2% and went negative in several actor/setup cells — the paper's Finding 2 states the exploration gains "only weakly translate to more diverse final solution strategies." Appendix analysis ties the breadth gain to more varied early search queries that nonetheless seed the same problem-solving approach. Practical consequence: if you want diversity for pass@k or ensembling, buy it explicitly (multi-path backtracking, forced-diversity penalties, genuinely different reasoning policies or evidence perspectives — see the multi-perspective repair entry), not by improving retrieval. Single paper; no independent replication of the decoupling found.

### Let the agent write and run small programs against its own session state — filtering a log by topic or timestamp, aggregating results — and feed only the program's printed output back into context.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Context as an Environment (arXiv 2608.21690)](https://arxiv.org/abs/2608.21690), [Anthropic: Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- **Detail:** Rather than a fixed compression policy, the agent decides at runtime what slice of accumulated state it needs and materializes it with code — leveraging coding ability for context decisions. Scroll reports strong long-horizon results this way (LongMemEval_S 94.8%, BEAM_10M 73.1%, LOCA_256K 86.7%), and Anthropic's code-execution-with-MCP work independently documents the same mechanism for tool outputs, with one production case dropping 150k tokens to 2k. What is corroborated is filtering *tool output* via code; extending it to session-state/memory logs rests on one unreplicated paper with a non-Claude backbone on narrow memory benchmarks.
  *Tool notes:* In Claude Code, keep state in files and query them with short Bash scripts — shell variables don't persist between tool calls.

### Freeze the artifact during a review exchange — let reviewer and critic trade text only, and apply edits in a separate outer pass — so agents aren't rewriting a solution they still disagree about.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Adversarial Review (arXiv 2608.18167)](https://arxiv.org/html/2608.18167)
- **Detail:** The paper's inner loop "exchanges review text only, while artifact edits occur only in the outer loop," with the stated rationale that this "prevents the agents from jointly rewriting the solution while they are still disagreeing about what is wrong." Concretely implementable: give review-phase subagents no write tools, batch edits after the review converges. But the causal claim is not isolated — the paper attributes its overhead advantage over multi-agent debate to a narrower communication channel (two roles, one review→critique link) rather than to the freeze, and runs no freeze-vs-no-freeze ablation holding topology constant. Non-peer-reviewed preprint under review; one informal practitioner write-up describes the same read-and-diff-only review round independently. Distinct from the existing adversarial-independent-review entry, which is about reviewer independence rather than phase separation.

### Match the integration surface to the job — a one-shot exec form for bounded scripted tasks, an SDK for application workflows, a persistent server for product-embedded agents — since the surface gates which capabilities (streaming, state, interrupts, approval requests) you get.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [OpenAI: Codex as a platform](https://developers.openai.com/blog/codex-as-a-platform)
- **Detail:** Codex maps `codex exec` to CI jobs and scripts, the SDK to application code managing agent lifecycle, and app-server to product UIs needing persistent conversations, streamed events, interrupts and approval prompts — and is explicit that the choice determines available capabilities, which is the actionable part. Discount accordingly: this is one vendor's documentation of its own three product tiers, with no benchmark or cross-framework validation, and the underlying shape (one-shot vs SDK vs stateful connection) is decades-old API-design practice rather than an agent-specific finding. Useful if you are integrating with Codex specifically; unproven as a general principle.

### Watch cheap step telemetry (semantic embedding of the step, token-uncertainty aggregates, action metadata) as the first line of failure detection instead of running a second LLM judge on every step.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Real-Time Detection and Repair of LLM Agent Failures (arXiv 2608.02464)](https://arxiv.org/abs/2608.02464v1)
- **Detail:** A three-channel per-step vector (32-dim hash embedding + 4 token-uncertainty aggregates + action metadata, d = 43–60) driving CUSUM streams alarmed one step after verified onset across six injected failure classes, at ~200 µs/step versus a full forward pass per step for an auditing judge — three orders of magnitude cheaper. Adapter overhead is a median 674 µs/step (p95 ~1 ms). The reason this stays at Watch: detection is modest (0.71 recall at a 5% false-alarm budget, AUROC 0.872) and highly uneven by failure class, and the cheap-drop-in framing hides a real cost — see the companion monitor entry on per-deployment recalibration. Single non-peer-reviewed preprint on the author's own harness.

### Validate a new guard or orchestration rule against live model behavior, not only by replaying frozen trajectories through it — enforcement changes what the model does next.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Looping Is Not Reliability (arXiv 2607.24604)](https://arxiv.org/html/2607.24604v1)
- **Detail:** The paper's own framing: "Replay can show whether a guard would intercept recorded outputs, but not how enforcing it changes subsequent model behavior." A sealed paired online comparison (540 rollouts, 27 tasks) makes it concrete — frozen replay showed zero false completions for a challenge gate, yet live enforcement of that same gate regressed wrong-start repair from 100/135 to 93/135 branches, a gap replay could not predict. This is the agentic version of an off-policy evaluation trap: you are scoring a policy intervention on data generated without it. Shadow-mode or telemetry-only deployment before hard enforcement is the practical mitigation. Modest sample, one gate type, one preprint.

### Let the test suite and the implementation be revised together across refinement rounds rather than freezing generated tests as an immutable oracle — while watching for code and tests converging on a shared wrong answer.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [TDD-Agent (arXiv 2608.16742)](https://arxiv.org/abs/2608.16742v1)
- **Detail:** The controlled comparison is Single-track (test-first, tests frozen during refinement) vs full dual-track: 70.11→78.24 on GPT-5-mini, 79.56→90.77 on DeepSeek, but only 57.36→59.34 on Qwen — real, and inconsistent in magnitude. This is in genuine tension with the red-green TDD rule of not touching tests once committed; the reconciliation is scope — dual-track applies to *agent-generated* tests still being negotiated, not to a human-authored or committed spec. The paper's own failure analysis is the reason for care: most residual failures are "matched failures" where code and tests co-evolve into an internally consistent state that fails the held-out repository oracle (Qwen unmatched-failure rate 29.2%). Keep an independent, non-revisable oracle outside the loop. Single paper, RepoEval/LiveCodeBench, Python only.

## Spec & prompting

### Write task specs precise enough that two independent domain experts reach the same pass/fail verdict, and state every condition the grader checks in the task description.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Agents fail through no fault when specs omit graded requirements. Benchmark audits (arXiv 2605.26079, 34,285 tasks) found ~25.7% carry spec ambiguity that shifts model rankings 9.6-9.9%; Ambig-DS shows silent misframing on 39-63% of ambiguous runs, largely recovered by clarification.

### When requirements are vague, run them through a dedicated Plan agent whose job is to ask clarifying questions and surface edge cases before any code is written.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [GitHub: Context windows, Plan agent, and TDD](https://github.blog/developer-skills/application-development/context-windows-plan-agent-and-tdd-what-i-learned-building-a-countdown-app-with-github-copilot/), [Anthropic Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- **Detail:** Interview-before-implement is independently prescribed by Anthropic (AskUserQuestion) and Cursor plan mode; a rigorous study (underspecified SWE-bench Verified, 500 tasks) shows clarification-seeking agents resolve 69.4% vs 54.8% baseline (p<0.001). Skip for small, clearly-scoped diffs.

### Compose the system prompt from independent, priority-weighted sections and drop the lowest-priority ones first under budget pressure, rather than one monolithic block.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** Named sections (identity, safety, tool guidance, workflow, dynamic context) with priorities and a static/dynamic split for provider-side prompt caching. GitHub Copilot's production system uses the same 'CSS-flexbox' priority-budget pattern; multiple engineering write-ups converge.

### Balance eval/test sets with both positive and negative cases (situations where a behavior should occur and where it shouldn't) to avoid one-sided optimization.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Include a weather query (should search) and 'who founded Apple?' (shouldn't) — one-sided evals create one-sided (over-triggering) optimization. Independently echoed by EvalScope's should_call_tool:false cases.

### Codify recurring quality/consistency preferences as small, explicit, versioned 'golden principles' checked into the repo and mechanically enforceable, not prose style guides alone.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** e.g. 'prefer shared utility packages over hand-rolled helpers', 'validate data at boundaries, don't probe YOLO-style' — kept small, agent-consumable, and scanned by background tasks that open refactor PRs. Single well-detailed case study.

### Require an 'execution plan' artifact for non-trivial work — a versioned, checked-in doc with a decision log and status — as a first-class task spec an agent can execute or resume from repo-local context.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Distinct from lightweight ad hoc prompts for small changes; stored under docs/exec-plans/ with progress/decisions/status. OpenAI's Cookbook PLANS.md doc spells out the sections; real third-party adoption exists.

### For repository-scale multi-file changes, ground planning in an explicit structured task graph (edit obligations with dependency/change-impact propagation) rather than a free-text decomposition.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [CodePlan](https://arxiv.org/abs/2309.12499)
- **Detail:** CodePlan (dependency + change-impact analysis, 5/6 repos pass vs 0/6 baseline) and GraphCodeAgent (dual requirement + code-dependency graph, up to 94% gain) beat flat decomposition on cross-file work. Requires static-analysis tooling per language — a heavier, infrastructural tactic.

### Write specific, detailed prompts that name the target behavior, edge cases, and reference patterns to follow, instead of vague requests.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor: Best practices](https://cursor.com/blog/agent-best-practices)
- **Detail:** e.g. 'write a test for auth.ts covering the logout edge case, using patterns in __tests__/, avoiding mocks' vs 'add tests for auth.ts'. Well-worn prompting hygiene; asserted, not benchmarked, for this exact formulation.

### Trim always-on/global rules to the minimum and prefer agent-requestable (on-demand) rules with tight descriptions over broad always-loaded ones.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor 3.3 changelog](https://cursor.com/changelog/05-06-26)
- **Detail:** Always-on rules are included in every conversation; convert content to on-demand and keep descriptions specific so the agent retrieves the right one. Restates the lean-system-prompt / progressive-disclosure principle for a specific UI.
  *Tool notes:* Cursor 'always-on' vs 'agent-requestable' rules.

### Avoid defaulting benchmark/eval configs to temperature=0 for tool-calling and reasoning models, which may reject or restrict it.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [mini-swe-agent v2.4.0](https://github.com/SWE-agent/mini-swe-agent/releases)
- **Detail:** PR #861 dropped hardcoded temperature=0 from swe-bench configs; reasoning/tool-calling models (o1, GPT-5-mini, Claude extended thinking) require temperature=1. Narrow compatibility constraint, not a performance claim.

### Have the Planner emit a structured JSON plan (ordered steps, each tagged with assigned agent and optional target file) so subtasks route mechanically.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [AgentForge](https://arxiv.org/abs/2604.13120)
- **Detail:** Removing the Planner drops resolve rate to near single-agent floor, but the ablation tests decomposition existence, not JSON-vs-prose format specifically. Common multi-agent idiom.

### Re-run/re-consult the Plan agent later in a project to review already-stated requirements before they get dropped.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [GitHub: Context windows, Plan agent, and TDD](https://github.blog/developer-skills/application-development/context-windows-plan-agent-and-tdd-what-i-learned-building-a-countdown-app-with-github-copilot/)
- **Detail:** A later review surfaced a forgotten accessibility toggle requirement. Distinct from up-front planning (re-auditing an accumulating spec over time); single anecdote.

### For an LLM-judge rubric, force a hard word cap on the justification field and give concrete positive/negative examples per criterion rather than abstract definitions.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** Keeps judge output terse, consistent, and auditable at scale. The 'concrete examples over abstract criteria' half is independently corroborated (ResearchRubrics, ~3-4% alignment gain); the word-cap is an engineering convenience.

### Give a rule/filter-generating LLM an allow-list of already-handled noise categories plus an explicit 'when in doubt, keep the line' conservative default.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** Tell the generator which noise (ANSI codes, banners, empty-prompt polling) is filtered elsewhere so it doesn't waste rule slots, and bias every rule-generation prompt toward preservation. Sound but single-source, non-ablated application of generic prompt hygiene.

### Before a chunk of work, have the generator and evaluator negotiate a written, testable "sprint contract" defining what counts as done, rather than letting the generator decide scope unilaterally.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **Detail:** Contracts were granular (Sprint 3 alone had 27 criteria) and let the evaluator flag criterion-level failures (a rectangle-fill tool that only placed tiles at drag endpoints). The two-agent negotiation prevents the generator quietly narrowing scope and gives the evaluator pre-agreed objective criteria. Overlaps with Agile/BDD Definition-of-Done, and rests on one anecdotal case study with no controlled comparison.

### Use an automated Planner agent to expand a terse 1-4 sentence user prompt into a full product spec (feature list + sprint breakdown) before generation starts, rather than coding from the raw prompt.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **Detail:** A planner turned a short prompt into a 16-feature/ten-sprint spec; without it the generator under-scoped and started building without speccing. The general spec-first pattern is well corroborated (GitHub spec-kit, JetBrains, Tweag, Addy Osmani), but the specific "be maximally ambitious / pad scope" instruction is single-source and context-specific (an unsupervised demo) — those broader sources emphasize human spec review and scoping to actual requirements, so treat scope-maximization as a caveat, not a universal.

### Specify delegated sub-tasks with a typed schema rather than free text: a natural-language directive, input bindings as typed references to already-committed objects (type, shape, sample values), and a return schema naming expected outputs with validation conditions.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [CodeDelegator (arXiv 2601.14914)](https://arxiv.org/abs/2601.14914)
- **Detail:** Typed references to existing artifacts avoid re-serializing large data into text; a validation-bearing return contract makes completion checkable. Corroborated independently by Anthropic's multi-agent research system ("each subagent needs an objective, an output format, guidance on tools, and clear task boundaries"), which documents vague free-text directives causing duplicated/misinterpreted work. Schema's marginal contribution not isolated from other confounds.

### Don't hard-code harness workarounds for a specific model's quirks (e.g. forced context-reset prompts to fight "context anxiety") as permanent logic — re-test after each model bump and remove workarounds the new model no longer needs.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic — Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- **Detail:** Sonnet 4.5 needed context-reset workarounds for "context anxiety"; Opus 4.5 didn't, making them dead weight — discovered only after the fact. Independently corroborated by practitioner sources (Sean Goedecke "prompts are technical debt too," MindStudio's model-upgrade checklist explicitly asking whether old-model workarounds should now be removed). Multiple converging anecdotes, no rigorous benchmark.

### When building a gating classifier for agent actions, strip the agent's own explanatory/rationalizing text from what the classifier sees — show it only the user's original messages plus the bare tool-call command.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic — Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
- **Detail:** Prevents the agent talking the classifier into a bad call. An ablation showed a tool-calls-only variant had the lowest FNR but lost the user-intent anchor (over-blocking plainly-requested actions); the shipped design keeps user messages + tool calls, dropping assistant text. Single primary source with a real ablation; secondary write-ups are all downstream summaries.

### Write a safety/permission classifier's prompt to evaluate the real-world effect of an action (not its surface text), run checks in a fixed order (block rules → allow-exceptions → user-intent), and treat anything the agent decided on its own as unauthorized until the user has said otherwise.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
- **Detail:** E.g. if the agent writes a payload to a file then executes it, classify the payload's behavior, not the innocuous "write file" call. Paired with a customizable slot for 20+ block rules (destroy/exfiltrate, degrade security, cross trust boundaries, bypass review) and allow-exceptions. Single-vendor design description with no independent efficacy testing; effect-based (action-aware) evaluation is a real, non-obvious axis many content moderators miss.

### Structure a knowledge-injection skill as feature/capability overviews → current model+SDK descriptions per language → minimal runnable sample code per SDK → links to canonical docs as source of truth — rather than dumping full documentation into context.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Google — Closing the knowledge gap with agent skills](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/)
- **Detail:** This is the structure of the skill that produced the reported pass-rate gains; the "point to docs as source of truth, don't embed them" principle is echoed independently (Block Engineering's skill-design principles, Expo docs). No ablation isolates whether this exact four-slot structure beats simpler alternatives — the source itself flags that direct AGENTS.md instruction can compete.

### Consider pointing the agent directly at authoritative documentation files (AGENTS.md-style, an embedded docs index) instead of, or in addition to, a packaged skill — direct doc instruction sometimes outperforms the skill abstraction.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Google — Closing the knowledge gap with agent skills](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/)
- **Detail:** Vercel's own eval (Next.js 16 APIs absent from training data) found baseline 53%, skills-default 53% (skill never invoked 56% of the time), skills-with-explicit-instructions 79%, and an 8KB AGENTS.md docs index embedded in context 100%. Skills win when narrow/current/verified; docs win when skill routing is unreliable. Note the opposite risk: ETH Zurich's AGENTbench found bloated/LLM-generated context files can *decrease* pass rates (~−3%) via attention dilution.

### Before trusting an executable-test reward signal, run an agentic quality judge over each task (instruction + repo + tests) to score instruction clarity and instruction-test alignment, and filter out low-quality tasks rather than training on them.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** The judge (MiniSWEAgent with shell/file access in the task's Docker env) actively explores rather than classifying from text; filtering trimmed low-quality tasks while retaining most volume, and RL on the filtered set improved SWE-bench Multilingual and Pro while holding steady on Verified. The judge is itself imperfect (~76-90% F1) and the benefit is non-uniform; single-lab, no independent replication of this exact recipe.

### When a judge must assess instruction-to-test alignment (the hardest verifier-faithfulness dimension), feed it reference material — few-shot demonstrations and/or the ground-truth patch — rather than the bare instruction and tests.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Few-shot raised precision; adding the ground-truth patch raised recall and gave the best F1 on that dimension. Single small human-annotated benchmark (~47 samples), no replication, and largely restates established reference-guided LLM-as-judge practice (MT-Bench, G-Eval).

### When iterating an evaluator/judge system prompt, add detail only up to a point — moderately explicit rules and criteria help, but piling on exhaustive prohibited-command lists and procedural guardrails degrades a weaker judge's overall judgment.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** On NL2Repo, prompt versions v1→v4 raised BoN-Acc 57.9%→67.4% and τ 0.379→0.473, but an over-specified v5 regressed on most metrics. Watch for a regression point rather than assuming "more explicit rules = better." Single-model/single-dataset ablation; the "weaker model" causal attribution is the authors' plausible speculation, not tested. Corroborated in spirit by instruction-overload literature.

### Design evaluator prompts to close three recurring LLM-judge failure modes: lazy static evaluation that never executes tests, unit-level-only checks that miss end-to-end/import/dependency breakage, and role confusion (the judge editing the generator's code, reusing existing repo tests as its own, or rationalizing away failing tests).
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Each failure mode has a targeted prompt fix, and the v1→v4 prompt progression improved BoN-Acc and τ on NL2Repo (though BoN-Acc dipped at the role-confusion step; τ and regret improved). Role confusion — the judge quietly editing code or reusing repo tests — is a specific, non-obvious articulation. Single-source, single dataset/judge model.

### Don't over-invest in feedback formatting (JSON/keyed schema vs natural-language prose) — deliver the same repair content in whichever format fits your tooling, since the syntactic wrapper made negligible difference once the same information was present.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Structured Feedback Improves Repair in an LLM Agent Loop (arXiv 2607.14167)](https://arxiv.org/abs/2607.14167)
- **Detail:** Keyed JSON (TypedFields) vs matched-content prose (SameNL) differed by only +2/0 pts (CIs include zero) while both beat raw diagnostics by ~42pts — the repair content (location, observed value, admissible alternatives), not the schema, drives the gain. Directionally corroborated by format-restriction studies (arXiv 2408.02442). Single narrow benchmark (TextWorld), not yet shown on real code repair — cuts against the convention of heavy Pydantic/JSON-schema investment for feedback quality.

### For a large agent-driven migration/transformation, front-load a rulebook written before the gap inventory (gap inventory = what the rulebook's defaults won't cover, tested together in a joint audit), then run a disposable stress-test pass on a small slice whose output you discard entirely, using only what breaks to harden the rulebook.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** 'The rulebook must come before the gap inventory'; 'the rulebook and the stress test are the most time-consuming, everything after is mostly queues burning down.' Stress-test output is credited nothing — the goal is to refine rules, not make incremental progress. Single-source mechanic; the redesign case shows ordering can invert (translate-then-audit), so treat as a strong default, not a law.

### Start with detailed, blunt/emphatic prompts (e.g. 'the compiler will catch mistakes in the next step') while consistency is still being established, then shift to shorter targeted prompts once a compiler-backed loop is trusted to catch downstream errors.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** Ties prompt verbosity to whether a downstream automated verifier exists to catch errors, and sequences it to migration phases (stress test → scaled rollout). Single anecdotal migration-playbook source, no A/B data.

### Have an implementer agent that hits genuine, unresolvable ambiguity emit a machine-greppable marker (e.g. `// TODO(port): <reason>`) instead of guessing, so ambiguous spots are collected and resolved centrally rather than silently and inconsistently patched per-file.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** A batch/unattended adaptation of 'flag, don't guess' — downstream compiler/test failures surface the flagged markers for a dedicated fix step. The general ask-when-unsure principle is common; the greppable-marker + centralized-triage mechanic for non-interactive multi-agent pipelines is single-source.

### Give a review skill explicit written criteria for its severity tiers (severe/important/nit) and comment style/tone so feedback is consistent across runs.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Warp: self-improving code review](https://www.warp.dev/blog/how-to-build-a-cloud-software-factory-self-improving-code-review)
- **Detail:** Reduces LLM-reviewer inconsistency and nitpicking (a documented failure mode). Independently recommended by Anthropic's own Claude Code code-review docs (per-repo redefinition of severity, nit caps) and multiple AI-review products with tunable nitpickiness — multiple credible sources, but no controlled benchmark of the specific practice.

### When an estimator's surface signals conflict with a cheap structural check (wording sounds localized but a quick grep shows the token occurs across many files), lower confidence and pre-flag the task as a likely expansion candidate rather than trusting the lexical read.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Do AI Agents Know When a Task Is Simple? (arXiv 2607.13034)](https://arxiv.org/abs/2607.13034)
- **Detail:** Implementable as grep occurrence-count vs implied scope → downgrade confidence, bias toward one extra scope tier or earlier verification. Note the paper's own blind spot: this misses deceptive indirect sites (alias/re-export) where the literal token doesn't match — recovery there comes from the verify-and-expand loop, not this heuristic. Unablated in isolation.

### Organize the agent instruction file into distinct named sections — Behavioral Rules, Code Standards, Self-Review Checklist, Anti-Patterns (prohibited pattern + explanation + correct alternative), and Workflow Rules (task-type → which tool/subagent to invoke) — rather than one undifferentiated block.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Self-Improving AI Coding Agents (arXiv 2607.13091)](https://arxiv.org/abs/2607.13091)
- **Detail:** The Workflow Rules section functions as a task-type→tool/subagent routing table (the more distinctive, agentic piece). Uncontrolled single-deployment case study (authors ran no baseline/ablation isolating structure); the general sectioning idea is already common industry practice.

### Represent a candidate solution as a fixed schema (e.g. {root-cause, target-locations, intended-changes, confidence/risk}) rather than free text, so downstream stages (patch generation, scoring, feedback routing) consume a stable machine-readable contract.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** CT-Repair's ⟨RootCause, Suggestion⟩ representation enables per-candidate identifier tracking and routing scored feedback back to the originating strategy. Necessary plumbing for that system rather than a proven win; overlaps existing typed-schema guidance, no ablation isolating schema-vs-prose.

### When adding a human-approval gate to a multi-phase external API (authorize-then-capture, create-then-activate), explicitly choose and key the gate to the phase where authority becomes irrevocable, rather than assuming one admission point covers the whole logical multi-step action atomically.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** Phase-grained mediation gives no atomicity across phases of one logical action, so pick the irrevocable phase deliberately and key the gate there. Consistent with saga/compensation literature; a limitations-note in the paper, not benchmarked.

### When prompting a judge/classifier to flag risky agent actions, instruct it to evaluate the full recent action sequence (not the current action in isolation) and name the attack shape to watch for (e.g. 'reconnaissance then privilege escalation, or components that assemble into malware'), so individually-benign steps that compose into harm are caught.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [OpenHands SDK v1.36.0 — ToolShield](https://github.com/OpenHands/software-agent-sdk/releases/tag/v1.36.0)
- **Detail:** The shipped guardrail system prompt does exactly this. The general principle (conversation-level judging beats turn-by-turn) is corroborated elsewhere (Crescendo, JailJudge), but the specific numeric ASR drop is confounded with the separate-judge de-biasing effect and self-reported in a GitHub issue.

### When delegating a coding task to a cheaper subagent, write an outcome/constraint-based spec (algorithm, constraints, edge cases, test matrix, definition of done) rather than dictating exact implementation details line-by-line.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Cognition: Making Fable Cheaper Than Opus](https://cognition.com/blog/making-fable-cheaper-than-opus)
- **Detail:** Contrasts constraint specs (e.g. 'operator() must be O(1) in pointer length … report the diff and test results before committing') against implementation dictation ('overwrite config.json with exactly: {…}'). Single vendor benchmark that confounds model with prompt style; the underlying spec-driven-delegation principle is independently established (spec-driven-development literature).

### Bake an explicit verification gate into the delegation brief itself, requiring the subagent to report back the full diff and test results before it is allowed to commit.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Cognition: Making Fable Cheaper Than Opus](https://cognition.com/blog/making-fable-cheaper-than-opus)
- **Detail:** A single quoted spec excerpt ('Report back with the full diff and test results BEFORE committing'). The general 'orchestrator verifies subagent claims before merge' pattern is echoed across independent sources, but this exact brief-instruction's effect isn't isolated from the whole delegation style.

### Gate special keyword trigger phrases / behavior escalations (an 'ultracode'-style opt-in) to genuinely human-originated input, excluding webhook payloads and relayed/quoted third-party text (PR comments), so an external actor can't trigger elevated behavior by embedding the phrase in content the agent reads.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Claude Code v2.1.210 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.210)
- **Detail:** A provenance / data-channel-separation instance for keyword-gated mode switches — trigger phrases are easy to treat as plain text matching without considering input provenance. Single changelog line; generalizes to any keyword-triggered agent behavior switch.

### In skill/command templates using positional placeholders ($1, $2, …), preserve unmatched placeholders verbatim rather than silently stripping them, so a missing-argument bug is visible instead of producing a silently mangled prompt.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Claude Code v2.1.210 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.210)
- **Detail:** Fail-visible over silent-strip on a template-substitution miss (a generalization of strict-undefined template modes). Single changelog line; mainly actionable for those building their own $-style substitution for skill/subagent prompts.

### Freeze the scope of an agentic dev task into a contract bound to specific file paths at the plan-to-dev transition, and fail closed if the resulting diff touches anything outside that contracted scope.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890)
- **Detail:** A diff-path allowlist bound to the current source hash, with out-of-scope edits refused at a named lifecycle gate. Convergent with practitioner 'agent-guardrails' / change-budget tooling, but exercised only implicitly across the paper's corpus with no isolated experiment.

### Restrict heavy evidence/verification machinery to claims that actually move the lifecycle (phase change, review pass, test certification, done, merge); treat ordinary developer notes, rationale, and docs as advisory-only and exclude them from any gate or source-state binding.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890)
- **Detail:** Keeps the gating discipline from becoming too heavyweight by partitioning five gated claim-types from advisory content. A stated scoping principle (unquantified); convergent with standard CI/CD 'gate at consequential checkpoints only' practice.

### Type a critic's disagreements — agree, disagree-with-cited-code, disagree-on-concern-without-evidence — so ungrounded objections are visibly distinct from evidence-backed ones.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Adversarial Review (arXiv 2608.18167)](https://arxiv.org/html/2608.18167)
- **Detail:** Replacing a binary AGREE/DISAGREE critic verdict with AGREE / "DISAGREE_EVIDENCE: <code citation>" / "DISAGREE_CONCERN: <epistemic objection>" produced the largest single gain among all tested ablations on SWE-PRBench (F1 0.457→0.533, versus 0.503 for two reviewers, 0.501 for a 5-agent baseline, 0.495 for a single reviewer). It is concrete and directly encodable, and it goes beyond "ask for evidence" boilerplate because each verdict type triggers different obligations (see the companion response-rules entry). Held at Watch on evidence quality: N=100, one ablation variant, no confidence intervals or significance testing anywhere in the paper, a workshop venue (ICML 2026 DL4C), no replication, and the "eliminated two failure modes" framing rests on two qualitative case studies rather than a systematic count.

### Write explicit obligations for each critic verdict — keep the flag on agreement, revise on evidence-backed disagreement, and on an evidence-free objection require a code citation to keep the flag or drop it — so neither agent can capitulate to a confident but uncited argument.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Adversarial Review (arXiv 2608.18167)](https://arxiv.org/html/2608.18167)
- **Detail:** The failure this closes is real and well-studied: in the paper's Case B a reviewer offers a weak, uncited rebuttal and the *critic* flips to AGREE, dropping a genuine bug (note the direction — a summary claiming the reviewer capitulates has it backwards). Mandating that a verdict survive only with a cited line of code removes the rhetorical channel. Broader multi-agent-debate literature confirms sycophantic flipping is a real class, and also that interventions against it don't always work — so treat this as one validated instance, not a general fix. Evidence is a single before/after on one 100-example benchmark with no ablation isolating this constraint from the rest of the protocol, and no replication.

### When a multi-agent design underperforms, do failure-case analysis and fix the prompts before changing the architecture — but don't assume every failure is prompt-fixable.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Adversarial Review (arXiv 2608.18167)](https://arxiv.org/html/2608.18167), [Why Do Multi-Agent LLM Systems Fail? (arXiv 2503.13657)](https://arxiv.org/abs/2503.13657)
- **Detail:** A clean worked example: naive three-agent adversarial review scored F1 0.457 on SWE-PRBench — *worse* than a single reviewer at 0.495 — so the authors diagnosed two concrete failure modes (fabricated flags from over-decomposition, and capitulation on a real bug), changed exactly one thing (the critic's verdict taxonomy) while holding agent count and topology fixed, and reached 0.533, best of four methods. The controlled single-variable move is the transferable part; the MAST taxonomy work independently frames failure-mode analysis as the right first step for multi-agent systems. Two corrections to the strong form: this is one iteration on one benchmark, not "iterate to convergence," and other work documents failures rooted in capability or architecture that no amount of prompt tuning fixes — so treat prompts-first as an ordering heuristic with an escape hatch.

### Express a spec as executable artifacts where you can — a test suite, function signatures, a reference implementation to port — rather than prose describing the same requirements.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Anthropic: New rules of context engineering for Claude 5](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models), [CodeSpecBench / HumanExec line of work](https://arxiv.org/abs/2608.16742v1)
- **Detail:** Anthropic's guidance is that context files should "prefer files that are in code as it provides clear, high-fidelity instructions to Claude in a language it knows very well," and that a spec may be a detailed test suite or a function in another codebase to port. Academic work on unit-tests-as-executable-specification supports the direction — pairing an NL description with human-written tests raises correct-generation rates — though it doesn't run the specific prose-vs-code head-to-head. This is largely a Claude-specific framing of long-standing TDD/spec-driven practice rather than a new discovery, and the blog's supporting example is a single unbenchmarked sentence. Pairs with the existing red-green TDD and behavior-table entries.

### For single-pass, function-level generation where iteration isn't available, use a test-first prompt — have the model write the unit tests, then the implementation, then re-check the tests for edge cases.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [TDD-Agent (arXiv 2608.16742)](https://arxiv.org/abs/2608.16742v1)
- **Detail:** On LiveCodeBench (224 problems, May-2024→May-2025), a TDD-prompt variant beat the prompting baselines on all three models tested — GPT 70.04 vs 68.48 (ICoT) / 68.17 (Self-Planning) / 67.41 (CoT), with the same ordering on DeepSeek-V3.2 and Qwen3-Coder-30B. It's a cheap drop-in for contexts with no execution loop. Two limits keep it below Proven: the margins are modest (+1.5 to +3.6 points) with no confidence intervals or significance testing over 10 samples/problem, and DeepSeek's +0.4 gap is indistinguishable from noise. Single paper, single benchmark, no replication; the paper's related work positions the variant as its own contribution rather than confirming prior results.

### Don't escalate every suspected failure to an LLM judge — put a cheap deterministic or telemetry check first and reserve the judge for what the cheap layer flags.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Real-Time Detection and Repair of LLM Agent Failures (arXiv 2608.02464)](https://arxiv.org/abs/2608.02464v1)
- **Detail:** Judging every step with a second LLM "costs more than the agent itself," and judges are not neutral instruments (position bias, hallucination). Measured rather than assumed: the real judge scored p_detect 0.548 (95% CI 0.44–0.65) at p_false 0.052, well short of the idealized judge the architecture was originally specified against. Note the paper's own honest negative result — when the stipulated judge (0.90/0.02) was replaced by the measured one, the escalation architecture kept its call savings (6% vs 8% of judge-every-step calls) but its detection recovery collapsed from 82% to 43%, and the authors state the hypothesis "is supported at 0 of 5 seeds." So: escalate for cost reasons and because deterministic checks catch a different, cleaner class; do not expect the escalation layer to retain judge-level detection. Single-author preprint.

### Consider a dedicated planning/brainstorm call that names the core difficulty, candidate approaches and assumptions to a file before any code is generated — but treat the benefit as model- and configuration-dependent, not universal.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Ledger-Based Self-Orchestration (arXiv 2608.26480)](https://arxiv.org/html/2608.26480)
- **Detail:** The headline case is striking — a reasoning-disabled model gained +30.4 points in the replicated 16k condition (p<2e-5), and the planning pass caught an O(N·M) ≈ 4×10^10 complexity trap that single-call runs walked into. Three reasons for caution before treating this as a general rule: the paper explicitly states the planning step was never tested in isolation ("no ablation study isolates the brainstorm component from context management, multiple workers, or task curation"), and attributes much of the benefit to short isolated worker calls avoiding runaway generation; the widely-quoted +42 figure is a single unreplicated pass, not the replicated +30.4; and the scaffold *regressed* in several cells (−1 for reasoning-on Kimi-K3, −1.2 and −9 for Qwen3.6-35B). Competitive-programming only. This adds a conditional-evidence footnote to the well-established plan-before-code entries rather than replacing them.

## Tool design

### Don't preload every MCP/tool schema into the prompt; expose an on-demand tool-search meta-tool that scores available tools and registers only the selected ones, or sync per-server schemas to disk and load them only when a tool is actually called.
- **Tier:** Proven (added 2026-07-09; updated 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344), [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [Cursor — Dynamic context discovery](https://cursor.com/blog/dynamic-context-discovery), [Amp — Efficient MCP tool loading](https://ampcode.com/news/lazy-load-mcp-with-skills), [Cursor 2.4 changelog](https://cursor.com/changelog/2-4)
- **Detail:** Matches Anthropic's shipped tool_search feature (~85% token reduction, tool-selection accuracy 49%→74%), and independent systems ToolLLM, AnyTool, MCP-Zero (98% token cut), RAG-MCP (13.6%→43.1% accuracy). Now default in Claude Code once tool descriptions exceed ~10% of context. A file-on-disk variant (sync each server's tool descriptions to a per-server folder, expose only names, read the full schema on demand) gives Cursor a statistically-significant 46.9% total-token cut and Anthropic's code-execution-with-MCP ~98.7% on a worked example. Known tradeoff: ~50% more round-trips per call and diminishing value below ~50 tools — reserve for tool-heavy, many-server setups.
  *Tool notes:* Pair with a schema-validation gate and per-subagent allow-lists. Amp narrows further two ways: gate a server behind a Skill so schemas inject only when the skill fires, and use an `includeTools` name/glob allowlist to expose a 4-of-26 subset (chrome-devtools ~17k → ~1.5k tokens).

### Ruthlessly curate the active tool set: remove ambiguous/overlapping tools and disable unused MCP servers/tools per task, since every tool definition consumes context and dilutes selection.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Sourcegraph: Context Engineering](https://sourcegraph.com/blog/context-engineering), [Cursor 3.3 changelog](https://cursor.com/changelog/05-06-26)
- **Detail:** If a human can't say which tool applies, the agent can't either. GitHub reduced Copilot's toolset 40→13 for +2-5pp resolution and lower latency; Anthropic and Microsoft (tool-space interference) and RAG-MCP corroborate. ~10-20 active tools before measurable degradation.

### Compose verified fine-grained tools into higher-level composite 'super tools' with macroscopic semantics rather than re-planning the same low-level call chain each task.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [Anthropic: Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- **Detail:** RestGPT combines RESTful calls into super-tools; Anthropic recommends consolidating multi-step workflows into single tools (e.g. schedule_event) over thin endpoint wrappers; HyperTool identifies the step-wise fragmentation failure mode. Build/verify fine-grained tools first, then compose stable sequences.

### When the toolkit can't satisfy a task, let the agent synthesize and self-test a new tool at runtime, splitting a tool-creator role from the tool-user.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [LATM](https://arxiv.org/abs/2305.17126)
- **Detail:** LATM splits a maker (auto-generates unit tests, verifies) from a cheaper user; CREATOR and ToolMaker converge on verified tool synthesis. Evidence is math/science tasks, so coding transfer is extrapolated; the auto-test-before-trust step is the key discipline.

### Wrap every tool call with pre-use hooks (validate args, enforce permission policy, block risky commands) and post-use hooks (sanitize/compact outputs, update memory, trigger verification).
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [Anthropic Claude Code Hooks](https://code.claude.com/docs/en/hooks)
- **Detail:** Turns tool use from a raw model-selected action into a monitored transition. Shipped as PreToolUse/PostToolUse (Claude Code), before-tool hooks (OpenAI Agents SDK), and middleware (LangChain) — three independent platforms.
  *Tool notes:* Most useful when hand-rolling a tool loop rather than using a platform's built-ins.

### Implement file edits with multi-pass fuzzy matching so an edit still lands when exact line numbers/context have drifted.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** A chain-of-responsibility of ~9 replacer passes (exact → line-trimmed → block-anchor → whitespace/escape-normalized → context-aware) short-circuits on first match so exact edits pay zero overhead; each pass returns the matched substring to preserve formatting. Cline and RooCode independently implement multi-strategy fuzzy edit fallbacks.

### Expose semantic code operations as first-class LSP-backed tools (find_symbol, find_referencing_symbols, rename_symbol, replace_symbol_body) rather than relying only on text search/replace.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** Precise workspace-wide rename/reference operations over grep. Independently adopted by Serena, agent-lsp, and Microsoft's AL Agent Tools; complements (not replaces) grep for broad recall.
  *Tool notes:* Requires one LSP server per supported language.

### Design test/verification harnesses for the agent's consumption: terse stdout, verbose detail to a logfile, ERROR-prefixed grep-able failure lines, and precomputed summary statistics.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- **Detail:** The harness shouldn't print thousands of useless bytes; keep a few lines on stdout, prefix failures with literal ERROR + reason on the same line, and pre-aggregate pass/fail counts so the agent doesn't recompute from raw logs. HumanLayer independently reports 'success is silent, failures verbose'.

### Prefer boring, well-established dependencies with stable APIs and strong training-data representation, and sometimes reimplement a small utility rather than fight an opaque upstream library.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Agent effectiveness tracks how well a dependency is represented in training data. Corroborated by Willison, Microsoft, and an arXiv study showing LLMs systematically over-favor popular libraries. The 'reimplement in-house' half is scoped to small, opaque utilities.

### Wire live application observability directly into the agent's runtime (CDP DOM snapshots/UI navigation, per-git-worktree bootable app instances) so it can reproduce and validate changes against the running app.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Lets the agent reproduce browser bugs and validate fixes by driving the live app, not just reading code. Chrome DevTools MCP is now a shipped Google product for exactly this; per-worktree isolation independently adopted elsewhere. Nontrivial infra investment.

### Compile the full system prompt and all tool schemas eagerly at agent construction, and re-run both build steps via a refresh call whenever the tool registry changes, rather than building lazily.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** Eliminates first-call latency and a race where MCP tools registered after construction don't appear until a manual refresh — a real, still-live bug (anthropics/claude-code #13646, fixed only in v2.1.0). Hermes/FastMCP also refresh on tools/list_changed.

### Configure agent sandboxes with a separate guaranteed resource floor and a higher hard-kill ceiling (never equal), calibrate the ceiling to ~3x spec, and treat resource allocation as a first-class experimental variable.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Quantifying infrastructure noise](https://www.anthropic.com/engineering/infrastructure-noise)
- **Detail:** At floor=ceiling, ~5.8% of Terminal-Bench tasks failed on OOM unrelated to model ability; ~3x headroom cut that to 2.1% with success scores unchanged (p=0.40). Too much headroom (uncapped) lets agents brute-force via heavy installs (+~4pp confound). Re-derive the multiplier per eval. Aligns with Kubernetes Burstable-QoS practice for bursty workloads.

### Give the agent an explicit ask-clarify or safely-abstain/terminate action and prefer it over guessing when required parameters are missing or intent is ambiguous.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [AskToAct](https://arxiv.org/abs/2503.01940)
- **Detail:** Models otherwise default to blind trial-and-error or hallucinated tool calls; AskToAct recovers >79% of unspecified intents, and FAIL-TALMS + ToolHaystack independently diagnose the failure. Calibrate to avoid over-interruption; the trained version needs SFT, approximate via prompting + retrieval otherwise.

### For long-tail, private, or frequently-changing APIs, integrate an API-search/retrieval tool the model invokes when it detects insufficient knowledge, instead of relying on parametric memory.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [ToolCoder](https://arxiv.org/abs/2305.04032)
- **Detail:** Reduces hallucinated APIs and incompatible function choices; ToolCoder reports ≥6% pass@1 gain. Corroborated by API-documentation-grounding papers (De-Hallucinator). The 'trained to invoke' form needs SFT; approximate with doc/web search + a prompt to consult it when knowledge is likely stale.

### Run agent execution in sandboxed, reproducible, permissioned substrates — ephemeral network-controlled containers, fixed dependency lockfiles/seeds/snapshots — so verification signals reflect defects, not environment drift or answer leakage.
- **Tier:** Promising (added 2026-07-09; updated 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [Scaling Coding Agents via Atomic Skills](https://arxiv.org/abs/2604.05013), [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Isolated fs/shell/runtime + fixed lockfiles/seeds keep test signals stable; disabling network and stripping .git history force execution-grounded rewards and block patch retrieval. Cursor's stricter-isolation experiments confirm large score drops when leakage is closed (note: the Atomic Skills paper was withdrawn for data errors, but this specific practice is independently corroborated). Treat environment hardening as a first-pass anti-reward-hacking defense, not a complete one: under hardening the Verification Horizon paper found static-leakage behaviors (repo-history mining, harness tampering, visible-test overfitting) all correlate negatively with resolved rate (φ −0.02 to −0.11), but active shortcut-seeking persisted (solution-artifact retrieval in 4.3% of trajectories at +12.35pp resolved). Sanitizing git history must cover other branches/refs/reflog, and tasks that keep network open keep an exploitable retrieval channel — pair hardening with trajectory monitoring.
  *Tool notes:* Daytona/E2B microVMs; strip/reinit .git as single-commit.

### When ablating a retrieval/tool feature, remove exactly the tool(s) that expose it and hold every other harness component fixed, so deltas can be attributed to the feature alone.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code Isn't Memory: Structural Codebase Index](https://arxiv.org/abs/2606.22417)
- **Detail:** Strip the schema entries, not prompts/loop/other tools; avoids confounding a whole harness/prompt difference with the feature. Clean methodological discipline for tool-feature evals.

### Scope which tools are visible at each decision point (per phase, per graph node, per sub-agent role) as tool count grows, instead of exposing the full set at every step.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Prometheus binds distinct tool subsets to graph nodes (its plan/write nodes see read-only tools); AutoCodeRover's search agent has no edit access. Reduces action-space reasoning burden. Only Prometheus does dynamic per-node scoping in the corpus, so it's a real differentiator; corroborated in principle by Anthropic's role-scoped subagent guidance.

### Build or prefer a structure-aware code retrieval layer (tree-sitter AST index, symbol/definition/call-graph lookups) over flat text or pure vector similarity.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Code Isn't Memory](https://arxiv.org/abs/2606.22417), [Sourcegraph: Context Engineering](https://sourcegraph.com/blog/context-engineering)
- **Detail:** SCIP/AST lookups turn '50 files that mention the symbol' into 'the one file where it's defined plus three call sites'. Directionally supported (Serena, AutoCodeRover) but the strongest quantitative claims come from vendor-authored or confounded benchmarks, and one study found naive similarity retrieval can hurt — treat as promising-but-unproven and pilot per codebase.

### Use one parameterized agent class for every role (main, planner, explorer), varied only by construction parameters, instead of a per-role class hierarchy.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** OpenDev abandoned a per-role hierarchy (diamond problem for mixed-capability subagents) for a single MainAgent varied by allowed_tools + prompt-override + is_subagent flag. Textbook composition-over-inheritance applied to agents; single case study.

### Auto-detect 'server-like' shell commands (e.g. python -m http.server) and promote them to background execution rather than letting them block the tool loop.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** Pattern-match dev-server/long-running commands and reroute to a background path with a companion process manager (list/get_output/kill). Ahead of default behavior (Claude Code's run_in_background is a manual flag); Astro shipped an analogous self-backgrounding fix.
  *Tool notes:* Requires a background-process manager alongside the shell tool.

### Detect stale reads — flag when a file was modified externally since the agent's last read — before applying an edit built from that stale content.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** A FileTimeTracker asserts freshness (mtime vs read-time) before edits and rejects with a re-read instruction. Already standard in Claude Code/opencode, but naive mtime checks cause real false positives (snapshot/undo systems, WSL2 atime bugs) — warn-but-allow or auto-re-read may be preferable.

### Guard newly-added template variables with 'is defined' conditionals so error/prompt-template code doesn't break for provider wrappers that don't populate the field.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [mini-swe-agent v2.4.0 (PR #862)](https://github.com/SWE-agent/mini-swe-agent/releases)
- **Detail:** A shared template consumed by many model wrappers (litellm, openrouter, portkey, requesty) breaks for any wrapper not yet populating a new optional field unless its use is defensively guarded. Real gotcha for pluggable multi-provider architectures; single-source.

### Give the agent's debugging inspector a toggle to show raw reasoning_content with hot-reload, so a developer can iterate without restarting the session.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [mini-swe-agent v2.4.0 (PR #815)](https://github.com/SWE-agent/mini-swe-agent/releases)
- **Detail:** Surface hidden reasoning traces (already stored in trajectory files) in a live-reloading dev UI. A recurring shape across agent-debugging tooling (LangSmith Studio, AgentStepper) but only anecdotal impact evidence.

### Constrain a rule/filter-generating LLM to a fixed structured schema (trigger condition, keep-patterns, strip-patterns, keep-first/last-N, max-line cap, summary placeholder) instead of free-form filtering logic.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** Keeps generated rules safe, inspectable, and mechanically executable; TACO's example rules ran 100+ applications with zero complaints. Aligns with general schema-first tool-API safety; no schema-vs-free-form ablation.

### Hard-code a 'never compress' category list for byte-exact analysis commands (diff/cmp, hexdump/xxd/od, strings/objdump/readelf, strace/ltrace, checksums) in any compression layer.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** Every byte can be semantically load-bearing; no paraphrase is safe. TACO's own ablation shows telling an LLM 'never compress these' as a soft instruction was insufficient — enforce deterministically, not via prompt. Single-source.

### Give the agent atomic, structured tools (search / view / edit / create) rather than only a raw shell, and expect the payoff to be run-to-run consistency — not resolve rate — with the largest gains on weaker models.
- **Tier:** Promising (added 2026-07-09; updated 2026-09-01)
- **Sources:** [The Devil Is in the Interface (arXiv 2608.11386)](https://arxiv.org/abs/2608.11386), [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** Supersedes the earlier "structured ACI vs raw bash is contested" entry: a COLM 2026 controlled study (6 tool architectures, 3 actors, 11,700 trajectories on SWE-bench Live, with capability deliberately held constant across architectures) settles part of the debate. Atomic tooling was the only setup with uniformly positive pass^k deltas across all three actors — Qwen3Coder-**30B** +0.074, Sonnet-4.5 +0.031, Kimi-K2.5 +0.014 at pass^9 — by reducing malformed commands and broken edits, while overall resolve rate barely moved. Two caveats the headline hides: the effect is small for capable models (~5–12% relative), and Atomic *reduces* efficiency for strong actors by fragmenting compound shell work into more turns. Single research group; also note the paper classifies Claude Code, OpenHands, TRAE and SWE-Agent as already-Atomic, so this is causal evidence for a default most harnesses already ship, not new guidance.
  *Tool notes:* Beware a mis-transcription circulating from this paper — the weak actor is Qwen3Coder-30B, not 3B.

### Apply progressive disclosure to skills/capabilities: keep name + one-line description always-on, and load the full instruction body only when the skill is triggered.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Amp — Efficient MCP tool loading](https://ampcode.com/news/lazy-load-mcp-with-skills); [Cursor — Dynamic context discovery](https://cursor.com/blog/dynamic-context-discovery)
- **Detail:** Define capabilities as file-based skill definitions; only the name/description sits in static context, and the agent grep/semantic-searches to pull full instructions when relevant. This is the exact tiered-loading contract Claude Skills runs on (metadata ~100 tokens at startup, full SKILL.md on trigger, bundled resources on demand). Anthropic's tool-use work reports large accompanying gains (Opus 4 tool-selection 49%→74%, Opus 4.5 79.5%→88.1%). Guard against the one failure mode — a hidden capability never invoked because the model doesn't know it exists — by writing a discoverable, always-visible short description.

### Keep credentials out of the sandbox that runs model/tool-generated code — bundle auth into the resource at provision time or route calls through a token-holding proxy.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic — Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- **Detail:** Two patterns: (1) clone a repo with a token pre-wired into the local git remote so generated code just runs `git push` with no token in reach; (2) for MCP/custom tools, hold tokens in an external vault and have the harness call through a proxy that fetches the token and makes the call on the sandbox's behalf, so the harness/sandbox is never made aware of any credential. Motivated by a real risk in coupled designs (a prompt injection reading env vars to spawn unauthorized sessions). Independently converged on by Infisical (Agent Vault), TRM Labs (built with no reference to Anthropic), and SANS's PDP/CDP broker guidance, with real incidents (Feb-2024 Defender confused-deputy, Mar-2026 LiteLLM supply-chain attack) motivating it. Never mount long-lived OAuth secrets as env vars inside a sandbox running untrusted code.
  *Tool notes:* Directly actionable for MCP-server and coding-agent design.

### Pass large intermediate artifacts (dataframes, files, API responses) between agents as live typed references in a shared workspace, not as text serialized into a prompt.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [CodeDelegator (arXiv 2601.14914)](https://arxiv.org/abs/2601.14914)
- **Detail:** Serializing execution outputs to text flattens structured types, forces costly re-parsing, and precludes live inspection; passing a reference plus type/shape/sample metadata lets a downstream worker manipulate the real object without printing it into context. Corroborated by CaveAgent (arXiv 2601.01569, persistent-runtime variable references) and production tooling (VS Code Copilot streams large output to temp files). Contribution isolated only within the bundled EPSS ablation (−4.7pp), not on its own.
  *Tool notes:* Requires a persistent runtime/workspace holding typed objects across agent boundaries.

### For transactional tasks (multi-statement DB writes), be wary of decomposing into a code loop or multi-step pipeline — a single-tool-call-per-step pattern aligns with atomic transaction boundaries.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [CodeDelegator (arXiv 2601.14914)](https://arxiv.org/abs/2601.14914)
- **Detail:** On MCPMark's PostgreSQL domain — the one case of five — ReAct (52.4%) beat both CodeDelegator (41.7%) and CodeAct (36.2%), which the authors attribute post-hoc to transactional atomicity (single tool call per step vs. code that risks partial-failure inconsistent state). N=1 domain/model/paper, no targeted ablation; the more robust fix per adjacent work (Atomix, SagaLLM) is transactional/saga wrapping at the tool layer (BEGIN/COMMIT, idempotency keys, compensations), which is orthogonal to orchestration style.

### Decompose an agent harness into orthogonal, independently-editable component files at fixed mount points (system prompt, tool descriptions/impls, middleware, skills, sub-agent configs, long-term memory).
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Agentic Harness Engineering (arXiv 2604.25850)](https://arxiv.org/html/2604.25850v1)
- **Detail:** Loose coupling so each observed failure pattern maps to one file to change, each change independently revertible. A component-swap ablation shows distinct effect sizes (memory +5.3pp, tools +3.3pp, middleware +2.2pp, system prompt −2.3pp), but on a small single-model benchmark (89 Terminal-Bench-2 tasks) with non-additive interactions (+11.1pp summed vs +7.3pp integrated). Single-team result; for Claude Code this largely redescribes existing separation (CLAUDE.md, skills/, hooks, MCP defs, subagents).

### When spinning up a subagent, narrow its config to the subtask: a custom system prompt, a tool allowlist restricted to what the subtask needs, and optionally a cheaper/faster model than the parent.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Cursor 2.4 changelog](https://cursor.com/changelog/2-4)
- **Detail:** Three independently configurable axes (prompt, tool access, model). Independently adopted by Claude Code subagents (per-subagent `tools:` allowlist + `model:` override) and VS Code — cross-product convergence, but no benchmark comparing restricted vs. unrestricted access. Make tool restriction an architecturally-enforced allowlist (harness doesn't expose disallowed schemas), not a prompted courtesy: prompt-only restrictions are violated 37-68% of the time under adversarial framing.

### Choose the strongest available model as the evaluator/judge backbone for ranking fidelity and run-to-run stability, not just peak score.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Table 8: Claude Opus 4.7 led all four backbones on BoN-Acc (70.4%) and Kendall's τ (0.579); a weaker backbone occasionally matched Opus-level peak BoN-Acc but showed ±10pp variance across repeated runs. A weaker-but-sometimes-comparable judge can be masked by lucky runs, so compare on reliability, not just peak. Single benchmark (NL2Repo, ~104 tasks); notable that a Qwen-authored paper's own result favors a competitor's model.

### Sync integrated terminal output continuously to the filesystem so the agent can grep long-running process output on demand rather than needing copy/paste into the prompt.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor — Dynamic context discovery](https://cursor.com/blog/dynamic-context-discovery)
- **Detail:** Mirrors how CLI coding agents already behave; closes a gap specific to IDE-integrated agents with a persistent terminal pane. Single primary source, no isolated metric. Requires wiring terminal stdout/stderr to a file the agent's read/grep tools can reach; CLI agents already get equivalent behavior via background processes.

### Reuse the per-server MCP folder/file channel to also communicate live server status to the agent (e.g. a server needing re-authentication) rather than only tool descriptions.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor — Dynamic context discovery](https://cursor.com/blog/dynamic-context-discovery)
- **Detail:** Instead of silently dropping tools when a server needs re-auth (leaving the agent confused), write status into the same folder so it can prompt the user proactively. Single-source, qualitative, and partly overlapping with MCP's `notifications/tools/list_changed`; a near-free add-on only if you've already adopted the per-server-folder pattern.

### Ship a lightweight installable "developer skill" that packages current API/SDK facts and sample code, so the agent doesn't rely on stale training-data knowledge of an evolving SDK.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Google — Closing the knowledge gap with agent skills](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/)
- **Detail:** Google reports large pass-rate jumps with vs. without the skill (Gemini 3.1 Pro 28%→~96%, 3.0 Pro/Flash 6.8%→87-96%) on a 117-prompt harness. Vendor-self-reported and unreplicated, and the source itself concedes direct AGENTS.md instruction can be more effective than the skill packaging — the real driver is delivering current curated SDK facts, not the specific CLI distribution mechanism.
  *Tool notes:* Distributed via Vercel `skills` CLI or Context7 `ctx7` CLI; pattern generalizes to any harness that loads an installable context package.

### When prompting a generator to build an app with its own internal AI feature, direct it to construct a real tool-using agent inside the app (not a scripted fake) — and budget extra iteration.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **Detail:** Resulting in-app agents drove real end-to-end tool use (a DAW agent laid down a melody, built drums, set mixer levels, added reverb). Agent-building patterns are recent enough that training data covers them thinly, so this class of feature needs more explicit prompting than a typical feature request. Single-source anecdote; niche to cases where the deliverable app itself embeds a tool-using agent.

### Use a sequence model with an explicit label-transition prior (CRF favoring keep→keep) and Viterbi decoding for keep/prune decisions over code lines, so retained code stays in coherent contiguous runs.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Context Pruning via Multi-Rubric Latent Reasoning (arXiv 2605.15315)](https://arxiv.org/pdf/2605.15315)
- **Detail:** A learned keep→keep transition avoids isolated single-line keeps that fragment output; SWE-Pruner (independent prior work) reports 23-38% token reduction while holding task success. No ablation isolates the transition prior from confounds, the source paper itself supersedes single-CRF with a multi-CRF/MoE refinement, and it requires training a bespoke sequence-labeling model — low broad actionability.

### Run a CI-triggered review/analysis agent with read-only permissions and have deterministic CI code (not the agent) perform the actual writes — emit structured output (e.g. review.json) that a non-agent step converts into PR comments — to blunt prompt-injection from untrusted PR content.
- **Tier:** Proven (added 2026-07-17)
- **Sources:** [Warp: self-improving code review](https://www.warp.dev/blog/how-to-build-a-cloud-software-factory-self-improving-code-review)
- **Detail:** An agentic workflow must never simultaneously process untrusted input, hold write/secret access, and change external state (Microsoft's 'Agents Rule of Two'); the read-only-agent + separate-write-step split is the mitigation for the documented 'Comment and Control' (CVSS 9.4) prompt-injection class that affected Claude Code, Gemini CLI, and GitHub Copilot Agent GitHub Actions. Multiple independent authoritative sources (Warp, Microsoft Security, Cloud Security Alliance, disclosed exploits) converge.
  *Tool notes:* GitHub Actions specifically; the privilege-separation principle (analyze-only agent, deterministic step performs privileged writes) is framework-agnostic.

### Ship deterministic logic a skill uses (diff parsing, output formatting) as bundled scripts (skill resources), rather than having the agent regenerate that code from scratch each run.
- **Tier:** Proven (added 2026-07-17)
- **Sources:** [Warp: self-improving code review](https://www.warp.dev/blog/how-to-build-a-cloud-software-factory-self-improving-code-review), [Anthropic: Agent Skills best practices](https://platform.claude.com/docs)
- **Detail:** More reliable than generated code, saves tokens (no code in context), and ensures consistency across runs. Anthropic's official skill-authoring docs state the identical rule ('prefer scripts for deterministic operations', 'provide utility scripts') with matching rationale, and multiple third-party guides converge. Applies to any skill-based agent framework that supports bundling non-agent code alongside instructions.

### Prefer narrowly-scoped Edit(path)/Read(path) permission rules over Write(path)/NotebookEdit(path)/Glob(path) rules when scoping what an agent/subagent may touch.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Claude Code v2.1.210 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.210)
- **Detail:** In Claude Code, Write/NotebookEdit/Glob path rules are parsed but never matched by the file-permission checks (silent no-ops for scoping), giving a false sense of confinement; Edit(path) covers all file-editing tools and Read(path) covers Glob/Grep. Verified against the current permissions docs; single-vendor but a concrete, non-obvious footgun.
  *Tool notes:* Claude Code permission-rule syntax.

### Serialize expensive shared build/compile operations through a single dedicated 'build daemon' that batches patches from parallel fixer agents, rebuilds once, re-runs affected tests, and reports back — rather than letting many agents trigger independent colliding rebuilds.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** 'The daemon is the only process allowed to rebuild the binary; fixers write patches, the daemon batches them, rebuilds once, re-runs affected tests.' A concrete instantiation of serialize-contention-on-a-shared-resource (independently recommended for multi-agent orchestration race conditions); no quantified before/after in-source. Applies to any pipeline where parallel agents patch one expensive-to-rebuild artifact.

### Represent review/test verdicts as signed, self-contained JSON receipts (command, args, cwd, exit code, output digest, plus source/policy/command-set hashes) rather than free-text comments or logs, so a later gate can mechanically re-verify them offline.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890)
- **Detail:** An 18-tamper-class contract (forged signature, host-verdict swap, malformed structure, non-zero exit, …) verified with 0 false-accepts, fully offline. The broader signed-offline-verifiable-receipt pattern is independently converging (in-toto/SLSA attestations, agent action-receipt tooling); the specific benchmark is single-paper and narrow-scope.
  *Tool notes:* Generalizes to any git repo plus a CI signing/digest step; requires infrastructure to sign and store receipts alongside commits.

### Give every side-effecting tool call a stable idempotency key scoped to (run_id, key) — ideally a caller-named semantic key (charge_card:{order_id}) minted at the call site — so replays dedupe instead of double-executing; and after a run is cancelled, explicitly fence its later/orphaned effect submissions and drop its pending held effects rather than letting in-flight work land silently.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** Replay double-execution reproduced in 2/5 frameworks and cancellation orphans across frameworks (even a pure-async JS runtime whose AbortSignal can't interrupt a promise chain, and worker threads that survive the cancel signal); both fixes are formally verified (TLA+/TLC to ~74.8M states, 0 violations) in the reference implementation. General idempotency-key/terminal-state discipline; single unreviewed preprint.
  *Tool notes:* Keys must be stable across retries of the same logical action — a fresh key per retry silently defeats dedup; scope by (run,key), not a globally-unique per-call token.

### Harden an effect-mediation/admission gate at its boundary: authenticate every approval/rejection decision (e.g. HMAC over run_id, key, approved, verified in constant time before any state change), and where kernel support exists back the 'route every side effect through the gate' discipline with OS-level structural enforcement so a forgotten wrapper fails loud instead of leaking.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** Forged approve/reject both refused (HMAC-SHA256, RFC 4231 vector); an unwrapped tool's egress refused by the kernel (ENETUNREACH/EPERM) inside a loopback-only network namespace or cgroup eBPF egress limit while the gate still releases; deny-by-default seccomp/Landlock blocked 3/3 non-network side channels (filesystem/IPC/shared-memory) vs 0/3 confined, with path-granular writes still permitted to a granted workdir. HMAC/constant-time and the kernel primitives are independently well-established; Linux-specific, single preprint for the agent-gate application. Layer a static mediation linter as a best-effort catch for unwrapped calls.

### Route every side-effecting tool call through an environment-external admission broker (a stateful submit/decide/cancel service outside the agent framework's own control flow) that enforces hold-until-decided and reject-cancels semantics, instead of relying on the framework's built-in pause/cancel/timeout to actually block effects.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** A ~20-line-per-framework wrapper (SoundGate) blocked every measured violation class across six frameworks; a live experiment showed 215/1,200 runs executed an effect during a human's pause when unmediated vs 0/1,200 when mediated, ~1ms/write. When batching admissions to a durable write-ahead log, use group commit (one fsync per batch, single writer) to preserve 'acknowledge only after durable' at throughput. Single very-fresh unreviewed preprint plus its own same-day package; the umbrella pattern (policy-enforcement point at a controlled boundary) is established architecture.

### In any checkpoint/resume durability mechanism, persist a node's pending write (ordered) before the checkpoint that would let a resumed run reconstruct that step — otherwise a crash between the write and the superseding checkpoint yields host-dependent recovery that duplicates the external side effect.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** A documented, community-reproduced (incl. macOS/arm64) LangGraph durability='sync' ordering bug where a task's pending-write persistence and the superseding checkpoint were submitted to a shared thread pool with no ordering edge. Write-ahead-ordering discipline applied to one framework's concurrency bug; single well-documented instance, well-known principle.

### Add a deterministic, non-LLM 'facet' index term at index time (per-session distinct tool paths + command prefixes + steering text, BM25-searched as an extra orthogonal hybrid layer) to recover answers that live in tool-call metadata but are never mentioned in conversational turns; make it config-gated (boost weight settable to 0) so it can be disabled to reproduce the pre-facet baseline exactly.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Why Git Is the Memory Solution (arXiv 2607.14390)](https://arxiv.org/abs/2607.14390)
- **Detail:** The one imported ranking mechanism that survived the paper's pre-registered incumbent-vs-candidate discipline (A +0.110, B +0.053, CIs excluding zero after a joint re-tune), with magnitude monotone in tool-path diversity. Single vendor-authored preprint; the gain requires re-tuning the whole hybrid weight mix, not just flipping the layer on.

### For agent-memory retrieval, build a repository 'structural map' by having an LLM read the actual directory skeleton and README/architecture docs (a comprehension summary with greppable path anchors) rather than clustering file/tool co-occurrence, and default to a local in-binary embedding model over a hosted API since alignment of the hybrid retrieval mix, not embedder quality, was the binding constraint.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Why Git Is the Memory Solution (arXiv 2607.14390)](https://arxiv.org/abs/2607.14390)
- **Detail:** Statistical clustering grouped tool-call-id dumps/scratch files into meaningless clusters; hosted-vs-local embedder deltas were non-significant under paired bootstrap (one comparator tested, and hosted+re-tuned actually edged out local+default). Single vendor preprint, small n, self-benchmarked — the real lesson is 're-tune the mix when swapping the embedder', not 'local is intrinsically better'.

### Derive which tool-specific guardrail knowledge to load from the agent's already-declared tool/MCP configuration (a static known source of truth) rather than probing the network/localhost for running services at runtime; keep any live-scanning path as an explicit, clearly-labeled developer convenience, not the default.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [OpenHands SDK v1.36.0 — ToolShield](https://github.com/OpenHands/software-agent-sdk/releases/tag/v1.36.0)
- **Detail:** Config-derived loading needs no network probing and works for stdio-based MCP servers that never open a scannable port (which a scan-based default silently fails for). Review-feedback-driven design in one SDK; the general direction (declarative wiring over runtime discovery) is corroborated, but this exact tradeoff is single-source.

### When a working-directory-changing command (cd) is moved to background execution, have the tool result explicitly state the working directory is unchanged, instead of letting the agent assume the cd took effect.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Claude Code v2.1.210 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.210)
- **Detail:** Assert what did NOT change when a tool silently defers/backgrounds a command whose effect the model would otherwise infer happened (state-assumption drift across sync/async boundaries). Single changelog line; generalizes to any agent framework with background/async tool execution.

### In a retry loop, persist every prompt, raw model response, parsed output, gate result, model/decoding settings, and elapsed time before issuing the next call.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Structured Feedback Improves Repair in an LLM Agent Loop (arXiv 2607.14167)](https://arxiv.org/abs/2607.14167)
- **Detail:** The exact per-call field list that underpins a reproducible ablation/debugging corpus (this harness released 880 row-level results and 2,652 call traces). Descriptive research hygiene — unbenchmarked as a technique and narrower than, but consonant with, the playbook's existing durable-trace/telemetry entries.

### Let the agent bundle several repository operations into one code-execution block instead of one tool call per primitive — same resolve rate at ~42% fewer steps and ~56% lower token cost.
- **Tier:** Proven (added 2026-09-01)
- **Sources:** [The Devil Is in the Interface (arXiv 2608.11386)](https://arxiv.org/abs/2608.11386), [CodeAct (arXiv 2402.01030)](https://arxiv.org/abs/2402.01030)
- **Detail:** In a capability-matched ablation (an appendix check confirms 97% of Python actions map to operations already available under bash-only, so this is purely an interface effect), the code-execution interface achieved comparable task resolve rates with 41.6% fewer steps and 56.3% lower token cost, because the actor batches search→view→edit into a single executable block. The effect held uniformly across all three actor models, unlike atomic tooling whose efficiency effect is actor-dependent. Independently corroborated by CodeAct (ICML 2024), which found ~30% fewer steps for code actions vs JSON/text tool calls in a different task domain with success held equal or better. Caveat: the specific per-run token/step figures circulating with this finding contain a unit-scale transcription error — trust the percentage deltas, not the absolute counts.
  *Tool notes:* Complements, doesn't replace, atomic tools — expose both and let the model batch when it can.

### Treat interface organization — abstraction level, tool grouping, how capabilities are exposed — as a first-class performance variable, not cosmetics on top of capability.
- **Tier:** Proven (added 2026-09-01)
- **Sources:** [The Devil Is in the Interface (arXiv 2608.11386)](https://arxiv.org/abs/2608.11386), [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** The study's design goal was isolating interface effects from capability: six architectures all exposing search/view/edit, three actors, 11,700 trajectories. Same capabilities produced materially different consistency (pass^5 0.046–0.296 under bash-only vs 0.106–0.313 under atomic), different exploration patterns, and different efficiency profiles — a confound prior tool-design work routinely entangled. Directionally supported by the Inside the Scaffold source-code taxonomy. The result is *not* "one architecture wins": effects are actor-dependent (NLSearch raises consistency for two actors and lowers it for a third), so the actionable claim is to invest in how capabilities are exposed and to measure it, not to copy one layout.
  *Tool notes:* Budget interface experiments the way you budget model choice; the spread here is comparable to a model-tier gap.

### Expect the ROI of tool-interface investment to scale inversely with model strength — structured interfaces buy the most where the actor is weakest.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [The Devil Is in the Interface (arXiv 2608.11386)](https://arxiv.org/abs/2608.11386)
- **Detail:** Atomic-vs-bash consistency gains: Qwen3Coder-30B +0.059/+0.067/+0.074 (pass^5/7/9), Sonnet-4.5 +0.017/+0.027/+0.031, Kimi-K2.5 +0.014/+0.013/+0.014 — the weak actor is a clear outlier because it makes the environment-interaction errors structure prevents. But the story isn't cleanly monotonic in capability: Sonnet's gain nearly triples from pass^5 to pass^9 and exceeds Kimi's at every k, so don't read "frontier models don't need it" out of this. Useful as a budgeting heuristic when deploying on cheaper/smaller models; single paper, three actors.

### Consider offering a natural-language repository-search tool alongside grep/find to widen exploration — but expect a precision cost and no reliable gain in solution quality.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [The Devil Is in the Interface (arXiv 2608.11386)](https://arxiv.org/abs/2608.11386)
- **Detail:** NLSearch was the only setup that consistently raised read diversity (Jaccard distance over files read) across all three actors, via more varied early search queries. Two things temper it: the paper's own Table 7 shows it trades precision for recall (Sonnet-4.5 precision −0.104, recall +0.064), leaving the actor more noise to filter; and its implementation is really an exploration subagent that still calls grep/find underneath, not a new search modality. Field evidence cuts the other way too (Augment's "why grep beat embeddings in our SWE-bench agent"). Single source, intermediate metric only — the paper does not show the extra breadth converts into task success.
  *Tool notes:* If you try it, the cheap version is an exploration subagent that issues several NL-derived greps, not an embedding index.

### Spend tool-definition effort on expressive parameter schemas and enums rather than on usage examples, which can narrow a newer model's exploration space.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Anthropic: New rules of context engineering for Claude 5](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models), [Anthropic: Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- **Detail:** Named parameters and enumerated status fields (the Todo tool's pending/in_progress/completed) signal correct usage machine-readably without pinning the model to a demonstrated path; Anthropic reports that with newest models "giving examples actually constrains them to a certain exploration space." Split the claim when weighing it: the enum/schema half is long-standing, well-corroborated practice; the novel half — that examples now *hurt* — is an unbenchmarked internal observation from a single post, with no ablation or task-success numbers. Treat as a reason to try trimming example blocks on frontier models and measure, not as a rule.

### Add a lightweight content-grounding channel over tool results (query-result dissimilarity, self-consistency, JSON validity, character anomaly, lexical relevance) to catch corruption that behavioral monitors are structurally blind to.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Real-Time Detection and Repair of LLM Agent Failures (arXiv 2608.02464)](https://arxiv.org/abs/2608.02464v1)
- **Detail:** A fabricated or off-topic tool result perturbs no behavioral signal — the paper's CUSUM stream stays flat through grounding-loss episodes. Adding nine derived content dimensions raised pooled content-corruption detection 0.28→0.59 (0.27→0.58 on 313 injected episodes), a real, seed-stable +0.31. Scope limits matter: the channel catches malformed/off-topic content, while the paper states plainly that plausible-value corruption (wrong-but-well-formed numbers) is "undetectable from telemetry by construction" and needs an external reference. Two numbers circulating with this tactic are wrong — the dramatic 0.07→0.90 figure is malformed-JSON only, and the "2 µs" cost is the lexical flag alone; the char-3-gram embedding costs ~674 µs/step median. Single-author, non-peer-reviewed preprint on a custom harness.

### Make the agent's action space a strict typed schema (e.g. Keep | Patch(code) | Escalate(reason)) validated before any state mutation, so "no edit needed" is distinguishable from a parse failure and an unparseable response never corrupts state.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Looping Is Not Reliability (arXiv 2607.24604)](https://arxiv.org/html/2607.24604v1)
- **Detail:** Across a 288-rollout factorial, 90 rollouts produced invalid actions despite careful prompting (148/288 in a second model's replication) — free-form outputs are unparseable often enough to matter. The concrete failure the paper documents: a bare "STATUS: DONE" reply gets misread as an invalid patch and clobbers a good checkpoint, whereas a typed schema resolves it to Keep. Two honest caveats: the invalid-action rate is a motivating statistic, never broken down by contract-on/contract-off, and in the primary experiment the typed contract produced *zero* sound completions vs one for baseline — the authors state it "makes failure modes falsifiable obligations; it does not improve agent competence." Value is fail-visible state safety, not accuracy. Largely convergent with existing schema-validation practice (function-calling schemas, Zod/Pydantic gates); the additions are the explicit no-op verdict and the never-fall-back-to-partial-application rule.
  *Tool notes:* Reject unparseable output outright; never apply a best-effort interpretation of a malformed action.

## Verification & self-repair

### Verify the final environment state (files, DB contents, logs, page state) after a trial rather than trusting what the agent's transcript claims it did.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Confirm the reservation exists in the DB, not that the agent said 'booked'. Operationalized at scale by SWE-bench (apply patch, run tests) and WebArena (programmatic state checks); an independent paper argues log/state inspection is necessary for credible agent evaluation.
  *Tool notes:* Implement state_check graders that query DB/filesystem/logs post-trial.

### Regularly read a sample of full transcripts and grader/evaluator outputs, not just aggregate pass rates, to catch broken or gameable graders — and when the evaluator diverges from the human quality bar, rewrite its prompt against the divergence cases (expect several rounds).
- **Tier:** Proven (added 2026-07-09; updated 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **Detail:** On CORE-Bench, transcript review took Opus 4.5 from 42% to 95% by surfacing rigid numeric matching, ambiguous specs, and stochastic tasks. Corroborated by Hamel Husain's evals writing and a Berkeley RDI study where a near-zero-capability exploit scored ~100% on eight benchmarks. A specific, easy-to-miss evaluator failure mode: out of the box a coding-agent evaluator will identify a legitimate bug then talk itself into approving it — the fix is the standard LLM-as-judge calibration loop (Arize, LangChain, Braintrust): read its logs, find the divergence cases, and rewrite the evaluator prompt to close each gap, over several rounds, with residual gaps remaining.

### Choose pass@k when a single success suffices and pass^k when the agent must behave reliably every time — and when comparing harnesses or tool architectures, measure pass^k alongside resolve rate, since resolve rate alone hides reliability differences.
- **Tier:** Proven (added 2026-07-09; updated 2026-09-01)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), [τ-bench](https://arxiv.org/abs/2406.12045), [The Devil Is in the Interface (arXiv 2608.11386)](https://arxiv.org/abs/2608.11386), [Beyond Pass@k (arXiv 2608.14711)](https://arxiv.org/abs/2608.14711)
- **Detail:** At 75% per-trial success, pass^3 ≈ 42%; by k=10 pass@k → 100% while pass^k → 0%. pass^k originates in τ-bench (GPT-4o pass^8 <25% in retail). New evidence extends the metric from deployment choice to comparison methodology: across six tool architectures, per-actor resolve rate stayed in a similar band while pass^k diverged widely (Qwen3Coder-30B 0.016–0.106, Kimi-K2.5 0.258–0.304, Sonnet-4.5 0.279–0.315), so a single-run comparison would have shown "no difference" where reliability differed substantially. Beyond Pass@k independently shows single-rollout and misapplied pass@k inflating apparent reliability (SWE-bench Verified hidden-test pass 0.80 vs strict resolution 0.20). One calibration note: the source paper treats pass^k as complementary to resolve rate across four dimensions, not as a replacement — measure both, and don't overstate "29–31% resolve for all setups," which held only for the two stronger actors.
  *Tool notes:* k = 5–9 repeated attempts is the reported range; this is evaluation-design work, so budget the extra runs.

### Calibrate LLM-based graders against human expert judgment before scaling, give them escape clauses ('return Unknown'), and split them into isolated, named, weighted single-dimension judges calibrated with few-shot scored examples rather than one monolithic rubric.
- **Tier:** Proven (added 2026-07-09; updated 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps), [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Judge-human agreement rises sharply with decomposed/anchored rubrics (kappa ~0.4→0.78 in RubricEval/LLM-Rubric work); abstention research supports escape clauses; LangChain/Kinde practitioner guides support gold-set calibration. When a quality dimension is subjective, replace vague judgment with named, weighted, gradable criteria: Anthropic's long-running-app harness used four weighted criteria (Design Quality, Originality, Craft, Functionality — design/originality weighted higher to push past 'AI slop') and reports reduced score drift, and the Verification Horizon rubric decomposition (functional/content/visual/layout/UX/technical) reached Spearman ρ up to 0.905 and cross-judge τ ≥ 0.93 vs. human ranking on 671 tasks × 8 models (further corroborated by Autorubric, CheckEval). Cost: isolated judges mean 2-3x more calls. Caveat: static rubric judges are themselves gameable via length-inflation — pair with live/interactive verification where feasible.

### Invest disproportionately in making the verifier/test harness near-perfect, since the agent trusts and optimizes against it even when wrong and will reward-hack a flawed signal.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler), [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** A flawed verifier makes the agent 'solve the wrong problem'; make graders resistant to bypasses. RLVR papers quantify the mechanism — test/verifier-quality improvements cut hacked-but-passing resolutions from 28.57% to 0.56% while raising true resolution.

### Gate acceptance and continue/revise/terminate decisions on deterministic execution signals (tests, compilers, linters, static analysis, fuzzers), not the agent's self-report — never accept a patch on plausibility, and never end purely on iteration budget.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [AgentForge](https://arxiv.org/abs/2604.13120)
- **Detail:** The Plan-Execute-Verify pattern: reflection interprets sensor output, it doesn't replace it. AgentForge's execution gate lifts resolve 14% to 40%; AlphaCodium's test-driven flow raised GPT-4 pass@5 from 19% to 44%; AgentCoder, SWE-agent converge. Ground loop termination in objective signals (tests pass, zero CWEs, perf threshold), treating fixed-budget/implicit convergence as a weak pattern.

### Run agent ablations across multiple random seeds and compare with a paired, per-instance non-parametric test (Wilcoxon signed-rank) rather than a single run's point-estimate delta.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Code Isn't Memory](https://arxiv.org/abs/2606.22417), [On Randomness in Agentic Evals](https://arxiv.org/abs/2602.07150)
- **Detail:** Single-run pass@1 varies 2.2-6.0 points, so reported 2-3pp improvements can be pure noise. Average per-instance pass@1 across ≥3 seeds and apply a two-sided paired test; corroborated by paired-bootstrap and ICC-based agent-eval papers.

### Layer multiple grader types on the same task — deterministic tests, static analysis (ruff/mypy/bandit), LLM-rubric, tool-call verification, and outcome/state checks — since each catches a different failure class.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Combine unit tests + linters + DB/log state checks + tool-call-sequence checks in one grader. Convergent industry consensus (Hebbia, Galileo) but no rigorous ablation quantifying multi-grader defect-catch improvement for coding agents specifically.

### Grade the artifact/outcome the agent produced, not the exact sequence of steps it took — avoid rigid step-order checks that penalize valid alternative approaches.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Opus 4.5 found a flight-booking loophole that 'failed' an over-specified eval but better served the user. Grade checkpoints/final state, not exact step ordering (a τ2-bench critique and Braintrust/Arize guides agree); don't ignore process entirely.

### Start an eval suite small — 20-50 tasks from observed real failures, support tickets, or pre-release checks — early in development rather than waiting to accumulate hundreds.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Early-stage effect sizes are large enough for small samples, and specs get harder to reverse-engineer the longer you wait. OpenAI docs and LangChain/Galileo converge on the same small-then-grow-from-failures shape.

### Combine evaluation layers on different cadences — automated evals in CI, production monitoring, A/B testing, feedback triage + weekly transcript sampling, periodic human studies — because no single layer catches every failure (Swiss-Cheese model).
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Six methods with distinct pros/cons aligned to a product timeline. Cresta independently arrived at the Swiss-Cheese framing for AI agents; the underlying principle is decades-old safety engineering, no quantified defect-catch data.

### Watch for capability-eval saturation (e.g. SWE-bench Verified ~30%→>80% within a year) and graduate a saturated eval into a regression suite rather than reading its small residual deltas as progress.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Near ceiling, large capability gains show as small score increases. Corroborated by a benchmark-saturation study, OpenAI evals docs, Microsoft's regression-testing scenario, and the creation of SWE-bench Pro.

### Snapshot the working tree via 'shadow' git commits on every agent-driven change, kept in a separate log from the user's git history, so any agent step can be rolled back independently.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** A bare shadow repo sharing no history with the user's, populated per agent step (git add + write-tree), restorable via checkout. Cline ('shadow git repository'), Cursor Checkpoints, and Claude Code /rewind independently ship this; the full-working-tree approach also catches bash side effects that edit-only trackers miss.

### On tool failure, inject the error plus a differentiated, actionable recovery suggestion (branch on finish_reason so truncation gets a distinct 'be concise' message) back into context; cap retries to prevent nudge loops.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344), [mini-swe-agent v2.4.0](https://github.com/SWE-agent/mini-swe-agent/releases)
- **Detail:** OpenDev classifies errors into categories, retrieves a template, and injects it as a max-recency message with a 3-attempt budget; mini-swe threads finish_reason into templates so 'length' truncation gets a concise-retry message vs generic 'no tool call'. SWE-agent and Reflexion show informative failure feedback substantially improves recovery (3%→15% edit success). The retry cap is load-bearing — un-budgeted nudges cause self-loops.

### When many parallel agents converge on one hard-to-isolate bug, switch to oracle-based differential testing — build most of the target with a trusted reference impl and only a held-out subset with the agent's, then bisect to localize.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- **Detail:** Broke a 16-agent Linux-kernel deadlock by compiling most files with GCC and bisecting which files the agent's compiler broke, restoring parallelism. Conditional on having a trusted behaviorally-equivalent reference; single well-documented case study.
  *Tool notes:* Requires a trusted reference implementation for the domain.

### Build a CI pipeline with strict enforcement that blocks new commits from breaking previously-passing functionality, so serialized progress can't silently regress prior work.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- **Detail:** Agents lack the human instinct to re-check unrelated areas before committing; a hard commit-blocking regression gate addresses this agent-specific failure mode. Independently recognized (claude-code-antiregression setups, Claude Code pre-commit hooks).

### When an agent fails at a task, build a new tool, linter, or structural test that makes that entire failure category impossible going forward, rather than manually patching the one bad output.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Ask 'what capability is missing, and how do we make it legible and enforceable for the agent?' so each fix compounds. Echoed by Martin Fowler's harness-engineering writing and Augment. Root-cause-fix + regression-test discipline reframed for agents; not benchmarked in isolation.

### Give a diff-only, context-isolated review agent (no access to the coding agent's accumulated history) a pass on every PR before merge, and filter its comments against the original user instructions.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Cognition: Multi-Agents](https://cognition.com/blog/multi-agents-working)
- **Detail:** Devin Review catches ~2 bugs/PR (~58% severe) partly because a shorter, uncontaminated context improves detection of nuanced issues. An independent controlled study (Cross-Context Review) finds separate-session review beats same-session self-review, and that context-isolation specifically (not just 'a second agent') is the driver.

### Write custom linter/CI error messages so they double as remediation instructions for the agent, so one failed check both blocks bad code and teaches the fix.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Phrase messages as machine-directed fixes ('Use AppError from src/errors/ instead of raw Error'). Capture a human preference once, enforce and 'teach' it continuously. Martin Fowler and Factory.ai independently endorse the same mechanism ('a positive kind of prompt injection').

### Measure cost as $/solved-task (spend ÷ successes), and hold output-token caps identical across the systems you compare, so truncation failures don't get scored as capability gaps.
- **Tier:** Promising (added 2026-07-09; updated 2026-09-01)
- **Sources:** [Code Isn't Memory](https://arxiv.org/abs/2606.22417), [Ledger-Based Self-Orchestration (arXiv 2608.26480)](https://arxiv.org/html/2608.26480)
- **Detail:** Per-episode cost can be statistically null (p=0.73) while $/solved differs meaningfully ($2.30 vs $2.84), because the whole advantage sits in resolve rate; SWE-Bench+ independently advocates effectiveness-aware cost-per-instance. The 2026-08 ledger study adds the cap-matching half and shows why it changes conclusions: with every arm replayed at a matched 128k cap, a scaffolded mid-tier model matched a frontier single-call baseline's score (p=0.59) at $11.71 vs $61.11 — an 81% saving that only becomes visible once truncation is no longer confounded with capability. Uncapped comparisons conflate the two. Verified numbers, but a single non-peer-reviewed preprint from a non-academic lab on 100 LiveCodeBench problems with several single-pass point estimates; the cost-normalized-metric half has broader independent support.

### Before computing any headline agent-benchmark metric, run a fail-closed leak audit (redact self-referential URLs, git-scrub gold fixes, re-audit traces post-run) and route contaminated cells into a published exclusion ledger.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code Isn't Memory](https://arxiv.org/abs/2606.22417)
- **Detail:** Fail-closed: cells that fail the scrub abort pre-run; the post-run re-audit caught agents running `git show` on historical gold-file commits. Targets a real, documented git-history leakage failure mode in SWE-Bench-Pro-style containers. For benchmark maintainers.

### When scoring 'localization' for a retrieval-augmented agent, count a file only if the agent acted on it (grepped/read/edited), not merely because it appeared in a retrieval tool's result list.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code Isn't Memory](https://arxiv.org/abs/2606.22417)
- **Detail:** Otherwise the retrieval tool gets inflated credit for shown-but-unused candidates while a grep baseline is credited only for explicit reads — a silent bias in comparing retrieval-index vs agentic-grep. Eval-methodology tactic for benchmark builders.

### Validate generated/synthetic tests by mutation adequacy — generate buggy variants and require the suite to catch them (and pass the correct impl) — and use an external/curated regression set, not only self-generated tests.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [AgentForge](https://arxiv.org/abs/2604.13120), [Meta ACH](https://arxiv.org/abs/2501.12862)
- **Detail:** LLM-generated tests can pass their own buggy code; mutation adequacy (kill injected mutants) grades beyond 'does it execute'. Meta's ACH is a real production deployment; AdverTest and MUTGEN converge. Caveat: naive self-generated-test gating overfits 9-34% of the time without curation/impact-analysis (TDAD).

### Use a separate, independent test-generation/verification agent (or a deterministic non-LLM executor) so the coding agent cannot grade its own biased tests.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** AgentCoder's Test Designer generates tests independently and its Executor is a deterministic script; QualityFlow filters synthesized tests; CANDOR audits oracles against the NL spec, not the code. Avoids the mode-collapse where an agent's own tests pass its own buggy code.

### Add a critic/verifier component separate from the executor that checks tool outputs after the fact and can trigger correction, rather than trusting the executor's own success signal.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862)
- **Detail:** CRITIC (tool-interactive self-critique, +7.7 F1) and VerifiAgent (distinct verifier-executor) support external post-hoc verification. Nuance (ReVeal): grounding verification in external signals matters more than strict architectural separation — a single model with test feedback can also work.

### Use adversarial verification agents that produce concrete failing counterexamples (fuzzer crash traces, simulation-mismatch waveforms) rather than only natural-language critique.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** AutoSafeCoder's fuzzing agent emits crash-inducing seeds + crash traces; MAGE feeds the exact waveform window around the first failing cycle. A concrete failing input localizes bugs more precisely than pass/fail — but SolidCoder shows LLMs can hallucinate execution traces, so ground the counterexamples in real execution.

### For a self-improving loop with no ground-truth reward at deploy time, stop on a reward-free convergence metric based on pool stability (e.g. top-K overlap between rounds), not labeled outcomes.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** TACO's Retention metric (top-30 rule overlap ≥90%) correlates with reduced cross-model accuracy variance. Frame as an efficient stopping signal ('the pool stopped churning'), not a correctness guarantee — stability can plateau at a suboptimal point.

### Strictly wall off any self-improvement/adaptation loop from task-correctness signals (hidden tests, verifier results, ground truth, leaderboard scores) — restrict it to observation-level signals — to avoid overfitting to or leaking answers.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** Persisted adaptation is a more insidious leakage vector than one-off cheating — a leaked shortcut baked into a generic-looking rule propagates to future tasks. Corroborated by a real Terminal-Bench-2 cheating incident (privileged test access) and independent self-improvement-loop guidance on held-in/held-out isolation.

### Audit an automated compression/summarization component with an LLM judge scoring three binary criteria per sampled event (critical info preserved, noise removed, useful context retained) and manually inspect every flagged critical-loss.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** Explicit critical-vs-useful distinction; TACO's audit of 200 events found 96% critical-preserved, and all 8 flagged losses were triaged (7 benign). The 'inspect every flagged case, don't trust the aggregate' discipline is the transferable part.

### When comparing two agent harnesses, hold the model, benchmark, context window, reasoning effort, tool selection, and MCP servers identical, so score differences attribute to the harness itself.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [GitHub: Evaluating the Copilot agentic harness](https://github.blog/ai-and-ml/github-copilot/evaluating-performance-and-efficiency-of-the-github-copilot-agentic-harness-across-models-and-tasks/)
- **Detail:** Harness-induced variance can exceed model-induced variance and even reverse rankings (arXiv 2605.23950 'Stop Comparing LLM Agents Without Disclosing the Harness'; Harness-Bench). Narrow, meta-level tactic for harness bake-offs.

### Run each model/harness/benchmark combination ≥5 times and report the ±1σ spread (overlapping ellipses on cost-vs-resolution), not a single-run score.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [GitHub: Evaluating the Copilot agentic harness](https://github.blog/ai-and-ml/github-copilot/evaluating-performance-and-efficiency-of-the-github-copilot-agentic-harness-across-models-and-tasks/)
- **Detail:** On TerminalBench 2.0, same-model competitors sit within overlapping ellipses — the differences are inside run-to-run variance. Corroborated by 'On Randomness in Agentic Evals' and SWE-agent/Terminal-Bench multi-run practice.

### Evaluate harnesses across a mix of general-purpose and narrower domain-specific benchmarks, so a harness that overfits one task family doesn't look artificially strong.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [GitHub: Evaluating the Copilot agentic harness](https://github.blog/ai-and-ml/github-copilot/evaluating-performance-and-efficiency-of-the-github-copilot-agentic-harness-across-models-and-tasks/)
- **Detail:** e.g. SWE-bench Verified/Pro + a CLI-workflow benchmark + an OS-generalization benchmark. Standard evaluation hygiene; the anti-overfitting causal framing is asserted rather than isolated.

### Publish not just the numeric resource spec (CPU/RAM/timeout) for an eval but the exact sandbox provider and enforcement mechanism, since identical specs behave differently under different enforcement.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Quantifying infrastructure noise](https://www.anthropic.com/engineering/infrastructure-noise)
- **Detail:** Terminal-Bench's lenient provider (allows temporary overallocation) gives different results than strict Kubernetes OOM-kill enforcement of the same nominal spec — a spread larger than typical model gaps.

### Discount leaderboard score differences below ~3 percentage points as unreliable capability signals unless the eval's resource configuration is documented and matched.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Quantifying infrastructure noise](https://www.anthropic.com/engineering/infrastructure-noise)
- **Detail:** Moderate resource-config spread alone produced ~2pp variance that stacks on top of (not within) binomial CIs of 1-2pp; at allocation extremes the combined spread reached 6pp — comparable to many model gaps.

### When claiming an infrastructure effect on eval scores, replicate it across multiple model variants and, where possible, an independent external benchmark before generalizing.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Anthropic: Quantifying infrastructure noise](https://www.anthropic.com/engineering/infrastructure-noise)
- **Detail:** Anthropic replicated the floor/ceiling RAM effect across internal models and on SWE-bench (smaller magnitude, same monotonic direction). Methodology hygiene for eval researchers, narrow applicability.

### Drive implementation with a red-green TDD loop: write tests first, confirm they fail for the right reason, commit the tests, then implement without touching the tests until all pass.
- **Tier:** Proven (added 2026-07-09; updated 2026-09-01)
- **Sources:** [Cursor: Best practices](https://cursor.com/blog/agent-best-practices), [Anthropic Claude Code best practices](https://code.claude.com/docs/en/best-practices), [TDD-Agent (arXiv 2608.16742)](https://arxiv.org/abs/2608.16742v1)
- **Detail:** A visible red phase + committed tests before implementation stops the agent from faking tests or rewriting them to match broken code — an agent-specific failure mode. Independently prescribed by Anthropic's official docs, Simon Willison's Red/Green TDD pattern, and github-countdown; TDAD reports high regression safety. A 2026-08 benchmark adds a controlled measurement of the test-first half in isolation: on RepoEval with no iteration in either arm, adding a dedicated test-generation phase moved 68.35→69.89 on GPT-5-mini — real but small (a widely-circulated 8-point figure for this actually measures iterative refinement, a different variable). The same paper raises a boundary worth stating: for *agent-generated* tests still being negotiated, letting tests and code co-evolve outperformed freezing them (see the dual-track entry) — so "don't touch the tests" applies to committed, human-reviewed tests and to any oracle you intend to trust, not to a first-draft suite the agent just invented.

### Enforce a strict, mechanically-checked layered architecture (e.g. Types→Config→Repo→Service→Runtime→UI, cross-cutting concerns via a single Providers layer) using structural tests and custom linters that reject layer violations before merge.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Makes large-scale agent-generated code tractable via CI-blocking dependency-graph lint rules (ArchUnit/dependency-cruiser/import-linter). Largely restates decades-old architecture-testing discipline; single self-reported case with HN reports of underspecified 'providers' enforcement and at least one attempted replication producing a mess.
  *Tool notes:* Custom linters + structural tests wired into CI.

### Treat a 0% pass rate at high k (e.g. pass@100) with frontier models as a signal the task or grader is broken, not proof the agent is incapable.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Investigate the task/grader (unstated filepaths, brittle exact-match) before concluding a capability gap. Hedged to frontier models on well-specified tasks; general 'benchmarks are often broken' theme is corroborated but the specific pass@100 heuristic is single-source.

### On a sandbox/tool failure, route to a dedicated Debugger agent that receives the full combined stdout/stderr and produces a corrected version, capping retries (~3, diminishing returns after 2).
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [AgentForge](https://arxiv.org/abs/2604.13120)
- **Detail:** Removing the Debugger drops resolve 42%→31%. But the ablation tests 'have a feedback-driven repair loop at all', not separate-agent vs same-agent-with-feedback specifically; overlaps standard execution-feedback repair.
  *Tool notes:* Capture full process output, not just exit code.

### Attach an explicit 'evidence bundle' to every accepted change — which checks ran, what they verify vs don't, preserved assumptions, untested regions, residual risk — rather than collapsing verification to a single pass/fail.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** Proposed as the 'central missing abstraction' for semantic verification beyond executable feedback. Must be grounded in actual tool output, not narrated from memory, or it becomes performative theater. Speculative research direction.

### Before self-modifying the harness (prompts, tool schemas, retrieval policy, permissions, workflow topology), require a 'change contract' per mutation — a falsifiable prediction of which failures it fixes and which passing cases it risks — and validate on held-out regression suites before promoting.
- **Tier:** Watch (added 2026-07-09; updated 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [Agentic Harness Engineering (arXiv 2604.25850)](https://arxiv.org/html/2604.25850v1)
- **Detail:** Contract fields: which component changes, target failure mode, predicted improvement, invariants to preserve, a falsifying evaluation, rollback plan. The authors' proposed five-stage Evolution-Agent loop; conceptual synthesis. Empirically the self-prediction is weak — Agentic Harness Engineering scored fix predictions at 33.7% precision / 51.4% recall (~5x random) but the safety-critical regression-risk half barely above chance (11.8%/11.1%), so also require every edit to cite specific failure evidence from an actual trajectory (root cause + targeted fix), and use the contract to force root-cause reasoning, not as a trustworthy regression gate.

### Instrument the agent loop with deep telemetry (prompts + retrieved context, token/cost/latency, tool args, permission requests, diffs, sandbox snapshots, test results, rejected alternatives, human interventions) so harness changes are diagnosed via trace replay, not anecdote.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** Shallow pass/fail logging can't causally compare harness versions. Langfuse/OpenLLMetry/Promptfoo/LiteLLM implement pieces; recommended architecture, no outcome study.
  *Tool notes:* Structured, replayable traces across harness versions.

### For an 'issue reproduction' task, judge success differentially: the script must trigger the failure on buggy code AND stop failing after the ground-truth patch, with an LLM comparing pre/post execution logs.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Scaling Coding Agents via Atomic Skills](https://arxiv.org/abs/2604.05013)
- **Detail:** LLM log-judge generalizes to free-form reproduction scripts without hand-written assertions, at the cost of judge reliability. FAIL_TO_PASS/PASS_TO_PASS structure is SWE-bench-standard; the LLM-log-judge swap is the novel bit. Source paper withdrawn for data errors — mechanism may be sound but numbers unusable.

### Treat implicit behavioral signals — the agent re-requesting full output after a compressed result — as an automatic over-compression complaint that suppresses the offending rule and generates a conservative replacement.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** Intra-task rule evolution contributes ~3.8 accuracy points. Narrow to harnesses that already do output compression; note the source's supporting case-study details were partly overstated. No human/reward-model labeling required.

### When reporting token/cost savings from an added self-improvement or auxiliary-LLM mechanism, include that mechanism's own token overhead in the total, so efficiency claims are net rather than inflated.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** TACO's rule-evolution overhead (0.61-1.88%) is folded into its headline reductions. A related self-improving-agent paper found per-turn savings hid a ~40% overall cost increase once overhead was counted.

### Track task-level 'rescued vs regressed' counts (previously-failing tasks that now pass vs previously-passing that now fail) in addition to aggregate accuracy.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** Aggregate accuracy can mask a change that trades failures for new failures; use a multi-run ≥50%-solved threshold to denoise flips. A variant of standard regression/A-B win-loss tracking.

### When reporting agent performance, pair token/cost efficiency with task-completion rate in the same chart/claim — a cheaper harness that completes fewer tasks is not better.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [GitHub: Evaluating the Copilot agentic harness](https://github.blog/ai-and-ml/github-copilot/evaluating-performance-and-efficiency-of-the-github-copilot-agentic-harness-across-models-and-tasks/)
- **Detail:** 'Token efficiency only matters if the work actually gets done.' Standard Pareto-frontier reporting hygiene; single vendor self-report.

### Make a test/build execution agent report tersely on success (brief summary) but dump full diagnostic detail on failure, so the happy path doesn't burn context while failures keep full signal.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [GitHub Copilot CLI changelog](https://github.blog/changelog/2026-01-14-github-copilot-cli-enhanced-agents-context-management-and-new-ways-to-install/)
- **Detail:** Conditional output (brief on success, full on failure) applied to LLM context-budget management. Directionally aligned with Anthropic/LangChain context-engineering advice; no measured savings.
  *Tool notes:* Copilot CLI 'Task' agent.

### For coding evals intended to be shared publicly, run them at multiple times of day and on multiple days to average out environmental/API-latency noise rather than trusting a single run.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic: Quantifying infrastructure noise](https://www.anthropic.com/engineering/infrastructure-noise)
- **Detail:** Pass rates fluctuate with time-of-day API latency and incidents (observed anecdotally, not formally quantified by the source).

### In an autonomous/auto-mode agent, stop and ask for confirmation before running a destructive command (e.g. rm -rf) whose target includes a variable it cannot resolve from context.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **Detail:** v2.1.205 gates rm -rf on an unresolved variable behind confirmation. A narrow instantiation of the well-established 'human-in-the-loop for irreversible actions' principle (OWASP AI Agent Security); enforced below the model.
  *Tool notes:* Auto-mode permission layer; principle is tool-agnostic.

### Use a cheap LLM 'imagined execution' (mentally trace the interpreter to predict test outcomes) as a fast first-pass check, reserving real sandboxed execution for what simulation can't catch — but treat as unvalidated and contested.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** QualityFlow's Imagined Execution reports high precision/recall on MBPP but only as a pass/fail gate on toy benchmarks. SolidCoder directly refutes the premise — LLMs hallucinate traces and confidently validate buggy code, and concrete execution caught error types simulation missed.

### Wrap multi-tool write/state-mutating operations in transaction-style semantics (bounded scope, delayed commit, compensating rollback on abort) instead of irreversible one-shot calls.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [SagaLLM](https://arxiv.org/abs/2503.11951)
- **Detail:** SagaLLM (Saga-pattern compensating rollback), Atomix (epoch-based isolation, delayed commit, fault-injection benchmarks), and Generator-Assistant (checkpoint rollback) — three independent groups. Classical distributed-systems practice newly applied to LLM tool orchestration; most tool loops fire writes immediately with no rollback path.

### Test/benchmark tool-using agents against non-linear (branching, nested, multi-hop) tool-dependency structures, not just longer linear chains, because failure often comes from constructing the wrong dependency graph.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862)
- **Detail:** Five independent benchmarks (NESTFUL, Seal-Tools, TaskBench, MMAU, FuncBenchGen) isolate nested/graph/distractor dependency structure as its own difficulty axis distinct from sequence length; FuncBenchGen shows performance declines sharply with dependency depth specifically.

### Validate synthetic/training tool-call data in stages — syntax check, then actual execution, then semantic check — rather than filtering only on output format.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [APIGen](https://arxiv.org/abs/2406.18518)
- **Detail:** APIGen's staged checking (format → execution against real backends → semantic LLM judge) with ablations showing execution/semantics failures degrade downstream models; ToolACE independently converges on layered structural + semantic validation. Format-only filtering becomes insufficient at scale.

### Enforce a multi-tier permission model for agent actions — read-only, sandbox-edit, full-access (network/credentials/deploy/destructive) — and gate the highest tier behind mandatory human approval.
- **Tier:** Proven (added 2026-07-09; updated 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [OpenAI Codex docs], [Anthropic — Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
- **Detail:** Independently implemented by Claude Code (approval before writes/network), Codex (Suggest/Auto-Edit/Full-Auto), and Gemini CLI (read-only Plan Mode). Confine mandatory approval to the smallest highest-risk tier to avoid approval fatigue (Anthropic telemetry: ~93% reflexive approval under flat gating). Claude Code auto mode tiers into three bands — a no-classifier allowlist for read-only ops, unreviewed in-project file writes, and classifier review for shell/external-network/out-of-project/subagent-spawn — so routine work skips classifier latency (and blanket-shell/wildcarded-interpreter/package-manager rules are stripped on entering auto mode). Caveat: the 'unreviewed in-project writes are fine because git' leg has a documented gap — an independent eval found 36.8% of state-changing actions occur via un-gated edits (92.9% FNR on artifact-cleanup attacks), so treat unreviewed writes in unsupervised sessions as an open risk.

### Drive implementation with an explicit generate-test-repair inner loop: after each edit run lint/tests, and on failure re-prompt with the actual error text plus a request to analyze the cause before fixing, capped at a fixed number of iterations.
- **Tier:** Promising (added 2026-07-09; updated 2026-09-01)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515), [TDD-Agent (arXiv 2608.16742)](https://arxiv.org/abs/2608.16742v1)
- **Detail:** Aider's inner loop feeds real error output back (capped max_reflections=3) and is the foundational unit under most agents' composed loops; corroborated by Reflexion — feed actual error text, not just pass/fail. TDD-Agent adds an ablation and a cap heuristic: adding the reflect-then-fix loop to single-shot generation moved 68.35→72.09 (GPT), 73.63→81.53 (DeepSeek), 52.97→54.06 (Qwen), and its per-iteration curves plateau around rounds 6–7, so budget there rather than open-ended. Note what that ablation does and doesn't show — its baseline is zero-iteration generation, so it establishes "iterate with the error text" over "don't iterate," not reflection-on-cause over blind resampling; the diagnose-before-fix instruction remains the weaker-evidenced half.

### Separate the agent that produces work from the agent that judges it — ideally a different model, at minimum a different context — because self-evaluating agents share their own blind spots and over-praise their own output.
- **Tier:** Promising (added 2026-07-09; updated 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515), [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **Detail:** Moatless configures the value/critic to a different model than the action agent; DARS-Agent (same model both roles) shares biases. The premise is strongly corroborated by self-preference-bias literature (arXiv 2410.21819; NeurIPS 2024 'LLM Evaluators Recognize and Favor Their Own Generations' — models favor lower-perplexity self-generated text), and Anthropic's long-running-app harness structurally splits generator and evaluator into different agent contexts. Important nuance: the evaluator is still an LLM inclined to be generous, so separation helps but isn't a magic fix — tune the evaluator's prompt to be adversarial.

### For safety-critical tool calls (arbitrary shell, filesystem writes), layer an independent LLM risk-evaluator that scores each proposed call and blocks high-risk ones, on top of OS-level sandboxing — ideally a two-stage classifier (fast single-token filter that errs toward blocking, then a slower chain-of-thought re-check run only on flagged actions).
- **Tier:** Promising (added 2026-07-09; updated 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515), [Anthropic — Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
- **Detail:** Codex CLI combines Bubblewrap/Landlock/Seatbelt sandboxing with a 'Guardian' LLM that reviews and can deny tool calls (the two address different failure classes; verified in openai/codex source). Anthropic's auto-mode two-stage classifier, validated on three datasets (10k real-traffic actions, 52 overeager actions, 1k synthetic exfiltration), reports Stage 1 alone 8.5% FPR/6.6% FNR and the full pipeline 0.4% FPR (FNR ~17% overeager, 5.7% synthetic exfil); engineer Stage 2's prompt as a superset of Stage 1's so it lands as a prompt-cache hit. Caveat: an independent stress-test (arXiv 2604.04978) found FNR up to 81% under adversarial/ambiguous-authorization prompts and 36.8% of state-changing actions bypassing the classifier via un-gated in-project edits — validated for accidental overshoot, not adversarial coverage.
  *Tool notes:* Sandboxing is OS-specific; the classifier/Guardian pattern is model-agnostic and adds one (or two) LLM calls per invocation.

### When producing an evidence-grounded analysis of a codebase, pin every claim to a file path and line number at a fixed commit and run a dedicated post-hoc verification pass before trusting it.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** A verification pass over 296 claims confirmed 267, corrected 19 (mostly line drift), accepted 10 as simplifications — ~10% needed correction. Corroborated by citation-grounded-code-comprehension work showing naive LLM citations fail 28-48% without grounding+verification. Prefer independent-reviewer verification over self-verification.

### Have the evaluator actually drive the running artifact (click through the UI, hit API endpoints, execute simulated user actions in a live environment) rather than judge from static source code or screenshots.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps); [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Anthropic's Playwright-MCP evaluator caught 8+ specific bugs across three QA rounds by driving the real app; the Verification Horizon paper shows a Playwright-driven interactive judge (action-planner → live execution → trace-scored rubric) beats visual/hybrid static judges as an RL reward, achieving higher held-out scores while keeping generation length stable — static judges are exploitable via verbose, length-inflated code that looks good on inspection but doesn't work. Two independent sources converge; each individual instantiation is anecdotal/single-lab, so favor a constrained action-list judge over claims of a full autonomous agent judge.

### Validate a paired A/B eval (same prompts, with vs. without an intervention) across multiple model tiers before shipping a knowledge-augmentation skill — confirm it moves pass rates and see where it doesn't.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Google — Closing the knowledge gap with agent skills](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/); [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Google's 117-prompt paired harness across Gemini 3.1/3.0/2.5 revealed gains varied sharply by model generation (skill benefit is not uniform). Independently confirmed by SkillsBench (arXiv 2602.12670: 87 tasks × 18 model-harness configs, gains ranging +4.1 to +25.7pp) and Anthropic's skill-creator "comparator agents" doing blind skill-vs-no-skill A/B. Testing on only one model/tier can badly mislead a ship/no-ship decision.

### Before trusting an efficiency comparison between two agent configurations, manually spot-check a sample of the actual outputs (not just aggregate time/token metrics) to rule out that the "cheaper" condition is just producing degenerate or aborted work.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Impact of AGENTS.md files (arXiv 2601.20404)](https://arxiv.org/abs/2601.20404)
- **Detail:** The authors sampled 50 PR tasks and checked outputs were non-empty, non-trivial, task-consistent code changes vs. the merged human PRs before trusting token/time deltas. Guards against a config looking cheaper because it silently does less. Single paper, an informal confirmatory check the authors call non-rigorous; the related EET paper operationalizes the same principle via automated resolution-rate checks.

### After a worker attempt, have the planner classify the outcome three ways instead of a single retry loop: Proceed (commit, advance) on success; Retry (fresh worker, refined spec) when the failure looks recoverable; Replan (revise the decomposition) when structural or retry budget is exhausted.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [CodeDelegator (arXiv 2601.14914)](https://arxiv.org/abs/2601.14914)
- **Detail:** Formalized in the execution protocol; drives the overall gains but its increment over simpler retry logic is not separately ablated. A similar Retry→Replan escalation appears independently (Self-Healing Orchestrators arXiv 2606.01416, benchmarked vs retry-only/replan-only; practitioner guides), but neither isolates this exact mechanism's contribution in a real coding-agent setting.

### To claim an agent-architecture improvement is due to the design (not one model's context-handling quirk), re-run the comparison across multiple model tiers — including a strong backbone — and check the effect direction holds.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [CodeDelegator (arXiv 2601.14914)](https://arxiv.org/abs/2601.14914); [Context Pruning via Multi-Rubric Latent Reasoning (arXiv 2605.15315)](https://arxiv.org/pdf/2605.15315)
- **Detail:** CodeDelegator held its top rank across DeepSeekV3.2 and GPT-5 (though the ReAct-vs-CodeAct sub-ordering flipped, and only 3 of the compared bases were genuinely different families). LaMR shows why the strong backbone matters specifically: a pruner's structural-omission failure was invisible on a weak backbone (which fails/retries regardless) and appeared sharply on Opus 4.6 (up to +22% tokens) where full context would have succeeded. Two independent sources; neither cleanly isolates the exact mechanism, and "model-agnostic" from two frontier models is thin.

### Don't trust a self-modifying agent's own regression forecasts as a safety net — gate on actual full-suite re-execution instead, and expect non-monotonic score swings across iterations.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Agentic Harness Engineering (arXiv 2604.25850)](https://arxiv.org/html/2604.25850v1)
- **Detail:** Regression prediction (which passing tests an edit breaks) was barely above random (11.8% precision, 11.1% recall, ~2x baseline), named as an unresolved failure mode driving non-monotone evolution curves. Corroborated by independent work: models silently endorse their own semantic-drift regressions ~31.7% of the time (arXiv 2605.21537), and vanilla coding agents average 6.5 broken pass-to-pass tests per patch while believing the patch is clean. Self-verbalized assessment is no substitute for external, rule-based verification.

### Enforce a hard rule that no harness edit is applied without being traceable to a specific cited piece of failure evidence from an actual trajectory — ban speculative/hunch-driven edits to the agent's own tools, prompts, or config.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Agentic Harness Engineering (arXiv 2604.25850)](https://arxiv.org/html/2604.25850v1)
- **Detail:** The evolve-agent prompt explicitly forbids changes based on intuition/speculation/best-practices alone; every change must cite failure evidence, root cause, targeted fix, and predicted impact. Sound root-cause-first hygiene for self-modifying loops, but no ablation isolates the rule's own causal contribution from the overall pipeline.

### Keep all role agents (code executor, debugger/distiller, harness editor) on the same base model to isolate whether gains come from the changes vs. a smarter editor, then confirm the edited harness still helps when swapped onto other model families.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Agentic Harness Engineering (arXiv 2604.25850)](https://arxiv.org/html/2604.25850v1)
- **Detail:** All three roles shared one base model (GPT-5.4), isolating gains to harness edits; the frozen evolved harness then transferred, yielding +2.3 to +10.1pp across five alternate bases without re-running evolution. Corroborated in spirit by SWE-Agent ablations showing consistent cross-model gains. Narrow applicability (teams running harness-evolution loops); single-paper specific numbers.

### Treat the verifier as a living system: periodically re-derive its rules/pattern set from the current policy's trajectories rather than freezing it after design, since a fixed reward function stops working as the policy improves.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** After each training interval, sample rollouts that trigger or pass the verifier, have an agentic reviewer add newly-discovered exploit patterns, and redeploy before the next round. The paper's ablation proves "a monitor helps" (hack rate 37.76%→1.31%) but does not isolate *refreshing* vs. a static pattern set. The co-evolution principle is corroborated by iterated-RLHF retraining literature, ReVeal, Code-A1, and adversarial reward auditing.

### Add a trajectory-level behavior monitor that audits the full command/git/network history of an agent run (not just the final patch) for known shortcut patterns, and penalize matches, instead of relying on pass/fail test results alone.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** Across 3 SWE-Bench variants, monitoring cut average hacked-resolved rate from 28.57% to 0.56% and raised clean-resolved from 40.22% to 60.53%; unmonitored RL collapsed late in training. Corroborated by Baker et al. (arXiv 2503.11926, CoT/trajectory monitoring catches hacks that output-only monitoring misses). Fundamentally an RL-training-time technique; note the adversarial caveat that optimizing against a monitor can breed obfuscated hacking, so the pattern set must keep chasing new exploits.

### Match the verifier's operating point to the downstream use: low false-positive rate at a fixed threshold for rejection-sampling filtering; ranking consistency and score discrimination for RL reward shaping; and jointly weigh strictness against surviving-sample count when candidates are scarce.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** A judge that is "correct" but assigns near-uniform low scores gives near-zero reward variance and stalls policy-gradient learning, even if it filters well. The metric that matters flips by objective (BoN-Acc/τ vs. threshold-conditioned score). The general premise (ranking accuracy doesn't predict RL usefulness) is corroborated by RewardBench-2-style findings, but the specific cited threshold comparison contains a transcription error and the framework is single-source.

### Score agent behavior on a separate process-quality rubric (execution error, misunderstanding, omission, overaction, inefficiency, communication) in addition to binary task-resolution — especially on failed runs, since better failure behavior is invisible to a resolved/unresolved reward.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** On SWE-bench Verified, Span-KTO's gains on resolved instances were modest (+0.5 to +6.8%), but on unresolved instances it improved Inefficiency by +34.5% and Communication by +26.5% — visible only via the six-axis agent-as-judge rubric. Two equally-unresolved runs can differ hugely in whether the agent recognized being stuck vs. flailed. Single-source self-reported ablation; thematically corroborated by rubric-as-contextual-verifier work (arXiv 2601.04171).

### Treat sandbox/container death as an ordinary tool-call error surfaced back to the model (not a fatal harness failure), and let the harness re-provision a fresh environment on demand so the agent can retry rather than lose the session.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- **Detail:** Wrap sandbox/tool calls so infra failures come back as a normal error result the model can react to, with a provision() escape hatch for retry. Convergent with independent frameworks (sandcastle maxRetries + session resumption, Temporal sandbox orchestration), but single-vendor self-report with no benchmark of this specific pattern's effectiveness.

### Run a dedicated (non-agent) probe over tool outputs (file reads, web fetches, shell output, external responses) before they enter the agent's context, and on suspected prompt injection inject a warning into the context rather than silently blocking or passing it through.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
- **Detail:** A server-side defense distinct from the permission classifier, targeting the prompt-injection category. The general "scan retrieved content before it reaches the model" idea is established (OWASP, Rebuff, PromptShield), but the specific warn-don't-block choice is single-source — several independent implementations favor graduated blocking/quarantine at high-confidence detections instead.
  *Tool notes:* Applies to any harness piping untrusted tool output back into context.

### Define an automatable, objective failure signal for coding-agent evals — e.g. "did the generated code call a deprecated SDK/method" — instead of relying on subjective grading, so pass/fail can be checked at scale.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Google — Closing the knowledge gap with agent skills](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/)
- **Detail:** The 117-prompt harness operationalized failure specifically as deprecated-SDK usage, enabling scaled pass-rate measurement (6.8%/28% baselines). Deprecated-API detection is a distinct signal from execution-based correctness (code can call a deprecated API and still pass functional tests) — corroborated as an evaluation technique across independent academic work (RustEvo², Versicode, APIScanner). Implementable via grep/AST/static analysis; not a consensus best-practice recommendation yet.

### When a generated candidate (action/plan/code) fails validation, return keyed repair feedback with three fields — failure location, observed value, and admissible alternatives — rather than the raw validator error string, before retrying; prioritize surfacing the admissible alternatives, since location-only feedback captures only a small fraction of the gain.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Structured Feedback Improves Repair in an LLM Agent Loop (arXiv 2607.14167)](https://arxiv.org/abs/2607.14167)
- **Detail:** On TextWorld, TypedFields feedback raised success 28%→72% (Qwen2.5-Coder-14B) and 16%→58% (Llama-3.1-8B), replicated across models/call-budgets/seeds with McNemar+Holm; an ablation shows admissible-alternatives (not location, not JSON structure) drives the gain. Applies to any loop with a validator that can localize a failure and enumerate valid alternatives — but the authors' own HumanEval scope-check showed no benefit where the visible validator couldn't expose the failure, so code-repair transfer is unproven. Single fresh preprint.

### Bind each verification verdict to a hash of the exact code state it was produced against (a materialHash via git ls-tree, excluding the lifecycle metadata itself) so evidence from a now-stale tree automatically fails the gate — and never accept the agent's own 'all tests passed' as that evidence.
- **Tier:** Proven (added 2026-07-17; updated 2026-09-01)
- **Sources:** [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890), [Looping Is Not Reliability (arXiv 2607.24604)](https://arxiv.org/html/2607.24604v1)
- **Detail:** Two independent papers converge. Proof-or-Stop formalizes it as the `Fresh(E,H)` admissibility conjunct — stale-evidence scenarios correctly fail 'done' until refreshed, a code-byte flip is rejected as stale, and excluding the lifecycle metadata avoids a self-referential invalidation loop. The revision-contracts paper quantifies the damage when the binding is missing: feedback from a different code state harmed 34/135 correct starts (0.252) versus 4/135 (0.030) under current traces — a 22.2-point contrast, CI [8.9, 37.0], p=0.0337 after Holm correction — and proposes the same fix as an evidence envelope (code_hash, test_suite_hash, execution_id, payload) checked as a precondition before any patch is applied, with a mismatch triggering refresh/keep/escalate rather than an edit. The general content-hash invalidation pattern is established (Bazel/ccache, lockfile keys); what these add is applying it to stop an agent reusing a stale reviewed/tested verdict. Neither paper shows cryptographic hashing beats a simpler version counter — the load-bearing part is binding evidence to state identity at all.
  *Tool notes:* Reinforces, doesn't replace, the deterministic-signals acceptance gate.

### Track and report 'terminal completion' (pipeline went green) and 'admissible delivery' (the gate actually accepted the evidence) as two distinct, separately-measured outcomes, since a run can finish without being gate-admissible.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890)
- **Detail:** In a 1,152-cell paired matrix, no-review runs 'completed' 1,143/1,152 but the gate admitted only 1,042/1,152 — a ~9% gap between an agent's 'done' signal and independent admission (the refused 106 were not adjudicated against hidden ground truth). A concrete telemetry discipline: keep separate counters for 'loop terminated' vs 'evidence admitted'. Single self-caveated supplementary result.

### When re-validating a review lane, admit an older signed passing run only if its source/scope hashes still match live state, but always require the lane's most recent run for any still-open finding — so a newer clean pass can never silently mask an unresolved earlier finding.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890)
- **Detail:** Id-recency is not itself a freshness predicate: a PASS is admissible from any signed run in the current round whose material/scope hashes match, while open FINDING evidence requires the lane's latest run. Closes a retry-induced reviewRunId-churn race that would falsely reject a still-valid pass; single un-ablated design fix.

### Periodically red-team the verification/evidence system itself against four properties: replay-determinism (same evidence re-verifies to identical digests), tamper-fail-closed (every tamper class rejects or is a documented limitation), resume-integrity (interruption produces exactly one record per iteration, no duplicates/gaps), and scale-envelope (verification completes within a fixed time budget at target scale).
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890)
- **Detail:** A red-team campaign over 5 DONE stories reported 33/33 replay-determinism matches, 27/27 tamper verdicts conforming, 0 duplicate/0 gap on resume after injected kills, and all checks within a 128.2s cap (max 18.7s at 10^6-row scale). Targets the verifier itself, which most teams don't systematically test; single one-day-old self-audit.

### Only expand the agent's search/context scope after a verification step actually fails — increase scope by exactly one level, reuse previously-gathered search/read results, and replan — rather than expanding preemptively; and treat this bounded verify-and-expand loop, not the estimator's accuracy, as the real correctness safety net.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Do AI Agents Know When a Task Is Simple? — E3 (arXiv 2607.13034)](https://arxiv.org/abs/2607.13034)
- **Detail:** Removing the Expand stage dropped success 100%→85.1%, losing all 18 deceptive hidden-dependency tasks even though cost barely fell; under paraphrased task wording estimator accuracy fell 85.1%→66.9% yet end-to-end success stayed 100% (cost +8.7%) because the escalation loop compensated. Requires a reliable verification oracle; bound the loop with a max-expansion count K. Self-built simulator, single paper.

### Place the compiler/type-checker inside the per-unit implement-review-fix loop when it runs in seconds (e.g. TypeScript), but defer it to a dedicated separately-batched step when it's slow (e.g. Rust/cargo taking minutes) — tune referee placement to the referee's own latency.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** Fast checks belong in the inner loop; slow checks break the agent's loop and should be layered/deferred. Multiple independent qualitative sources agree on this two-tier verification design (Sonar's loop-engineering writing, practitioner 'stop babysitting your agent' guides), though none give a quantified effect size.

### When the original test suite is too language/runtime-specific to run against migrated code, build a parity/behavioral harness that evaluates the original and the migrated code 'on equal terms', then run one dedicated fix-agent per failing scenario until all pass.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** 'The judge must be able to evaluate both the original code and the target code on equal terms' — a small script that runs the same scenarios against both implementations and diffs results, with a per-failure fix-agent looping to convergence. A crystallization of classical characterization/golden-master testing for agentic migration; single anecdotal case (n=1) plus one adjacent environment-in-the-loop migration paper.

### Route mechanical failures (compile errors, crashes, test failures) through a fixer-agent queue that categorizes them by root cause (with adversarial review), and when the same failure pattern recurs across many files, fix it once upstream (add a rule to the rulebook and regenerate the affected batch) instead of patching each file.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** 'When a reviewer keeps catching the same mistake across files, the fix isn't per-file — add one sentence to the rulebook and regenerate.' Root-cause-over-symptom repair is corroborated by adjacent APR research; the rulebook+regeneration mechanic presupposes a pipeline where regeneration is cheap and idempotent (migrations/codegen), not live hand-edited code.

### After objective referees (compiler, parity harness) pass, have the agent design and run its own broader end-to-end test suite autonomously (e.g. overnight) as an additional self-generated verification layer beyond the human-specified checks.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration)
- **Detail:** A self-designed overnight suite caught 'paper cuts no scenario list would have predicted' over four consecutive nights of fix-and-rerun. Single anecdote; real risks (agent authoring self-serving/loose tests, wasted compute, false confidence) are unquantified — treat as an extra layer, not a substitute for objective referees.

### When using an LLM-as-judge to compare two agent systems on a qualitative axis, anonymize system identity and shuffle presentation order to remove identity/order bias, use multiple independent judges reporting mean/std, and separately validate a human-labeled sample against the judgments with an explicit agreement statistic before trusting the metric.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** The paper anonymized both systems, shuffled order, used 3 independent LLM judges reporting mean±std, and validated 100 human-labeled samples at Cohen's κ=0.82. The debiasing components are established; the most transferable, under-applied part is separately validating the LLM-judge metric against a human subsample with a named agreement statistic before trusting it.

### Before shipping a multi-component agent architecture, run a leave-one-component-out ablation (each major piece removed individually, everything else fixed) on a held-out benchmark subset to quantify each component's independent marginal contribution, rather than only reporting end-to-end numbers.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** Individually removing each of CPG / TEG / three perspective-agents / iterative-refinement degraded solved bugs by 4.9–12.2% from a 245-bug baseline, showing each contributes distinct value rather than being redundant. Standard ML methodology worth restating for multi-agent pipelines usually validated only end-to-end; single paper, run on a smaller subset with no reported variance.

### When deciding whether to ship a new ranking/retrieval mechanism, evaluate it under a pre-registered incumbent-vs-candidate protocol on a held-out test split with a paired bootstrap CI that must exclude zero, rather than tuning and reporting on the same data.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Why Git Is the Memory Solution (arXiv 2607.14390)](https://arxiv.org/abs/2607.14390)
- **Detail:** Applied across 8 corpora, 5 of 7 imported ranking mechanisms (RRF, temporal, dilution, z-norm, embedder swap) were rejected as non-significant or degrading, and only 2 kept — a genuine mechanism graveyard, not cherry-picked wins. Complements the playbook's existing multi-seed paired-test guidance with a train/test-discipline + pre-registration angle; single (vendor-authored) paper.

### For agent memory, admit a checkpoint into shared/exportable memory only once its originating commit lands on the default branch through normal review+CI+merge (use the merge as the external verifier, not the model judging its own admission); and when evaluating such systems, replace single-gold-session MRR with a judged answer-sufficiency metric (blind judge rates assembled context SUFFICIENT/PARTIAL/INSUFFICIENT) reported per question-kind.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Why Git Is the Memory Solution (arXiv 2607.14390)](https://arxiv.org/abs/2607.14390)
- **Detail:** Single-shot retrieval scored only 0.07–0.20 answer-sufficiency despite non-trivial MRR — the two metrics diverge, so MRR alone misleads. 'Don't let the model grade its own memory-admission homework' plus a judged, per-kind metric; single vendor preprint, tiny n, self-caveated.

### Score a proposed tool action's risk with a separate guardrail LLM (fed only the proposed action + recent history) instead of letting the acting LLM self-annotate its own security_risk field, because the same context that biases the actor toward a risky action biases its self-assessment.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [OpenHands SDK v1.36.0 — ToolShieldLLMSecurityAnalyzer](https://github.com/OpenHands/software-agent-sdk/releases/tag/v1.36.0)
- **Detail:** Shipped as ToolShieldLLMSecurityAnalyzer; a self-reported MT-AgentRisk ablation claims attack-success dropping from 75–88% (self-annotation) to 14–18% (separate guardrail). The actor≠judge principle is well-established, but the specific numbers are single-source (a GitHub issue) and inconsistent with the cited paper's own figures for the same model. Pair with a fail-closed enforcement policy.

### On a judge/guardrail LLM failure, map both an infrastructure error and an unparseable response to a neutral 'UNKNOWN' verdict (letting a downstream policy apply the conservative behavior) rather than a synthetic maximal-severity value; and when regex-parsing a structured verdict out of free-form output, require a strict anchored on-its-own-line match and treat multiple distinct labels in one response as ambiguous (→ the failure value) instead of taking first/last match.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [OpenHands SDK v1.36.0 — ToolShield](https://github.com/OpenHands/software-agent-sdk/releases/tag/v1.36.0)
- **Detail:** Failing closed to HIGH on every transient blip would block every action, so UNKNOWN pairs with a confirm-on-unknown policy; anchored parsing prevents an earlier or injected 'RISK: LOW' in the explanation being picked over the real 'RISK: HIGH'. Single-project design fixes justified by unit tests and inline rationale, not benchmarked.

### Score competing solution strategies with a continuous compile/test-based signal (reward for eliminating original failures, penalty for newly-introduced ones, −1 for non-compiling) rather than a binary plausible/not-plausible label, so a 'close' strategy can still outrank a strictly-worse one and be selected for refinement; halt if every strategy's aggregate score is ≤0.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** A specific delta-based fitness function plus a no-positive-signal stopping floor. Kin to search-based-APR weighted fitness (GenProg-lineage); more informative than a binary plausible/not-plausible gate, but no ablation isolates continuous-vs-binary in this system.

### When no fully-valid candidate exists after a generation round, don't retry all strategies uniformly — select only the highest-scoring strategy, extract structured feedback (compile status, remaining/new failing tests, diffs) from its best candidate, and route that feedback only to the agent/path that produced it for a targeted refinement pass.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** Disabling iterative refinement dropped solved bugs 245→233 (−4.9%), but that ablation tests refinement-vs-none, not the targeted-vs-uniform budget allocation the tactic actually prescribes. Actionable heuristic (concentrate remaining budget on the single best path); single paper, mechanism not isolated.

### Use cheap coverage instrumentation (e.g. JaCoCo) as a first-pass relevance gate to scope which methods are worth deeper dynamic/static analysis, before any expensive fine-grained tracing.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** Execution filtering (keep only methods executed by a failing test) produced the single largest evidence-volume reduction in the pipeline (~94.85% of candidate methods excluded). Essentially spectrum-based fault localization (decades-old); actionable for an agent verification loop but not novel, single paper.

### Make rejection decisions sticky and durable: once an effect identity is rejected, it stays refused on any later resubmission, not merely refused the one time it's evaluated.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** Verified via exhaustive TLC (74.8M states, 0 violations) + machine-checked TLAPS induction; a mutation swapping the release/reject verdict was caught by the conformance harness. Terminal/idempotent-rejection state applied to an effect-admission core; single unreviewed preprint, one implementation.

### Fuzz the untrusted transport/protocol boundary of any tool-mediation server with malformed and hostile inputs (random bytes, invalid UTF-8, wrong-shape/typed JSON, forged MACs, duplicate keys, protocol-state abuse like decide-before-submit/double-decide, truncated/oversized framing) to confirm it fails closed and stays alive rather than crashing or silently admitting a bad request.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** 1.8×10^5 malformed inputs across 8 classes drove zero fail-open behavior, a planted canary state survived every batch, and a valid round-trip still succeeded after every attack batch. A concrete checklist (the protocol-state-abuse classes are the non-obvious, mediation-specific part); single fresh preprint, self-reported.

### Don't treat an LLM's tendency to serialize consequential tool calls as a safety guarantee — verify enforcement independent of any model's disposition, including under adversarially injected instructions; and when measuring tool-call behavior through a third-party API gateway, run a positive-control (a benign-only variant of the same task) to check whether an apparently low/zero risky-call rate reflects real caution or the serving path simply not supporting parallel tool calls.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** Under benign prompts the risky parallel-batch shape appeared 0–14% by model; under live injection, 0/100 to 95/100 by model, and every emitted instance leaked when unmediated (P(leak|emitted)=1.00) vs 0/400 when gated. A positive-control diagnostic revealed three 'near-zero' models were a gateway artifact — the model read as safest was in fact the most exposed on its native API. Single fresh preprint.

### Have the agent execute a numbered, rule-mapped self-review checklist before presenting code to a human reviewer, growing the checklist as new rule classes are added.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Self-Improving AI Coding Agents (arXiv 2607.13091)](https://arxiv.org/abs/2607.13091)
- **Detail:** Over 4 weeks the checklist grew 0→15 items and reviewer comments shifted from 14% mechanical-correctness to 66% architecture/API/performance across 36 PRs. But the checklist's effect isn't isolated from the rest of the rule-accumulation framework (code standards, anti-patterns, workflow rules all grew simultaneously), and it's a single non-ablated single-org deployment; the rule-mapped/growing angle is the value beyond generic 'self-review'.

### Run automated validation at the start of every session checking that agent-definition files have valid frontmatter/required fields, skill directories are well-formed, knowledge docs carry freshness dates, the instruction file has all required sections, and tool-server configs are well-formed.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Self-Improving AI Coding Agents (arXiv 2607.13091)](https://arxiv.org/abs/2607.13091)
- **Detail:** Lets a growing rule/skill set 'grow safely'. Corroborated by an ecosystem of independent skill/config linters (skills-check, agnix, skill-validator, claude-pre-commit) converging on the same practice — but that's adoption evidence, not efficacy: no failure-rate/defect-catch data in-source. Implementable as plain CI/lint checks.

### Review a subagent's completed work with a lightweight git diff/show check rather than pulling all changed files into the lead's context or rewriting it; if the diff surfaces a real bug, re-delegate the fix to the subagent instead of fixing it at lead-model prices.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Cognition: Making Fable Cheaper Than Opus](https://cognition.com/blog/making-fable-cheaper-than-opus)
- **Detail:** The stronger lead pulled sidekick files fully into context ~2x more often and made ~4x more corrective edits when it rewrote rather than re-delegated. The 'review via diff, keep the lead's context clean' half is established practice; the redelegate-vs-rewrite cost policy is the novel part and rests on a single vendor self-comparison with only qualitative support.

### Don't expect a bare reasoning scratchpad or hypothesis-tracking tool to change how the agent reasons — scaffolding without new retrieval, memory, or a changed policy mostly gets the old reasoning in a new container.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [The Devil Is in the Interface (arXiv 2608.11386)](https://arxiv.org/abs/2608.11386), [LLMs Cannot Self-Correct Reasoning Yet (Huang et al.)](https://arxiv.org/abs/2310.01798)
- **Detail:** Across three actors and 11,700 trajectories, Scratchpad and HypoTrack moved pass^k consistency by roughly −0.017 to +0.020 — neutral to mildly negative — and reliably improved neither exploration nor solution diversity; agents produced reasoning content matching the bash-only baseline regardless of whether the scaffold existed. The authors' stated explanation is that these tools "rarely change the actors' underlying reasoning behavior" absent retrieval, memory, new task information, or a different reasoning policy. Directionally consistent with the finding that internal self-correction without external grounding signal is flat-to-negative, and with this playbook's existing caution on self-critique phases. Useful as a corrective to the intuition that a scratchpad tool is a cheap reasoning win; single controlled study for this specific claim.

### Treat an agent's confidence score as one signal among the evidence, never as the decider — an aggregator must be able to prefer weaker-confidence dissent that cites code.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Adversarial Review (arXiv 2608.18167)](https://arxiv.org/html/2608.18167), [Demystifying Multi-Agent Debate: The Role of Confidence and Diversity](https://arxiv.org/abs/2602.03794)
- **Detail:** The meta-reviewer prompt states it literally — "Confidence scores are signals, not deciders. A reviewer can be confidently wrong" — and the paper's Case B illustrates the cost of the opposite: a rebuttal with weak signals flips a correct verdict to a false agreement. Multiple concurrent 2026 papers on confidence calibration in multi-agent debate converge on the same point, which is what lifts this above one team's design rationale. What is missing is an ablation isolating the instruction's effect on aggregation accuracy — it is a design principle baked into a prompt, supported by a qualitative failure case plus independent calibration literature. Directly applicable to this repo's own skeptic-panel and meta-review patterns: require the aggregator to justify from cited evidence rather than tally confidence.

### Instruct repair agents to fix only the stated issue — no feature additions, unrelated refactoring, or speculative hardening — and audit failures for scope creep, because review loops actively amplify it.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Adversarial Review (arXiv 2608.18167)](https://arxiv.org/html/2608.18167), [Refactoring Runaway (arXiv 2605.22526)](https://arxiv.org/abs/2605.22526)
- **Detail:** The mechanism-specific insight is that *structured critique makes this worse*: in the paper's astropy-14182 case a reviewer raised a speculative "what if the user calls read() separately?" concern, the critic failed to reject it as out of scope, and the agent shipped a 32-line patch (adding an unneeded method, removing a stable class variable) that failed hidden tests where a 24-line zero-shot patch had passed. The general problem class is independently studied — agents bundling tangled refactorings into issue fixes — but the proposed mitigation here is explicitly future work: the paper only says future versions "could make scope discipline as explicit as the evidence-grounded disagreement we encoded." So this is a real, mechanism-specific problem with an unimplemented, unmeasured fix. Complements the existing file-path scope-contract entry, which enforces the boundary mechanically rather than by instruction.

### When a worker hits its output token cap mid-generation, spend one short call summarizing the partial output instead of discarding it.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Ledger-Based Self-Orchestration (arXiv 2608.26480)](https://arxiv.org/html/2608.26480)
- **Detail:** The v2 scaffold added a cut-off summarizer so that "a worker that hits the token cap mid-attempt has its partial thinking summarized by a fresh short call so its ideas still reach the manager." Cheap and easy to bolt onto any loop where truncation is inevitable. The evidence is weak and non-isolated by the paper's own admission: the summarizer shipped alongside a round-budget increase (4→10) and a sample-test verifier, and "since only the manager arm differs between versions... [this] prevents direct ablation metrics." The zero-empty-solutions result belongs to the whole scaffold, not this component; there is no cost accounting and no measure of how often recovered content changed an outcome. Distinct from proactive context compaction — this is salvage after an output cap, not budget management before one.

### If you run a statistical failure monitor over agent telemetry, accumulate CUSUM per channel against a quantile-calibrated false-alarm budget and read the loudest channel — and recalibrate it for every serving configuration, because it does not transfer.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Real-Time Detection and Repair of LLM Agent Failures (arXiv 2608.02464)](https://arxiv.org/abs/2608.02464v1)
- **Detail:** A one-class echo-state network fit only on healthy runs (closed-form ridge solution, 1.7s fit vs 68s for a GRU) scored 0.71 detection at a 5% false-alarm budget (AUROC 0.872) across 2,823 episodes at ~200 µs/step. Two design details carry most of the value: threshold θ read as the 1−β quantile of healthy-validation maxima, and max-fusion across channels rather than sum/average — the paper's ablation says the per-channel max "carries most of the margin." The disqualifying-if-ignored caveat: calibrate on one serving model and deploy on another and it collapses to chance (AUROC 0.527 vs 0.885 recalibrated), because the healthy null must be collected under the exact serving distribution — temperature, toolset, probe pattern, latency regime. So the real cost is a maintained per-deployment anomaly model, not a drop-in. Detection is also uneven by failure class (looping 0.48–1.00, malformed JSON 0.05–0.50) and weak early (+0.09 AUROC at ≤3 steps vs +0.40 at ≥9) — exactly when repair would be cheapest. Single-author preprint; note that the far simpler deterministic checks in the same paper outperform this for the classes they cover.

### Add a deterministic verification layer beside any probabilistic monitor — recompute stated totals from the raw tool results, confirm every required tool call actually happened, and flag a final step that is empty or a bare tool call.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Real-Time Detection and Repair of LLM Agent Failures (arXiv 2608.02464)](https://arxiv.org/abs/2608.02464v1)
- **Detail:** Three cheap non-LLM checks with unusually clean precision. Numeric grounding (recompute the agent's stated total from tool results) caught 26/26 provoked hallucinations with 0 false positives. Coverage checking lifted the deterministic layer from 60% to 96% of failures caught, at 0/63 false positives on failure episodes and 0/1825 on healthy ones — versus 54% caught at a 17% false-positive rate for the behavioral monitor. A five-line completion check caught 7/7 silent aborts with 0 false positives across 30 high-temperature episodes. Scope limits: it needs structured tool returns and, for coverage, a task that enumerates its required calls — closer to eval harnesses than open-ended work; the paper's own blind spot is plausible-value corruption, undetectable from telemetry by construction. Note also that per-check isolated numbers exist only for grounding and completion — the widely-quoted 0/1825 figure belongs to the tool-contract check specifically, not to completion checking. Single non-peer-reviewed preprint quantifying what is otherwise ordinary assertion discipline.

### On a verification alarm, roll the trajectory back and re-run from the checkpoint with guidance naming only which check failed — withholding the values, which does not help and may hurt.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Real-Time Detection and Repair of LLM Agent Failures (arXiv 2608.02464)](https://arxiv.org/abs/2608.02464v1)
- **Detail:** Rollback is real (a committed trace plus its seed rebuilds the conversation at step k) and the repair prompt never sees the agent's prior output or any computed value — only the failing check's name. Across 55 genuinely-wrong episodes × 3 repeats: located repair recovered 45% vs a 16% resampling control (p=0.0005), generic re-check 36%, specific-with-values 36%, recompute 28% (n.s.), adaptive 21% (n.s.); end-to-end task success moved 52%→73% at roughly one extra model call per run, with no correct run broken. The counter-intuitive result — naming the check beats handing over the value — is the transferable part. Read the significance honestly: the paper applies Bonferroni (α=0.01) and states only the headline survives, so generic and specific are "suggestive rather than established." Solo-authored, unreplicated preprint; the check types feeding repair skew toward arithmetic/consistency failures, and retry demonstrably does not fix tool-cascade or looping failures.

### Before trusting two verifiers as independent, measure their excess joint false-acceptance — same-family models make correlated errors, and positive dependence adds a reliability penalty beyond the product of their individual error rates.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Looping Is Not Reliability (arXiv 2607.24604)](https://arxiv.org/html/2607.24604v1)
- **Detail:** Defined as D_ij = P(both accept | both wrong) − P(accept_i | wrong)·P(accept_j | wrong); the paper measures φ = 0.641 between a 7B and 14B model of the same family at 70% coverage. The actionable rule is that family diversity does not imply error independence, so a dual-verifier policy justified by multiplying error rates may be far weaker than its arithmetic suggests. Confidence is low: one paper, one model pair, one coverage point, and a confidence interval of [0.096, 0.935] — wide enough to span negligible to near-total correlation. The underlying principle (correlated ensemble errors break independence assumptions) is decades-old classifier-diversity theory; the contribution here is porting it to LLM verifier pairs, retrospectively and without deployment validation.

### Test a feedback or evidence change by branching from identical frozen code states rather than comparing free-running trajectories, which conditions on treatment-dependent events.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Looping Is Not Reliability (arXiv 2607.24604)](https://arxiv.org/html/2607.24604v1)
- **Detail:** The paper calls it common-state intervention: freeze one wrong and one correct code state per task, branch the evidence conditions from those identical starting points, five seeds each — explicitly to avoid a post-treatment risk-set problem, since regressions observed in a free-running trajectory are conditioned on an evidence-dependent event. The technique surfaced a finding replay-only evaluation missed entirely: the 14B model regressed more under stale evidence (34/135) than the 7B did (12/135). This is standard causal-inference hygiene (hold the confound fixed, vary the treatment) applied to agent evidence pipelines, so the novelty is placement rather than method; single paper, one benchmark setup, aimed at teams building evaluation infrastructure rather than at day-to-day agent use.

### Re-execute the full check set against the exact state being submitted, never against a cached verdict or a subagent's earlier report.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Looping Is Not Reliability (arXiv 2607.24604)](https://arxiv.org/html/2607.24604v1)
- **Detail:** The paper's "fresh certification" obligation — "re-execute checks on the selected completion state" — with the verifier run outside the agent process after recomputing state identity. Its own ablation quantifies the gap: stale traces harmed 34/135 correct starts (≈25%) versus 4/135 (≈3%) under current traces. Shares a mechanism with the state-hash binding entry (that one detects staleness; this one eliminates it) and with this repo's lean-verification discipline. Not merely CI merge-queue hygiene restated: the agentic failure mode is an orchestrator treating an earlier run or a subagent's self-report as ground truth after further edits landed, which is still common. Single paper, one 14B replication; the overhead is a real cost you should expect to pay.

### Instrument a verify-repair system on several axes at once — coverage, false-accept risk, sound completion (accepted AND correct), mean revisions, and the verifier's operating point — because optimizing any single one silently destroys another.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Looping Is Not Reliability (arXiv 2607.24604)](https://arxiv.org/html/2607.24604v1)
- **Detail:** The paper's own numbers make the trap concrete: a strict freshness-challenge policy drove risk to 0% but collapsed coverage to 38.4% and sound completion from 70.3%/77.8% to 38.4%, losing 311 baseline sound completions; a bundled contract removed every unsafe completion along with the only sound one. A zero-risk verifier can be a near-zero-liveness verifier, and reporting a single accept rate hides it. The general risk/coverage tradeoff is decades old (Chow's rule, selective prediction), but sound completion as an explicit reported metric is not yet standard in coding-agent tooling, where a single pass rate is the norm. Single unreplicated preprint; the metric definitions transfer even if the numbers don't.

### Consider stopping a verify-repair loop on an estimate of whether another repair round is expected to help, rather than a fixed iteration count — but budget for the calibration machinery it requires.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [VRR-Stop (arXiv 2607.17641)](https://arxiv.org/abs/2607.17641)
- **Detail:** The mechanism: turn repeated verification votes into a posterior belief b_k about committed validity, then stop on the *sign* of the marginal gain G_k = (1−b_k)α − b_kβ, which needs only sign identifiability rather than accurate parameter recovery. The framing is genuinely useful — it separates verifier noise from repair damage, targeting the failure where extra repair rounds break already-correct code. Three reasons to hold at Watch: the headline +60.6 point result comes from a self-constructed non-stationary "stress setting" with an injected round-3 shock and repair-damage probabilities up to 0.94, not ordinary operation; the real method needs a 4-parameter noise model, EM-fit binomial mixtures, up to 300 labeled before/after repair transitions per task, and M=8 verification queries per round — far heavier than "stop when confident"; and it is one recent unreviewed preprint from a small group with no replication. Complements the existing rule against terminating purely on iteration budget.

### Measure your verifier's own false-positive and false-negative rates on representative problems before wiring it into a stopping or gating decision, and keep separate parameter sets per problem domain.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [VRR-Stop (arXiv 2607.17641)](https://arxiv.org/abs/2607.17641)
- **Detail:** Calibration is described as a one-off cost — repeated verification records plus at most 300 labeled transitions, fit by a binomial-mixture EM estimator with five-fold cross-fitting. Domain-specific parameters matter because verifier quality and repair-damage probability vary sharply across settings: across GSM8K, MATH-500, MBPP and BFCL the paper's damage probability β ranges 0.615–0.938, and on MATH-500 a lower-quality verifier drags a metric from 0.798 to 0.150 where a reference verifier holds. Most agentic verify-repair setups treat the verifier as ground truth and never measure its error rates at all, which is what makes this non-obvious rather than routine QA. One correction to a stronger form of this advice: calibration is *not* a hard prerequisite — the same paper ships an estimation-free fallback for exactly the case where calibration can't be trusted. Single paper, multi-domain benchmarks.

### When a verifier's discrimination collapses toward chance, switch to an estimation-free rule — keep the incumbent solution unless a challenger clears the verification margin by a safety threshold — instead of trusting calibrated parameters.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [VRR-Stop (arXiv 2607.17641)](https://arxiv.org/abs/2607.17641)
- **Detail:** A guarded keep-best rule: replace the current candidate only if its raw acceptance score exceeds the incumbent's by margin δ, comparing vote counts directly rather than running the parameter estimator, with a Hoeffding-based bound on erroneous replacement. It is invoked on a held-out separation test — when measured discrimination is near zero, calibrated stopping is explicitly declared untrustworthy. The numbers show why the fallback earns its place: in the low-discrimination setting, calibrated stopping collapsed to 0.223 true validity while the guard recovered to 0.793, and the guard stayed near the no-repair floor across all seven stress/shift settings. Rigorous within its paper (multi-benchmark, three model families, McNemar tests, bootstrap CIs) but unreplicated by any other group, with an anonymized double-blind repo — one recent preprint.

### Judge a verifier by its discrimination (true-positive minus false-positive rate) and the decision margin rather than by how accurately you can estimate its error parameters — a well-separating but miscalibrated verifier beats a well-calibrated indiscriminate one.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [VRR-Stop (arXiv 2607.17641)](https://arxiv.org/abs/2607.17641)
- **Detail:** Stated directly in the paper: "stopping reliability is governed jointly by verifier discrimination and the decision margin rather than by the absolute size of estimation error" — what matters is whether finite evidence can stabilize the sign of the expected gain, not whether every parameter is recovered. Discrimination here is Youden's J. Consequence for effort allocation: improve separability first (better checks, better tests, stronger signals) before investing in error-rate estimation. Backed by theory (Hoeffding bounds, an identifiability analysis showing the mixture is only identifiable when J ≠ 0) and empirics across GSM8K/MATH-500/MBPP/BFCL and four model families with CIs and significance tests — e.g. near-zero J (0.03) collapsing validity 0.694→0.223 despite a 0.74 decision margin (p<2e-48). Caveats: the strongest demonstrations use injected-noise stress settings rather than a deployed pipeline, operationalizing it needs labeled data to estimate TPR/FPR, and it is one recent paper.

### Tune routing and gating thresholds in two stages — cross-validated offline on held-out data, then re-validated on live traffic — since costs that only appear in production (cache misses from switching, real token usage) can invert an offline-optimal choice.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Cursor: How Cursor Router works](https://cursor.com/blog/how-cursor-router-works)
- **Detail:** Cursor describes cross-validating thresholds to avoid overfitting, validating on a held-out test set before deployment, then testing on live traffic specifically to capture "token usage, caching, and the cost of switching between models." The half worth carrying is the last clause: switching models mid-session breaks prompt caching, and that cost is structurally invisible to any offline replay — an agent-specific instance of the general offline/online gap. The rest is textbook MLOps hygiene (held-out test plus canary), self-reported by a vendor about its own product with no comparative data, and the note is really about router-threshold evaluation rather than an agent's own verification loop.

## Multi-agent orchestration

### Structure multi-agent task decomposition as manager/child map-reduce (manager splits, children execute, manager synthesizes), and make shared state and cross-agent communication explicit — they don't emerge by default.
- **Tier:** Promising (added 2026-07-09; updated 2026-07-09)
- **Sources:** [Cognition: Multi-Agents](https://cognition.com/blog/multi-agents-working), [Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), [CodeDelegator (arXiv 2601.14914)](https://arxiv.org/abs/2601.14914)
- **Detail:** Cognition and Anthropic independently converge on orchestrator-worker over unstructured swarms, and both flag that agents falsely assume they share state with children and that cross-agent messaging must be deliberately scaffolded (internal MCP / shared memory). Anthropic reports >90% over single-agent on their research eval. CodeDelegator sharpens the split for code agents — a persistent orchestrator that only decomposes, writes sub-task specs, and decides Proceed/Retry/Replan (never writing or running code) plus ephemeral single-use workers each given one spec in a fresh context and discarded with their trace history — and its 'w/o Role Separation' ablation (single agent, same bookkeeping) dropped MCPMark by 10.5pp, the single largest ablation effect (38.4% vs 26.4% CodeAct / 25.8% ReAct pass@1).
  *Tool notes:* Coordination via internal MCP between manager and children.

### When scaling beyond a handful of agents, avoid lock-based coordination among equal-status agents editing shared state — it bottlenecks throughput down to a couple of agents.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Cursor: Scaling long-running autonomous coding](https://cursor.com/blog/scaling-agents)
- **Detail:** Twenty agents slowed to the effective throughput of two-three, mostly waiting; agents also became risk-averse, making small safe changes and churning. Also: optimistic concurrency control alone doesn't fix this without hierarchy. Single vendor self-report but a concrete named failure mode.

### Give multi-agent systems a persistent, queryable shared substrate (repository memory, versioned blackboard) rather than reconstructing shared state implicitly from conversational history each turn.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [SyncMind](https://arxiv.org/abs/2502.06994)
- **Detail:** Implicit/file-only state cannot detect when an agent's belief about the code diverges from the true state; SyncMind formalizes and measures this divergence (24k real-GitHub instances). L2MAC/MAGIS implement explicit persistent stores. Costs real complexity + write-conflict policies; scope to genuine multi-agent divergence risk.

### Bound per-agent context growth by dynamically spawning more specialized agents (each a narrower task slice) rather than growing one agent's context, accepting reduced global consistency as the tradeoff.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** Self-Organizing Agents spawn child agents by inferred subtask complexity (71.4% vs 66.5% HumanEval); AgentSpawn independently reports +34% completion / -42% memory. The cost — agents can't reason about the full program — is honestly disclosed.

### Split a monolithic single-model agent into specialized planner/caller/summarizer sub-roles so smaller, cheaper models can match a single large monolithic agent.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862)
- **Detail:** α-UMi's 7B planner/caller/summarizer split beats a same-arch single-LLM baseline even at 13B (per-role fine-tuning required). Corroborated by IBM CUGA and 'small agents beat a single LLM' work — but on tool-use/reasoning benchmarks, coding transfer unverified.

### Route by capability/cost: default to a cheaper model, escalate on low confidence, re-evaluate mid-session rather than once up front — and gate each escalation on measured quality uplift over the cheaper option, not on a heuristic.
- **Tier:** Promising (added 2026-07-09; updated 2026-09-01)
- **Sources:** [Cognition: Devin Fusion](https://cognition.com/blog/devin-fusion), [FrugalGPT](https://arxiv.org/abs/2305.05176), [Cursor: How Cursor Router works](https://cursor.com/blog/how-cursor-router-works)
- **Detail:** Lightweight mid-session classifiers (Devin Fusion; 88% of PRs auto-routed) decide continue/escalate as complexity changes, rather than a one-time pre-task router; FrugalGPT/RouteLLM show cost cascades preserve accuracy, and Codex CLI ships mid-session switching. Caveat: naive mid-session switching invalidates caches and can reinterpret context, so engineer the handoff (and see the entry on switching at compaction boundaries). Cursor's router adds a rigor upgrade over heuristic escalation — a trained complexity/domain classifier plus a "one-sided 75% uplift threshold against the price-efficient model," i.e. escalate only at roughly 75% statistical confidence the improvement is genuine, tested per task label. Treat the 75% as Cursor's own product-tuned constant, not a portable number: it is unvalidated against alternatives, and reproducing the approach needs a task taxonomy plus continuous per-label quality measurement most teams don't have.
  *Tool notes:* The transferable idea is statistical gating over gut-feel escalation; start by logging per-task-type win rates for the cheap model before building a router.

### Add a final Critic agent that reviews the whole trajectory and emits a binary PASS/FAIL verdict, writing the (task, code) pair to long-term memory only on PASS.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [AgentForge](https://arxiv.org/abs/2604.13120)
- **Detail:** Removing the Critic drops resolve 42%→38%; gating what enters shared memory keeps bad trajectories out of the pool later tasks retrieve from. Aligns with success-filtered memory patterns (LEGOMem, ROME). Single small-n ablation.

### Cap sub-agent delegation depth explicitly and disable further delegation tools once the cap is hit, to prevent unbounded recursive agent spawning.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Codex CLI enforces agent_max_depth with collaboration/spawn tools disabled at max depth; Hermes Agent independently implements the same. Real, recurring failure (bug reports of 48+ concurrently spawned agents / exponential fan-out in Claude Code, opencode, Kilocode).

### When giving an agent a smart-friend escalation, fork its full context to a stronger model and ask a broad, open-ended question — and only rely on this between frontier-tier models.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cognition: Multi-Agents](https://cognition.com/blog/multi-agents-working)
- **Detail:** Weak-primary→frontier escalation didn't work for Cognition (the gap was widest at knowing when/what to ask); frontier-to-frontier gains came from capability routing, not escalation. The tactic conflates the failed mechanism's question-framing with the working case's routing — treat with caution.

### Give subagents a structurally smaller dependency-injection container than the main agent, excluding session/console/config, so isolation is enforced by construction rather than prompt instruction.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** OpenDev's SubAgentDeps (3 fields: mode/approval/undo) vs AgentDependencies (7 fields) so a subagent literally can't reference session_manager/console/config. Interface-segregation/least-privilege applied to agent DI; single-paper, no ablation vs alternatives (Gemini CLI uses registry cloning instead).
  *Tool notes:* Typed-DI split, portable to any framework with typed dependency injection.

### Have each parallel agent 'lock' a task by writing a file into a shared directory before starting, relying on git's conflict-on-push to force racers onto a different task.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- **Detail:** Let 16 agents work a backlog without an external scheduler; the agent resolves the frequent merge conflicts itself. Unaddressed failure: a locked-then-crashed agent leaves a permanent lock — an independent implementation (claude_code_agent_farm) added stale-lock detection rather than relying on git conflicts.
  *Tool notes:* Requires a shared git remote; each agent in its own container.

### Run a small number of long-lived agents each dedicated to a cross-cutting concern (dedup, compiler-runtime perf, codegen efficiency, a design-critique persona, docs) alongside the generic task pool.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic: Building a C compiler](https://www.anthropic.com/engineering/building-c-compiler)
- **Detail:** Layered on top of the task-locking pool rather than every agent pulling from one queue. No controlled comparison; a multi-agent benchmark shows specialization helps only up to a point (extra specialists can add noise).

### Replace flat agent swarms with a hierarchical planner/worker pipeline: planners (with recursive sub-planners) explore and create tasks, while workers complete tasks without coordinating with each other.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor: Scaling long-running autonomous coding](https://cursor.com/blog/scaling-agents)
- **Detail:** Cursor credits this with scaling to multi-million-LOC builds without tunnel vision — but its own 'what's next' concedes multi-agent coordination remains unsolved and still needs resets, output quality is largely unverified, and it's the well-known orchestrator-worker pattern (also in Anthropic's research system).

### For evaluating multi-turn conversational agents, drive the test with a second LLM simulating the user/persona rather than scripting fixed user turns.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** The mechanism behind τ-bench/τ2-bench. But follow-up work ('Lost in Simulation', Sim2Real-gap papers) shows LLM user-simulators are excessively cooperative and stylistically uniform, inflating success rates — pair with human-in-the-loop or adversarial personas, don't adopt alone.

### Use a cross-model-family critique step — have a model from a different family review the first model's work — to catch errors it would rationalize away.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [GitHub: Evaluating the Copilot agentic harness](https://github.blog/ai-and-ml/github-copilot/evaluating-performance-and-efficiency-of-the-github-copilot-agentic-harness-across-models-and-tasks/)
- **Detail:** Copilot's 'Rubber Duck'; the mechanism is plausible (self-preference-bias research + a benchmark finding model heterogeneity helps multi-agent debate) but the same benchmark shows debate often fails to beat cheaper single-agent baselines. Requires multi-vendor model support.
  *Tool notes:* Needs a harness that can orchestrate multiple model families.

### Maintain a fixed roster of narrowly-scoped built-in subagents (explore, execute/test, plan, review) and auto-delegate to the matching one, running several in parallel when their work is independent.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [GitHub Copilot CLI changelog](https://github.blog/changelog/2026-01-14-github-copilot-cli-enhanced-agents-context-management-and-new-ways-to-install/)
- **Detail:** Cross-vendor pattern (Copilot Explore/Task/Plan/Code-review, Claude Code subagents, Codex subagents) but no benchmark of parallel-vs-sequential or auto-delegation accuracy; parallel gains erode past ~3-5 concurrent agents.
  *Tool notes:* Copilot CLI built-ins: Explore, Task, Plan, Code-review.

### Label asynchronous status/notification messages as containing no human input, so a delegated agent doesn't mistake a background system message for a fabricated user approval and act on it.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **Detail:** v2.1.205 fix. A real threat class (OWASP LLM08 Excessive Agency, fabricated-approval prompt injection) but this specific 'label as no-human-input' mitigation is single-source.
  *Tool notes:* Any orchestration layer injecting system/notification messages into an agent's transcript.

### Explicitly thread session-level config (e.g. request-shaping env vars) through to spawned background/bg worker processes rather than assuming process inheritance.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- **Detail:** v2.1.206 fixed CLAUDE_CODE_EXTRA_BODY being silently ignored by background workers; persistent-daemon-managed workers don't see env vars exported after the daemon started. Easy-to-miss gotcha in agent-dispatch architectures; single bug-fix source.
  *Tool notes:* Explicitly propagate config at dispatch time to background workers.

### Decide up front who controls sub-agent delegation — full LLM tool-based control vs scaffold-defined roles with enforced per-role tool permissions — as distinct tradeoffs, not maturity levels.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Codex CLI exposes spawn/resume/close tools for full LLM control; OpenCode spawns scaffold-defined specialists where the plan agent has edit tools disabled regardless of what the LLM wants. Framing/checklist point; 5 agents in the corpus use 5 distinct mechanisms (an active design frontier).

### Don't apply the evaluator unconditionally — reserve it for tasks beyond what the current base model handles reliably solo, and re-check that boundary as models improve since it moves outward.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- **Detail:** With Opus 4.6's higher baseline, tasks that used to need the evaluator's check were often handled well by the generator alone. Single-source anecdote; the increment over Anthropic's earlier evaluator-optimizer guidance is the nonstationary-boundary reminder, but it gives no metric/threshold for detecting "beyond solo capability."

### In agent-to-subagent delegation, run the permission classifier at both the outbound handoff (a subagent's task isn't fully authorized just because a parent issued it) and the return point (review the subagent's full action history), and on a flagged return prepend a security warning to the parent rather than discarding results.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
- **Detail:** Asymmetric design: deny-capable at outbound (the orchestrator's instruction otherwise looks like a fully-authorized user message inside the subagent), warn-only at return. Annotate-don't-discard is a specific, somewhat counterintuitive choice. Single-source self-report; the subagent-specific slice isn't separately benchmarked from the overall classifier numbers.

### For open-ended long-horizon tasks no fixed test suite covers, deploy an autonomous agent evaluator that decomposes the spec into a verifiable checklist and reports both a per-item checklist pass rate and a separate holistic quality score.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [The Verification Horizon (arXiv 2606.26300)](https://arxiv.org/abs/2606.26300)
- **Detail:** The holistic score tracked ground-truth unit tests better than the checklist average across 104 NL2Repo tasks × 6 frontier models. Counterintuitive and useful as an evaluation-metric-design tactic, but the "prefer holistic as the primary training signal" framing extrapolates past a static correlation study (no closed-loop RL run), and the paper itself documents the judge is gameable and produces false positives. Single-paper, correlational.

### Allow one agent ("brain") to hand off its execution sandbox to another agent mid-task, since neither brain nor sandbox is permanently bound — enabling delegation without re-provisioning.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Anthropic — Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- **Detail:** An architectural consequence of a decoupled execute(name,input)→string interface, described conceptually with no benchmark or case study. Adjacent practices exist (Microsoft handoff orchestration, Temporal sandbox borrow/handover locks) but none validate this specific mid-task sandbox transfer.
  *Tool notes:* For supervisor/subagent frameworks, consider a shared execute()-addressable sandbox pool instead of a fresh sandbox per subagent.

### Run adversarial independent review passes before granting strong assurance — two reviewers evaluating in separate contexts with disagreement escalated to a third arbiter — and for high-risk changes require a quorum whose passes differ in host, session, and signing key (not repeated calls to the same reviewer), explicitly marking a lone verdict as 'degraded single-host' rather than silently upgrading it to a full quorum.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Anthropic: large-scale code migrations](https://claude.com/blog/ai-code-migration), [Proof-or-Stop (arXiv 2607.14890)](https://arxiv.org/abs/2607.14890)
- **Detail:** Anthropic's migration used two adversarial reviewers in separate contexts with a third-agent tiebreak (Cognition's Python→TS port independently used three adversarial review rounds); Proof-or-Stop formalizes independence as host+session+signing-key divergence to close the 'same reviewer called twice, mislabeled a quorum' gaming vector. Multiple independent OSS adversarial-review projects converge on builder/critic/moderator patterns; no rigorous defect-catch benchmark, and the strong cross-vendor quorum claim is author-hedged.

### To get diverse solution attempts, push diversity into the reasoning stage — give independent agents different evidence perspectives so they form genuinely different root-cause hypotheses — rather than only into the sampling stage (resampling one shared reasoning context, which tends to reproduce the same hypothesis in different code form).
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Multi-Perspective Agentic Program Repair (arXiv 2607.12605)](https://arxiv.org/abs/2607.12605)
- **Detail:** The union of three static/dynamic/hybrid perspective agents repaired 99 more bugs (+25.4%) than the strongest single perspective; independent LLM+human evaluation (κ=0.82) confirmed more diverse, less-duplicated evidence/hypotheses than a shared-context baseline. Corroborated in direction by diversity-of-thought debate work (different domain/mechanism). Single paper, Java/Defects4J only, pre-replication.

### Skip delegating to a subagent for short tasks (a handful of turns between deciding and shipping) and for serial debugging chains where root-cause hunting is one continuous chain of judgment and the accumulated context itself is the work.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Cognition: Making Fable Cheaper Than Opus](https://cognition.com/blog/making-fable-cheaper-than-opus)
- **Detail:** Delegation has no leverage over cost when there's nothing worth handing off; 'the same judgment that writes a good brief also knows when not to write one.' Corroborated in direction by multi-agent coordination-overhead literature and by debugging-across-handoffs suffering context fragmentation; no isolated metric for this specific skip-rule.

### Treat the subagent-dispatch tool call itself as an injection surface — content a subagent reads (files, web pages, tool output) can attempt to hijack the tool call that spawned/controls it, so harden the dispatch path, not just the final-answer path — and verify (don't assume) that a worktree-isolated subagent's git-mutating commands actually stay confined to its worktree rather than reaching the main checkout.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Claude Code v2.1.210 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.210)
- **Detail:** Two hardened bug-fixes in one release: indirect prompt injection via content a subagent read (attacking the delegation mechanism, not just the subagent's output), and a `isolation: 'worktree'` leak that let a subagent's git-mutating commands hit the main repo checkout. Single-source changelog lines; the dispatch-as-surface point extends known defense-in-depth to multi-agent delegation.

### Consider replicating a critical stateful gate/broker across a small consensus cluster (e.g. Raft) rather than a single instance when cross-region availability or crash-tolerance is required — but budget for a real per-commit latency cost (~two extra network round-trips) versus a single-node durable instance, and reserve single-node mode for latency-sensitive, low-availability-risk deployments.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Stop Means Stop (arXiv 2607.14166)](https://arxiv.org/abs/2607.14166)
- **Detail:** A demonstrated failover (new leader within ~1.9s, a pre-crash-released identity correctly refused as a duplicate on the new leader, no double-release) sustained ~1–1.8k admissions/sec vs single-node's higher throughput; 10ms simulated WAN roughly doubled per-admission cost. A textbook consensus-HA tradeoff applied to an effect gate; single-machine demonstration (loopback peers), not a distributed fault-injection benchmark.

### Prefer a small role-separated review structure — coder, reviewer, and an adversarial critic that audits the review itself — over adding more agents, and make the critic's disagreement evidence-grounded or it is worse than a single reviewer.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Adversarial Review (arXiv 2608.18167)](https://arxiv.org/html/2608.18167), [Towards a Science of Scaling Agent Systems (arXiv 2512.08296)](https://arxiv.org/abs/2512.08296)
- **Detail:** Three agents beat five on both benchmarks tested — LiveCodeBench 87% vs 82% for a 5-agent baseline, SWE-bench Verified 75.2% vs 71.6% zero-shot — with the paper's own thesis being that "rather than naively scaling agent count, designing structured, explicit, evidence-grounded disagreement may more effectively improve code generation and code review quality." Independent 2026 scaling work converges on architecture over agent count. Two things the headline omits and you should not: the naive version of this structure *underperforms a single reviewer* (F1 0.457 vs 0.495 on SWE-PRBench) because the critic simply agrees — only the typed-verdict version reaches 0.533 — and the protocol costs ~4.5x the tokens of zero-shot. Single workshop-tier paper (ICML 2026 DL4C) on one model family, no independent replication of this specific architecture.
  *Tool notes:* The paper ships it as a portable SKILL.md-style protocol, so it transfers to skill-based harnesses directly; pair it with the verdict-taxonomy and response-rules entries, which are load-bearing rather than optional.

### Where adversarial roles aren't practical, a fallback is several reviewers run in parallel on identical context with no visibility into each other, aggregated by a meta-reviewer that weighs evidence rather than counts votes.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Adversarial Review (arXiv 2608.18167)](https://arxiv.org/html/2608.18167), [MARS (arXiv 2509.20502)](https://arxiv.org/abs/2509.20502)
- **Detail:** The protocol is explicit that "reviewers do NOT see each other's outputs — diversity comes from independent sampling on identical context, not from debate," and MARS's origin paper reports it matching multi-agent debate on general reasoning benchmarks at roughly half the tokens and latency. Presented honestly, though, this is the *beaten baseline* in its own source: MARS scores 82% on LiveCodeBench versus 87% for the tighter adversarial structure using fewer agents, and the paper attributes the gap to interaction converging toward correctness rather than independent sampling. Simpler instances also fail — a two-reviewer variant without a meta-reviewer scored 75%, within noise of a single reviewer — so the +5pp over zero-shot only appears with the full 5-agent apparatus. Worth tracking as a fallback for settings where debate or adversarial roles aren't feasible; not a recommended default.

### Periodically spawn a worker with the raw problem statement and no prior context, to get an attempt uncontaminated by the group's early framing.
- **Tier:** Watch (added 2026-09-01)
- **Sources:** [Ledger-Based Self-Orchestration (arXiv 2608.26480)](https://arxiv.org/html/2608.26480), [When Context Hurts (arXiv 2605.04361)](https://arxiv.org/abs/2605.04361)
- **Detail:** Motivated by a real observed regression — on one problem the deliberation abandoned a correct initial approach for a buggy one, and the authors note that "spawning some workers with the raw problem statement and no prior context would give the manager an independent attempt to compare." Be clear about the status: that is a one-sentence future-work suggestion the paper never implemented or tested, supported by a single anecdote, so there is no evidence the fix works. What lends it credibility is adjacent literature — blind-independent-answering ("LLM council") patterns for avoiding anchoring, and work showing shared context between agents can degrade multi-agent design exploration. Cheap to try alongside a ledger-based orchestrator; measure before relying on it.

## Memory

### Accumulate retrievable episodic memory of past task outcomes (distilled failure lessons and successful trajectories) and consult it before retrying a similar task.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [Reflexion](https://arxiv.org/abs/2303.11366)
- **Detail:** Reflexion stores verbalized failure reflections; Memento retrieves successful trajectories (case bank) — independent systems, quantified gains, keyed off external feedback (tests/task success), not unaided self-critique. Convergent with AgentForge episodic memory and CEDAR-style retrieval-augmented few-shot selection.

### Split persistent memory into functional/tiered roles — short-term/working in-context, long-term persisted and reloaded, with periodic consolidation.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Sourcegraph: Context Engineering](https://sourcegraph.com/blog/context-engineering), [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** Distinct stores (working, semantic/retrievable repo evidence, experiential lessons, long-term validated knowledge, multi-agent shared) with separate management policies beat one undifferentiated growing history. Anthropic's file-based memory + compaction and LangChain converge on the short-term/long-term split.

### Curate and filter what gets written into experiential/long-term memory rather than accumulating every trajectory; quality of stored experience beats scale.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** MemGovern's governed/curated experience cards beat raw ungoverned trajectory records (+4.65% SWE-bench Verified, lower verification overhead); ungoverned history introduces noise, error propagation, and false retrievals. Filtering ≠ small memory — clean/structured, still large.

### Persist project-specific knowledge across sessions as versioned repository artifacts (a playbook / design docs as system of record), not tribal knowledge.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344), [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Structure repo knowledge as a maintained product — indexed design docs with verification status, architecture maps, quality grades, decision logs — so any future run reloads full state from the repo alone. Backed by the ACE playbook framework (quantified gains). Risk: bloat if not paired with maintenance/verification (CI, doc-gardening).

### Maintain a persistent cross-session/cross-task pool of reusable structured rules or heuristics discovered during execution.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** Removing TACO's Global Rule Pool (task-only rules) drops accuracy below baseline; cross-task rule sharing is what makes the method beat baseline. Aligns with Voyager-style skill libraries and case-based reasoning.

### Distinguish static, human-authored read-only config from true agent-written persistent memory; don't market/design the former as adaptive memory.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** A rules/config file the agent only reads (.cursorrules, CLAUDE.md) is not 'memory'; reserve that label for content the LLM or a background pipeline actually writes/updates across sessions (Cline new_rule, Gemini CLI save_memory). Independently echoed by Augment's read-vs-write axis.

### Add a task-conditioned filtering pass on retrieved memory/rule items so high-ranked-but-irrelevant items are discarded rather than blindly activated.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** After score-ranked retrieval, an LLM checks each candidate's trigger/applicability against the current task and drops mismatches regardless of score. Recurring pattern (Memory-of-Thought, MemGuide) but not isolated in ablations.

### Once a self-evolving rule/memory pool has converged, freeze it and reuse it directly on new tasks rather than continuing the expensive online adaptation loop.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [TACO](https://arxiv.org/abs/2606.19572)
- **Detail:** TACO's frozen-and-reused pool matched or slightly exceeded the continually-adapting variant on the same task set — but only same-task reuse was tested, not genuine cross-domain generalization, and no cost numbers given.

### Give a long-running agent virtual-memory-style paging between active context and an external store; check simpler filesystem tools first.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862), [MemGPT](https://arxiv.org/abs/2310.08560)
- **Detail:** MemGPT pages between fast context and external DB for 'infinite' memory. But Letta's own evals show plain filesystem tools match/beat MemGPT-style architectures on LoCoMo, and the field has moved toward tiered compaction — treat as one option, not the default.

### Type/specialize memory stores (episodic, procedural, semantic) and periodically consolidate/purge stale entries — but don't rely on consolidation alone as a poisoning defense.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862)
- **Detail:** MIRIX decomposes memory into specialized stores; the typed-store pattern is well-established (CoALA, Letta). Caveat: research (arXiv 2601.05504) shows relevance-based consolidation is insufficient to stop memory-poisoning propagation, so the security framing is weakly evidenced.

### Persist the agent's planning output to a separate file so it survives a session reset and can be re-consulted.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [GitHub: Context windows, Plan agent, and TDD](https://github.blog/developer-skills/application-development/context-windows-plan-agent-and-tdd-what-i-learned-building-a-countdown-app-with-github-copilot/)
- **Detail:** Save Plan-agent Q&A as standalone Markdown rather than leaving it in transient chat. Corroborated by SPEC.md/plan-file conventions and this repo's agent-handoff pattern.

### Have the agent write persistent memory to a plain, git-tracked file reloaded into the system prompt each session, so a human can read/edit/delete what it 'remembers'.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Cline's .clinerules and Gemini CLI's GEMINI.md persist agent-written rules into future prompts as inspectable, auditable files rather than opaque stores. Descriptive single-source; no comparative outcome data.

### For automatic cross-session memory, use a two-phase background pipeline — cheap parallel extraction then a separate consolidation pass that de-dupes and prunes by usage.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Codex CLI runs parallel cheap extraction (o4-mini) then a locked consolidation sub-agent (stronger model) with usage-ranked pruning, rather than the primary agent deciding inline what to remember. Verified against source; n=1, no A/B.

### Support cross-tool interoperability by reading sibling-tool convention filenames (.cursorrules, .windsurfrules, AGENTS.md) in addition to your own.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Cline reads .clinerules plus rival tools' rule files, reflecting projects carrying instructions authored for other agents. Verified behavior; single example, and offers no conflict-resolution/precedence or injection-trust guidance.

### Encode static recurring project knowledge (commands, style, conventions) as versioned rule files referencing canonical code examples, added reactively after observed mistakes.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor: Best practices](https://cursor.com/blog/agent-best-practices)
- **Detail:** Reference examples by path rather than pasting full style guides; add rules after seeing repeated agent errors, not speculatively upfront. Container mechanism (CLAUDE.md/.cursor/rules) is near-universal; the reactive-add and reference-don't-paste refinements are the value.
  *Tool notes:* .cursor/rules/ directory; generalizes to CLAUDE.md.

### Resume and cycle between local and remote/cloud agent sessions from one interface so continuity isn't lost when work moves between them.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [GitHub Copilot CLI changelog](https://github.blog/changelog/2026-01-14-github-copilot-cli-enhanced-agents-context-management-and-new-ways-to-install/)
- **Detail:** `--resume` + TAB cycles local and remote coding-agent sessions. Analogous to Cursor Cloud Handoff; feature-description only, no reliability data.
  *Tool notes:* Copilot CLI `--resume`.

### When investing limited harness-improvement effort, prioritize a persistent long-term-memory file (highest-value single component in isolation) — but don't expect memory to stack additively with other fixes; it can even outperform the fully-combined system on the hardest tier via redundant/over-cautious verification.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Agentic Harness Engineering (arXiv 2604.25850)](https://arxiv.org/html/2604.25850v1)
- **Detail:** Ablation: long-term-memory-only +5.6pp (largest single gain, vs tools +3.3, middleware +2.2, system prompt −2.3); memory alone beat full AHE on the Hard tier, and the three positive single-component gains (+11.1pp) don't sum to the full system's +7.3pp (memory/middleware/system-prompt all push the same closure-style verification, causing redundant re-checks). Single unreplicated paper, one benchmark/model, inside an automated harness-evolution loop rather than human-authored harnesses.

### Treat installed skills as content requiring lifecycle management — since there's no automatic update mechanism, periodically review and prune/update skills so outdated information doesn't silently accumulate and mislead the agent.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Google — Closing the knowledge gap with agent skills](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/)
- **Detail:** Named by the source as a limitation: no auto-update story, so stale skill info can accumulate and do more harm than good. Distinct from ordinary dependency hygiene because skills are natural-language instruction content with no version pinning or CI to catch drift — silent accumulation of confidently-wrong guidance. Corroborated as a recognized gap by skill-lifecycle-management feature requests and a dynamic-skill-lifecycle paper, but underspecified (no cadence/staleness criteria) and no evidence of error-rate reduction.

### Close a self-improvement loop: run a recurring meta-agent that synthesizes accepted review feedback and human corrections/overrides across many PRs and opens a PR that patches the agent's own review skill/ruleset itself (not just logs findings), so the next run automatically incorporates the update — and keep that rule/skill file in a repo where the patching PR goes through normal review.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [Warp: self-improving code review](https://www.warp.dev/blog/how-to-build-a-cloud-software-factory-self-improving-code-review), [Self-Improving AI Coding Agents (arXiv 2607.13091)](https://arxiv.org/abs/2607.13091)
- **Detail:** Two independent sources converge on turning review feedback into persistent, version-controlled agent instructions via PR: Warp's daily outer-loop meta-agent synthesizes cross-PR feedback and opens a PR updating the review skill, and Microsoft's deployment codifies each accepted review comment as a versioned behavioral rule (with a PR-template step that, on accepting a generalizable-mistake comment, adds the rule in the same PR or files a follow-up). Depends on the skill being version-controlled text+scripts and on human review before merge — a guard against the agent hallucinating corrections or overwriting human-authored rules. No quantified improvement-over-time; the self-modifying loop carries real drift risk.

### For each tool a guardrail will judge, distill reusable 'safety experiences' once via automated sandbox red-teaming (the agent auto-generates test cases, runs them in an isolated sandbox, observes downstream effects, writes structured per-tool guidelines) and inject that text into the guardrail's system prompt at decision time, rather than hand-writing per-tool security rules.
- **Tier:** Promising (added 2026-07-17)
- **Sources:** [OpenHands SDK v1.36.0 — ToolShield](https://github.com/OpenHands/software-agent-sdk/releases/tag/v1.36.0), [ToolShield paper (arXiv 2602.13379)](https://arxiv.org/abs/2602.13379)
- **Detail:** Shipped as an installable extra; the distilled experiences dropped MT-AgentRisk attack-success further (to 7–10% vs 14–18% for the bare guardrail) at marginal added cost with zero benign actions blocked, and are model-agnostic once generated (swapping the guardrail LLM needs no regeneration). The innovation is replacing manual per-tool rule-authoring with one-time automated self-exploration; evidence traces to one benchmark family and effectively one adopter.

### Give each accumulated rule a structured schema even inside a human-readable Markdown file — Rule ID, Category, Trigger Origin, Scope, Constraint, Rationale, Checklist Map, Added date, Traced-To review comment — rather than an unstructured bullet.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Self-Improving AI Coding Agents (arXiv 2607.13091)](https://arxiv.org/abs/2607.13091)
- **Detail:** Enables origin tracking and a verifiable bridge to the self-review checklist. An ADR/RFC-style structured-decision record transplanted onto agent rules; unablated and single-source, and in mild tension with corroborated 'keep instruction files concise' findings — weigh the per-rule metadata cost against the file being loaded straight into context.

### When a new review comment shows an existing rule is too broad or too narrow, refine that rule in place (keep the same rule ID, sharpen the constraint text) instead of adding a new overlapping rule.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Self-Improving AI Coding Agents (arXiv 2607.13091)](https://arxiv.org/abs/2607.13091)
- **Detail:** Prevents rule-set bloat and silent contradiction (illustrated by one real conflict resolved by scoping a rule rather than deleting either). Convergent with Cursor-rules guidance and agent-memory UPDATE-over-append designs (Memory-R1, Hindsight); single anecdote, manual detection, no automated conflict tooling.

### Gate episodic-memory injection on retrieval confidence (top-1 similarity and the top-1-to-top-2 gap), staying silent rather than injecting below a calibrated bar; and for 'why'/rationale questions run a decision-scoped gather across the whole ledger (the choice, its rejected alternatives, reasoning markers like 'because'/'instead of'/'rejected') and synthesize the arc in one call citing each claim to its source turn and commit SHA, rather than single-shot retrieval of one episode.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Why Git Is the Memory Solution (arXiv 2607.14390)](https://arxiv.org/abs/2607.14390)
- **Detail:** Ungated episodes degraded a structural-map baseline (0.63→0.29); a confidence gate keyed off the retriever's own scores recovered most of it (→0.50). Single vendor preprint with tiny, near-degenerate ablations and clear self-interest — directionally reasonable, try-and-measure, not validated practice.

### Generate benchmark ground truth for 'did memory help' by mining commit-session links and git topology (a SQL miner over ledger + git history producing provenance/decision-recall/dead-end/multi-hop pairs) instead of hand-labeling, then have an LLM only paraphrase each mined label into a natural-language question under an explicit lexical-leakage ceiling (e.g. 4-gram Jaccard ≤ 0.30).
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Why Git Is the Memory Solution (arXiv 2607.14390)](https://arxiv.org/abs/2607.14390)
- **Detail:** Zero-labeling-cost benchmark construction runnable by any user on their own history; provenance/dead-end pairs are near-noise-free metadata facts while multi-hop (co-occurrence) pairs are noisier. The 'label noise biases scores downward / conservative' claim is asserted but unaudited; single vendor preprint.

### When a memory-index write (e.g. MEMORY.md) would push the index over its configured read limit, fail loudly with an explicit error rather than silently truncating, so stale/lost memory entries are never invisible.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Claude Code v2.1.210 release notes](https://github.com/anthropics/claude-code/releases/tag/v2.1.210)
- **Detail:** Validate size against the read limit before writing; silent truncation of an index read on every session bootstrap is invisible to the operator/agent. Single changelog line; a specific failure mode (not generic 'handle errors well') for any agent memory-index system.

### When synthesizing lessons for a self-updating agent skill, explicitly capture — alongside codebase style conventions and codebase-specific gotchas — guidance on how the agent should validate its own suggestions before flagging them, not just what to flag.
- **Tier:** Watch (added 2026-07-17)
- **Sources:** [Warp: self-improving code review](https://www.warp.dev/blog/how-to-build-a-cloud-software-factory-self-improving-code-review)
- **Detail:** Style and gotcha capture is already the standard content of CLAUDE.md/AGENTS.md-style memory; the distinctive, under-used element is memorializing self-validation/precision heuristics (to cut false-positive review comments). Single practitioner source, presented in-source as one 'etc.'-qualified example rather than a fixed taxonomy.

### Keep a persistent filesystem ledger — plan, task list, notes, current solution — read and rewritten across every agent call, so a truncated or crashed call costs a round rather than the run.
- **Tier:** Promising (added 2026-09-01)
- **Sources:** [Ledger-Based Self-Orchestration (arXiv 2608.26480)](https://arxiv.org/html/2608.26480), [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- **Detail:** Concrete rather than abstract: named files (task.md, plan.md, tasks.json, notes.md, solution.py) read and written between calls, so each worker resumes from saved state instead of in-context history. In the reported run the manager arm absorbed 95 worker truncations across 75 of 500 problems with zero empty solutions, while the single-call arm produced 35; the same model went 63.0%→86.4%. Independently converged on outside this paper — Anthropic's long-running-agent guidance prescribes a progress file that survives fresh-context sessions, and filesystem-as-scratchpad architectures recur across the always-on-agent literature. Two honest limits: no ablation isolates the ledger from the rest of the orchestration scaffold, and the scaffold regressed slightly in two of nine model/condition cells, so the gain concentrates where the unaided model is weakest. Reinforces this repo's own HANDOFF.md and lean-sdd ledger conventions.
  *Tool notes:* Requires filesystem access between calls; define 'done' as state on disk so the orchestrator can rebuild the work list after a crash.
