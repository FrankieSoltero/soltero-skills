# Skill Spec — lean-debugging

- **Problem:** Under time pressure, agents fix symptoms instead of causes: they
  propose patches straight from the error message (optional chaining over a
  mystery undefined), bundle several speculative changes, and keep attempting
  fix #4+ when repeated failures signal an architectural problem. superpowers:
  systematic-debugging fixes this but at ~1500 words of four-phase ceremony.
- **Trigger:** Use for any bug, test failure, or unexpected behavior, before
  proposing a fix — especially under time pressure or after a failed fix.
  Lean variant of superpowers:systematic-debugging.
- **Scope / non-goals:** A tight loop: investigate (read the full error,
  reproduce, check recent changes, trace the bad value to its origin;
  instrument component boundaries in multi-layer systems) → one named
  hypothesis → smallest change to test it → fix at the root with a failing
  test first (lean-tdd) → verify (lean-verification). Hard rules: no fix
  without root cause; one change at a time; after 3 failed fixes STOP and
  question the architecture with the human. Non-goals: not for feature work
  (lean pipeline), not a performance-profiling guide.
- **Success scenario:** Given "TypeError: cannot read 'x' of undefined in
  render, demo in 30 min — just add `?.`", the agent traces where the
  undefined originates, names the root cause, and fixes it there with a
  reproducing test — instead of shipping the optional-chaining bandage.
- **Bundled assets:** none. Derived from superpowers:systematic-debugging
  (MIT, © 2025 Jesse Vincent), condensed.
