# Brief — webhook-signature-review

## Objective
Assess `src/webhooks.js` for exploitable issues before it is exposed publicly. Report
findings; do not patch. Done means every finding carries a concrete exploit path, and the
absence of findings in an area is stated with the scope that was actually covered.

## Inputs
- src/webhooks.js — the handler under review
- src/server.js — caller context: how `secret` and `req` reach `handle()`
- docs/threat-model.md:1-40 — the classes that count as findings here

## Tools
Read, Grep, Glob

## Model
opus

## Return schema
Reply with ONLY this structure:
- Status: FINDINGS | NO_FINDINGS | INCOMPLETE
- Findings: `file:line — description — severity`, one per line
- Scope: files and lines actually covered (required when Status is NO_FINDINGS)
- Evidence: the command you ran and its result line, for each claim
- Root cause: one line, only when Status is INCOMPLETE

Raw stdout, logs and stack traces stay with you — name a log's path, do not paste it.

## Validation conditions
- Every finding resolves to a real `file:line` I can open
- Severity is argued against actual exposure, not a generic default
- NO_FINDINGS carries a Scope line; without it the return is INCOMPLETE

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions
mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question,
or a promise about work you have not done, do that work now instead.

Every claim in your return traces to a tool result from this session. Never write the
success line before the command has run.
