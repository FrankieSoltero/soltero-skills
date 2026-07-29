# Skill Spec — mini-game-craft

- **Problem:** The multiplayer_ai project's embedded mini-games (doodle jump,
  tetris — pure-state `GameEngine` modules rendered as ASCII in a `<pre>`)
  are "extremely buggy" with the CLASSIC mini-game failure classes, verified
  by direct audit: variable-timestep physics making platform reachability
  frame-rate-dependent (doodle.ts:66-67 vs GAP_MAX at :16), wrong-platform
  selection when a fast fall crosses two platforms in one frame (:77-82),
  horizontal tunneling from endpoint-only sampling (:76), pivot-less rotation
  drift (tetris.ts:60-63), no wall kicks (:58-59), blocks silently vanishing
  above the ceiling instead of lockout (:116), gravity-accumulator carryover
  onto fresh pieces (:156 vs :132) — and a test suite that structurally
  cannot see any of it (every test pins dt=0.05, no multi-crossing or
  varied-dt cases). Agents asked to "fix the game" tend to patch the
  reported symptom (widen a gap, clamp a value) without the failure-class
  diagnosis, and agents asked to "make it look good" tend to entangle
  rendering with game state and use unseeded randomness (flicker,
  divergence). The engines take a seed that is currently UNUSED.
- **Trigger:** Use when building, fixing, or polishing browser mini-games —
  platformers, falling-block puzzles, arcade games — in the multiplayer_ai
  project or similar: "the game feels random/buggy", jump/collision/rotation
  complaints, frame-rate-dependent behavior, game-over rules, flaky game
  tests, or adding art/visual themes/renderers ("make it look good", "art
  generator"). Sibling of multiplayer-game-dev (netcode); this skill is the
  single-game mechanics + art layer.
- **Scope / non-goals:** (1) Mechanics reference with the fix patterns per
  failure class: fixed-timestep accumulator (and accumulator hygiene —
  reset on piece lock), swept collision (first surface along the path, both
  axes sampled), pivot-based rotation + minimal wall-kick table, explicit
  top-out/lockout rules, terminal velocity; (2) test discipline — game
  tests MUST vary dt ({1/144, 1/60, 1/30, clamp}) and include
  multi-crossing/adversarial fixtures; a physics fix ships with a test that
  fails on the old code; (3) art layer discipline — rendering reads pure
  state and never mutates it; ALL visual randomness derives from the seed
  (the engines' unused seed param is the hook); themes as data (palette +
  glyph/sprite sets) generated from seed; ANSI/glyph tier first (fits the
  <pre> pipeline), canvas renderer as an optional layer over the SAME state;
  no allocation in the render hot loop; (4) root-cause per lean-debugging —
  name the failure class before patching. Non-goals: netcode (sibling
  skill), engine-based games, AI-image-generation tooling.
- **Success scenario:** "Doodle jump feels random — sometimes you can't
  reach platforms, sometimes you fall through edges; fix it" → the agent
  names the three distinct failure classes (dt-dependent apex vs GAP_MAX,
  crossing-order, horizontal sampling), fixes at the class level (fixed
  timestep or analytic-safe gaps; nearest-surface sweep), and adds tests
  that vary dt and cross two platforms in one frame — instead of nudging
  GAP_MAX down and calling it fixed.
- **Bundled assets:** `references/mechanics.md`, `references/art.md`.
  Fixtures are the project's real doodle.ts/tetris.ts (user's own code).
