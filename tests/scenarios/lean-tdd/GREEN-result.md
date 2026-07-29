# GREEN results — lean-tdd (skill present)

Methodology: GREEN targets the observed RED failures — the failing haiku run
re-run with the skill, plus a default-model run for skill-following. (Default
model passed all RED scenarios, so re-running every one with the skill would
verify nothing; see RED-baseline.md.)

## haiku s1 (the RED failure) — PASS

The stash loophole is closed by name: "**Not using `git stash`** — that keeps
it one command away and biases every test toward the old code. The skill is
explicit: stash-as-reference IS keep-as-reference. Delete it cleanly." Then
`git checkout -- / rm`, first failing test, verify-RED for the right reason,
minimal GREEN, cycle. Closed the exact delete-evasion observed in RED.

## default s3 — PASS

Cited the First-Run-Pass Tripwire and the rationalization row verbatim,
mutation-verified the test both ways (wrong assertion, crippled code path),
checked failure isolation, committed with the verification noted.

3/3 relevant checks green; zero REFACTOR rounds.
