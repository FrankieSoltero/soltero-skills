---
name: agent-playbook
description: Use when doing agent-engineering work — writing CLAUDE.md/AGENTS.md, designing prompts or agentic loops, configuring subagents or workflows, choosing a coding-agent setup — or when asked for current coding-agent best practices ("what's the latest on context management", "how should I structure my agent's loop"); serves a living, tiered (Proven/Promising/Watch), source-linked playbook instead of from-memory advice. Also handles "update/refresh the agent playbook": runs a bundled research-sweep Workflow (arXiv + lab-blog + OSS lanes → dedupe vs source log → deep-read → skeptic tiering) and applies the diffs; update mode runs only in the soltero-skills repo.
---

# Agent Playbook

## Overview

Coding-agent research moves faster than model memory. Left to itself, an agent asked
for "current best practices" ships confident, plausible-sounding advice straight from
training data — no sources, no freshness check, no confidence label, and every claim
(stale, current, or speculative) delivered with the same certainty. And when an agent
does go research something, it self-judges its own findings ("I'll verify proportional
to stakes") and invents its own one-off log in whatever repo it happens to be in — a
format the next run, next repo, or next agent won't inherit.

This skill keeps ONE durable artifact — `references/playbook.md`, a tiered,
source-linked playbook — and two verbs: **advise** from it, and **update** it via a
bundled research-sweep Workflow whose Verify phase runs an independent skeptic per
claim (not a self-check by the agent that found it). **The user invoking update mode
is the explicit opt-in the Workflow tool requires.**

Core principle: **never state an agent-engineering best practice without its tier and
source; never let a single un-adversarial pass earn top-tier trust; never refresh the
playbook by improvised searching or inline self-vetting.**

## Advisor mode (default)

1. Read `references/playbook.md` (the topic sections relevant to the task).
2. Apply entries to the work at hand; name the tier every time you rely on one
   ("Promising, single source: …"). Distinguish playbook-backed guidance from your
   own judgment explicitly.
3. Treat tiers honestly: Proven → apply by default; Promising → apply, flag the
   single-source basis; Watch → mention, don't build on. **These are evidence tiers,
   not decision statuses** — don't conflate them with a project's own decision-log
   vocabulary (`Adopted`/`Watching`/`Rejected`). A repo's decision log records whether
   *that team* adopted something; it says nothing about how many independent sources
   back it. A single research pass earning "Adopted" in someone's log is not the same
   claim as "Proven" here — never treat one as evidence for the other.
4. "What changed lately?" → answer from `references/changelog.md`.
5. If the playbook has nothing on the topic, say so — recommend from your own
   knowledge, LABELED as untiered model memory, and suggest an update sweep.

## Update mode ("update/refresh the agent playbook")

Runs ONLY in the soltero-skills repo: if `skills/agent-playbook/` is not in the
working tree, STOP — tell the user to run it there (playbook changes ship via the
plugin release cycle).

1. **Preflight:** load WebSearch via ToolSearch; if unavailable, ABORT — never
   fill a sweep from memory. Get today's date: `date +%F`.
2. **Parse `references/source-log.md`:** watermark ("Last sweep") → `sinceDate`
   (bootstrap: if none, use ~6 months ago and `bootstrap: true`); every Key-column
   value PLUS every URL inside the Title-column links → `seenKeys` (lanes don't
   always key a source the same way twice; the URL is the stable identity).
3. **Invoke the Workflow — do not improvise your own sweep, and do not self-vet
   claims by spot-checking your own research:**

   ```
   Workflow({
     scriptPath: "${CLAUDE_SKILL_DIR}/workflows/update.mjs",
     args: { sinceDate, today, seenKeys, playbook: <full text of references/playbook.md>, bootstrap }
   })
   ```

   The workflow's own Verify phase runs one skeptic per candidate tactic, independent
   of the lane that found it, defaulting to demote on doubt — that gate is what makes
   a tier trustworthy. An agent judging the plausibility of its own findings ("this is
   the direct, low-context-cost fix, so I trust it") is not that gate, no matter how
   confident the reasoning sounds.
4. **Apply the result mechanically:**
   - each `edits[]` item: `add` → append `entryMarkdown` under its `## <topic>`
     heading (remove the "_No entries yet_" placeholder); `replace` → replace the
     entry whose `###` heading equals `replacesHeading`.
   - prepend `digest` below the changelog's description line (i.e., after the file's
     intro text, before any previous digests — newest first); update "Last sweep:" to
     today; append one table row per `logEntries[]` item, mapping: Key ← key,
     Title ← `[title](url)`, Evaluated ← today, Disposition ← disposition, Reason ← reason.
5. **Report:** show the digest (it must state which lanes ran) and commit the three
   reference files: `chore: playbook sweep YYYY-MM-DD`.

## When NOT to Use

- Reviewing a diff or debugging agent code — this skill is for practices, not review.
- Non-coding-agent research — use deep-research.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I know current best practices." | Your memory has a cutoff and no tiers. Read the playbook; label anything beyond it as untiered memory. |
| "I trust this because it's the direct, low-context-cost fix for the most common complaint…" | Plausibility is not evidence. A rhetorically sound argument from memory is still zero sources and zero freshness check — state the tier (or "untiered model memory"), don't let confident phrasing substitute for one. |
| "A quick web search is fresher than the playbook." | Unvetted and gone tomorrow. Playbook entries are skeptic-vetted and persistent. Search feeds sweeps, not answers. |
| "This paper looks great — adopt it now." | Single unvetted source = Watch at best, via a sweep, with a source-log disposition. Not straight into configs. |
| "It's Adopted in our decision log, so it's already vetted at the top tier." | A decision-status label tracks whether a team chose to use something, not how well-evidenced it is. One un-adversarial research pass granting "Adopted" doesn't earn "Proven" here — Proven requires the workflow's independent multi-source/skeptic path, not a project's own adoption call. |
| "I'll verify proportional to stakes — I'll spot-check the surprising ones myself." | Self-judged spot-checking by the same agent that gathered the claims is not verification. The workflow's skeptic pass is independent by construction; use it instead of vouching for your own research. |
| "I extended the existing log rather than building a parallel system." | Reasonable instinct, but if that log only existed because of what a prior run happened to leave in this workspace, the consistency was an accident — a fresh repo won't have it. The playbook is the one artifact built to actually persist across runs and machines; extend that, not whatever ad hoc file happens to be lying around. |
| "WebSearch is down; I'll fill the sweep from memory." | A sweep's value IS fresh evidence. Abort and say so. |
| "I'll sweep inline to save the workflow overhead." | Inline = no lanes, no dedupe, no skeptic gate, and the orchestrator burning its own context on research it should have delegated. Invoke the workflow or don't sweep. |

## Red Flags — STOP

- Stating an agent-engineering best practice with no tier and no source.
- Presenting a plausible-sounding, rhetorically confident claim as if confidence were evidence.
- Treating a decision-status label (Adopted/Watching/Rejected) as an evidence tier (Proven/Promising/Watch) — they measure different things.
- Granting top-tier trust from a single un-adversarial pass instead of the workflow's independent skeptic gate.
- Refreshing the playbook without invoking the bundled workflow.
- Inventing a new ad hoc log/format/cadence in the current repo instead of using the shared `playbook.md` / `source-log.md` / `changelog.md`.
- Adding anything to the playbook without a fetchable source link.
- Running update mode outside the soltero-skills repo.
- A digest that doesn't say which lanes ran.
