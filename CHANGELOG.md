# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog]; this
project adheres to Semantic Versioning.

## [0.16.0] - 2026-07-29
### Added
- Product-discovery pair (lean-agency phase 2) — the discovery front-end for
  writing-prds:
  - `feedback-synthesis`: mandatory synthesis contract — exact counts with
    item IDs, verbatim quotes with per-edit disclosure, duplicates counted
    once, contradictions surfaced not averaged, vivid anecdotes held at n=1
    with survivorship caveats, and a REQUIRED expected-but-absent topics list
    (the gap RED found: 0/3 baseline runs reported the planted zero-mention
    topic).
  - `trend-research`: evidence protocol — per-claim labels
    ([verified: source, date] / [model memory — verify] / [estimate]), no
    specific numbers from memory ([VERIFY] brackets), premise-check before
    building, analyst-spread over single TAM, honest no-web degradation path
    (the gap RED found: all baselines had web access), customer-alternatives
    competitive ring.
- Built RED→GREEN on a planted-ground-truth feedback fixture (28 items:
  dupe user, praise-vs-complaint trap, 1-item vivid story, contradiction
  pair, zero-mention topic). RED 6/6 honest passes with two gaps; targeted
  GREEN 4/4 with both gaps closed; zero refactor rounds. Raw-material
  keepers from msitarzewski/agency-agents product agents (MIT).

## [0.15.0] - 2026-07-29
### Added
- Marketing suite (lean-agency phase 1, per docs/specs/lean-agency-scoping.md;
  raw material adapted from msitarzewski/agency-agents, MIT):
  - `content-marketing`: brief-first content with the claim-trace gate on the
    agent's OWN drafting (RED found 6/9 baseline runs inventing product
    claims — "free forever", hallucinated features — inside otherwise-honest
    copy), mechanical platform-constraint checks, and a claims-table delivery
    contract. References: voice-and-slop banlist, platform constraints,
    brief template.
  - `email-marketing`: personalization/product-claim trace gates (incl.
    inside compliant rewrites), no fictional case studies, compliance floor,
    sequence craft reference.
  - `seo-aeo`: basis-labeled recommendations ([stable practice] vs dated
    sweep-maintained AEO), mechanical-audit-first contract, citation
    baseline→14-day-recheck protocol, no promised rankings.
  - `agents/content-adapter.md`: fan-out worker for per-platform adaptation
    with a closed claim set (may drop claims, never add).
- All built RED→GREEN: 9 scenarios (fictional startup fixture), honest RED
  (baseline refuses explicit unethical asks 9/9; fails on self-invented
  claims, uncounted characters, no trace artifacts), GREEN 9/9, zero
  REFACTOR rounds.

## [0.14.1] - 2026-07-29
### Changed
- lean-sdd implementer prompt now names the standing disciplines explicitly
  (lean-tdd, lean-verification, lean-debugging) so dispatched coding agents —
  which never receive the SessionStart hook — are pointed at the skills in
  their own prompt.

## [0.14.0] - 2026-07-29
### Added
- Superpowers replacement complete — five skills forking the remaining
  superpowers disciplines/procedures (MIT-attributed; built RED→GREEN with
  two-tier baselines: session-default model 15/15 PASS, haiku probes exposed
  the real failures the skills close):
  - `lean-tdd`: failing-test-first with the stash/scratch-file loophole
    closed (haiku RED kept the implementation "as reference via git stash"),
    mandatory verify-RED/GREEN, first-run-pass tripwire, lean-plans
    behavior-table integration.
  - `lean-verification`: evidence-before-claims with the pre-scripted-success
    counter (haiku RED authored "Done. 212/212" before any run), the gate
    function, claims table, and the lean-sdd evidence chain.
  - `lean-debugging`: root-cause-first with the no-patch-as-"insurance"
    clause (haiku RED reintroduced the rejected symptom patch as fallback),
    revert-as-honest-exit, and the three-fix architecture breaker.
  - `lean-worktrees`: detect → native tool (EnterWorktree) → guarded
    gitignore-verified fallback → clean baseline.
  - `lean-finishing`: fresh-suite-on-the-exact-tree, integration menu with an
    explicit-delegation conditional, typed-`discard` confirmation, and
    protected-branch routing (GH013 → PR with required checks and the repo's
    allowed merge method).
- `lean-sdd` gains a bundled final whole-branch review template
  (`references/final-review-prompt.md`, adapted from
  superpowers:requesting-code-review) with ledger deferred/parked triage.
### Changed
- Lean-suite cross-references now point at the forks (lean-sdd →
  lean-worktrees/lean-finishing/final-review template; lean-brainstorming →
  lean-debugging); `hooks/session-context.md` rewritten to route all
  disciplines to the lean suite — the superpowers plugin can now be disabled.

## [0.13.0] - 2026-07-29
### Added
- Lean pipeline — three skills forking the superpowers spec→plan→execute flow
  for speed at equal quality (MIT-attributed; built RED→GREEN, 9/9 scenarios,
  zero refactor rounds):
  - `lean-brainstorming`: batched-question requirements exploration (2–4
    blocking questions in ONE round, one-shot design message, single combined
    design+spec approval gate) with a hard no-code-before-approval gate; ~2
    round trips instead of 8+. Hands off to `lean-plans`.
  - `lean-plans`: contract-level implementation plans — exact interfaces,
    behavior tables, exact values, and a Task Dependency Table with risk tiers
    (mechanical/standard/judgment) that drives downstream scheduling and
    review depth; code in the plan only where exactness is the requirement.
    Bundled plan template. ~3× shorter than code-transcription plans.
  - `lean-sdd`: pipelined subagent execution — reviewer(N) runs concurrently
    with implementer(N+1) on disjoint files, SPEC_ONLY reviews on the cheapest
    model for mechanical tasks (with escalation tripwire), 3-round fix cap
    then adjudication, exact ledger line formats, file-based brief/report/diff
    handover. Bundled prompt templates + workspace/brief/review-package
    scripts (`.soltero/lean-sdd/`).
- SessionStart hook (`hooks/`): injects the skill-first bootstrap and lean
  pipeline routing into every session — first step toward replacing the
  superpowers plugin's session hook entirely.

## [0.12.0] - 2026-07-24
### Added
- PRD & plan pipeline — six skills covering idea → requirements → gated
  design handoff → gated execution:
  - `writing-prds`: brainstorming-style dialogue that turns an idea into a PRD
    at `docs/prds/` — hard gate (no design/code before approval), blocking vs
    defaultable question classes (bans assumption-flag-and-proceed),
    decomposition before drafting, section-by-section approval, bundled PRD
    template; hands off to superpowers:brainstorming.
  - `prd-user-stories`: stories traceable to stated requirements with compact
    Given/When/Then criteria that survive "keep it light" pressure; no invented
    personas or thresholds.
  - `prd-scoping`: decomposition-first scope sections, MoSCoW with a forced
    Must budget, and an Out-of-scope list that gets reworded, never removed.
  - `prd-success-metrics`: every metric carries baseline/target/timeframe/
    measurement source; unsourced numbers marked `(proposed — confirm)`; 3–5
    primary cap plus a guardrail.
  - `prd-review`: 6-dimension grading council (bundled Workflow: band-anchored
    graders → anti-inflation skeptics on ≥90 → regrade-min) with a hard gate —
    overall ≥95 AND every dimension ≥80, else BLOCKED; fix→re-review loop where
    the fixer never changes the verdict. Live-smoke-verified (flawed fixture →
    43.7 BLOCKED, 6/6 graders).
  - `plan-review`: sibling council for implementation plans (decomposition,
    verifiability, spec fidelity, concreteness, risk/reversibility,
    consistency) between superpowers:writing-plans and executing-plans; no
    safe-subset carve-outs, no fix-author self-re-review. Live-smoke-verified
    (41.9 BLOCKED).
- All built test-first per `creating-a-skill`: 18 open-ended pressure
  scenarios, honest RED baselines (including recorded baseline passes), GREEN
  18/18 with skill-section citations, both council workflows smoke-run live.

## [0.11.0] - 2026-07-22
### Added
- `design-forge`: living, license-verified catalog of free front-end design
  sources (agent-playbook-style three-file references + bundled sweep workflow
  with an independent LICENSE-file verifier, default-reject) plus apply mode:
  detect stack → 3-4 aesthetic-direction Artifact previews with real content →
  explicit pick + confirmation → implement on a branch. Ships seeded (11
  verified entries; React Bits/Aceternity/GSAP rejected on license evidence).
- `dev-debrief`: nightly local transcript scan across all projects → daily
  work summary + skill telemetry (triggers, missed triggers) in
  `Docs/debriefs/`, Sunday deep pass with evidence-cited per-skill grades and
  ledger-compatible improvement recommendations; silent skip on no-coding
  days; hardened redaction (never cite a secret's value OR its location).
- `transcript-reader`: verified meeting-transcript extraction via a bundled
  Workflow pipeline on every transcript (deterministic ingest/chunk script →
  parallel schema-forced extractors → cross-chunk reduce → per-item refute
  verifiers → completeness critic → cited report); correction-fed ACE-style
  rule pool. Battle-tested: 37/37 recall, 84/84 grounded citations, 0 broken,
  4/4 planted traps caught on an answer-keyed 2h fixture.
- `code-by-hand`: user-invoked-only navigator/driver mode — the user types
  every line, the agent presents logical blocks with per-line notes, verifies
  typed reality (drift explained, never silently accepted/reverted/fixed),
  runs checkpoints; `.code-by-hand.md` session state; hard no-agent-edits rule
  with delegation logging. RED baseline: 2/4 agents edited files themselves.
- All four built test-first per `creating-a-skill` (honest RED baselines incl.
  discarded contaminated probes, disk-verified GREEN, gates green).

## [0.10.0] - 2026-07-17
### Added
- Memory & self-improvement suite — six skills built from the 2026-07-17 research
  sweep and roadmap (`docs/plans/2026-07-17-memory-skills-roadmap.md`), all sharing
  one design rule: the verifier stays outside the loop's write surface.
  - `memory-gardener`: skeptic-gated curation/consolidation of persistent memory
    (dedupe, merge, distill, prune as itemized edits; provenance gating; new
    `memory-skeptic` agent approves every destructive edit).
  - `correction-compiler`: compiles repeated user corrections into human-approved
    deterministic enforcement (hooks/lint/CI) with a structured, Traced-To
    corrections ledger (`Docs/corrections-ledger.md`) shared with `skill-patcher`.
  - `session-miner`: offline transcript mining for recurring successful procedures;
    smallest-artifact-first proposals under `Docs/mining/proposals/`, independent
    reviewer verdicts, redaction/provenance rules; never touches live surfaces.
  - `skill-gardener`: report-only lifecycle/staleness audit of installed skills
    (structural validation, live-evidence freshness spot-checks, config-driven
    retirement thresholds) written to `Docs/skill-garden-report-YYYY-MM-DD.md`.
  - `skill-patcher`: clusters corrections/lessons across sessions (≥3 traced
    incidents or ≥2 independent sessions) and opens itemized patch PRs against the
    guilty skill files; self-modification in separate labeled PRs; never merges
    its own PRs.
  - `evidence-gate`: fail-closed verification receipts for lifecycle claims —
    tree-hash-bound JSON receipts produced by observed runs via bundled
    `create-receipt`/`verify-receipt` scripts; stale-tree evidence auto-fails;
    prose reports are never evidence.
- Playbook sweep 2026-07-17: 12 sources, 88 skeptic-vetted entries (87 adds,
  1 update) across all seven topics.
- All six skills built test-first per `creating-a-skill` (RED pressure scenarios
  on fresh subagents → GREEN with disk-verified results → validation gates).

## [0.9.0] - 2026-07-10
### Added
- `agent-playbook` skill: living, tiered (Proven/Promising/Watch) playbook of
  coding-agent and agentic-loop best practices. Advisor mode applies source-linked,
  tier-labeled entries during agent-engineering work; update mode (soltero-skills
  repo only) runs a bundled Workflow — 3-lane sweep (arXiv, lab blogs, OSS agent
  frameworks) → dedupe vs persistent source log → deep-read → one-skeptic tiering
  (default demote) → synthesis diffs + per-sweep digest. Per-stage model pins
  (sonnet fan-out, opus synthesis) so sweeps never inherit the session model.
  Ships bootstrap-seeded: 258 entries from 36 vetted sources.

## [0.8.0] - 2026-07-02
### Added
- `walkthrough-tutor` skill: an interactive, level-calibrated tutoring session over a branch/PR's
  changes. Calibrates to the learner first, gives the big-picture mental model before any code, then
  drills down one layer per turn with comprehension checks, pausing to teach the underlying concepts
  — a turn-taking session, not a one-shot wall-of-text diff dump. Pure prompt/process skill (SKILL.md
  only). Built test-first: scenarios were rewritten open-ended (an A/B/C option that spells out the
  method telegraphs it for a pedagogy skill); the open-ended RED default is a wall of text, and with
  the skill all three scenarios open with calibration-only first replies.

## [0.7.0] - 2026-07-02
### Added
- `code-optimizer` skill: whole-repo cleanup that applies changes on a branch behind a real test
  gate. An inline sequenced pipeline (not a swarm — it writes code): clean-tree + new branch, a
  `.code-optimizer.yml` config with a public-API allowlist (bootstrapped from the project's declared
  standards if absent), a required green baseline, then four serial per-category commits (dead-code
  → redundancy → file-split → guideline fixes) each re-verified with the project's own commands and
  discarded on breakage. Detection is tool-grounded (knip/ts-prune/ESLint/ruff/vulture/jscpd), never
  eyeballed; a callerless symbol needs a dynamic-reference check + gate + allowlist before removal,
  so live-but-unreferenced code (dynamic dispatch, string-keyed registries) is never deleted.
  Bundles `reference.md` (per-language tool matrix + config schema). Findings that can't be
  automated safely are listed for manual follow-up.

## [0.6.0] - 2026-07-01
### Added
- `audit-swarm` skill: whole-repo security + legal audit. A bundled Workflow script runs
  scout → adaptive specialist finders (secrets, injection, authz, crypto/config, supply
  chain, licenses; conditional PII, regulatory, attribution, stack-specific) → 3-skeptic
  majority-vote verification → a severity-ranked report at `Docs/audit-YYYY-MM-DD.md`.
  Opt-in `thorough` mode loops finder rounds until dry. Findings only — never edits code.
- Plugin agents `security-auditor` and `finding-skeptic`: read-only audit specialists
  (tools limited to Read/Grep/Glob/Bash) reusable by future swarm-style skills.
- `tools/check-workflow-syntax.mjs` + `check:workflows` script: syntax-gates Workflow
  scripts under the runtime's dialect (top-level `await` + `return`), which plain
  `node --check` rejects. Wired into `npm test` and the aggregate `check`.

## [0.5.1] - 2026-06-14
### Fixed
- `build-mcp-server`: the Streamable HTTP template combined `createMcpExpressApp()` (which already
  installs `express.json()`) with a second `app.use(express.json({ limit }))`, so the second parser
  read an already-consumed request stream and **every POST 500'd** (`stream is not readable`). Found
  while dogfooding the skill to build a real server. The template + `reference.md` now build the
  Express app by hand (DNS-rebinding via `localhostHostValidation`/`hostHeaderValidation` + a single
  `express.json({ limit })`), add an `ALLOWED_HOSTS` env for non-localhost binds, and document the
  gotcha. Verified end-to-end against SDK 1.29.0: 401 without/with a bad bearer, 200 + `initialize`
  result with a valid bearer, 405 on `GET /mcp`.

## [0.5.0] - 2026-06-14
### Added
- `build-mcp-server` skill: build, harden, and deploy a production-grade MCP server in TypeScript
  on the official `@modelcontextprotocol/sdk`. Centers a verify-the-SDK-first rule (the API is
  mid-migration: stable v1.29.x monolith + **raw-shape** `inputSchema` vs the v2.0.0-alpha scoped
  packages + `z.object` — pin the installed version, never author from memory), the
  stdout-is-the-stdio-channel rule, the tool-vs-resource decision, and a default production floor
  (Zod validation + typed `isError` + stderr logging, both transports, bearer auth + Zod env,
  tests + CI + Dockerfile), then verifies via the MCP Inspector and `claude mcp add`. Bundles
  `reference.md` (verified-current v1.29.0 API, sourced from the SDK repo at tag `v1.29.0`) and
  `templates/` (shared `buildServer()`, stdio + Streamable HTTP entries, Zod env, stderr logger,
  in-memory integration test, CI, multi-stage non-root Dockerfile). RED baseline (3 fresh agents,
  no skill) shipped a single-transport stdio toy when asked for "a working server" and drifted on
  the SDK API across runs (raw-shape vs `z.object`, hardcoded `^1.0.0`); with the skill all three
  ran `npm view` first, pinned v1.29.x, split tool-vs-resource, honored the stdout rule, and built
  the full floor — one agent compiled the templates against real SDK 1.29.0 to 10/10 passing tests.

## [0.4.0] - 2026-06-14
### Added
- `agent-handoff` skill: writes/refreshes a living `HANDOFF.md` enforcing the 8 elements that make
  work resumable (goal, status, decisions+why, ordered next steps, files **with line refs**,
  gotchas, **open questions**, resume & verify) so a fresh agent continues with zero re-derivation.
  Bundles `hooks/context-watch.mjs` — a `UserPromptSubmit` hook that estimates context from the
  transcript and reminds at a configurable threshold (~40%), the closest reliable approximation
  since Claude Code has no native context-% trigger. RED baseline missed file/line refs in all 3
  scenarios and suppressed open questions; with the skill (validated against a real fixture) all 8
  elements present with verified-real line refs and honestly surfaced open questions.

## [0.3.0] - 2026-06-14
### Added
- `scaffold-frontend` skill: a menu + scaffolder for new front-ends. Presents a neutral
  framework tradeoffs menu (Next.js / Vite+React / Astro / Expo) and the matching UI layer
  (Tailwind v4 + shadcn/ui + ReactBits for web; NativeWind + react-native-reusables for mobile),
  scaffolds via the official CLI, then applies a bundled standards layer (strict TS, ESLint, Zod
  env validation, security headers, vitest, pre-commit, CI, `Docs/`, `CLAUDE.md`). RED baseline
  showed a casual agent presented route options 0/3 and applied only eslint; with the skill,
  route options reached 3/3 and standards coverage ~8.7/9. Commands verified against current docs.

## [0.2.0] - 2026-06-13
### Added
- `prisma-safety-review` skill: triggers a systematic safety pass before DB changes merge,
  with two deterministic scripts (`check-prisma-versions`, `scan-prisma-antipatterns`) and a
  checklist for the high-cost, easy-to-skip issues (transaction-less bulk writes, pagination
  tiebreakers, version drift, `db push`, N+1, missing indexes). Built lean after a RED
  baseline showed a capable agent already catches most issues unaided; validated to lift a
  fast-model casual review from 1/3 to 3/3 on the hardest scenario.

## [0.1.0] - 2026-06-13
### Added
- `creating-a-skill` meta-skill encoding the test-driven authoring process.
- `capture-lesson` skill for structured `Docs/mistakes-and-fixes.md` entries.
- Plugin + marketplace manifests, frontmatter linter, CI validation.
