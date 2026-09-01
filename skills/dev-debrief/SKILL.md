---
name: dev-debrief
description: Use when the scheduled nightly dev-debrief run fires or when explicitly asked for a daily work debrief ("run the dev debrief", "what did I actually do today across projects") — scans ~/.claude/projects transcripts from the last 24h across ALL projects; on days with no coding signals (no Edit/Write/NotebookEdit, no git commit) it skips silently (one skip-log line, no report, no push), otherwise writes Docs/debriefs/YYYY-MM-DD.md in canonical format: redacted per-project what-you-did summaries, skill telemetry with trigger kind + outcome per invocation, missed-trigger findings with cited session evidence, evidence-backed workflow observations, push headline when available. Sundays append the weekly deep section (evidence-cited A–F grades, N/A for zero-opportunity skills, corrections-ledger-compatible recommendations for skill-patcher, coverage gaps). Read-only everywhere except Docs/debriefs/; recommendations only — it never edits skills, ledgers, or CLAUDE.md.
---

# Dev Debrief

## Overview

What you actually did across all Claude sessions each day — and whether the skill
portfolio matched that work — lives only in transcripts nobody rereads. Dev-debrief is a
nightly read-only pass that turns the last 24 hours into one report: work summaries,
skill telemetry, missed triggers, and (Sundays) a graded portfolio review.

Core principle: **observe everything, change nothing, land the same shape every night.**
The debrief measures; changes ship elsewhere, through gated processes. A report a
cadence can't diff and `skill-patcher` can't parse is a chat log, not telemetry — the
baseline runs got every judgment right and still produced three reports with three
different shapes, three redaction conventions, and a hand-rolled "ledger-ish" format.
The contract in `references/report-format.md` is the product.

## When to Use

- The scheduled nightly run (launchd LaunchAgent — install and rationale in
  `references/scan-protocol.md`; it is deliberately not cron).
- Explicit requests: "run the dev debrief", "what did I do today across projects",
  "how is the skill portfolio tracking my work".

## When NOT to Use

- Mining transcripts for reusable *procedures* — that is `session-miner`; the debrief
  detects *activity*. When both notice the same thing, link the miner proposal.
- Auditing skill *content* for staleness (`skill-gardener`) or actually patching skills
  (`skill-patcher` — the weekly recommendations are its input, never its execution).
- Never inline during other task work; it is a dedicated pass.

## Hard Rules (non-negotiable)

1. **Read-only outside `Docs/debriefs/`.** Transcripts, other projects, and every skill
   are inputs. The ONLY writes, ever, are `Docs/debriefs/*` in this repo — not a skill
   description "quick fix", not a ledger entry, not a CLAUDE.md line.
2. **Redaction is mandatory before anything is written.** Apply session-miner's
   redaction checklist verbatim (`skills/session-miner/references/mining-protocol.md`,
   "Redaction checklist") — same placeholders, no invented formats. Redact the *whole*
   email (`<EMAIL>`, never `someone@<redacted>`), and **never write a map to a secret**:
   no "see `.env.staging` for the live value", no naming the env vars or files that
   hold a credential. Grep-sweep the finished report for token shapes before finalizing.
   A leaked secret in a report is a critical failure.
3. **Recommendations only.** Missed triggers and weekly findings produce report text;
   fixes route to humans via `creating-a-skill` / `skill-patcher`. However obvious the
   one-line fix, the debrief never applies it.
4. **Skip days are silent.** No coding signals anywhere in the window → no report file,
   no push, exactly one line appended to `Docs/debriefs/skip-log.md` (format in
   `references/report-format.md`). A stub report "to keep the streak" is a report.
5. **Grades require cited evidence.** Every letter grade names at least one session;
   zero-relevant-opportunity skills grade **N/A with one line of reasoning**, never F,
   never a made-up middle grade.

## Autonomous run

The production path is a headless `claude -p` LaunchAgent: nobody is watching, nobody can
answer a question mid-run, and there is no menu of options — the Hard Rules above are the
decision. Proceed without asking on everything the debrief covers. Before ending the turn,
check the last paragraph: if it is a plan, a question, or a promise about work not yet done
("I'll write the report next"), do that work now with tool calls instead. End the turn only
when the report — or the skip-log line — is on disk.

Audit every claim in the report against a tool result from this run before writing it: the
session files actually read, the invocations actually found, the evidence actually quoted.
Report what you can point at. A project whose transcripts could not be read is stated as
unread, not silently dropped and never counted as zero — **a blocked scan is not a skip
day**: if the window could not be scanned, say so in the log and write nothing, rather than
recording a skip that claims there was no work.

## How to Run

Scan mechanics (window, JSONL shapes, signal detection, classification tables):
`references/scan-protocol.md`. Output contract (both tiers, exact sections, formats):
`references/report-format.md`.

1. **Establish the window.** `date +%F`; session files = `~/.claude/projects/*/*.jsonl`
   with mtime in the last 24h (test/alternate roots may be supplied by the invoking
   prompt). Sundays additionally load the trailing 7 days for the deep section.
2. **Coding-day gate first.** Any `Edit`/`Write`/`NotebookEdit` tool use OR any git
   commit observed in any scanned session makes it a coding day. Otherwise apply Hard
   Rule 4 and exit — before drafting anything.
3. **Extract per session:** per-project activity summary material; every Skill
   invocation with **trigger kind** and **outcome signal** (classification tables in
   the scan protocol — a telemetry row without both fields is incomplete); candidate
   missed triggers (session activity matching an installed skill's frontmatter
   description with no invocation), each with session file + approximate turn cited.
4. **Write the daily report** to `Docs/debriefs/YYYY-MM-DD.md` with the canonical
   section set — all sections present, "None observed." where empty. Redact per Hard
   Rule 2, then run the grep sweep.
5. **Sunday: append the weekly deep section** — per-skill grades over the trailing 7
   days (rubric in report-format), improvement recommendations in the exact
   corrections-ledger-compatible entry template (Rule-ID-less, full field set — "close
   enough" breaks `skill-patcher`), coverage-gap analysis naming new-skill candidates
   only for *recurring* unmatched work.
6. **Push a one-line headline** only if this context actually exposes a notification tool
   (check the available tools, deferred ones included, before assuming one). Headless
   LaunchAgent runs normally expose none — skip silently then, and never let a missing or
   failed push delay, degrade, or abort the report.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The user worked hard today — a research-day report beats silence." | Coding day is the gate, not effort. The skip-log line is the record; quiet days stay quiet (Hard Rule 4). |
| "A minimal stub keeps the date sequence unbroken." | A stub is a report. The unbroken record lives in skip-log.md, which the report reader can check. |
| "The migration went green, so the un-fired skill is a non-event." | Green proves the checks weren't needed this time, not that they happened. Missed triggers are the core portfolio-vs-work signal — report them with evidence. |
| "A report nobody acts on is worthless — I'll fix the trigger while I'm here." | The debrief measures; it never edits. One rogue nightly edit outranks every report it ever wrote. Recommend, cite, hand off. |
| "The token is already in the transcript on this machine." | The report is a new, committed, shareable artifact. Checklist placeholders, whole-email redaction, grep sweep — every time. |
| "I omitted the value; pointing at where it lives is harmless." | "See `.env.staging` for the live value" turns the report into an index of secrets. Redact the value AND the location. |
| "Zero invocations all week — that's an F." | F scores failure on real opportunities. Zero opportunity = N/A with reasoning; grading an untaken test is vibes. |
| "No data, so a C is the fair middle." | A fabricated grade is worse than a hole. N/A is the honest, complete entry. |
| "My field names are close enough to the ledger's." | `skill-patcher` consumes the exact shared contract. Close-enough is unparseable. Use the template verbatim. |
| "My own section order reads better tonight." | Reports accrete and get diffed. The canonical shape is what makes 30 debriefs telemetry instead of 30 essays. |

## Red Flags — STOP

- About to write anything outside `Docs/debriefs/` — a skill file, a ledger, CLAUDE.md,
  a transcript, another project.
- About to create a report (or stub) on a day the coding-day gate failed.
- A telemetry row missing trigger kind or outcome signal.
- Any token/email/name shape — or any pointer to a secret's on-disk location — in a
  draft report; finishing without the grep sweep.
- A letter grade with no cited session, or any letter grade for a zero-opportunity
  skill.
- A weekly recommendation whose field set deviates from the ledger-compatible template.
- A push failure about to abort or degrade the report: the report lands regardless.
