---
name: mini-game-craft
description: Use when building, fixing, or polishing browser mini-games — platformers, falling-block puzzles, arcade games — especially the multiplayer_ai project's embedded games: "the game feels random/buggy", jump/collision/rotation complaints, frame-rate-dependent behavior, blocks vanishing, pieces jumping, flaky game tests, or adding art/themes/renderers ("make it look good", "art generator"). Carries the failure-class catalog with fix patterns and the seeded-art-layer rules; enforces: name the failure class before patching, every fix ships with a test that fails on the old code, game tests vary dt, and all visual randomness derives from the session seed with engines kept pure. Sibling of multiplayer-game-dev (netcode).
---

# Mini-Game Craft

## Overview

Mini-game bugs cluster into a small set of classes, and "fixed" means the
CLASS is closed — not the reported instance patched. Read
[references/mechanics.md](references/mechanics.md) before touching game
logic and [references/art.md](references/art.md) before touching visuals;
both are grounded in a line-level audit of the project's real doodle/tetris
engines.

## The Contract

1. **Name the failure class first.** "Feels random" is almost always
   frame-rate-dependent physics; "lands wrong / passes through" is swept-
   collision order or endpoint sampling; "pieces jump on rotate" is
   bounding-box re-normalization; "blocks vanish" is missing lockout rules
   or an accumulator race. Diagnose per lean-debugging (trace, don't guess),
   state the class, then apply its fix pattern from the reference.
2. **A fix ships with a test that FAILS on the old code** — run it against
   the pre-fix module and say so (lean-tdd's verify-RED, applied to
   regressions). "The suite is green" on a suite that can't see the bug is
   how these games got here.
3. **Game tests vary dt.** Any physics/gravity behavior is asserted at
   multiple frame cadences ({1/144, 1/60, 1/30, the clamp}) plus the
   adversarial fixtures in the reference (multi-surface crossing, edge
   grazes, wall rotations, above-ceiling locks, post-lock accumulator).
   A suite pinned to one dt is structurally blind.
4. **Engines stay pure; art is a layer.** init/tick/input/render remain
   pure functions; the render string/state contract is preserved (width-safe
   substitutions only); ALL visual randomness derives from the session seed
   via a seeded PRNG (never Math.random in a render/theme path) so the same
   session looks identical for every viewer and across refresh. Theme
   derived once per session; no hot-loop allocation. Proof obligation: the
   engine test suite passes UNCHANGED after an art change.
5. **State-shape changes flag migration.** Adding fields (rng, theme seeds)
   to persisted/synced state → note the hydration path for old snapshots.

| Excuse | Reality |
|--------|---------|
| "Widen the gap / clamp the value and it stops happening" | The class is still open; the next tuning change reopens it. Name it, fix the class. |
| "The tests are green" | Green at one dt with one platform is blindness, not health. Vary dt, add the adversarial fixtures. |
| "A splash of Math.random in render is harmless" | Different viewers/refreshes diverge and flicker. Seed everything visual. |
| "Quicker to theme inside the engine" | Entangling render state breaks purity and every test downstream. Layer over the state. |

---

*Failure catalog grounded in the 2026-07-29 audit of multiplayer_ai's real
engines; art-layer patterns validated against the same render contract.*
