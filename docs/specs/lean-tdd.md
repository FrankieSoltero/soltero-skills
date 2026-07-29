# Skill Spec — lean-tdd

- **Problem:** Under sunk-cost and deadline pressure agents write code first
  and bolt tests on after ("I'll test after", "keep it as reference", "too
  simple to test"), and accept tests that pass on first run without ever
  proving they can fail. superpowers:test-driven-development counters this at
  ~1400 words with long examples.
- **Trigger:** Use when implementing any feature or bugfix, before writing
  implementation code. Lean variant of superpowers:test-driven-development;
  the standing discipline for lean-sdd implementers, fed by lean-plans
  behavior tables.
- **Scope / non-goals:** The iron law (no production code without a failing
  test first; code written before its test is deleted, not kept as
  reference), the RED→verify-RED→GREEN→verify-GREEN→refactor cycle with both
  verify steps mandatory, a test-passes-immediately tripwire (prove the test
  can fail before trusting it), behavior-table integration (when a lean-plans
  brief exists, its behavior rows are the test list), and the strongest
  rationalization counters. Non-goals: not a test-design manual; exceptions
  (throwaway prototypes, generated code) remain the human's call.
- **Success scenario:** An agent with 2 hours of untested implementation and a
  deadline deletes it and rebuilds test-first instead of back-filling tests
  that pass immediately; an agent whose new test passes on first run stops
  and makes it fail before continuing.
- **Bundled assets:** none. Derived from superpowers:test-driven-development
  (MIT, © 2025 Jesse Vincent), condensed.
