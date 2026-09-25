# New-skill candidates — playbook lines 1010–1798 (Verification & self-repair, Multi-agent orchestration, Memory)

Source: `skills/agent-playbook/references/playbook.md`. Only Proven/Promising entries anchor candidates.
Gap references are line numbers in `workflow-gap-evidence.md`.

Coverage of my half: 82 `###` entries across 3 sections. Tier mix in range — Proven 15, Promising 42, Watch 25.
Multi-agent orchestration (1516–1664) contains **zero Proven entries**, which is why no candidate is anchored there alone.

---

## Ranked candidates (6)

### 1. `destructive-op-gate`
**Rank basis:** observed gap + Proven (two Proven anchors).

**Trigger.** Fires before the agent executes any state-mutating action whose target is, or may be, a live/shared system — a delete/update/truncate against a non-local database or a `DATABASE_URL` that isn't localhost, a script or feature exercised against a real customer/tenant record, a bulk write across more than one entity, a deploy/migration/OTA push, or any user request phrased as "clear out / wipe / remove all X".

**What it does.** Classifies the pending action into the playbook's three tiers (read-only → sandbox/local-edit → full-access-destructive) and only the top tier stops for typed human approval, so routine work isn't gated into approval fatigue. Before the approval prompt it establishes blast radius mechanically, not by narration: resolve the connection target and print it, run the operation as a counting `SELECT`/dry-run first, and name every entity by ID. It then requires a compensating-rollback path to exist *before* the write — a captured snapshot/export of the exact rows, or a transaction the agent holds open and can abort — and refuses the write outright if the target is production and no rollback artifact was produced. Writes `Docs/destructive-ops/YYYY-MM-DD-<op>.md`: resolved target, dry-run counts, entity IDs, rollback artifact path, the approval text the human typed, and the post-write state check. A second pass after the write re-queries the live system and diffs actual against predicted counts.

**Playbook anchors.**
- `### Enforce a multi-tier permission model for agent actions — read-only, sandbox-edit, full-access (network/credentials/deploy/destructive) — and gate the highest tier behind mandatory human approval.` — **Proven**, line 1289. (Carries the load-bearing caveat: 93% reflexive approval under flat gating, and 36.8% of state-changing actions slipping through un-gated in-project edits.)
- `### Wrap multi-tool write/state-mutating operations in transaction-style semantics (bounded scope, delayed commit, compensating rollback on abort) instead of irreversible one-shot calls.` — **Proven**, line 1274.
- Supporting: `### For safety-critical tool calls (arbitrary shell, filesystem writes), layer an independent LLM risk-evaluator…` — Promising, line 1304; `### For each tool a guardrail will judge, distill reusable 'safety experiences' once via automated sandbox red-teaming…` — Promising, line 1765 (how to generate this project's per-tool rules instead of hand-writing them); `### In an autonomous/auto-mode agent, stop and ask for confirmation before running a destructive command … whose target includes a variable it cannot resolve from context.` — Watch, line 1263 (color only).

**Observed-gap evidence.** Lines 15 ("Destructive-feature testing hit a real client org's production data (08-28): 'I accidentally tested it on her prod account'. Feature hard-strips employee assignments by design"), 16 ("Sessions open with production deletions … 8 orgs named"), 21 (production onboarding of 46–59 real staff across 3 orgs), 29 (session-miner Proposal 4: startUp production-`DATABASE_URL` warning one-liner — the owner's own mining independently surfaced this).

**Why not covered.** Closest are `prisma-safety-review`, `audit-swarm`, and `correction-compiler`. `prisma-safety-review` flags transaction-less bulk writes at *code-review* time and only for Prisma; this fires at *execution* time, on the agent's own about-to-run action, whatever the tool. `audit-swarm` is findings-only and never touches runtime behavior. `correction-compiler` only proposes an enforcement artifact after a second repeated human correction and installs nothing — the prod incident was a first occurrence with no correction to compile. Grepping all 42 skills for `production`/`destructive` returns only `memory-gardener` (destructive *memory* edits) and `lean-tdd`/`build-mcp-server` in unrelated senses: there is no live-system blast-radius gate anywhere in the library.

**Shape.** Skill + bundled deterministic script (target resolver + dry-run/count + snapshot capture) + a PreToolUse hook for the classifier, so it cannot be talked out of firing. The hook is the point; an inline skill would keep missing the way `lean-debugging` and `capture-lesson` do.

---

### 2. `lesson-recall`
**Rank basis:** observed gap + Proven.

**Trigger.** Fires at the *start* of a task that resembles one the project has already failed at — before the first fix attempt on a bug, at the top of a debugging session, or when the task text matches a recorded gotcha class (dates/timezones, caching, deploy skew, migrations). Explicitly a read gate, not a write gate.

**What it does.** Retrieves from `Docs/mistakes-and-fixes.md`, `Docs/corrections-ledger.md`, and the project's `~/.claude` memory the entries whose trigger conditions match the current task, applies a task-conditioned relevance filter so high-scoring-but-irrelevant entries are dropped rather than dumped, and injects only the surviving entries — with a confidence floor below which it stays silent instead of injecting noise. It reports what it recalled in one line ("3 prior lessons match: UTC/local date-shift ×4, Vercel deploy skew ×1") and, critically, counts recurrence: when the same lesson class is recalled for the Nth time (N ≥ 3), it stops and hands off to `correction-compiler` with the recurrence count as the evidence bundle, instead of letting the agent solve it by hand again. Writes nothing except a recall line in the session and a `recalled` counter increment on each matched entry, which then feeds `memory-gardener`'s helpful/harmful pruning.

**Playbook anchors.**
- `### Accumulate retrievable episodic memory of past task outcomes (distilled failure lessons and successful trajectories) and consult it before retrying a similar task.` — **Proven**, line 1668. The "consult it before retrying" half is what the library is missing; it already does the accumulate half well.
- `### Maintain a persistent cross-session/cross-task pool of reusable structured rules or heuristics discovered during execution.` — Promising, line 1688 (TACO's ablation: removing the cross-task rule pool drops accuracy *below* baseline — write-only memory is worse than none).
- Supporting: `### Add a task-conditioned filtering pass on retrieved memory/rule items so high-ranked-but-irrelevant items are discarded rather than blindly activated.` — Watch, line 1698; `### Gate episodic-memory injection on retrieval confidence…` — Watch, line 1780 (both color only, but they specify the filter and the silence floor).

**Observed-gap evidence.** Line 11 ("Ok we have run into this issue like 15 times how have we not universalized this yet" — recurring UTC/local date-shift bug), line 17 (four named gotcha clusters "with no procedure": UTC/local date-shift, race/cache staleness, Vercel/Render deploy skew, local-timezone Date parsing), line 6 (capture-lesson missed 5× in 10 days — the write side is already leaking, which makes a read side that *demonstrates the file's value* the cheaper fix), line 8 (lean-debugging missed 3×; the recall line is the natural place to route into it).

**Why not covered.** `capture-lesson` writes lessons. `memory-gardener` curates them at handoff-time or on a schedule and is explicitly barred from running inline during task work. `correction-compiler` consumes them only after the *human* corrects twice. `agent-handoff` reads `HANDOFF.md`, not the lesson store. Nothing in the library reads `Docs/mistakes-and-fixes.md` back at the moment the same mistake is about to be made again — the "15 times" quote is the direct measurement of that gap.

**Shape.** Skill + bundled deterministic retriever script (keyword/section index over the lesson files, no embedding infra) + a `UserPromptSubmit` hook. Hook-based for the same reason as #1: the failure mode is the skill not firing.

---

### 3. `skill-ab-eval`
**Rank basis:** observed gap + Proven (three Proven anchors).

**Trigger.** Fires before a new or materially-edited skill is released (the repo's PR-to-`main` release flow), and on demand when someone asks "does this skill actually help?" or when a reviewing/judging agent's verdicts look degenerate — e.g. a long run of identical "clean" outcomes.

**What it does.** Builds a small paired harness: 20–50 prompts drawn from *observed real failures* (debrief missed-trigger findings, `Docs/mistakes-and-fixes.md`, past incident sessions), not invented ones, each with an automatable objective pass signal rather than a prose grade. Runs each prompt with and without the skill loaded, across at least two model tiers, ≥3 seeds, and reports a paired per-instance comparison rather than a single-run point delta — plus where the skill *doesn't* help, which is the decision-relevant half. It then turns the same machinery on judges: whenever a run's grader is an LLM, it samples full transcripts (not aggregate pass rates), seeds a known planted defect as a canary so an all-clean batch is evidence rather than silence, and rewrites the judge prompt against divergence cases over several rounds. Writes `Docs/evals/<skill>-<date>.md`: the prompt set with provenance, per-tier with/without pass rates, the paired test result, the canary outcome, and an explicit ship / don't-ship / ship-for-tier-X verdict.

**Playbook anchors.**
- `### Validate a paired A/B eval (same prompts, with vs. without an intervention) across multiple model tiers before shipping a knowledge-augmentation skill — confirm it moves pass rates and see where it doesn't.` — **Proven**, line 1320.
- `### Regularly read a sample of full transcripts and grader/evaluator outputs, not just aggregate pass rates, to catch broken or gameable graders — and when the evaluator diverges from the human quality bar, rewrite its prompt against the divergence cases (expect several rounds).` — **Proven**, line 1018.
- `### Calibrate LLM-based graders against human expert judgment before scaling, give them escape clauses ('return Unknown'), and split them into isolated, named, weighted single-dimension judges calibrated with few-shot scored examples rather than one monolithic rubric.` — **Proven**, line 1028.
- Supporting: `### Run agent ablations across multiple random seeds and compare with a paired, per-instance non-parametric test (Wilcoxon signed-rank)…` — Proven, line 1043 (single-run pass@1 varies 2.2–6.0pp, so a 2–3pp "win" is noise); `### Start an eval suite small — 20-50 tasks from observed real failures…` — Promising, line 1058; `### Define an automatable, objective failure signal for coding-agent evals…` — Promising, line 1386.

**Observed-gap evidence.** Line 19 ("Heavy security-review subagent usage: 20+ SDK security-review sessions per day per project, all 'completed-clean' — possibly low signal") — that is the textbook broken-grader signature the 1018 entry names, and nothing in the repo can currently distinguish "clean codebase" from "grader that talks itself into approving". Line 22 (soltero-skills ships releases through a PR-only `main` with a required validate check — a structural gate exists, an efficacy gate does not). Weaker support: line 14, where a council's verdicts were overridden as standing policy, i.e. the owner has already stopped trusting an ungraded LLM judge.

**Why not covered.** `creating-a-skill` enforces test-first, subagent-validated authoring — it validates that the skill does what its own SKILL.md says, which is a conformance check, not a with/without pass-rate delta across model tiers. `skill-gardener` audits lifecycle and staleness read-only and does not measure efficacy at all. `plan-review`/`prd-review` grade documents, not skills. `evidence-gate` verifies that claimed checks ran, not that the intervention works.

**Shape.** Skill + bundled Workflow (paired run matrix is a fan-out; the judge-calibration loop is a separate lane) + a deterministic scoring/aggregation script.

---

### 4. `live-artifact-verification`
**Rank basis:** observed gap + Proven.

**Trigger.** Fires before a UI- or API-facing change is called done, merged, or shipped — after `lean-verification`'s static evidence passes, and specifically when the change touched a screen, an endpoint, an auth path, or persisted state that tests only exercise through mocks.

**What it does.** Converts the change's acceptance criteria into a short constrained action list (navigate → act → assert observed state), drives the *running* artifact through it — a browser/Playwright pass for the Next.js console, a device/simulator pass for Expo, real HTTP calls for endpoints — and then verifies the **final environment state** rather than the UI's own success toast: query the DB for the row, read the log line, re-fetch the resource. It runs against a seeded local/staging target only, and refuses to drive a production target (handing off to `destructive-op-gate` if the user insists). Failures are reported as observed-vs-expected pairs, never as prose. Writes a short run record (action list, per-step observed state, screenshots/HAR paths) that `evidence-gate` can attach as receipt input.

**Playbook anchors.**
- `### Have the evaluator actually drive the running artifact (click through the UI, hit API endpoints, execute simulated user actions in a live environment) rather than judge from static source code or screenshots.` — **Proven**, line 1315. (The Verification Horizon result matters here: static judges are exploitable by verbose code that *looks* right; Anthropic's Playwright evaluator caught 8+ bugs across three QA rounds.)
- `### Verify the final environment state (files, DB contents, logs, page state) after a trial rather than trusting what the agent's transcript claims it did.` — **Proven**, line 1012.
- Supporting: `### Layer multiple grader types on the same task — deterministic tests, static analysis, LLM-rubric, tool-call verification, and outcome/state checks — since each catches a different failure class.` — Promising, line 1048.

**Observed-gap evidence.** Line 9 (`lean-verification` missed 08-22 and 08-29; the assistant relayed "all 19 tasks complete" and the next whole-branch review found a Critical — static claims survived a static gate), line 15 (the prod incident happened because the only way the destructive feature got exercised was on a real account; a seeded local drive path is the missing alternative), line 21 (production onboarding of real staff, i.e. flows whose failure is expensive and whose tests are mock-heavy).

**Why not covered.** `lean-verification` requires fresh evidence in the same message but treats a test/lint command as the evidence — it never drives the app. `evidence-gate` binds receipts to a hash; it does not produce the observation. `design-forge` and `mini-game-craft` do render-verification inside their own domains, which is precisely the evidence that generalizing it is worth doing rather than a reason to skip it. Claude Code's built-in `run` launches the app; it does not carry an action list, assertions, or a state check.

**Shape.** Skill + bundled script (action-list runner over Playwright / HTTP, plus the state-check queries). Ranked below #1–3 because its value depends on per-project drive harnesses existing, which is real setup cost.

---

### 5. `run-trajectory-audit`
**Rank basis:** observed gap + Promising.

**Trigger.** Fires after an autonomous or subagent-executed run finishes and before its result is relayed or merged — particularly a run that reports uniform success ("all N tasks complete", "completed-clean").

**What it does.** Audits the run's *trajectory* rather than its patch: the full command history, git operations, network calls, and files touched. It matches a shortcut pattern set — `--no-verify`, force pushes, tests deleted/`.skip`ped/weakened, assertions inverted, the unit under test mocked, snapshots blanket-updated, config loosened, or any command whose target resolved outside the intended worktree or to a non-local host — and reports matches as blocking findings. Trajectory evidence is exactly the evidence a diff review cannot see, which is why it is a separate pass rather than a stricter reviewer. The pattern set is treated as living: after each real escape, the newly-discovered pattern is appended, since a frozen pattern set decays as the agent gets better at working around it. Writes findings inline plus an append to the pattern set file; never edits code.

**Playbook anchors.**
- `### Add a trajectory-level behavior monitor that audits the full command/git/network history of an agent run (not just the final patch) for known shortcut patterns, and penalize matches, instead of relying on pass/fail test results alone.` — **Promising**, line 1360. (Cut hacked-resolved from 28.57% → 0.56% and raised clean-resolved 40.22% → 60.53% across 3 SWE-bench variants; caveat in-source that optimizing against a monitor can breed obfuscated hacking.)
- `### Treat the verifier as a living system: periodically re-derive its rules/pattern set from the current policy's trajectories rather than freezing it after design…` — Promising, line 1354.
- Supporting: `### Review a subagent's completed work with a lightweight git diff/show check rather than pulling all changed files into the lead's context…` — Watch, line 1511; `### Score agent behavior on a separate process-quality rubric (execution error, misunderstanding, omission, overaction, inefficiency, communication)…` — Promising, line 1370.

**Observed-gap evidence.** Line 9 (subagent success report relayed, Critical found later — the report was about outcomes; the trajectory would have shown the shortcuts), line 15 (a prod-touching command inside a test run is a trajectory fact, invisible in any diff), line 19 (20+ uniformly clean review runs/day — an audit of what those runs actually *executed* is the cheapest way to find out whether they did anything).

**Why not covered.** `lean-verification` verifies a subagent's claim against the diff — the diff is the artifact this skill deliberately does not look at. `dev-debrief` summarizes what happened across a day, read-only, after the fact, and produces observations rather than blocking findings. `audit-swarm` audits the repo, not a run. `lean-sdd`'s concurrent reviewer reviews code.

**Shape.** Skill + bundled deterministic scanner over the transcript/JSONL and `git reflog` (pattern matching is mechanical; only ambiguous hits need judgment).

---

### 6. `mcp-boundary-fuzz` *(lowest confidence — include only if #1–5 are funded)*
**Rank basis:** Promising, playbook-only.

**Trigger.** Fires before an MCP server (or any tool-mediation endpoint) is exposed beyond localhost — at the hardening step of `build-mcp-server`, or on "is my MCP server safe to publish".

**What it does.** Drives the server's untrusted transport boundary with eight malformed-input classes — random bytes, invalid UTF-8, wrong-shape and wrong-typed JSON, duplicate keys, forged/absent auth, truncated and oversized framing, and protocol-state abuse (decide-before-submit, double-decide, out-of-order) — and asserts two properties per class: it fails *closed* (never silently admits) and it stays alive. A planted canary request must survive every batch, and a valid round-trip must still succeed after each attack batch, so "hardened" can't mean "wedged". Writes `Docs/audit/mcp-fuzz-<date>.md` with per-class verdicts and any fail-open case as a blocking finding.

**Playbook anchors.**
- `### Fuzz the untrusted transport/protocol boundary of any tool-mediation server with malformed and hostile inputs (random bytes, invalid UTF-8, wrong-shape/typed JSON, forged MACs, duplicate keys, protocol-state abuse like decide-before-submit/double-decide, truncated/oversized framing) to confirm it fails closed and stays alive rather than crashing or silently admitting a bad request.` — **Promising**, line 1491.
- `### Don't treat an LLM's tendency to serialize consequential tool calls as a safety guarantee — verify enforcement independent of any model's disposition, including under adversarially injected instructions…` — Promising, line 1496.

**Observed-gap evidence.** None observed (playbook-only). Weak circumstantial support: line 22 notes the repo's MCP server is in the release flow with a pinned skill-count test, so an MCP surface is actively shipped.

**Why not covered.** `build-mcp-server` covers auth, secrets, and deploy — grepping it for `fuzz`/`malformed` returns nothing; its only fail-closed content is bearer-token comparison. `audit-swarm` is static analysis over the repo, not a live protocol driver. The delta is a running adversarial driver against the transport, which neither does.

---

## Rejected as already covered

| Playbook entry | Tier / line | Covered by |
|---|---|---|
| Snapshot the working tree via 'shadow' git commits… | Promising, 1073 | Claude Code `/rewind` ships this at harness level; no skill needed |
| Give a diff-only, context-isolated review agent … a pass on every PR before merge | Promising, 1099 | `lean-sdd` (fresh read-only reviewer per task, isolated context) + the `code-review` plugin skill |
| Build a CI pipeline with strict enforcement that blocks new commits from breaking previously-passing functionality | Promising, 1089 | Already live: PR-only `main` with required `validate` check (gap-evidence line 22) |
| Close a self-improvement loop: recurring meta-agent that patches the agent's own review skill via PR | Promising, 1760 | `skill-patcher` + `correction-compiler` + `dev-debrief`'s Sunday deep section |
| Persist project-specific knowledge across sessions as versioned repository artifacts | Promising, 1683 | `agent-handoff` (HANDOFF.md) + the `Docs/` convention in global CLAUDE.md |
| Structure multi-agent decomposition as manager/child map-reduce with explicit shared state | Promising, 1518 | `lean-sdd` (fresh implementer per task, file-based brief/report handover, ledger) |
| Route by capability/cost; escalate on low confidence | Promising, 1544 | Owner's `model-tier-standard` memory entry already fixes tier-per-role |
| Curate/filter what enters long-term memory; tiered memory roles | Promising, 1674 / 1678 | `memory-gardener` |
| Separate the agent that produces work from the agent that judges it | Promising, 1299 | `lean-sdd`, `plan-review`, `audit-swarm`, `memory-gardener` all already enforce proposer ≠ approver |

---

## Second list — existing skills a **Proven** entry says should be CHANGED

1. **`plan-review`** — `### Calibrate LLM-based graders against human expert judgment before scaling, give them escape clauses ('return Unknown'), and split them into isolated, named, weighted single-dimension judges calibrated with few-shot scored examples rather than one monolithic rubric.` (**Proven**, line 1028). Change: give each of the 6 dimensions a calibrated few-shot anchor set and an explicit `Unknown` escape clause, so a dimension the council cannot judge abstains instead of forcing a BLOCK — this is the direct fix for gap line 14 (BLOCKED verdicts converted to advisory as standing policy).

2. **`plan-review`** — `### Regularly read a sample of full transcripts and grader/evaluator outputs, not just aggregate pass rates, to catch broken or gameable graders — and when the evaluator diverges from the human quality bar, rewrite its prompt against the divergence cases (expect several rounds).` (**Proven**, line 1018). Change: when the fix→re-review loop fails to converge (gap line 14: 9 rounds across 3 fix-cycles), sample that council's own outputs and rewrite the reviewer prompt against the divergence cases, rather than re-running the same rubric a fourth time.

3. **`lean-sdd`** — `### Gate acceptance and continue/revise/terminate decisions on deterministic execution signals (tests, compilers, linters, static analysis, fuzzers), not the agent's self-report — never accept a patch on plausibility, and never end purely on iteration budget.` (**Proven**, line 1038). Change: the 3-round fix-loop cap currently terminates on iteration budget and adjudicates; make cap-exhaustion with a red deterministic signal resolve to revert/replan, never to "accept and move on" (gap line 9).

4. **`audit-swarm`** — `### Invest disproportionately in making the verifier/test harness near-perfect, since the agent trusts and optimizes against it even when wrong and will reward-hack a flawed signal.` (**Proven**, line 1033). Change: plant a known seeded defect as a per-run canary in the finder/skeptic pipeline so a "completed-clean" verdict is positive evidence the harness is live — gap line 19 records 20+ clean runs per day per project with no way to tell a clean repo from a dead grader.

5. **`creating-a-skill`** — `### Validate a paired A/B eval (same prompts, with vs. without an intervention) across multiple model tiers before shipping a knowledge-augmentation skill — confirm it moves pass rates and see where it doesn't.` (**Proven**, line 1320). Change: add a ship gate that requires a with/without pass-rate delta on ≥2 model tiers (delegating to candidate #3 `skill-ab-eval` if built); today the authoring gates check conformance to the skill's own spec, never whether the skill helps.

6. **`lean-verification`** — `### Have the evaluator actually drive the running artifact (click through the UI, hit API endpoints, execute simulated user actions in a live environment) rather than judge from static source code or screenshots.` (**Proven**, line 1315) with `### Verify the final environment state (files, DB contents, logs, page state) after a trial rather than trusting what the agent's transcript claims it did.` (**Proven**, line 1012). Change: for UI/API-facing changes, a green test run alone stops being sufficient evidence — require one live-driven observation plus a final-state check (delegating to candidate #4 if built).
