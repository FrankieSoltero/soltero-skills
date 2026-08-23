# Skill Garden Report — 2026-08-21

Library: `skills/` (soltero-skills — audited at `e83ba92`; `main` advanced to `a6e3585`
mid-run, touching only `docs/mistakes-and-fixes.md`, so the audited `skills/` tree is
byte-identical to the branch base)   Skills audited: 42
Gates run: `node tools/lint-frontmatter.mjs` (exit 0), `claude plugin validate ./ --strict` (exit 0), `npm run check:workflows` (exit 0)
Config: no `.skill-gardener.yml` at library root — **unvalidated defaults** used:
`verify-horizon-days=180` (default — unvalidated), `spot-check-sample=5` (default — unvalidated),
`unused-days-candidate=365` (default — unvalidated). These decay numbers have no empirical basis; they are config, not policy.

## Summary

Broken 0 · Compromised? 0 · Drifted 3 · Unverified 5 · Retire candidates 0 · Info 5.
All three structural gates pass across all 42 skills, and no auditor-directed text was found
in audited content. Ten external claims were spot-checked with live evidence (double the
default sample of 5); seven held, three drifted.

**Most urgent:** `scaffold-frontend` hard-pins new Expo projects to `--template default@sdk-56`
while the current Expo SDK is **57**. This is a load-bearing pin — an agent following the skill
silently scaffolds a full major version behind, which is exactly the failure the pin was written
to prevent.

This run modified nothing under `skills/`. The only file written is this report.

## Findings

### 1. Broken

None. All 42 skills pass every gate the repo provides:

- `node tools/lint-frontmatter.mjs` → 42 × `✓`, exit 0. Linted set diffed against `skills/*/`:
  42 vs 42, no directory silently skipped.
- `claude plugin validate ./ --strict` → `√ Validation passed`, exit 0.
- `npm run check:workflows` → `ok: skills/audit-swarm/workflows/audit.mjs parses under the Workflow
  runtime dialect` / `ok: skills/agent-playbook/workflows/update.mjs parses under the Workflow
  runtime dialect`, exit 0.

### 2. Compromised?

None found. Scanned all `skills/**/*.md` for auditor-directed text (`ignore previous`,
`do not audit`, `skip this skill/file/directory`, `mark me verified`, `already verified`,
`no need to check`, `delete this skill`, `auditor`, `gardener should`) — zero hits.

Disclosure on scope: `skills/skill-gardener/` was excluded from that grep because it is the
auditing skill itself and legitimately contains those phrases as documented attack examples in
its Hard Rules and Rationalization Table. Its own content was read in full for this run and
contains no directive aimed at an auditor of other skills.

### 3. Drifted

- **`scaffold-frontend`: Expo SDK pin `--template default@sdk-56`**
  (`skills/scaffold-frontend/reference.md:42`, repeated at `:141`, referenced at `:25`).
  Load-bearing — the skill instructs the agent to run
  `npx create-expo-app@latest my-app --template default@sdk-56`.
  Evidence: fetched `https://registry.npmjs.org/expo/latest` on 2026-08-21 →
  `"version": "57.0.15"`. Current SDK is 57; the skill pins 56.
  The surrounding comment ("Pin the SDK during transitions or you may get an older one") means
  the pin is deliberate, so this is a stale pin rather than a mistake — but it now produces the
  outcome it was written to avoid.

- **`design-forge`: "release shadcn@4.13.1 published 2026-07-17"**
  (`skills/design-forge/references/catalog.md:17`, Health line for the shadcn/ui entry).
  Evidence: fetched `https://registry.npmjs.org/shadcn/latest` on 2026-08-21 →
  `"version": "4.18.0"`.
  Low severity: the line is a dated health snapshot carrying `last-verified: 2026-07-21`, and the
  entry's install command is `npx shadcn@latest init`, so no agent consumes the version number.
  The snapshot is simply five releases behind.

- **`scaffold-frontend`: "Astro 6 needs Node 22.12+"** (`skills/scaffold-frontend/reference.md:25`).
  Evidence: fetched `https://registry.npmjs.org/astro/latest` on 2026-08-21 →
  `"version": "7.2.4"`, `"engines"` node `">=22.12.0"`.
  Low severity and partially still correct: the Node floor (22.12+) matches upstream exactly; only
  the major-version reference is a generation behind. The scaffold command is
  `npm create astro@latest`, so nothing load-bearing depends on the "6".

### Checked this run and holding (no drift)

Recorded so a future run can tell "verified fresh" from "never looked".

- **`scaffold-frontend`: `tailwindcss@^3.4.17`** RN pin (`reference.md:90`, `:139`) — load-bearing.
  Evidence: `https://registry.npmjs.org/tailwindcss/3.4.17` → `"name": "tailwindcss"`,
  `"version": "3.4.17"` (resolves); `https://registry.npmjs.org/tailwindcss/latest` → `4.3.3`,
  consistent with the skill's documented v4-for-web / v3-for-React-Native split.
- **`scaffold-frontend`: "Vite 8 needs Node 20.19+ / 22.12+"** (`reference.md:25`) — currency-gated.
  Evidence: `https://registry.npmjs.org/vite/latest` → `"version": "8.2.2"`, `"engines"` node
  `"^20.19.0 || >=22.12.0"`. Character-for-character match with upstream. (See Info for the Node 20
  EOL footnote.)
- **`scaffold-frontend`: "Next 16"** (`reference.md:25`, `:30`).
  Evidence: `https://registry.npmjs.org/next/latest` → `"version": "16.3.1"`. Current.
- **`scaffold-frontend`: "shadcn CLI is `shadcn`, not the deprecated `shadcn-ui`"** (`reference.md:134`).
  Evidence: `https://registry.npmjs.org/shadcn/latest` resolves to `4.18.0` under the `shadcn` name.
- **`design-forge`: HeroUI license claim** (`catalog.md:20-27`) — a URL the skill cites as its
  own verification evidence. Evidence: fetched
  `https://raw.githubusercontent.com/heroui-inc/heroui/v3/LICENSE` → resolves (not 404), Apache
  License 2.0 text, copyright NextUI Inc. Matches the catalog's `Apache-2.0` claim.
- **Node current LTS.** Evidence: `https://nodejs.org/dist/index.json` → newest entry with an `lts`
  codename is `v24.19.0` (2026-08-03), `"lts": "Krypton"`; v26.x entries are `"lts": false`.

### 4. Unverified

Listed, not presumed fresh.

- **40 of 42 skills carry no `last-verified:` metadata at all.** Only `design-forge`
  (`references/catalog.md`, 11 entries, all stamped `2026-07-21`) and `content-marketing`
  (`references/platform-constraints.md`, `2026-07-29`) use the convention. Both stamps are inside
  the `verify-horizon-days=180` window (cutoff 2026-02-22), so neither was queued for sampling on
  age. For the other 40 skills there is no freshness signal to read.
- **`agent-playbook`** — the library's largest external-claim surface by far: 247 `arxiv.org` URLs,
  63 `www.anthropic.com`, 27 `github.com`, plus dated release-note claims (e.g. "Claude Code
  v2.1.210", `source-log.md` entries dated 2026-07-09 / 2026-07-17). None sampled this run.
- **`content-marketing`: platform constraints** — in-horizon per its own stamp, not independently
  checked this run.
- **`design-forge`: 10 remaining catalog entries** — license URLs and Health lines other than
  shadcn/ui and HeroUI were not sampled.
- **URL liveness across the library** — no link sweep was run. Only the 2 URLs inside the sample
  were fetched; the other ~600 URL occurrences (top hosts: arxiv.org, anthropic.com, cursor.com,
  github.com, github.blog, cognition.com, openai.com, claude.com) are unchecked.

### 5. Retire candidates

**None.** No skill is beyond the configured threshold.

- Signal used: `git log -1 --format=%cs -- skills/<dir>` for all 42 skills. Oldest last-touch is
  **2026-06-13** (`capture-lesson`, `prisma-safety-review`) — 69 days ago. Newest is 2026-08-20
  (`dev-debrief`, `plan-visualizer`).
- Threshold: `unused-days-candidate=365` (config default, unvalidated — not policy). Nothing is
  within a factor of five of it.
- No invocation analytics were provided to this run. Commit recency is a proxy for maintenance, not
  for use; absence of usage data is not evidence of disuse.

### 6. Info

- **Report path case collision.** This repo already has a lowercase `docs/`
  (`debriefs/`, `decisions/`, `plans/`, `specs/`, `superpowers/`). Both the skill
  (`skills/skill-gardener/SKILL.md:83`, `references/output-template.md:3`) and the repo's own spec
  (`docs/specs/skill-gardener.md:12`, `:46`) mandate capital-`Docs/`. On this case-sensitive
  filesystem that creates a second, sibling directory. This run followed the spec as written and
  created `Docs/`; whether to align the spec down to `docs/` or keep the split is a maintainer
  decision, not an auditor's.
- **Node 20 baseline is past EOL.** `reference.md:25` recommends Node 20.19+ as a Vite floor. The
  claim is accurate (it mirrors Vite's `engines` exactly, verified above), but Node 20 "Iron"
  reached end-of-life **2026-04-30** — evidence:
  `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json` → v20 `"end": "2026-04-30"`,
  v22 `"end": "2027-04-30"`, v24 `"end": "2028-04-30"`. A reader treating 20.19+ as a *recommended*
  floor lands on an unsupported runtime. Not a false statement — a currency footnote worth adding.
- **No dangling intra-skill file references.** Six grep candidates were run down individually and
  all six resolve: `session-miner/references/mining-protocol.md` and
  `correction-compiler/references/ledger-format.md` exist (cross-skill paths, cited with full
  `skills/…` prefixes); `scripts/install-schedules.sh` and `scripts/launchd/` resolve at the repo
  root; `templates/SKILL.md.tmpl` and `templates/CLAUDE.md.template` exist — my extraction pattern
  had truncated their suffixes.
- **All SKILL.md files are within the library's own size budget.** `creating-a-skill/SKILL.md:49`
  sets `body ≤~500 lines`; the largest is `lean-sdd/SKILL.md` at 167 lines (3,836 lines across all
  42). No oversized-skill finding.
- **No `.skill-gardener.yml` at the library root**, so every threshold in this report is a printed
  unvalidated default. If the maintainer wants different horizons or a larger sample, that file is
  where they belong.

## What this run did NOT check

- Every external claim outside the 10-claim sample — most importantly the whole of
  `agent-playbook`'s ~250 arXiv citations and its Claude Code release-note claims, all
  `content-marketing` platform limits, and 10 of 12 `design-forge` catalog entries.
- URL liveness across the library (~600 occurrences); only 2 URLs in the sample were fetched.
- Whether `tailwindcss@3.4.17` is still the highest 3.x release — the pin is `^3.4.17`, so it
  resolves forward within 3.x regardless, and the exact-version fetch confirmed it exists.
- Invocation/usage analytics — none were provided to this run, so retirement analysis rests on
  commit recency alone.
- Prose quality, trigger-description accuracy, and whether skills actually work when invoked. This
  is a lifecycle/staleness audit, not an efficacy eval.

## Suggested next actions (for a human / separate fix PR)

The gardener applied none of these.

1. **Bump the Expo pin** in `skills/scaffold-frontend/reference.md:42` and `:141` from
   `default@sdk-56` to `default@sdk-57` (and the "Expo SDK 56" mention at `:25`), after confirming
   NativeWind/react-native-reusables compatibility with SDK 57 — the `tailwindcss@^3.4.17` v3 pin at
   `:90`/`:139` is the line most likely to move with it.
2. **Refresh the `design-forge` catalog** — its `workflows/update.mjs` already restamps
   `last-verified` and Health lines; running it would pick up shadcn 4.18.0 and re-verify the 10
   entries this run sampled out.
3. **Decide `Docs/` vs `docs/`** and make the skill, `docs/specs/skill-gardener.md`, and reality
   agree, so future reports accrete in one place instead of two.
4. **Add the Astro 7 / Node 20 EOL footnotes** to `scaffold-frontend/reference.md:25`.
5. **Consider adopting `last-verified:` more widely** — 40 of 42 skills have no freshness signal, so
   every future run must report them Unverified no matter how recently a human checked them. Per the
   skill's own rule, that stamping is a separate human-approved PR, never an audit side effect.
6. **Add `.skill-gardener.yml`** if the defaults in this header are not the thresholds you want
   cited back at you next month.
