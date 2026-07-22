# Source Log

Every source a sweep evaluated, with its disposition — so rejected sources are never
re-litigated from the same marketing page. Keys are canonical URLs; the sweep dedupes
against this whole table (already-cataloged sources resurfaced by the news lane are
re-verified, not deduped away).

**Last sweep:** 2026-07-21 (bootstrap run; window 2026-01-21 → 2026-07-21).

| Key | Title | Evaluated | Disposition | Reason |
|-----|-------|-----------|-------------|--------|
| https://ui.shadcn.com/ | [shadcn/ui](https://ui.shadcn.com/) | 2026-07-21 | adopted | MIT verified from https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md; CLI install confirmed on npm (shadcn 4.13.1); commit activity same-day |
| https://www.reactbits.dev/ | [React Bits](https://www.reactbits.dev/) | 2026-07-21 | rejected | LICENSE.md fetched (https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md) is "MIT + Commons Clause License Condition v1.0" — restriction quoted: "you do not sell, sublicense, or redistribute the components themselves — whether alone, in a bundle, or as a ported version"; GitHub spdx NOASSERTION; not OSI-approved |
| https://ui.aceternity.com/ | [Aceternity UI](https://ui.aceternity.com/) | 2026-07-21 | rejected | No LICENSE file for free components (/license 404s; /licence is the PAID Pro marketplace license); site terms (https://ui.aceternity.com/terms) prohibit "Reproduce, duplicate or copy material" and "Redistribute content" with no free-tier carve-out; free tier of a commercial product |
| https://magicui.design/ | [Magic UI](https://magicui.design/) | 2026-07-21 | adopted | MIT verified from https://raw.githubusercontent.com/magicuidesign/magicui/main/LICENSE.md; registry install endpoint fetched live (r/marquee.json HTTP 200); same-day commit |
| https://www.heroui.com/ | [HeroUI (formerly NextUI)](https://www.heroui.com/) | 2026-07-21 | adopted | Apache-2.0 verified from default branch https://raw.githubusercontent.com/heroui-inc/heroui/v3/LICENSE; npm @heroui/react 3.2.2 confirmed; upstream npm-manifest says MIT (inconsistency noted in entry) |
| https://daisyui.com/ | [daisyUI](https://daisyui.com/) | 2026-07-21 | adopted | MIT verified from https://raw.githubusercontent.com/saadeghi/daisyui/master/LICENSE; npm daisyui 5.7.0 confirmed; same-day push |
| https://www.radix-ui.com/primitives | [Radix UI Primitives](https://www.radix-ui.com/primitives) | 2026-07-21 | adopted | MIT verified from https://raw.githubusercontent.com/radix-ui/primitives/main/LICENSE; npm @radix-ui/react-dialog 1.1.20 confirmed; same-day push |
| https://motion.dev/ | [Motion (formerly Framer Motion)](https://motion.dev/) | 2026-07-21 | adopted | MIT verified from https://raw.githubusercontent.com/motiondivision/motion/main/LICENSE.md; paid Motion+ is a separate product, core LICENSE has no carve-outs; npm motion 12.42.2 + motion-v 2.3.0 confirmed |
| https://lucide.dev/ | [Lucide](https://lucide.dev/) | 2026-07-21 | adopted | ISC verified from https://raw.githubusercontent.com/lucide-icons/lucide/main/LICENSE (plus compatible MIT notice for inherited Feather icons); all four npm packages confirmed at 1.25.0; release 2026-07-17 |
| https://headlessui.com/ | [Headless UI](https://headlessui.com/) | 2026-07-21 | adopted | MIT verified from https://raw.githubusercontent.com/tailwindlabs/headlessui/main/LICENSE; both npm packages confirmed; react binding current (2.2.10, 2026-04-07), vue binding lags (2024-09) — noted in entry |
| https://gsap.com/ | [GSAP](https://gsap.com/) | 2026-07-21 | rejected | No LICENSE file in repo (raw LICENSE 404; GitHub API license: null); governing text is the custom, non-OSI "GSAP Standard License" hosted only at https://gsap.com/standard-license. Verifier read it and found free commercial use explicitly granted (restriction limited to Webflow-competing no-code animation builders), but the catalog's bar is a verified in-repo LICENSE file with an SPDX id — default-reject; revisit if GSAP ships an in-repo license |
| https://heroicons.com/ | [Heroicons](https://heroicons.com/) | 2026-07-21 | adopted | MIT verified from https://raw.githubusercontent.com/tailwindlabs/heroicons/master/LICENSE; npm packages confirmed at 2.2.0; quiet since 2024-11 judged deliberate completion of a bounded icon set |
| https://www.awwwards.com/ | [Awwwards](https://www.awwwards.com/) | 2026-07-21 | adopted | Gallery — vocabulary only, never installable. Live fetch showed Site of the Day dated 2026-07-21; free to browse; terms (https://www.awwwards.com/terms/) keep showcased-site IP with creators |
| https://minimal.gallery/ | [Minimal Gallery](https://minimal.gallery/) | 2026-07-21 | adopted | Gallery — vocabulary only, never installable. Live fetch showed entries dated same-day; free to browse; legal page (https://minimal.gallery/legal) permits limited personal use for inspiration |
