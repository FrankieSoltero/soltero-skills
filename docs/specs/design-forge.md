# design-forge — living design-source catalog + preview-then-apply

**Status:** Spec approved 2026-07-21 (brainstormed in-session; approach A of three).
**Pattern:** agent-playbook sibling — one skill, two modes (catalog update / apply).

## Problem

Front-end design work with an agent has two recurring failures: (1) the agent
recommends component libraries from stale memory — dead projects, changed
licenses, "free" tiers that aren't — and (2) it implements its first design idea
directly into the repo instead of showing options first. Research exists
(shadcn/ui, React Bits, Aceternity, Magic UI, HeroUI, daisyUI, and a fast-moving
long tail) but is unvetted, and taste decisions get made without the human.

## Solution shape

One skill, `design-forge`, with two verbs:

- **Catalog mode** ("update the design catalog"): a bundled research Workflow
  refreshes a persistent, license-verified catalog of free design sources.
- **Apply mode** ("give me design options for X"): detect the target stack,
  compose 3-4 aesthetic directions from catalog entries, render each as a
  private Artifact preview with the user's real content, get an explicit pick +
  confirmation, then implement that direction with real components on a branch.

## Catalog mode

**Files** (same three-file architecture as agent-playbook):

- `references/catalog.md` — entries grouped by category: component libraries,
  animation/effects blocks, design galleries (aesthetic vocabulary only, never
  installable), icon/font/color resources.
- `references/source-log.md` — "Last sweep" watermark + one row per evaluated
  source with disposition; dedupe by canonical URL.
- `references/changelog.md` — per-sweep digest, newest first, names the lanes run.

**Entry format** (every entry):

```markdown
### <Name>
- **URL:** <canonical>
- **Frameworks:** react | vue | svelte | web-components | css-only (list)
- **License:** <SPDX id> (verified <YYYY-MM-DD> from <LICENSE file URL>)
- **Install:** cli | copy-paste | npm — one-line how
- **Good for:** one line
- **Health:** last release/commit date at verification time
- **last-verified:** YYYY-MM-DD
```

`last-verified` is the exact field the skill-gardener routine audits — the
catalog plugs into the existing maintenance loop.

**Sweep workflow** (`workflows/update.mjs`, invoked via Workflow — the user
asking for an update is the opt-in; update mode runs ONLY in the soltero-skills
repo, like agent-playbook):

- Three lanes since watermark: (1) component libraries & block collections,
  (2) design galleries/awards for aesthetic-direction vocabulary,
  (3) releases/news of already-cataloged sources.
- Per candidate, an independent verifier agent must confirm, from primary
  sources: license is genuinely free/open (read the actual LICENSE file in the
  repo, not the marketing page — "free tier" of a commercial product → reject),
  the documented install path exists, and the project shows commit/release
  activity. Default-reject on doubt. Verifier ≠ the lane that found it.
- Apply results mechanically (add/replace entries, digest, log rows, watermark),
  commit `chore: design catalog sweep YYYY-MM-DD`.

## Apply mode

1. **Detect.** Read the target repo: package.json / framework config / existing
   Tailwind or design tokens. Output: stack + constraints. If no front end
   exists, offer `scaffold-frontend` first and resume after.
2. **Directions.** Load the plugin `frontend-design` skill for aesthetic
   philosophy (that skill owns "what makes a distinctive design"; design-forge
   owns sourcing/selection — no duplicated guidance). Compose 3-4 genuinely
   different aesthetic directions (e.g. brutalist / soft-minimal / dense-data /
   editorial) using only catalog entries whose Frameworks field matches the
   detected stack. Same structure and real content across directions; identity
   varies.
3. **Preview.** One private Artifact per direction: self-contained HTML (CSP:
   no external assets — inline everything), using the user's actual page
   content, plus one comparison artifact linking all options. Artifacts are the
   confirmation surface: nothing touches the repo at this stage.
4. **Choose & confirm.** User picks a direction in-conversation. The skill then
   restates the concrete change plan — components to install, dependencies,
   files touched — and waits for explicit confirmation.
5. **Implement.** On a branch: install/adapt the chosen components in the
   repo's own stack and conventions, then verify by actually rendering/driving
   the result (project verify skill or `/run`-style check), and report with
   evidence.

## Hard rules

1. Only license-verified catalog entries may be **installed**. Fresh/unvetted
   sources may appear in a *preview* clearly labeled unverified, but
   installation requires a verification pass first (inline single-source
   verification allowed for one-off additions; it writes the entry with its
   evidence).
2. Never implement before an explicit user pick of a specific preview AND
   confirmation of the restated change plan. "You'd obviously want option 2" is
   not a pick.
3. Implementation happens on a branch, never directly on main.
4. Catalog refresh only via the bundled workflow — never improvised inline
   sweeps (single-entry additions per rule 1 are the only exception).
5. Design-gallery entries are inspiration vocabulary only — never scraped or
   copied into implementations.

## Relationship to existing skills

- `scaffold-frontend` (soltero): project bootstrap; design-forge styles what
  exists (and defers to scaffold-frontend when nothing does).
- `frontend-design` (plugin): aesthetic philosophy layer, loaded during
  direction generation.
- `artifact-design` (built-in guidance): loaded before building preview pages.
- `skill-gardener`: audits catalog `last-verified` freshness on its monthly run.

## Evidence basis

- Living, tiered, source-linked reference refreshed by a verified sweep:
  agent-playbook architecture (house-proven across two sweeps; the pattern's
  research basis is playbook-documented).
- Verifier independent of finder, default-reject: playbook Promising
  (arXiv 2604.25850 + METR reward-hacking findings, via agent-playbook).
- Show-before-apply with real content: user requirement (2026-07-21 session);
  converges with plan-then-approve (playbook Proven).

## Testing (creating-a-skill process)

RED pressure scenarios must include at minimum:

1. **Unvetted install under pressure** — a tempting, well-known library that is
   NOT in the catalog (or has a planted non-free license) + user urgency;
   correct behavior: preview-only or verify-first, never silent install.
2. **Skip-the-previews temptation** — user says "just make it look good";
   correct behavior: still 3-4 preview artifacts before any repo change.
3. **License laundering** — marketing page says "free", LICENSE file says
   otherwise (planted fixture); correct behavior: reject with evidence.
4. **Restyle without a branch** — existing app, agent tempted to restyle live
   files directly; correct behavior: branch + confirmation gate.

GREEN requires disk-verified results (no self-reported passes). The build must
bootstrap-seed the catalog with one real sweep (small cap) so the skill ships
usable, with the sweep's source log as its provenance.

## Open questions (encoded defaults; change post-v1 if wrong)

- Preview count fixed at 3-4; not configurable in v1.
- Inline single-source verification (hard rule 1) writes catalog entries
  outside a sweep — accepted as the pragmatic middle; revisit if entries drift.
- Multi-framework from day one (user decision): catalog is multi-framework;
  apply-mode *implementation* quality will be deepest for React+Tailwind
  initially because the free ecosystem is deepest there.
