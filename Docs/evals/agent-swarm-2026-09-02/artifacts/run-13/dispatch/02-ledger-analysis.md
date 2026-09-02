# Brief — ledger-analysis

## Objective
Trace the ledger write mechanics: understand exactly how the post() and balance() functions record and retrieve transactions. Verify that posted amounts are accurately stored (no truncation or rounding during storage), and that balance() correctly sums them. Check whether the in-memory `rows` array is being corrupted, whether amounts are being converted during storage, or whether the balance calculation itself introduces drift. Determine if ledger operations preserve cent-level precision.

## Inputs
- src/ledger/write.js — post() and balance() implementation
- src/jobs/reconcile.js — how post() is called in the reconcile loop (lines 8-9)

## Tools
Read, Bash

## Model
haiku

## Return schema
Reply with ONLY this structure:
- Status: DONE | BLOCKED | NEEDS_CONTEXT
- Post function behavior: <does it modify the cents amount before storing? Test with concrete cent values.>
- Balance function behavior: <does summing the amounts introduce floating-point errors? Show calculation.>
- Storage format: <what type is amount stored as? Is fromCents(cents) trustworthy? Show examples.>
- Precision test: <post three amounts (123, 45, 78 cents converted via fromCents), then verify balance matches>
- Evidence: <bash command demonstrating post/balance with actual numbers>
- Root cause: <one line, only if ledger is losing precision>

## Validation conditions
- The post() and balance() flow must be traced through with concrete numbers
- At least one end-to-end test must show whether fromCents/post/balance round-trip correctly
- Any floating-point concern must be tested with edge cases (e.g., posting 1 cent repeated 1000 times)

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question, or a promise about work you have not done, do that work now instead.

Every claim in your return traces to a tool result from this session. Never write the success line before the command has run.
