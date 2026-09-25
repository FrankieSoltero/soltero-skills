# Prompt audit — Report B: review & PRD skills

**Target model:** Claude Fable 5.1 (`claude-fable-5-1`), per AUDITOR-BRIEF.
**Scope (all read in full):** `skills/plan-review/**`, `skills/prd-review/**`,
`skills/plan-visualizer/**` (excl. `*.test.mjs`), `skills/writing-prds/**`,
`skills/prd-scoping/SKILL.md`, `skills/prd-user-stories/SKILL.md`,
`skills/prd-success-metrics/SKILL.md`, `skills/walkthrough-tutor/SKILL.md`.
Provenance read from `tests/scenarios/<skill>/RED-baseline.md` for all eight skills;
operational evidence from `docs/debriefs/2026-08-{25,27,29}.md`.

## Summary

**Counts by group:** Group 1a (pressure language) 2 · Group 1c (over-specification /
one-sided framing) 2 · Group 1d (fossils, unenforced instructions) 3 · Group 2
(volatile specifics, history narrative) 2 · Group 4 (architecture / model-call sites) 3
(1 with a diff, 2 flag-only). Total: 8 findings with proposed diffs (3 High, 5 Medium),
4 flag-only. Four files are **clean**: `skills/prd-scoping/SKILL.md`,
`skills/prd-user-stories/SKILL.md`, `skills/plan-visualizer/references/render-contract.md`,
`skills/plan-visualizer/scripts/plan-graph.mjs`.

**The three highest-impact findings.**

*First, both review skills route their own output at a plugin that was removed.*
`plan-review` step 6 hands a PASSED plan to `superpowers:executing-plans or
subagent-driven-development`, its HARD-GATE forbids execution "by
superpowers:executing-plans", and a failed round sends the plan "back to
superpowers:writing-plans". The superpowers plugin was disabled on 2026-07-29
(`CHANGELOG.md:213` — "the superpowers plugin can now be disabled"), and the owner's
own routing sends approved plans to `lean-plans` → `lean-sdd`. Every one of these is a
dangling reference in a *body*, not trigger text: on a model that follows references
literally, the gate's handoff instruction names a skill that cannot be invoked.
Sixteen body-level occurrences across five files.

*Second, the 3-round cap exists only as prose, and the repo's own transcripts show it
being violated by a factor of three.* `Maximum 3 rounds` appears in both SKILL.md files
and "Round 4. (Stop)" is a Red Flag, but `review.mjs` reads `args.round` and never
bounds it. The 2026-08-29 debrief records nine plan-review council rounds across three
fix-cycles in `lastcall-admin` (79.2 → 84.3), an ~80-minute treadmill ended only by the
user overriding the verdict. This is Group 1d's "unenforced instructions" row exactly —
a behavioral rule that could be a code check, visibly violated in the app's own
transcripts. Three lines in each workflow script convert it into a hard stop.

*Third — the brief's specific question — yes, the prompt text contributes to
non-convergence, on the skeptic side.* The skeptic prompt opens by telling the verifier
the grade is "suspiciously high", declares its "ONLY job is to find checklist violations
the grader MISSED", and closes with "return an empty missedViolations array — **but only
then**". Every clause pushes one direction; nothing states an evidence floor or a
symmetric default. That was calibrated against Sonnet 4.x graders whose documented
failure (RED-baseline 2026-07-24) was generosity. Fable 5.1's instruction following is
much stronger ("Instruction following is strong — use it"), so the same one-sided
pressure now lands harder and manufactures marginal findings — which is what a
never-converging loop looks like from the inside. The repo already contains the
corrected shape: `agents/finding-skeptic.md` states "DEFAULT TO REFUTED" and requires
quoting "what is really there". The council skeptics have neither. The grader prompts
compound it: their in-prompt rule recap selects only the deflationary rules ("when torn
between two bands take the LOWER"; ">= 90 requires affirmative excellenceEvidence") and
never restates the two-sided half, so 89 becomes a stable attractor just below the score
that triggers a skeptic. *(Per the brief, the numeric gate itself is out of scope and is
not relitigated here.)*

---

## Group 4 — model-call sites and deterministic work

**Call-site count.** `skills/plan-review/workflows/review.mjs` has **4** model-call sites
(lite grader L143; per-dimension grader L173; skeptic L177; re-grader L179).
`skills/prd-review/workflows/review.mjs` has **3** (L114, L118, L120). Per full council
round each runs 6 graders + 0–6 skeptics + 0–6 re-grades = **6–18 model calls**; at the
documented 3-round cap that is ≤54, and the observed 9-round run implies up to ~162.
Lite mode is 1 call.

**Rubric arithmetic is correctly in code — this is the healthy part and should stay.**
The weighted total, the 0.1 rounding, floor-breach detection, blocking-violation
counting, `Math.min(grade, regrade)`, the failed-dimension re-grade selector and the
carry-forward are all plain JavaScript (`review.mjs:211-220` / `151-159`). No model is
asked to compute a score, a weight, or a verdict anywhere in either script. No
hard-coded model ID, no `thinking`, `budget_tokens`, `temperature`, `tool_choice`, or
prefill appears in either file; model picks are the `'sonnet'`/`'opus'` aliases, which
the brief classes as current.

**`skills/plan-visualizer/scripts/plan-graph.mjs` is the counter-example done right and
is clean:** 310 lines, **zero model calls**, deterministic graph derivation (topological
waves, cycles, dangling deps, undeclared consumes, concurrent file overlap, table↔block
drift, missing tiers), every finding carrying plan line numbers, `process.exitCode` set
from blocking count. It is the reference implementation for the pattern.

**Deterministic work still being done by an LLM (Finding 6).** plan-review's council
re-derives, by hand, across up to six graders and up to three rounds, findings that
`plan-graph.mjs` already computes exactly: D1's "dependencies explicit" and ordering,
D6's "no contradictions between the plan's own sections" and "no TBD owner or
placeholder", D4's file/path concreteness. plan-visualizer's own RED baseline is the
proof that hand-derivation is unreliable: *"Same model, same plan: one baseline agent
found both blocking defects by hand, another found none. Hand-checking is luck."*
(`tests/scenarios/plan-visualizer/RED-baseline.md`). The parser exists, is tested, and
is already invoked by a sibling skill; plan-review does not call it.

---

## Findings

Ordered by confidence.

### 1. Dangling `superpowers:*` routing targets in skill bodies — **High** — `rewrite`

| Location | Evidence (quoted) |
|---|---|
| `skills/plan-review/SKILL.md:26` | "must not be executed — not by superpowers:executing-plans, not by\nsubagent-driven-development" |
| `skills/plan-review/SKILL.md:36-37` | "after superpowers:writing-plans; before superpowers:executing-plans or\n  subagent-driven-development" |
| `skills/plan-review/SKILL.md:38-40` | "authoring plans (superpowers:writing-plans) … design docs\n  (superpowers:brainstorming)" |
| `skills/plan-review/SKILL.md:83` | "send the plan back to superpowers:writing-plans" |
| `skills/plan-review/SKILL.md:85` | "(superpowers:executing-plans or subagent-driven-development)" |
| `skills/plan-review/SKILL.md:109` | "Round 4. (Stop; back to superpowers:writing-plans.)" |
| `skills/plan-review/references/rubric.md:89-91` | "not by\n  superpowers:executing-plans, not by subagent-driven-development" |
| `skills/prd-review/SKILL.md:28` | "must not proceed to design (superpowers:brainstorming)" |
| `skills/prd-review/SKILL.md:38` | "design docs\n  (superpowers:brainstorming owns those)" |
| `skills/prd-review/SKILL.md:70` | "(user review gate → superpowers:brainstorming)" |
| `skills/prd-review/references/rubric.md:76-77` | "must not proceed to design\n  (superpowers:brainstorming)" |
| `skills/writing-prds/SKILL.md:16-17` | "how to build it belongs to superpowers:brainstorming,\nwhich this skill hands off to at the end" |
| `skills/writing-prds/SKILL.md:31-32` | "(superpowers:brainstorming),\n  implementation planning (superpowers:writing-plans)" |
| `skills/writing-prds/SKILL.md:60` | "offer superpowers:brainstorming for technical design" |
| `skills/writing-prds/references/prd-template.md:48` | "technical design → superpowers:brainstorming, after approval." |

**Pattern:** Group 1d (fossils / migration-relative phrasing) + Group 2 (volatile
specifics — stale references that rot as code ships).
**Why obsolete:** The plugin was disabled 2026-07-29 (`CHANGELOG.md:213`); the owner's
routing standard sends approved specs to `lean-plans` and execution to `lean-sdd`, and
this repo ships `lean-brainstorming` as the design skill. Fable 5.1 follows named
references literally and delegates reliably — a handoff instruction naming an
uninstallable skill either dead-ends the flow or invites the model to improvise a
substitute, which is exactly the free-hand behavior these gates exist to prevent.
**Action:** rewrite to the lean-suite equivalents (`lean-plans`, `lean-sdd`,
`lean-brainstorming`). Diff hunks 1a–1e.

### 2. The 3-round cap is prose only, and is documented as violated — **High** — `add`

**Location:** `skills/plan-review/workflows/review.mjs:21` (`const round = opts.round || 1`)
and `skills/prd-review/workflows/review.mjs:18`; the rule lives at
`skills/plan-review/SKILL.md:82` ("Maximum 3 rounds") and `:109` ("Round 4. (Stop…)"),
`skills/prd-review/SKILL.md:66` and `:90`.
**Evidence:** `docs/debriefs/2026-08-29.md:12` — *"The plan-review council ran **9 rounds
across 3 fix-cycles without ever passing** (79.2 → best 84.3) … ended only by the user's
explicit override at 14:53Z."*
**Pattern:** Group 1d, "Unenforced instructions: rules no code path, eval, or reviewer
checks — visibly violated in the app's own transcripts… Enforce in code what can be
enforced in code."
**Why obsolete:** Not obsolete so much as never enforced — but the failure mode is
Fable-5.1-shaped: it sustains very long autonomous runs and will keep iterating a loop
that nothing stops ("Maximizing long-horizon execution" — it does not stop on its own,
and the guidance explicitly warns to plan for minutes-long, self-continuing turns). The
one place a stop can be made unambiguous is the script the loop calls.
**Action:** add a `MAX_ROUNDS` guard that throws with the routing instruction in the
message. Diff hunks 2a, 2b.

### 3. `plan-visualizer` red flag enumerates model aliases as banned strings — **High** — `rewrite`

**Location:** `skills/plan-visualizer/SKILL.md:76-77`
**Evidence:** "The word \"suggested\", \"assign\", \"opus\", \"sonnet\", or \"review
order\" is in your visualization."
**Pattern:** Group 2 (volatile specifics: hardcoded names with no verification date).
**Why obsolete:** The check is a literal string list and is already incomplete — the
Agent tool's current model set is `'sonnet' | 'opus' | 'haiku' | 'fable'`, so a
visualization printing "fable (orchestration)" or "haiku (reading)" passes this red flag
while committing precisely the violation it guards. The prohibition itself is a keeper —
`tests/scenarios/plan-visualizer/RED-baseline.md` scenario 3 documents the real failure
("a 'Suggested model (risk-tier standard)' column (`opus (engineering)`, `sonnet (grunt
work)`) and a 'Suggested review order' section"). Only the enumeration should go.
**Action:** rewrite the red flag as the category rather than the current alias list. Diff
hunk 3.

### 4. Skeptic prompt: one-sided adversarial framing with no evidence floor — **Medium** — `rewrite`

**Location:** `skills/plan-review/workflows/review.mjs:115-119`;
`skills/prd-review/workflows/review.mjs:91-95`
**Evidence:** "scored dimension \"${d.label}\" at ${g.score}/100 — **suspiciously
high**. Your **ONLY** job is to find checklist violations the grader **MISSED**." …
"return an empty missedViolations array — **but only then**."
**Pattern:** Group 1a (pressure language: emphasis stacking, "ONLY", caps) + Group 1c
(describing failure instead of success; one-sided framing anchors toward the framed
outcome).
**Why obsolete:** Calibrated against Sonnet 4.x graders whose RED-baseline failure was
generosity (`tests/scenarios/prd-review/RED-baseline.md`: *"a subtler PRD than this
fixture would sail through on generosity"*). Fable 5.1 is documented as very responsive
to explicit instruction weight — the same pressure that corrected a lenient Sonnet
grader now produces marginal findings on a clean document, which is a direct contributor
to the non-convergence in `docs/debriefs/2026-08-29.md:12` (nine rounds, best 84.3, and
the day's one genuine Critical bug caught by a *different* reviewer entirely, not by any
skeptic). The corrected shape already exists in-repo: `agents/finding-skeptic.md` —
"DEFAULT TO REFUTED… quote what is really there." **Additionally**, the skeptic runs at
`effort: 'low'` (L177 / L118) and must read two files; Fable 5.1 at `low` effort "calls
a search or retrieval tool less often… and answers from memory more", so the prompt also
needs an explicit read-and-quote grounding clause. The rewrite carries both.
**Action:** replace the framing and add an evidence floor plus a stated symmetric
default. Diff hunks 4a, 4b.

### 5. Grader prompt recaps only the deflationary rules, and has no grounding clause — **Medium** — `rewrite`

**Location:** `skills/plan-review/workflows/review.mjs:106-111` (and the lite variant at
`:136-140`); `skills/prd-review/workflows/review.mjs:82-87`
**Evidence:** "Rules (from the rubric, **non-negotiable**):\n- Score 0-100 anchored to
the bands; when torn between two bands take the **LOWER**.\n… - A score >= 90 requires
affirmative excellenceEvidence quotes"
**Pattern:** Group 1a (emphasis with no adjacent reason: "non-negotiable", "LOWER" in
caps) + Group 1c (padding / one-sided restatement — the recap selects only the half of
the rubric that pushes scores down).
**Why obsolete:** The rubric's band anchors are two-sided (`references/rubric.md:16-24`),
but nothing in any prompt tells a grader that a section meeting a band earns that band.
Every restated rule is deflationary, and the one score that triggers an adversarial pass
is 90 — so the prompt system makes 89 the safe answer. On Sonnet 4.x, which needed the
push, that trade was worth it; Fable 5.1 weights explicit instructions more heavily, so
the same asymmetry biases harder. Keep-list item 10 protects the recap itself (a single
restatement of key constraints is a reasonable pattern) — the finding is the
*one-sidedness*, not the recap. The same hunk adds the read-and-quote grounding clause
Fable 5.1's "ground progress claims" guidance calls for ("audit each claim against a tool
result from this session").
**Action:** add one symmetric sentence and a grounding clause; drop the "non-negotiable"
booster. Diff hunks 5a, 5b.

### 6. Deterministic structural checks re-derived by LLM graders — **Medium** — `add`

**Location:** `skills/plan-review/SKILL.md:42-56` (The Loop) and
`skills/plan-review/workflows/review.mjs:100-113` (gradePrompt)
**Evidence:** rubric D1 "dependencies explicit"; D6 "No contradictions between the plan's
own sections", "No TBD owner or placeholder"; against
`skills/plan-visualizer/references/render-contract.md:28-38`, which lists `cycle`,
`dangling-dependency`, `consumes-without-dependency`, `concurrent-file-overlap`,
`task-missing-from-table`, `file-drift`, `missing-risk-tier` as parser output with plan
line numbers.
**Pattern:** Group 4, "An LLM executor for a deterministic plan… count the model-call
sites and ask of each whether its inputs fully determine its output."
**Why obsolete:** The parser is deterministic, tested (`plan-graph.test.mjs`, 13 unit
tests), in this same plugin, and already invoked by plan-visualizer. Feeding its findings
into the council removes work whose inputs fully determine its output from 6–18 model
calls per round and leaves the graders the judgment layer, which is the whole point of
the rule. The reliability argument is the repo's own: *"one baseline agent found both
blocking defects by hand, another found none. Hand-checking is luck."*
(`tests/scenarios/plan-visualizer/RED-baseline.md`). Note the workflow script API exposes
only `agent`/`parallel`/`pipeline`/`phase`/`log` — no shell — so the parser runs in the
SKILL.md step and its findings pass in via `args`.
**Action:** add a structural pre-pass step to The Loop and thread
`args.structuralFindings` into the grade prompt. Diff hunks 6a, 6b.

### 7. Trait-claim / incident narrative about the unaided model — **Medium** — `rewrite`

**Location:** `skills/prd-success-metrics/SKILL.md:14-16`
**Evidence:** "Notably, the default resists fabrication when someone *names* the trap
(\"just make up numbers\"); it fails on the plain everyday ask. This skill applies the
same discipline to the everyday ask."
**Pattern:** Group 1a (`you (tend to|often|sometimes)` trait claims) + Group 2 (history
narratives — "A rule's authority is the behavior it prescribes, not the incident that
motivated it").
**Why obsolete:** The claim is a summary of three Sonnet subagent runs on 2026-07-23
(`tests/scenarios/prd-success-metrics/RED-baseline.md` — scenarios 2 and 3 PASS, scenario
1 FAIL) and is stated as a standing property of "the default". It prescribes no behavior;
the two sentences before it already carry the context the model needs, and the five
numbered Rules carry the requirement. The scoping information ("this applies to the
plain, un-flagged ask") is worth keeping — the archaeology is not.
**Action:** rewrite to one scoping sentence. Diff hunk 7.

### 8. `walkthrough-tutor` lacks a turn-boundary precedence line — **Medium** — `add`

**Location:** `skills/walkthrough-tutor/SKILL.md:19-22` (Core principle)
**Evidence:** "**(1) turn-taking, always — teach one layer, then STOP and wait**"
**Pattern:** Group 4 / keep-list item 11 — "Re-baselining adds text too… matching a
prompt to a new model sometimes means *adding* guidance for the new model's failure
modes."
**Why obsolete (direction: add):** Fable 5.1's recommended autonomy block says the
opposite of this skill's core contract, in almost these words: *"Before ending your turn,
check your last paragraph. If it is a plan, an analysis, a question, a list of next
steps… do that work now with tool calls. End your turn only when the task is complete or
you are blocked on input only the user can provide."* Every walkthrough-tutor turn ends
on a question by design. Where that block is in force (autonomous runs, harnesses that
carry it), a Fable 5.1 agent can read the comprehension check as a promise to resolve
itself — and resolve it by delivering the rest, which is precisely the wall-of-text
failure the RED baseline documents ("every baseline dumped the entire explanation in a
single message"). One sentence naming the learner's reply as the blocking input
reconciles them. The skill's existing prohibitions are keepers: Fable 5.1 is documented
to "elaborate beyond what the task needs" at higher effort, so the dump failure plausibly
still reproduces.
**Action:** add one sentence to the Core principle block. Diff hunk 8.

---

## Flag-only (no diff proposed)

### 9. `superpowers:*` in frontmatter descriptions — **Low** — `flag`

`skills/plan-review/SKILL.md:3`, `skills/prd-review/SKILL.md:3`,
`skills/writing-prds/SKILL.md:3`. Per the brief, description text is trigger/routing
context and stale plugin names there are Low. They will keep matching user phrasing
("after writing-plans") harmlessly; fix them opportunistically alongside Finding 1 if the
owner takes that hunk, but the failure mode is not the same as a body-level dangling
handoff.

### 10. `prd-review`'s gate has no blocking-violation term, but its selector uses one — **Low** — `flag`

`skills/prd-review/workflows/review.mjs:155` computes `pass = councilComplete && overall
>= 95 && floorBreaches.length === 0` — no blocking term — while `:103` filters
`priorDimensions` on `v.severity === 'blocking'` to choose what to re-grade, and the
schema at `:43` collects the severity. `plan-review` has the term (`:216`). Consequence:
a PRD can PASS at ≥95 with an outstanding blocking violation, and the dimension carrying
it is re-graded every round without that ever affecting the verdict. This is a genuine
inconsistency between two near-identical engines, but resolving it changes the gate's
pass condition in one direction or the other, which the brief places out of scope. Named
here for the owner; no hunk proposed.

### 11. Skeptics run at `effort: 'low'` — **Low** — `flag`

`skills/plan-review/workflows/review.mjs:177`, `skills/prd-review/workflows/review.mjs:118`.
Fable 5.1 at `low` effort "calls a search or retrieval tool less often than Claude Fable
5 and answers from memory more" — a two-file-reading verification role is the shape most
exposed to that. Finding 4's rewrite adds the grounding clause that mitigates it without
a cost change; raising effort is the alternative lever, but given the documented
over-blocking it is the owner's call, not the audit's.

### 12. The two `review.mjs` engines are near-duplicates — **Low** — `flag`

`GRADE_SCHEMA` and `SKEPTIC_SCHEMA` are byte-identical; the three prompt templates differ
only in the noun ("plan" / "PRD"), the fix-classification examples, and the rubric path;
the gate differs by two constants and the blocking term; `plan-review` additionally has
lite mode. Group 4's "redundant specialist sub-agents" row argues for one engine taking
the distinction as input. This is real duplication, but it is *working* duplication that
the two skills currently need to diverge on (Finding 10 is the one place they disagree by
accident rather than by design) — keep-list item 8 applies. Noted; consolidation is a
refactor, not an audit fix.

---

## Clean files

- `skills/prd-scoping/SKILL.md` — **clean.** Every prohibition is provenance-backed by
  `tests/scenarios/prd-scoping/RED-baseline.md`: rule 2 (Out-of-scope survives deletion
  pressure) traces to scenario 3's documented FAIL ("Cutting the section and rewriting
  the scope as a positive list"); rule 1 (decomposition first) to scenario 2's PARTIAL
  FAIL on the Atlas bundle; rule 3's Must-budget to scenario 1. Fable 5.1's
  strong-instruction-following makes the social-pressure compliance failure in scenario 3
  plausible still (the model complies with an explicit user request to drop a section),
  so these are keepers.
- `skills/prd-user-stories/SKILL.md` — **clean.** The banned-adjective list at `:30`
  ("never \"fast\", \"clean\", \"clear\", \"gracefully\", \"near-real-time\"") reads like
  a Group 1e tic list, but it is not: the RED baseline records those exact strings from
  the unaided runs ("near-real-time", "clear feedback", "opens cleanly", "clear error").
  Provenance-backed prohibition — keep (keep-list item 5).
- `skills/plan-visualizer/references/render-contract.md` — **clean.** Section order and
  finding-kind table are a format contract for a generated file, which is the
  format-sensitive case keep-list item 7 protects.
- `skills/plan-visualizer/scripts/plan-graph.mjs` — **clean.** Zero model calls; the
  Group 4 counter-example.
- `skills/writing-prds/references/prd-template.md` — clean apart from the `:48`
  superpowers reference folded into Finding 1.

---

## Step 6 — proposed diff

One hunk per finding (Finding 1 spans five files, one hunk per file region). High and
Medium confidence only. **Nothing has been applied.**

### Finding 1 — dangling `superpowers:*` routing targets

#### 1a — `skills/plan-review/SKILL.md`

```diff
--- a/skills/plan-review/SKILL.md
+++ b/skills/plan-review/SKILL.md
@@ -24,7 +24,7 @@
 <HARD-GATE>
 A plan that has not PASSED (overall ≥85 AND every dimension ≥80 AND zero
-blocking-severity violations, from an actual council run) must not be executed — not by superpowers:executing-plans, not by
-subagent-driven-development, not by a human "picking up task 1". There is no safe
+blocking-severity violations, from an actual council run) must not be executed — not by
+soltero-skills:lean-sdd, not by any other executor, not by a human "picking up task 1". There is no safe
 subset: severity and task-safety come from the rubric, not from a deadline, a loaded
 sprint board, or who skimmed it. You never green-light on your own read, you never
 adjust or estimate a score, and you never re-review your own fixes.
@@ -34,10 +34,10 @@
 - **Use:** any request to review/grade/approve an implementation or execution plan;
-  after superpowers:writing-plans; before superpowers:executing-plans or
-  subagent-driven-development; re-review after revisions.
-- **Don't use:** authoring plans (superpowers:writing-plans), PRDs
+  after soltero-skills:lean-plans; before soltero-skills:lean-sdd; re-review after
+  revisions.
+- **Don't use:** authoring plans (soltero-skills:lean-plans), PRDs
   (soltero-skills:prd-review), code diffs (/code-review), or design docs
-  (superpowers:brainstorming).
+  (soltero-skills:lean-brainstorming).
@@ -80,9 +80,9 @@
    author cannot be the checker. Maximum 3 rounds; still BLOCKED → report what blocks
-   and send the plan back to superpowers:writing-plans.
+   and send the plan back to soltero-skills:lean-plans.
 6. **On PASS:** record the score and hand off to execution
-   (superpowers:executing-plans or subagent-driven-development).
+   (soltero-skills:lean-sdd).
@@ -107,4 +107,4 @@
 - You answered an owner question yourself to keep the round moving.
-- Round 4. (Stop; back to superpowers:writing-plans.)
+- Round 4. (Stop; back to soltero-skills:lean-plans.)
```

#### 1b — `skills/plan-review/references/rubric.md`

```diff
--- a/skills/plan-review/references/rubric.md
+++ b/skills/plan-review/references/rubric.md
@@ -86,7 +86,6 @@
 carries a do-not-execute flaw, and that flaw must be fixed (and re-reviewed) before
 PASS — the score cannot outvote it. A BLOCKED plan must not be executed — not by
-  superpowers:executing-plans, not by subagent-driven-development, not "just the
-  early safe tasks" — regardless of sprint boards, deadlines, or prior informal
-  sign-offs.
+  soltero-skills:lean-sdd, not by any other executor, not "just the early safe
+  tasks" — regardless of sprint boards, deadlines, or prior informal sign-offs.
```

#### 1c — `skills/prd-review/SKILL.md`

```diff
--- a/skills/prd-review/SKILL.md
+++ b/skills/prd-review/SKILL.md
@@ -25,7 +25,7 @@
 A PRD that has not PASSED (overall ≥95 AND every dimension ≥80, from an actual council
-run) must not proceed to design (superpowers:brainstorming), planning, implementation,
+run) must not proceed to design (soltero-skills:lean-brainstorming), planning, implementation,
 or "just the safe parts in parallel." Deadlines, contractor retainers, prior informal
@@ -36,7 +36,7 @@
 - **Don't use:** reviewing code diffs (/code-review), design docs
-  (superpowers:brainstorming owns those), or writing PRD content
+  (soltero-skills:lean-brainstorming owns those), or writing PRD content
   (soltero-skills:writing-prds and its children).
@@ -68,4 +68,4 @@
 5. **On PASS:** record the score in the report and hand back to the writing-prds flow
-   (user review gate → superpowers:brainstorming).
+   (user review gate → soltero-skills:lean-brainstorming).
```

#### 1d — `skills/prd-review/references/rubric.md`

```diff
--- a/skills/prd-review/references/rubric.md
+++ b/skills/prd-review/references/rubric.md
@@ -74,5 +74,5 @@
 - **BLOCKED:** anything else. A BLOCKED PRD must not proceed to design
-  (superpowers:brainstorming), planning, or implementation — no exceptions for
+  (soltero-skills:lean-brainstorming), planning, or implementation — no exceptions for
   deadlines, sunk contractor costs, or prior informal sign-offs.
```

#### 1e — `skills/writing-prds/SKILL.md` and `references/prd-template.md`

```diff
--- a/skills/writing-prds/SKILL.md
+++ b/skills/writing-prds/SKILL.md
@@ -15,7 +15,7 @@
 This skill replaces that with dialogue: requirements are **elicited, not defaulted**. The
-PRD says what to build and why; how to build it belongs to superpowers:brainstorming,
+PRD says what to build and why; how to build it belongs to soltero-skills:lean-brainstorming,
 which this skill hands off to at the end.
@@ -30,4 +30,4 @@
-- **Don't use:** technical design of an already-agreed feature (superpowers:brainstorming),
-  implementation planning (superpowers:writing-plans), or filling in a single PRD section
+- **Don't use:** technical design of an already-agreed feature (soltero-skills:lean-brainstorming),
+  implementation planning (soltero-skills:lean-plans), or filling in a single PRD section
   when a PRD already exists (use the matching child skill directly).
@@ -59,3 +59,3 @@
-10. **Hand off** — offer superpowers:brainstorming for technical design. That is the
+10. **Hand off** — offer soltero-skills:lean-brainstorming for technical design. That is the
     ONLY next step; never jump to implementation.
--- a/skills/writing-prds/references/prd-template.md
+++ b/skills/writing-prds/references/prd-template.md
@@ -46,3 +46,3 @@
 ## 9. Out of the PRD's hands
-Explicit pointer: technical design → superpowers:brainstorming, after approval.
+Explicit pointer: technical design → soltero-skills:lean-brainstorming, after approval.
```

### Finding 2 — enforce the round cap in code

#### 2a — `skills/plan-review/workflows/review.mjs`

```diff
--- a/skills/plan-review/workflows/review.mjs
+++ b/skills/plan-review/workflows/review.mjs
@@ -21,7 +21,12 @@
 const round = opts.round || 1
 const priorDimensions = opts.priorDimensions || null
 const lite = opts.mode === 'lite'
 if (!planPath || !rubricPath) throw new Error('args.planPath and args.rubricPath are required')
+
+const MAX_ROUNDS = 3
+if (round > MAX_ROUNDS) {
+  throw new Error(`Round ${round} exceeds the ${MAX_ROUNDS}-round cap. A plan still BLOCKED after ${MAX_ROUNDS} rounds goes back to soltero-skills:lean-plans for a rewrite; report what blocks and stop. Do not convene another council round.`)
+}
```

#### 2b — `skills/prd-review/workflows/review.mjs`

```diff
--- a/skills/prd-review/workflows/review.mjs
+++ b/skills/prd-review/workflows/review.mjs
@@ -17,5 +17,10 @@
 const round = opts.round || 1
 const priorDimensions = opts.priorDimensions || null
 if (!prdPath || !rubricPath) throw new Error('args.prdPath and args.rubricPath are required')
+
+const MAX_ROUNDS = 3
+if (round > MAX_ROUNDS) {
+  throw new Error(`Round ${round} exceeds the ${MAX_ROUNDS}-round cap. A PRD still BLOCKED after ${MAX_ROUNDS} rounds goes back to soltero-skills:writing-prds; report what blocks and stop. Do not convene another council round.`)
+}
```

### Finding 3 — `plan-visualizer` red flag: category, not alias list

```diff
--- a/skills/plan-visualizer/SKILL.md
+++ b/skills/plan-visualizer/SKILL.md
@@ -74,6 +74,6 @@
 - You are typing a mermaid graph or findings list without having run the parser.
-- The word "suggested", "assign", "opus", "sonnet", or "review order" is in your
-  visualization.
+- Your visualization names a model or model tier, assigns a task to an agent, or
+  states a review order — under any wording, in any column.
 - You are about to draw an edge that has no `Depends on` cell behind it.
```

### Finding 4 — skeptic prompt: neutral frame, evidence floor, symmetric default

#### 4a — `skills/plan-review/workflows/review.mjs`

```diff
--- a/skills/plan-review/workflows/review.mjs
+++ b/skills/plan-review/workflows/review.mjs
@@ -113,9 +113,11 @@
-const skepticPrompt = (d, g) => `You are an adversarial skeptic on an implementation-plan review council. A grader scored dimension "${d.label}" at ${g.score}/100 — suspiciously high. Your ONLY job is to find checklist violations the grader MISSED.
+const skepticPrompt = (d, g) => `You are the independent verifier on an implementation-plan review council. A grader scored dimension "${d.label}" at ${g.score}/100. Scores in this band get a second pass because a generous grade and a genuinely excellent plan read the same way from one pass; your job is to tell those two apart by re-checking the checklist yourself.
 
 Read the rubric (${rubricPath}) — dimension ${d.label}'s checklist — and the plan (${planPath}). Check every checklist item explicitly against the plan. The grader already found these violations (do NOT re-report them): ${JSON.stringify(g.violations.map(v => v.checklistItem + ': ' + v.quote.slice(0, 80)))}
 
-Report only NEW missed violations, each with a verbatim plan quote and the checklist item it breaks. If after checking every item you genuinely find nothing new, return an empty missedViolations array — but only then.`
+Report a missed violation only when you can name the checklist item it breaks and quote the plan line that breaks it, copied verbatim from the file you read in this session — not paraphrased, not inferred from what the plan omits unless the checklist item is about an omission, and never a stylistic preference. Where a checklist item is satisfied, or the evidence is ambiguous, that item yields nothing.
+
+Both outcomes are correct results. An empty missedViolations array is the right answer when the grade was earned; say so in reasoning, naming the items you checked.`
```

#### 4b — `skills/prd-review/workflows/review.mjs`

```diff
--- a/skills/prd-review/workflows/review.mjs
+++ b/skills/prd-review/workflows/review.mjs
@@ -89,9 +89,11 @@
-const skepticPrompt = (d, g) => `You are an adversarial skeptic on a PRD review council. A grader scored dimension "${d.label}" at ${g.score}/100 — suspiciously high. Your ONLY job is to find checklist violations the grader MISSED.
+const skepticPrompt = (d, g) => `You are the independent verifier on a PRD review council. A grader scored dimension "${d.label}" at ${g.score}/100. Scores in this band get a second pass because a generous grade and a genuinely excellent section read the same way from one pass; your job is to tell those two apart by re-checking the checklist yourself.
 
 Read the rubric (${rubricPath}) — dimension ${d.label}'s checklist — and the PRD (${prdPath}). Check every checklist item explicitly against the PRD. The grader already found these violations (do NOT re-report them): ${JSON.stringify(g.violations.map(v => v.checklistItem + ': ' + v.quote.slice(0, 80)))}
 
-Report only NEW missed violations, each with a verbatim PRD quote and the checklist item it breaks. If after checking every item you genuinely find nothing new, return an empty missedViolations array — but only then.`
+Report a missed violation only when you can name the checklist item it breaks and quote the PRD line that breaks it, copied verbatim from the file you read in this session — not paraphrased, not inferred, and never a stylistic preference. Where a checklist item is satisfied, or the evidence is ambiguous, that item yields nothing.
+
+Both outcomes are correct results. An empty missedViolations array is the right answer when the grade was earned; say so in reasoning, naming the items you checked.`
```

### Finding 5 — grader prompt: two-sided bands, grounding clause, drop the booster

#### 5a — `skills/plan-review/workflows/review.mjs`

```diff
--- a/skills/plan-review/workflows/review.mjs
+++ b/skills/plan-review/workflows/review.mjs
@@ -104,11 +104,12 @@
-Rules (from the rubric, non-negotiable):
-- Score 0-100 anchored to the bands; when torn between two bands take the LOWER.
-- Every violation must quote the offending plan line(s) verbatim (or name the absent task/section) and cite the checklist item.
+Rules (from the rubric):
+- Score 0-100 anchored to the bands. The bands run in both directions: a section that meets a band's description earns that band's score, and when you are genuinely torn between two bands take the lower one. Do not withhold a score the plan has earned, and do not deduct for anything you cannot quote.
+- Every violation must quote the offending plan line(s) verbatim — copied from the file you read in this session, not recalled or paraphrased — or name the absent task/section, and cite the checklist item.
 - A score >= 90 requires affirmative excellenceEvidence quotes; absence of noticed flaws is not evidence.
 - For each violation, propose a concrete fix and classify it: "mechanical" (rewording, reordering, adding verification steps or rollback notes — appliable without a product/ops decision) or "owner-decision" (scope calls, prod-migration strategy, ownership, targets — needs the plan owner).
 - Grade ONLY your dimension; ignore flaws that belong to other dimensions.
```

*(The same two-sided sentence should replace `- Score each dimension 0-100 anchored to
the bands; when torn between two bands take the LOWER.` in the lite prompt at `:137`.)*

#### 5b — `skills/prd-review/workflows/review.mjs`

```diff
--- a/skills/prd-review/workflows/review.mjs
+++ b/skills/prd-review/workflows/review.mjs
@@ -80,9 +80,10 @@
-Rules (from the rubric, non-negotiable):
-- Score 0-100 anchored to the bands; when torn between two bands take the LOWER.
-- Every violation must quote the offending PRD line(s) verbatim (or name the absent section) and cite the checklist item.
+Rules (from the rubric):
+- Score 0-100 anchored to the bands. The bands run in both directions: a section that meets a band's description earns that band's score, and when you are genuinely torn between two bands take the lower one. Do not withhold a score the PRD has earned, and do not deduct for anything you cannot quote.
+- Every violation must quote the offending PRD line(s) verbatim — copied from the file you read in this session, not recalled or paraphrased — or name the absent section, and cite the checklist item.
 - A score >= 90 requires affirmative excellenceEvidence quotes; absence of noticed flaws is not evidence.
```

### Finding 6 — deterministic structural pre-pass

#### 6a — `skills/plan-review/SKILL.md`

```diff
--- a/skills/plan-review/SKILL.md
+++ b/skills/plan-review/SKILL.md
@@ -42,6 +42,15 @@
 ## The Loop
 
+0. **Structural pre-pass (deterministic).** If the plan has a `## Task Dependency
+   Table`, run the bundled parser before convening anyone:
+   `node ${CLAUDE_PLUGIN_ROOT}/skills/plan-visualizer/scripts/plan-graph.mjs <plan.md>`
+   (JSON on stdout; exit 1 means blocking findings exist). Pass the `findings` array
+   through to the workflow as `args.structuralFindings`. Cycles, dangling
+   dependencies, interfaces consumed without a declared dependency, same-wave file
+   overlaps, table↔block file drift and missing risk tiers are facts the parser
+   establishes with plan line numbers — the council's job is the judgment the parser
+   cannot do, not re-deriving these by hand (which the plan-visualizer RED baseline
+   records as unreliable: same model, same plan, one agent found both blocking
+   defects and another found none).
 1. **Size gate, then convene.** Before spending a full council, check the plan's own
```

#### 6b — `skills/plan-review/workflows/review.mjs`

```diff
--- a/skills/plan-review/workflows/review.mjs
+++ b/skills/plan-review/workflows/review.mjs
@@ -19,6 +19,7 @@
 const planPath = opts.planPath
 const rubricPath = opts.rubricPath
 const round = opts.round || 1
 const priorDimensions = opts.priorDimensions || null
 const lite = opts.mode === 'lite'
+const structuralFindings = opts.structuralFindings || []
 if (!planPath || !rubricPath) throw new Error('args.planPath and args.rubricPath are required')
@@ -98,6 +99,10 @@
+const structuralBlock = structuralFindings.length
+  ? `\nA deterministic parser has already analyzed this plan's dependency table and contract blocks. These findings are established facts with plan line numbers — do not re-derive them, and do not contradict them. Count any that fall under your dimension's checklist as violations you did not have to find, and spend your pass on what the parser cannot judge:\n${JSON.stringify(structuralFindings, null, 2)}\n`
+  : ''
+
 const gradePrompt = (d) => `You are one grader on an implementation-plan review council. Grade EXACTLY ONE dimension: ${d.label}.
 
 Read these two files:
 1. The rubric: ${rubricPath} — your dimension's checklist and the band anchors. Follow it exactly.
 2. The plan under review: ${planPath}
-
+${structuralBlock}
 Rules (from the rubric):
```

### Finding 7 — drop the trait narrative

```diff
--- a/skills/prd-success-metrics/SKILL.md
+++ b/skills/prd-success-metrics/SKILL.md
@@ -10,8 +10,7 @@
 Given vague goals ("better UX", "more engagement") and a deadline, the observed default
 is confident fabrication: precise targets ("90% within 7 days", "40% WAU/MAU"), owners
 ("Product Analytics"), and instrumentation (funnels, surveys, ticket tagging) invented
-wholesale and presented as fact — across a sprawl of a dozen-plus metrics so success is
-never falsifiable. Notably, the default resists fabrication when someone *names* the trap
-("just make up numbers"); it fails on the plain everyday ask. This skill applies the same
-discipline to the everyday ask.
+wholesale and presented as fact — across a sprawl of a dozen-plus metrics so success is
+never falsifiable. The rules below apply to the plain, everyday ask, where nobody has
+named the trap and nothing in the request signals that the numbers are being invented.
```

### Finding 8 — walkthrough-tutor turn-boundary precedence

```diff
--- a/skills/walkthrough-tutor/SKILL.md
+++ b/skills/walkthrough-tutor/SKILL.md
@@ -19,6 +19,10 @@
 Core principle, in priority order: **(1) turn-taking, always — teach one layer, then STOP and
 wait; never explain everything and offer to go deeper afterward, offer BEFORE you'd dump. (2)
 Calibrate before you teach. (3) Mental model before code, confirmed before descending. (4)
 Concepts are first-class, taught and reconnected — not footnotes inside the dump.**
 
+In a walkthrough the learner's reply IS the blocking input. Ending a turn on a
+calibration question or a comprehension check is the task being done correctly, not a
+turn left unfinished — a standing instruction to keep working rather than end on a
+question does not apply inside this session.
```

---

## Verification notes (Step 7)

- No hunk removes a prohibition whose failure is documented as still reproducing.
  Findings 3, 4 and 5 preserve every constraint and change only the framing; Finding 7
  preserves the scope and drops only the archaeology.
- Finding 1 requires a grep before it is called done: `grep -rn "superpowers:"` over
  `skills/`, `README.md`, `AGENTS.md`, and `docs/` will surface the eight other skills
  that carry the same references and are outside this report's scope (all `lean-*`, plus
  `mcp/` manifests if any pin skill text).
- Finding 2 changes an error path: any caller that currently passes `round` above 3 will
  now fail loudly. That is the intent, but `mcp/test/*` and any workflow fixture asserting
  a round-4 run should be checked first.
- Finding 6 adds a cross-skill dependency (`plan-review` → `plan-visualizer`'s script).
  Confirm both ship in the same plugin before taking the hunk; the `${CLAUDE_PLUGIN_ROOT}`
  form is already used in `skills/agent-handoff/reference.md:54-55`.
- Findings 4 and 5 are the two that should be A/B'd rather than merged on faith: re-run
  the council against `tests/scenarios/plan-review/fixtures/flawed-widget-plan.md` before
  and after, and confirm the planted flaws are still all caught (the fixture is loud;
  if a rewritten skeptic misses one, the framing was load-bearing after all).
