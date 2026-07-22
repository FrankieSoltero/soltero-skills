---
name: design-forge
description: Use for front-end design work — "give me design options for X", "restyle this app", "make it look good", "add components from <library>" — and for "update the design catalog". Apply mode detects the stack, composes 3-4 aesthetic directions from a license-verified catalog of free design sources, renders each as a private preview with the user's real content, and implements only after an explicit pick + confirmed change plan, on a branch, render-verified. Catalog mode refreshes references/catalog.md via a bundled research Workflow with an independent license-verifier per candidate (reads the actual LICENSE file, default-reject); update mode runs only in the soltero-skills repo.
---

# Design Forge

## Overview

Front-end design with an agent fails two ways, both observed at baseline: libraries get
recommended or installed on marketing-page trust ("free forever" with a non-commercial
LICENSE underneath), and the agent's first design idea gets implemented straight into
the repo — at baseline, committed to the fixture with nobody having seen anything,
narrated as "the founder delegated taste to me." This skill keeps ONE durable artifact —
`references/catalog.md`, a license-verified catalog of free design sources — and two
verbs: **apply** a design direction from it, and **update** it via a bundled sweep
Workflow whose license-verifier is independent of the lane that found each candidate.

Core principle: **the LICENSE file decides, and the user picks.** No install without a
license verified from the project's actual LICENSE file; no implementation without an
explicit user pick of a specific preview plus confirmation of the restated change plan.

## Hard rules (non-negotiable)

1. **License-verified installs only.** Only catalog entries may be installed. A source
   not in the catalog gets a verification pass first (see "Inline verification") — or
   appears in a preview clearly labeled UNVERIFIED, never in the repo. Copy-pasting a
   library's component source instead of installing it is the same act under the same
   rule — the license applies to the code, not the delivery mechanism.
2. **No implementation without an explicit pick + confirmation.** The user must name a
   specific preview AND confirm the restated change plan. "Just make it look good,"
   "you have taste, go ahead," and "don't send me mockups" delegate the *surface*, not
   the decision — respond with previews built from their real content (that is not a
   mockup round; it takes minutes) and one short line on why the pick is theirs.
   "You'd obviously want option 2" is not a pick.
3. **Implementation happens on a branch, never on the default branch** — even when the
   user says "main is fine, right here." Uncommitted edits on main are not a safety
   mechanism: the working tree holds the only copy, and one reflexive commit deploys
   it. One sentence of why (main auto-deploys / needs a reviewable diff), then branch.
4. **Catalog refresh only via the bundled workflow** — never an improvised inline
   sweep. The only exception is single-entry inline verification (rule 1), which
   writes the entry with its evidence.
5. **Galleries are vocabulary, never source.** Design-gallery entries inform aesthetic
   direction; nothing is scraped or copied from them into an implementation.

## Apply mode ("give me design options" / "restyle X" / "make it look good")

1. **Detect.** Read the target repo: package.json, framework config, existing Tailwind
   or design tokens. Output: stack + constraints. No front end at all → offer
   `scaffold-frontend` first and resume after.
2. **Directions.** Load the plugin `frontend-design` skill (aesthetic philosophy lives
   there; this skill owns sourcing/selection). Compose 3-4 genuinely different
   directions (e.g. brutalist / soft-minimal / dense-data / editorial) using only
   catalog entries whose **Frameworks** field matches the detected stack. Same
   structure and REAL page content across directions; identity varies.
3. **Preview.** Load the `artifact-design` guidance, then publish one private Artifact
   per direction — self-contained HTML, everything inlined (CSP: no external assets),
   the user's actual content — plus one comparison artifact linking all options. If
   the Artifact tool is unavailable, write the same self-contained HTML files to a
   scratch directory and present their paths; the gate is identical either way.
   Nothing touches the repo at this stage.
4. **Choose & confirm.** The user picks a direction in-conversation. Restate the
   concrete change plan — components to install (each one's catalog entry + license),
   dependencies, files touched — and wait for explicit confirmation of that plan.
5. **Implement.** On a branch: install/adapt the chosen components in the repo's own
   stack and conventions, then verify by actually rendering/driving the result
   (project verify skill or a `/run`-style check), and report with evidence
   (screenshot or driven-page output, plus the diff), leaving merge to the user.

## Catalog mode ("update the design catalog")

Runs ONLY in the soltero-skills repo: if `skills/design-forge/` is not in the working
tree, STOP — tell the user to run it there (catalog changes ship via the plugin
release cycle).

1. **Preflight:** load WebSearch via ToolSearch; if unavailable, ABORT — never fill a
   sweep from memory. Get today's date: `date +%F`.
2. **Parse `references/source-log.md`:** watermark ("Last sweep") → `sinceDate`
   (bootstrap: none yet → ~6 months back and `bootstrap: true`); every Key value plus
   every URL in Title links → `seenKeys`.
3. **Invoke the Workflow — do not improvise your own sweep, and never verify a
   license yourself for a candidate you found:**

   ```
   Workflow({
     scriptPath: "${CLAUDE_SKILL_DIR}/workflows/update.mjs",
     args: { sinceDate, today, seenKeys, catalog: <full text of references/catalog.md>, bootstrap }
   })
   ```

   Its Verify phase runs one independent license-verifier per candidate that must
   fetch and read the project's actual LICENSE file (marketing pages, README badges,
   and npm license fields are claims, not evidence), default-reject on doubt.
4. **Apply the result mechanically:** each `edits[]` item under its `## <section>`
   heading (`add` → append, removing the "_No entries yet_" placeholder; `replace` →
   replace the entry whose **URL** line matches `replacesUrl`); prepend `digest` to
   `references/changelog.md` below its intro line; update "Last sweep:"; append one
   source-log row per `logEntries[]` item (Key ← key, Title ← `[title](url)`,
   Evaluated ← today, Disposition, Reason).
5. **Commit** the three reference files: `chore: design catalog sweep YYYY-MM-DD`.

### Inline verification (single entry, outside a sweep)

When apply mode needs ONE source that isn't cataloged: dispatch an independent
verifier subagent (never self-verify — you found it, so you don't judge it) that
fetches the actual LICENSE file and returns SPDX id + LICENSE file URL + health, or a
rejection. Write the outcome into `catalog.md` (if verified) AND `source-log.md`
(either way, disposition + evidence) and commit — a correct verdict recorded in an ad
hoc file, or left uncommitted, is a verdict the next session re-litigates from the
same marketing page. Rejected means rejected: preview-only or a verified alternative.

## When NOT to Use

- Pure logic/backend work with no visual surface.
- Project bootstrap from nothing — `scaffold-frontend` first, then apply mode.
- Reviewing a diff (`/code-review`) or debugging CSS you didn't restyle.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The founder explicitly said no mockups — previews would be insubordinate." | Baseline said exactly this, then committed a design nobody had seen. "No mockups" waives the format, not the pick: previews with their real content ARE the fast path, and the pick stays theirs. |
| "It's a reversible, purely aesthetic call — git revert exists." | Reversible-in-git is not reviewed. The cost isn't the diff, it's the human cut out of the taste decision; hard rule 2 has no stakes threshold. |
| "Everyone uses it and the site says free — install now, bookkeeping later." | 'Free forever' marketing sat directly above a personal-non-commercial-only LICENSE in this skill's own test fixture. The LICENSE file is the verdict; no file read → no install. |
| "The package resolves / is famous, so it's fine." | Baseline refused a fake package for being fake — and articulated no rule that would have stopped a real-but-commercial one. Existence and popularity verify nothing about license. |
| "I'll copy the source off the docs site instead of installing." | Same code, same license, minus the paper trail. Copy-paste from a source = install of that source (hard rule 1). |
| "I read the LICENSE and rejected it — done." | Baseline's correct rejection went into an invented `rejected.md`, uncommitted. A verdict that isn't in `source-log.md` and committed will be re-litigated from the same marketing page. |
| "Uncommitted changes on main can't deploy, so it's safe." | Baseline's exact argument. The tree now holds the only copy of the work, main is dirty for every other fix, and one reflexive `git commit -am` ships it. Branch first — always. |
| "The user told me to skip the branch — their repo, their call." | Their call on the design; the branch is how they get a reviewable diff and a deployable main while deciding. One sentence of why, then branch anyway. |
| "This gallery site has exactly the layout we need — I'll adapt its markup." | Galleries are vocabulary (hard rule 5). Name the direction it inspires; build it from catalog components. |
| "A quick inline sweep is cheaper than the workflow." | Inline = no lanes, no dedupe vs the source log, and the finder vouching for its own findings. Invoke the workflow, or verify a single entry with an independent subagent — nothing in between. |

## Red Flags — STOP

- About to run a package-manager install (or paste library source) for anything
  without a catalog entry or a fresh independent license verification.
- About to edit repo styling with no preview picked in THIS conversation and no
  confirmed change plan — regardless of how broad the user's delegation sounded.
- Styling edits happening on the default branch, or "uncommitted = safe" appearing in
  your reasoning.
- A license judgment citing a marketing page, README badge, npm `license` field, or
  the finder's own claim — anything but the fetched LICENSE text.
- You found the candidate AND you are about to pronounce its license verdict.
- A verification outcome (accept or reject) about to land anywhere other than
  `catalog.md` / `source-log.md`, or left uncommitted.
- Markup or assets flowing from a gallery entry into an implementation.
- Refreshing the catalog without invoking the bundled workflow, or running update mode
  outside the soltero-skills repo.
- A sweep digest that doesn't say which lanes ran.
