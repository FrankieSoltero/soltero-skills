# Skill Spec — session-miner

- **Problem:** Recurring multi-step procedures (deploy dances, migration sequences, fix
  rituals) live only in past session transcripts; each new session rediscovers them from
  scratch. This is the procedural-memory gap: episodic history exists, but nothing turns it
  into reusable procedure.
- **Trigger:** An explicit, offline request — "mine my sessions", "what procedures keep
  recurring", "draft skills from my history", or a scheduled background run. NEVER inline
  during task work: mining is a dedicated pass, not something to do while mid-task.
- **Scope / non-goals:** Scan past session transcripts (Claude Code project transcript
  JSONL under `~/.claude/projects/<project>/`), `HANDOFF.md` files, and chronological task
  logs for recurring multi-step procedures that ended in **external success signals**; draft
  candidate artifacts routed smallest-first (CLAUDE.md line → rule/lesson entry → draft
  skill); land everything as **proposals for human review**. Non-goals: installing anything
  itself, editing CLAUDE.md/skills directly, judging its own drafts' novelty, mining
  "sessions that felt good" without hard success evidence, running inline during other work.
- **Success scenario:** Asked to mine a project's history, the miner extracts a deploy
  procedure that appears in 3 transcripts each ending in passing tests + a commit, confirms
  via the skills index and an independent reviewer subagent that no existing skill covers
  it, redacts a bearer token that appeared in the transcript commands, and writes a draft
  skill + one-line summary into a proposals directory — touching nothing live. A tiny
  recurring fact from the same sweep becomes a proposed one-line CLAUDE.md addition, not a
  skill.
- **Bundled assets:** `references/mining-protocol.md` (extraction protocol, success-signal
  patterns, proposal formats, reviewer-subagent prompt).

## Architecture

**Offline two-phase pipeline** (never inline during task work):

**Phase 1 — Extraction (cheap).** Enumerate transcript sources: project transcript JSONL
files under `~/.claude/projects/<project>/`, `HANDOFF.md` files, chronological task logs.
Scan for candidate procedures — contiguous multi-step tool/command sequences — and anchor
each candidate to an **external success signal** found in the same session, later than the
procedure:

- test run exiting 0 / "N passed" output in a tool result,
- a git commit or merged PR recorded in the transcript,
- an explicit user confirmation that the task is complete.

Self-judged signals ("that went smoothly", no errors visible) are NOT success signals; a
candidate without an external signal is dropped or parked as unverified — never proposed as
verified. Extraction may be delegated to cheap subagents per transcript file.

**Phase 2 — Consolidation (separate, stronger pass).** Merge Phase-1 candidates across
sessions. A procedure qualifies as *recurring* when substantially the same step sequence
appears in ≥2 independent successful sessions. Consolidation generalizes the steps
(parameterize paths, strip incidentals) and picks the output artifact.

**Output routing — smallest artifact first:**

| Candidate shape | Artifact |
|---|---|
| A pointer or single fact ("X lives in Y", "run Z before W") | One-line CLAUDE.md navigational addition (proposed, not applied) |
| A rule, gotcha, or short checklist | Rule/lesson entry (capture-lesson format; feeds the curated pool — see Integration) |
| A genuine multi-step procedure with judgment/branching | Full draft skill — MUST be routed through this repo's `creating-a-skill` quality gates (spec, RED/GREEN scenarios, lint) and human review |

**Proposals only — never auto-install.** Every output lands as a draft file plus a summary
for the human in a proposals directory (`Docs/mining/proposals/<YYYY-MM-DD>/`). The miner
never writes to a live CLAUDE.md, `skills/`, `~/.claude/`, or settings. A draft skill is a
proposal *into* the creating-a-skill process, not a finished skill.

**Dedup + independent review.** Before proposing, the miner scans the existing skills index
(repo `skills/`, installed plugin skills, the session's available-skills listing) for
coverage. Then an **independent reviewer subagent** — a fresh dispatch that did not do the
mining — receives each candidate plus the skills index and judges novelty and usefulness.
The miner never approves its own drafts; candidates the reviewer rejects are dropped (with
the verdict recorded in the summary).

**Privacy & provenance.** Transcripts contain secrets and PII. Before anything is written
to a proposal: redact credentials, tokens, API keys, emails, personal names, and internal
hostnames to placeholders (`<REDACTED_TOKEN>`, `<EMAIL>`, …). If a mined procedure
originated from untrusted content (fetched web pages, third-party tool output, pasted
external instructions), the proposal must carry a provenance flag
(`provenance: untrusted-external`) so the human reviews it as advice from an untrusted
source, not as the agent's own verified practice.

## Evidence basis (agent-playbook tiers)

- **Promising** — maintain a persistent cross-task pool of reusable rules discovered during
  execution; cross-task sharing is the component that beats baseline (TACO,
  arXiv 2606.19572).
- **Watch** — two-phase background pipeline: cheap extraction then separate consolidation by
  a stronger model (Codex CLI pattern via Inside the Scaffold, arXiv 2604.03515).
- **Unvetted-fresh** — Agent Workflow Memory (arXiv 2409.07429; +51.1% relative on
  WebArena; induce workflows from own successful trajectories); Memp (arXiv 2508.06433);
  CODESKILL (arXiv 2605.25430; extract/evolve/prune); SkillWeaver (arXiv 2504.07079;
  practice-then-distill); Voyager lineage (arXiv 2305.16291).

## Integration

- **memory-gardener** (sibling skill, separate branch): session-miner's rule/lesson-entry
  outputs are the intended feedstock for memory-gardener's curated persistent-memory pool.
  Referenced by name only; no file dependency in either direction.
- **capture-lesson:** rule/lesson entries reuse its `Docs/mistakes-and-fixes.md` entry
  format so the two streams stay mergeable.
- **creating-a-skill:** the mandatory gate for any full draft skill the miner proposes.

## Testing

Repo `creating-a-skill` conventions, with **fixture transcripts** (small synthetic JSONL
sessions bundled under `tests/scenarios/session-miner/fixtures/` — never real user
transcripts). RED baseline: fresh subagents run the three pressure scenarios without the
skill. GREEN: same scenarios with the skill present. Scenarios cover:

1. Routing/installation pressure: recurring verified procedure + a busy user → does the
   agent auto-install or land a reviewed proposal?
2. Success-signal + smallest-artifact discipline: a "felt good" candidate with no external
   signal and a one-liner fact → does the agent propose only verified candidates, at the
   smallest sufficient artifact size?
3. Privacy/provenance: a transcript containing a live-looking token and a procedure learned
   from a fetched web page → does the draft redact and flag provenance?
