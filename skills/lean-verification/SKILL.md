---
name: lean-verification
description: Use before claiming anything is complete, fixed, or passing — before committing, creating a PR, marking a task done, or answering "is it done/fixed?". No completion claim without fresh verification evidence in the same message; never draft the success message (or its numbers) before the command has run; a subagent's success report is a claim to verify against the diff, not a fact to relay. Lean variant of the verification-before-completion discipline.
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

## Claims Table

| Claim | Requires | Not sufficient |
|-------|----------|----------------|
| Tests pass | Fresh run: 0 failures | Earlier run, "should pass" |
| Build/lint clean | Fresh command: exit 0 | The other one passing |
| Bug fixed | Reproducing case now passes | "Rewrote the function" |
| Subagent done | You read the diff + ran/read the evidence | Its DONE report — or asking it to re-confirm itself |
| Requirements met | Item-by-item check vs the brief/plan | Tests green |

In lean-sdd: the implementer's report carries its test evidence — reviewers
verify claims against the diff; the controller marks a task complete only on
a reviewer verdict, never on the implementer's say-so.

## Red Flags — STOP

- "Should", "probably", "seems to", or satisfaction before the run
- A drafted completion message containing numbers no command has produced yet
- Relaying an agent's "success" without opening the diff
- Stale evidence after further edits ("they were only cosmetic")
- Tired and wanting the work to be over — exhaustion is when this rule earns
  its keep

| Excuse | Reality |
|--------|---------|
| "Should work now" | Run it. |
| "The edits were cosmetic" | Renames and moved imports are the classic silent breakers. Fresh run. |
| "The agent said success" | Verify independently; asking it to double-check adds zero evidence. |
| "I'll run it right after I tell them" | Then tell them after. The claim waits for the evidence, not the reverse. |

---

*Derived from superpowers:verification-before-completion (MIT, © 2025 Jesse
Vincent), condensed; adds the pre-scripted-success-message counter observed
in cheap-tier baselines and the lean-sdd evidence chain.*
