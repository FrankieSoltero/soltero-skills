# Skill Garden Report — 2026-11-01

Library: `skills/` (soltero-skills — audited at `ccf3a07`, `main`, clean tree)   Skills audited: 52
Gates run: `node tools/lint-frontmatter.mjs` (exit 0) · `markdownlint-cli2 "skills/**/*.md"` (exit 0) ·
`node tools/check-workflow-syntax.mjs skills/*/workflows/*.mjs` (exit 0) ·
`node skills/defect-class-sweep/scripts/sweep.mjs --rule Docs/defect-classes/esm-entry-guard.rule.json` (exit 0) ·
`node --test tools/*.test.mjs skills/*/scripts/*.test.mjs` (exit 0) ·
`claude plugin validate ./ --strict` (exit 0, 1 directory warning)
Config: no `.skill-gardener.yml` at library root — **unvalidated defaults** used:
`verify-horizon-days=180` (default — unvalidated), `spot-check-sample=5` (default — unvalidated),
`unused-days-candidate=365` (default — unvalidated). These decay numbers have no empirical basis;
they are config, not policy.

## Summary

Broken 0 · Compromised? 0 · Drifted 10 · Unverified 6 · Retire candidates 0 · Info 12.

All six structural gates pass across all 52 skills — the first run where the repo's full
`npm run check` surface was exercised, including 441 unit tests (441 pass, 0 fail) and the
`esm-entry-guard` defect-class sweep. No auditor-directed text was found in audited content.
**Twenty-three external claims were spot-checked with live evidence** (the default sample is 5);
thirteen held, ten drifted.

**Most urgent:** `token-economy`'s `windowForModel()` returns **200,000** for any model string
matching `/haiku/`, but **Claude Haiku 5.5's context window is 1M tokens** (evidence below). The
function is load-bearing — the token audit divides measured context against this number — so on a
Haiku 5.5 session it overstates context pressure by **5×** and will nominate compaction work that
isn't needed. Every other tier in that function (opus / sonnet / fable → 1M) verified correct.

**Two carry-forwards from the 2026-09-01 report are closed**, both by fixing the root cause rather
than the number: the Expo SDK pin now says *look it up, never copy a number from here* (Info 2 —
and upstream has since moved 56 → 58, which is the fix earning its keep), and the `Docs/` vs
`docs/` ledger split is gone (Info 3). The `design-forge` catalog drift is unchanged and widening:
Motion is now **two majors** past its verified snapshot.

**Cadence note:** there is no October report. Reports exist for 2026-08-21, 2026-09-01 and this
one, so this run covers roughly two months of upstream movement, not one (Info 1).

This run modified nothing under `skills/`. The only file written is this report.

## Findings

### 1. Broken

**None.** All 52 skills pass every gate the repo provides:

- `node tools/lint-frontmatter.mjs` → 52 × `✓`, exit 0. Linted count diffed against
  `ls -d skills/*/` → 52 directories vs 52 linted names, identical — no directory silently skipped.
- `markdownlint-cli2 "skills/**/*.md"` → `Linting: 122 files` / `Summary: 0 issues in 0 files`,
  exit 0. (`markdownlint-cli2@0.23.3` was installed with `--no-save` into the ephemeral container
  to run this gate; `node_modules/` is untracked and nothing under `skills/` was touched.)
- `node tools/check-workflow-syntax.mjs skills/*/workflows/*.mjs` → 7 × `ok: … parses under the
  Workflow runtime dialect`, exit 0 (`agent-playbook`, `agent-swarm`, `audit-swarm`, `design-forge`,
  `plan-review`, `prd-review`, `transcript-reader`).
- `node skills/defect-class-sweep/scripts/sweep.mjs --rule Docs/defect-classes/esm-entry-guard.rule.json --root .`
  → `129 files scanned, 0 matches, 1 allowlisted, 0 deferred, 0 open markers`, exit 0.
- `node --test tools/*.test.mjs skills/*/scripts/*.test.mjs` → `# tests 441 / # pass 441 /
  # fail 0 / # skipped 0`, exit 0.
- `claude plugin validate ./ --strict` → `√ Validation passed`, exit 0 (one non-blocking directory
  warning, see Info 6).

### 2. Compromised?

**None found.** Scanned all `skills/**/*.md`, `*.mjs`, `*.sh` for auditor-directed text
(`ignore previous`, `disregard the above`, `do not audit`, `skip this skill/file/directory`,
`mark me verified`, `already verified`, `no need to check/verify`, `delete this skill`,
`the auditor`, `gardener should`, `when auditing this`) — **zero hits outside
`skills/skill-gardener/` itself, grep exit 1.**

Scope note, so the null result is readable: `skills/skill-gardener/` was excluded from that grep
because it is the auditing skill and legitimately contains those phrases as documented attack
examples. Its `SKILL.md` and both `references/` files were read in full for this run and contain
no directive aimed at an auditor of other skills.

### 3. Drifted

All ten verified against the npm registry or official docs **this run (2026-11-01)**.

**Load-bearing — an agent or script consumes the number:**

1. **`token-economy`: `windowForModel()` returns 200,000 for every `/haiku/` model**
   (`skills/token-economy/scripts/economy-setup.mjs:40-45`). The code reads
   `if (/haiku/.test(m)) return 200000;` under the comment
   `// every current opus / sonnet / fable tier is 1M`.
   Evidence: WebFetch of `https://platform.claude.com/en/docs/about-claude/models/overview` on
   2026-11-01 → the Context window row reads **1M tokens** for all four current models, Claude
   Haiku 5.5 included (`claude-haiku-5-5`). Haiku 4.5 — which the unit test pins
   (`economy-setup.test.mjs:19` asserts `windowForModel("claude-haiku-4-5") === 200000`) — is
   listed under *Legacy models*, and 200K is correct **for that model only**. The regex has no
   generation guard, so `claude-haiku-5-5` takes the legacy branch.
   Consequence: the audit's context-pressure arithmetic is 5× pessimistic on a current Haiku
   session. The other three tiers in the same function verified correct — Fable 5.1, Opus 5.5 and
   Sonnet 5.5 are all 1M on the same page.
   *(The test passing is not evidence the function is right: it asserts the legacy case only.)*

2. **`design-forge`: Motion health snapshot `motion 12.42.2 published 2026-06-30`**
   (`references/catalog.md:80`). Evidence: `https://registry.npmjs.org/motion/latest` → `"version":
   "14.9.0"` — **two major versions** past the verified snapshot (it was one major ahead at the
   2026-09-01 run, at 13.1.1). Companion pin `motion-v 2.3.0` (same line) →
   `https://registry.npmjs.org/motion-v/latest` → `"version": "2.10.0"`.
   Elevated above the other catalog snapshots for the same reason as last month: the entry's
   install command is `npm install motion`, **unpinned** (`catalog.md:78`), so an agent following
   this catalog installs a version two majors beyond anything the entry's "Good for" text was
   verified against. The license re-verified clean (see *holding*); the compatibility of the
   documented usage did not.

3. **`design-forge`: the HeroUI license caveat is now false upstream.**
   `catalog.md:23` discloses: "note the npm manifest of @heroui/react says \"MIT\", an upstream
   inconsistency between two permissive licenses".
   Evidence: `https://registry.npmjs.org/@heroui%2freact/latest` on 2026-11-01 → `"license":
   "Apache-2.0"`, and `https://raw.githubusercontent.com/heroui-inc/heroui/v3/LICENSE` → HTTP 200,
   `Apache License / Version 2.0, January 2004`. **Both sources now agree on Apache-2.0**; the
   inconsistency the catalog warns about has been resolved by upstream.
   Filed as Drifted rather than Info because this catalog's License line is a **hard gate** ("Only
   entries in this catalog may be installed", `catalog.md:3`), so a stale caveat on a license line
   is exactly the field that must not be wrong. The drift is benign in direction — the entry's
   primary claim (Apache-2.0) is now corroborated twice over — but the disclosure is no longer true.

**Dated verification snapshots (nothing installs the number; the skill tells the agent to re-verify):**

4. **`build-mcp-server`: the scoped v2 family snapshot, verified at `2.0.0` on 2026-09-01**
   (`SKILL.md:57`, `references/sdk-v2.md:3-4`, and the install block at `sdk-v2.md:363-364`).
   Evidence, all 2026-11-01: `@modelcontextprotocol/server/latest` → **`2.4.0`**;
   `@modelcontextprotocol/node/latest` → **`2.1.2`**; `@modelcontextprotocol/express/latest` →
   **`2.0.2`**. The snapshot's structural claim **holds**: all three are still on the v2 line, so
   "v2 is the stable line for new servers" (`SKILL.md:58`) is unchanged — only the patch/minor
   numbers moved. Risk is mitigated by the skill's own design: Rule 0 orders the agent to verify
   the SDK before building, and the flow's install command is `npm i @modelcontextprotocol/server
   zod` — **unpinned** — so nothing installs `2.0.0` by following the skill.

5. **`build-mcp-server`: "the v1 monolith is still published (1.30.0) and still getting fixes"**
   (`SKILL.md:59`). Evidence: `https://registry.npmjs.org/@modelcontextprotocol%2fsdk/latest` →
   `"version": "1.32.2"`. The **claim** ("still published, still getting fixes") is confirmed — and
   two further minors are themselves the evidence for it; only the parenthetical number is stale.
   The separate monolith snapshot `@modelcontextprotocol/sdk@1.29.0`, verified 2026-06-14
   (`SKILL.md:61`, `reference.md:10`), is correspondingly 3 minors behind.

**`design-forge` catalog health snapshots (recorded for the aggregate signal, see below):**

6. **`shadcn@4.13.1 published 2026-07-17`** (`catalog.md:18`) → `registry.npmjs.org/shadcn/latest`
   = **`4.23.0`**. Install is `npx shadcn@latest init`, so no agent consumes the number.
7. **daisyUI `release v5.7.0 current on npm`** (`catalog.md:38`) →
   `registry.npmjs.org/daisyui/latest` = **`5.7.50`**.
8. **Lucide `release 1.25.0 published 2026-07-17`** (`catalog.md:114`) →
   `registry.npmjs.org/lucide/latest` = **`1.66.0`**; `lucide-react` likewise **`1.66.0`**.
9. **HeroUI `release v3.2.2 published 2026-07-07`** (`catalog.md:28`) →
   `registry.npmjs.org/@heroui%2freact/latest` = **`3.2.7`**.
10. **`@radix-ui/react-dialog 1.1.20 published 2026-07-20`** (`catalog.md:48`) →
    `registry.npmjs.org/@radix-ui%2freact-dialog/latest` = **`1.3.1`**.

**Aggregate signal, stronger than any single line above — second month running.** All 11
`design-forge` catalog entries still carry `last-verified: 2026-07-21`, which is comfortably
*inside* the `verify-horizon-days=180` default (cutoff 2026-05-05), yet **7 of their Health
snapshots are measurably behind and one is two majors behind.** The stamp is now 103 days old and
has never been queued for re-sampling on age. For fast-moving npm health data the 180-day default
does not fire anywhere near often enough — an argument for a per-doc-class horizon in
`.skill-gardener.yml`, not evidence of neglect by the author.

### Checked this run and holding (no drift)

Recorded so a future run can distinguish "verified fresh" from "never looked".

- **`design-forge`: all 9 catalog License URLs — the catalog's hard gate.** Every one returned
  **HTTP 200** with license text matching the catalog's claim, fetched 2026-11-01:
  `heroui-inc/heroui/v3/LICENSE` → "Apache License / Version 2.0";
  `shadcn-ui/ui/main/LICENSE.md` → "MIT License … Copyright (c) 2023 shadcn";
  `motiondivision/motion/main/LICENSE.md` → "The MIT License (MIT) … Motion B.V.";
  `saadeghi/daisyui/master/LICENSE` → "MIT License … Pouya Saadeghi";
  `radix-ui/primitives/main/LICENSE` → "MIT License … Copyright (c) 2022 WorkOS";
  `tailwindlabs/headlessui/main/LICENSE` → "MIT License … Copyright (c) 2020 Tailwind Labs";
  `tailwindlabs/heroicons/master/LICENSE` → "MIT License … Tailwind Labs, Inc.";
  `magicuidesign/magicui/main/LICENSE.md` → "MIT License … Copyright (c) Magic UI";
  `lucide-icons/lucide/main/LICENSE` → "ISC License … Copyright (c) 2026 Lucide Icons".
  No dead links, no license changes. This is the full installable set — unlike the 2026-09-01 run,
  HeroUI's repo LICENSE was re-fetched this time, so the gate is 9/9 rather than 8/9.
- **`build-mcp-server`: `@modelcontextprotocol/server@2.0.0` declares `zod ^4.2.0` as a
  *dependency*, not a peer** (`references/sdk-v2.md:53`). Evidence:
  `https://registry.npmjs.org/@modelcontextprotocol%2fserver/2.0.0` → `dependencies:
  {"zod":"^4.2.0","@modelcontextprotocol/core":"2.0.0"}`, `peerDependencies: undefined`.
  **Character-for-character match, including the dependency-vs-peer distinction the doc makes a
  point of.** (Current `zod/latest` is `4.6.7`, which satisfies `^4.2.0`.)
- **`design-forge`: Headless UI health line** (`catalog.md:58`) — `@headlessui/react 2.2.10`
  matches `registry.npmjs.org/@headlessui%2freact/latest` → `"version": "2.2.10"` **exactly**, and
  the documented caveat that the Vue binding lags is confirmed: `@headlessui/vue` → `"version":
  "1.7.23"`. Unchanged since 2026-09-01.
- **`design-forge`: Heroicons health line** (`catalog.md:124`) — `v2.2.0` matches
  `registry.npmjs.org/@heroicons%2freact/latest` → `"version": "2.2.0"` **exactly**. The entry's
  "bounded, deliberately finished set (maturity, not neglect)" assessment holds.
- **`instagram-studio`: the `hyperframes` renderer exists and is reachable.** The skill is wholly
  gated on an external CLI it tells the agent to run (`npx hyperframes --version`, `SKILL.md:82`;
  `npx hyperframes check`, `:137`; `npx hyperframes snapshot`, `:207`). Evidence:
  `https://registry.npmjs.org/hyperframes/latest` → `"version": "0.8.226"`, `"license":
  "Apache-2.0"`. The package resolves. (See Info 7 for the `hyperframes-cli` naming nit.)
- **`agent-playbook`: the `Claude Code v2.1.210 release notes` URL**, the most-repeated single URL
  in the library (cited 9 times across `references/playbook.md` and `references/source-log.md`).
  Evidence: WebFetch on 2026-11-01 → page exists, heading `v2.1.210`, commit `b7784f2`, "released
  this 14 Jul". Still live. (`curl` of the identical URL returns 403 from this container's proxy —
  see Info 11.)
- **Model tier aliases `opus` / `sonnet` / `haiku` / `fable`** — the dispatch vocabulary that
  `agent-swarm` (`SKILL.md:136-138`), `dispatch-contract` (`:86-88`), `code-optimizer` (`:46-47`)
  and `docs-standardizer` (`:164`) all pin as a standard, and that 7 workflow scripts pass as
  `model:`. Evidence from this run's own harness: the `Agent` tool's `model` parameter enumerates
  exactly `sonnet, opus, haiku, fable`. All four names are still accepted values; no tier in the
  library's table has been renamed or dropped. `fable` — the newest of the four, and the one
  `code-optimizer` assigns to orchestration — is present.
- **Current Claude model lineup.** Evidence: the Models overview page above lists Claude Fable 5.1,
  Opus 5.5, Sonnet 5.5 and Haiku 5.5 as current (API IDs `claude-fable-5-1`, `claude-opus-5-5`,
  `claude-sonnet-5-5`, `claude-haiku-5-5`), all 1M context / 128K max output, knowledge cutoff
  Jun 2026. No **dated** model ID appears anywhere in `skills/` as something an agent is told to
  use, so there is no retired-model-ID exposure in the library. (`claude-opus-4-7`,
  `claude-haiku-4-5` and `claude-opus-5` appear only in `token-economy`'s test fixtures and in its
  dated `references/findings-2026-09.md` — historical observations of the user's own usage, not
  instructions.)
- **Node release schedule.** Evidence:
  `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json` on 2026-11-01 → **v26
  "Lithium" entered LTS 2026-10-28** (`end: 2029-04-30`) and is now the active LTS; v24 "Krypton"
  entered maintenance 2026-10-20; v22 "Jod" is in maintenance to 2027-04-30; v20 "Iron" ended
  2026-04-30. The LTS line has turned over **since the last report**, which predicted this date.
- **`scaffold-frontend`: framework Node floors.** Evidence (all `engines.node` from
  `registry.npmjs.org/<pkg>/latest`, 2026-11-01): `next` **16.4.3** → `">=20.9.0"`; `vite`
  **8.3.5** → `"^20.19.0 || >=22.12.0"`; `astro` **7.4.4** → `">=22.23.4"`; `expo` **58.0.22** →
  `"^22.13.0 || ^24.3.0 || ^26.0.0 || >=27.0.0"`; `tailwindcss` **4.3.3** → no `engines` field.
  The file's claim that all four routes "currently want an even-numbered active LTS (Node 22+)"
  (`reference.md:26-28`) is **defensible as a floor** — Node 22+ satisfies all four — and the
  passage hedges itself ("the majors move faster than this file… confirm against the installed
  major's release notes"). See Info 5 for where it overstates, and Unverified 6 for the one
  sub-claim that engines data cannot settle.
- **`scaffold-frontend`: the Expo pin is no longer a number.** Evidence: `grep` for `sdk-5[0-9]`
  across the skill returns only `reference.md:45` (`npm view expo version  # e.g. 57.x -> use
  sdk-57`, an illustrative comment) and `:157` ("never to a number copied from here").
  `SKILL.md:78` instructs the lookup. The two-month-old drift is structurally closed — see Info 2.

### 4. Unverified

Listed, not presumed fresh.

1. **50 of 52 skills carry no `last-verified:` metadata at all.** Only `design-forge`
   (`references/catalog.md`, 11 entries stamped `2026-07-21`) and `content-marketing`
   (`references/platform-constraints.md`, stamped `2026-07-29`) use the convention. Both stamps are
   inside the `verify-horizon-days=180` window (cutoff 2026-05-05), so neither was queued for
   sampling *on age* — see the aggregate note in Drifted for why in-horizon did not mean fresh. For
   the other 50 skills there is no freshness signal to read at all. Ratio unchanged from last month
   in substance (40/42 → 50/52); all 10 skills added since then also ship without the field.
2. **`agent-playbook`'s arXiv citations — check attempted, tool unavailable. Third consecutive
   month.** The library's single largest external-claim surface: ~250 `arxiv.org` URL occurrences
   resolving to ~35 distinct arXiv IDs. Evidence of the attempt, 2026-11-01:
   `curl -s -o /dev/null -w '%{http_code}' https://arxiv.org/abs/2606.26300` → **`000`** (connection
   never established; the proxy refuses the tunnel). This is an attempted check, which is **not
   evidence either way** — the citations are neither confirmed live nor confirmed dead. See Info 11.
3. **`content-marketing`: platform constraints** — in-horizon per its own 2026-07-29 stamp and not
   independently checked this run. The doc marks several algorithm claims `[UNSOURCED]` itself;
   that is the author's own label, and this run neither corroborated nor contradicted it.
4. **`design-forge`: the 2 gallery entries and the Magic UI health line** (Awwwards
   `catalog.md:92`, Minimal Gallery `:102`, Magic UI `:70` — "last commit 2026-07-21, GPG-verified,
   PR #991"). Their Health lines describe live curation/commit state, not sampled this run. Their
   License URLs *were* fetched (both resolve, above); only the freshness lines are unsampled.
5. **URL liveness across the rest of the library.** ~600 URL occurrences overall; **11 URLs were
   fetched this run** (9 catalog licenses + the Claude Code release tag + the Models overview page),
   plus the Node schedule and 21 npm registry endpoints. Unchecked top hosts by occurrence:
   `arxiv.org` (~250, blocked), `www.anthropic.com` (~63), `cursor.com` (~30), `github.com` (~27),
   `github.blog` (~18), `openai.com` (~14), `claude.com` (~13), `developers.googleblog.com` (8),
   `sourcegraph.com` (7), `warp.dev` (6).
6. **`scaffold-frontend`: "Astro additionally rejects odd Node versions outright"**
   (`reference.md:27-28`). Astro's published `engines.node` is `">=22.23.4"`, which does **not**
   encode an odd-major rejection — by semver that range admits 23 and 25. The claim may well be
   true as a *runtime* check Astro performs rather than an `engines` constraint, but the registry
   metadata this run fetched can neither confirm nor refute it, and no Astro release note was
   fetched. Reported unverified rather than drifted: absence from `engines` is not evidence of
   absence from the tool.

### 5. Retire candidates

**None.** No skill is anywhere near the configured threshold — **but the signal this verdict rests
on has been degraded, and that matters more than the verdict.**

- Signal used: `git log -1 --format=%cs -- skills/<dir>` for all 52 skills. The distribution is
  **48 skills at 2026-09-27 and 4 at 2026-10-17** (`creating-a-skill`, `lean-plans`, `lean-sdd`,
  `plan-review`). Nothing older than 35 days.
- **Caveat the number hides:** that uniform 2026-09-27 date is not 48 skills being maintained — it
  is one tree-wide commit, `e5fff00` ("skill descriptions fit the listing budget, tests for 7
  untested scripts (+9 bugs fixed), one Docs/ root", 72 files). A bulk commit resets last-touched
  for everything it brushes, so after `e5fff00` **`git log` can no longer distinguish an actively
  maintained skill from a dormant one.** Commit recency was already only a proxy for maintenance,
  not for use; for this library it is now close to uninformative, and will stay that way until the
  dates spread out again.
- Threshold: `unused-days-candidate=365` (config default, unvalidated — **not policy**). The oldest
  last-touch is at 10% of it.
- **No invocation analytics were provided to this run.** Absence of usage data is not evidence of
  disuse. With commit recency flattened as above, this run has **no usable disuse signal at all** —
  the "none" verdict should be read as "nothing to go on", not as "all 52 skills are in use".

### 6. Info

1. **The monthly cadence skipped October.** Evidence: `ls Docs/skill-garden-report-*.md` →
   `2026-08-21`, `2026-09-01`, and this one. No report for October exists, so this run measures
   ~61 days of upstream drift against snapshots last compared on 2026-09-01. Worth knowing when
   reading the Drifted section: the deltas are two months wide, not one. Whether the October firing
   failed or the schedule was paused is not something this run can determine from the repo.
2. **Carry-forward CLOSED — the Expo SDK pin, fixed at the root.** The 2026-09-01 report's "most
   urgent" item (`--template default@sdk-56` hard-pinned while upstream was 57, open two months)
   is resolved, and resolved the right way: `SKILL.md:78` now reads "**Pin the Expo SDK, but look
   it up first:** `npm view expo version` gives the current major", and `reference.md:157` adds
   "never to a number copied from here." The only remaining numeral is an illustrative `# e.g. 57.x
   -> use sdk-57` comment at `:45`. **Upstream has since moved to 58.0.22** — i.e. a literal pin
   would have drifted again within the same two months, so the structural fix has already earned
   its keep once.
3. **Carry-forward CLOSED — the `Docs/` vs `docs/` ledger split.** The 2026-09-01 report's Info 1
   (four skills writing `Docs/mistakes-and-fixes.md` while the real ledger lived at
   `docs/mistakes-and-fixes.md`, two distinct files on a case-sensitive filesystem) is gone.
   Evidence: `ls -d docs` → `No such file or directory`; `ls Docs/mistakes-and-fixes.md` → exists.
   Fixed by `37bc713` ("repo hygiene — Docs/ case split") and `e5fff00` ("one Docs/ root").
4. **The active Node LTS line turned over since the last report.** v26 "Lithium" entered LTS
   2026-10-28 (4 days ago); v24 went to maintenance 2026-10-20. Nothing in `skills/` names a
   specific LTS codename or major as "the current LTS", so this breaks no claim — recorded because
   last month's report flagged the date as pending, and because any skill that later hard-codes an
   LTS major now has a moving target with two even majors in support.
5. **`scaffold-frontend`'s "Node 22+" floor is conservative, not minimal — and the file says so.**
   Two of the four routes accept less: `next` → `>=20.9.0`, `vite` → `^20.19.0 || >=22.12.0`. Only
   `expo` (`^22.13.0 || …`) and `astro` (`>=22.23.4`) actually require 22+. So "all four routes
   currently want … Node 22+" overstates the requirement for Next and Vite while being safe advice
   for picking one version across all four. Not filed as Drifted: the sentence is guidance for
   choosing a CI pin, it is explicitly hedged two lines later, and Node 20 is past EOL (2026-04-30)
   so recommending 22+ is correct even where 20 is permitted. A precision nit, not a false claim.
   *(Last month's "Node 20 baseline is past EOL" Info is obsolete — the specific 20.19+ / Astro 6
   version prose it flagged no longer appears in the file.)*
6. **`claude plugin validate --strict` emits one directory warning: no plugin icon.** Verbatim:
   `.claude-plugin/plugin.json icon: No icon (ICON_MISSING). No icon found in the plugin.` The
   validator's fix note adds that the listing icon is read **only once**, "the first time the plugin
   is saved or submitted in the developer portal" — so this is cheap to fix now and not fixable
   later. It does not affect the result (`√ Validation passed`) and blocks nothing locally.
7. **`instagram-studio` names the renderer two ways; one of the two does not exist on npm.** Every
   command in the skill invokes `npx hyperframes …`, which resolves (`0.8.226`, above). But
   `SKILL.md:171` refers to the tool in prose as `` `hyperframes-cli` `` — and
   `https://registry.npmjs.org/hyperframes-cli` returns **HTTP 404**. Nothing installs that name,
   so no run breaks; it is a naming inconsistency that could send a reader looking for the wrong
   package. Lowest-severity finding in this report.
8. **No true dangling intra-skill file references.** All `` `references/…` ``, `` `scripts/…` ``,
   `` `templates/…` ``, `` `workflows/…` `` refs were resolved against their own skill directory.
   Three apparent danglers were run down and **all three resolve in context**:
   `dev-debrief/references/scan-protocol.md` → `scripts/install-schedules.sh` resolves at the
   **repo root** (`scripts/install-schedules.sh`, 2918 bytes, executable), which is what the passage
   means; `dispatch-contract/SKILL.md:31` → `scripts/task-brief` is lean-sdd's
   (`skills/lean-sdd/scripts/task-brief` exists), named in a sentence whose subject is lean-sdd;
   `lesson-recall/references/handoff.md:24` → "the format **its** `references/ledger-format.md`
   fixes" points at correction-compiler's copy (`skills/correction-compiler/references/ledger-format.md`
   exists), the antecedent being correction-compiler. Zero true danglers.
9. **All 52 `SKILL.md` files are within the library's own budgets.** Size: `creating-a-skill`
   sets `body ≤~500 lines`; the largest is `instagram-studio` at **248** lines, then `lean-sdd` 237,
   `agent-swarm` 177, `docs-standardizer` 170, `dispatch-contract` 168 — 5,981 lines across all 52.
   Description: `creating-a-skill/SKILL.md:87` sets `≤1024 chars`; the longest is `token-economy`
   at **459**, then `agent-playbook` 423, `destructive-op-gate` 412, `instagram-studio` 410. Both
   budgets have comfortable headroom. (`e5fff00` tightened descriptions to the listing budget; this
   confirms that held.)
10. **Still no `.skill-gardener.yml` at the library root**, so every threshold in this report is a
    printed unvalidated default. Unchanged across all three runs — and this run reproduces the
    concrete reason to want one: an in-horizon stamp (2026-07-21, 103 days old) sitting on top of
    seven stale snapshots, one of them two majors out.
11. **This container's egress blind spots, recorded so the next run does not misread them as dead
    links.** All three are environment refusals, **not** upstream failures:
    `arxiv.org` — `curl` returns status `000`, no tunnel established (third month);
    `github.com` HTML — `curl` of the v2.1.210 release tag returns **403 from the proxy** while
    **WebFetch of the identical URL succeeds**, so GitHub HTML is reachable, just not via curl;
    `registry.npmjs.org` and `raw.githubusercontent.com` — both fully reachable by curl this run
    (21 registry endpoints + 9 raw license files, all 200), which is what made this run's evidence
    base possible. **Practical rule for the cadence: use the registry and `raw.` for version and
    license facts, WebFetch for HTML pages, and expect arXiv to stay unverifiable** until the
    egress policy changes.
12. **The 10 skills added since the last report carry almost no external-claim surface.** First-time
    audited this run: `agent-swarm`, `defect-class-sweep`, `destructive-op-gate`,
    `dispatch-contract`, `docs-standardizer`, `instagram-studio`, `lesson-recall`, `skill-ab-eval`,
    `skill-trigger-repair`, `token-economy`. A URL sweep across all ten found **one** external URL
    among them (`https://example.com/x.md`, a placeholder in `docs-standardizer`). Their external
    claims are instead about Claude Code internals — model tiers, tool names, context windows —
    which is why both of this run's newly-surfaced load-bearing checks (the `haiku` window in
    Drifted 1, the `hyperframes` package in *holding*) came from this cohort rather than from a
    link check. A library that depends on harness facts rather than web pages needs a different
    kind of freshness check than URL liveness.

## What this run did NOT check

- Every external claim outside the 23-claim sample — most importantly all ~35 distinct arXiv
  citations in `agent-playbook` (blocked, see Unverified 2), all `content-marketing` platform
  limits, and the `design-forge` gallery/Magic UI freshness lines.
- URL liveness across the library (~600 occurrences); 11 URLs plus the Node schedule and 21 npm
  registry endpoints were fetched.
- Whether Motion v14 is actually compatible with the usage `design-forge` documents — only that
  the version moved two majors and the license still checks out.
- Whether `@modelcontextprotocol/server@2.4.0` changed any API the `sdk-v2.md` snapshot documents
  (the `registerTool`/`registerResource` signatures, the HTTP transport class, `LATEST_PROTOCOL_VERSION
  = '2025-11-25'`). Only the version numbers and the `zod` dependency shape were checked; no code
  was installed or type-checked against v2.4.0. The skill's Rule 0 tells the agent to do exactly
  this verification at build time, which is the mitigation.
- Whether Astro rejects odd-numbered Node majors at runtime (Unverified 6).
- `markdownlint` over the repo's full glob — this run scoped it to `skills/**/*.md` (122 files),
  the audited tree. `Docs/`, `README.md` and the rest of the repo were not linted.
- `npm run test:mcp` and `npm run typecheck` — the MCP server build and its TypeScript surface are
  outside the audited skill tree, and both require `npm ci` of the full dependency tree.
- Invocation/usage analytics — none were provided, so retirement analysis rests on commit recency
  alone, which `e5fff00` has flattened (see Retire candidates).
- Prose quality, trigger-description accuracy, and whether skills actually work when invoked. This
  is a lifecycle/staleness audit, not an efficacy eval — `skill-ab-eval` is the tool for that.

## Suggested next actions (for a human / separate fix PR)

The gardener applied none of these.

1. **Fix `windowForModel()` for the current Haiku generation** (Drifted 1) — the only load-bearing
   wrong number this run found. `skills/token-economy/scripts/economy-setup.mjs:43` needs a
   generation guard so `claude-haiku-5-5` gets 1M while `claude-haiku-4-5` keeps 200K, and the
   test at `economy-setup.test.mjs:19` needs a sibling case pinning the 5.5 behaviour — the current
   test passes precisely because it only covers the legacy model.
2. **Re-verify the `design-forge` Motion entry against v14 before refreshing its snapshot**
   (Drifted 2) — the one catalog drift where an unpinned `npm install motion` means the documented
   usage may no longer match what an agent gets, now two majors out.
3. **Drop the HeroUI npm-license caveat** (Drifted 3) — npm and the repo LICENSE both say
   Apache-2.0 now, so the disclosure is stale on a hard-gate line.
4. **Refresh the rest of the `design-forge` catalog** (Drifted 6–10) — `workflows/update.mjs`
   already restamps `last-verified` and the Health lines; one run picks up shadcn 4.23.0, daisyUI
   5.7.50, Lucide 1.66.0, HeroUI 3.2.7 and Radix 1.3.1 together.
5. **Add `.skill-gardener.yml` with a short horizon for catalog-class docs** (Info 10, Drifted
   aggregate) — two runs have now shown `verify-horizon-days=180` failing to queue a 100-day-old
   stamp sitting on seven stale snapshots. A per-doc-class horizon (e.g. 30 days for
   `design-forge/references/catalog.md`) is the knob that would have caught items 6–10 a month ago.
6. **Refresh `build-mcp-server`'s two snapshot dates** (Drifted 4–5) — low urgency, since both
   install commands are unpinned and Rule 0 orders a live check, but the "(1.30.0)" parenthetical
   and the `2.0.0` snapshot headers are now stale enough to misread as current.
7. **Investigate the missing October run** (Info 1) — if the schedule is meant to be monthly, one of
   three firings has not produced a report, and this run had to cover the gap.
8. **Decide whether the arXiv blind spot matters** (Unverified 2, Info 11). If ~250 citations should
   be auditable, this environment's egress policy needs `arxiv.org`; otherwise that section will
   read "check attempted, tool unavailable" every month in perpetuity. Worth an explicit decision
   rather than a third repetition.
9. **Add a plugin icon** (Info 6) — cheap now, and the validator says the listing icon is read only
   on first submission.
10. **Consider adopting `last-verified:` more widely** (Unverified 1) — 50 of 52 skills have no
    freshness signal, so every future run must report them Unverified no matter how recently a human
    checked them. Per this skill's own rule, that stamping is a separate human-approved PR, never an
    audit side effect.
11. **Tidy the `hyperframes-cli` prose reference** (Info 7) — one word; the package name that
    exists is `hyperframes`.
12. **Note for whoever reads retirement verdicts** (Retire candidates): a tree-wide commit has
    flattened `git log` recency across 48 of 52 skills, so this signal is now near-useless for
    disuse. If retirement nominations are meant to be real, the library needs an invocation-count
    source; otherwise the section should be understood as structurally unable to nominate anything.
