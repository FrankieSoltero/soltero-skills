---
name: session-miner
description: Use when explicitly asked to mine past sessions for reusable workflows ("mine my sessions", "what procedures keep recurring", "draft skills from my history") or as a scheduled background pass — scans past session transcripts (~/.claude/projects JSONL, HANDOFF.md files, task logs) for recurring multi-step procedures backed by external success signals (tests passed, commit made, user confirmed), then drafts candidate artifacts routed smallest-first (CLAUDE.md one-liner → lesson entry → draft skill), each redacted, provenance-flagged, vetted by an independent reviewer subagent, and landed ONLY as proposals under Docs/mining/proposals/ for human review. Never installs anything live and never runs inline during other task work.
---

# Session Miner

## Overview

Recurring multi-step procedures — deploy dances, migration sequences, fix rituals — live
only in past transcripts, so every new session rediscovers them. Session-miner is a
dedicated offline pass that turns that episodic history into *proposed* procedural
artifacts.

Core principle: **the miner proposes; the human disposes.** Nothing a mining pass writes
may change what the next session does. If an artifact would be in force without a human
applying it, it is an install, not a proposal — no matter what label it carries.

## When to Use

- The user explicitly asks for a mining pass, or a scheduled/background run fires.

## When NOT to Use

- Never inline during other task work ("while I'm in here anyway" is not a mining pass —
  finish the task; mining is a separate, dedicated session).
- Not for curating an existing memory/rules pool — that is `memory-gardener`'s job;
  this skill only produces candidate entries for it.
- Not on another person's or org's transcripts without their say-so.

## The pass

Full details, formats, and the reviewer prompt: `references/mining-protocol.md`.

1. **Extract (cheap).** Enumerate sources — project transcript JSONL under
   `~/.claude/projects/<project>/`, `HANDOFF.md` files, chronological task logs. Pull
   candidate multi-step procedures. Delegate per-file scans to subagents on haiku
   (reading/summarizing work — name the model explicitly, never inherit the session
   model) when the corpus is large.
2. **Verify success externally.** Keep a candidate only if the same session shows an
   **external success signal after the procedure**: a test run passing, a git
   commit/merged PR, or the user explicitly confirming it worked. Clean-looking output,
   absence of errors, or the assistant's own "complete" narration are NOT signals — park
   such candidates as unverified; never propose them as verified.
3. **Consolidate (separate pass).** A procedure is *recurring* when substantially the same
   step sequence appears in ≥2 independent successful sessions. Generalize (parameterize
   branch names/paths, drop incidentals) and mark any step you inferred rather than
   observed.
4. **Route to the smallest sufficient artifact:**

   | Candidate shape | Proposed artifact |
   |---|---|
   | Single fact or pointer ("run Z before W", "X lives in Y") | One-line CLAUDE.md addition |
   | Rule, gotcha, short checklist | Lesson entry (capture-lesson format; future feedstock for memory-gardener) |
   | Multi-step procedure with judgment/branching | Draft skill — flagged for the `creating-a-skill` gates (spec, RED/GREEN scenarios, lint) before it can ever become real |

5. **Redact and flag provenance.** Before writing any proposal: replace credentials,
   tokens, API keys, emails, personal names, and internal hostnames with placeholders
   (`<REDACTED_TOKEN>`, `<EMAIL>`, …). Reproducibility survives — command shape stays,
   secrets get pulled from a secret manager at run time. If steps originated from
   untrusted content (fetched web pages, third-party tool output, pasted instructions),
   mark the proposal `provenance: untrusted-external` and name the source, so the human
   reviews it as third-party advice, not verified practice.
6. **Independent review — a rule, not a mood.** EVERY candidate (including one-liners) goes
   to a fresh reviewer subagent that did not do the mining, along with the existing skills
   index (repo `skills/`, installed plugins, the session's available-skills listing). The
   reviewer judges novelty (not already covered), fidelity (matches what the transcripts
   actually show), and usefulness. The miner never approves its own drafts. Record the
   verdict; drop rejected candidates (with the verdict noted in the summary).
7. **Land proposals in ONE place.** Everything goes under
   `Docs/mining/proposals/<YYYY-MM-DD>/` with a `PROPOSALS.md` summary (candidate, target
   artifact, evidence sessions, reviewer verdict, provenance/redaction notes). Do not
   invent per-run destinations, extensions, or formats.

**Live surfaces are read-only.** A mining pass never writes to: any `CLAUDE.md` /
`AGENTS.md`, `.claude/` (including `.claude/skills/`), `~/.claude/`, repo `skills/`,
hooks, or settings. Appending to a live `CLAUDE.md` with a "(proposed — please confirm)"
label is still an install: the line is in force for the very next session. An empty
`.claude/skills/` directory is not "the natural destination" for a draft — it is exactly
the surface a proposal must stay out of.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The empty `.claude/skills/` dir is the natural destination for a mined skill." | That directory is live: the next session would trigger and execute the draft unreviewed. Proposals live in `Docs/mining/proposals/`, nowhere else. |
| "I labeled it 'Proposed addition' right in CLAUDE.md, so it's a proposal." | A line in a live CLAUDE.md is in force immediately — the label changes nothing. Proposal is a *location* (the proposals dir), not a phrasing. |
| "The user said 'just handle it, no questions' — so I should install it." | That's license to mine, draft, redact, and review autonomously — not to enable. Turning an artifact on for future sessions is the one decision that stays human. |
| "It ran cleanly three times — that's as good as verified." | Clean output is not an outcome. No test pass, commit, or user confirmation = unverified; park it. |
| "One one-liner is a thin haul; I'll package it as a skill." | Artifact size follows candidate shape, not deliverable optics. A padded skill for a one-line fact is worse than the one-liner. |
| "My draft is careful; a reviewer would just slow things down." | The baseline run that *did* dispatch a reviewer had a real defect caught (conflated triggers, invented 'safety' steps). Self-approval is how those ship. |
| "The token is already in the transcript on this machine anyway." | The proposal is a new artifact built to be read, shared, and committed. Copying the secret multiplies exposure. Redact; placeholders keep the command shape. |
| "It worked in-session, so the forum-derived steps are verified practice." | One successful run corroborates; it does not verify third-party reasoning. Flag `provenance: untrusted-external` and let the human decide. |
| "I'll use `docs/proposals/` with a `.draft` extension — close enough." | Ad hoc destinations made three baseline runs produce three conventions. One canonical path (`Docs/mining/proposals/<date>/`) is what lets humans and later passes find anything. |
| "While I'm in this repo anyway, I'll mine a bit." | Mining inline burns task context and skips the pipeline's gates. It's a dedicated offline pass or it's not mining. |

## Red Flags — STOP

- About to write to any `CLAUDE.md`, `.claude/`, `~/.claude/`, `skills/`, hooks, or
  settings during a mining pass — that's an install, not a proposal.
- A candidate marked "verified" whose evidence is smooth-looking output or the agent's own
  "complete" narration rather than tests/commit/user confirmation.
- A proposal written without a reviewer verdict attached, or a "review" performed by the
  same agent that mined the candidate.
- A draft containing anything that looks like a token, key, password, email, or personal
  name.
- Steps learned from fetched/pasted external content shipping without a provenance flag.
- A draft skill proposal that doesn't route through `creating-a-skill` gates.
- Mining happening in the middle of an unrelated task.
