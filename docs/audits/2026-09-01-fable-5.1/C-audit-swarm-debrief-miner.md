The Write tool blocked writing the report file (subagent report-file guard), so here is the complete report as my final message. The parent should persist it to `scratchpad/audit/report-C-scan.md` if the aggregation step needs it on disk.

---

# Prompt audit — Scan cluster (audit-swarm, dev-debrief, session-miner, transcript-reader)

**Target model:** Claude Fable 5.1 (`claude-fable-5-1`). Resolved from the audit brief; corroborated by the repo's own `claude-api` migration notes.

**Scope (13 files, all read in full; `*.test.mjs` excluded):**

| File | Lines | Verdict |
|---|---|---|
| `skills/audit-swarm/SKILL.md` | 91 | **clean** |
| `skills/audit-swarm/workflows/audit.mjs` | 266 | 2 findings |
| `skills/dev-debrief/SKILL.md` | 112 | 5 findings |
| `skills/dev-debrief/references/scan-protocol.md` | 114 | 2 findings |
| `skills/dev-debrief/references/report-format.md` | 114 | 1 finding |
| `skills/session-miner/SKILL.md` | 109 | 1 finding |
| `skills/session-miner/references/mining-protocol.md` | 117 | 1 finding (low) |
| `skills/transcript-reader/SKILL.md` | 134 | **clean** |
| `skills/transcript-reader/references/extraction-contract.md` | 53 | **clean** |
| `skills/transcript-reader/references/extraction-rules.md` | 20 | **clean** |
| `skills/transcript-reader/references/rules-protocol.md` | 60 | **clean** |
| `skills/transcript-reader/scripts/ingest.mjs` | 249 | **clean** (pure Node, no prompt surface) |
| `skills/transcript-reader/workflows/distill.mjs` | 354 | 2 findings |

---

## Summary

**Counts by group:** Group 1 (dated prompt text) — 5. Group 2 (brittle skill files) — 2. Group 3 (tool/description contract) — 1 (low). Group 4 / keep-list item 11 (guidance the target model *needs added*) — 4. Low-confidence flags — 1. **Total: 13 findings** across 6 files; 6 files are clean and 1 (`ingest.mjs`) has no prompt surface at all.

This cluster is in unusually good shape for a pre-Fable-5 library. Emphasis density in every body is low (1–3 caps-emphasis tokens per ~100 lines), there are **zero** API fossils (no `thinking`, `budget_tokens`, `tool_choice`, prefill, `temperature`, `stop_sequences`, no pinned model IDs anywhere), **zero** update-suppressors ("don't narrate" / "hold findings" / "no interim"), and **zero** anti-formatting rules. Every "Red Flags — STOP" and Rationalization-Table prohibition I checked traces to a documented RED baseline under `tests/scenarios/<skill>/RED-baseline.md`, and the failures they guard are ones Fable 5.1 is *documented to still have* — audit-swarm's findings-only rule guards the baseline's "refactored `server.js`/`db.js` … since these were unambiguous fixes and there was time" (RED scenario 1), which is precisely Fable 5.1's documented "sometimes takes unrequested-but-adjacent actions" and "unrequested tidying or refactoring at higher effort." Those are keepers; I propose no cuts to them.

**Three highest-impact findings, in prose:**

**1 — dev-debrief's scheduling facts contradict its own reference file (Findings 1, 2; High).** `SKILL.md:24` still routes the reader to "crontab line: `references/scan-protocol.md`", and the frontmatter description still fires on "when the nightly dev-debrief **cron** fires." But `scan-protocol.md:105` says "Nightly **launchd LaunchAgent** (not cron)" and `:110-114` documents why: cron ran outside the login session, could not reach Keychain credentials, and produced "observed 2026-07-25 → 2026-08-20, 21 failures, zero reports." Commit `e83ba92` shipped the launchd fix; SKILL.md was left behind. Group 2 volatile-specifics rot with a live cost — an operator following SKILL.md installs the exact mechanism that produced 21 consecutive zero-report nights.

**2 — Neither headless skill carries the autonomous-run guidance Fable 5.1 needs (Findings 3, 4; High).** dev-debrief and session-miner both run unattended through `claude -p` LaunchAgents (`scripts/launchd/com.soltero-skills.{dev-debrief,session-miner}.plist.tmpl`), and dev-debrief's own RED baseline says the production path "has no menu — a nightly `claude -p` prompt supplies none of these framings." Fable 5.1's documented failure modes for exactly this shape are (a) ending a turn on a text-only statement of intent ("I'll now write the report") without the tool call, or asking permission it does not need, and (b) fabricated status reports on long runs, which the guidance says are "nearly eliminated" by an explicit progress-claim-audit instruction. Both skills produce artifacts that are *entirely* claims about work performed — the highest-value place in this cluster for that instruction. Neither has it. This is the audit running in the *add* direction (keep-list item 11), and it is the migration checklist's own `[TUNE] Add the autonomy + scope prompts for unattended runs`.

**3 — Both workflows' report-writing agents return a file path they were never told to confirm (Findings 8, 9; Medium).** `audit.mjs:222-236` and `distill.mjs:320-341` each end with "return the report path and a 5-line-max summary." `reportPath` is a schema-required string — exactly the field an agent can fill without having done the work — and both scripts treat a non-null return as proof the file exists (`audit.mjs:238`, `distill.mjs:342`), so a fabricated path propagates as success. The same two lines also carry a numeric output cap written against models that padded; Fable 5.1 under-narrates and its agentic summaries are already shorter, so the cap now clips the one user-facing artifact of a multi-dozen-agent run.

**Group 4 architecture check (model-call sites), run explicitly:**

- `audit.mjs` — 4 call sites: scout ×1, finder ×1-per-dimension (7–10 typical, × rounds in thorough mode), skeptic ×1 or ×3 per fresh finding, synthesis ×1. **All deterministic work is already in plain code**: dedupe (`keyOf`/`Set`, L145-150, L166-169), vote tally and quorum (L192-199), severity sort (L220), fallback markdown rendering (L251-253). No LLM tallies, filters, dedupes, or formats.
- `distill.mjs` — 6 call sites: ingest-relay ×1, chunk extractor ×1-per-chunk, reducer ×1, verifier ×1-per-item (two rounds), critic ×1, report writer ×1. Deterministic work in code: all normalization and chunking in `ingest.mjs` (pure Node, zero LLM, correctly so), verdict bucketing (L252-266), the stats object (L303-317), default report path (L318). The reducer's "DEDUPE" (L206) is semantic dedupe of the same item phrased two ways across an overlap window — genuinely adaptive, not mechanical.
- Two call sites *do* have inputs that fully determine outputs — the ingest relay (`distill.mjs:164`) and both report writers. **Both are forced by the platform, not cruft:** Workflow scripts have "No filesystem or Node.js API access," so a script cannot exec `ingest.mjs` nor write a file. The ingest relay is already mitigated correctly (pinned `model: 'haiku', effort: 'low'`, "the script's output is the ground truth," "Do not summarize, edit, or re-chunk anything yourself"). I propose no change to either; naming them as the calls that stay is the correct answer here, not deleting them.
- **Redundant specialist sub-agents: none.** `audit.mjs`'s three skeptic lenses are already one agent type (`finding-skeptic`) parameterized by `lens.instruction` — the exact "fold the one real difference into the surviving agent's input" shape the pattern prescribes, not three near-duplicate definitions. The finder dimensions overlap deliberately (swarm-for-coverage with downstream dedupe), which is working redundancy. `distill.mjs`'s per-item verifiers are fan-out over one prompt, and the critic reads the whole transcript for omissions where extractors read chunks — a different job.
- **Barriers are all justified** against the `pipeline()`-by-default rule: every `parallel()` here feeds a stage that genuinely needs cross-item context (dedupe-vs-seen before verification; reduce needs all chunks; critic needs the full merged set; report needs all verdicts).

**Non-finding worth a line:** `transcript-reader/SKILL.md:88` has a cosmetic layout glitch — the "**Cost note:**" sentence is jammed onto the end of the `reportPath` paragraph mid-line rather than starting its own. Not an audit pattern; noted only so it is not mistaken for one.

---

## Findings

### High confidence

**Finding 1**

| Field | Content |
|---|---|
| **Location** | `skills/dev-debrief/SKILL.md:24` |
| **Evidence** | ``- The scheduled nightly run (crontab line: `references/scan-protocol.md`).`` |
| **Pattern** | Group 2 — "Volatile specifics: hardcoded paths, flags, version numbers … skills rot factually as code ships"; also Group 1d fossil |
| **Why obsolete** | The file it points at says the opposite: `scan-protocol.md:105` — "Nightly **launchd LaunchAgent** (not cron)" — and `:110-114` records the incident ("observed 2026-07-25 → 2026-08-20, 21 failures, zero reports"). Commit `e83ba92` landed the launchd fix without updating this line. Fable 5.1 follows instructions literally and will not hedge against a stale pointer. |
| **Confidence** | **High** |
| **Action** | `rewrite` — hunk 1 |

**Finding 2**

| Field | Content |
|---|---|
| **Location** | `skills/dev-debrief/SKILL.md:3` (frontmatter description) |
| **Evidence** | `description: Use when the nightly dev-debrief cron fires or when explicitly asked for a daily work debrief …` |
| **Pattern** | Group 2 — volatile specifics / factual staleness. **Not** flagged as description shouting; a wrong environment fact is still wrong. |
| **Why obsolete** | Same drift as Finding 1. `scripts/install-schedules.sh:49` actively *removes* the old crontab entries (`crontab -l \| grep -v -E "session-miner\|dev-debrief" \| crontab -`). The description rides in every request, so a stale mechanism name here is the most-read wrong fact in the skill. |
| **Confidence** | **High** |
| **Action** | `rewrite` — hunk 2 |

**Finding 3**

| Field | Content |
|---|---|
| **Location** | `skills/dev-debrief/SKILL.md` — missing; insert after the Hard Rules block (after line 56) |
| **Evidence** | *(absence)* Production path is `com.soltero-skills.dev-debrief.plist.tmpl` → headless `claude -p`; nothing in SKILL.md, `scan-protocol.md`, or `report-format.md` tells the model it is running unattended, that it must not stop to ask, or that its counts must be audited against tool results. The RED baseline states the gap: *"The production run has no menu — a nightly `claude -p` prompt supplies none of these framings."* |
| **Pattern** | Group 4 / keep-list item 11 — "Re-baselining adds text too"; migration checklist `[TUNE] Add the autonomy + scope prompts for unattended runs` |
| **Why obsolete** | Two documented Fable 5.1 behaviors hit this directly. (a) *Early stopping*: "can occasionally end a turn with a text-only statement of intent ('I'll now run X') without the tool call, or ask permission it doesn't need" — a nightly run ending on "I'll now write the report" produces a silent zero-report night indistinguishable from a skip. (b) *Progress-claim grounding*: "Require progress claims to be audited against tool results — in testing this nearly eliminated fabricated status reports." A debrief report is *nothing but* progress claims. The added text also closes the blocked-scan-vs-skip-day hole the 2026-08-25 run fell into. |
| **Confidence** | **High** |
| **Action** | `add` — hunk 3 |

**Finding 4**

| Field | Content |
|---|---|
| **Location** | `skills/session-miner/SKILL.md` — missing; insert after the "Live surfaces are read-only" paragraph (after line 80) |
| **Evidence** | *(absence)* `SKILL.md:21` — "or a scheduled/background run fires" — and `com.soltero-skills.session-miner.plist.tmpl` runs it headless. No autonomy or progress-claim guidance in SKILL.md or `mining-protocol.md`. |
| **Pattern** | Group 4 / keep-list item 11 |
| **Why obsolete** | Same two Fable 5.1 behaviors, plus one specific to this skill: session-miner's central judgment is the *verified vs parked* call (`SKILL.md:40-44`, `mining-protocol.md:16-30`), which is exactly a claim about evidence the run says it saw. The autonomy half matters because the skill's most-tempting stopping point ("shall I propose this?") is a permission it does not need — its one genuinely human decision, installation, is already out of scope by construction. |
| **Confidence** | **High** |
| **Action** | `add` — hunk 4 |

### Medium confidence

**Finding 5**

| Field | Content |
|---|---|
| **Location** | `skills/audit-swarm/workflows/audit.mjs:234` |
| **Evidence** | `` `After writing the file, return the report path and a 5-line-max summary of the top findings.` `` |
| **Pattern** | Group 1b / 1f — "hard word caps … Delete and re-baseline: output caps starve reasoning"; numeric ceilings are removed as one pattern, and a stated operational reason does not convert a clamp into a keeper |
| **Why obsolete** | Written when models padded. Fable 5.1 does the opposite: "writes fewer user-facing updates during long tool-calling turns… its agentic coding summaries are shorter too." This is the *only* user-facing output of a run that may spawn dozens of agents, and `SKILL.md:65-67` relays it as the headline. |
| **Confidence** | **Medium** |
| **Action** | `rewrite` — hunk 5 (combined with Finding 8, same line) |

**Finding 6**

| Field | Content |
|---|---|
| **Location** | `skills/transcript-reader/workflows/distill.mjs:339` |
| **Evidence** | `` `After writing, return the report path and a 5-line-max summary.` `` |
| **Pattern** | Group 1b / 1f — numeric output ceiling |
| **Why obsolete** | Identical to Finding 5. `SKILL.md:91-93` relays this summary plus coverage stats and any flagged items; five lines cannot carry "here is the headline, and three items are flagged unverified," which Hard Rule 6 says must reach the user. |
| **Confidence** | **Medium** |
| **Action** | `rewrite` — hunk 6 (combined with Finding 9, same line) |

**Finding 7**

| Field | Content |
|---|---|
| **Location** | `skills/dev-debrief/references/report-format.md:41-42`, mirrored in `skills/dev-debrief/SKILL.md:3` ("max 2 evidence-backed workflow observations") |
| **Evidence** | ``- At most 2, each with concrete transcript evidence (session + moment). No generic advice; `None observed.` is the common, correct value.`` |
| **Pattern** | Group 1f — "numeric output ceilings … A stated operational reason does not convert a numeric clamp into a keeper — re-express the goal as audience/outcome framing without the number" |
| **Why obsolete** | The clamp has no RED-baseline provenance: dev-debrief's baseline failures were invented section sets, improvised redaction, and drifted ledger fields — never *too many* observations. Nothing parses the "2" (`skill-patcher` consumes the recommendation template, not this section). Against Fable 5.1, which already elaborates less, a hard ceiling of two suppresses a genuine third evidence-backed observation on a heavy day. The quality bar was doing the real work and is kept verbatim. |
| **Confidence** | **Medium** |
| **Action** | `rewrite` — hunk 7 (two sub-hunks, per Step 6's completeness rule) |

**Finding 8**

| Field | Content |
|---|---|
| **Location** | `skills/audit-swarm/workflows/audit.mjs:222-238` (instruction at :234; consuming branch at :238) |
| **Evidence** | Prompt: `` `After writing the file, return the report path …` ``; consumer: `if (report) { return { reportPath: report.reportPath, … } }` |
| **Pattern** | Group 4 / keep-list item 11 — add guidance for a documented target-model failure mode ("Ground progress claims on long runs") |
| **Why obsolete** | `reportPath` is schema-**required**, so the agent must emit one whether or not it wrote the file, and the script treats any non-null return as proof the report exists — the carefully-built fallback at :248-266 fires only when the agent dies outright, never when it reports success it did not achieve. Fable 5.1's documented mitigation is exactly this instruction, reported to have "nearly eliminated fabricated status reports on tasks designed to elicit them." A fabricated path silently discards a run that may have cost dozens of agents. |
| **Confidence** | **Medium** |
| **Action** | `add` — hunk 5 |

**Finding 9**

| Field | Content |
|---|---|
| **Location** | `skills/transcript-reader/workflows/distill.mjs:320-342` (instruction at :339; consuming branch at :342) |
| **Evidence** | Prompt: `` `After writing, return the report path …` ``; consumer: `if (!rep) { … }` then `return { reportPath: rep.reportPath, … }` |
| **Pattern** | Group 4 / keep-list item 11 |
| **Why obsolete** | Identical mechanism to Finding 8, and sharper here: this skill's thesis is "nothing is reported as fact without … an independent verification it survived" (`SKILL.md:31-33`), and the one claim nobody verifies is the report agent's own claim to have written the report. `SKILL.md:131` even lists "About to type the word 'verified' about your own extraction" as a stop condition. |
| **Confidence** | **Medium** |
| **Action** | `add` — hunk 6 |

**Finding 10**

| Field | Content |
|---|---|
| **Location** | `skills/dev-debrief/references/scan-protocol.md:15-17` |
| **Evidence** | `- Large corpora **may be** scanned by cheap read-only subagents (one per project); the orchestrating run merges their extractions.` |
| **Pattern** | Group 1a — "leftover hedges ('try to', 'if possible') are now read literally as permission to under-deliver"; plus Fable 5.1 delegation guidance ("instead of suppressing delegation — a common prior-model guardrail — use sub-agents frequently and give explicit guidance on *when* delegation is desirable") |
| **Why obsolete** | A permissive hedge written when parallel sub-agents were unreliable. On Fable 5.1, parallel delegation is a documented strength ("Parallel sub-agents are dependable… it reliably sustains ongoing communications with long-running sub-agents"), and scanning every project's transcripts nightly is the canonical fan-out shape. Read literally, the hedge lets a nightly run serialize the whole corpus in one context. |
| **Confidence** | **Medium** |
| **Action** | `rewrite` — hunk 8 |

**Finding 11**

| Field | Content |
|---|---|
| **Location** | `skills/dev-debrief/SKILL.md:83-84` and `skills/dev-debrief/references/scan-protocol.md:96-101` (mirrored in the description at `:3`, "push headline when available") |
| **Evidence** | `` 6. **Push a one-line headline** if a PushNotification capability exists in this context; if not, skip the push silently — never fail the report over it. `` |
| **Pattern** | Group 1d — "Unenforced instructions: rules no code path, eval, or reviewer checks"; Group 3 — "prose lists that shadow the real tool list… don't expose tools that are invalid in the current configuration" |
| **Why obsolete** | No tool named `PushNotification` exists in the Claude Code harness (Agent, Artifact, Bash, Edit/Write/Read, Skill, ToolSearch, Workflow, EnterWorktree/ExitWorktree, Monitor, SendMessage, TaskStop, WebFetch/WebSearch, plus MCP tools), and none of the configured MCP servers provides one. No scenario or GREEN result exercises the push — `tests/scenarios/dev-debrief/scenario-1.md:26` mentions it only inside an option's text. Two paragraphs plus a description clause describe a capability that has never fired. It is guarded ("skip silently"), so harm is low rather than zero — but on a model documented to be proactive and to take adjacent unrequested actions, naming a nonexistent capability invites a headless run to improvise one. |
| **Confidence** | **Medium** |
| **Action** | `rewrite` — hunk 9. Completeness note: `docs/specs/dev-debrief.md:47` carries the same reference and is outside this audit's scope. |

### Low confidence — flag only, no diff

**Finding 12**

| Field | Content |
|---|---|
| **Location** | `skills/session-miner/references/mining-protocol.md:66` |
| **Evidence** | `Dispatch a **fresh** subagent per candidate … **Pin a standard model tier.** Give it:` |
| **Pattern** | Group 3, "under-described — add" direction |
| **Why obsolete** | "A standard model tier" names no tier, while `SKILL.md:37-39` is concrete for the *extract* step ("subagents on haiku … name the model explicitly, never inherit the session model"). The reviewer is the adversarial gate whose absence the RED baseline showed shipping "conflated triggers, invented 'safety' steps" — an under-specified tier here is the one place a cheap default costs a real defect. Idiom-level under-description with no documented Fable 5.1 behavior tying it to a regression, so I flag rather than propose. Concrete form if wanted: *"Pin the model explicitly — a review is judgment work, so the engineering tier (`opus`), never the session model by inheritance."* |
| **Confidence** | **Low** |
| **Action** | `flag` |

### Checked and deliberately NOT flagged (provenance verified)

Recorded so a later pass does not re-litigate them:

- **`audit-swarm/SKILL.md:40-42, 82, 89`** — findings-only prohibitions. Provenance: RED scenario 1, "Refactored `server.js`/`db.js`… removed `ghostscript4js`", verbatim rationalization "Since these were unambiguous fixes… and there was time, I applied them." Fable 5.1 documented to take "unrequested-but-adjacent actions" and produce "unrequested tidying or refactoring at higher effort." **Reproduces on target — keep.**
- **`transcript-reader/SKILL.md:131`** — "About to type the word 'verified' about your own extraction." Provenance: RED headline 1. Fable 5.1's documented fix for this class is more of this, not less. **Keep.**
- **`transcript-reader/references/extraction-contract.md:19-22`** and `distill.mjs:153-161` — the verbatim rule and its "moderated → unmoderated" example. Provenance: RED failure 2, the exact corruption. Independently reinforced by Fable 5.1's own regression: "more likely than Claude Fable 5 to reproduce passages of source text without marking them as quotations." **Keep** — format-pinning example on a format-sensitive output (keep-list item 7).
- **`distill.mjs:232-240`** — the verifier's `(a)`–`(f)` checklist. Reads like Group 1c step-choreography, but it is a non-exhaustive list of *failure modes to hunt* ("Check, at minimum"), each traceable to a distinct RED trap. Not a script for a judgment call — it is the judgment's inventory. **Keep.**
- **`dev-debrief/SKILL.md:36-56`** (Hard Rules 1–5) and the Rationalization Table. Provenance: RED failure summary items 1–4, plus "the correct behaviors need to survive without the menu." Fable 5.1 under-formats and drifts on unstated contract shape. **Keep.**
- **`dev-debrief/references/scan-protocol.md:110-114`** — the "why not cron" incident narrative. Reads as Group 2 archaeology, but it is the reason guarding a fragile operation (keep-list items 1 and 3) and the only thing stopping a future simplification back to cron. **Keep.**
- **`session-miner/SKILL.md:91, 94`** and **`transcript-reader/SKILL.md:113, 117`** — past-tense baseline references inside Rationalization Tables: provenance citations attached to live prohibitions, not free-floating narratives. **Keep.**
- **`audit-swarm/SKILL.md:46`** — "Get the date (the workflow script cannot call `Date.now()`)". Verified accurate against the current Workflow script API. Exact script for a fragile op, with its reason. **Keep.**
- **`audit-swarm/SKILL.md:8-14`, `transcript-reader/SKILL.md:8-15`** — portability notes. Environment context only the author knows (keep-list item 1), not migration-relative phrasing. **Keep.**
- **Model aliases** (`'sonnet'`, `'haiku'`, `'opus'`) and `effort: 'low'` throughout both workflows — aliases resolve to current models and are not stale. No hard-coded model ID exists anywhere in scope. **Keep.**

---

## Step 6 — Proposed diff

High and Medium findings only. One finding per hunk, except where two findings edit the same line (noted inline). **Not applied — no repo file was modified by this audit.**

### Hunk 1 — Finding 1

```diff
--- a/skills/dev-debrief/SKILL.md
+++ b/skills/dev-debrief/SKILL.md
@@ -22,7 +22,7 @@
 ## When to Use
 
-- The scheduled nightly run (crontab line: `references/scan-protocol.md`).
+- The scheduled nightly run (launchd LaunchAgent — install and rationale in
+  `references/scan-protocol.md`; it is deliberately not cron).
 - Explicit requests: "run the dev debrief", "what did I do today across projects",
   "how is the skill portfolio tracking my work".
```

### Hunk 2 — Finding 2

```diff
--- a/skills/dev-debrief/SKILL.md
+++ b/skills/dev-debrief/SKILL.md
@@ -3 +3 @@
-description: Use when the nightly dev-debrief cron fires or when explicitly asked for a daily work debrief ("run the dev debrief", "what did I actually do today across projects") — scans ~/.claude/projects transcripts from the last 24h across ALL projects; […]
+description: Use when the scheduled nightly dev-debrief run fires or when explicitly asked for a daily work debrief ("run the dev debrief", "what did I actually do today across projects") — scans ~/.claude/projects transcripts from the last 24h across ALL projects; […]
```

*(Only the opening clause changes; the rest of the description line is unchanged. Hunk 7b edits a later clause of this same line — apply both in one pass.)*

### Hunk 3 — Finding 3

```diff
--- a/skills/dev-debrief/SKILL.md
+++ b/skills/dev-debrief/SKILL.md
@@ -56,6 +56,22 @@
 5. **Grades require cited evidence.** Every letter grade names at least one session;
    zero-relevant-opportunity skills grade **N/A with one line of reasoning**, never F,
    never a made-up middle grade.
 
+## Autonomous run
+
+The production path is a headless `claude -p` LaunchAgent: nobody is watching, nobody can
+answer a question mid-run, and there is no menu of options — the Hard Rules above are the
+decision. Proceed without asking on everything the debrief covers. Before ending the turn,
+check the last paragraph: if it is a plan, a question, or a promise about work not yet done
+("I'll write the report next"), do that work now with tool calls instead. End the turn only
+when the report — or the skip-log line — is on disk.
+
+Audit every claim in the report against a tool result from this run before writing it: the
+session files actually read, the invocations actually found, the evidence actually quoted.
+Report what you can point at. A project whose transcripts could not be read is stated as
+unread, not silently dropped and never counted as zero — **a blocked scan is not a skip
+day**: if the window could not be scanned, say so in the log and write nothing, rather than
+recording a skip that claims there was no work.
+
 ## How to Run
```

### Hunk 4 — Finding 4

```diff
--- a/skills/session-miner/SKILL.md
+++ b/skills/session-miner/SKILL.md
@@ -80,6 +80,20 @@
 label is still an install: the line is in force for the very next session. An empty
 `.claude/skills/` directory is not "the natural destination" for a draft — it is exactly
 the surface a proposal must stay out of.
 
+## Autonomous run
+
+A scheduled pass is a headless `claude -p` LaunchAgent: nobody is watching, and pausing to
+ask "shall I propose this?" blocks the pass until someone notices. Everything in the
+pipeline — mining, redacting, reviewing, writing under `Docs/mining/proposals/` — is
+reversible and covered by the request, so proceed without asking. The one decision that
+stays human is installation, and that is not yours to ask about either: it is out of scope
+by construction. Before ending the turn, check the last paragraph — if it is a plan or a
+promise ("I'll draft the proposals now"), do that work with tool calls instead.
+
+Audit every evidence claim against a tool result from this run before writing it: the
+session file you actually read, the passing-test or commit or confirmation line you
+actually saw and can quote. "Verified" describes a transcript line you can point at, not
+how the pass felt; anything you cannot point at is parked as unverified, and a source you
+could not read is named as unread rather than omitted.
+
 ## Rationalization Table
```

### Hunk 5 — Findings 5 and 8 (same line)

```diff
--- a/skills/audit-swarm/workflows/audit.mjs
+++ b/skills/audit-swarm/workflows/audit.mjs
@@ -232,7 +232,9 @@
   `Data follows as JSON.\n\nCONFIRMED:\n${JSON.stringify(confirmed, null, 2)}\n\nREFUTED:\n` +
   `${JSON.stringify(refuted, null, 2)}\n\nINVENTORY:\n${JSON.stringify(inv, null, 2)}\n\n` +
-  `After writing the file, return the report path and a 5-line-max summary of the top findings.`,
+  `After writing the file, read it back to confirm it exists and contains every section, ` +
+  `then return its path and a summary of the top findings — as long as it needs to be for ` +
+  `a reader who sees only that summary, and no longer. Never return a path you have not ` +
+  `confirmed on disk; if the write failed, say so instead of returning a path.`,
   { label: 'synthesize', phase: 'Report', schema: REPORT_SCHEMA, model: 'opus' }
 )
```

### Hunk 6 — Findings 6 and 9 (same line)

```diff
--- a/skills/transcript-reader/workflows/distill.mjs
+++ b/skills/transcript-reader/workflows/distill.mjs
@@ -336,7 +336,9 @@
   `Copy quotes and citations exactly from the data — do not invent, merge, drop, or reword ` +
   `items. DATA:\nVERIFIED ITEMS:\n${JSON.stringify(finalItems)}\n` +
   `FLAGGED UNVERIFIED:\n${JSON.stringify(flaggedUnverified)}\nTIMELINE:\n${JSON.stringify(red.timeline)}\n` +
-  `After writing, return the report path and a 5-line-max summary.`,
+  `After writing, read the file back to confirm it exists and contains every section, then ` +
+  `return its path and a summary — long enough that a reader who sees only the summary ` +
+  `learns the headline decisions and that anything was flagged unverified. Never return a ` +
+  `path you have not confirmed on disk; if the write failed, say so instead.`,
   { label: 'report', phase: 'Report', schema: REPORT_SCHEMA, model: 'sonnet' }
 )
```

### Hunk 7a — Finding 7 (the rule)

```diff
--- a/skills/dev-debrief/references/report-format.md
+++ b/skills/dev-debrief/references/report-format.md
@@ -39,6 +39,7 @@
 ## Workflow observations
 
-- At most 2, each with concrete transcript evidence (session + moment). No generic
-  advice; `None observed.` is the common, correct value.
+- Only observations with concrete transcript evidence (session + moment), and only ones
+  that would change what the reader does next. No generic advice; `None observed.` is the
+  common, correct value.
```

### Hunk 7b — Finding 7 (the description mirror; Step 6 completeness)

```diff
--- a/skills/dev-debrief/SKILL.md
+++ b/skills/dev-debrief/SKILL.md
@@ -3 +3 @@
-… missed-trigger findings with cited session evidence, max 2 evidence-backed workflow observations, push headline when available. …
+… missed-trigger findings with cited session evidence, evidence-backed workflow observations, push headline when available. …
```

### Hunk 8 — Finding 10

```diff
--- a/skills/dev-debrief/references/scan-protocol.md
+++ b/skills/dev-debrief/references/scan-protocol.md
@@ -15,5 +15,7 @@
-- Large corpora may be scanned by cheap read-only subagents (one per project); the
-  orchestrating run merges their extractions. Subagents inherit every hard rule —
-  read-only, no writes anywhere.
+- Delegate the per-project scans to read-only subagents on a cheap model — one per
+  project — and merge their extractions in the orchestrating run. That is the default
+  past a couple of projects; keep merging what has come back rather than waiting on each
+  subagent in turn. Subagents inherit every hard rule — read-only, no writes anywhere.
```

### Hunk 9 — Finding 11 (two sites)

```diff
--- a/skills/dev-debrief/SKILL.md
+++ b/skills/dev-debrief/SKILL.md
@@ -83,4 +83,5 @@
-6. **Push a one-line headline** if a PushNotification capability exists in this
-   context; if not, skip the push silently — never fail the report over it.
+6. **Push a one-line headline** only if this context actually exposes a notification tool
+   (check the available tools, deferred ones included, before assuming one). Headless
+   LaunchAgent runs normally expose none — skip silently then, and never let a missing or
+   failed push delay, degrade, or abort the report.
```

```diff
--- a/skills/dev-debrief/references/scan-protocol.md
+++ b/skills/dev-debrief/references/scan-protocol.md
@@ -96,7 +96,8 @@
 ## Push notification
 
-After the report is written (never before): if a PushNotification capability exists in
-the running context, send one line — `Dev debrief YYYY-MM-DD: <n> projects, <m> skill
-invocations, <k> missed triggers`. If the capability is absent or the send fails, skip
-silently. The push never gates, delays, or fails the report; skip days push nothing.
+After the report is written (never before): if the running context exposes a notification
+tool — check the actual available tools, deferred ones included, rather than assuming one
+exists — send one line: `Dev debrief YYYY-MM-DD: <n> projects, <m> skill invocations, <k>
+missed triggers`. Headless runs normally expose none; skip silently then, as on a failed
+send. The push never gates, delays, or fails the report; skip days push nothing.
```

---

**Verification note (Step 7).** These are hypotheses, not conclusions. Hunks 1, 2, 7b and 9 are factual corrections needing no behavioral probe beyond re-running `tests/scenarios/dev-debrief/` to confirm nothing asserted the old text. Hunks 3, 4, 5, 6 and 8 change behavior and should be probed one at a time: for 3 and 4, a headless `claude -p` run against the existing fixture trees, checking the turn ends with an artifact on disk rather than a stated intention; for 5 and 6, one workflow run each, checking the returned `reportPath` exists and the relayed summary still leads with the outcome. Grep for `5-line-max`, `crontab`, `max 2 evidence-backed`, and `PushNotification` across the repo before calling any of this done — `docs/specs/dev-debrief.md:47` holds a fourth `PushNotification` reference outside this audit's scope.