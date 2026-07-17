# Memory & Self-Improvement Skills Roadmap

**Date:** 2026-07-17
**Status:** Complete — sweep additions merged 2026-07-17; `memory-gardener` built on `feat/memory-gardener` (pending review/merge)
**Theme:** Close the gap between *capturing* knowledge (which `capture-lesson`,
`agent-handoff`, and `agent-playbook` already do) and *curating, verifying, and
retiring* it. Research consensus: append-only memory decays into noise, and
self-updating skills without an independent verifier grade their own homework.

Evidence labels follow the agent-playbook tiers (Proven / Promising / Watch).
Sources marked **unvetted** came from a fresh web sweep and have not yet passed
the playbook's skeptic gate — treat as Watch-at-best until the sweep tiers them.

---

## Cross-cutting design rule (applies to all four skills)

**The verifier stays outside the loop's write surface.** Any skill that edits
memory, its own reference files, or other skills must route proposed changes
through an independent check it cannot modify (skeptic subagent, held-out
validation, or human gate) — never self-assessment by the agent that proposed
the change.

- Playbook: *Promising* — hard controllability constraint outside the agent's
  edit surface ([Agentic Harness Engineering, arXiv 2604.25850](https://arxiv.org/html/2604.25850v1));
  threat independently documented (METR reward-hacking findings).
- Unvetted corroboration: EvoSkills co-evolutionary verification
  ([arXiv 2604.01687](https://arxiv.org/html/2604.01687v1)); Darwin Gödel Machine
  documented its agent hallucinating tool logs inside a self-improvement loop
  ([arXiv 2505.22954](https://arxiv.org/abs/2505.22954)).
- Existing in-repo precedent to reuse: `agent-playbook`'s skeptic gate,
  `audit-swarm`'s 3-skeptic majority-vote panel, `soltero-skills:finding-skeptic`
  agent.

---

## 1. `memory-gardener` — curation & consolidation of persistent memory

**Priority: 1 (highest-value gap)**

**Problem.** `capture-lesson`, `Docs/mistakes-and-fixes.md`, and Claude Code's
file-based memory directory are all append-only. Research says curation beats
accumulation: ungoverned history introduces noise, error propagation, and false
retrievals.

**What it does.** A periodic (scheduled or handoff-time, never inline) pass over
the memory surfaces of a project + the user-level memory directory:

- Dedupe and merge overlapping entries; delete falsified ones.
- Distill repeated episodic lessons into a single reusable rule.
- Track ACE-style helpful/harmful counters per entry; prune by usage.
- Update as discrete itemized edits — never wholesale rewrites (avoids
  "context collapse" / brevity bias).
- Route every proposed deletion/merge through a skeptic subagent before applying.

**Evidence.**
- Playbook *Promising*: curated/governed experience cards beat raw trajectory
  records, +4.65% SWE-bench Verified (MemGovern, via
  [Code as Agent Harness](https://arxiv.org/pdf/2605.18747)).
- Playbook *Promising*: tiered memory roles with periodic consolidation.
- Playbook *Proven*: episodic memory keyed off external feedback, not
  self-critique ([Reflexion](https://arxiv.org/abs/2303.11366) + tool-use survey).
- Unvetted: [ACE](https://arxiv.org/abs/2510.04618) (Generator/Reflector/Curator,
  itemized grow-and-refine, +10.6% agent benchmarks);
  [ReasoningBank](https://arxiv.org/abs/2509.25140) (distill strategies from
  successes AND failures); Letta sleep-time compute (background consolidation).

**Design notes.**
- Files + git only — no vector DB. Letta's benchmark (plain filesystem, 74%
  LoCoMo) and the playbook's *Promising* files-on-disk entry both support this;
  git history doubles as rollback against memory poisoning (MINJA-style
  attacks report >95% injection success — unvetted).
- Gate writes: never auto-consolidate content that originated from untrusted
  input (web pages, issue text) without flagging provenance.

---

## 2. `correction-compiler` — turn repeated user corrections into hooks

**Priority: 2 (most direct "improve the tool" win)**

**Problem.** User corrections today land as soft memory (CLAUDE.md lines,
lesson entries) that the model may ignore under context pressure. Hooks are
deterministic; memory is hope.

**What it does.** Detects when the user has corrected the agent for the same
class of mistake ≥2 times (from lessons log / transcripts), then proposes —
with user approval — a deterministic enforcement artifact instead of another
instruction line: a Claude Code hook (PreToolUse/PostToolUse), a lint rule, or
a CI check. Keeps a ledger mapping each generated hook back to the corrections
that justified it, so hooks are auditable and retirable.

**Evidence.**
- Unvetted (primary): [Compiling User Corrections into Runtime Enforcement for
  Coding Agents (arXiv 2606.13174)](https://arxiv.org/pdf/2606.13174) — compiled
  runtime rules beat soft prompt memories for corrections.
- Playbook *Promising*: distinguish read-only config from true agent-written
  memory ([Inside the Scaffold](https://arxiv.org/pdf/2604.03515)).
- Playbook *Watch*: add rules reactively after observed mistakes, not
  speculatively upfront ([Cursor best practices](https://cursor.com/blog/agent-best-practices)).

**Design notes.**
- Hook generation is a scope change to the harness — always human-approved,
  never auto-installed (hooks execute arbitrary shell).
- Compose with the existing `update-config` skill for settings.json mechanics.

---

## 3. `session-miner` — workflow induction from past transcripts

**Priority: 3 (the "agentic skill loop")**

**Problem.** Recurring multi-step procedures live only in transcript history;
each session rediscovers them. This is the procedural-memory gap — the least
mature, fastest-moving area of agent memory research in 2026.

**What it does.** Scans past session transcripts (offline, background) for
recurring successful procedures and drafts candidate skills or rule entries:

- Induce workflows from *successful* trajectories only (AWM pattern).
- Draft → route through `creating-a-skill`'s test-first quality gates →
  human review. Never auto-install.
- Also emits smaller artifacts when a full skill is overkill: a CLAUDE.md
  navigational line, a lessons-log rule, or a candidate for `memory-gardener`'s
  rule pool.

**Evidence.**
- Playbook *Promising*: maintain a persistent cross-task pool of reusable rules
  discovered during execution — TACO's ablation shows cross-task sharing is the
  component that beats baseline ([TACO](https://arxiv.org/abs/2606.19572)).
- Playbook *Watch*: two-phase background pipeline — cheap extraction, then a
  separate consolidation pass (Codex CLI pattern, via
  [Inside the Scaffold](https://arxiv.org/pdf/2604.03515)).
- Unvetted: [Agent Workflow Memory (arXiv 2409.07429)](https://arxiv.org/abs/2409.07429)
  (+51.1% relative on WebArena); [Memp (arXiv 2508.06433)](https://arxiv.org/abs/2508.06433)
  (procedural memory build/retrieve/update; transfers from strong to weak
  models); [CODESKILL (arXiv 2605.25430)](https://arxiv.org/pdf/2605.25430)
  (extract/evolve/prune loop for coding-agent skills);
  [SkillWeaver (arXiv 2504.07079)](https://arxiv.org/abs/2504.07079)
  (practice-then-distill, +54.3% transfer to weaker agents).

**Design notes.**
- Lineage: this is Voyager's skill library ([arXiv 2305.16291](https://arxiv.org/abs/2305.16291))
  with SKILL.md instead of executable JS.
- Mine successes keyed to external outcomes (tests passed, task completed),
  not self-judged "that went well".

---

## 4. `skill-gardener` — lifecycle & staleness management for installed skills

**Priority: 4 (cheapest; weakest evidence; real felt pain)**

**Problem.** Skills are natural-language instruction content with no version
pinning and no CI to catch drift — confidently-wrong guidance accumulates
silently. `agent-playbook` exists precisely because knowledge rots; the rest of
the skill library has no equivalent mechanism.

**What it does.** A periodic audit over installed/authored skills:

- Freshness metadata per skill (last verified date, external claims inventory).
- Spot-check external claims (pinned APIs, URLs, version numbers) against
  reality; flag drift.
- Usage-informed retirement proposals: unused agent-created content goes
  stale → archive candidate (decay-policy pattern; human decides).
- Report, don't auto-edit — output is a triage list.

**Evidence.**
- Playbook *Watch*: treat installed skills as content requiring lifecycle
  management; no auto-update story means stale info silently accumulates
  ([Google — agent skills](https://developers.googleblog.com/closing-the-knowledge-gap-with-agent-skills/)).
- Unvetted: [Dynamic Agent Skills lifecycle survey (arXiv 2607.10113)](https://arxiv.org/html/2607.10113)
  — first academic treatment of skill staleness/retirement with concrete decay
  policies; [Agent Skills survey (arXiv 2602.12430)](https://arxiv.org/html/2602.12430v4)
  — skill supply-chain security (poisoned skills, injection via reference files).

**Design notes.**
- A skill that edits other skills is writing to its own trust boundary —
  report-only output plus human apply keeps the verifier rule intact.
- Reuse `build-mcp-server`'s pin-the-verified-API pattern for claim inventories.

---

## Candidates from the 2026-07-17 playbook sweep

The sweep (12 sources, 88 skeptic-vetted entries, commit `32b1975`) landed two
new skill candidates and several design deltas for the four above. All tiers
below are real playbook tiers, not fresh-source guesses.

### 5. `skill-patcher` — closed-loop meta-agent that patches skills via PR

**What it does.** A recurring meta-agent that synthesizes accepted review
feedback and human corrections/overrides across many sessions/PRs and opens a
PR that patches the relevant skill/ruleset itself — not just logs findings —
so the next run automatically incorporates the update. The rule/skill file
lives in a repo where the patching PR goes through normal review (the review
gate IS the verifier outside the write surface).

- Playbook *Promising*: the closed self-improvement loop pattern (Warp
  self-improving code review).
- Playbook *Watch*: structured rule schema (Rule ID, Trigger Origin, Scope,
  Constraint, Rationale, Traced-To); refine rules in place rather than adding
  overlapping ones; specific-subsumes-general periodic review.
- Relationship to the four: this is the natural v2 of `correction-compiler`
  (which handles single corrections reactively) — the meta-agent closes the
  loop across many corrections. Build `correction-compiler` first; graduate to
  this once there's a corrections ledger to synthesize from.

### 6. `evidence-gate` — hash-bound, fail-closed verification receipts

**What it does.** For lifecycle-advancing claims ("tests pass", "reviewed",
"done"), require machine-checkable evidence instead of the agent's own report:
verdicts bound to a hash of the current source tree (stale-tree evidence
auto-fails), verdicts as structured receipts a later gate can re-verify, and
every gate defaulting to fail-closed on missing/stale/unauthorized evidence.

- Playbook *Promising*: fail-closed lifecycle gates; verdicts bound to a
  source-tree hash, never accepting the agent's own "all tests passed" as
  evidence (Proof-or-Stop, arXiv 2607.14890).
- Playbook *Promising* (cost honesty): expect and report ~1.2x-3.8x token
  overhead from evidence gating rather than hiding it.
- Relationship to the four: generalizes `memory-gardener`'s verified-by
  receipts into a repo-wide primitive; `skill-gardener` and `skill-patcher`
  would both consume it.

### Design deltas for the original four

- **`memory-gardener`**: admit entries into *shared/exportable* memory only
  when their originating commit lands on the default branch — merge as the
  external verifier (*Watch*); triage memory queries — present-tense "what
  does the code do now" goes to grep/HEAD, past-tense/"why" goes to the
  memory ledger (*Watch*, git-as-memory arXiv 2607.14390); fail loudly when a
  MEMORY.md write would exceed its read limit instead of silently truncating
  (*Watch*).
- **`correction-compiler`**: adopt the structured rule schema with Traced-To
  provenance linking each rule to the correction that justified it (*Watch*);
  refine-in-place over accumulating overlapping rules (*Watch*).
- **`skill-gardener`**: the sweep strengthened its basis — session-start
  automated validation of skill frontmatter, well-formed skill dirs, and
  freshness dates on knowledge docs is now a tiered entry (*Watch*, Self-
  Improving Behavioral Rules arXiv 2607.13091); add freshness-date frontmatter
  to reference docs as the mechanism it audits.
- **`capture-lesson` (existing skill, small change)**: when synthesizing a
  lesson, also capture how the agent should *validate* its own suggestion
  before flagging it, not just what to flag (*Watch*).
- **`agent-handoff` (existing skill, validation)**: the ephemeral-handoff vs
  permanent-rules vs chronological-log split it implements is now
  independently corroborated (*Promising*) — no change needed, evidence
  upgraded.

---

## Sequencing

1. `memory-gardener` — standalone value immediately; establishes the
   skeptic-gated-edit pattern the others reuse.
2. `correction-compiler` — small, high-leverage, composes with `update-config`.
3. `session-miner` — depends on the gardener's rule pool and
   `creating-a-skill`'s gates being the landing zone for drafts.
4. `skill-gardener` — batch audit; can piggyback on sweep cadence.

Each build starts with `superpowers:brainstorming`, then
`soltero-skills:creating-a-skill` (test-first, subagent-validated authoring).
