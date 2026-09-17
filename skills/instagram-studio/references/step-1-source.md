# Step 1 — Source → `facts.md`

Two intake paths, one output. `facts.md` is the only source of claims for
everything downstream: on-screen text, the caption, the hashtags, the alt
text. A preamble in your head is not a facts file.

## Path A — a code project is present

Read the real thing, not the README's promise of it:

- **UI copy** — actual strings in components, landing/hero markup, empty
  states, button labels.
- **Features** — what is shipped and reachable, not what is in a TODO, a
  feature flag, a branch, or a roadmap heading.
- **Brand tokens** — colors, fonts, radii, logo files from the theme/token
  files or CSS variables, with the file they came from.
- **Numbers** — only where the repo or a supplied document states them.

## Path B — a brief

Fill [../assets/brief-template.md](../assets/brief-template.md) with the
user: product/offer, audience, goal + CTA, given facts, brand colors/fonts,
asset paths. Ask for what is missing; do not fill a field by inference.

Use Path B whenever `--brief` is given, and whenever there is no project to
read.

## `facts.md` format

One fact per line, each with where it came from. Nothing else belongs here —
this file is evidence, not copy.

```markdown
# Facts

1. Product name is "Streakly" — src/components/Header.tsx:14
2. Tagline "Build the habit, not the streak anxiety" — src/app/page.tsx:31
3. Brand accent #FF5A36 — tailwind.config.ts:22
4. Free tier exists — src/app/pricing/page.tsx:48
5. [CONFIRM: public?] Team plan at $12/seat — src/config/plans.ts:9 (behind
   `FLAG_TEAMS`, not on the pricing page)
6. [CONFIRM: …] "readers write in every week" — user said so in chat, no
   source in the project
```

**Citation convention — `facts.md:<n>` means numbered item `n` of this
list, never the file's line `n`.** The items are numbered, so the citation
survives a heading, a blank line, or a fact that wraps onto two lines; a raw
line offset does not. `facts.md:5` above is the team-plan fact whatever line
it sits on. Number the items contiguously from 1 and never renumber them
once Step 2 has cited them. Step 2 cites these numbers, and the claims table
in `caption.md` points back at them.

## Non-public facts

Mark with `[CONFIRM: public?]` any fact that looks unreleased or internal —
unshipped features, anything behind a feature flag or in a TODO, unannounced
pricing, internal metrics, customer names. **A marked fact cannot appear on
screen or in the caption until the user confirms it is public.** Ask; do not
decide on their behalf that it is probably fine.

## Assets

Every asset path in the brief or the project is checked against disk before
planning starts.

- A path resolves **only if that exact path exists**. `photos/patio.jpg` is
  not satisfied by `photos/patio.jpeg`, by `photos/patio.jpg.txt`, or by a
  file with a similar name in the same folder.
- An unresolved path is a **stop**: name the missing file, say what it was
  for, and ask the user. Planning resumes only after they supply the asset
  or explicitly approve proceeding without it — never on your own
  assessment that the piece works fine without it. It is not permission to
  redesign around the assets that happen to exist, and it is never
  something to discover halfway through a render.
- Record the resolved path in `facts.md` so Step 3 composes against the file
  you actually checked.

## Gate

`facts.md` exists · every asset path resolves to an existing file · every
non-public-looking fact is marked · nothing in the file is unsourced.
