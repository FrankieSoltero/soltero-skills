---
name: scaffold-frontend
description: Use when starting a new front-end or adding one to a repo ("set up a new web app", "spin up a Next/Vite/Astro/Expo project", "bootstrap the UI", "new dashboard/marketing site/mobile app") — presents a neutral framework + UI-layer menu, scaffolds the chosen stack via its official CLI, then wires in the standards layer (strict TS, Zod env validation, security headers, lint, vitest, CI, Docs/ and CLAUDE.md) that a default scaffold skips.
---

# Scaffold Frontend

## Overview

A default scaffold gets you a running app but skips two things every time: it picks one
framework silently, and it ships none of the standards layer (env validation, security headers,
strict TS, CI, Docs/CLAUDE.md). This skill fixes both — **offer the routes, then wire the
standards** — ending at a runnable project that matches the author's conventions.

## When to Use

- Starting a new front-end project, or adding a front-end to an existing repo.

## When NOT to Use

- Designing the actual UI/aesthetics (use `frontend-design`). This is *infra*, not design.
- Backend-only or non-front-end work.

## The Flow

1. **Offer the framework menu — do NOT pick silently.** Present the tradeoffs table below and
   let the user choose.

   | Route | Best for |
   |-------|----------|
   | **Next.js (App Router)** | App + SEO/SSR, server components, full-stack |
   | **Vite + React (SPA)** | Client-only apps, fastest dev, no SSR needed |
   | **Astro** | Content / marketing / docs — ships minimal JS |
   | **Expo / React Native** | Cross-platform mobile (iOS + Android) |

2. **Offer the UI/component layer** for the chosen framework, then let the user choose:
   - **Web (Next/Vite/Astro):** Tailwind v4 → **shadcn/ui** primitives → optional **ReactBits**
     for animated components.
   - **Mobile (Expo):** **NativeWind** → **react-native-reusables** ("shadcn for RN"). Web
     shadcn/ui is DOM-only — do not use it in Expo.

3. **Scaffold via the official CLI** — exact current commands in `reference.md`. Ride the
   maintained scaffolders; don't hand-roll boilerplate.

4. **Apply the standards layer** — copy from `templates/` and adapt. This is the part a default
   scaffold omits, so it is the part you MUST NOT skip:

   - [ ] Strict `tsconfig` (+ `verbatimModuleSyntax`) — `templates/tsconfig.strict.json`
   - [ ] ESLint flat config (or Biome) — `templates/eslint.config.mjs`
   - [ ] Zod env validation + `.env.example` — `templates/env.ts`, `templates/.env.example`
   - [ ] Security headers — `templates/next.config.security.ts` (Next) / static `_headers` (see reference)
   - [ ] Vitest setup — `templates/vitest.config.ts`, `templates/vitest.setup.ts`
   - [ ] CI workflow — `templates/ci.yml`
   - [ ] `Docs/mistakes-and-fixes.md` seed — `templates/mistakes-and-fixes.md`
   - [ ] Project `CLAUDE.md` — `templates/CLAUDE.md.template`

5. **Verify it runs** — install, then start the dev server (and typecheck/lint/test) before
   handing back.

## Gotchas that bite (and that stale guidance gets wrong)

- **shadcn**: the CLI is `npx shadcn@latest …` — the old `shadcn-ui` package is **deprecated**.
- **Tailwind v4 differs per build tool**: `@tailwindcss/vite` (Vite/Astro) vs
  `@tailwindcss/postcss` (Next.js). Config is **CSS-first** (`@import "tailwindcss"` + `@theme`),
  not `tailwind.config.js`.
- **React Native is the exception**: NativeWind + react-native-reusables run on **Tailwind v3**
  (`@tailwind` directives + `tailwind.config.js`). Never apply Tailwind v4's CSS-first steps to
  an Expo app.
- **Vite create needs the standalone `--`**: `npm create vite@latest name -- --template react-ts`.
- **Pin the Expo SDK** during transitions: `--template default@sdk-56` (else you get an older SDK).

## Red Flags — STOP

- Scaffolding a framework without first offering the route menu → STOP, present the options.
- Handing back a project with no env validation, no security headers, no CI, no Docs/CLAUDE.md →
  the standards layer is the whole point; apply it.
- Emitting `npx shadcn-ui@latest` or Tailwind-v4 CSS-first steps inside a React Native project →
  both are wrong; see Gotchas.
