# New-skill candidates — playbook lines 1–1010 (Context management, Agentic loop design, Spec & prompting, Tool design)

Scope read: playbook.md lines 1–1010 in full (`## Verification & self-repair` begins at line 1010 and belongs to the other agent).
Anchors below cite the exact `###` heading text, tier, and line number. Watch-tier entries appear only as supporting color, never as an anchor.

Five candidates, not eight. Everything I could have padded with is listed under "Considered and dropped" with the reason.

---

## 1. `skill-trigger-repair`

**Rank basis:** observed gap (the largest one by count) + **Proven** anchor.

**Trigger.** Fires when a dev-debrief (or any telemetry pass) reports the same skill as a missed trigger two or more times, or when the owner says some variant of "why didn't X fire".

**What it does.** Reads the missed-trigger findings out of `docs/debriefs/*.md` and, for each repeatedly-missed skill, pulls the cited session evidence to recover the *exact user phrasing* that should have fired it ("can we figure out why", "add a show/hide password toggle", "we have run into this issue like 15 times"). It then applies the two levers the playbook separates: (a) rewrite the skill's frontmatter description so the literal user phrasing appears as a trigger clause — the description is the only always-loaded surface, so a capability the model can't recognize from it is functionally absent; (b) add or repair a task-type → skill routing line in the repo/global instruction file, because explicit routing instructions measurably beat description-only retrieval. It writes a before/after diff per skill plus a `Docs/trigger-repair-YYYY-MM-DD.md` ledger recording the phrasing evidence for each edit, and it re-checks the same skill on the next debrief to confirm the fire rate actually moved. Skills with zero opportunity in the window are left alone; a skill missed once is logged, not edited.

**Playbook anchors**
- `### Apply progressive disclosure to skills/capabilities: keep name + one-line description always-on, and load the full instruction body only when the skill is triggered.` — **Proven**, line 873. (Names the exact failure mode: "a hidden capability never invoked because the model doesn't know it exists — guard by writing a discoverable, always-visible short description.")
- `### Consider pointing the agent directly at authoritative documentation files (AGENTS.md-style, an embedded docs index) instead of, or in addition to, a packaged skill — direct doc instruction sometimes outperforms the skill abstraction.` — **Promising**, line 631. (Vercel eval: skills-default 53% with the skill never invoked 56% of the time; skills-with-explicit-instructions 79%; an 8KB AGENTS.md docs index 100%.)
- `### Keep the agent-facing root instructions file short (~100 lines) as a navigational map into versioned docs, not an exhaustive manual.` — **Promising**, line 47.
- Supporting color (Watch): `### Organize the agent instruction file into distinct named sections — Behavioral Rules, Code Standards, Self-Review Checklist, Anti-Patterns …, and Workflow Rules (task-type → which tool/subagent to invoke) …` (line 686); `### Trim always-on/global rules to the minimum and prefer agent-requestable (on-demand) rules with tight descriptions over broad always-loaded ones.` (line 565).

**Observed-gap evidence.** workflow-gap-evidence.md lines 6–11 (the entire "Repeated missed triggers" block: capture-lesson ×5, lean-debugging ×3, lean-brainstorming ×2, lean-verification ×2, lean-finishing ×1, correction-compiler ×1 across ten days). Line 44 of the gap file (ETH-style dilution caveat) is not present but line 47 of the playbook is the counterweight — the repair must shrink, not grow, the always-on file.

**Why not covered by an existing skill.** Closest are **dev-debrief**, **skill-patcher**, **skill-gardener**. dev-debrief *detects* missed triggers and is explicitly recommendations-only — "it never edits skills, ledgers, or CLAUDE.md". skill-patcher edits skill bodies from *correction* evidence (guidance that produced a wrong answer), not from *non-invocation* evidence, and it does not touch frontmatter descriptions or the routing table. skill-gardener is a read-only structural/staleness audit. So the loop from "this skill matched and didn't fire, ten times" to "the description and routing line were changed" is currently closed by nobody, which is exactly why the same six skills reappear in every debrief.

**Shape.** Skill + bundled deterministic script (parse debrief missed-trigger sections → per-skill fire/opportunity counts; the frontmatter edit and routing-line edit stay agent work behind an explicit diff-approval gate).

---

## 2. `blast-radius-gate`

**Rank basis:** observed gap (the most expensive one) + **Promising** anchors.

**Trigger.** Fires before executing, or before writing code that executes, any irreversible multi-record side effect against a shared/production resource — bulk deletes, cascade strips, org/tenant purges, destructive-feature manual testing, migrations that drop data.

**What it does.** Before the first destructive call, it forces a written blast-radius contract: the exact target set enumerated by ID (not by name or filter), the environment resolved from the actual connection string rather than assumed, the reversal path (backup taken, soft-delete available, or "none — this is irrevocable"), and the phase at which authority becomes irrevocable. It then runs a dry-run/count-only pass and requires the operator to confirm the returned count matches the enumerated set before any write. Each destructive call gets a caller-minted idempotency key so a retry or replay cannot double-execute, and the gate is keyed to the irrevocable phase specifically rather than to the first API call of a multi-phase action. It writes the contract, the dry-run counts, and the executed keys to `Docs/destructive-ops/YYYY-MM-DD-<op>.md`. Fail-closed: an unresolved environment, a count mismatch, or a missing reversal path blocks the operation outright.

**Playbook anchors**
- `### Give every side-effecting tool call a stable idempotency key scoped to (run_id, key) — ideally a caller-named semantic key (charge_card:{order_id}) minted at the call site — so replays dedupe instead of double-executing; and after a run is cancelled, explicitly fence its later/orphaned effect submissions and drop its pending held effects rather than letting in-flight work land silently.` — **Promising**, line 964.
- `### Don't assume a framework's human-approval pause suspends the whole run — when a step has concurrent/sibling branches, assume a sibling's side effect will execute during the pause unless verified otherwise.` — **Promising**, line 493. (P(leak|emitted)=1.00 across every evaluated framework; 577/577 leak when effect and gate share a superstep.)
- `### Run a lookahead/simulated rollout of candidate action sequences before committing an irreversible or high-risk tool call, executing only the best-scoring branch.` — **Promising**, line 285. ("Gate the simulate-then-commit pattern to irreversible actions specifically" — the dry-run-then-commit half is the portable piece.)
- `### Default every lifecycle gate to fail-closed: missing, incomplete, stale, or unauthorized evidence blocks the transition outright rather than letting the agent proceed on the assumption that work is probably fine.` — **Promising**, line 471.
- Supporting color (Watch): `### When adding a human-approval gate to a multi-phase external API (authorize-then-capture, create-then-activate), explicitly choose and key the gate to the phase where authority becomes irrevocable …` (line 696); `### Route every side-effecting tool call through an environment-external admission broker …` (line 975); `### Write a safety/permission classifier's prompt to evaluate the real-world effect of an action (not its surface text) …` (line 621).

**Observed-gap evidence.** workflow-gap-evidence.md line 15 ("Destructive-feature testing hit a real client org's production data (08-28: 'I accidentally tested it on her prod account'). Feature hard-strips employee assignments by design.") and line 16 ("Sessions open with production deletions … 8 orgs named"). Also line 29 (session-miner Proposal 4: production-DATABASE_URL warning) — the same hazard surfacing independently from a second source.

**Why not covered by an existing skill.** Closest are **evidence-gate**, **audit-swarm**, **prisma-safety-review**. evidence-gate gates *lifecycle claims* — phase change, review pass, "done", merge-ready — not runtime side effects against live data; its own playbook lineage (line 731) explicitly scopes it to lifecycle-advancing claims. audit-swarm is findings-only and never executes anything. prisma-safety-review is a code-review pass for schema/query defects (it flags transaction-less bulk writes in *source*), not a runtime gate on the operator's own destructive session. Nothing today stands between "clear out the following bars and all of their employees" and the delete.

**Shape.** Skill + bundled deterministic script (environment resolver from the live connection string, target-set enumerator, dry-run counter, idempotency-key minter) + optional hook-based enforcement on Bash calls matching destructive SQL/CLI shapes.

---

## 3. `defect-class-sweep`

**Rank basis:** observed gap (explicitly named by the owner) + **Promising** anchors.

**Trigger.** Fires when the same bug class has been fixed three or more times across sessions or projects — the owner's "we have run into this issue like 15 times how have we not universalized this yet" — or when capture-lesson/mistakes-and-fixes shows a cluster with a common root cause.

**What it does.** Takes one defect class (UTC/local date shift, local-timezone `Date` parsing, cache staleness after write, deploy-skew races) and inverts the order the owner has been working in: it writes the *rule* first — the one-paragraph correct pattern plus the mechanically detectable wrong pattern — then derives the gap inventory as "what the rule's default won't cover", then sweeps the repo for every existing instance of the wrong pattern and fixes them in one reviewed batch rather than one-at-a-time on discovery. The rule lands as a versioned entry in the project's golden-principles file with a matching lint/grep check so the class cannot silently reappear, and unresolvable instances get a greppable marker for centralized triage instead of a guess. It writes `Docs/defect-classes/<class>.md` (rule, wrong-pattern signature, instance inventory with file:line, check command) and hands the check to correction-compiler if it warrants a hook. Gate: no sweep without a mechanical detector for the wrong pattern — if the class can't be grepped or linted, it isn't a class yet, it's a lesson.

**Playbook anchors**
- `### Codify recurring quality/consistency preferences as small, explicit, versioned 'golden principles' checked into the repo and mechanically enforceable, not prose style guides alone.` — **Promising**, line 545.
- `### For a large agent-driven migration/transformation, front-load a rulebook written before the gap inventory (gap inventory = what the rulebook's defaults won't cover, tested together in a joint audit), then run a disposable stress-test pass on a small slice whose output you discard entirely, using only what breaks to harden the rulebook.` — **Promising**, line 661. ("The rulebook must come before the gap inventory.")
- Supporting color (Watch): `### When overseeing a large agent swarm, deliberately ignore individual agent failures … and watch only for recurring cross-file patterns that signal a systemic rule gap.` (line 241 — "a recurring mistake means fix the upstream rule once and regenerate, not patch each instance"); `### Have an implementer agent that hits genuine, unresolvable ambiguity emit a machine-greppable marker (e.g. // TODO(port): <reason>) instead of guessing …` (line 671).

**Observed-gap evidence.** workflow-gap-evidence.md line 11 (correction-compiler missed 08-29 on exactly this) and line 17 ("Recurring gotcha clusters with no procedure: UTC/local date-shift bugs (startUp, '15 times'); race conditions / cache staleness; Vercel/Render deploy-skew race; local-timezone Date parsing; shell-history credential hygiene").

**Why not covered by an existing skill.** Closest are **correction-compiler**, **capture-lesson**, **code-optimizer**. correction-compiler compiles a repeated correction *of the agent* into a proposed enforcement artifact and explicitly never installs or changes code — it produces a ledger entry, not a remediated repo. capture-lesson records one incident. code-optimizer enforces *already-declared* project guidelines and does dead-code/dupe/size work; it does not discover a defect class from bug history or author the rule. The missing middle is: derive the rule from the incident cluster, then retire every existing instance of it at once.

**Shape.** Skill + bundled deterministic script (wrong-pattern grep/AST detector runner and instance-inventory writer), executed on a branch with one gate-verified commit per class — the code-optimizer commit discipline, different input.

---

## 4. `dispatch-contract`

**Rank basis:** observed gap + **Promising** anchors.

**Trigger.** Fires on any subagent dispatch outside a lean-sdd task loop — ad-hoc `Agent` calls, security-review fan-outs, research swarms, audit workers — and before the parent relays any subagent's report as fact.

**What it does.** Replaces the free-text prompt with a typed brief: objective, input bindings as file paths/typed references rather than pasted content, the tool allowlist the subtask actually needs, the model tier for the work class, and — the load-bearing part — a return schema with validation conditions naming what the parent will check. The worker returns only that structure (status, artifact refs, short summary, and on failure a one-line root cause); raw stdout, stack traces, and failed-attempt narration never propagate up. On the parent side the skill enforces the reciprocal rule: a worker's "complete" is a claim, and the parent verifies it against the diff and the test output the return schema required, before it is spoken aloud. It writes the brief and the returned record to the run's brief/report files so a fan-out of twenty workers leaves twenty auditable rows rather than twenty "completed-clean" lines.

**Playbook anchors**
- `### Return only a structured result from each sub-task worker to the planner (status, artifact refs, a short summary, and on failure a brief root-cause) — never let raw stdout, stack traces, or failed attempts propagate back.` — **Promising**, line 169. (Replacing the typed asymmetric channel with free-form message passing costs 4.7pp on MCPMark with the two-agent split held fixed.)
- `### Specify delegated sub-tasks with a typed schema rather than free text: a natural-language directive, input bindings as typed references to already-committed objects (type, shape, sample values), and a return schema naming expected outputs with validation conditions.` — **Promising**, line 606.
- `### When spinning up a subagent, narrow its config to the subtask: a custom system prompt, a tool allowlist restricted to what the subtask needs, and optionally a cheaper/faster model than the parent.` — **Promising**, line 900. ("Make tool restriction an architecturally-enforced allowlist … prompt-only restrictions are violated 37–68% of the time under adversarial framing.")
- `### Have the frontier/main agent take minimal direct actions and delegate mechanical execution to a cheaper sidekick, reserving the main model for planning, disambiguation, review — and for writing the rules other agents will follow.` — **Promising**, line 295.
- Supporting color (Watch): `### Bake an explicit verification gate into the delegation brief itself, requiring the subagent to report back the full diff and test results before it is allowed to commit.` (line 711); `### When delegating a coding task to a cheaper subagent, write an outcome/constraint-based spec (algorithm, constraints, edge cases, test matrix, definition of done) rather than dictating exact implementation details line-by-line.` (line 706).

**Observed-gap evidence.** workflow-gap-evidence.md line 9 ("lean-verification: missed 08-22, 08-29 — assistant relayed subagent success reports ('all 19 tasks complete') and the next whole-branch review found a Critical") and line 19 ("Heavy security-review subagent usage: 20+ SDK security-review sessions per day per project, all 'completed-clean' — possibly low signal"). Both are the same defect: an unvalidated return channel.

**Why not covered by an existing skill.** Closest are **lean-sdd** and **lean-verification**. lean-sdd already implements file-based brief/report/diff handover with risk-tiered review — but only *inside* an implementation plan's task loop; the daily 20+ security-review dispatches and the audit/research fan-outs run with no brief contract at all. lean-verification states the principle ("a subagent's success report is a claim to verify against the diff") but supplies no brief format, no return schema, and no tool/model scoping, so there is nothing mechanical for the parent to check against. This candidate is the contract; lean-verification is the rule it makes checkable.

**Shape.** Inline skill + a brief/report template pair (no script needed; the value is the schema and the parent-side check, both text).

---

## 5. `agent-surface-audit`

**Rank basis:** playbook-only, but the only candidate anchored on two **Proven** entries.

**Trigger.** Fires on "why is my context filling up so fast", after adding an MCP server or plugin, when a session hits compaction early and often, or on a periodic maintenance cadence.

**What it does.** Measures before it cuts: produces a per-category context-usage breakdown (root instruction files, always-on rules, skill descriptions, MCP/tool schemas, subagent definitions) and names the single largest offender rather than pruning by feel. It then applies the curated moves in Proven order — remove ambiguous or overlapping tools and disable MCP servers not needed for the current work; put remaining tool-heavy servers behind lazy schema loading (gate a server behind a skill, or an `includeTools` name/glob allowlist) instead of preloading every schema; scope tool visibility per subagent role rather than exposing the full set everywhere. It also audits the permission rules for the documented silent no-op: `Write(path)`/`NotebookEdit(path)`/`Glob(path)` rules are parsed but never matched, so confinement written that way is imaginary — rewrite as `Edit(path)`/`Read(path)`. Output is `Docs/agent-surface-YYYY-MM-DD.md` with the measured baseline, the ranked offenders, and each proposed config edit; nothing that executes is installed without explicit approval.

**Playbook anchors**
- `### Don't preload every MCP/tool schema into the prompt; expose an on-demand tool-search meta-tool that scores available tools and registers only the selected ones, or sync per-server schemas to disk and load them only when a tool is actually called.` — **Proven**, line 738. (~85% token reduction; tool-selection accuracy 49%→74%; Amp's skill-gating + `includeTools` narrowing chrome-devtools ~17k→~1.5k tokens. Known tradeoff: ~50% more round-trips, diminishing value below ~50 tools.)
- `### Ruthlessly curate the active tool set: remove ambiguous/overlapping tools and disable unused MCP servers/tools per task, since every tool definition consumes context and dilutes selection.` — **Proven**, line 744. (GitHub cut Copilot 40→13 tools for +2–5pp resolution; ~10–20 active tools before measurable degradation.)
- `### Expose a per-category context-usage breakdown (rules, skills, MCP definitions, subagent output) to diagnose what's consuming the window.` — **Promising**, line 78.
- `### Scope which tools are visible at each decision point (per phase, per graph node, per sub-agent role) as tool count grows, instead of exposing the full set at every step.` — **Promising**, line 822.
- `### Prefer narrowly-scoped Edit(path)/Read(path) permission rules over Write(path)/NotebookEdit(path)/Glob(path) rules when scoping what an agent/subagent may touch.` — **Promising**, line 947.

**Observed-gap evidence.** None observed (playbook-only). Weak circumstantial support only: this session runs ~110 deferred tools across six MCP servers with one failing to connect, and agent-handoff's context-watch hook reminds at ~40% — but no debrief line reports context pressure as a felt problem, so I am not claiming it as a gap.

**Why not covered by an existing skill.** Closest are **skill-gardener**, **agent-handoff**, and the built-in `update-config`/`fewer-permission-prompts`. skill-gardener audits skill *lifecycle* (structure, staleness, retirement) and never looks at MCP schemas, tool counts, or permission-rule correctness. agent-handoff reacts to context pressure by handing off; it never reduces the standing cost. `fewer-permission-prompts` adds allowlist entries to reduce prompts — the opposite direction from confinement, and it doesn't measure context. Nothing measures the always-on surface or fixes the `Write(path)` no-op.

---

# Second list — existing skills a **Proven** entry says should change (not new skills)

| Skill | Playbook entry (heading, tier, line) | One-line change |
|---|---|---|
| **creating-a-skill** | `### Ship deterministic logic a skill uses (diff parsing, output formatting) as bundled scripts (skill resources), rather than having the agent regenerate that code from scratch each run.` — **Proven**, line 942 | Make "any deterministic step is a bundled script, not regenerated code" a hard authoring gate in the quality checklist, not a stylistic preference. |
| **creating-a-skill** | `### Apply progressive disclosure to skills/capabilities: keep name + one-line description always-on, and load the full instruction body only when the skill is triggered.` — **Proven**, line 873 | Add a description-discoverability gate: the frontmatter description must contain the literal phrasings a user would type, and the authoring test must include a never-invoked negative case, since the named failure mode is a capability the model never learns exists. |
| **build-mcp-server** | `### Keep credentials out of the sandbox that runs model/tool-generated code — bundle auth into the resource at provision time or route calls through a token-holding proxy.` — **Proven**, line 878 | Require the token-holding-proxy / provision-time-auth pattern in the hardening checklist and forbid long-lived OAuth secrets mounted as sandbox env vars. |
| **build-mcp-server** | `### Compose verified fine-grained tools into higher-level composite 'super tools' with macroscopic semantics rather than re-planning the same low-level call chain each task.` — **Proven**, line 749 | Add a design step that consolidates stable multi-call sequences into one composite tool instead of shipping thin per-endpoint wrappers. |
| **build-mcp-server** | `### Don't preload every MCP/tool schema into the prompt; expose an on-demand tool-search meta-tool …` — **Proven**, line 738 | Have the server ship an `includeTools`-style allowlist / lazy-schema story as part of "production-grade", since a many-tool server is a context liability at the client. |
| **lean-brainstorming** | `### When requirements are vague, run them through a dedicated Plan agent whose job is to ask clarifying questions and surface edge cases before any code is written.` — **Proven**, line 530 | Keep the one-round batching, but make the question round non-skippable for any behavior-changing feature: the Proven number (clarification-seeking 69.4% vs 54.8% resolved, p<0.001) is exactly what the two 08-29 inline-shipped features gave up. |
| **lean-plans / prd-review / plan-review** | `### Write task specs precise enough that two independent domain experts reach the same pass/fail verdict, and state every condition the grader checks in the task description.` — **Proven**, line 525 | Add the two-independent-reviewers-agree test as an explicit rubric criterion (~25.7% of audited benchmark tasks carried spec ambiguity that shifted rankings 9.6–9.9%) — the councils currently grade quality dimensions, not verdict-reproducibility. |
| **lean-sdd** | `### Build an explicit dependency graph/DAG of tool calls up front and execute independent branches concurrently, instead of a strictly serial ReAct loop.` — **Proven**, line 264 | The concurrency is already there; the missing clause is the entry's caveat — "guard against race conditions on shared state" — which maps directly to the observed cache-staleness/worktree race cluster (gap line 17). |
| **audit-swarm / code-review usage in CI** | `### Run a CI-triggered review/analysis agent with read-only permissions and have deterministic CI code (not the agent) perform the actual writes — emit structured output (e.g. review.json) that a non-agent step converts into PR comments.` — **Proven**, line 936 | audit-swarm already satisfies the read-only half; the change is to require the structured-output-plus-deterministic-write split whenever a review agent runs against untrusted PR content (the CVSS 9.4 "Comment and Control" class hit Claude Code, Gemini CLI, and Copilot Agent Actions). |

---

# Considered and dropped

- **`task-scope-estimator`** — anchored on `### Before acting, estimate task difficulty/scope from cheap lexical signals and commit to a minimum-viable execution path …` (Promising, line 481) and `### Don't treat 'read everything first' as the safe default …` (Promising, line 251). Dropped: no observed gap, and the entry's own caveat says frontier models that already read frugally see only ~15–20% real savings. The whole `lean-*` family is already this principle applied.
- **`gate-override-ledger`** (record every human downgrade of a BLOCKED verdict) — anchored on `### Default every lifecycle gate to fail-closed …` (Promising, line 471) and `### Expect and openly report a real cost overhead from evidence gating (~1.2x tokens …) rather than treating overhead as something to hide or optimize away first.` (Promising, line 476). Dropped as a *new* skill: it addresses a real observed gap (gap line 14 — BLOCKED verdicts converted to advisory as standing policy on 08-27/28/29), but the right home is a change inside **plan-review** (a non-convergence circuit-breaker after N rounds, per `### Bound retries on recognizable failure loops …` Promising line 290 and `### Detect repair-loop dead-ends … switch to a different candidate from a pre-generated diverse plan pool` Promising line 305) plus **evidence-gate** for the override record. Both anchors are Promising, not Proven, so it does not qualify for the second list as written — flagging it here so the caller can route it.
- **`harness-self-modification-guard`** — anchored on `### When letting an agent self-modify its own harness/config, block the shortcuts an unconstrained self-modifier would take …` (Promising, line 410). Dropped: **memory-gardener**, **skill-patcher**, and **correction-compiler** already carry the "never installs anything that executes without explicit human approval" constraint, and the user's global instruction already forbids config self-edits. Nothing left to build.
- **`context-offload-discipline`** — anchored on `### Offload large tool outputs to disk and attach agent-facing truncation hints …` (**Proven**, line 37). Dropped: Claude Code already ships this (this very session's oversized outputs were auto-persisted to disk with a preview). No skill can add anything the harness isn't already doing.
