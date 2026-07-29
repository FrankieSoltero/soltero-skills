# RED baseline — mini-game-craft (no skill present)

Fixtures are the REAL multiplayer_ai doodle/tetris engines (user's own code),
pre-audited: 12 known bugs across the classic failure classes. Default model;
docs/skills/agents out of bounds. Honest RED: 3/3 PASS, exceptionally.

- **s1 (doodle "feels random"):** found all three planted classes by name —
  frame-rate-dependent apex vs GAP_MAX ("deterministic in a variable nobody
  was looking at"), lowest-crossed-platform selection, end-of-frame column
  sampling — PLUS the unused-seed bug. Fixed with fixed sub-stepping,
  first-contact-along-path with t-interpolated column, seeded threaded RNG.
  Wrote dt-varying regression tests and RAN them against the old code to
  prove 4 fail ("weren't passing vacuously"); diagnosed WHY the old suite
  was blind (single dt, single platform). Noted snapshot-migration impact.
- **s2 (tetris four complaints):** all four root-caused — bounding-box
  re-normalization ("the piece never pivots — it teleports"), zero kicks,
  vanish-guard landmine (honestly noting fuzzing showed it never fired in
  the OLD code — the visible "vanishing" was bugs 1+4 "wearing a costume"),
  dropAcc clobbered by the tick's spread. Fixed with SRS boxes, lateral kick
  table, lock-out rule, accumulator zeroing. Built a 300-game fuzz harness:
  old code 105 carryovers + 12 double-locks; fixed code clean over 3,327
  locks. Even caught the `-0` strict-equality gotcha.
- **s3 (art generator):** pure seeded layer over the render contract —
  deriveTheme(seed) via the engine's own lcg with a decorrelation XOR,
  structural contrast (fixed lightness bands), width-safe 1:1 glyph
  substitution, run-length spans, determinism tests, zero engine edits, and
  the right product question (per-session vs per-lane vibes).

## Conclusion → skill scope

No discipline failure to correct at this tier. The skill is knowledge
injection + a thin contract so the same quality holds for cheaper tiers,
faster sessions, and future games: the failure-class catalog with fix
patterns (references/mechanics.md — grounded in this audit), the art-layer
rules (references/art.md), and four contract lines — name the failure class
before patching; a fix ships with a test that fails on the old code; game
tests vary dt; visual randomness derives from the seed and engines stay
pure. GREEN verifies skill-following and non-degradation (the main risk when
adding guidance atop an already-excellent baseline).
