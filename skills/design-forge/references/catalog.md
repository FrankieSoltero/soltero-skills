# Design Source Catalog

License-verified free front-end design sources. **Only entries in this catalog may be
installed** (hard rule 1); gallery entries are aesthetic vocabulary only and are never
installed or copied (hard rule 5). Every installable entry's License line cites the
actual LICENSE file URL it was verified from; `last-verified` is the field the
skill-gardener freshness audit reads.

## Component libraries

### shadcn/ui
- **URL:** https://ui.shadcn.com/
- **Frameworks:** react
- **License:** MIT (verified 2026-07-21 from https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md)
- **Install:** cli — `npx shadcn@latest init`, then `npx shadcn@latest add <component>` (copies source into your repo)
- **Good for:** copy-into-your-repo, accessible, Tailwind-styled React components (Radix/Base UI primitives) you own and restyle
- **Health:** last commit 2026-07-21; release shadcn@4.13.1 published 2026-07-17
- **last-verified:** 2026-07-21

### HeroUI (formerly NextUI)
- **URL:** https://www.heroui.com/
- **Frameworks:** react
- **License:** Apache-2.0 (verified 2026-07-21 from https://raw.githubusercontent.com/heroui-inc/heroui/v3/LICENSE — repo default branch is `v3`; note the npm manifest of @heroui/react says "MIT", an upstream inconsistency between two permissive licenses)
- **Install:** npm — `npm install @heroui/react`
- **Good for:** full production-ready, React-Aria-based accessible component library with Tailwind theming
- **Health:** release v3.2.2 published 2026-07-07; repo pushed 2026-07-22
- **last-verified:** 2026-07-21

### daisyUI
- **URL:** https://daisyui.com/
- **Frameworks:** css-only | react | vue | svelte
- **License:** MIT (verified 2026-07-21 from https://raw.githubusercontent.com/saadeghi/daisyui/master/LICENSE)
- **Install:** npm — `npm i -D daisyui@latest`, then add as a Tailwind CSS plugin
- **Good for:** semantic Tailwind component classes usable from any framework that renders HTML/CSS; fast theming, zero JS
- **Health:** release v5.7.0 current on npm; repo pushed 2026-07-21
- **last-verified:** 2026-07-21

### Radix UI Primitives
- **URL:** https://www.radix-ui.com/primitives
- **Frameworks:** react
- **License:** MIT (verified 2026-07-21 from https://raw.githubusercontent.com/radix-ui/primitives/main/LICENSE)
- **Install:** npm — `npm install @radix-ui/react-<primitive>` (e.g. @radix-ui/react-dialog)
- **Good for:** unstyled, accessible low-level React primitives for building fully custom design systems
- **Health:** repo pushed 2026-07-21; @radix-ui/react-dialog 1.1.20 published 2026-07-20
- **last-verified:** 2026-07-21

### Headless UI
- **URL:** https://headlessui.com/
- **Frameworks:** react | vue
- **License:** MIT (verified 2026-07-21 from https://raw.githubusercontent.com/tailwindlabs/headlessui/main/LICENSE)
- **Install:** npm — `npm install @headlessui/react` / `@headlessui/vue`
- **Good for:** unstyled, fully accessible interactive primitives (menus, dialogs, listboxes) to pair with Tailwind or custom CSS
- **Health:** @headlessui/react 2.2.10 published 2026-04-07; repo pushed 2026-04-13. Caveat: @headlessui/vue last published 2024-09-09 — the Vue binding lags the React one
- **last-verified:** 2026-07-21

## Animation & effects blocks

### Magic UI
- **URL:** https://magicui.design/
- **Frameworks:** react
- **License:** MIT (verified 2026-07-21 from https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md)
- **Install:** cli — `npx shadcn@latest add "https://magicui.design/r/<component>.json"` (shadcn-compatible registry; endpoint verified live)
- **Good for:** animated React components/effects (marquees, icon clouds, shine borders) as a shadcn/ui companion
- **Health:** last commit 2026-07-21 (GPG-verified, PR #991)
- **last-verified:** 2026-07-21

### Motion (formerly Framer Motion)
- **URL:** https://motion.dev/
- **Frameworks:** react | vue
- **License:** MIT (verified 2026-07-21 from https://raw.githubusercontent.com/motiondivision/motion/main/LICENSE.md — core packages only; the paid "Motion+" add-ons are a separate product not covered by this entry)
- **Install:** npm — `npm install motion` (React) / `npm install motion-v` (Vue)
- **Good for:** production-grade declarative animation — transitions, gestures, springs, scroll-linked and layout animations
- **Health:** motion 12.42.2 published 2026-06-30; motion-v 2.3.0 published 2026-06-08; repo pushed 2026-07-01
- **last-verified:** 2026-07-21

## Design galleries (vocabulary only — never installable)

### Awwwards
- **URL:** https://www.awwwards.com/
- **Frameworks:** n/a
- **License:** n/a — inspiration vocabulary only, never installable (terms: https://www.awwwards.com/terms/ — showcased sites remain their creators' IP)
- **Install:** n/a — never installable (vocabulary only)
- **Good for:** awarded-site vocabulary for motion/interaction patterns and current visual-trend research
- **Health:** live Site of the Day dated 2026-07-21 at verification time; daily curation active
- **last-verified:** 2026-07-21

### Minimal Gallery
- **URL:** https://minimal.gallery/
- **Frameworks:** n/a
- **License:** n/a — inspiration vocabulary only, never installable (terms: https://minimal.gallery/legal — permits limited personal use for inspiration)
- **Install:** n/a — never installable (vocabulary only)
- **Good for:** minimalist, typography-led, low-ornament aesthetic direction across portfolios, agencies, and startups
- **Health:** entries dated same-day to 3 days old at verification time; legal page updated May 2026
- **last-verified:** 2026-07-21

## Icons, fonts & color resources

### Lucide
- **URL:** https://lucide.dev/
- **Frameworks:** react | vue | svelte | web-components | css-only
- **License:** ISC (verified 2026-07-21 from https://raw.githubusercontent.com/lucide-icons/lucide/main/LICENSE — carries a compatible MIT notice for ~130 icons inherited from Feather)
- **Install:** npm — `npm install lucide-react` / `@lucide/vue` / `@lucide/svelte` / `lucide` (vanilla)
- **Good for:** default icon set of the shadcn/Tailwind ecosystem; 1600+ consistent SVG icons with first-party bindings for every major framework
- **Health:** release 1.25.0 published 2026-07-17; repo pushed 2026-07-21
- **last-verified:** 2026-07-21

### Heroicons
- **URL:** https://heroicons.com/
- **Frameworks:** react | vue | css-only
- **License:** MIT (verified 2026-07-21 from https://raw.githubusercontent.com/tailwindlabs/heroicons/master/LICENSE)
- **Install:** npm — `npm install @heroicons/react` / `@heroicons/vue`, or copy inline SVG
- **Good for:** hand-crafted outline/solid/mini/micro icon styles from the Tailwind Labs ecosystem
- **Health:** v2.2.0 published 2024-11-18; a bounded, deliberately finished icon set (maturity, not neglect) — verifier assessed and accepted on that basis
- **last-verified:** 2026-07-21
