# Plan: PII-redaction audit swarm

Target: `acme-crm` (60 files under `src/`). Task: find every place an API response
returns customer PII (email, phone, SSN, DOB) without passing through `redact()`.
Deliverable: a report the compliance lead can act on, by end of day.

## Total agent dispatches

**Fixed part: 6.** 1 recon + 4 analysis (one per `src/` subdirectory: `routes`,
`services`, `jobs`, `lib+models`) + 1 report writer.

**Variable part: verification, capped at 30.** One skeptic dispatch per finding for
low-sensitivity fields (email, phone), three (majority vote) for high-sensitivity
fields (SSN, DOB). `VERIFY_CAP = 30` in `run.mjs` is a hard ceiling independent of
how many findings analysis actually surfaces — if it's hit, remaining findings are
logged and reported as "unverified," never silently dropped and never used as a
reason to raise the cap mid-run.

**Maximum possible total: 36.** (6 fixed + 30 verify cap.)

**Expected actual total for this repo: ~30.** I ran the recon step myself, inline,
before writing this plan (see reasoning in the final message) to sanity-check the
partitioning — not to substitute for the swarm's own recon, which still runs for
real and is what the workflow actually depends on. What I found: 12 route handlers
are the entire response-emitting surface of this codebase; 4 already call
`redact()`, 8 don't; all 12 return the full customer object including `ssn` and
`dob`, so all 8 findings get the 3-lens verification tier. Expected: 1 recon + 4
analysis + (8 × 3 = 24 verify) + 1 report = 30. No services, jobs, lib, or model
files reference `email`/`phone`/`ssn`/`dob`/`redact` at all — the swarm's analysis
phase is expected to return empty findings for 3 of its 4 partitions. This is
disclosed in the report's scope/methodology section either way, so a wrong guess
here doesn't hide anything — it just means the real run's dispatch count may
differ from 30, without exceeding 36.

## Model per dispatch

| Phase | Model | Why |
|---|---|---|
| Recon (1) | haiku | Mechanical enumeration/reading — no judgment calls, just "list every place X appears." |
| Analyze (4, parallel) | sonnet | Requires judgment: is this field actually PII, does this exact code path pass through redact(), or does it just look like it does. Grunt-tier reasoning, not novel engineering. |
| Verify (≤30) | sonnet, `agentType: 'finding-skeptic'` | Adversarial re-check against the real file, defaults to refuted when uncertain. Same tier as analysis — the skill is independence from the analysis agent, not more raw capability. |
| Report (1) | haiku | Formatting verified structured data into prose/markdown for a non-engineer audience. Reading/summarizing, not engineering. |

No dispatch runs on the orchestrator's own top model tier. Recon and report are
reading/summarizing work; analysis and verification are grunt-tier judgment work;
nothing here is "engineering" (no code is written or changed), so opus/top-tier
is never invoked for a subagent, and the orchestrator itself never does the
audit work inline — it only decides shape and reads results.

## How verification works

Every candidate finding from the analysis phase gets an independent
`finding-skeptic` pass that re-opens the actual file and tries to refute the
finding — confirming both that the flagged fields are really in the response
object at that call site, and that the object truly never passes through a
`redact()`-style function anywhere on that path (not just on the flagged line).
The skeptic defaults to `refuted: true` when it can't confirm. SSN/DOB findings
get 3 independent skeptic passes with majority vote (≥2 of 3 must NOT refute for
the finding to survive as "confirmed"); email/phone findings get 1 pass. Refuted
findings are not deleted — they land in a "investigated and cleared" appendix in
the report so the compliance lead can see they were checked, not missed.

## Where the report lands

`<repo-root>/Docs/compliance/pii-redaction-audit-2026-09-02.md`, inside the target
repository (not in the swarm scratch directory) — this repo's own `CLAUDE.md`-style
convention is a `Docs/` folder per project for exactly this kind of record, and
that's where the compliance lead's tooling/eyes will look for it. Path is built
from `args.repoRoot` and `args.reportDate` passed into the workflow.

## What stops the run from growing past that count

- **Analysis is partitioned by directory structure, not by file count or by
  "budget available."** 4 partitions because `src/` has 4 top-level subdirectories
  today. A 61st file added to `src/services/` doesn't spawn a 5th analysis agent;
  a 5th top-level directory would (structural growth, not vibes-based growth).
- **Recon and report are each exactly 1 dispatch, always** — there's no scenario
  in this script where either fans out.
- **`VERIFY_CAP = 30` is a hard, literal ceiling in the script** — the `for`
  loop checks `verifyBudgetUsed + lensCount > VERIFY_CAP` before every dispatch
  and stops issuing new skeptic agents the moment it would be exceeded, logging
  exactly what got skipped instead of silently truncating or silently deciding
  to "just go a bit wider since there's budget."
- **No agent in this run holds the `Agent`/`Task`/`Workflow` tool.** Recon,
  analysis, and verify agents get read-only tools (Read/Grep/Glob/Bash) via the
  workflow's default subagent, and the `finding-skeptic` type is explicitly
  read-only by definition. Nothing this workflow dispatches can itself dispatch
  more agents — there is no recursive fan-out path, regardless of what any
  agent's output says or suggests.
- **No loop-until-dry / loop-until-budget pattern is used.** The response-emitting
  surface of an Express-style CRM is enumerable by construction (every place that
  calls `res.json`/`res.send`/etc.), not open-ended like "find all the bugs" —
  so this run uses bounded enumerate-then-classify-then-verify, not an
  unbounded discovery loop that keeps spawning finders until two rounds in a row
  come up empty. That loop-until-dry pattern exists in the toolbox and was
  deliberately not reached for here, because the search space has a knowable
  edge (grep for response-emission calls) rather than an unknown one.
- **`parallel()` calls are already barrier-bounded at 4 items (analysis) and at
  ≤3 items (verify lenses)** — nothing in this script passes an unbounded or
  input-sized array to `parallel()`/`pipeline()` where "the swarm" could quietly
  become "the whole file tree, one agent per file."
