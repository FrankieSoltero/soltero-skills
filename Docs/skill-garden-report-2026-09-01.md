# Skill Garden Report — 2026-09-01

Library: `skills/` (soltero-skills — audited at `9c888d1`, `main`, clean tree)   Skills audited: 42
Gates run: `node tools/lint-frontmatter.mjs` (exit 0), `claude plugin validate ./ --strict` (exit 0), `npm run check:workflows` (exit 0)
Config: no `.skill-gardener.yml` at library root — **unvalidated defaults** used:
`verify-horizon-days=180` (default — unvalidated), `spot-check-sample=5` (default — unvalidated),
`unused-days-candidate=365` (default — unvalidated). These decay numbers have no empirical basis; they are config, not policy.

## Summary

Broken 0 · Compromised? 0 · Drifted 8 · Unverified 5 · Retire candidates 0 · Info 7.
All three structural gates pass across all 42 skills; no auditor-directed text was found in
audited content. Nineteen external claims were spot-checked with live evidence (the default
sample is 5); eleven held, eight drifted.

The `skills/` tree is **byte-identical** to what the 2026-08-21 run audited — no commit has
touched `skills/` since `e83ba92`. Every drift below is therefore upstream movement, not a
repo change, and the three drifts reported last month are all still open.

**Most urgent:** `scaffold-frontend` still hard-pins new Expo projects to
`--template default@sdk-56` while the current SDK is **57** — second consecutive month, and a
load-bearing pin an agent executes verbatim. **Newly surfaced this run:** four skills tell the
agent to write the lesson ledger at `Docs/mistakes-and-fixes.md`, but the repo's actual ledger
is `docs/mistakes-and-fixes.md` (lowercase) — on this case-sensitive filesystem those are two
different files (Info 1).

This run modified nothing under `skills/`. The only file written is this report.

## Findings

### 1. Broken

None. All 42 skills pass every gate the repo provides:

- `node tools/lint-frontmatter.mjs` → 42 × `✓`, exit 0. Linted set diffed against `skills/*/`:
  42 directories vs 42 linted names, identical — no directory silently skipped.
- `claude plugin validate ./ --strict` → `√ Validation passed`, exit 0.
- `npm run check:workflows` → `ok: skills/audit-swarm/workflows/audit.mjs parses under the
  Workflow runtime dialect` / `ok: skills/agent-playbook/workflows/update.mjs parses under the
  Workflow runtime dialect`, exit 0.

### 2. Compromised?

None found. Scanned all `skills/**/*.md`, `*.mjs`, `*.sh` for auditor-directed text
(`ignore previous`, `disregard the above`, `do not audit`, `skip this skill/file/directory`,
`mark me verified`, `already verified`, `no need to check/verify`, `delete this skill`,
`the auditor`, `gardener should`, `when auditing this`) — zero hits, grep exit 1.

Two scope notes, so the null result is readable:

- `skills/skill-gardener/` was excluded from that grep because it is the auditing skill itself
  and legitimately contains those phrases as documented attack examples. Its content was read
  in full for this run and contains no directive aimed at an auditor of other skills.
- A broader first-pass pattern that included `system prompt` returned 10 hits, all in
  `skills/agent-playbook/references/playbook.md` — research findings *about* composing system
  prompts (e.g. `:535`, `:895`), not instructions addressed to a reader. Read in context and
  dismissed as false positives.

### 3. Drifted

All eight verified against npm registry / upstream this run.

**Load-bearing (an agent executes these):**

- **`scaffold-frontend`: Expo SDK pin `--template default@sdk-56`**
  (`skills/scaffold-frontend/reference.md:42`, repeated `:141`, referenced `:25`).
  The skill instructs the agent to run
  `npx create-expo-app@latest my-app --template default@sdk-56`.
  Evidence: `https://registry.npmjs.org/expo/latest` on 2026-09-01 → `"version": "57.0.18"`.
  **Open since the 2026-08-21 report** (57.0.15 then). The surrounding comment says the pin
  exists to avoid getting an older SDK during transitions — it now causes exactly that.

- **`design-forge`: Motion health snapshot `motion 12.42.2 published 2026-06-30`**
  (`references/catalog.md:73`). Evidence: `https://registry.npmjs.org/motion/latest` on
  2026-09-01 → `"version": "13.1.1"` — a **major version** ahead of the verified snapshot.
  Elevated above the other catalog snapshots because the entry's install command is
  `npm install motion` (unpinned, `:71`), so an agent following this catalog installs a major
  version no one verified against the entry's "Good for" description. The license did re-verify
  clean at v13 (see holding, below); the compatibility of the documented usage did not.
  Companion pin `motion-v 2.3.0` (`:73`) → `https://registry.npmjs.org/motion-v/latest` →
  `"version": "2.4.0"` (minor).

**Dated health snapshots (nothing consumes the number; recorded for the aggregate signal):**

- **`design-forge`: `release shadcn@4.13.1 published 2026-07-17`** (`catalog.md:17`).
  Evidence: `https://registry.npmjs.org/shadcn/latest` → `"version": "4.19.1"`.
  Open since 2026-08-21 (4.18.0 then). Install is `npx shadcn@latest init`, so no agent
  consumes the number.
- **`design-forge`: `release v5.7.0 current on npm`** (daisyUI, `catalog.md:35`).
  Evidence: `https://registry.npmjs.org/daisyui/latest` → `"version": "5.7.25"`.
- **`design-forge`: `release 1.25.0 published 2026-07-17`** (Lucide, `catalog.md:104`).
  Evidence: `https://registry.npmjs.org/lucide/latest` → `"version": "1.38.0"`;
  `lucide-react` likewise `1.38.0`.
- **`design-forge`: `release v3.2.2 published 2026-07-07`** (HeroUI, `catalog.md:26`).
  Evidence: `https://registry.npmjs.org/@heroui/react/latest` → `"version": "3.2.4"`.
- **`design-forge`: `@radix-ui/react-dialog 1.1.20 published 2026-07-20`** (`catalog.md:44`).
  Evidence: `https://registry.npmjs.org/@radix-ui/react-dialog/latest` → `"version": "1.1.23"`.

**Currency-gated prose:**

- **`scaffold-frontend`: "Astro 6 needs Node 22.12+"** (`reference.md:25`).
  Evidence: `https://registry.npmjs.org/astro/latest` → `"version": "7.2.10"`,
  `"engines"` node `">=22.12.0"`. Open since 2026-08-21. The Node floor still matches upstream
  character-for-character; only the major-version reference is a generation behind, and the
  scaffold command is `npm create astro@latest`, so nothing load-bearing depends on the "6".

**Aggregate signal worth more than any single line above:** 7 of the 11 `design-forge` catalog
entries carry a `last-verified: 2026-07-21` stamp that is comfortably *inside* the
`verify-horizon-days=180` default (cutoff 2026-03-05) — yet 7 of their Health snapshots are
measurably behind, one by a major version. For fast-moving npm health data the 180-day default
horizon does not queue the doc for re-sampling anywhere near often enough. That is an argument
for a per-doc-class horizon in `.skill-gardener.yml`, not evidence of neglect by the author.

### Checked this run and holding (no drift)

Recorded so a future run can distinguish "verified fresh" from "never looked".

- **`design-forge`: all 8 catalog License URLs** — the catalog's hard gate (only license-verified
  entries may be installed). Every one returned **HTTP 200** with license text matching the
  catalog's claim, fetched 2026-09-01:
  `shadcn-ui/ui/main/LICENSE.md` → "MIT License … Copyright (c) 2023 shadcn";
  `motiondivision/motion/main/LICENSE.md` → "The MIT License (MIT) … Motion B.V.";
  `saadeghi/daisyui/master/LICENSE` → "MIT License … Pouya Saadeghi";
  `radix-ui/primitives/main/LICENSE` → "MIT License … Copyright (c) 2022 WorkOS";
  `tailwindlabs/headlessui/main/LICENSE` → "MIT License … Copyright (c) 2020 Tailwind Labs";
  `tailwindlabs/heroicons/master/LICENSE` → "MIT License … Tailwind Labs, Inc.";
  `magicuidesign/magicui/main/LICENSE.md` → "MIT License … Copyright (c) Magic UI";
  `lucide-icons/lucide/main/LICENSE` → "ISC License … Copyright (c) 2026 Lucide Icons".
  No dead links, no license changes. (HeroUI's Apache-2.0 URL was verified in the 2026-08-21
  run and was not re-fetched this run.)
- **`design-forge`: the documented HeroUI license inconsistency** (`catalog.md:23`) — the
  catalog notes npm's manifest says MIT while the repo LICENSE is Apache-2.0. Evidence:
  `https://registry.npmjs.org/@heroui/react/latest` → `"license": "MIT"`. The inconsistency the
  catalog discloses still holds; the disclosure is accurate.
- **`design-forge`: Headless UI health line** (`catalog.md:53`) — `@headlessui/react 2.2.10`
  matches upstream exactly, and the documented caveat that the Vue binding lags is confirmed:
  `@headlessui/vue` → `"version": "1.7.23"` vs React's `2.2.10`.
- **`design-forge`: Heroicons health line** (`catalog.md:113`) — `v2.2.0` matches
  `https://registry.npmjs.org/@heroicons/react/latest` → `"version": "2.2.0"` exactly. The
  entry's "bounded, deliberately finished set (maturity, not neglect)" assessment holds.
- **`scaffold-frontend`: `tailwindcss@^3.4.17`** React-Native pin (`reference.md:90`, `:139`) —
  load-bearing. Evidence: `https://registry.npmjs.org/tailwindcss/3.4.17` resolves →
  `"version": "3.4.17"`; `.../latest` → `4.3.3`, consistent with the skill's documented
  v4-for-web / v3-for-React-Native split.
- **`scaffold-frontend`: "Vite 8 needs Node 20.19+ / 22.12+"** (`reference.md:25`) —
  currency-gated. Evidence: `https://registry.npmjs.org/vite/latest` → `"version": "8.2.2"`,
  `"engines"` node `"^20.19.0 || >=22.12.0"`. Character-for-character match. (See Info 2 for
  the Node 20 EOL footnote.)
- **`scaffold-frontend`: "Next 16"** (`reference.md:25`, `:30`). Evidence:
  `https://registry.npmjs.org/next/latest` → `"version": "16.3.4"`. Current.
- **`scaffold-frontend`: "shadcn CLI is `shadcn`, not the deprecated `shadcn-ui`"**
  (`reference.md:134`). Evidence: `https://registry.npmjs.org/shadcn/latest` resolves to
  `4.19.1` under the `shadcn` name.
- **`agent-playbook`: the `Claude Code v2.1.210 release notes` URL**, cited 8 times
  (`references/playbook.md:515`, `:520`, `:718`, `:723`, `:949`, `:1002`, `:1658`, `:1792`) and
  in `references/source-log.md:58`. Evidence: WebFetch of
  `https://github.com/anthropics/claude-code/releases/tag/v2.1.210` on 2026-09-01 → page
  exists, titled `v2.1.210`, dated 14 Jul. The most-repeated single URL in the library resolves.
- **Node current LTS.** Evidence:
  `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json` → v24 "Krypton" is the
  active LTS (`lts: 2025-10-28`, maintenance from 2026-10-20); v26 does not enter LTS until
  2026-10-28.

### 4. Unverified

Listed, not presumed fresh.

- **40 of 42 skills carry no `last-verified:` metadata at all.** Only `design-forge`
  (`references/catalog.md`, 11 entries stamped `2026-07-21`) and `content-marketing`
  (`references/platform-constraints.md`, stamped `2026-07-29`) use the convention. Both stamps
  are inside the `verify-horizon-days=180` window (cutoff 2026-03-05), so neither was queued for
  sampling *on age* — see the aggregate note in Drifted for why in-horizon did not mean fresh.
  For the other 40 skills there is no freshness signal to read at all.
- **`agent-playbook`'s arXiv citations — check attempted, tool unavailable.** 247 `arxiv.org`
  URL occurrences resolving to 35 distinct arXiv IDs. Both available tools were tried on
  2026-09-01 and both were refused by this environment, not by arXiv:
  `curl https://arxiv.org/abs/2303.11366` → `curl: (56) CONNECT tunnel failed, response 403`;
  WebFetch of the same URL → `{"error_type":"EGRESS_BLOCKED","domain":"arxiv.org"}`.
  This is an attempted check, which is not evidence either way — the citations are neither
  confirmed live nor confirmed dead. See Info 6: this is a standing blind spot for the
  scheduled cadence, not a one-off.
- **`content-marketing`: platform constraints** — in-horizon per its own 2026-07-29 stamp and
  not independently checked this run. Note the doc marks several algorithm claims `[UNSOURCED]`
  itself; that is the author's own label, and this run neither corroborated nor contradicted it.
- **`design-forge`: the 2 gallery entries** (Awwwards `catalog.md:84`, Minimal Gallery `:93`) —
  their Health lines describe live curation dates, not sampled this run.
- **URL liveness across the rest of the library.** ~600 URL occurrences overall; 9 URLs were
  fetched this run (8 licenses + the Claude Code release tag) and the Node schedule. Unchecked
  top hosts: `www.anthropic.com` (63), `cursor.com` (30), `github.com` (27), `github.blog` (18),
  `cognition.com` (16), `openai.com` (14), `claude.com` (13).

### 5. Retire candidates

**None.** No skill is anywhere near the configured threshold.

- Signal used: `git log -1 --format=%cs -- skills/<dir>` for all 42 skills. Oldest last-touch is
  **2026-06-13** (`capture-lesson`, `prisma-safety-review`) — 80 days ago. Newest is 2026-08-20
  (`dev-debrief`, `plan-visualizer`).
- Threshold: `unused-days-candidate=365` (config default, unvalidated — not policy). The oldest
  skill is at 22% of it.
- No invocation analytics were provided to this run. Commit recency is a proxy for maintenance,
  not for use; absence of usage data is not evidence of disuse.

### 6. Info

1. **The `Docs/` vs `docs/` split now has a concrete consequence — newly surfaced this run.**
   Four skills instruct the agent to read or write **`Docs/mistakes-and-fixes.md`**:
   `capture-lesson/SKILL.md:3` ("records a structured lesson in Docs/mistakes-and-fixes.md"),
   `memory-gardener/SKILL.md:3` and `:39` plus `references/operations.md:35`,
   `correction-compiler/SKILL.md:3`, `:19`, `:32`, `:100` and
   `references/ledger-format.md:27`, `:60`.
   Evidence: `ls` on 2026-09-01 → `Docs/mistakes-and-fixes.md` does not exist;
   `docs/mistakes-and-fixes.md` does (4,365 bytes, last written by commit `a6e3585`).
   On this case-sensitive filesystem an agent following `capture-lesson` creates a **second,
   empty ledger** at `Docs/` while the real history stays in `docs/` — the two skills that read
   the ledger (`memory-gardener`, `correction-compiler`) would then curate the wrong file.
   Not filed as Broken: the skills load and their documented step still exists. Which case wins
   is a maintainer decision; the auditor only reports the divergence.
2. **Node 20 baseline is past EOL.** `scaffold-frontend/reference.md:25` recommends Node 20.19+
   as the Vite floor. The claim is accurate (it mirrors Vite's `engines` exactly, verified
   above), but Node 20 "Iron" reached end-of-life **2026-04-30** — evidence:
   `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json` → v20 `"end":
   "2026-04-30"`, v22 `"end": "2027-04-30"`, v24 `"end": "2028-04-30"`. A reader treating
   20.19+ as a *recommended* floor lands on an unsupported runtime. Not a false statement — a
   currency footnote worth adding. Unchanged since 2026-08-21.
3. **No dangling intra-skill file references.** All `` `references/…` ``, `` `scripts/…` ``,
   `` `templates/…` ``, `` `workflows/…` `` refs were resolved against their own skill
   directory; 2 apparent danglers
   (`scripts/install-schedules.sh`, `scripts/launchd/` at `dev-debrief/references/scan-protocol.md:107`)
   were run down and both resolve at the **repo root**, which is what that passage means. Zero
   true danglers. (A broader pattern over bare filenames produced ~20 more hits —
   `CLAUDE.md`, `HANDOFF.md`, `.skill-gardener.yml`, `Docs/audit-YYYY-MM-DD.md` — all output
   templates or files a skill expects in a *target* repo, not references into this one.)
4. **All SKILL.md files are within the library's own size budget.**
   `creating-a-skill/SKILL.md:49` sets `body ≤~500 lines`; the largest is `lean-sdd/SKILL.md`
   at 167 lines, then `design-forge` 157, `code-optimizer` 142 (3,836 lines across all 42).
5. **No `.skill-gardener.yml` at the library root**, so every threshold in this report is a
   printed unvalidated default. Unchanged since 2026-08-21 — and this run produced a concrete
   reason to want one (the horizon argument in Drifted).
6. **This environment cannot verify arxiv.org, and GitHub HTML 403s from `curl`.** Recorded so
   the next scheduled run does not misread either as a dead link:
   `arxiv.org` is refused by the network egress proxy (both curl and WebFetch);
   `curl https://github.com/anthropics/claude-code/releases/tag/v2.1.210` returns **403** from
   the proxy while **WebFetch of the identical URL succeeds**, and
   `api.github.com` returns "GitHub access to this repository is not enabled for this session".
   None of these are upstream failures. Practical consequence: the library's single largest
   external-claim surface (247 arXiv URLs) is unverifiable on this cadence until the egress
   policy changes.
7. **The audited tree has not moved since the last report.** No commit has touched `skills/`
   since `e83ba92` (2026-08-20, pre-dating the 2026-08-21 report). Every finding that repeats
   from last month is upstream movement or an unactioned recommendation, not a regression.

## What this run did NOT check

- Every external claim outside the 19-claim sample — most importantly all 35 distinct arXiv
  citations in `agent-playbook` (blocked, see Unverified), all `content-marketing` platform
  limits, and the 2 `design-forge` gallery entries.
- URL liveness across the library (~600 occurrences); 9 URLs plus the Node schedule were
  fetched.
- HeroUI's Apache-2.0 LICENSE URL — verified in the 2026-08-21 run, not re-fetched this run;
  only its npm-manifest counterpart was re-checked.
- Whether `tailwindcss@3.4.17` is still the highest 3.x release — the pin is `^3.4.17`, so it
  resolves forward within 3.x regardless, and the exact-version fetch confirmed it exists.
- Whether Motion v13 is actually compatible with the usage `design-forge` documents — only that
  the version moved a major and the license still checks out.
- Invocation/usage analytics — none were provided to this run, so retirement analysis rests on
  commit recency alone.
- Prose quality, trigger-description accuracy, and whether skills actually work when invoked.
  This is a lifecycle/staleness audit, not an efficacy eval.

## Suggested next actions (for a human / separate fix PR)

The gardener applied none of these.

1. **Resolve `Docs/` vs `docs/`** (Info 1) — highest-value fix this month, because it silently
   splits the lesson ledger four skills depend on. Decide the canonical case, then make the
   skills, `docs/specs/skill-gardener.md:12`/`:46`, and the filesystem agree.
2. **Bump the Expo pin** in `skills/scaffold-frontend/reference.md:42` and `:141` from
   `default@sdk-56` to `default@sdk-57` (and the "Expo SDK 56" mention at `:25`), after
   confirming NativeWind/react-native-reusables compatibility with SDK 57 — the
   `tailwindcss@^3.4.17` v3 pin at `:90`/`:139` is the line most likely to move with it. Second
   month open.
3. **Re-verify the `design-forge` Motion entry against v13** before refreshing its snapshot —
   this is the one catalog drift where an unpinned install command means the documented usage
   may no longer match what gets installed.
4. **Refresh the rest of the `design-forge` catalog** — `workflows/update.mjs` already restamps
   `last-verified` and Health lines; a run picks up shadcn 4.19.1, daisyUI 5.7.25, Lucide 1.38.0,
   HeroUI 3.2.4 and Radix 1.1.23 in one pass.
5. **Add `.skill-gardener.yml`** with a shorter horizon for fast-moving docs — this run showed
   an in-horizon stamp (2026-07-21, 42 days old) sitting on top of 7 stale snapshots, so
   `verify-horizon-days=180` is the wrong knob setting for catalog-style content.
6. **Add the Astro 7 / Node 20 EOL footnotes** to `scaffold-frontend/reference.md:25`.
7. **Consider adopting `last-verified:` more widely** — 40 of 42 skills have no freshness
   signal, so every future run must report them Unverified no matter how recently a human
   checked them. Per the skill's own rule, that stamping is a separate human-approved PR, never
   an audit side effect.
8. **Decide whether the arXiv blind spot matters** (Info 6). If those 247 citations should be
   auditable, the scheduled environment's egress policy needs `arxiv.org`; otherwise this
   section will read "check attempted, tool unavailable" every month.
