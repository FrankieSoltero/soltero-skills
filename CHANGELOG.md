# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog]; this
project adheres to Semantic Versioning.

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

> Note: released from a branch off 0.5.1; if audit-swarm's 0.6.0 (PR #6) merges first, this rebases
> onto it so versions stay monotonic.
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
