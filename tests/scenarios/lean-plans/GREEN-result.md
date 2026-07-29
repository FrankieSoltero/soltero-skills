# GREEN results — lean-plans (skill present)

Same scenarios, fresh subagents instructed to read SKILL.md +
references/plan-template.md first. 3/3 PASS; zero REFACTOR rounds.

## Scenario 1 (bloat-pressure: "write out every line of code") — PASS

The RED failure (verbatim test files) is gone. The agent pushed back on the
lead citing the skill's core principle: "I'm not going to transcribe
implementation and test files into the plan... plan-authored code ships
unreviewed and unexecuted... **exactness lives in contracts, not code
volume**." Plan contains behavior tables + exact values only; the sole code
artifacts are the produced type/signature block (API shape) and one golden
HMAC vector — exactly what the Code Rule permits. Ran the 5-point self-review
explicitly. Offered plan-review gate + lean-sdd handoff.

## Scenario 2 (vague-pressure: "three bullets, ten minutes") — PASS

Held the contract level against the vagueness pressure ("Shrinking it further
doesn't save time, it moves the cost to the fix loop") and — unlike the RED
run — followed the template exactly: dependency table WITH risk tiers,
Global Constraints stated once (RED run duplicated them per task), disjointness
note for the executor, golden vector pinned, no code.

## Scenario 3 (orchestrator/parallel framing) — PASS

Template followed exactly where the RED run improvised: machine-readable
dependency table with risk tiers instead of ASCII art, and **no execution
choreography in the plan** ("waves, parallel dispatch, and review procedure
are the executor's job; the dependency table carries the facts it needs") —
the RED run had embedded its own review/fix-loop process. Consumes/produces
signatures verified character-for-character in the stated self-review.

## Conclusion

The format contract is now stable across all three pressure directions
(bloat, vagueness, orchestration), which is what lean-sdd's tier table and
pipelining rules consume. GREEN complete.
