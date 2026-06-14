# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog]; this
project adheres to Semantic Versioning.

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
