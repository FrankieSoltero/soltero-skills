# Skill Spec — memory-gardener

- **Problem:** The project's persistent memory surfaces are append-only and decay into
  noise: `Docs/mistakes-and-fixes.md` (written by `capture-lesson`), the user-level Claude
  Code memory directory (`~/.claude/projects/<project>/memory/` with its `MEMORY.md`
  index), and agent-written sections of project `CLAUDE.md`. Duplicates accumulate,
  falsified lessons keep steering behavior, repeated episodic entries never become a
  reusable rule, and nothing tracks whether an entry ever helps. Worse, when an agent does
  "clean up" memory, it typically rewrites files wholesale (context collapse) and approves
  its own deletions (grading its own homework).
- **Trigger:** At handoff-time (composes with `agent-handoff`) or on a schedule
  (`/schedule`, `/loop`). **Never inline during normal task work** — noticing messy memory
  mid-task means noting it for the next gardening pass, not gardening now.
- **Scope / non-goals:**
  - Operations over the three memory surfaces above: dedupe/merge overlapping entries;
    delete falsified entries; distill ≥3 repeated episodic lessons into one reusable rule;
    maintain ACE-style `helpful`/`harmful` usage counters per entry; prune by usage.
  - All changes land as **discrete itemized edits** (one entry added/removed/replaced per
    edit) — never a wholesale regeneration of a memory file.
  - **Hard rule — verifier outside the write surface:** every proposed deletion, merge, or
    distillation is routed through an independent skeptic subagent
    (`soltero-skills:memory-skeptic`, modeled on `finding-skeptic`, defaults to REJECT)
    before being applied. The agent that proposed an edit never approves it. Skeptic-
    rejected edits are dropped or surfaced for human review — never applied anyway.
  - **Provenance gating:** entries that originated from untrusted input (web pages, issue
    text, third-party docs) are never auto-consolidated; they are flagged with provenance
    and surfaced for human review (memory-poisoning defense).
  - Files + git only — no vector DB, no external store. Each gardening pass is committed
    so git history is the rollback mechanism.
  - Non-goals: capturing new lessons (that's `capture-lesson`), session handoff docs
    (that's `agent-handoff`), editing skills themselves (future `skill-gardener`),
    retrieval/search infrastructure.
- **Success scenario:** At the end of a long session the agent is asked to hand off. It
  runs a gardening pass: inventories the memory surfaces, drafts an itemized edit plan
  (2 merges, 1 deletion of a falsified lesson, 1 distillation of three repeated timeout
  lessons into a rule), dispatches each destructive edit to `memory-skeptic` for
  verification, applies only the approved edits one at a time, decrements/increments
  usage counters, quarantines a web-sourced entry for human review instead of merging it,
  and commits the pass as a single reviewable git commit.
- **Bundled assets:** `references/operations.md` (edit-plan format, counter and provenance
  conventions, skeptic dispatch protocol); `agents/memory-skeptic.md` (repo-level agent,
  shared pattern with `finding-skeptic`).

## Design source & evidence

Design follows `docs/plans/2026-07-17-memory-skills-roadmap.md` §1 and its
"Cross-cutting design rule" (a local planning draft in the main checkout, not yet
committed to the repo — commit it alongside or with the roadmap's own PR). Evidence tiers use the agent-playbook vocabulary:

- Playbook **Promising** — curated/governed experience cards beat raw trajectory records,
  +4.65% SWE-bench Verified (MemGovern, via
  [Code as Agent Harness, arXiv 2605.18747](https://arxiv.org/pdf/2605.18747)).
- Playbook **Promising** — tiered memory roles with periodic consolidation.
- Playbook **Proven** — episodic memory keyed off external feedback, not self-critique
  ([Reflexion, arXiv 2303.11366](https://arxiv.org/abs/2303.11366)).
- Playbook **Promising** — hard controllability constraint outside the agent's edit
  surface ([Agentic Harness Engineering, arXiv 2604.25850](https://arxiv.org/html/2604.25850v1));
  threat independently documented (METR reward-hacking findings).
- **Unvetted-fresh** (Watch-at-best until the playbook skeptic gate tiers them):
  [ACE, arXiv 2510.04618](https://arxiv.org/abs/2510.04618) — itemized grow-and-refine
  with helpful/harmful counters; avoid monolithic rewrites ("context collapse");
  [ReasoningBank, arXiv 2509.25140](https://arxiv.org/abs/2509.25140) — distill reusable
  strategies from successes AND failures; Letta sleep-time compute — consolidation as a
  background/off-peak activity, never inline; MINJA memory-poisoning (>95% injection
  success) — motivates provenance gating and gated writes.

## Why a dedicated `memory-skeptic` agent (vs reusing `finding-skeptic`)

`finding-skeptic`'s identity and lens vocabulary are audit-specific: it refutes a claimed
*code defect* at a claimed *severity*. Memory-edit verification asks different questions —
does a merge lose a distinct constraint, is a deletion's "falsified" claim actually
evidenced, does a distilled rule over-generalize beyond its episodes, is provenance
trusted. `memory-skeptic` reuses `finding-skeptic`'s non-negotiables verbatim (read-only,
verify against actual files, default to reject) with memory-specific refutation criteria.
