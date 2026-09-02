# Swarm Investigation Plan for Reconcile Drift

## Skills Consulted

This plan was created by consulting the following skills from `/tmp/ab-agent-swarm/skills-without/`:

### 1. **lean-debugging** (CONSULTED)
- **How it was used:** The entire investigation approach follows the lean-debugging discipline: investigate root cause before proposing any fix, trace bad values to their origin, test hypotheses minimally, and avoid symptom patching.
- **Impact on plan:** Guided the choice to run a parallel investigation (not a single fixing attempt), emphasized tracing to where cents are lost (not just where they appear), and the decision to avoid any code changes — purely investigative.
- **Key principle applied:** "NO FIX WITHOUT ROOT CAUSE — AND NO SYMPTOM PATCH AS A FALLBACK"

### 2. **dispatch-contract** (CONSULTED)
- **How it was used:** All six agent briefs follow the dispatch-contract pattern exactly: typed objectives, input file paths (not pasted contents), tool allowlists, pinned model tiers, return schemas with status vocabularies, and validation conditions.
- **Impact on plan:** Structured briefs ensure each agent knows what "done" means, how to return findings, and what the orchestrator will verify. The brief validator (`validate-brief.mjs`) passed all six, confirming they are dispatchable.
- **Key principle applied:** "The decision has to live in the artifact" — model tier, autonomy rules, verification checks are all written into the briefs, not kept in my head.

### 3. **audit-swarm** (EXAMINED BUT NOT USED)
- **Why not used:** audit-swarm is specifically for security/compliance audits with a planted canary defect. This is a quantitative math bug requiring tracing and calculation, not a security finding. The workflow is overkill and the canary pattern doesn't apply.
- **How it informed the plan:** Its emphasis on "verification before reporting findings" and "skeptic panel prevents false positives" informed the cross-check gates in plan.md, adapted to this domain (two agents independently finding the same loss → confirmed).

## Reasoning for the 6-Agent Swarm

### Problem Analysis
The reconcile.js billing service shows a repeating 4-day cycle of drift (2, 3, 4, 1 cents) over 21 days. This is not random; it's systematic. The problem could originate in:
1. **Rounding/precision losses** in the money.js math functions
2. **Ledger storage/retrieval** losing or corrupting transactions
3. **The reconcile loop logic** incorrectly calculating what to post
4. **The cron wrapper** passing wrong data or not fetching invoices
5. **Temporal patterns** in the data or external factors

No single agent can investigate all five areas thoroughly in one pass. A swarm allows parallel investigation with independent findings that can then be cross-checked.

### Parallel Investigation (Why Not Sequential)
A sequential investigation (Agent 1 reads money.js, then Agent 2 reads ledger, etc.) would be slower and risk missing patterns. The 4-day cycle is a major clue that suggests mathematical loss per invoice, which only becomes visible when multiple investigative threads compare notes.

**Parallel advantages:**
- Agent 5 (log patterns) identifies the 4-day cycle immediately
- Agents 1 and 3 independently predict what math would generate that cycle
- If both predict the same loss → confirmed without needing a fix-and-test loop

### Agent Model Allocation

| Model | Count | Assigned to | Justification |
|-------|-------|------------|---------------|
| Haiku | 4 | Threads 1, 2, 4, 5 | Focused reads; extract/analyze specific code sections or data. Cost efficiency for bounded problems. |
| Sonnet | 2 | Threads 3, 6 | Judgment + synthesis; careful step-by-step walkthrough (3) and system-wide architecture reasoning (6). |
| Fable | 1 | Orchestrator | Coordination and verification only; never assigned to work. |

This follows the dispatch-contract standard: haiku for reading, sonnet for engineering judgment, opus reserved (not needed here).

### Why This Is Not a 1-Agent Task

A single agent attempting to investigate all these areas sequentially would:
1. Read money.js and conclude "split loses cents" (correct but incomplete)
2. Skim the ledger (ledger is actually fine; wastes time on false leads)
3. Read the cron wrapper (it's 1 line; easy to miss the empty-array mystery)
4. Never extract the log pattern systematically (humans don't notice patterns without explicit analysis)
5. Miss connections between findings (is the loss in money.js or somewhere else?)

The swarm catches all five simultaneously and can cross-check.

### Verification Strategy (The Gate)

Once all six agents return, findings are verified before being reported:

1. **Math consistency:** Agent 1 identifies loss type. Agent 3 walkthrough quantifies it. If both say "split loses N cents per K-line invoice," it's confirmed.

2. **Pattern matching:** Agent 5 says drift cycles 2-3-4-1. Agent 1 predicts what loss pattern would cause that (if loss per invoice is proportional to line count, and line counts vary on a 4-day rotation, then drift would cycle too). If prediction matches observation → confirmed.

3. **Architecture closure:** Agent 6 maps data flow. If invoices come from a source, Agent 4 should have found it. If empty array is correct, Agent 6 explains why.

This is how the swarm prevents a false claim ("Agent 1 reports precision loss; therefore it's the root cause") from being spoken without evidence.

## Files Delivered

```
/tmp/ab-agent-swarm/ws-13/
├── swarm/
│   ├── plan.md           ← This plan; cross-check strategy, agent model justification
│   ├── dispatches.md     ← Exact Agent tool calls for all 6 dispatches
│   └── README.md         ← This document
├── dispatch/
│   ├── 01-money-math.md
│   ├── 02-ledger-analysis.md
│   ├── 03-reconcile-trace.md
│   ├── 04-cron-wrapper.md
│   ├── 05-log-patterns.md
│   └── 06-system-boundaries.md
└── [original service files]
```

All briefs have passed the `validate-brief.mjs` validator. The swarm is ready to dispatch.

## Execution Protocol

1. **Dispatch all 6 agents concurrently** using the calls listed in `dispatches.md`
2. **Collect all 6 returns** into `dispatch/returns/` directory
3. **Run verification checks** per the validation conditions in each brief
4. **Cross-check findings** per plan.md gates
5. **Write findings.md** with verified conclusions only; include audit trail of which agents found what and how it was checked
6. **Report root cause** only when at least two independent methods agree

## Expected Outcomes

If the investigation succeeds:
- The 4-day drift cycle will be explained by a specific mathematical or data-flow loss
- The loss will be quantified (e.g., "split() loses 0-3 cents per invoice depending on line count")
- Two agents will independently predict the loss matches the observed pattern
- A hypothesis will name the root cause: likely precision loss in split(), possibly ledger artifact, or possibly empty-invoice-array behavior

If any agent cannot complete:
- Return status will be BLOCKED or NEEDS_CONTEXT
- Orchestrator will re-read their brief and re-dispatch with refinement
- Re-dispatch will be included in the audit trail (verification-record.md)

## Cost Notes

- **Total dispatches:** 6 concurrent (all run in parallel)
- **Estimated model cost:** 4 haiku + 2 sonnet = equivalent of ~2.5 opus tasks (rough estimate)
- **Verification:** Low additional cost; orchestrator reads returns and runs commands to check claims
- **Time to verdict:** All 6 agents complete in parallel ~1 round; verification adds ~0.5 rounds; total ~1.5 orchestrator rounds

This is significantly faster and cheaper than a sequential "one agent investigates for an hour" approach, and provides verified findings instead of assertions.
