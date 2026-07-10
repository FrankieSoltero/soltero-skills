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
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** Above a size threshold, persist the full result to disk and replace it with a compact preview plus a hint on how to retrieve the rest (offset/limit/grep). Shipped in Claude Code, LangChain DeepAgents, and AWS Strands — the identical two-part pattern across three independent harnesses.

### Inject 'system reminders' as event-triggered, template-based user-role messages gated by guardrail counters, to counteract instruction fade-out.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344)
- **Detail:** Fire reminders on events (N consecutive failures, mode transition) as synthetic user turns (higher compliance than system-role) with counter gating (e.g. MAX_NUDGE_ATTEMPTS=3) to avoid nagging loops. Claude Code implements the same `<system-reminder>` mechanism in production.

### Keep the agent-facing root instructions file short (~100 lines) as a navigational map into versioned docs, not an exhaustive manual.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** A monolithic instructions file rots, causes priority collapse, and crowds out task context; use AGENTS.md/CLAUDE.md as a table-of-contents into docs/ subfolders. Augment's AuggieBench and a 2,500-repo study independently find concise root files (20-150 lines) top performers.
  *Tool notes:* AGENTS.md/CLAUDE.md convention.

### Treat anything the agent can't see in-context as nonexistent; engineer surfaces (logs, metrics, traces, docs) to make it visible.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [OpenAI: Harness Engineering](https://openai.com/index/harness-engineering/)
- **Detail:** Knowledge in chat threads, Google Docs, or people's heads is inaccessible to the running agent. OpenAI wired production observability (Vector → Victoria Logs/Metrics/Traces, queryable via LogQL/PromQL/TraceQL) into the agent's runtime so it can close a debug loop on live telemetry.

### Persist plans and durable state as filesystem-backed, version-controlled artifacts, not ephemeral prompt/reasoning traces.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [GitHub: Context windows, Plan agent, and TDD](https://github.blog/developer-skills/application-development/context-windows-plan-agent-and-tdd-what-i-learned-building-a-countdown-app-with-github-copilot/)
- **Detail:** Write PLAN.md/status logs (milestones, acceptance criteria, validation commands, recovery rules) so work survives context resets and multi-session execution and can be reviewed by humans or consumed by subagents. Matches Anthropic's structured-note-taking and Claude Code plan-file conventions.

### Explicitly schedule/reset what each agent invocation sees — store partial results externally, re-init with a compressed progress summary, and instruct which files to read/skip.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [MemGPT](https://arxiv.org/abs/2310.08560)
- **Detail:** Instead of carrying full history forward, reset context between steps and hand each invocation a targeted summary plus resource identifiers. Convergently implemented (L2MAC Control Unit, MemGPT paging, MemoryOS).

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
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** OpenHands computes filtered views from an immutable EventStream via condensation markers, contrasted with Aider's destructive summarization that overwrites history. Minority pattern (event-sourcing cost); descriptive evidence only.

### Diagnose context bucket-by-bucket and target the single largest offender first, rather than pruning blindly.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Cursor 3.3 changelog](https://cursor.com/changelog/05-06-26)
- **Detail:** Use the relative sizes of rules/skills/MCP/subagent categories to decide what to cut; a forum user discovered a skill was consuming disproportionate context this way. Tool-specific mechanism; single anecdote.

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

### Have the frontier/main agent take minimal direct actions and delegate mechanical execution to a cheaper sidekick, reserving the main model for planning, disambiguation, and review.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Cognition: Devin Fusion](https://cognition.com/blog/devin-fusion), [Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- **Detail:** The main agent should delegate and monitor by default; Anthropic's lead/subagent split reports >90% over single-agent baseline. Cognition notes a negative case where delegating nuanced-judgment work hurt, so keep judgment-heavy steps on the strong model.

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

## Tool design

### Don't preload every MCP/tool schema into the prompt; expose an on-demand tool-search meta-tool that scores available tools and registers only the selected ones.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [OpenDev](https://arxiv.org/abs/2603.05344), [Evolution of Tool Use survey](https://arxiv.org/pdf/2603.22862)
- **Detail:** Matches Anthropic's shipped tool_search feature (~85% token reduction, tool-selection accuracy 49%→74%), and independent systems ToolLLM, AnyTool, MCP-Zero (98% token cut), RAG-MCP (13.6%→43.1% accuracy). Now default in Claude Code.
  *Tool notes:* Pair with a schema-validation gate and per-subagent allow-lists.

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
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [Scaling Coding Agents via Atomic Skills](https://arxiv.org/abs/2604.05013)
- **Detail:** Isolated fs/shell/runtime + fixed lockfiles/seeds keep test signals stable; disabling network and stripping .git history force execution-grounded rewards and block patch retrieval. Cursor's stricter-isolation experiments confirm large score drops when leakage is closed (note: the Atomic Skills paper was withdrawn for data errors, but this specific practice is independently corroborated).
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

### Prefer a structured, dedicated agent-computer interface (distinct edit/search/navigate/execute commands) over translating NL directly into raw shell — but this is contested for strong models.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** SWE-agent's ACI roughly doubled its SWE-bench pass rate vs a raw-bash baseline (older model). But OpenHands finds a bash/code-first interface generalizes better for modern strong models, and Codex CLI leans bash-primary — a genuinely split design choice, not settled.

## Verification & self-repair

### Verify the final environment state (files, DB contents, logs, page state) after a trial rather than trusting what the agent's transcript claims it did.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Confirm the reservation exists in the DB, not that the agent said 'booked'. Operationalized at scale by SWE-bench (apply patch, run tests) and WebArena (programmatic state checks); an independent paper argues log/state inspection is necessary for credible agent evaluation.
  *Tool notes:* Implement state_check graders that query DB/filesystem/logs post-trial.

### Regularly read a sample of full transcripts and grader outputs, not just aggregate pass rates, to catch broken or gameable graders before trusting scores.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** On CORE-Bench, transcript review took Opus 4.5 from 42% to 95% by surfacing rigid numeric matching, ambiguous specs, and stochastic tasks. Corroborated by Hamel Husain's evals writing and a Berkeley RDI study where a near-zero-capability exploit scored ~100% on eight benchmarks.

### Choose pass@k when a single success suffices and pass^k when the agent must behave reliably every time (e.g. customer-facing systems).
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), [τ-bench](https://arxiv.org/abs/2406.12045)
- **Detail:** At 75% per-trial success, pass^3 ≈ 42%; by k=10 pass@k → 100% while pass^k → 0%. pass^k originates in the τ-bench paper (GPT-4o pass^8 <25% in retail) — picking the wrong metric for your deployment hides production-breaking unreliability.

### Calibrate LLM-based graders against human expert judgment before scaling, give them escape clauses ('return Unknown'), and split them into isolated single-dimension judges rather than one monolithic rubric.
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Anthropic: Demystifying evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- **Detail:** Judge-human agreement rises sharply with decomposed/anchored rubrics (kappa ~0.4→0.78 in RubricEval/LLM-Rubric work); abstention research supports escape clauses; LangChain/Kinde practitioner guides support gold-set calibration. Cost: isolated judges mean 2-3x more calls.

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

### Measure a retrieval/tool feature's cost impact as $/solved-task (spend ÷ successes), not just mean cost-per-episode.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Code Isn't Memory](https://arxiv.org/abs/2606.22417)
- **Detail:** Per-episode cost can be statistically null (p=0.73) while $/solved differs meaningfully ($2.30 vs $2.84) because the whole advantage comes from a higher resolve rate. SWE-Bench+ independently advocates effectiveness-aware cost-per-instance.

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
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Cursor: Best practices](https://cursor.com/blog/agent-best-practices), [Anthropic Claude Code best practices](https://code.claude.com/docs/en/best-practices)
- **Detail:** A visible red phase + committed tests before implementation stops the agent from faking tests or rewriting them to match broken code — an agent-specific failure mode. Independently prescribed by Anthropic's official docs, Simon Willison's 'Red/Green TDD' pattern, and github-countdown; TDAD reports high regression safety.

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

### Before self-modifying the harness (prompts, tool schemas, retrieval policy, permissions, workflow topology), require a 'change contract' per mutation and validate on held-out regression suites before promoting.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)
- **Detail:** Contract fields: which component changes, target failure mode, predicted improvement, invariants to preserve, a falsifying evaluation, rollback plan. The authors' proposed five-stage Evolution-Agent loop; conceptual synthesis, unbenchmarked.

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
- **Tier:** Proven (added 2026-07-09)
- **Sources:** [Code as Agent Harness](https://arxiv.org/pdf/2605.18747), [OpenAI Codex docs]
- **Detail:** Independently implemented by Claude Code (approval before writes/network), Codex (Suggest/Auto-Edit/Full-Auto), and Gemini CLI (read-only Plan Mode). Confine mandatory approval to the smallest highest-risk tier to avoid approval fatigue (Anthropic telemetry: ~93% reflexive approval under flat gating).

### Drive implementation with an explicit generate-test-repair inner loop: after each edit, run lint/tests, and if either fails re-prompt the model with the actual error text, capped at a fixed number of iterations.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Aider's inner loop feeds real error output back (capped max_reflections=3), the foundational unit under most agents' composed loops. Corroborated by Reflexion; feed actual error text, not just pass/fail.

### When an LLM judges or selects among its own candidate outputs, use a separate model from the one that generated them to avoid the judge sharing the generator's blind spots.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Moatless configures the value/critic to a different model than the action agent; DARS-Agent (same model both roles) shares biases. Only two in-corpus instances, but the mechanism is backed by well-documented LLM self-preference bias (NeurIPS 2024).

### For safety-critical tool calls (arbitrary shell, filesystem writes), layer an independent LLM risk-evaluator that scores each proposed call and blocks high-risk ones, on top of OS-level sandboxing.
- **Tier:** Watch (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** Codex CLI combines Bubblewrap/Landlock/Seatbelt sandboxing with a 'Guardian' LLM that reviews and can deny tool calls (the two address different failure classes). Real dual-layer design (verified in openai/codex source, though the paper's specific 0-100/threshold detail is stale); no efficacy data or adversarial-evasion testing.
  *Tool notes:* Sandboxing is OS-specific; the Guardian pattern is model-agnostic and adds one LLM call per invocation.

### When producing an evidence-grounded analysis of a codebase, pin every claim to a file path and line number at a fixed commit and run a dedicated post-hoc verification pass before trusting it.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)
- **Detail:** A verification pass over 296 claims confirmed 267, corrected 19 (mostly line drift), accepted 10 as simplifications — ~10% needed correction. Corroborated by citation-grounded-code-comprehension work showing naive LLM citations fail 28-48% without grounding+verification. Prefer independent-reviewer verification over self-verification.

## Multi-agent orchestration

### Structure multi-agent task decomposition as manager/child map-reduce (manager splits, children execute, manager synthesizes), and make shared state and cross-agent communication explicit — they don't emerge by default.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Cognition: Multi-Agents](https://cognition.com/blog/multi-agents-working), [Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- **Detail:** Cognition and Anthropic independently converge on orchestrator-worker over unstructured swarms, and both flag that agents falsely assume they share state with children and that cross-agent messaging must be deliberately scaffolded (internal MCP / shared memory). Anthropic reports >90% over single-agent on their research eval.
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

### Route by capability/cost: default to a cheaper model, escalate to a stronger one on low confidence, and re-evaluate the choice mid-session rather than once up front.
- **Tier:** Promising (added 2026-07-09)
- **Sources:** [Cognition: Devin Fusion](https://cognition.com/blog/devin-fusion), [FrugalGPT](https://arxiv.org/abs/2305.05176)
- **Detail:** Lightweight mid-session classifiers (Devin Fusion; 88% of PRs auto-routed) decide continue/escalate as complexity changes, rather than a one-time pre-task router. FrugalGPT/RouteLLM show cost cascades preserve accuracy; Codex CLI ships mid-session switching. Caveat: naive mid-session switching can invalidate caches / reinterpret context, so engineer the handoff.

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
