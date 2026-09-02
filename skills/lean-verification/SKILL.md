---
name: lean-verification
description: Use before claiming anything is complete, fixed, or passing — before committing, creating a PR, marking a task done, or answering "is it done/fixed?". No completion claim without fresh verification evidence in the same message; never draft the success message (or its numbers) before the command has run; a subagent's success report is a claim to verify against the diff, not a fact to relay; a changed UI screen, HTTP endpoint or CLI surface needs one live-driven observation plus a final-state check, not just a green suite. Lean variant of the verification-before-completion discipline.
---

# Lean Verification

## Overview

**Evidence before claims, always.** A claim you haven't verified in this
message is a guess wearing a status report's clothes.

## The Iron Law

```
NO COMPLETION CLAIM WITHOUT FRESH VERIFICATION EVIDENCE
```

Fresh = the proving command ran AFTER the last change to the thing being
claimed, and you read its output. A green run from 40 minutes ago does not
cover the "cosmetic" edits made since.

## The Gate

Before any success/completion statement (or any satisfaction — "Perfect!",
"Done!"):

1. **Identify** the command that proves the claim.
2. **Run** it, fully and fresh.
3. **Read** the output — exit code, counts, warnings.
4. **Claim with the evidence** ("212/212 passing, typecheck clean —
   committed as `abc1234`") — or state the actual failing status.

**Never author the conclusion first.** Writing the success message — or its
numbers — before the run makes the verification theater around a decision
already taken. The message comes FROM the output, not before it.

## Live Surfaces

A change to something a person or a caller touches — a UI screen, an HTTP
endpoint, a CLI command — is not proven by a green suite, however deep the
coverage. Tests exercise your code against the doubles you wrote; they do not
exercise route registration in the real build, auth and middleware on the real
request path, real credentials and config, whether the migration is actually
applied, or whether the control renders where a user can reach it. Two extra
steps before the claim:

1. **Drive it live** — start the app (soltero-skills' `run` skill, or the
   project's own launch procedure) and click the control; issue a real request
   against the running service; run the actual command in a shell.
2. **Check the final state it was supposed to change** — the DB row, the
   written file, the response body, the emitted message — read back, not
   inferred from a 200.

Report both in the claim. If you genuinely cannot run it live, say so and name
what is untested; never upgrade "tests pass" into "it works".

## Claims Table

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Fresh run: 0 failures | Earlier run, "should pass" |
| Build/lint clean | Fresh command: exit 0 | The other one passing |
| Bug fixed | Reproducing case now passes | "Rewrote the function" |
| Subagent done | You read the diff + ran/read the evidence | Its DONE report — or asking it to re-confirm itself |
| Requirements met | Item-by-item check vs the brief/plan | Tests green |
| UI screen / endpoint / CLI works | One live-driven observation (the `run` skill, a real request, the rendered screen) + a final-state check (DB row, file, response body) | A green suite — integration and component tests still run against doubles: MSW, a transport spy, a test DB, a mounted component |

In lean-sdd: the implementer's report carries its test evidence — reviewers
verify claims against the diff; the controller marks a task complete only on
a reviewer verdict, never on the implementer's say-so.

## Red Flags — STOP

- "Should", "probably", "seems to", or satisfaction before the run
- A drafted completion message containing numbers no command has produced yet
- Relaying an agent's "success" without opening the diff
- Stale evidence after further edits ("they were only cosmetic")
- "It works" / "it's live" / "safe to demo" about a screen, endpoint, or
  command that nobody has driven since the change
- Deep test coverage offered as the live observation — a mounted component and
  a test database are still doubles, and neither one boots the real app
- Tired and wanting the work to be over — exhaustion is when this rule earns
  its keep

| Excuse | Reality |
|--------|---------|
| "Should work now" | Run it. |
| "The edits were cosmetic" | Renames and moved imports are the classic silent breakers. Fresh run. |
| "The agent said success" | Verify independently; asking it to double-check adds zero evidence. |
| "I'll run it right after I tell them" | Then tell them after. The claim waits for the evidence, not the reverse. |
| "Re-running an already-fresh green suite adds nothing" | Correct — and irrelevant. The live path has never run once; that isn't a re-run you're skipping, it's a run you haven't done. |
| "These aren't mocks, they're integration tests against a real test DB" | Still doubles. What breaks in production is route registration in the real build, real auth/config, and the migration you never applied — none of which a test harness exercises. |
| "No time to boot the app before the demo" | Booting it is the cheapest thing you'll do today, measured against it failing on the client's click. |
| "The diff review covered it" | Reading code is not running it. The diff shows intent; the live run shows behavior. |

---

*Derived from superpowers:verification-before-completion (MIT, © 2025 Jesse
Vincent), condensed; adds the pre-scripted-success-message counter observed
in cheap-tier baselines, the live-observation requirement for UI/endpoint/CLI
surfaces, and the lean-sdd evidence chain.*
