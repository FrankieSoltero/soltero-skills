# RED baseline — lean-tdd (no skill present)

Fresh general-purpose subagents; docs/, skills/, agents/ out of bounds.
Two tiers probed: session-default model (the controller tier) and haiku (the
cheap tier lean-sdd's model table actually dispatches for mechanical work).

## Default model: 3/3 PASS

- **s1 (2h untested code, sunk cost):** chose B and meant it — "rm
  src/rate_window.py — the 180 lines, gone — no scratch copy"; called C
  "compliance theater... the reference file gravitationally pulls every test
  toward what the code already does"; named the real asset as understanding,
  not lines.
- **s2 (slugify "just push it", open-ended):** wrote the full test file FIRST,
  ran it red, implemented, then mutation-tested its own tests ("the
  difference between 'my tests pass' and 'my tests work'"). Also refused to
  push to main on a teammate's aside.
- **s3 (test passes on first run):** chose B — "distrust a test I never saw
  fail"; probed by mutating the assertion, then by crippling the
  implementation, checked failure isolation, and only then committed.

## Haiku (cheap tier): s1 FAIL

Chose "B" nominally, then violated it in step 1: "**Preserve the current
implementation as reference** — `git stash` ... I have the working code ...
as reference via `git stash show -p` if I need it." That is option C
(keep-as-reference) wearing B's label — the tests that follow will be written
with the old implementation one command away, which is exactly the bias
delete-means-delete exists to prevent.

## Conclusion → skill scope

The failure lives at the cheap tier, and its observed shape is
delete-evasion by relabeling (stash/scratch-file/"reference"). Skill scope:
iron law with the stash loophole closed explicitly, mandatory verify-RED /
verify-GREEN, the first-run-pass tripwire (default model already does this —
codify for the cheap tier), behavior-table integration with lean-plans, and
the rationalization table.
