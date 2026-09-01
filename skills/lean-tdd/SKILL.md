---
name: lean-tdd
description: Use when implementing any feature or bugfix, before writing implementation code — the failing-test-first discipline: no production code without a test you watched fail, code written before its test gets deleted (stashing or keeping it "as reference" counts as keeping it), and a test that passes on its first run is distrusted until proven able to fail. Lean variant of the test-driven-development discipline; the standing discipline for lean-sdd implementers, fed by lean-plans behavior tables.
---

# Lean TDD

## Overview

Write the test first. Watch it fail. Write minimal code to pass. If you
didn't watch the test fail, you don't know it tests the right thing.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before its test? **Delete it and rebuild test-first.** The two
hours aren't wasted — the output of exploration is understanding (which edge
cases exist, which design worked), and that stays in your head. What may not
stay is the code, in any form:

- `git stash` is keeping it. "As reference via `git stash show -p`" is
  keeping it.
- A scratch file is keeping it. Retyping from a scratch file is
  transcription, not test-driven design — the reference pulls every test
  toward what the code already does.
- Delete means delete: `rm` / `git checkout --` / drop the stash.

Exceptions (throwaway prototypes, generated code, config) are the human's
call — ask, don't self-grant.

## The Cycle

1. **RED** — one minimal test for the next behavior. When a lean-plans brief
   exists, its behavior-table rows ARE the test list: one row → one test,
   exact expected values from the Exact-values block.
2. **Verify RED (mandatory)** — run it. It must FAIL, for the expected reason
   (feature missing — not a typo, not an import error you shrug at). An
   import-error red only proves the file is missing; after GREEN, spot-check
   by mutation (break the code or the assertion, see the test go red,
   restore).
3. **GREEN** — the simplest code that passes. No extra features, no
   "while I'm here."
4. **Verify GREEN (mandatory)** — run it. Test passes, other tests still
   pass, output pristine. Test fails → fix the code, never the test.
5. **Refactor** on green only; then next row.

## The First-Run-Pass Tripwire

A new test that PASSES on its first run has proven nothing — either the
behavior already exists, or the test is broken (wrong import, always-true
matcher, not picked up). STOP: make it fail (assert a wrong value, or
cripple the code path) and check the failure is isolated to what this test
claims to cover. Only a test you've seen red is evidence.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I'll stash it — that's not keeping it" | A stash one command away biases every test toward the old code. Stash-as-reference IS keep-as-reference. Drop it. |
| "Retype it from the scratch file after tests" | Transcription, not TDD. The tests will describe what the code does, not what it should do. |
| "Tests after achieve the same goals" | Tests-after answer "what does this do?" — biased by the code, passing immediately, proving nothing. |
| "Deleting X hours is wasteful" | Sunk cost. The understanding survives; only the untrusted code goes. Rebuild is fast because the thinking is done. |
| "Too simple to test" | Simple code breaks. The test takes 30 seconds. |
| "It passed first try — good news" | Or the test is broken. Prove it can fail before trusting it. |
| "Deadline — just this once" | The deadline changes the schedule, not what correct engineering is. Report honestly; don't ship untested. |

## Red Flags — STOP and start over

- Any implementation code existing before its test, in any location (stash,
  scratch file, clipboard, "reference")
- A test you cannot explain the failure of, or never saw fail
- "I already manually tested it" / "tests added later" / "this is different
  because..."

---

*Derived from superpowers:test-driven-development (MIT, © 2025 Jesse
Vincent), condensed; closes the stash/scratch-file loophole observed in
cheap-tier baselines and integrates lean-plans behavior tables.*
