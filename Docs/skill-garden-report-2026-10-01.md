# Skill Garden Report — 2026-10-01

Library: `skills/` (soltero-skills — audited at `e5fff00`, `main`, clean tree)   Skills audited: 52
Gates run: `node tools/lint-frontmatter.mjs` (exit 0), `claude plugin validate ./ --strict` (exit 0),
`node tools/check-workflow-syntax.mjs skills/*/workflows/*.mjs` (exit 0),
`npm run check:entry-guard` (exit 0), `npm test` (441 pass / 0 fail)
Config: no `.skill-gardener.yml` at library root — **unvalidated defaults** used:
`verify-horizon-days=180` (default — unvalidated), `spot-check-sample=5` (default — unvalidated),
`unused-days-candidate=365` (default — unvalidated). These decay numbers have no empirical basis;
they are config, not policy.

## Summary

Broken 0 · Compromised? 0 · Drifted 9 · Unverified 6 · Retire candidates 0 · Info 9.

All five structural gates pass across all 52 skills (up from 42 last run — 10 new skills, audited
here for the first time). No auditor-directed text was found in audited content. Twenty-three
external claims were spot-checked with live evidence this run (the default sample is 5); fourteen
held, nine drifted.

**Both of last month's headline findings are fixed.** The `Docs/` vs `docs/` ledger split (2026-09-01
Info 1) is resolved — one `Docs/` root, and all four dependent skills now point at
`Docs/mistakes-and-fixes.md`. The two-month-open Expo hard pin is resolved *better than recommended*:
rather than bumping `sdk-56`→`sdk-57`, `scaffold-frontend` now instructs a runtime lookup
(`npm view expo version` → `--template default@sdk-<major>`), which cannot drift again. The Node 20
EOL footnote and the "Astro 6" reference are both gone too.

**Most urgent:** `design-forge`'s catalog has not been touched since its `2026-07-21` stamps, so every
drift reported last month is still open and has widened — most importantly **`motion` 12.42.2 → 13.5.0**,
now a full major ahead of the verified snapshot behind an *unpinned* `npm install motion`. An agent
following that entry installs a major version no one verified against the entry's documented usage.
The catalog's own `workflows/update.mjs` is built to refresh exactly these lines in one pass.

**Methodological note that changes how this report reads:** commit `e5fff00` (2026-09-27, 72 files)
touched every skill's frontmatter, so `git log -1` now reports `2026-09-27` for all 52 skills. Commit
recency — the only usage signal available to this run — is therefore uninformative this month; see
Retire candidates for the pre-sweep figures used instead.

This run modified nothing under `skills/`. The only file written is this report.

## Findings

### 1. Broken

None. All 52 skills pass every gate the repo provides:

- `node tools/lint-frontmatter.mjs` → 52 × `✓`, exit 0. The linted set was diffed against `skills/*/`:
  52 names vs 52 directories, `diff` empty — no directory silently skipped.
- `claude plugin validate ./ --strict` → `√ Validation passed`, exit 0.
- `node tools/check-workflow-syntax.mjs skills/*/workflows/*.mjs` → 7 × `ok: … parses under the
  Workflow runtime dialect` (`agent-playbook`, `agent-swarm`, `audit-swarm`, `design-forge`,
  `plan-review`, `prd-review`, `transcript-reader`), exit 0. Up from 2 workflow scripts last run.
- `npm run check:entry-guard` → `129 files scanned, 0 matches, 1 allowlisted, 0 deferred, 0 open
  markers.` (GP-001 ESM entry-guard sweep), exit 0.
- `npm test` → `# tests 441 / # pass 441 / # fail 0`, including
  `ok 441 - CLI runs when reached through a symlinked path (GP-001)`.

### 2. Compromised?

None found. Scanned all `skills/**/*.{md,mjs,sh,json}` for auditor-directed text (`ignore previous`,
`disregard the above`, `do not audit`, `skip this skill/file/directory`, `mark me verified`,
`already verified`, `no need to check/verify/audit`, `delete this skill`, `the auditor`,
`gardener should`, `when auditing this`, `auditor must`, `do not report`).

One hit outside `skill-gardener` itself, run down and dismissed:

- `skills/transcript-reader/workflows/distill.mjs:278` — `"Do not re-report items already in the
  list; do not report filler."` Read in context (lines 268–288): this is the skill's own prompt
  string to its *completeness-critic subagent* in a transcript-distillation pipeline, addressed to
  that worker about transcript items. Not directed at an auditor. False positive.

Scope note, so the null result is readable: `skills/skill-gardener/` was excluded from the grep
because it is the auditing skill itself and legitimately contains those phrases as documented attack
examples (`SKILL.md:38`, `:42`). It was read in full for this run and contains no directive aimed at
an auditor of other skills.

### 3. Drifted

All nine verified against the npm registry this run (2026-10-01).

**`design-forge` — catalog unchanged since 2026-07-21, so last month's drifts have widened.**
Load-bearing first:

- **`motion` Health snapshot `motion 12.42.2 published 2026-06-30`** (`references/catalog.md:80`).
  Evidence: `https://registry.npmjs.org/motion/latest` → `"version": "13.5.0"`. A **full major**
  ahead of the verified snapshot (13.1.1 last month → 13.5.0 now). Elevated above the other
  snapshots because the entry's install command is **unpinned** — `npm install motion`
  (`catalog.md:78`) — so an agent following this catalog installs v13 against a "Good for"
  description verified at v12. The license re-verified clean at the new major (see *Holding*); the
  compatibility of the documented usage did not.
- **`motion-v 2.3.0 published 2026-06-08`** (`catalog.md:80`). Evidence:
  `https://registry.npmjs.org/motion-v/latest` → `"version": "2.5.1"`. Same unpinned-install
  exposure via `npm install motion-v` (`catalog.md:78`).

Dated health snapshots (nothing consumes the number; recorded for the aggregate signal):

- **`release shadcn@4.13.1 published 2026-07-17`** (`catalog.md:18`). Evidence:
  `https://registry.npmjs.org/shadcn/latest` → `"version": "4.21.1"`. Third consecutive month open
  (4.18.0 → 4.19.1 → 4.21.1). Install is `npx shadcn@latest init`, so no agent consumes the number.
- **`release 1.25.0 published 2026-07-17`** (Lucide, `catalog.md:114`). Evidence:
  `https://registry.npmjs.org/lucide/latest` → `"version": "1.49.0"` (1.38.0 last month — the
  fastest-moving entry in the catalog).
- **`release v5.7.0 current on npm`** (daisyUI, `catalog.md:38`). Evidence:
  `https://registry.npmjs.org/daisyui/latest` → `"version": "5.7.47"` (5.7.25 last month).
- **`release v3.2.2 published 2026-07-07`** (HeroUI, `catalog.md:28`). Evidence:
  `https://registry.npmjs.org/@heroui/react/latest` → `"version": "3.2.6"` (3.2.4 last month).
- **`@radix-ui/react-dialog 1.1.20 published 2026-07-20`** (`catalog.md:48`). Evidence:
  `https://registry.npmjs.org/@radix-ui/react-dialog/latest` → `"version": "1.1.23"` — unchanged
  from last month's reading, i.e. Radix itself has not moved in a month.

**`build-mcp-server` — both dated snapshots are now behind.** Note this skill is unusually
well-defended against its own staleness: Rule 0 (`SKILL.md:42`) makes the agent run
`npm view @modelcontextprotocol/sdk version` and `npm view @modelcontextprotocol/server version
dist-tags` *before writing code*, and each snapshot states its verification date as its shelf life
(`reference.md:6`, `references/sdk-v2.md:7`). Both findings are therefore stale numbers inside a
design that tells the agent not to trust them — reported, but materially lower risk than the
`design-forge` pair above.

- **"the v1 monolith is still published (1.30.0) and still getting fixes"** (`SKILL.md:60`).
  Evidence: `https://registry.npmjs.org/@modelcontextprotocol/sdk` → `dist-tags.latest = "1.31.0"`,
  with `time["1.31.0"] = 2026-09-28T18:59:36Z` — published **three days before this audit**. The
  number is one minor stale; the claim's substance ("still getting fixes") is corroborated, not
  contradicted, by the bump.
- **`references/sdk-v2.md` verified at `@modelcontextprotocol/server@2.0.0`** (`SKILL.md:57`, `:135`;
  `references/sdk-v2.md:3`). Evidence:
  `https://registry.npmjs.org/@modelcontextprotocol/server/latest` → `"version": "2.2.0"`, two
  minors ahead of the type-checked snapshot. The steering claim built on top of it — "v2 is the
  stable line for new servers" — independently **holds** (see *Holding*).

**Aggregate signal, repeated from last month because it is now better evidenced:** the 11
`design-forge` catalog entries carry `last-verified: 2026-07-21` stamps — 72 days old, comfortably
*inside* the `verify-horizon-days=180` default (cutoff 2026-04-04), so nothing queued them for
re-sampling on age — yet 7 of their Health snapshots are measurably behind, one by a major version
and one (Lucide) by 24 minors. For fast-moving npm health data the 180-day default horizon is the
wrong knob setting. That is an argument for a per-doc-class horizon in `.skill-gardener.yml`, not
evidence of neglect by the author.

### Checked this run and holding (no drift)

Recorded so a future run can distinguish "verified fresh" from "never looked".

- **`design-forge`: 4 of the catalog's License URLs** — the catalog's hard gate (`catalog.md:3`:
  only license-verified entries may be installed). All returned **HTTP 200** with license text
  matching the catalog's claim, fetched 2026-10-01:
  `motiondivision/motion/main/LICENSE.md` → "The MIT License (MIT) … Copyright (c) 2024 Motion B.V.";
  `heroui-inc/heroui/v3/LICENSE` → "Apache License Version 2.0" (the entry's documented
  Apache-vs-npm-MIT inconsistency at `catalog.md:25` still holds, and this URL had not been
  re-fetched since the 2026-08-21 run);
  `lucide-icons/lucide/main/LICENSE` → "ISC License … Copyright (c) 2026 Lucide Icons";
  `shadcn-ui/ui/main/LICENSE.md` → "MIT License … Copyright (c) 2023 shadcn".
  Registry `license` fields corroborate every installable entry sampled: MIT for motion, shadcn,
  daisyui, @heroui/react, @radix-ui/react-dialog, @headlessui/react, @heroicons/react; ISC for lucide.
- **`design-forge`: Headless UI health line** (`catalog.md:58`) — `@headlessui/react 2.2.10` matches
  `https://registry.npmjs.org/@headlessui/react/latest` → `"version": "2.2.10"` **exactly**, and the
  documented caveat that the Vue binding lags is confirmed: `@headlessui/vue` → `"version": "1.7.23"`.
- **`design-forge`: Heroicons health line** (`catalog.md:124`) — `v2.2.0` matches
  `https://registry.npmjs.org/@heroicons/react/latest` → `"version": "2.2.0"` exactly. The entry's
  "bounded, deliberately finished set (maturity, not neglect)" assessment holds.
- **`design-forge`: Lucide install paths** (`catalog.md:112`) — all four documented entry points
  resolve: `lucide-react`, `@lucide/vue`, `@lucide/svelte` each → `"version": "1.49.0"`, `lucide` →
  `1.49.0`. The *install instruction* is correct even though the Health number drifted.
- **`scaffold-frontend`: `tailwindcss@^3.4.17`** React-Native pin (`reference.md:103`, `:155`) —
  load-bearing. Evidence: `https://registry.npmjs.org/tailwindcss` → `3.4.17` present; highest 3.x
  is `3.4.19`, so the caret resolves forward inside v3 as intended; `dist-tags` →
  `{"latest":"4.3.3","v3-lts":"3.4.19","next":"4.0.0"}`. Upstream now publishes an explicit
  `v3-lts` tag, which is consistent with the skill's documented v4-for-web / v3-for-React-Native split.
- **`scaffold-frontend`: the Expo SDK lookup** (`reference.md:45`, `:157`) — the skill's example
  comment reads `npm view expo version  # e.g. 57.x -> use sdk-57`. Evidence:
  `https://registry.npmjs.org/expo/latest` → `"version": "57.0.26"`. The instruction matches current
  reality *and* is structurally immune to the next bump, since the agent reads the major at run time.
- **`scaffold-frontend`: "TS/Tailwind/App Router/Turbopack are defaults in v16"** (`reference.md:33`).
  Evidence: `https://registry.npmjs.org/next/latest` → `"version": "16.3.8"` — v16 is still the
  current major.
- **`scaffold-frontend`: "all four routes currently want an even-numbered active LTS (Node 22+)"**
  (`reference.md:26-27`). Evidence:
  `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json` → v22 "Jod"
  `end: 2027-04-30` (supported), v24 "Krypton" is the active LTS (`lts: 2025-10-28`, maintenance
  from 2026-10-20), v26 enters LTS 2026-10-28. A Node 22 floor lands the reader on a supported,
  even-numbered runtime. (Last month's Node 20 EOL footnote no longer applies — see Info 1.)
- **`token-economy`: the context-window table in `scripts/economy-setup.mjs:40-44`** — load-bearing
  (it sizes every budget the installed system enforces). The code returns 200000 for `haiku`,
  1000000 otherwise, with the comment "every current opus / sonnet / fable tier is 1M". Evidence:
  `https://platform.claude.com/docs/en/about-claude/models/overview` fetched 2026-10-01 → Context
  window: Claude Fable 5.1 **1M**, Claude Opus 5.5 **1M**, Claude Sonnet 5.5 **1M**, Claude Haiku 4.5
  **200K**. Matches the code exactly, including the haiku carve-out. (One edge case in Info 7.)
- **`instagram-studio`: the Hyperframes CLI dependency** (`SKILL.md:82`, `:133`, `:137`) — the skill's
  single hard external dependency, with no fallback renderer by design (`SKILL.md:188`). Evidence:
  `https://registry.npmjs.org/hyperframes` → `dist-tags.latest = "0.8.104"`, 458 published versions,
  `time.modified = 2026-10-01T11:09:52Z` — published and actively maintained, modified the morning of
  this audit. `npx hyperframes --version` is therefore a live command.
- **`build-mcp-server`: the v2 docs URL the skill tells the agent to follow**
  (`SKILL.md:49`: `https://ts.sdk.modelcontextprotocol.io/v2/…`). Evidence: WebFetch 2026-10-01 →
  page resolves, titled "MCP TypeScript SDK", stating "This is the documentation for **v2** of the
  SDK, the stable release line implementing the 2026-07-28 spec". This independently confirms the
  skill's load-bearing steering claim that **v2 is the stable line for new servers**, even though the
  snapshot's patch version drifted.
- **`agent-playbook`: the `Claude Code v2.1.210` release-notes URL**, the most-repeated single URL in
  the library (cited 8× in `references/playbook.md` plus `references/source-log.md:58`). Evidence:
  WebFetch of `https://github.com/anthropics/claude-code/releases/tag/v2.1.210` on 2026-10-01 → page
  exists, tag `v2.1.210`, dated 14 Jul, with the changelog intact.
- **Workflow model aliases.** The 7 workflow scripts pass `model: 'sonnet'` (15×), `'opus'` (6×) and
  `'haiku'` (3×) to the `Agent` tool. Evidence from this run's own `Agent` tool schema: `model` is an
  enum of exactly `["sonnet","opus","haiku","fable"]`. All three aliases used are valid; no script
  hard-codes a dated API model ID.
- **No load-bearing dated model IDs anywhere in the library.** The model-name grep
  (`claude-[a-z0-9.-]+|gpt-[…]|gemini-[…]`) returned 50 hits across 17 distinct strings; every one
  was read in context and none instructs an agent to *use* a specific API model: they are
  `token-economy` test fixtures and historical transcript data
  (`scripts/test-fixture.mjs`, `references/findings-2026-09.md:54`), test assertions for *invalid*
  input (`gpt-9`, `gpt-9-turbo` in `agent-swarm` / `dispatch-contract` tests), hook/plugin
  identifiers, and the gardener's own grep-pattern example.

### 4. Unverified

Listed, not presumed fresh.

- **50 of 52 skills carry no `last-verified:` metadata at all.** Only `design-forge`
  (`references/catalog.md`, 11 entries stamped `2026-07-21`) and `content-marketing`
  (`references/platform-constraints.md`, stamped `2026-07-29`) use the convention. Both stamps are
  inside the `verify-horizon-days=180` window (cutoff 2026-04-04), so neither was queued for
  sampling *on age* — see the aggregate note in Drifted for why in-horizon did not mean fresh. For
  the other 50 skills there is no freshness signal to read at all. Unchanged in character since
  2026-09-01, and now spread over 10 more skills.
- **`agent-playbook`'s arXiv citations — check attempted, tool unavailable (third consecutive month).**
  Now **314** `arxiv.org` URL occurrences (up from 247 on 2026-09-01). Both tools were tried again on
  2026-10-01 and both were refused by this environment, not by arXiv:
  `curl https://arxiv.org/abs/2303.11366` → `curl: (56) CONNECT tunnel failed, response 403`;
  WebFetch of the same URL → `{"error_type":"EGRESS_BLOCKED","domain":"arxiv.org"}`. An attempted
  check is not evidence either way — these citations are neither confirmed live nor confirmed dead.
  See Info 8.
- **`content-marketing`: platform constraints** — in-horizon per its own 2026-07-29 stamp (64 days)
  and not independently checked this run. The doc marks several algorithm claims `[UNSOURCED]`
  itself; that is the author's own label, which this run neither corroborated nor contradicted.
- **`instagram-studio`: the Instagram format contract** — `references/formats.md` plus the canvas and
  slide-count claims the skill treats as the platform contract (`SKILL.md:202`: "Carousel is
  1080×1350 and 3–10 slides"). Load-bearing and platform-owned, but sampled out this run; the
  renderer dependency was checked instead.
- **`design-forge`: the 2 gallery entries** (Awwwards `catalog.md:92`, Minimal Gallery `:102`) —
  their Health lines describe live curation dates, not sampled this run. Also not re-fetched: the
  Magic UI and the four remaining License URLs verified in prior runs.
- **URL liveness across the rest of the library.** 630 URL occurrences overall (up from ~600); 8
  URLs were fetched this run (4 licenses, the v2 docs site, the Claude Code release tag, the
  Anthropic models page, the Node schedule) plus 20 registry endpoints. Largest unchecked hosts:
  `arxiv.org` (314, blocked), `www.anthropic.com` (68), `github.com` (33), `cursor.com` (33),
  `claude.com` (20), `github.blog` (18), `cognition.com` (16), `openai.com` (14).

### 5. Retire candidates

**None.** No skill is anywhere near the configured threshold — but read the signal caveat first.

- **The raw signal is degenerate this month.** `git log -1 --format=%cs -- skills/<dir>` returns
  `2026-09-27` for **all 52** skills, because commit `e5fff00` ("skill descriptions fit the listing
  budget…", 72 files changed) touched every skill's frontmatter in one sweep. Three such
  library-wide hygiene sweeps landed in September (`e5fff00`, `c66fb44`, `37bc713`).
- **Pre-sweep figures used instead**, excluding those three commits: oldest last-touch is
  **2026-07-17** (`correction-compiler`, `prisma-safety-review`) — 76 days ago; then `prd-scoping`
  and `prd-user-stories` 2026-07-23, `feedback-synthesis` / `mini-game-craft` / `seo-aeo` 2026-07-29,
  `code-optimizer` 2026-07-30, `code-by-hand` 2026-07-31. Everything else is 2026-09-01 or later.
- Threshold: `unused-days-candidate=365` (config default, unvalidated — not policy). The oldest skill
  is at **21%** of it.
- No invocation analytics were provided to this run. Commit recency is a proxy for maintenance, not
  for use; absence of usage data is not evidence of disuse. With sweeps now resetting it wholesale,
  it is a weak proxy even for maintenance — see Info 2.

### 6. Info

1. **Four findings from the 2026-09-01 report are fixed.** Verified by inspection this run:
   - *Docs/docs split (was Info 1, the recommended #1 action).* `ls` → `docs/` no longer exists; one
     `Docs/` root, with `Docs/mistakes-and-fixes.md` present (28,828 bytes). All ledger references in
     `capture-lesson`, `memory-gardener`, `correction-compiler`, `lesson-recall`, `skill-trigger-repair`,
     `docs-standardizer` and `skill-ab-eval` now read `Docs/mistakes-and-fixes.md`. The 14 remaining
     lowercase `docs/` hits in `skills/` were read in context: all are target-repo examples,
     `docs-standardizer`'s own case-decision table (`reference.md:70-73`), or upstream SDK paths.
   - *Expo hard pin (was Drifted #1, two months open).* `--template default@sdk-56` is gone;
     `reference.md:45` now reads `npm view expo version  # e.g. 57.x -> use sdk-57` and `:157` adds
     "Pin the Expo SDK to the major `npm view expo version` reports — never to a number copied from
     here." This removes the claim class rather than refreshing it.
   - *Node 20 EOL recommendation (was Info 2).* `grep -rInE 'Node ?v?20|node20|20\.19'` over
     `skills/` → **zero hits**. Replaced by the generic "even-numbered active LTS (Node 22+)" with an
     instruction to confirm against the installed major.
   - *"Astro 6" generation reference.* Gone; `reference.md:26` no longer names an Astro major.
2. **Library-wide sweeps have destroyed commit recency as a usage signal** (see Retire candidates).
   If retirement analysis is meant to stay meaningful on this cadence, the gardener needs either
   invocation analytics or a signal that ignores whole-tree hygiene commits. This report computed the
   latter ad hoc; it is not in the skill's documented method.
3. **The `verify-horizon-days=180` default is the wrong knob setting for catalog-style content** —
   now demonstrated two months running: 72-day-old in-horizon stamps sitting on top of 7 drifted
   snapshots, one a major version. Argues for a per-doc-class horizon.
4. **Still no `.skill-gardener.yml` at the library root**, so every threshold in this report is a
   printed unvalidated default. Third consecutive run.
5. **No dangling intra-skill file references.** 15 apparent danglers were produced by a pattern over
   bare `references/…`, `scripts/…`, `templates/…`, `workflows/…` paths; **all 15 were run down and
   resolve**, so the true count is zero. Every one is either a *cross-skill* reference that carries
   its owning skill's path in the source text (`skills/session-miner/references/mining-protocol.md`,
   `skills/correction-compiler/references/ledger-format.md`,
   `skills/lean-sdd/references/implementer-prompt.md`, `agent-playbook/references/playbook.md:1688`,
   `design-forge/references/catalog.md`, `skills/dev-debrief/references/report-format.md`,
   `${CLAUDE_PLUGIN_ROOT}/skills/plan-visualizer/scripts/plan-graph.mjs`), a repo-root path
   (`scripts/install-schedules.sh`, `scripts/launchd` — both confirmed present at the root), a
   template placeholder (`creating-a-skill/templates/spec.md:9`:
   `<scripts/reference files, or "none">`), or an example path inside a JSON sample
   (`skill-ab-eval/references/judging.md:21`: `Docs/evals/transcripts/sonnet-scenario-1-without.md`).
6. **All SKILL.md files are within the library's own budgets.** `creating-a-skill/SKILL.md:83` sets
   `body ≤~500 lines`; the largest is `instagram-studio` at 248 lines, then `lean-sdd` 237,
   `agent-swarm` 177 (5,953 lines across all 52). Frontmatter `description` is capped at 1024 chars by
   `tools/frontmatter.mjs:22`; the longest is `token-economy` at 459, then `agent-playbook` 423 —
   every one roughly half the cap or less, consistent with the 2026-09-27 sweep's stated purpose.
7. **`token-economy`'s context-window default is currency-gated in a way that will outlive its
   comment.** `scripts/economy-setup.mjs:44` returns `1000000` for *any* non-haiku model string, on
   the basis that "every current opus / sonnet / fable tier is 1M" — which this run verified true for
   the current lineup. But the Anthropic models page fetched this run also lists legacy models still
   available (Claude Opus 5, Opus 4.8, Opus 4.7, Opus 4.6, Opus 4.5, Sonnet 5, Sonnet 4.6, Fable 5),
   and the function's fall-through will silently size any of them at 1M. Not filed as Drifted — the
   claim as written is accurate today — but it is a default that mis-sizes rather than fails when the
   lineup shifts.
8. **This environment still cannot verify arxiv.org, and github.com HTML still 403s from `curl`.**
   Recorded for the third month so the next scheduled run does not misread either as a dead link:
   `arxiv.org` is refused by the network egress proxy (both `curl` and WebFetch, verbatim errors in
   Unverified); `curl https://github.com/anthropics/claude-code/releases/tag/v2.1.210` returns
   **403** from the proxy while **WebFetch of the identical URL succeeds**. Neither is an upstream
   failure. Practical consequence: the library's largest single external-claim surface (314 arXiv
   URLs, and growing) is unverifiable on this cadence until the egress policy changes.
   `docs.claude.com` now 302-redirects to `platform.claude.com` — content resolves, noted as a move,
   not a dead link.
9. **The 10 skills audited for the first time this run carry almost no external-claim surface.**
   `defect-class-sweep`, `destructive-op-gate`, `dispatch-contract`, `lesson-recall`, `skill-ab-eval`,
   `skill-trigger-repair`, `agent-swarm`, `docs-standardizer`, `token-economy`, `instagram-studio` —
   a claim sweep over all ten found only example-ledger dates, authoring dates, one `example.com`
   placeholder, one `127.0.0.1`, plus the two load-bearing claims checked above (`token-economy`'s
   context windows, `instagram-studio`'s Hyperframes dependency). They are dependency-free Node plus
   prose, which is why they rot slowly. `instagram-studio`'s Instagram format contract is the one
   real external surface among them, and it is sampled out (Unverified).

## What this run did NOT check

- Every external claim outside the 23-claim sample — most importantly all 314 arXiv citations in
  `agent-playbook` (blocked, see Unverified), all `content-marketing` platform limits,
  `instagram-studio`'s Instagram format contract, and the 2 `design-forge` gallery entries.
- URL liveness across the library (630 occurrences); 8 URLs plus 20 npm registry endpoints were
  fetched.
- The Magic UI, daisyUI, Radix, Headless UI and Heroicons License URLs — verified in prior runs, not
  re-fetched this run; their npm `license` fields were checked instead.
- Whether `motion` v13 or `@modelcontextprotocol/server` 2.2.0 are actually *compatible* with the
  usage those skills document — only that the versions moved and (for motion) that the license still
  checks out.
- Whether the MCP monorepo now carries a `v2.0.0` git tag (`SKILL.md:50` says it did not as of
  2026-09-01). `api.github.com` is not enabled for this session and GitHub HTML 403s from `curl`, so
  the claim was left alone rather than half-checked.
- Invocation/usage analytics — none were provided to this run, so retirement analysis rests on commit
  recency alone, which three September sweeps have made a weak proxy (Info 2).
- Prose quality, trigger-description accuracy, and whether skills actually work when invoked. This is
  a lifecycle/staleness audit, not an efficacy eval — `skill-ab-eval` is the tool for that.

## Suggested next actions (for a human / separate fix PR)

The gardener applied none of these.

1. **Run `design-forge`'s own `workflows/update.mjs`** — highest-value fix this month and a
   one-command job. It restamps `last-verified` and the Health lines, picking up motion 13.5.0,
   motion-v 2.5.1, shadcn 4.21.1, Lucide 1.49.0, daisyUI 5.7.47, HeroUI 3.2.6 and Radix 1.1.23 in one
   pass. Seven of this month's nine drifts close here.
2. **Re-verify the `motion` entry against v13 before accepting the restamp** (and consider pinning the
   install command). This is the one catalog drift where an unpinned `npm install motion` means the
   documented usage may no longer match what an agent actually installs — a major-version gap the
   update script will paper over if nobody reads the v13 migration notes.
3. **Refresh `build-mcp-server`'s two snapshot headers** — `@modelcontextprotocol/sdk` 1.30.0 → 1.31.0
   (`SKILL.md:60`) and the scoped-family snapshot 2.0.0 → 2.2.0 (`SKILL.md:57`, `:135`,
   `references/sdk-v2.md:3`). Low urgency: Rule 0 already forces a live `npm view` before any code is
   written, and the "v2 is the stable line" steer independently verified this run.
4. **Add `.skill-gardener.yml`** with a shorter horizon for fast-moving docs — two consecutive runs
   have now shown in-horizon stamps sitting on stale snapshots, so `verify-horizon-days=180` is
   measurably the wrong setting for catalog-style content. A per-doc-class horizon (e.g. 30 days for
   `design-forge/references/catalog.md`) would have queued every drift above.
5. **Decide what usage signal retirement analysis should use** (Info 2). Commit recency no longer
   survives a library-wide hygiene sweep; either feed the gardener invocation analytics or teach it to
   discount whole-tree commits. Until then the Retire-candidates section is close to vacuous.
6. **Consider adopting `last-verified:` more widely** — 50 of 52 skills have no freshness signal, so
   every future run must report them Unverified no matter how recently a human checked them. Per the
   skill's own rule, that stamping is a separate human-approved PR, never an audit side effect.
7. **Scope-guard `token-economy`'s window default** (Info 7) — fall through to 200K, or key the table
   on known model families, so a legacy 200K model in a transcript is not silently budgeted at 1M.
8. **Decide whether the arXiv blind spot matters** (Info 8). The surface grew from 247 to 314 URLs in
   one month. If those citations should be auditable, the scheduled environment's egress policy needs
   `arxiv.org`; otherwise this section will read "check attempted, tool unavailable" every month.
