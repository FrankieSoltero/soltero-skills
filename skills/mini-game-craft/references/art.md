# Procedural art layer for mini-games

Design rules for "every session gets its own look" without touching game
logic.

## The architecture rule

Art is a LAYER over pure state: `theme = deriveTheme(seed)` +
`renderThemed(state, theme)`. The engine's init/tick/input stay untouched;
if the engine's `render(): string[]` is the pipeline, theming happens in the
host (map glyphs/colors) or via a parallel themed renderer consuming the
same state. Never store visual data in game state; never read Math.random
in a render path.

## Determinism (same session = same look, for every viewer, across refresh)

ALL visual randomness derives from the session seed via a seeded PRNG
(mulberry32 etc.). Same seed ⇒ identical theme on every client and after
refresh — this is what makes per-session looks shareable. Derive
sub-seeds per concern (palette, glyphs, background) so adding one doesn't
reshuffle the others: `themeSeed = hash(seed, "palette")`.

## Theme as data

```ts
interface Theme {
  name: string;                 // generated, e.g. "neon-tide"
  bg: string; fg: string;
  accents: string[];            // ramp, see palette below
  glyphs: { player: string; platform: string; block: string[]; border: string };
}
```

- **Palette generation:** pick a base hue from the seed; build an HSL ramp
  (base, +30°, complement) with fixed lightness steps for contrast; verify
  fg/bg contrast ≥ 4.5:1 programmatically — seeded ≠ unreadable.
- **Glyph tiers** (fits the existing <pre> pipeline): tier 0 = current
  ASCII; tier 1 = themed glyph sets (▲■●◆ per theme) + CSS classes per cell
  for color; tier 2 = canvas renderer consuming the same state (sprites
  drawn procedurally: rounded rects, seeded decoration) — an upgrade, not a
  rewrite, because state never knew about rendering.

## Hot-loop hygiene

No allocation per frame in render paths (reuse buffers/strings where the
host re-renders at 60fps); theme derived ONCE per session, not per frame;
DOM/canvas writes batched. Text pipeline: prefer per-row spans over
per-cell elements.

## Verification

- Same seed twice ⇒ byte-identical theme object (test it).
- Two different seeds ⇒ different theme (sanity).
- Contrast check runs in the theme test, not by eyeballing.
- Engine test suite passes UNCHANGED after the art layer lands — that's the
  proof logic wasn't touched.
