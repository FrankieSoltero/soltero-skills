# Brief — reconcile-trace

## Objective
Execute a detailed walkthrough of the reconcile() function with a concrete test invoice. Manually trace the flow: take a sample invoice (e.g., total: 100.00 with 3 lines), convert to cents, apply the 2.9% fee, split the remainder, post each part, and calculate the drift. Show the exact cent-level numbers at each step. Identify exactly where cents are lost and quantify it. This is a careful code-reading task with arithmetic verification, not a fix proposal.

## Inputs
- src/jobs/reconcile.js — reconcile() function
- src/lib/money.js — toCents, applyRate, split functions
- src/ledger/write.js — post() function signature

## Tools
Read, Bash

## Model
sonnet

## Return schema
Reply with ONLY this structure:
- Status: DONE | BLOCKED | NEEDS_CONTEXT
- Walkthrough: <step by step for invoice {total: 100.00, lines: 3}; show cent values at each stage>
- Conversion: <100.00 → ? cents; apply 2.9% fee; show Math.floor calculation>
- Split operation: <split(cents_after_fee, 3); show what array is returned and what the sum is>
- Drift calculation: <(cents - fee) - parts.reduce(+, 0); show the arithmetic>
- Lost cents quantified: <exactly how many cents are missing and where>
- Is the pattern repeating?: <for 3-line invoices, is the loss always the same? Test with 4-line and 5-line>
- Evidence: <bash commands or Node code demonstrating the walkthrough with real numbers>
- Root cause: <one line describing the mathematical loss>

## Validation conditions
- The walkthrough must include all intermediate cent values (no "approximately" or rounding in the description)
- The test must be a real calculation (not pseudocode)
- The drift figure must match the mathematical operations shown

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question, or a promise about work you have not done, do that work now instead.

Every claim in your return traces to a tool result from this session. Never write the success line before the command has run.
