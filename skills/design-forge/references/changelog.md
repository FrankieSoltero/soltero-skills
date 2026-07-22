# Catalog Changelog

One digest per sweep, newest first. Each digest states which lanes ran.

## Sweep 2026-07-21 (bootstrap; window 2026-01-21 → 2026-07-21)

Bootstrap sweep populating an empty catalog. Evaluated 14 candidates: **11 adopted**
(component libraries: shadcn/ui, HeroUI, daisyUI, Radix UI Primitives, Headless UI;
animation/effects: Magic UI, Motion; galleries: Awwwards, Minimal Gallery; icons:
Lucide, Heroicons), **3 rejected** by the independent license-verifier with primary
evidence (React Bits — MIT + Commons Clause, not OSI-approved; Aceternity UI — no
LICENSE file for free components and site terms prohibiting reproduction/redistribution;
GSAP — no in-repo LICENSE file, custom non-OSI "GSAP Standard License" only on
gsap.com, default-reject despite an explicit free-commercial-use grant).

Every adopted installable entry carries an SPDX id verified 2026-07-21 from the
project's actual LICENSE file URL; every candidate had a license-verifier independent
of the lane that found it. Over-cap candidates surfaced but not evaluated this sweep
(no source-log rows): Tabler Icons, Radix Colors, Flowbite, and six further galleries
(SiteInspire, One Page Love, Collect UI, Muzli, Craftwork Curated, Land-book).

Process notes: run during the skill's build, before the packaged Workflow was
installable, so `workflows/update.mjs` was emulated faithfully with parallel subagents
(one finder per lane, one independent license-verifier per candidate; identical
prompts, schema fields, and default-reject gate). Lane sessions had WebSearch quota
exhausted and fell back to direct WebFetch of known canonical sites/repos/registries —
all evidence URLs are primary fetches.

Lanes run: libraries=ok, galleries=ok, news=skipped-empty-target-set (bootstrap:
nothing cataloged yet).
