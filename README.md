# Soltero Skills

A public [Claude Code](https://code.claude.com) skills library — reusable `SKILL.md` modules
for scaffolding, security/compliance review, AI-agent engineering, and docs/knowledge capture.

## Install

```
/plugin marketplace add FrankieSoltero/soltero-skills
/plugin install soltero-skills@soltero-skills-marketplace
```

Then invoke skills as `soltero-skills:<skill-name>`.

## Skills

| Skill | What it does |
|-------|--------------|
| `creating-a-skill` | The repo's own dev process: test-first, subagent-validated skill authoring. |
| `capture-lesson` | Records a structured lesson in `Docs/mistakes-and-fixes.md` after a fix. |
| `prisma-safety-review` | Systematic safety pass before a Prisma/DB change merges (atomicity, indexes, pagination, version drift). |
| `scaffold-frontend` | Scaffolds a new front-end via its official CLI, then wires in the standards layer a default scaffold skips. |
| `agent-handoff` | Writes and refreshes a living `HANDOFF.md` so a fresh session resumes long work with zero further questions. |
| `build-mcp-server` | Builds, hardens, and deploys a production-grade MCP server in TypeScript on the official SDK. |
| `audit-swarm` | Whole-repo security + legal audit via an agent swarm: scout → adaptive finders → 3-skeptic verification → severity-ranked report in `Docs/`. |
| `code-optimizer` | Whole-repo cleanup behind a test gate: tool-grounded dead-code removal, de-dup/shortening, live-file splitting, and project-guideline enforcement — every change verified and revertible. |
| `walkthrough-tutor` | Interactive, level-calibrated walkthrough of a branch/PR's changes — mental model first, then one layer per turn with comprehension checks, teaching the concepts behind the code. |
| `agent-playbook` | Living, tiered playbook of coding-agent best practices: advisor mode serves source-linked, tier-labeled guidance; update mode runs a research-sweep Workflow (arXiv + lab blogs + OSS → dedupe → deep-read → skeptic tiering). |
| `memory-gardener` | Periodic skeptic-gated curation of persistent memory surfaces: dedupe/merge/distill/prune as discrete itemized edits, with provenance gating and an independent `memory-skeptic` verifier for every destructive change. |
| `correction-compiler` | Turns repeated user corrections (≥2 of the same class) into human-approved deterministic enforcement (hooks/lint/CI), tracked in a structured `Docs/corrections-ledger.md` with Traced-To provenance. |
| `session-miner` | Offline mining of past session transcripts for recurring successful procedures, drafting smallest-artifact-first proposals (CLAUDE.md line → rule → draft skill) — proposals only, reviewed by an independent subagent, never auto-installed. |
| `skill-gardener` | Periodic staleness/lifecycle audit of installed skills: structural validation, freshness spot-checks of external claims with live evidence, usage-informed retirement candidates — report-only, never edits audited skills. |
| `skill-patcher` | Closed-loop meta-agent that clusters corrections/lessons across sessions and opens a PR patching the guilty skill/ruleset (itemized edits, Traced-To table) — PR review is the gate; never merges its own PRs. |
| `evidence-gate` | Fail-closed verification receipts for lifecycle claims: tree-hash-bound JSON receipts produced by observed runs and mechanically re-verifiable via bundled scripts — prose "tests passed" is never evidence. |
| `design-forge` | Living, license-verified catalog of free front-end design sources + apply mode: stack detection → aesthetic-direction Artifact previews with real content → explicit pick → branch-only implementation. |
| `dev-debrief` | Nightly local scan of all sessions → daily work summary + skill telemetry (triggers/missed triggers), Sunday deep pass with evidence-cited skill grades; silent skip on no-coding days; hardened redaction. |
| `transcript-reader` | Verified meeting-transcript extraction: bundled pipeline (deterministic ingest → parallel extractors → reduce → refute-verifiers → completeness critic) with cited items and a correction-fed rule pool. |
| `code-by-hand` | User-invoked navigator/driver mode: you type every line, the agent presents blocks with per-line notes, verifies what you actually typed, and never edits code files itself. |
| `writing-prds` | Dialogue-driven idea → PRD (`docs/prds/`): hard gate before design/code, blocking questions instead of flagged assumptions, decomposition before drafting, section-by-section approval; hands off to technical design. |
| `prd-user-stories` | User stories traceable to stated requirements with compact Given/When/Then acceptance criteria — no invented personas, thresholds, or "keep it light" vagueness. |
| `prd-scoping` | Scope sections with a decomposition-first check, MoSCoW under a forced Must budget, and an explicit Out-of-scope list that gets reworded, never deleted. |
| `prd-success-metrics` | Success metrics with baseline/target/timeframe/measurement source each, `(proposed — confirm)` markers on unsourced numbers, and a 3–5 primary cap plus guardrail. |
| `prd-review` | 6-dimension PRD grading council (bundled Workflow: rubric-anchored graders, anti-inflation skeptics, regrade-min) gating at ≥95 overall AND ≥80 per dimension — BLOCKED means no design or build. |
| `plan-review` | Implementation-plan grading council (decomposition, verifiability, spec fidelity, concreteness, risk/rollback, consistency) gating execution at ≥95/80 — no safe-subset starts, no fix-author self-approval. |
| `lean-brainstorming` | Batched-question requirements exploration with a hard no-code-before-approval gate — one question round, one design message, one combined approval pass (~2 round trips). |
| `lean-plans` | Contract-level implementation plans: exact interfaces, behavior tables, and a dependency/risk-tier table for the executor; code only where exactness is the requirement. |
| `lean-sdd` | Pipelined subagent execution: reviewer runs concurrently with the next disjoint implementer, risk-tiered review depth, 3-round fix cap, compaction-proof ledger. |
| `lean-tdd` | Failing-test-first discipline: delete code written before its test (stash counts as keeping it), mandatory verify-RED/GREEN, first-run-pass tripwire. |
| `lean-verification` | Evidence before claims: no completion claim without a fresh run in the same message; never pre-script the success message; subagent reports are claims to verify. |
| `lean-debugging` | Root cause before fixes: trace to origin, one change at a time, no symptom patch even as "insurance" (revert is the honest fast exit), three failed fixes → question the architecture. |
| `lean-worktrees` | Isolated-workspace procedure: detect existing isolation, prefer the native worktree tool, guarded gitignore-verified git fallback, clean test baseline. |
| `lean-finishing` | Branch integration: fresh suite on the exact tree, options menu (unless explicitly delegated), typed-`discard` only, protected-main routing through PRs. |
| `content-marketing` | Brief-first marketing copy with a claim-trace gate on the agent's own drafting, platform-constraint checks, and a claims-table delivery contract. |
| `email-marketing` | Customer-facing email with personalization/product-claim trace gates, no fictional case studies, compliance floor, and sequence craft. |
| `seo-aeo` | Search + answer-engine optimization: basis-labeled recommendations, mechanical audit first, citation baseline→recheck protocol, no promised rankings. |

Roadmap (see `docs/specs/`): `claude-integration-patterns`, `financial-correctness-review`,
`author-claude-md`.

## Develop

Every skill is built with `creating-a-skill`. See `CONTRIBUTING.md`.

```
npm test            # tooling unit tests
npm run lint:fm     # SKILL.md frontmatter lint
npm run validate:plugin
```

## License

MIT — see `LICENSE`.
