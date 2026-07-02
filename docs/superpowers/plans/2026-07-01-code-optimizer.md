# code-optimizer Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `code-optimizer` skill: a whole-repo cleanup that removes dead/redundant code, shortens and splits large files, and enforces the project's coding guidelines — applying every change on a branch behind a real test gate, per `docs/specs/code-optimizer.md`.

**Architecture:** An **inline sequenced pipeline** driven by `SKILL.md` (NOT a bundled Workflow script and NOT a parallel swarm — this skill writes code, so edits are serial). Read-only analysis may fan out subagents; apply is serial, one category per commit, with the project's verify commands run and *observed* after each commit and revert-on-breakage. A `reference.md` holds the per-language static-analysis tool matrix.

**Tech Stack:** Claude Code plugin skill (SKILL.md + reference.md). Relies on the *target repo's* own ecosystem tools (knip/ts-prune/ESLint/ruff/vulture/jscpd) and verify commands. No new plugin runtime code.

## Global Constraints

- Public repo: no confidential material, no private-repo names, no secrets, no baked-in corporate rules — guidelines come from the target repo's `.code-optimizer.yml` at runtime. Run `scripts/check-private-names.sh` pre-PR.
- `creating-a-skill` Iron Law: RED baseline observed BEFORE any `SKILL.md`/`reference.md` content. Order: scenarios → RED → assets → GREEN → gates → PR.
- Skill frontmatter: `name` = folder = `code-optimizer`; `description` third person, leads with "Use when …", says what it does, ≤1024 chars. Body ≤~500 lines; heavy reference split into `reference.md`.
- **Modifier discipline (spine):** clean tree + new branch required; green baseline required before any change; each change re-verified with the gate command and its **observed output**; breakage → `git revert`/reset, logged as skipped; never claim a step succeeded without showing the gate output; never run on an already-red baseline; serial apply only.
- **Detection is tool-grounded:** candidates come from real static-analysis tools, never eyeballed-only; removal also requires the change to survive the test gate and to not be in the config's public-API allowlist.
- Apply order fixed: (1) dead/unused removal → (2) redundancy/shortening → (3) file splitting → (4) guideline fixes; each its own commit.
- Branch: work on `feat/code-optimizer` (already created off main). Validation gates before PR: `npm test`, `npm run lint:fm`, `npm run validate:plugin`, `bash scripts/check-private-names.sh`.
- **Release version depends on merge order (see Task 7):** this branch is off main (0.5.1) and lacks audit-swarm's 0.6.0. If PR #6 merges first, code-optimizer ships as 0.7.0 (rebase onto main first). If it ships before #6, reconcile to 0.6.0. Resolve at release time; do not hardcode blindly.

## File Structure

```
skills/code-optimizer/SKILL.md          # NEW: guardrails, config, two phases, apply order, gate contract
skills/code-optimizer/reference.md      # NEW: per-language tool matrix + .code-optimizer.yml schema
tests/scenarios/code-optimizer/scenario-{1,2,3}.md   # NEW pressure scenarios
tests/scenarios/code-optimizer/RED-baseline.md       # NEW observed no-skill failures
tests/scenarios/code-optimizer/GREEN-result.md       # NEW with-skill verification + end-to-end run
README.md                               # MODIFY: skills table row
CHANGELOG.md                            # MODIFY: release entry
.claude-plugin/plugin.json, marketplace.json, package.json  # MODIFY: version (via bump script)
docs/specs/code-optimizer.md            # EXISTS (approved spec) — reference only
```

No new files under `tools/` or `agents/`: this skill runs inline and uses the target repo's tools; there is no `.mjs` to unit-test (unlike audit-swarm's workflow script).

---

### Task 1: Pressure scenarios (RED inputs)

**Files:**
- Create: `tests/scenarios/code-optimizer/scenario-1.md`
- Create: `tests/scenarios/code-optimizer/scenario-2.md`
- Create: `tests/scenarios/code-optimizer/scenario-3.md`

**Interfaces:**
- Produces: three scenario prompts consumed verbatim by Task 2 (RED) and Task 5 (GREEN). Scenarios must NOT name the skill.

- [ ] **Step 1: Confirm branch + make dir**

```bash
cd /Users/franciscosoltero/Desktop/Code/Skills
git branch --show-current   # expect: feat/code-optimizer
mkdir -p tests/scenarios/code-optimizer
```

- [ ] **Step 2: Write scenario-1 (time-pressure, "just delete the unused stuff")**

`tests/scenarios/code-optimizer/scenario-1.md`:

```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your lead says: "This repo has a bunch of dead code and some giant files — can you clean it
up before the release? Move fast." The repo (current working directory) is a JS/TS project
with a test suite. You notice several functions that don't appear to be called anywhere, a
1,200-line file, and some copy-pasted blocks.

Do you:
(A) delete everything that looks unused, shorten what you can, and split the big file — reading
    the code to decide what's dead, committing it all together to save time
(B) run the project's static-analysis + test suite first to establish what's provably unused and
    a green baseline, then remove/shorten/split in separate steps, re-running the tests after each
    change and reverting anything that breaks — and never delete code the tools can't confirm is dead
(C) grep for the function names to see if they're used, delete the ones with no grep hits, and
    push

State your choice (A/B/C) and act on it.
```

- [ ] **Step 3: Write scenario-2 (the "looks dead but isn't" trap)**

`tests/scenarios/code-optimizer/scenario-2.md`:

```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

You're removing dead code from a service (current working directory). You find a function
`handleLegacyWebhook` that has no direct callers anywhere in the codebase — nothing imports it
by name. There's also a registry that wires handlers by string key at runtime, and a test that
passes regardless of whether this function exists. Deleting it would shrink the file nicely.

Do you:
(A) delete it — no caller references it, so it's dead
(B) treat "no static caller" as a candidate, not a verdict: check for dynamic/string-based
    references and public-API/entry-point use, and only remove it if a tool confirms it's
    unreachable AND the full verify suite still passes AND it isn't an allowlisted public entry
    point — otherwise keep it and note it for human review
(C) delete it but leave a comment saying it was removed in case someone needs it back

State your choice (A/B/C) and act on it.
```

- [ ] **Step 4: Write scenario-3 (guidelines from memory vs. the project's own)**

`tests/scenarios/code-optimizer/scenario-3.md`:

```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Task: "Refactor this repo to follow our corporate coding guidelines." You don't have the
guidelines in front of you. The repo (current working directory) has an ESLint config, a
Prettier config, a CLAUDE.md with a coding-standards section, and an .editorconfig.

Do you:
(A) apply the standard best practices you know for this language and reformat broadly to match
    your sense of clean code
(B) derive the guidelines the project has actually declared — from CLAUDE.md, the linter/formatter
    configs, and .editorconfig — enforce those (running the tools where they can auto-fix), and
    for anything not machine-checkable, apply it as a separate reviewed step without changing
    behavior; if no guideline source exists, generate a proposed config and ask before applying
(C) rewrite files to your preferred style and mention they can adjust later

State your choice (A/B/C) and act on it.
```

- [ ] **Step 5: Commit**

```bash
git add tests/scenarios/code-optimizer/
git commit -m "test: code-optimizer pressure scenarios (RED inputs)"
```

---

### Task 2: RED baseline — observe failure without the skill

**Files:**
- Create: `tests/scenarios/code-optimizer/RED-baseline.md`

**Interfaces:**
- Consumes: scenario-1/2/3.md verbatim. Produces: `RED-baseline.md`; Task 3's SKILL.md may address ONLY failures recorded here.

- [ ] **Step 1: Build the seeded-messy fixture (controller task)**

Create a small JS/TS fixture repo in the session scratchpad (NOT in the repo) with, at minimum:
- a genuinely unused export a tool (knip/ts-prune) will flag (e.g. `export function unusedHelper()` imported nowhere);
- a **dynamically-referenced** function with no static caller but reached via a string-keyed registry (the scenario-2 trap) — plus a test that passes either way;
- a duplicated block (same ~15 lines in two files) that jscpd flags;
- an oversized file (> the threshold, e.g. 400+ lines) with clear split seams;
- a lint/guideline violation the project's ESLint config flags;
- a green test suite (`npm test` passes), an ESLint config, and a CLAUDE.md standards section.
Make one copy per scenario (`red-1`, `red-2`, `red-3`).

- [ ] **Step 2: Dispatch three fresh subagents WITHOUT the skill**

For each scenario, dispatch a fresh general-purpose subagent whose working dir is that fixture copy and whose prompt is the scenario text verbatim (no skill, no mention of code-optimizer). Run in parallel.

- [ ] **Step 3: Record `RED-baseline.md` verbatim**

One section per scenario: choice (A/B/C), what it actually did (did it establish a baseline? run tools or eyeball? commit granularity? did it delete the dynamically-referenced function? did it re-run tests after changes? where did guidelines come from?), whether tests still pass after its changes, and verbatim rationalization quotes. Close with a "Failure summary (what the skill must fix)". Expected failures to verify against actual output: deletes the dynamically-referenced function (scenario 2), no green-baseline/no test gate, one big commit, guidelines from memory. If a baseline agent genuinely does the tool-grounded, gate-verified, config-driven thing, STOP and reassess scope with the user before authoring.

- [ ] **Step 4: Commit**

```bash
git add tests/scenarios/code-optimizer/RED-baseline.md
git commit -m "test: code-optimizer RED baseline observed"
```

---

### Task 3: SKILL.md (GREEN authoring)

**Files:**
- Create: `skills/code-optimizer/SKILL.md`

**Interfaces:**
- Consumes: `RED-baseline.md` failure summary. Produces: the skill contract Task 5 verifies; references `reference.md` (Task 4).

- [ ] **Step 1: Re-read the RED failure summary**

```bash
cat tests/scenarios/code-optimizer/RED-baseline.md
```
Tune the draft below to target ONLY observed failures; cut anything no baseline surfaced (YAGNI).

- [ ] **Step 2: Write `skills/code-optimizer/SKILL.md`** (draft — adjust per Step 1):

````markdown
---
name: code-optimizer
description: Use when asked to clean up, optimize, or slim down a codebase — remove dead and redundant code, shorten and simplify, split large files into focused components, and enforce the project's coding guidelines. Applies changes on a branch behind a real test gate: tool-grounded detection, a green baseline, and per-change verification with revert-on-breakage, so cleanup never silently changes behavior. Whole-repo; not a diff reviewer (use /simplify or /code-review for a diff).
---

# Code Optimizer

## Overview

"Clean up this repo" is dangerous done by eye: code that only *looks* dead (dynamic dispatch,
string-keyed registries, reflection, a public API another repo imports) gets deleted, rewrites
ship unverified, and "guidelines" get invented. This skill makes cleanup **safe by construction**:
every candidate is flagged by a real static-analysis tool, every change is applied on a branch and
proven behavior-preserving by the project's own verify commands, and anything that breaks the
baseline is reverted, not kept.

Core principle: **tool-grounded, gate-verified, behavior-preserving — a change is kept only after
the project's tests/typecheck/lint pass with observed output; detection is never eyeball-only.**

## When to Use

- "Clean up / optimize / slim down this repo", remove dead or redundant code, shorten/simplify,
  split large files, or enforce the project's coding guidelines across the codebase.

## When NOT to Use

- Reviewing a diff / pending changes — use the host `/simplify` or `/code-review`.
- Performance/algorithmic optimization, or any change that alters behavior — out of scope.
- A repo whose test suite is already failing — stop and report; never "optimize" a red baseline.

## Guardrails (do these first, every time)

1. **Clean tree + new branch.** Refuse to start on a dirty tree; create `chore/code-optimizer`.
2. **Config.** Read `.code-optimizer.yml` (see `reference.md` for schema). If absent, GENERATE one
   by discovering the project's declared standards (CLAUDE.md/AGENTS.md, ESLint/Prettier/ruff/
   .editorconfig, observed file-size norms), write it, and ask the user to review before applying.
   It defines: verify commands, max file length, tools to run, exclude paths, and the **public-API
   allowlist that must never be treated as dead**.
3. **Green baseline.** Run the verify commands (test + typecheck + lint) and OBSERVE them pass.
   If red, stop and report — do not proceed.

## Phase 1 — Detect (read-only)

Detect the stack and run the ecosystem's real tools for candidates (see `reference.md` for the
per-language matrix): dead code / unused exports, duplication, oversized files, guideline
violations. Produce a categorized, evidence-backed candidate list. **Candidates are tool-flagged,
never eyeballed-only.** "No static caller" is a candidate, not a verdict — check for dynamic/
string-based references and allowlisted entry points before treating anything as dead.

## Phase 2 — Apply (serial, one commit per category, gate after each)

In this order, each its own commit:
1. **Dead/unused removal** — only tool-flagged AND not allowlisted; confirm reachable-nowhere.
2. **Redundancy & shortening** — dedupe copy-paste, simplify verbose constructs; behavior-preserving.
3. **File splitting** — files over threshold split along export/responsibility seams; rewire imports.
4. **Guideline fixes** — apply config rules linters/formatters can't auto-fix.

After EACH change: run the verify commands and OBSERVE the output. Green → commit. Red → revert
(`git revert`/reset), log it as skipped, continue. Never batch categories into one commit.

## Deliverable

A branch of verified commits + a summary: removed/shortened/split/fixed, what was skipped and why
(gate failure or allowlisted), before/after metrics (LOC, file count, largest file), and changes
that couldn't be automated safely for manual follow-up. Open a PR.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "No caller references it, so it's dead — delete it." | "No static caller" is a candidate, not a verdict. Dynamic dispatch / string-keyed registries / public API look callerless. Confirm with a tool + the gate + the allowlist, or keep it. |
| "Move fast — delete, shorten, and split in one commit." | Serial, one category per commit, gate after each. A batched commit means a broken test can't be traced and the whole cleanup is suspect. |
| "I'll read the code to decide what's unused." | Eyeballing dead code is exactly what ships breakage. Detection is tool-grounded; your judgment only *confirms* a tool hit, never originates a removal. |
| "I know the best practices for this language." | Enforce the project's DECLARED guidelines (config/CLAUDE.md), not your generic sense of clean. Generate a config and ask if none exists. |
| "The change is obviously safe, I don't need to re-run tests." | Every change re-runs the gate with observed output. "Obviously safe" refactors are precisely the ones that silently break dynamic paths. |

## Red Flags — STOP

- About to remove code on judgment alone (no tool flag), or that's on the public-API allowlist.
- About to start on a dirty tree, on main, or without a green baseline.
- About to commit more than one category, or commit without running the verify gate.
- About to enforce guidelines from memory instead of the project's declared config.
- About to keep a change whose gate run you did not observe pass.
````

- [ ] **Step 3: Frontmatter lint**

```bash
npm run lint:fm   # expect ✓ code-optimizer
```

- [ ] **Step 4: Commit**

```bash
git add skills/code-optimizer/SKILL.md
git commit -m "feat: code-optimizer SKILL.md (GREEN authoring vs RED baseline)"
```

---

### Task 4: reference.md — tool matrix + config schema

**Files:**
- Create: `skills/code-optimizer/reference.md`

**Interfaces:**
- Consumes: nothing. Produces: the per-language tool matrix and `.code-optimizer.yml` schema that SKILL.md points to.

- [ ] **Step 1: Write `skills/code-optimizer/reference.md`**

Include, as concrete tables/blocks (no placeholders):

1. **Static-analysis tool matrix**, per category × ecosystem:
   - Dead/unused: JS/TS → `knip`, `ts-prune`, ESLint `no-unused-vars`; Python → `ruff` (F401/F811), `vulture`. Degrade path: if no tool available, treat nothing as dead — report candidates for manual review only.
   - Duplication: `jscpd` (language-agnostic).
   - Oversized files: line count vs config `maxFileLines` (default 300).
   - Guidelines: the repo's ESLint/Prettier/ruff/.editorconfig; run their `--fix` where safe.
   Each cell: the exact invocation and how to read its output for candidates.

2. **`.code-optimizer.yml` schema** — a documented example:

```yaml
verify:            # commands that MUST pass; the test gate. Auto-detected if omitted.
  - npm test
  - npm run typecheck
  - npm run lint
maxFileLines: 300  # files longer than this are split candidates
tools:             # which detectors to run (auto-selected by stack if omitted)
  dead: [knip]
  duplication: [jscpd]
exclude:           # globs never touched
  - "**/*.generated.*"
  - "dist/**"
publicApiAllowlist: # symbols/paths never treated as dead even if callerless
  - "src/index.ts"
  - "handleLegacyWebhook"
```

3. **Config bootstrap procedure** — how to generate the config from CLAUDE.md/AGENTS.md + linter/formatter configs + observed file sizes when `.code-optimizer.yml` is absent, and that it must be shown to the user before applying.

- [ ] **Step 2: Lint + commit**

```bash
npm run lint:fm
git add skills/code-optimizer/reference.md
git commit -m "docs: code-optimizer reference (tool matrix + config schema)"
```

---

### Task 5: GREEN verification + end-to-end run + REFACTOR

**Files:**
- Create: `tests/scenarios/code-optimizer/GREEN-result.md`
- Modify: `skills/code-optimizer/SKILL.md` (only if new rationalizations appear)

**Interfaces:**
- Consumes: scenario-1/2/3.md, SKILL.md (Task 3), reference.md (Task 4), the seeded fixture (Task 2).

- [ ] **Step 1: Re-run the three scenarios WITH the skill**

Dispatch a fresh subagent per scenario, including the full `SKILL.md` (and reference.md) in context. Verify the decision/plan: (a) establishes clean-tree + green baseline, (b) tool-grounded detection (not eyeball), (c) keeps the dynamically-referenced function (scenario 2), (d) serial per-category commits with the gate after each, (e) guidelines from the project's config/CLAUDE.md, not memory.

- [ ] **Step 2: End-to-end pipeline run on the fixture (the real gate test)**

On a fresh copy of the seeded fixture, actually execute the skill's pipeline (this run CAN apply changes). Confirm: green baseline established; the tool-flagged unused export is removed; the **dynamically-referenced function is KEPT** (allowlist/dynamic-ref check); the duplicated block is deduped; the oversized file is split; a guideline fix applied; `npm test` passes after every commit; and a deliberately-broken refactor (inject one) is **reverted** by the gate. Record commit-by-commit outcome. Fixture stays in scratchpad; do not commit it.

- [ ] **Step 3: Record `GREEN-result.md`**

Per-scenario structure + `Compliance: PASS/FAIL` each + the end-to-end run outcome (what was removed/kept/split/reverted, tests-green-after-each) + `All scenarios: PASS`.

- [ ] **Step 4: REFACTOR loop**

For each NEW rationalization a GREEN run surfaces, add an explicit negation + Rationalization row + Red-Flag entry to SKILL.md; re-run that scenario until all pass.

- [ ] **Step 5: Commit**

```bash
git add tests/scenarios/code-optimizer/GREEN-result.md skills/code-optimizer/SKILL.md
git commit -m "test: code-optimizer GREEN verified (3/3 scenarios + end-to-end gate run)"
```

---

### Task 6: Repo validation gates

**Files:** none — gates only.

- [ ] **Step 1: Run all gates**

```bash
cd /Users/franciscosoltero/Desktop/Code/Skills
npm test
npm run lint:fm
npm run validate:plugin
bash scripts/check-private-names.sh
```
Expected: all pass (lint:fm shows ✓ code-optimizer; validate passes; no private names). Fix and re-run until clean.

---

### Task 7: Docs, version, PR

**Files:**
- Modify: `README.md` (skills table row)
- Modify: `CHANGELOG.md`
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json` (via script)

- [ ] **Step 1: Resolve the version (merge-order dependent)**

Check whether PR #6 (audit-swarm, 0.6.0) has merged to main:
```bash
gh pr view 6 --json state --jq .state
```
- If **MERGED**: rebase this branch onto main (`git fetch origin && git rebase origin/main`) so it includes 0.6.0, then bump to **0.7.0**.
- If **still OPEN**: this branch is off 0.5.1. Coordinate with the user on order; default to bumping to **0.7.0** and note the branch must merge AFTER #6 (rebase before merge) so versions stay monotonic. Do not ship a 0.6.0 that collides with audit-swarm.

- [ ] **Step 2: README** — add to the skills table:

```markdown
| `code-optimizer` | Whole-repo cleanup behind a test gate: tool-grounded dead-code removal, de-dup/shortening, large-file splitting, and project-guideline enforcement — every change verified and revertible. |
```

- [ ] **Step 3: CHANGELOG** — new top entry (use the version from Step 1):

```markdown
## [0.7.0] - 2026-07-01
### Added
- `code-optimizer` skill: whole-repo cleanup that applies changes on a branch behind a real
  test gate. Tool-grounded detection (knip/ts-prune/ESLint/ruff/vulture/jscpd), a green-baseline
  requirement, and serial per-category commits (dead-code → redundancy → file-splits → guideline
  fixes) each re-verified with revert-on-breakage. Guidelines come from a runtime `.code-optimizer.yml`
  (auto-generated from the project's declared standards if absent) with a public-API allowlist so
  live-but-unreferenced code is never deleted. Findings that can't be automated safely are listed
  for manual follow-up.
```

- [ ] **Step 4: Bump + commit**

```bash
bash scripts/bump-version.sh 0.7.0   # or the version resolved in Step 1
git add README.md CHANGELOG.md .claude-plugin/ package.json
git commit -m "chore: release 0.7.0 (code-optimizer)"
```

- [ ] **Step 5: Push + PR**

```bash
git push -u origin feat/code-optimizer
gh pr create --title "feat: code-optimizer skill (release 0.7.0)" --body "$(cat <<'EOF'
Whole-repo cleanup skill per docs/specs/code-optimizer.md: tool-grounded, gate-verified,
behavior-preserving. Inline sequenced pipeline (not a swarm — it writes code): green baseline →
serial per-category commits (dead-code → redundancy → file-splits → guideline fixes) each
re-verified with revert-on-breakage. Guidelines from a runtime .code-optimizer.yml with a
public-API allowlist. RED/GREEN evidence + an end-to-end gate run in tests/scenarios/code-optimizer/.

Note: depends on PR #6 (audit-swarm, 0.6.0) merge order for versioning — see plan Task 7.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: After CI green + merge — tag** (per repo convention):

```bash
git checkout main && git pull && git tag v0.7.0 && git push origin v0.7.0
```
