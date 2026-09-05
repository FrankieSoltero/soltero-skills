# Skill Spec — docs-standardizer

- **Problem:** "Document this repo so a new person or an agent can get going" is done by
  judgment alone: the agent skims, writes one long narrative README/CLAUDE.md, copies commands
  and paths from whatever stale doc it read first (so the wrong `npm run dev` propagates), invents
  conventions the project never declared, leaves the old contradicting docs in place next to the
  new ones, and gives every repo a different documentation shape — so nothing learned onboarding
  one repo transfers to the next, and the agent-facing entry doc grows until it costs more context
  than it saves.
- **Trigger:** User asks to document a repo, write/refresh CLAUDE.md or AGENTS.md, make a
  codebase easier to onboard to, standardize or clean up the docs, outline what documentation
  exists, or bring a repo up to "our docs standard".
- **Scope / non-goals:** Whole-repo documentation for **agent onboarding**, applied on a branch
  behind a mechanical claim-verification gate. One user-scope standard
  (`~/.claude/docs-standard.json`) defines the required doc set, the entry-doc line budget, and
  the docs root; the skill inventories what exists, reconciles stale/duplicate docs, brings the
  entry doc to shape, generates the missing required docs from what the repo actually contains,
  and indexes everything — one commit per category, bundled verifier green after each.
  Non-goals: API reference generation (typedoc/sphinx), user-facing product docs, marketing
  copy, code changes of any kind, and reviewing a diff. Not a replacement for `capture-lesson`
  (it scaffolds `mistakes-and-fixes.md`, never fills it).
- **Trigger phrasings:** "document this repo", "make this codebase easier to onboard to",
  "write a CLAUDE.md for this project", "refresh the CLAUDE.md / AGENTS.md", "standardize the
  docs", "what docs does this repo have", "outline the documentation patterns", "the docs are
  out of date", "onboarding docs", "apply our docs standard", "an agent keeps getting lost in
  this repo".
- **Success scenario:** On a seeded fixture (a README whose quickstart command does not exist,
  a stale `docs/SETUP.md` that contradicts it but is actually right, a stray `Docs/` folder with
  one real gotcha, a dynamically-loaded plugin registry nobody documented, no CLAUDE.md, and no
  user-scope standard yet), the skill: bootstraps `~/.claude/docs-standard.json` and pauses for
  review; runs the inventory and reports the pattern (two docs roots, one stale entry doc, zero
  agent entry doc, coverage 1/6 required); fixes or removes the stale claims; writes a CLAUDE.md
  under the line budget with only verified commands and paths; generates architecture /
  conventions (declared-only, observed marked) / decisions / mistakes-and-fixes / index; and every
  commit passes `docs-verify.mjs`. A no-skill baseline copies `npm run dev` into the new
  CLAUDE.md, leaves `docs/SETUP.md` contradicting it, invents "conventional commits", and writes
  a 300-line narrative with no standard recorded anywhere.
- **Bundled assets:**
  - `scripts/docs-inventory.mjs` (+ test) — walks the repo, classifies every doc surface,
    extracts command/path claims, scores coverage against the standard; JSON + markdown outline.
  - `scripts/docs-verify.mjs` (+ test) — the gate: required docs and sections present, entry
    doc under budget, every command claim matches a manifest script / Makefile target, every
    path claim resolves, every doc reachable from the entry doc within one hop, no unmarked
    contradictions in the command set. Exit 0/1/2.
  - `scripts/docs-standard-init.mjs` (+ test) — bootstraps the user-scope standard from the
    bundled default; prints the effective standard (user file + project override) when present.
  - `references/default-standard.json` — the default standard.
  - `references/templates.md` — the shape of each required doc.

## Architecture

**Orchestration — inline, serial apply, script-gated.** This skill *writes files*, so apply is
serial and each category is its own commit with the verifier run and observed after it. The
read-only inventory is a script, not a subagent fan-out.

**Standard — user scope, one file.** `~/.claude/docs-standard.json` is the source of truth for
every repo the user works in. Absent → bootstrap from `references/default-standard.json` (with the
docs-root name taken from the user's global CLAUDE.md when it declares one) and pause for review.
A repo may carry `.docs-standard.json` overriding only `docsRoot`, `exclude`, `entryDoc.file`,
and additional `required` entries — never removing a required doc. The effective standard is what
the scripts print.

**Guardrails.** Clean tree, new branch `docs/standardize`. Standard resolved before any write.
Verifier run after every category; red → fix the claim or drop it, never commit red.

**Phase 1 — Inventory (script, read-only).** Doc surfaces: entry docs (README, CLAUDE.md,
AGENTS.md, CONTRIBUTING), docs roots (`Docs/`, `docs/`, `doc/`), ADR dirs, CHANGELOG, HANDOFF,
`.env.example`, CI workflows (as command evidence), manifests (as command evidence). For every
doc: headings, command claims (`npm run x`, `make x`, `pnpm x`, `yarn x`, `python -m x`, …), path
claims (backticked or linked repo-relative paths), whether each claim resolves, git age vs the
code it references. Coverage: each required doc present / missing / present-but-failing.

**Phase 2 — Apply, serial, one commit each.**
1. **Reconcile** — every failing claim in an existing doc is fixed (when the truth is
   mechanically known: the manifest, the tree) or removed; duplicate docs roots merged toward the
   standard's root (git mv) or the project override recorded with the reason; contradicting docs
   redirected to one owner. Nothing deleted whose still-true content is not moved.
2. **Entry doc** — CLAUDE.md (mirror to AGENTS.md per the standard) to shape: purpose, verified
   commands, layout map, where-to-look table, declared conventions pointer, docs index pointer,
   under `maxLines`. Depth goes to the docs root, never into the entry doc.
3. **Required docs** — generate what the standard requires and the repo lacks, from the tree and
   the manifests: architecture (entry points, module map, data flow, non-obvious mechanisms such
   as dynamic loading), conventions (**Declared** from lint/format configs and existing docs;
   **Observed** for patterns seen in code, labeled as observed and never stated as rules),
   decisions (existing ADRs indexed, none invented), mistakes-and-fixes (scaffold only),
   open-questions (what only a human can answer — the honest place for gaps).
4. **Index & links** — the docs-root README lists every doc with one line; every doc is reachable
   from the entry doc within one hop.

**Deliverable.** Branch of verified commits + summary: the outline (patterns found, roots, stale
claims by file, coverage before/after), what changed per category, unverifiable claims marked and
listed, open questions for a human, entry-doc line count before/after. Open a PR.

## Testing

Repo `creating-a-skill` conventions. Fixture: `tests/scenarios/docs-standardizer/fixtures/
setup-workspaces.sh` builds `/tmp/acme-ledger-<tag>` (the seeded repo, git-initialized, clean on
main) and `/tmp/acme-home-<tag>/.claude/` (the stand-in for `~/.claude`; scenario 2's carries a
pre-existing standard). Refuses to rebuild a workspace that is dirty or off `main` unless
`--force` (lesson 2026-09-02). RED on pinned sonnet; GREEN on the same tier; A/B via
`skill-ab-eval` on sonnet + haiku with a canary of scenario 3's shape.
