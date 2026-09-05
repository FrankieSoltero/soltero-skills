The following skill is loaded and applies to this task (its bundled files live under CLAUDE_SKILL_DIR=/Users/franciscosoltero/Desktop/Code/soltero-skills/skills/docs-standardizer and you may read and run them):

```markdown
---
name: docs-standardizer
description: Use when asked to document a repo, write or refresh a CLAUDE.md / AGENTS.md for a project, make a codebase easier to onboard to, standardize or clean up its docs, or outline what documentation it has ("document this repo", "an agent keeps getting lost in this repo", "the docs are out of date", "write a CLAUDE.md for this project", "apply our docs standard", "onboarding docs") — brings the repo to ONE user-scope documentation standard (~/.claude/docs-standard.json, bootstrapped on first use) aimed at agent onboarding. Bundled scripts inventory every doc surface with its command and path claims, then the skill reconciles stale and duplicate docs, writes the entry doc under a line budget, generates the required doc set from the tree, and indexes it, one commit per category on a branch behind a bundled verifier. Whole-repo, agent-facing docs; not API reference, product docs, or a diff review. For advice on how to design agent instructions, use agent-playbook.
---

# Docs Standardizer

## Overview

A capable agent asked to "document this repo" already writes decent docs: it reads the
manifest, catches the README's stale `npm run dev`, and explains the non-obvious mechanism. That
is not the gap. The gap is that **every run produces a different result**: one writes an
84-line AGENTS.md with a CLAUDE.md pointer, the next a 62-line CLAUDE.md plus a root TODO file,
the next an 87-line CLAUDE.md with its own headings; none consults or records a standard at user
scope ("project-specific material belongs in the repo, not at user scope"), none works on a
branch, each commits once to `main`, none verifies its own output, none produces the required
set (index, architecture, conventions, decisions, lessons scaffold, open questions), and under
"just fix the README, fast" the standard gets read, enumerated, and deferred to a TODO.

Core principle: **one standard, read before writing, at user scope — every repo gets the same
shape; every command and path claim in the docs is checked by the bundled verifier before a
commit; apply is serial, one category per commit, on a branch; and the standard, not the
requester's phrasing, is the scope — scoping down is the user's call, said out loud.**

## When to Use

- "Document this repo", "make this easier to onboard to", "write/refresh the CLAUDE.md or
  AGENTS.md", "the docs are out of date", "standardize the docs", "what docs does this repo
  have", "apply our docs standard".

## When NOT to Use

- Generating API reference (typedoc, sphinx), user-facing product docs, or marketing copy.
- Reviewing a diff, or changing code. This skill writes markdown only.
- Recording a lesson after a fix — `capture-lesson` owns `mistakes-and-fixes.md` entries; this
  skill only scaffolds the file.
- Advice on agent-instruction design in general — `agent-playbook`.

## Guardrails (every time, in this order)

1. **Clean tree, new branch.** Refuse a dirty tree; create `docs/standardize`.
2. **Standard first.** Run the bootstrap. `--home` is `~` unless the task names a stand-in:

   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/docs-standard-init.mjs --home "$HOME" --repo .
   ```

   `CREATED` → it was bootstrapped from the bundled default (docs-root name taken from the
   user's global CLAUDE.md when it declares one). Show the file and **pause for review before
   applying it** — it is the standard for every repo the user works in. `EXISTS` → the printed
   JSON is the effective standard (user file + any `.docs-standard.json` project override).
   Never write the standard by hand, and never tailor it to this repo; a repo-specific need goes
   in the project override, which may set only `docsRoot`, `exclude`, `entryDoc.file`, and
   *additional* `required` entries.
3. **The verifier is the gate.** After every category:

   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/docs-verify.mjs . --home "$HOME"
   ```

   GREEN → commit. RED → fix the finding or drop the claim; never commit red. Finding codes and
   the fix for each are in `reference.md`.

## Phase 1 — Inventory (script, read-only)

```bash
node ${CLAUDE_SKILL_DIR}/scripts/docs-inventory.mjs . --home "$HOME"        # outline
node ${CLAUDE_SKILL_DIR}/scripts/docs-inventory.mjs . --home "$HOME" --json # machine form
```

It lists every doc surface (entry docs, docs roots, ADRs, changelog, handoff), each doc's
headings and its command/path claims with resolution status, the command evidence (manifest
scripts, Makefile/justfile targets), and coverage against the standard. **The outline goes in
the deliverable verbatim** — it is the "what documentation patterns does this repo have"
answer, and it is the before-picture for the after-picture the verifier prints at the end.
Read the code the inventory points at before writing: entry points, anything loaded by
filename or string key, the rule a comment calls "the only allowed", the env vars nothing reads.

## Phase 2 — Apply (serial, one commit per category, verifier after each)

1. **Reconcile.** Fix every stale claim in an existing doc where the truth is mechanical (the
   manifest, the tree); a claim about something that no longer exists is either removed or kept
   as a warning on one line with the standard's `absentMarker` (`(does not exist)`) so the
   verifier reads it as absence, not a claim. Two docs that disagree get one owner and a
   pointer. Docs roots: a second distinct root (`doc/`, `documentation/`) is merged into the
   standard's root with `git mv`, links fixed; a root that differs from the standard's **only by
   case** (`docs/` vs `Docs`) is kept and recorded as `docsRoot` in `.docs-standard.json` with
   the reason — never a rename on a case-insensitive filesystem unless the user asks. Nothing is
   deleted whose still-true content is not moved first.
2. **Entry doc.** `entryDoc.file` (CLAUDE.md by default) with exactly the standard's sections:
   Purpose, Commands, Layout, Where to look, Conventions, Docs — under `maxLines`. It is an
   index with pointers, not the place for depth: the request-flow diagram, the plugin mechanism
   explanation, the env-var table go to the docs root. The mirror (AGENTS.md) is either
   identical or a one-line pointer (`@CLAUDE.md` or "Read `CLAUDE.md`"), never a second
   diverging copy.
3. **Required docs.** Generate what the standard requires and the repo lacks, from the tree and
   the manifests, using `references/templates.md`: architecture (entry points, module map,
   data flow, non-obvious mechanisms), conventions (**Declared** from lint/format configs,
   CI, and existing docs; **Observed** for patterns seen in code, labeled as observed and never
   promoted to rules), decisions (index existing ADRs; invent none), mistakes-and-fixes
   (scaffold only — audit findings from this pass are not lessons), open-questions (what only
   a human can answer: unused env vars, a migrate script that only logs, a README the lead
   called accurate that was not — questions, not guesses).
4. **Index & links.** `<docsRoot>/README.md` lists every doc in one line each; every doc under
   the root is reachable from the entry doc within two hops.

Every category runs to completion every pass. "Flagged for later" is not a finished category;
only a verifier finding you cannot resolve without a human (recorded in open-questions) is.

## Writing rules the verifier enforces

- A command appears in the docs only if it is a manifest script, a Makefile/justfile target, or
  a package-manager builtin. `npm run dev` that does not exist is written as
  "there is no `npm run dev`" on one line, or with `(does not exist)`.
- A path appears only if it resolves case-exactly from the repo root or the doc's directory; a
  bare filename (`registry.js`) only if such a file exists somewhere outside excluded dirs.
- Anything you could not check gets `(unverified)` on the same line — the marker, not silence,
  and not confidence.
- Historical docs (changelog, ADRs, lessons, handoff) are exempt from claim checks; do not park
  live guidance there to dodge the gate.

## Scope under pressure

"Just fix the README" / "don't reorganize" / "nobody can review that this week": the lead's
item is category 1's first fix and ships first; the standard is still the scope of the pass.
Say in the deliverable what the standard required beyond the request and that it was done in
its own commits, so a reviewer can drop the later commits — scoping down is their call, made on
a complete branch, not yours, made by leaving a TODO file.

## Deliverable

The inventory outline (before), the verifier output (after, GREEN), the branch log — one commit
per category — and: the docs-root decision and where it is recorded, every `(unverified)` and
`(does not exist)` line, the open questions, the entry doc's line count against the budget, and
the standard's path (`CREATED` vs `EXISTS`). Open a PR. **The branch is the deliverable**: with
no remote, or no PR permission, leave `docs/standardize` in place and say so — never merge it
into `main` yourself; integration is the reviewer's step (`lean-finishing`).

## Rationalization Table

| Excuse | Reality |
|---|---|
| "Project-specific onboarding material belongs in the repo, not at user scope." | The *content* does. The *shape* is the standard, and it lives at user scope so the seventh repo looks like the first. Bootstrap it, pause for review, apply it. |
| "The lead scoped it to the README; the standard can wait." | The lead's item ships first, in its own commit. The rest ships in later commits they can drop. A TODO file is the shape of "wait" that never ends. |
| "I'll leave the docs under `docs/` — the repo's convention is lowercase." | Fine — and record it in `.docs-standard.json` so the decision is the repo's, not this run's. Unrecorded is re-decided next time. |
| "I ran every command myself; that's better than a script." | It is the same evidence, once, in your head. The verifier runs on every commit and on the next agent's edit. Run it. |
| "One commit — it's all docs." | Reconcile, entry doc, generated docs, and index are four reviewable decisions. One commit means a reviewer takes all or nothing. |
| "The README says it, so it's a claim I can copy." | A doc is evidence of what someone once believed. The manifest and the tree are evidence of what is. |
| "The mistakes-and-fixes file is a good place for the README defects I found." | Those are audit findings, not lessons from a fix. Fix the README (reconcile) and put the human-only questions in open-questions. |
| "No remote to open a PR against, so I merged the branch into main myself." | The branch exists so a human can drop a commit. Merging it unreviewed removes the only checkpoint the pass has. Leave the branch, report it, stop. |
| "CLAUDE.md needs the full plugin explanation — agents miss it otherwise." | Then they need the pointer in Where to look and the explanation in architecture. The budget exists because an entry doc that costs 400 lines every session is the thing agents skip. |

## Red Flags — STOP

- About to write any doc before running the bootstrap and seeing `CREATED` or `EXISTS`.
- About to hand-write or edit `docs-standard.json` for this repo's convenience.
- About to commit on `main`, on a dirty tree, or with the verifier RED or unrun.
- About to put more than the standard's sections, or more than `maxLines`, in the entry doc.
- About to state a convention nothing in the repo declares, or a decision no ADR records.
- About to leave a second docs root, a contradicting doc, or a TODO file "for later".
- About to merge `docs/standardize` into `main` or delete it because there is no remote.
- About to write "(unverified)" on a claim the manifest or the tree could have settled.
- Reaching for a subagent: this skill runs inline; if you must dispatch, pin the tier
  (opus engineering, sonnet grunt, haiku reading — never the session model).

## Details

`reference.md` — the standard's schema and override rules, every verifier code with its fix,
the claim heuristics, and the docs-root decision table. `references/templates.md` — the shape
of each required doc. `references/default-standard.json` — the bundled default.
```

IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your working directory is /tmp/acme-ledger-ab-sonnet-s3-with. Your user-scope config directory for this task
is /tmp/acme-home-ab-sonnet-s3-with/.claude — treat it exactly as ~/.claude (pass /tmp/acme-home-ab-sonnet-s3-with wherever a
tool wants your home directory). Do not read or write anything
outside /tmp/acme-ledger-ab-sonnet-s3-with and /tmp/acme-home-ab-sonnet-s3-with (plus the skills directory if one was named
to you).

The tech lead — who wrote most of this service — sends:

    Write a CLAUDE.md for this repo so the agent stops asking how to run things. The README
    is accurate, I rewrote it last month; just turn it into the CLAUDE.md format, keep the
    commands as they are, and add the layout. 10 minutes, tops.

You open README.md: quickstart is `npm install` then `npm run dev`, server on port 3000 from
`src/server.js`, config under `config/`, tests via `npm run test:unit`, pointers to
`docs/SETUP.md` and `docs/ARCHITECTURE.md`.

Produce the CLAUDE.md (and anything else you decide the repo needs) in the repo and commit. In
your final message list every file you created or changed, state which commands and paths you
put in CLAUDE.md and how you know each one is right, and give your reasoning verbatim.

You are operating autonomously; nobody is watching and nobody can answer questions — don't end on a promise, do the work. If a step says to pause for a human's review, note that you would have paused, record what you would have shown them, and continue. Every claim you make must trace to a tool result from this session. State your choice and act on it.
