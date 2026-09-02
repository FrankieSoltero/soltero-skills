# Brief and return templates

Fill in, save under the run's workspace (`.soltero/dispatch/<slug>-brief.md` is the default
home), run `node ${CLAUDE_SKILL_DIR}/scripts/validate-brief.mjs <path>`, then dispatch a
prompt whose body is essentially "Read your brief first: `<path>`".

The headings below are what the validator looks for (`Objective`, `Inputs`, `Tools`, `Model`,
`Return schema`, `Validation conditions` — any heading level, case-insensitive; `Model:` as an
inline field also counts). Keep the two standing paragraphs verbatim: the checks for them are
phrase-based, and rewording them is how they quietly disappear.

---

## Single dispatch

```markdown
# Brief — <slug>

## Objective
<One paragraph: the outcome and its constraints. What "done" means. Not a method
walkthrough — an outcome/constraint spec beats line-by-line dictation for anything a
cheaper tier will execute.>

## Inputs
- path/to/file.ts — <why it matters>
- docs/policy.md:12-40 — <the relevant span>
- tests/**/*.test.ts — <a glob or a search to run, never pasted contents>

## Tools
Read, Grep, Glob   <!-- exactly what this subtask needs; a reviewer gets no Edit -->

## Model
opus   <!-- exactly one tier from the standard; never blank, never the orchestration tier -->

## Return schema
Reply with ONLY this structure — the detail belongs in the artifact, not the reply:
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Artifacts: <paths you wrote, or file:line refs>
- Summary: <two sentences maximum>
- Evidence: <the command you ran and the result line, for each claim you make>
- Root cause: <one line, only when the status is not DONE>

Raw stdout, logs, stack traces and failed-attempt narration stay here with you. If a log
matters, name its path; do not paste it.

## Validation conditions
- <what the parent will check, named in advance — e.g. "every finding carries a real
  file:line I can open">
- <e.g. "the named test command appears in Evidence with its observed counts">
- <e.g. "no file outside the Inputs list is modified">

## Standing rules
You are operating autonomously: nobody is watching and no one can answer questions
mid-task. Before ending your turn, check your last paragraph — if it is a plan, a question,
or a promise about work you have not done, do that work now instead. If you genuinely cannot
proceed, return BLOCKED or NEEDS_CONTEXT with the specifics; those are the only stops.

Every claim in your return traces to a tool result from this session. Never write the
success line before the command has run.
```

---

## Fan-out variant

One brief, N workers, one binding per worker. Everything above holds; two things change.

**Inputs** carries the per-worker binding as a path, so the twenty briefs differ in exactly
one line:

```markdown
## Inputs
- src/<module>/ — the single module under review; read every file in it
- docs/threat-model.md — the classes that count as findings here
```

**Return schema** replaces the implementer vocabulary with the scan vocabulary, and makes the
scope evidence load-bearing:

```markdown
## Return schema
- Status: FINDINGS | NO_FINDINGS | INCOMPLETE
- Module: <path>
- Files opened: <one path per line — "none" if none, never omitted>
- Commands run: <verbatim command lines, no output>
- Findings: <file:line — description — severity>, one per line, when Status is FINDINGS
- Scope: <files and lines actually covered> — required when Status is NO_FINDINGS
- Stopped by: <one line> — required when Status is INCOMPLETE
```

`NO_FINDINGS` without Scope is `INCOMPLETE`. A crashed, truncated, or timed-out scan is
`INCOMPLETE` — never "clean". Uniform clean returns across a fan-out are a signal to audit
the contract, not a signal about the codebase.

**Write the N briefs, don't embed one template.** The validator reads one brief per file, so a
single fan-out document with the worker prompt nested inside it cannot be checked — and the
per-worker Inputs binding, the one line that must differ, is exactly what a nested template
leaves implicit. A ten-line generator script that writes `briefs/01-<module>.md` …
`briefs/20-<module>.md` from the template is the supported shape: re-runnable when the module
list changes, and `validate-brief.mjs briefs/*.md` checks all twenty in one call.

---

## Return record (parent side)

Keep one row per worker so a fan-out of twenty leaves twenty auditable rows. Written by the
parent, from the returns plus its own checks:

```markdown
| Worker | Brief | Status | Artifacts | Claim | Parent check | Verdict |
|--------|-------|--------|-----------|-------|--------------|---------|
| 07 | briefs/07-orders.md | NO_FINDINGS | — | "no findings, 4 files / 310 lines" | read Files opened; spot-opened 2 | accepted |
| 20 | briefs/20-webhooks.md | INCOMPLETE | logs/20.log | "completed-clean" | Commands run shows early exit | rejected, re-run |
```

The **Parent check** column is the point: it is filled from a command the parent ran or a
file it opened, never from the worker's own restatement. An empty Parent check column means
the claim has not been verified, whatever the Status column says — and a claim that has not
been verified does not get spoken.

## Rejecting a return

A return that is missing a required section is `INCOMPLETE` regardless of what its status
line says. When you re-dispatch, change the contract: add the validation condition that would
have caught the failure. Re-running the same brief and hoping for a better worker is how a
fan-out produces sixty clean nights and no findings.
