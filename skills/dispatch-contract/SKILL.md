---
name: dispatch-contract
description: Use when writing or re-writing any subagent dispatch outside a lean-sdd task loop — an ad-hoc research agent, a reviewer, a security-review fan-out, an audit worker, a one-off implementer — before relaying a worker's report upward, and above all when a return like "all 19 tasks complete" or "completed-clean" turns out to be wrong and the work has to be re-dispatched or the fan-out re-run. Replaces the free-text prompt with a typed brief (objective, inputs as file paths rather than pasted content, tool allowlist, a pinned model tier, a return schema with validation conditions, the autonomy and claim-audit lines), checked by a bundled validator; holds the parent-side gate that a relayed claim is verified against the diff, the test output, or the tool result before it is spoken; and requires a re-dispatch to change the contract rather than re-run the same prompt.
---

# Dispatch Contract

## Overview

A dispatch has two channels and both are usually untyped. Going out, a paragraph of prose
with pasted file contents, no tool scope, and no model — so the worker inherits the
orchestrator tier. Coming back, more prose — so "all 19 tasks complete" and "completed-clean"
arrive with nothing a parent could check, and get spoken as fact. This skill types both ends.

**The decision has to live in the artifact.** A model tier you reasoned about in your head, an
autonomy rule you intended, a check you promised to do next time — none of it is in the file
the worker reads or the record the parent audits, so none of it survives. Write it into the
brief; let the validator say whether it is there.

## When to Use

- Any `Agent`/subagent dispatch outside a lean-sdd task loop: research, review, security
  fan-out, audit worker, summarizer, one-off implementer. A fan-out is what makes the contract
  pay — twenty auditable rows instead of twenty identical adjectives.
- Before relaying any worker's status, count, or "clean / complete / passing" claim to a
  human or into a report — and when that claim fails and the work goes back out again.

## When NOT to Use

- **Inside lean-sdd's task loop.** It already has this contract:
  `skills/lean-sdd/references/implementer-prompt.md` and `scripts/task-brief`. Use those
  verbatim there; do not write a second brief format alongside them.
- Ordinary tool calls you make yourself. There is no worker, so there is no channel to type.

This skill also does not decide *whether* to delegate, does not grade the worker's output
quality (that is a reviewer's job), and does not replace `evidence-gate` (hash-bound
receipts).

**With `lean-verification`:** that skill owns the claim and is the right reach when you are
about to speak. This one owns the channel, so the half it leaves open is yours — a failed
verification means the work goes back out, and a re-dispatch is a dispatch. Catching the bad
claim and then re-sending the same free-text prompt is half the loop closed.

## The brief

Six required fields. Write them to a file — `.soltero/dispatch/<slug>-brief.md` or anywhere
in the run's workspace — and dispatch a prompt that points at the path:

| Field | Rule |
|-------|------|
| Objective | One paragraph of outcome and constraints. What "done" means, not how to do it. |
| Inputs | Repo-relative **paths** (`src/webhooks.js`, `docs/policy.md:12-40`). Never pasted file contents: a paste is stale the moment a concurrent writer touches the file, and it costs the parent's context to send what the worker can read for less. |
| Tools | The allowlist this subtask needs, and nothing more. A reviewer gets no `Edit`; a summarizer gets no `Bash`. |
| Model | Exactly one tier, from the table below. Never omitted, never `fable`. |
| Return schema | The exact structure the worker replies with, including a **status** from a stated vocabulary. |
| Validation conditions | What the parent will check the return against, named in advance. |

Plus two standing lines, verbatim, in every brief:

> You are operating autonomously: nobody is watching and no one can answer questions
> mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question,
> or a promise about work you have not done, do that work now instead.

> Every claim in your return traces to a tool result from this session. Never write the
> success line before the command has run.

Then check it before you dispatch:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/validate-brief.mjs <brief.md> [more...]
```

Exit 0 = dispatchable. Exit 1 = it prints what is missing. One brief per file — for a fan-out,
generate the N briefs and validate them all in one call rather than nesting a template inside
one document, which cannot be checked. The validator settles presence and shape only; whether
the objective is the *right* objective stays yours.

## Model tiers

An omitted model silently inherits the session's orchestrator tier — the most expensive one,
reserved for orchestration. Take the tier from the standard rather than re-deriving it per
job; per-job reasoning gives a defensible-sounding answer that differs every time.

| Tier | Work class |
|------|-----------|
| `opus` | Engineering — code-writing, judgment reviews (security, design), synthesis |
| `sonnet` | Grunt — research sweeps, skeptic/verification passes, triage, artifact writing |
| `haiku` | Reading and summarizing — file scans, extraction, deep reads |
| `fable` | Orchestration only. Never assigned to dispatched work. |

## The return

The worker replies with **only the structure** — status, artifact refs as paths, a short
summary, the evidence the validation conditions asked for, and on failure a one-line root
cause. Raw stdout, scanner logs, stack traces and failed-attempt narration stop at the worker
boundary; the return names where a log lives instead of carrying it.

Default status vocabulary: `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `NEEDS_CONTEXT`. For
review/scan workers: `FINDINGS`, `NO_FINDINGS`, `INCOMPLETE` — and `NO_FINDINGS` is only
valid with the scope evidence that proves the scan ran, because otherwise "clean" and "never
ran" are the same string.

That boundary binds the parent too, with one deliberate exception: quote the single line that
*is* the evidence — the error contradicting the status, the assertion that failed — and name
where the rest lives. Forwarding the dump is what the rule forbids; a boundary you enforce
downward and break upward is not a boundary.

## The parent-side gate

A return is a claim. Verify it against a tool result **before you speak it** — the
verification is a step with an output, not an intention to be careful next time.

| The worker says | What you run before repeating it |
|-----------------|----------------------------------|
| "tests pass", "212/212" | The suite. Compare the count you observe to the count claimed. |
| "implemented X", "all N tasks complete" | `git diff --stat` plus the diff for the named paths; confirm each claimed file exists. |
| "completed-clean", "no findings" | The return's own files-opened and commands-run evidence. Missing → `INCOMPLETE`, not clean. |
| "wrote / created <path>" | Read the path. |
| `BLOCKED` / `NEEDS_CONTEXT` | Nothing — take a stop at face value and act on it. |

Report the observed-vs-claimed pair when they disagree, and when the disagreement means
re-dispatching, re-dispatch under a brief that names the validation condition which would
have caught it. Asking the worker to double-check itself adds no evidence.

The verdict binds the **headline**, not just the body. The top line is the claim people act
on; a caveat three paragraphs down does not retract it. There is no provisional verdict
either — unverified is not a milder shade of clean, it is the other answer.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "Writing a brief costs more than this subtask is worth." | A baseline run wrote four typed briefs in minutes under a 20-minute clock and still beat the demo. Parsing four shapeless reports at 4:58 costs more than writing four briefs at 4:41. |
| "I decided the models when I planned the fan-out." | Baseline stated a pinned tier for four workers in its reply; two of the four brief files had no model at all. If it is not in the file, it does not exist. |
| "This one's mechanical, sonnet is plenty." | Tiers come from the standard, not from a fresh judgment call per job. Code-writing is `opus`. |
| "Pasting the file saves the worker a turn." | It sends stale content, at your token cost, that the worker cannot cite by line. Send the path. |
| "The lead said don't re-litigate every run." | That covers diligence already done. Nobody had read this diff. |
| "Twenty agents all said clean." | Twenty unverifiable assertions in the same format are one assertion. One of them labelled a crashed scan `completed-clean`. |
| "I'll attribute it — 'the swarm reports 212/212'." | An unverified number in front of a human gets acted on. Attribution moves the blame, not the risk. |
| "I'll verify right after I open the PR." | Then open it after. The claim waits for the evidence. |
| "I'll be careful about this next time." | A resolution is not a mechanism. The mechanism is the brief's validation conditions and the gate above. |
| "The crash log is my evidence, so it goes in the summary." | The one contradicting line is the evidence; the other 890 are not. Quote the line, cite the log's path. |
| "Unverifiable, but nothing contradicts it — accept provisionally." | There is no provisional verdict. "No contradicting evidence" is also what a scan that never ran looks like; that is the whole failure. Missing evidence is `INCOMPLETE`. |
| "The caveat is in the summary, just not the headline." | The headline is what gets read and acted on. A verdict the body contradicts is a false claim with a footnote. |

## Red Flags — STOP

- A dispatch prompt containing file *contents*, or a brief with a fenced block under Inputs.
- A dispatch with no `model` — or with `fable`.
- A return schema with no status field, so a worker that cannot finish has no way to say so.
- You are about to type a completion claim whose number came from a worker's message rather
  than from output you read.
- Your summary to the human carries the worker's log body rather than the one line from it
  that changes the verdict.
- A headline that says "clean" or "done" about returns your own body admits carry no evidence.
- Re-dispatching after a bad return without changing the contract that let it through.
- Ending your turn with "want me to re-dispatch, or …?" on a call the brief already answers.

## Portability

The validator is dependency-free Node and runs anywhere. Outside Claude Code there is no
`Agent` tool and no named subagent types — do the work inline, with the brief as the checklist
for your own pass. Everywhere: a prose tool allowlist is scoping, not containment (prompt-only
restrictions are violated a large fraction of the time under adversarial framing), so rely on
it only where the harness enforces it.

See [references/brief-template.md](references/brief-template.md) for the fill-in brief, the
return record, and the fan-out variant.
