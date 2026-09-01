# Scaffold Frontend — Reference

Verified current commands (checked against official docs). CLIs drift — re-verify the
version-sensitive lines against the linked docs before a release.

## Table of contents
1. Framework tradeoffs
2. Scaffold commands (per framework)
3. UI layer — web (Tailwind v4 + shadcn/ui + Magic UI)
4. UI layer — mobile (NativeWind + react-native-reusables)
5. Standards layer notes (lint, headers, env, tests, CI)
6. Current gotchas

---

## 1. Framework tradeoffs

| Route | Picks it when | Skips it when |
|-------|---------------|---------------|
| **Next.js (App Router)** | You need SSR/SSG/RSC, SEO, or a full-stack app with API routes | A pure client SPA — Next is heavier than needed |
| **Vite + React (SPA)** | Client-only app behind auth (dashboards, tools); fastest dev loop | You need SEO/SSR — an SPA renders blank to crawlers |
| **Astro** | Content/marketing/docs; ships ~zero JS by default; islands for interactivity | A highly interactive app — you'll fight the islands model |
| **Expo / React Native** | Native iOS + Android from one codebase | Web-only — use a web route instead |

Node baselines drift with each framework major, and the majors move faster than this file. All
four routes currently want an even-numbered active LTS (Node 22+); Astro additionally rejects odd
Node versions outright. Confirm against the installed major's release notes before pinning CI.

## 2. Scaffold commands (per framework)

```bash
# Next.js (App Router, TS, ESLint, Tailwind, src/, alias). TS/Tailwind/App Router/Turbopack are defaults in v16.
npx create-next-app@latest my-app --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
#   --no-eslint / --no-tailwind / --js to opt out; --no-agents-md to skip the auto CLAUDE.md/AGENTS.md

# Vite + React (react-ts). The standalone `--` is REQUIRED so npm passes flags to create-vite.
npm create vite@latest my-app -- --template react-ts

# Astro, then add integrations (TS preset: base | strict | strictest in the wizard).
npm create astro@latest my-app
cd my-app && npx astro add react tailwind     # @tailwindcss/vite (v4); deprecates @astrojs/tailwind

# Expo (TS + Expo Router preconfigured). Look up the current SDK major, then pin it:
npm view expo version                  # e.g. 57.x -> use sdk-57
npx create-expo-app@latest my-app --template default@sdk-<major>
```
Docs: nextjs.org/docs/app/api-reference/cli/create-next-app · vite.dev/guide · docs.astro.build/en/install-and-setup · docs.expo.dev/get-started/create-a-project

## 3. UI layer — web (Tailwind v4 + shadcn/ui + Magic UI)

**Tailwind v4 — different package per build tool:**
```bash
# Vite / Astro — the Vite plugin:
npm install tailwindcss @tailwindcss/vite
#   vite.config.ts: plugins: [tailwindcss()]      (Astro: astro add tailwind does this for you)
# Next.js — the PostCSS plugin (NOT the Vite plugin):
npm install tailwindcss @tailwindcss/postcss postcss
#   postcss.config.mjs: { plugins: { "@tailwindcss/postcss": {} } }
```
```css
/* Your main CSS — v4 is CSS-first; this single line replaces @tailwind base/components/utilities */
@import "tailwindcss";
@theme {                       /* design tokens live here, not tailwind.config.js */
  --color-brand-500: oklch(0.72 0.11 178);
}
/* Only if you must keep a legacy JS config: */
@config "../../tailwind.config.js";
```

**shadcn/ui** (package is `shadcn`, not `shadcn-ui`):
```bash
npx shadcn@latest init        # -t next|vite|start|react-router|astro ; -b radix|base ; -d ; -y
npx shadcn@latest add button  # or: add (interactive) / add -a (all) / --overwrite / --dry-run
```
Prereq for **Vite/Astro**: the `@/*` → `./src` alias must exist in BOTH the bundler config and
`tsconfig(.app).json` *before* `init`, or alias resolution fails. (Next sets this up already.)

**Magic UI** (animated components — NOT an npm dependency; add per component). MIT, verified
2026-07-21 from the project's LICENSE file; see `design-forge/references/catalog.md`:
```bash
npx shadcn@latest add "https://magicui.design/r/<component>.json"
```
> **Not ReactBits.** design-forge's license verifier fetched its LICENSE.md on 2026-07-21 and
> rejected it: "MIT + Commons Clause License Condition v1.0", GitHub SPDX `NOASSERTION`, not
> OSI-approved. Copying its component source counts as an install of that source. Any other
> animation library needs its own LICENSE-file verification before it enters a repo.

## 4. UI layer — mobile (NativeWind + react-native-reusables)

> ⚠️ React Native uses **Tailwind v3**, not v4. Do not apply the web CSS-first steps here.

```bash
# NativeWind v4 (pins Tailwind v3):
npx expo install nativewind react-native-reanimated react-native-safe-area-context
npm install -D tailwindcss@^3.4.17 prettier-plugin-tailwindcss babel-preset-expo
npx tailwindcss init     # creates tailwind.config.js
#   tailwind.config.js: presets: [require('nativewind/preset')] + content globs
#   babel.config.js: presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel']
#   metro.config.js: withNativeWind(config, { input: './global.css' })
#   global.css uses v3 directives: @tailwind base; @tailwind components; @tailwind utilities;
#   add nativewind-env.d.ts: /// <reference types="nativewind/types" />

# react-native-reusables ("shadcn for RN"):
npx @react-native-reusables/cli@latest init          # -t minimal | minimal-uniwind | clerk-auth
npx @react-native-reusables/cli@latest add button    # add (interactive) / add -a / --overwrite
npx @react-native-reusables/cli@latest doctor        # diagnose an existing setup
```
Docs: tailwindcss.com · ui.shadcn.com · magicui.design · nativewind.dev · reactnativereusables.com

## 5. Standards layer notes

- **Lint:** `templates/eslint.config.mjs` (ESLint v9 flat, typescript-eslint v8 strict-type-checked,
  react-hooks v6 `recommended-latest`, jsx-a11y; `eslint-config-prettier` LAST). Biome alternative:
  `npm i -D --save-exact @biomejs/biome && npx @biomejs/biome init` (v2: `includes` not `ignore`;
  `domains.react`; run `biome check --write .`).
- **Pre-commit:** `npm i -D husky lint-staged && npx husky init`; put `npx lint-staged` in
  `.husky/pre-commit`. Config: `templates/lint-staged.config.mjs` (+ `templates/pre-commit`).
- **Security headers** (web only — a native Expo app has no HTTP server/CSP, so skip for mobile):
  Next.js → `templates/next.config.security.ts` (CSP, X-Frame-Options DENY,
  X-Content-Type-Options nosniff, Referrer-Policy, HSTS, Permissions-Policy, `poweredByHeader:false`).
  Vite/Astro → headers belong on the **host/CDN**, not the dev server. For static hosts
  (Netlify/Cloudflare Pages) add `public/_headers`:
  ```
  /*
    Content-Security-Policy: default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
    X-Frame-Options: DENY
    X-Content-Type-Options: nosniff
    Referrer-Policy: no-referrer
    Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  ```
- **Env:** `templates/env.ts` (Zod, fail-fast). Client-exposed vars need the framework prefix:
  Next `NEXT_PUBLIC_`, Vite `VITE_`, Astro `PUBLIC_`, Expo `EXPO_PUBLIC_`. Everything else is server-only.
- **Tests:** `templates/vitest.config.ts` + `vitest.setup.ts`. Install:
  `npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react`.
- **CI:** `templates/ci.yml` (checkout → setup-node 22 → `npm ci` → typecheck → lint → test → build).

## 6. Current gotchas

- shadcn CLI is `shadcn`, not the deprecated `shadcn-ui`.
- Tailwind v4 packages differ by tool (`@tailwindcss/vite` vs `@tailwindcss/postcss`); v4 is CSS-first
  (`@import "tailwindcss"`), dropped `tailwind.config.js` auto-detection, and replaced
  `@tailwind base/...` with one `@import`. Behavioral breaks: ring 3px→1px, default border color
  gray-200→currentColor, `outline-none`→`outline-hidden`, `bg-[--x]`→`bg-(--x)`.
- React Native (NativeWind/RNR) is Tailwind **v3** — pin `tailwindcss@^3.4.17`.
- `npm create vite` needs the standalone `--` before flags; template is exactly `react-ts`.
- Pin the Expo SDK to the major `npm view expo version` reports — never to a number copied from here.
- shadcn init on Vite/Astro needs the `@/*` alias configured first, in both bundler + tsconfig.
