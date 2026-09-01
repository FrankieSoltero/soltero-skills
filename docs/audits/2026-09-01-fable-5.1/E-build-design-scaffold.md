The report file write was blocked by the harness, so here is the full report as text.

---

# Audit report E — build/craft skills

**Target model:** Claude Fable 5.1 (`claude-fable-5-1`).
**Scope:** every file under `skills/design-forge`, `skills/code-optimizer`, `skills/build-mcp-server`, `skills/scaffold-frontend`, `skills/code-by-hand`, `skills/prisma-safety-review`, `skills/mini-game-craft`, `skills/multiplayer-game-dev` (excluding `*.test.mjs`) — 45 files, all read in full.
**Provenance sources consulted:** `tests/scenarios/<skill>/RED-baseline.md` (design-forge, code-optimizer, code-by-hand, mini-game-craft, multiplayer-game-dev), scenario files (build-mcp-server, scaffold-frontend, prisma-safety-review — these three have scenarios but no `RED-baseline.md`), `git log` dates, and live `npm view` / `claude mcp add --help` checks.

> Note: I was unable to write this to `scratchpad/audit/report-E-build.md` — the harness blocks subagent report files. The full content is below.

---

## Summary

**Counts by group:** Group 1 (dated prompt text) — **0**. Group 2 (brittle skill files) — **6**. Group 3 (tool descriptions) — **0**. Group 4 (request config / architecture, including keep-list item 11 "re-baselining adds text too") — **2**. **Total: 8 findings.**

The prompt-*text* surface in this scope is genuinely clean and needs no de-prescription pass. A grep for every Group 1 signal — `think step by step`, `<scratchpad>`/`<thinking>` instructions, `budget_tokens`/`temperature`/`top_p`/`tool_choice`/`stop_sequences`, prefill construction, "hold all findings"/"don't narrate"/"no interim", anti-formatting rules, numeric word caps, `every N tool calls` cadences, retired model names, grader vocabulary, "you tend to" trait claims — returns **zero hits across all 45 files**. Emphasis density in skill bodies (frontmatter `description` excluded per the repo keep-list) is 0 `MUST|NEVER|ALWAYS|CRITICAL|IMPORTANT` tokens in seven of eight `SKILL.md` bodies and 1 in the eighth. The heavy prohibition clusters that do exist — code-by-hand's five hard rules, design-forge's five, code-optimizer's Red Flags — every one carries a stated reason and traces to a quoted RED baseline, and every one guards a failure Fable 5.1 is *documented to still have* ("sometimes takes unrequested-but-adjacent actions", "may over-tidy at higher effort", "more likely to rewrite an entire file"). code-by-hand's rule 1 in particular is a textbook keeper: its RED baseline records agents editing a one-character typo under schedule pressure with a post-hoc consent offer, which is exactly the adjacent-unrequested-action mode the Fable 5.1 guidance tells you to bound explicitly. Nothing in Group 1 or Group 3 should change.

**What actually needs fixing is factual rot, and one of the three is serious.** `build-mcp-server` is built on a version landscape that flipped six weeks ago. Its Rule 0 tells the agent that `@modelcontextprotocol/sdk` v1.29.x is "the published **stable** package" and that a "**v2.0.0-alpha**… pre-release" splits into `@modelcontextprotocol/server` / `/node` / `/express`, then instructs "Build resume/production work on **stable v1**, not the alpha." As of `npm view` today, `@modelcontextprotocol/server` has dist-tag `latest: 2.0.0` (published 2026-07-28) — v2 shipped GA. The skill's own mandated verification step (`npm view @modelcontextprotocol/sdk version`) cannot catch this, because it queries the *old* package name; an agent following Rule 0 faithfully sees `1.30.0`, concludes it is on stable v1, and never learns that the scoped v2 packages exist as a released choice. This is the exact Group 2 "volatile specifics… nothing re-checks them by default" failure, and it is load-bearing: the whole skill is premised on "pin the SDK API so you don't author from memory."

**Second: `scaffold-frontend` recommends a library its sibling skill rejected on license evidence.** Step 2 of the flow offers "optional **ReactBits** for animated components," and `reference.md` gives a full install recipe. `design-forge/references/source-log.md:13` records React Bits **rejected** on 2026-07-21, with the LICENSE file fetched and the restriction quoted: "MIT + Commons Clause License Condition v1.0 … you do not sell, sublicense, or redistribute the components themselves." `scaffold-frontend` was last touched 2026-06-14, five weeks before that verification. Two skills in one plugin now give opposite answers about the same package, and the one with primary evidence is the one being ignored.

**Third: the Expo SDK pin has inverted.** Both files pin `--template default@sdk-56` with the stated rationale "else you get an older SDK." `npm view expo version` returns `57.0.19` — SDK 57 is current, so following the instruction now *forces* the older SDK the instruction exists to avoid.

Two smaller Group 4 items round it out: the dispatched agent prompts in `design-forge/workflows/update.mjs` (and the inline-verifier dispatch in its `SKILL.md`) run fully unattended, fetch web pages, and assert a boolean `licenseVerified` — but carry neither the Fable 5.1 progress-claim-audit line nor the "operating autonomously / don't end on a promise" block. That is a keep-list item 11 *add*, not a removal.

---

## Findings

Ordered by confidence, highest first.

### F1 — `build-mcp-server`: v2 described as an unreleased alpha; it shipped GA on 2026-07-28

| Field | Content |
|---|---|
| **Location** | `skills/build-mcp-server/SKILL.md:32-35`, `:41-42`, `:44-45`, `:112`; `skills/build-mcp-server/reference.md:9-17` |
| **Evidence** | `SKILL.md:34-35` — "A **v2.0.0-alpha** exists that splits into scoped packages (`@modelcontextprotocol/server`, `/node`, `/express`) and changes signatures." `SKILL.md:41-42` — "Read **that version's** docs/README … NOT the main branch, which is the unreleased v2 alpha." `reference.md:9` — "Stable **v1.29.x** (use this) \| **v2.0.0-alpha** (pre-release)". `reference.md:17-18` — "The main-branch README/docs describe the **alpha**. … Build resume/production work on **stable v1**, not the alpha." |
| **Pattern** | Group 2 — "Volatile specifics: hardcoded paths, flags, version numbers, API claims with no verification date… Skills rot factually as code ships; nothing re-checks them by default"; and Group 1d "date-conditional guidance". |
| **Why obsolete** | Verified live: `npm view @modelcontextprotocol/server dist-tags` → `{ latest: '2.0.0' }`, `time.modified` 2026-07-28. The version list shows `2.0.0-alpha.4` → `2.0.0-beta.1..5` → `2.0.0`; the alpha is three prerelease stages behind the released package. Every claim in the quoted text is now false. The skill's own escape hatch does not fire: Rule 0's mandated `npm view @modelcontextprotocol/sdk version` queries the v1 package name and returns `1.30.0`, so an agent following the skill correctly still concludes it is on the only stable line. Fable 5.1's documented "answers from memory more at `low` effort… most visibly for named products, models, and tools it recognizes but has out-of-date knowledge of" makes a wrong-but-confident in-skill version claim *more* dangerous than none: it supplies the authoritative-sounding background that suppresses the search. |
| **Confidence** | **High** — verified against npm today. |
| **Action** | `rewrite` — hunks 1–2. Replace the frozen stable-vs-alpha framing with a two-package verification step, and date-stamp what `reference.md`'s code blocks were verified against instead of asserting a current landscape. I do **not** propose v2 API content — I have not read v2's docs, and inventing it would repeat the failure. |

### F2 — `scaffold-frontend`: Expo SDK pin `sdk-56` is stale, inverting the instruction's own purpose

| Field | Content |
|---|---|
| **Location** | `skills/scaffold-frontend/SKILL.md:74`; `skills/scaffold-frontend/reference.md:25`, `:41-42`, `:141` |
| **Evidence** | `SKILL.md:74` — "**Pin the Expo SDK** during transitions: `--template default@sdk-56` (else you get an older SDK)." `reference.md:42` — "`npx create-expo-app@latest my-app --template default@sdk-56`". `reference.md:141` — "Pin Expo SDK (`--template default@sdk-56`) during transition windows." |
| **Pattern** | Group 2 — "Volatile specifics: hardcoded paths, flags, version numbers"; the recency trap (one release window's pin frozen as a permanent rule). |
| **Why obsolete** | `npm view expo version` → `57.0.19`. SDK 57 is current, so `--template default@sdk-56` now scaffolds a *previous* SDK — the precise outcome the parenthetical "(else you get an older SDK)" exists to prevent. The instruction is not merely stale, it is inverted, and Fable 5.1's strong instruction-following means it will be executed literally rather than sanity-checked. |
| **Confidence** | **High** — verified against npm today. |
| **Action** | `rewrite` — hunks 4 and 5. Replace the hard-coded number with the verification step that produces it, which is the only form of this instruction that cannot rot. |

### F3 — `scaffold-frontend`: recommends ReactBits, which this repo's own license verifier rejected

| Field | Content |
|---|---|
| **Location** | `skills/scaffold-frontend/SKILL.md:40-41`; `skills/scaffold-frontend/reference.md:9`, `:46`, `:75-81`, `:103` |
| **Evidence** | `SKILL.md:40-41` — "**Web (Next/Vite/Astro):** Tailwind v4 → **shadcn/ui** primitives → optional **ReactBits** for animated components." `reference.md:75-81` — "**ReactBits** (animated components — NOT an npm dependency; add per component): `npx shadcn@latest add @react-bits/BlurText-TS-TW`". Contradicted by `skills/design-forge/references/source-log.md:13` — "https://www.reactbits.dev/ \| React Bits \| 2026-07-21 \| **rejected** \| LICENSE.md fetched … is 'MIT + Commons Clause License Condition v1.0' — restriction quoted: 'you do not sell, sublicense, or redistribute the components themselves — whether alone, in a bundle, or as a ported version'; GitHub spdx NOASSERTION; not OSI-approved". |
| **Pattern** | Group 2 — "Volatile specifics… API claims with no verification date… verify surviving factual claims against current code as part of the audit." Also a genuine duplicate-that-disagrees, the one case keep-list item 8 says to reconcile rather than leave alone. |
| **Why obsolete** | `git log` puts `scaffold-frontend/reference.md` at 2026-06-14 and the design-forge license sweep at 2026-07-21 — the recommendation predates the evidence that refutes it by five weeks, and nothing re-checked it. design-forge's hard rule 1 ("Only catalog entries may be installed") and its Red Flag "About to run a package-manager install (or paste library source) for anything without a catalog entry" apply to this exact package; `shadcn add @react-bits/...` copies component *source* into the repo, which design-forge explicitly classifies as an install ("the license applies to the code, not the delivery mechanism"). Compounding it, Fable 5.1 is documented to answer from recognized-name memory rather than searching, so a skill that names a library approvingly is unusually likely to be acted on without an independent license check. |
| **Confidence** | **High** — primary evidence is in this repository, dated, and quotes the LICENSE text. |
| **Action** | `rewrite` — hunks 7 and 8. Replace ReactBits with Magic UI (design-forge catalog entry, MIT verified 2026-07-21 from the LICENSE file, shadcn-registry install — a drop-in for the same role), and route the UI-layer choice through design-forge's catalog so the two skills stop disagreeing. |

### F4 — `build-mcp-server`: v1.29.x pin is one minor behind

| Field | Content |
|---|---|
| **Location** | `skills/build-mcp-server/SKILL.md:32-33`; `skills/build-mcp-server/reference.md:3`, `:9`; `skills/build-mcp-server/templates/server.ts:2` |
| **Evidence** | `SKILL.md:32-33` — "As of June 2026 the published **stable** package is `@modelcontextprotocol/sdk` (v1.29.x)". `reference.md:3` — "Verified against **`@modelcontextprotocol/sdk` v1.29.0** (npm `latest`) on 2026-06-14". `templates/server.ts:2` — "// Verified against @modelcontextprotocol/sdk v1.29.x." |
| **Pattern** | Group 2 — volatile specifics / version pins; Group 1d date-conditional guidance ("As of June 2026…"). |
| **Why obsolete** | `npm view @modelcontextprotocol/sdk version` → `1.30.0`, published 2026-07-27. `1.29.x` is no longer what `npm i` gives you, so `SKILL.md`'s present-tense assertion is false. Note the asymmetry: `reference.md:3` and `templates/server.ts:2` are **not** findings on their own — they are dated "verified against X on DATE" stamps with an adjacent re-verify instruction, which is exactly Group 2's prescribed *fix* for volatile specifics. Only the undated present-tense claim in `SKILL.md` rots silently. |
| **Confidence** | **Medium** — verified stale, but the skill's mandatory `npm view` step means an agent following Rule 0 recovers on its own; the harm is bounded to the moment of reading. |
| **Action** | `rewrite` — hunks 1–3 (removing the version number from `SKILL.md` entirely, leaving `reference.md`'s dated stamp as the single home for it, per Group 2's "information lives in exactly one place"). |

### F5 — `scaffold-frontend`: "Astro 6" Node baseline is a major behind

| Field | Content |
|---|---|
| **Location** | `skills/scaffold-frontend/reference.md:25` |
| **Evidence** | "Node baselines: Vite 8 needs Node 20.19+ / 22.12+; Astro 6 needs Node 22.12+ (no odd versions); Next 16 and Expo SDK 56 target current LTS." |
| **Pattern** | Group 2 — volatile specifics / version pins with no verification date. |
| **Why obsolete** | `npm view astro version` → `7.2.10`; Astro 6 is a previous major. (The other claims in the same sentence check out: `vite` 8.2.2, `create-next-app` 16.3.4 — only the Astro major and the Expo SDK number, already covered by F2, are wrong.) The line has no verification date, so nothing signals that it needs re-checking. |
| **Confidence** | **Medium** — the major number is verifiably stale; whether Astro 7's Node floor differs from 22.12+ I did not confirm, so the proposed fix removes the version-bound framing rather than asserting a new number. |
| **Action** | `rewrite` — hunk 6. |

### F6 — `design-forge/workflows/update.mjs`: dispatched agent prompts lack the Fable 5.1 autonomy and progress-claim-audit guidance

| Field | Content |
|---|---|
| **Location** | `skills/design-forge/workflows/update.mjs:81-84` (`TOOL_HINT`, injected into all sweep-lane and verifier prompts at `:131` and `:170`) |
| **Evidence** | `const TOOL_HINT = 'You have WebSearch and WebFetch available — load them via ToolSearch (query "select:WebSearch,WebFetch") before searching. Never fabricate a source or a license: every claim must come from a page or file you actually retrieved. '` |
| **Pattern** | Group 4 / keep-list item 11 — "Re-baselining adds text too. Matching a prompt to a new model sometimes means *adding* guidance for the new model's failure modes." Specifically: dispatched-subagent prompts lacking the "operating autonomously / don't end on a promise" block and the progress-claim-audit line. |
| **Why obsolete** | These agents are the definition of an unattended run: 2–3 lane agents plus up to 12 verifiers dispatched via `parallel()`, each doing multi-step web retrieval, with no user able to answer a question mid-task. Two documented Fable 5.1 behaviors bite here. (1) *Rare: early stopping* — "deep into long sessions it can occasionally end a turn with a text-only statement of intent ('I'll now run X') without the tool call"; a verifier that ends on "I'll fetch the LICENSE file next" returns a null result, and `update.mjs:205` converts that into a silent `rejected — license-verifier agent failed` row. (2) *Ground progress claims* — the verifier's whole output is a claim about work it did (`licenseVerified: true`, `licenseEvidence: <url>`), and the guidance reports that requiring claims to be audited against tool results "nearly eliminated fabricated status reports." The existing "never fabricate" sentence states the prohibition; the audit instruction states the *procedure*, which is what measurably worked. The mechanical guard at `:212-215` catches an omitted URL but not a plausible-looking wrong one. |
| **Confidence** | **Medium** — the model-behavior citation is direct, but this is an addition whose value shows up only on failure runs; A/B it on the next sweep. |
| **Action** | `add` — hunk 9 (appended to `TOOL_HINT`, so it reaches every dispatched agent at once). |

### F7 — `design-forge/SKILL.md`: the inline single-entry verifier dispatch has the same gap

| Field | Content |
|---|---|
| **Location** | `skills/design-forge/SKILL.md:110-118` ("Inline verification (single entry, outside a sweep)") |
| **Evidence** | "dispatch an independent verifier subagent on sonnet, named explicitly — the same tier the sweep workflow uses (never self-verify — you found it, so you don't judge it) — that fetches the actual LICENSE file and returns SPDX id + LICENSE file URL + health, or a rejection." |
| **Pattern** | Group 4 / keep-list item 11 — same row as F6. |
| **Why obsolete** | This path deliberately mirrors the workflow's verifier ("the same tier the sweep workflow uses") but specifies only the model and the return shape, not the operating conditions. The instruction that governs whether the subagent actually *fetches* before answering — rather than answering from recognition, which Fable 5.1 is documented to do more of for "named products… it recognizes but has out-of-date knowledge of" — is absent. Since this is the path that authorizes a real install in a user's repo, it is the higher-stakes of the two. |
| **Confidence** | **Medium**. |
| **Action** | `add` — hunk 10. |

### F8 — `multiplayer-game-dev`: "s1-style features" is an unresolvable internal incident reference

| Field | Content |
|---|---|
| **Location** | `skills/multiplayer-game-dev/SKILL.md:12-14` |
| **Evidence** | "Netcode judgment is strong when the problem is in view; what slips is the STANDING discipline — s1-style features ship with zero latency testing when nothing in the ask smells broken." |
| **Pattern** | Group 2 — "History narratives: past tense, incident IDs, PR numbers… A rule's authority is the behavior it prescribes, not the incident that motivated it." |
| **Why obsolete** | "s1" is scenario 1 of `tests/scenarios/multiplayer-game-dev/RED-baseline.md` ("s1 (trust client timestamps)… s1 shipped with no latency/skew testing"), a file the agent reading this skill does not load. The label names the failure without describing it, so the sentence conveys less than the same words with the class spelled out. Worth fixing precisely *because* the underlying observation is good — the RED baseline confirms the gap is real, and Fable 5.1's readability guidance warns against exactly this shape ("labels you made up earlier — the reader doesn't have the context to decode them"). Note the sibling stamps at `mini-game-craft/SKILL.md:53` and `netcode.md:3` ("distilled 2026-07-29 from…") are **not** this pattern — they are dated freshness provenance for reference data, which Group 2 prescribes rather than prohibits. |
| **Confidence** | **Medium**. |
| **Action** | `rewrite` — hunk 11. |

---

## Files audited and found clean

- **`skills/code-optimizer/`** (`SKILL.md`, `reference.md`) — **clean.** On the specific question asked: the "fable" mentions at `SKILL.md:47`, `reference.md:119`, `:151-156`, `:179-180` are **version-relative tier aliases, not pinned model names**. `engineering: opus / grunt: sonnet / reading: haiku / orchestration: fable` maps one-to-one onto the Agent tool's `model` enum (`'sonnet'|'opus'|'haiku'|'fable'`), which resolves to whatever each tier currently points at. `reference.md:151-156` states the durable policy the alias serves — "an omitted model silently inherits the orchestrating session's model… which is reserved for coordination and never assigned to dispatched work" — not a claim about a model version. Nothing here degrades when the underlying models change. No finding. The rest of the skill traces to `tests/scenarios/code-optimizer/RED-baseline.md` and guards behaviors — over-tidying, improvising an undeclared rule, batching commits — that Fable 5.1's "unrequested tidying or refactoring at higher effort" note says still reproduce.
- **`skills/code-by-hand/`** (`SKILL.md`, `references/session-protocol.md`) — **clean**, and a model of provenance-backed prohibition. Every hard rule is quoted from the RED baseline in the Overview, and the failure class is one Fable 5.1 explicitly still has: "sometimes takes unrequested-but-adjacent actions." Keeper in full.
- **`skills/prisma-safety-review/`** (`SKILL.md`, `reference.md`, both scripts) — **clean.** No version pins that rot (the Prisma-version check is computed at runtime by `check-prisma-versions.mjs`, not asserted in prose). Group 4's "LLM executor for a deterministic plan" check passes: the deterministic steps are already scripts, and the one model call left is the judgment layer.
- **`skills/mini-game-craft/`** (`SKILL.md`, `references/mechanics.md`, `references/art.md`) — **clean.** Dated provenance stamps are the prescribed pattern, not the anti-pattern.
- **`skills/multiplayer-game-dev/references/netcode.md`** — **clean.** The `[UNSOURCED]` markers on every numeric threshold are the correct handling of the Group 1f numeric-clamp concern: labeled tunable conventions, not caps the model must hit.
- **`skills/design-forge/references/catalog.md`, `source-log.md`, `changelog.md`** — **clean.** Every installable entry carries `last-verified: 2026-07-21` plus the LICENSE URL it was verified from — Group 2's prescribed fix for volatile specifics. Six weeks old, within a reasonable refresh window, and the skill-gardener freshness audit reads the field.
- **`skills/design-forge/SKILL.md`** apart from F7 — **clean.** The Workflow invocation shape at `:91-96` is an exact script for a fragile operation (keep-list item 3). All tool/skill references check out against the current harness: `Workflow`, `ToolSearch`, `Artifact`, `WebSearch`, `artifact-design`, `frontend-design`, `scaffold-frontend`.
- **`skills/build-mcp-server/templates/*`** (10 files) and **`skills/scaffold-frontend/templates/*`** (12 files) — **clean** apart from the one comment in F4. Checked: `actions/checkout@v4` and `actions/setup-node@v4` current; `node:22-slim` a current LTS; ESLint v9 flat config, `typescript-eslint` v8, `react-hooks` v6 `recommended-latest`, husky v9 style — all current. No secrets, no hardcoded credentials.
- **`skills/build-mcp-server/reference.md:182-197`** (the `claude mcp add` / Inspector section) — **clean, verified live.** `claude mcp add --help` confirms `--transport`, `--env`/`-e`, and `--header`/`-H` all exist as documented, and the section already carries the correct drift mitigation.

**Non-finding deliberately not raised.** The `Red Flags — STOP` / `Rationalization Table` pairs in `build-mcp-server` and `scaffold-frontend` restate the same points twice in different wordings. This matches keep-list item 8 (working redundancy that does not disagree) — consistent duplicates, house style, a refactoring preference rather than a dated pattern.

---

## Step 6 — Proposed diff

High and Medium confidence findings only. One finding per hunk. **No repo file was edited.**

### Hunk 1 — F1 + F4: `skills/build-mcp-server/SKILL.md` Rule 0

```diff
--- a/skills/build-mcp-server/SKILL.md
+++ b/skills/build-mcp-server/SKILL.md
@@ -30,15 +30,19 @@
 ## Rule 0 — Verify the SDK API; never author it from memory
 
-The TS SDK is actively migrating. As of June 2026 the published **stable** package is
-`@modelcontextprotocol/sdk` (v1.29.x) with **subpath imports** and a **raw-shape** `inputSchema`.
-A **v2.0.0-alpha** exists that splits into scoped packages (`@modelcontextprotocol/server`,
-`/node`, `/express`) and changes signatures. Most tutorials — and your own memory — mix these.
+The TS SDK ships under two package families whose APIs differ: the **monolith**
+`@modelcontextprotocol/sdk` (subpath imports, raw-shape `inputSchema`) and the **scoped**
+`@modelcontextprotocol/server` / `/node` / `/express` (different imports and signatures).
+Both are published; which one is current, and which the docs you are reading describe, changes
+between releases. Tutorials — and your own memory — mix them. Recognizing these package names is
+not the same as knowing their current state, so check both before writing a line.
 
 So, before writing server code:
 
-1. Run `npm view @modelcontextprotocol/sdk version` to see what `npm i` gives you today.
-2. Read **that version's** docs/README (pin the git tag, e.g. `?ref=v1.29.0`) — NOT the main
-   branch, which is the unreleased v2 alpha.
-3. Match imports and the `registerTool`/`registerResource` signatures to that version.
+1. Run `npm view @modelcontextprotocol/sdk version` **and**
+   `npm view @modelcontextprotocol/server dist-tags` — the second is the one that tells you
+   whether the scoped family has shipped past prerelease. Decide which family you are on, and
+   say which, before installing.
+2. Read the docs for **that exact version**, pinned by git tag (`?ref=v<version>`), never the
+   main branch — main tracks whatever is unreleased at the time you read it.
+3. Match imports and the `registerTool`/`registerResource` signatures to that version.
 
-`reference.md` holds the verified v1.29.x API and the v2-alpha delta. If the installed version has
-moved past it, re-verify — do not assume.
+`reference.md` holds a dated, verified snapshot of the monolith API. Check its verification date
+against what step 1 returned: if the installed version has moved past it, or step 1 puts you on
+the scoped family, the snapshot is a starting point to re-verify, not an answer.
@@ -110,5 +114,5 @@
-| "The README example is current." | The main-branch README is the unreleased v2 alpha. Pin the tag of the version you install. |
+| "The README example is current." | The main branch tracks unreleased work and may describe a different package family than the one you installed. Pin the git tag of the version `npm view` reported. |
```

### Hunk 2 — F1 + F4: `skills/build-mcp-server/reference.md` version landscape

```diff
--- a/skills/build-mcp-server/reference.md
+++ b/skills/build-mcp-server/reference.md
@@ -1,18 +1,20 @@
 # Build MCP Server — Reference
 
-Verified against **`@modelcontextprotocol/sdk` v1.29.0** (npm `latest`) on 2026-06-14, sourced from
-the SDK repo at tag `v1.29.0` (`docs/server.md`, `src/examples/server/`). MCP spec: `2025-11-25`.
-**Re-verify** with `npm view @modelcontextprotocol/sdk version` before trusting any signature below.
+Every code block below was verified against **`@modelcontextprotocol/sdk` v1.29.0** on
+**2026-06-14**, sourced from the SDK repo at tag `v1.29.0` (`docs/server.md`,
+`src/examples/server/`). MCP spec: `2025-11-25`. That date is the shelf life of this file:
+**re-verify** with `npm view @modelcontextprotocol/sdk version` before trusting any signature
+here, and treat anything published since as unrepresented.
 
 ## Version landscape (why Rule 0 exists)
 
-| | Stable **v1.29.x** (use this) | **v2.0.0-alpha** (pre-release) |
+Two package families, both published. Run Rule 0's two `npm view` commands to find out which is
+current today — this table describes how they *differ*, not which one to pick:
+
+| | Monolith `@modelcontextprotocol/sdk` | Scoped `@modelcontextprotocol/server` |
 |---|---|---|
-| Package(s) | `@modelcontextprotocol/sdk` (one) | `@modelcontextprotocol/server`, `/node`, `/express` |
+| Package(s) | one package | `@modelcontextprotocol/server`, `/node`, `/express` |
 | Imports | subpaths: `@modelcontextprotocol/sdk/server/mcp.js` | scoped packages |
 | `inputSchema` | **raw shape** `{ x: z.string() }` | `z.object({ x: z.string() })` |
 | Zod | `zod` peer dep; SDK uses `zod/v4` (v3.25+ compatible) | `zod/v4` |
 
-The main-branch README/docs describe the **alpha**. Pin the git tag of your installed version.
-Build resume/production work on **stable v1**, not the alpha.
+The code in the rest of this file is the monolith form. If Rule 0 puts you on the scoped family,
+read that family's docs at its released tag — do not port these snippets by analogy.
```

> This hunk deliberately does not describe the scoped v2 API. I have not read v2's docs, and asserting its shape from inference is the same failure this skill exists to prevent.

### Hunk 3 — F4: `skills/build-mcp-server/templates/server.ts` header comment

```diff
--- a/skills/build-mcp-server/templates/server.ts
+++ b/skills/build-mcp-server/templates/server.ts
@@ -1,4 +1,5 @@
 // Shared server definition — built once, exposed over BOTH transports (stdio.ts, http.ts).
-// Verified against @modelcontextprotocol/sdk v1.29.x. Neutral example: an in-memory item store.
+// Verified against @modelcontextprotocol/sdk v1.29.0 on 2026-06-14 — re-verify against the
+// version you installed (see the skill's Rule 0). Neutral example: an in-memory item store.
 // Replace the store with your real data source (DB, API, etc.).
```

### Hunk 4 — F2: `skills/scaffold-frontend/SKILL.md` Expo SDK pin

```diff
--- a/skills/scaffold-frontend/SKILL.md
+++ b/skills/scaffold-frontend/SKILL.md
@@ -74 +74,2 @@
-- **Pin the Expo SDK** during transitions: `--template default@sdk-56` (else you get an older SDK).
+- **Pin the Expo SDK, but look it up first:** `npm view expo version` gives the current major;
+  pass it as `--template default@sdk-<major>`. A number written down here goes stale and pins you *backwards*.
```

### Hunk 5 — F2: `skills/scaffold-frontend/reference.md` Expo SDK pin (both sites)

```diff
--- a/skills/scaffold-frontend/reference.md
+++ b/skills/scaffold-frontend/reference.md
@@ -41,3 +41,4 @@
-# Expo (TS + Expo Router preconfigured). Pin the SDK during transitions or you may get an older one.
-npx create-expo-app@latest my-app --template default@sdk-56
+# Expo (TS + Expo Router preconfigured). Look up the current SDK major, then pin it:
+npm view expo version                  # e.g. 57.x -> use sdk-57
+npx create-expo-app@latest my-app --template default@sdk-<major>
@@ -141 +142 @@
-- Pin Expo SDK (`--template default@sdk-56`) during transition windows.
+- Pin the Expo SDK to the major `npm view expo version` reports — never to a number copied from here.
```

### Hunk 6 — F5: `skills/scaffold-frontend/reference.md` Node baselines

```diff
--- a/skills/scaffold-frontend/reference.md
+++ b/skills/scaffold-frontend/reference.md
@@ -25 +25,3 @@
-Node baselines: Vite 8 needs Node 20.19+ / 22.12+; Astro 6 needs Node 22.12+ (no odd versions); Next 16 and Expo SDK 56 target current LTS.
+Node baselines drift with each framework major, and the majors move faster than this file. All
+four routes currently want an even-numbered active LTS (Node 22+); Astro additionally rejects odd
+Node versions outright. Confirm against the installed major's release notes before pinning CI.
```

### Hunk 7 — F3: `skills/scaffold-frontend/SKILL.md` UI layer

```diff
--- a/skills/scaffold-frontend/SKILL.md
+++ b/skills/scaffold-frontend/SKILL.md
@@ -39,5 +39,8 @@
 2. **Offer the UI/component layer** for the chosen framework, then let the user choose:
-   - **Web (Next/Vite/Astro):** Tailwind v4 → **shadcn/ui** primitives → optional **ReactBits**
-     for animated components.
+   - **Web (Next/Vite/Astro):** Tailwind v4 → **shadcn/ui** primitives → optional **Magic UI**
+     for animated components (MIT, verified from its LICENSE file — see design-forge's catalog).
+     Anything beyond these comes from `design-forge/references/catalog.md`, which is the
+     license-verified list; a source not in it needs a license verification before it is
+     installed or copied, and "the site says free" is not one. ReactBits in particular is
+     **rejected** there (MIT + Commons Clause, not OSI-approved) — do not offer it.
    - **Mobile (Expo):** **NativeWind** → **react-native-reusables** ("shadcn for RN"). Web
      shadcn/ui is DOM-only — do not use it in Expo.
```

### Hunk 8 — F3: `skills/scaffold-frontend/reference.md` ReactBits section

```diff
--- a/skills/scaffold-frontend/reference.md
+++ b/skills/scaffold-frontend/reference.md
@@ -9 +9 @@
-3. UI layer — web (Tailwind v4 + shadcn/ui + ReactBits)
+3. UI layer — web (Tailwind v4 + shadcn/ui + Magic UI)
@@ -46 +46 @@
-## 3. UI layer — web (Tailwind v4 + shadcn/ui + ReactBits)
+## 3. UI layer — web (Tailwind v4 + shadcn/ui + Magic UI)
@@ -75,8 +75,10 @@
-**ReactBits** (animated components — NOT an npm dependency; add per component):
-```bash
-# Variant suffix matches your stack: JS-CSS | JS-TW | TS-CSS | TS-TW (TW requires Tailwind installed)
-npx shadcn@latest add @react-bits/BlurText-TS-TW
-#   or: npx shadcn@latest add "https://reactbits.dev/r/BlurText-TS-TW.json"
-#   components.json registry: "registries": { "@react-bits": "https://reactbits.dev/r/{name}.json" }
-```
+**Magic UI** (animated components — NOT an npm dependency; add per component). MIT, verified
+2026-07-21 from the project's LICENSE file; see `design-forge/references/catalog.md`:
+```bash
+npx shadcn@latest add "https://magicui.design/r/<component>.json"
+```
+> **Not ReactBits.** design-forge's license verifier fetched its LICENSE.md on 2026-07-21 and
+> rejected it: "MIT + Commons Clause License Condition v1.0", GitHub SPDX `NOASSERTION`, not
+> OSI-approved. Copying its component source counts as an install of that source. Any other
+> animation library needs its own LICENSE-file verification before it enters a repo.
@@ -103 +105 @@
-Docs: tailwindcss.com · ui.shadcn.com · reactbits.dev · nativewind.dev · reactnativereusables.com
+Docs: tailwindcss.com · ui.shadcn.com · magicui.design · nativewind.dev · reactnativereusables.com
```

### Hunk 9 — F6: `skills/design-forge/workflows/update.mjs` TOOL_HINT

```diff
--- a/skills/design-forge/workflows/update.mjs
+++ b/skills/design-forge/workflows/update.mjs
@@ -81,5 +81,12 @@
 const TOOL_HINT =
   'You have WebSearch and WebFetch available — load them via ToolSearch ' +
   '(query "select:WebSearch,WebFetch") before searching. Never fabricate a source or a ' +
-  'license: every claim must come from a page or file you actually retrieved. '
+  'license: every claim must come from a page or file you actually retrieved. Before you ' +
+  'return a result, audit each field against a tool result from this session — if you did not ' +
+  'retrieve the evidence for a field, report that rather than asserting it. Recognizing a ' +
+  'project name is not the same as knowing its current license or release state, so search ' +
+  'even when the name is familiar. You are operating autonomously: nobody is watching and ' +
+  'nobody can answer a question mid-task. Do not end your turn on a plan or a promise ' +
+  '("I will now fetch..."); make the call and return the structured result. End only when the ' +
+  'result is complete, or when a retrieval definitively failed — which you report as a rejection. '
```

### Hunk 10 — F7: `skills/design-forge/SKILL.md` inline verification

```diff
--- a/skills/design-forge/SKILL.md
+++ b/skills/design-forge/SKILL.md
@@ -110,9 +110,13 @@
 When apply mode needs ONE source that isn't cataloged: dispatch an independent
 verifier subagent on sonnet, named explicitly — the same tier the sweep workflow
 uses (never self-verify — you found it, so you don't judge it) — that
 fetches the actual LICENSE file and returns SPDX id + LICENSE file URL + health, or a
-rejection. Write the outcome into `catalog.md` (if verified) AND `source-log.md`
+rejection. Give it the same operating conditions the workflow's verifiers get: it runs
+autonomously with nobody to ask, every field it returns must trace to a page it actually
+retrieved this session (recognizing the project name is not evidence), and it must not end
+its turn on "I'll fetch the LICENSE next" — make the call, then answer. A verifier that
+returns without a fetched LICENSE URL is a rejection, not a pending result.
+Write the outcome into `catalog.md` (if verified) AND `source-log.md`
 (either way, disposition + evidence) and commit — a correct verdict recorded in an ad
 hoc file, or left uncommitted, is a verdict the next session re-litigates from the
 same marketing page. Rejected means rejected: preview-only or a verified alternative.
```

### Hunk 11 — F8: `skills/multiplayer-game-dev/SKILL.md` incident reference

```diff
--- a/skills/multiplayer-game-dev/SKILL.md
+++ b/skills/multiplayer-game-dev/SKILL.md
@@ -12,4 +12,4 @@
 Netcode judgment is strong when the problem is in view; what slips is the
-STANDING discipline — s1-style features ship with zero latency testing when
-nothing in the ask smells broken. This skill injects the patterns with
+STANDING discipline — a feature that looks routine (a shared timer, a tap race,
+a score sync) ships with zero latency or clock-skew testing because nothing in the
+ask smelled broken. This skill injects the patterns with
 numbers ([references/netcode.md](references/netcode.md) — read it before
 designing) and makes the gates unconditional.
```

---

## Follow-up the diff cannot cover

**`build-mcp-server` needs a content refresh, not just a wording fix.** Hunks 1–3 stop the skill from asserting false things, but they leave it with no guidance for the scoped `@modelcontextprotocol/server` v2 family that is now `latest`. Someone should read v2's released docs and add a dated section — authoring work with a live source, outside an audit's remit. Until then the skill is honest but incomplete.

**Grep for out-of-band dependents before applying hunks 7–8.** `docs/specs/scaffold-frontend.md:18` and `:36` and `CHANGELOG.md:417` also name ReactBits. The changelog is a historical record and should stay as written; the spec describes intended behavior and should move with the skill.