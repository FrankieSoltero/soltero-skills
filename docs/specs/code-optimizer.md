# Skill Spec — code-optimizer

- **Problem:** "Clean up / optimize this codebase" is high-risk when done by judgment alone: an
  agent removes code that only *looks* dead (reached via dynamic dispatch, reflection, string refs,
  or a public API another repo consumes), rewrites without proving behavior is preserved, invents
  "guidelines" the project never adopted, and splits files in one unbounded pass no one can review.
- **Trigger:** User asks to clean up / optimize / slim down / de-dupe a codebase, remove dead or
  redundant code, shorten or simplify it, break up large files, or enforce the project's coding
  guidelines across the repo.
- **Scope:** Whole-repo cleanup that **applies changes on a branch behind a test gate**. Tool-grounded
  detection, serial verified apply in four categories (dead-code removal → redundancy/shortening →
  file splitting → guideline fixes), each its own commit with the project's verify commands run and
  observed after it; revert-on-breakage. Produces a PR + summary. Non-goals: reviewing a diff (host
  `/simplify` and `/code-review` cover that); performance/algorithmic optimization; behavior changes
  of any kind; running on a repo whose baseline is already red.
- **Success scenario:** On a seeded-messy fixture (a tool-detectable unused export, a duplicated
  block, an oversized file, a lint/guideline violation, and one dynamically-referenced function that
  merely *looks* dead), the skill establishes a green baseline, removes the real dead code but **keeps**
  the dynamically-referenced function, dedupes/splits/fixes with tests passing after every commit, and
  opens a PR whose history is bisectable — where a no-skill baseline removes the live function, skips
  the gate, and guesses guidelines.

## Architecture (approved 2026-07-01)

**Orchestration — inline sequenced pipeline with a real test gate (not a parallel swarm).** This skill
*writes* code, so parallel agents editing shared files and imports would collide and a broken test
could not be traced to one change. `SKILL.md` drives the pipeline in-session; the read-only **analysis**
phase may fan out subagents for speed, but **apply is serial**. The test gate must run for real with
observed output — success is never claimed without the command and its output.

**Guardrails (the spine).** Runs only on a **clean working tree**, on a **new branch**. Establishes a
**green baseline** first by running the project's verify commands (test + typecheck + lint) and
observing them pass; if the baseline is red, it stops and reports — it does not "optimize" a broken
repo. Every applied change is behavior-preserving and re-verified; any change that breaks the baseline
is reverted (`git revert`/reset), logged as skipped, and the pipeline continues.

**Config — `.code-optimizer.yml`, the source of truth.** Declares: verify commands (or how to detect
them), max file length, which static-analysis tools to run, exclude paths, and a **public-API allowlist
that must never be treated as dead**. On first run, if the config is absent, the skill **generates** it
by discovering the project's declared standards (CLAUDE.md/AGENTS.md, linter/formatter configs, observed
file-size norms) and asks the user to review it before applying anything.

**Phase 1 — Baseline & detect (read-only, parallel).** Confirm clean tree + green baseline. Detect the
stack and run the ecosystem's real tools for candidates: dead code / unused exports (knip, ts-prune,
ESLint `no-unused-vars`, ruff, vulture), duplication (jscpd), oversized files (line count vs config
threshold), guideline violations (linters). Read-only analysis agents turn tool output into a
categorized, evidence-backed candidate list. Candidates are **tool-flagged, never eyeballed-only**.

**Phase 2 — Apply, serially and verified.** Safe → risky order, each category its own commit with the
gate after it:
1. **Dead/unused removal** — only tool-flagged AND not in the public-API allowlist; gate confirms.
2. **Redundancy & shortening** — dedupe copy-paste, simplify verbose constructs; behavior-preserving.
3. **File splitting** — files over threshold split along export/responsibility seams, imports rewired;
   gate confirms nothing broke.
4. **Guideline fixes** — apply config rules (naming, error-handling, structure) that linters/formatters
   cannot auto-fix.
Each step: make change → run verify (observed) → commit on green, revert on red (log as skipped).

**Deliverable.** A branch of verified commits + a summary: what was removed/shortened/split/fixed, what
was skipped and why (gate failure or allowlisted), before/after metrics (LOC, file count, largest file),
and a list of changes that couldn't be automated safely for manual follow-up. Opens a PR.

## Bundled assets

```
skills/code-optimizer/
  SKILL.md                 # trigger, guardrails, config, the two phases, apply order, gate contract
  reference.md             # per-language static-analysis tool matrix (JS/TS, Python, + degrade path)
  scripts/                 # optional deterministic helpers (e.g. baseline runner / config bootstrap)
```

Config lives in the *target* repo (`.code-optimizer.yml`), not in the plugin.

## Testing

Repo `creating-a-skill` conventions: RED baseline (fresh no-skill agent asked to "clean up this repo"
on a seeded-messy fixture — expected failures: removes the dynamically-referenced function, no test
gate, guesses guidelines, unbounded rewrite), GREEN with the skill (tool-grounded, gate-verified after
each commit, config-driven, keeps the live function, reverts on breakage). Scenario fixture kept in the
session scratchpad, not committed. Frontmatter lint + plugin validate as release gates.
