# Skill Spec — scaffold-frontend

- **Problem:** Starting a new front-end means re-making the same ~30 decisions and re-wiring
  the same standards every time — which framework, which component layer, then strict TS, env
  validation, security headers, lint, CI, and the `Docs/` + `CLAUDE.md` baseline. A general
  agent scaffolds a bare default (usually Next.js with default settings), skips the standards
  layer, and may reach for stale CLI commands.

- **Trigger:** Use when starting a new front-end project or adding a front-end to a repo.
  Symptoms: "set up a new web app / front-end", "spin up a Next/Vite/Astro/Expo project",
  "bootstrap the UI", "new dashboard/marketing site/mobile app".

- **Behavior — menu + scaffolder, no recommendation:**
  1. Present a **neutral framework tradeoffs table** (when each wins) and let the user pick:
     Next.js (App Router) · Vite + React (SPA) · Astro · Expo / React Native.
  2. Present the **UI/component layer** for the chosen framework and let the user pick:
     - Web (Next/Vite/Astro): **Tailwind v4** base → **shadcn/ui** primitives → optional
       **Magic UI** add-on for animated components (license-verified in design-forge's
       catalog; ReactBits was rejected there — Commons Clause).
     - Mobile (Expo): **NativeWind** (Tailwind for RN) → **react-native-reusables** ("shadcn
       for RN"). Web shadcn/ui is DOM-only and does not apply to Expo; the skill routes to the
       RN equivalent.
  3. **Scaffold via the official CLI** (`create-next-app`, `npm create vite`, `create astro`,
     `create-expo`), then layer the bundled standards.

- **Standards layer (bundled templates applied after scaffold):** strict `tsconfig`
  (+ `verbatimModuleSyntax` where applicable), eslint/biome config, Zod `env.ts` + `.env.example`
  (no hardcoded secrets), security headers (framework-appropriate), a pre-commit hook, vitest
  setup, a CI workflow, a `Docs/mistakes-and-fixes.md` seed, and a project `CLAUDE.md` template.
  These encode the author's standards and are the skill's main value-add.

- **Scope / non-goals:** Sets up infra + wiring + a runnable starter shell. Does NOT generate
  app features/pages/business logic. Distinct from the `frontend-design` skill (which produces
  distinctive UI *design*) — this is *infra*; they compose. Mobile is covered via Expo only.

- **Mechanism note:** Ride the maintained official scaffolders rather than freezing our own
  boilerplate; keep the exact current commands/registries (shadcn init, Magic UI,
  react-native-reusables, Tailwind v4) in `reference.md` so they are cheap to update as CLIs
  drift. Verify all commands against current docs before shipping.

- **Success scenario:** User: "set up a new front-end for a content/marketing site." Skill shows
  the table, user picks **Astro** + **Tailwind/shadcn**, skill runs `npm create astro`, adds
  Tailwind v4 + shadcn, then applies the standards templates → a runnable Astro project with
  strict TS, env validation, security headers, `Docs/`, `CLAUDE.md`, and CI. A baseline agent
  would have produced a bare Astro default with none of the standards layer and no route menu.

- **Bundled assets:** `templates/` (the standards files), `reference.md` (per-framework current
  commands + the tradeoffs table + UI-layer setup), optionally `scripts/apply-standards.mjs`.

- **Deferred follow-up (user's note):** a `frontend-style-guide` skill (design tokens / house
  style: color, type, spacing, the shadcn theme) — its own skill, will likely lean on
  `frontend-design`. Tracked on the roadmap; not in this skill's scope.
