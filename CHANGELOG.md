# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog]; this
project adheres to Semantic Versioning.

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
