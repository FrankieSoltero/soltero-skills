# Report A — Lean pipeline, hooks, AGENTS.md, agent roster

**Target model (Step 0):** Claude Fable 5.1 (`claude-fable-5-1`). Resolved from the audit
request; corroborated by `skills/lean-sdd/SKILL.md:22` ("The controller session orchestrates
on fable"), which names Fable as the session model these skills drive.

**Scope (Step 0):** every file under `skills/{lean-brainstorming,lean-plans,lean-sdd,lean-tdd,
lean-debugging,lean-verification,lean-worktrees,lean-finishing,creating-a-skill,capture-lesson}`
(24 files incl. references, templates, scripts); `hooks/session-context.md`, `hooks/session-start`,
`hooks/hooks.json`; `AGENTS.md`; `agents/*.md` (4). All read in full. Provenance read from
`tests/scenarios/<skill>/RED-baseline.md` (8 available) and `git blame`.

---

## Summary

**Counts by group:** Group 1a — 0. Group 1b — 1 (M7). Group 1c — 0. Group 1d — 3
(H2, M8, L1). Group 1e — 0. Group 1f — 1 (M3). Group 2 — 4 (M5, L2, L3, L4).
Group 3 — 1 (L7). Group 4 / keep-list item 11 "add" — 5 (H1, M1, M2, M4, M6).
Plus 3 flag-only structural notes (L5, L6, L8). **Total: 18 findings — 2 High,
7 Medium, 9 Low.**

This surface is unusually clean on the classic dated-prompt patterns. Repo-wide greps over
scope found **zero** hardcoded model IDs or version-pinned model names, **zero**
`thinking`/`budget_tokens`/`tool_choice`/`temperature`/`top_p`/`stop_sequences`/prefill
constructs, **zero** "think step by step"/`<scratchpad>` scaffolds, **zero** anti-formatting
rules, and **zero** update suppressors ("hold findings", "don't narrate", "no interim").
Emphasis density (`MUST|NEVER|ALWAYS|CRITICAL|IMPORTANT|STOP` in caps) runs 0-3 occurrences
per file across 24 files — Group 1a is effectively absent, and the few emphases that exist
(three "Iron Law" blocks, one `<HARD-GATE>`) are each a single scoped marker on one
RED-baseline-proven rule, which is exactly the tested-and-scoped use the pattern table
allows. The dominant finding is therefore the *inverse* of a normal audit: this library needs
Fable 5.1 guidance **added**, not removed.

**Three highest-impact findings.**

First, `lean-sdd` orchestrates the longest unattended run in the library — a
many-dispatch, multi-hour pipeline whose controller the file itself pins to Fable — and it
carries no guard against Fable 5.1's documented early-stopping failure. A controller that
ends a turn on "Task 2's review came back clean; I'll dispatch Task 3's implementer next"
silently stalls the whole pipeline, and the ledger (which records only completed tasks)
cannot distinguish that from a real stop. The mitigation is Anthropic's own published
autonomy block, and the skill's existing structure absorbs it in one paragraph.

Second, the implementer prompt template — the single most-dispatched prompt surface in the
repo — is missing three of the four Fable 5.1 coding-agent additions: the scope/test-sprawl
instruction, the targeted-edit instruction, and the autonomy/no-promise block. It already
carries a strong progress-claim discipline ("never write the success line before the run"),
which is the fourth and should stay untouched. Note the honest caveat: `implementer-prompt.md:3-6`
pins dispatches to sonnet/opus, so the Fable-specific rationale is conditional on the
template being reused at Fable tier or the harness default shifting. The scope/test-sprawl
and targeted-edit additions are worth making regardless — both failure modes (unrequested
adjacent fixes, whole-file rewrites) are documented on the Opus-tier models this template
actually dispatches.

Third, `hooks/session-context.md:35-40` injects a six-line paragraph about the superpowers
plugin into **every** session, on `startup|clear|compact`. `git blame` dates it to
2026-07-29, the day superpowers was disabled. It is now a conditional ("If superpowers is
still installed...") whose condition can never be true, describing a plugin the model has no
way to see — the textbook Group 1d fossil, paying its token cost on every session start.

**Keepers, with their provenance** (cited per the brief; none of these are flagged):

- `lean-tdd` Iron Law and the stash/scratch-file loophole closure — `tests/scenarios/lean-tdd/RED-baseline.md`
  records a haiku run choosing "B" nominally then doing `git stash` "as reference via
  `git stash show -p`". lean-sdd dispatches haiku and sonnet by design, so this failure is
  live in this pipeline today.
- `lean-verification` "Never author the conclusion first" — haiku pre-scripted the verbatim
  success line "Done. Full suite still passing (212/212)" before running anything. Fable 5.1's
  own migration guidance recommends precisely this progress-claim audit ("Before reporting
  progress, audit each claim against a tool result from this session"), so this rule is
  *more* current, not less.
- `lean-debugging` no-patch-as-fallback — haiku s1 reintroduced the rejected symptom patch as
  "insurance... a fallback, not Plan A" once the clock ran out.
- `lean-brainstorming` `<HARD-GATE>` — 3/3 default-model baselines skipped the approval gate
  under time pressure. Fable 5.1 is documented to take "unrequested-but-adjacent actions",
  and Anthropic ships a boundary prompt for exactly this ("the deliverable is your
  assessment... Don't apply a fix until they ask"). Keeper, strengthened.
- `lean-sdd` "The contract is not optional" — all three baselines made the right judgment
  calls and then improvised incompatible artifact conventions. This is the skill's whole
  reason to exist.
- `lean-plans` format contract (dependency table + risk tiers) — 0/3 baselines produced risk
  tiers; dependency info appeared as a table, prose, and ASCII art across three runs.
- `lean-worktrees` detection command block and ignore-verification sequence — a fragile git
  operation with exactly one safe order; keep-list item 3.
- `lean-finishing` typed-`discard` confirmation and protected-branch routing — a procedure
  contract for irreversible/policy-gated operations.
- Every `*Derived from superpowers:X (MIT, (c) 2025 Jesse Vincent)*` footer — MIT attribution,
  legally required, not migration phrasing. Only the trailing archaeology clause is flagged (L2).

**Clean files** (no findings): `hooks/hooks.json`, `hooks/session-start`,
`skills/lean-sdd/scripts/{sdd-workspace,review-package,task-brief}`,
`skills/lean-sdd/references/task-reviewer-prompt.md` (except the shared L1),
`skills/creating-a-skill/{SKILL.md,reference.md,templates/*}` (all 5),
`skills/capture-lesson/{reference.md,scripts/append-lesson.mjs}`,
`skills/lean-tdd/SKILL.md`, `skills/lean-verification/SKILL.md`,
`skills/lean-finishing/SKILL.md`, `agents/security-auditor.md`,
`agents/finding-skeptic.md`, `agents/memory-skeptic.md`.

Two things I checked and deliberately did **not** flag: `lean-sdd`'s async-delegation
choreography is already correct for Fable 5.1 — "**In the same message**, check the dependency
table... dispatch its implementer NOW" (`SKILL.md:72-74`) is non-blocking parallel delegation,
the shape the guidance recommends, and "resume the original implementer" maps cleanly onto
`SendMessage`. And model aliases (`opus`/`sonnet`/`haiku`/`fable`) are valid `Agent` tool
values, not stale pins.

---

## Findings

### H1 — lean-sdd has no autonomy / no-promise guard for its long unattended orchestration

| Field | Content |
|---|---|
| **Location** | `skills/lean-sdd/SKILL.md:21-27` (insertion point), affecting the whole Pipeline section `:54-80` |
| **Evidence** | `"**Model policy — no dispatch inherits the session model.** The controller session orchestrates on fable; fable is never dispatched."` — and nowhere in the file's 167 lines is there any instruction about ending a turn, asking permission, or continuing after a dispatch returns. |
| **Pattern** | Group 4 / keep-list item 11 — re-baselining adds text; the "Maximizing long-horizon execution" and "Rare: early stopping" additions |
| **Why obsolete** | The file names Fable as the controller. Fable 5.1 is documented to "occasionally end a turn with a text-only statement of intent ('I'll now run X') without the tool call, or ask permission it doesn't need", specifically "deep into long sessions" and "on complex asynchronous workloads". lean-sdd is the longest asynchronous workload in this repo — N implementers, N reviewers, up to 3 fix rounds each, plus a final review. A stall here is invisible: the ledger records only completed tasks, so a turn ending on "I'll dispatch Task 3 next" leaves no ledger line and looks identical to a clean pause. |
| **Confidence** | **High** |
| **Action** | `add` — see hunk H1 |

### H2 — Dead superpowers paragraph injected into every session

| Field | Content |
|---|---|
| **Location** | `hooks/session-context.md:35-40` |
| **Evidence** | `"This lean suite fully replaces the superpowers plugin's pipeline (brainstorming, writing-plans, executing-plans, subagent-driven-development, systematic-debugging, test-driven-development, verification-before-completion, using-git-worktrees, finishing-a-development-branch, requesting-code-review's reviewer). If superpowers is still installed, prefer the lean skills wherever both claim a flow."` |
| **Pattern** | Group 1d — migration-relative phrasing ("replaces", "still installed"); Group 2 — skill size is a tax paid on every trigger, and this is paid on every `startup`/`clear`/`compact` |
| **Why obsolete** | `git blame` dates this block to `de92717`, 2026-07-29 — the day superpowers was disabled. The conditional's premise can no longer be true, and the enumeration of ten superpowers skill names is a diff against a prompt the model never saw. Per the pattern table: "Write as if current rules are the only rules that ever existed." The routing list above it (`:13-33`) already names every lean skill and its trigger; nothing here adds routing signal. |
| **Confidence** | **High** |
| **Action** | `remove` — see hunk H2 |

### M1 — implementer-prompt lacks the scope / test-sprawl instruction

| Field | Content |
|---|---|
| **Location** | `skills/lean-sdd/references/implementer-prompt.md:44-50` |
| **Evidence** | `"2. Follow existing codebase patterns. If a file you're creating grows well beyond the brief's intent, report DONE_WITH_CONCERNS rather than restructuring on your own."` ... `"4. Self-review before reporting: ... nothing built beyond the brief (YAGNI)?"` |
| **Pattern** | Group 4 / keep-list item 11 — the "Scope and test coverage" addition |
| **Why obsolete** | The existing text covers *file growth* and a *self-review question*, but not the three specific behaviors the guidance documents: fixing pre-existing bugs found while working, extending behavior the task doesn't mention, and committing scratch checks as permanent test files. The guidance's authors "saw far fewer unrequested additions and much less committed test code with no measurable change in task success" with the explicit instruction. This matters more here than in a general coding agent, because `task-reviewer-prompt.md:38` makes "Extra (unrequested features, over-engineering)" a spec-compliance finding — so every unrequested addition costs a fix round the cap only allows three of. |
| **Confidence** | **Medium** |
| **Action** | `add` — see hunk M1 |

### M2 — implementer-prompt lacks the targeted-edit instruction

| Field | Content |
|---|---|
| **Location** | `skills/lean-sdd/references/implementer-prompt.md:33-50` (the "Your Job" section) |
| **Evidence** | No line in the template mentions edit granularity. The nearest is `"Follow existing codebase patterns"`. |
| **Pattern** | Group 4 / keep-list item 11 — the "Whole-file rewrites" addition |
| **Why obsolete** | Fable 5.1 "is more likely than Claude Fable 5 to rewrite an entire file where a targeted edit would do — same result, more output tokens and time". In lean-sdd this is not only a token cost: `scripts/review-package` builds the reviewer's entire view from `git diff -U10`, so a whole-file rewrite of a modified file inflates the reviewed diff to the file's full length and buries the actual change from a haiku SPEC_ONLY reviewer whose only job is character-for-character exactness. Caveat: this template dispatches on sonnet/opus (`:3-6`); the same rewrite tendency is documented on Opus-tier models, and the one-sentence fix is model-general. |
| **Confidence** | **Medium** |
| **Action** | `add` — see hunk M2 |

### M3 — Numeric output cap on the implementer's status reply

| Field | Content |
|---|---|
| **Location** | `skills/lean-sdd/references/implementer-prompt.md:70` and `:77` |
| **Evidence** | `"Then reply with ONLY (under 10 lines):"` ... `"If BLOCKED or NEEDS_CONTEXT, put the specifics in the reply itself."` |
| **Pattern** | Group 1f — numeric output ceilings; Group 1b — "hard word caps (`at most N words`) ... delete and re-baseline" |
| **Why obsolete** | The two lines contradict each other under load: the five-bullet structure already pins the shape for the DONE path, while the BLOCKED path is explicitly told to put its full specifics in the same reply — and a BLOCKED reason worth escalating rarely fits the residue of a 10-line budget. Group 1f is explicit that a stated operational reason does not convert a numeric clamp into a keeper; re-express as audience framing. On the target model the clamp is also the wrong direction — Fable 5.1 under-narrates and its "agentic coding summaries are shorter" already. Removing the number costs nothing: the enumerated bullets do the shaping. |
| **Confidence** | **Medium** |
| **Action** | `rewrite` — see hunk M3 |

### M4 — implementer-prompt lacks the autonomy / no-promise block

| Field | Content |
|---|---|
| **Location** | `skills/lean-sdd/references/implementer-prompt.md:52-54` |
| **Evidence** | `"It is always OK to stop and escalate: BLOCKED (cannot complete — say what you tried and what you need) or NEEDS_CONTEXT (missing information). Bad work is worse than no work; never silently produce work you're unsure about."` |
| **Pattern** | Group 4 / keep-list item 11 — the autonomy block ("You are operating autonomously... The user is not watching") |
| **Why obsolete** | The escalation permission is correct and provenance-backed (lean-sdd `SKILL.md:77-80` has explicit handling for both statuses) and must stay. What is missing is its counterpart: an implementer dispatched inside a pipeline has *no user to ask*, and Fable 5.1's documented failure is ending a turn on a plan or a question rather than a tool call. Without the boundary, "it is always OK to stop" is the only stopping guidance in the template, and a stopped implementer that is neither DONE nor BLOCKED hangs the controller's queue. The published block's opening sentence is load-bearing and is kept verbatim. Same model caveat as M2. |
| **Confidence** | **Medium** |
| **Action** | `add` — see hunk M4 |

### M5 — lean-worktrees' native-tool detection is inaccurate for the current harness

| Field | Content |
|---|---|
| **Location** | `skills/lean-worktrees/SKILL.md:34-39` |
| **Evidence** | "**Native tool (preferred):** if the platform has a worktree tool (`EnterWorktree`, `/worktree`, `--worktree`), use it — it owns placement, branching, and cleanup (paired with `ExitWorktree`)." |
| **Pattern** | Group 2 — volatile specifics / API claims with no verification date; Group 3 — contract accuracy (a description that does not match actual behavior "sends the model down paths no prompt text can fix") |
| **Why obsolete** | On the current Claude Code harness `EnterWorktree` and `ExitWorktree` are **deferred** tools: they are named in a system-reminder but carry no schema until `ToolSearch` loads them, so an agent applying this skill's test — "if the platform *has* a worktree tool" — inspects its callable tool list, does not find one, and falls through to the raw-`git` branch this skill calls "the #1 mistake". The skill's own RED baseline records the correct behavior and the missing step: the s3 run "used ToolSearch to load EnterWorktree". The harness also gained a second native mechanism the skill does not mention — `Agent(isolation: "worktree")` — which is the right choice when the isolated work is a dispatched subtask rather than the session's own. |
| **Confidence** | **Medium** |
| **Action** | `rewrite` + `add` — see hunk M5 |

### M6 — capture-lesson has no dedupe / update / retract rule

| Field | Content |
|---|---|
| **Location** | `skills/capture-lesson/SKILL.md:23-37` |
| **Evidence** | `"Run the bundled script (it creates Docs/mistakes-and-fixes.md if missing and keeps every entry in the same format)"` — and `scripts/append-lesson.mjs:37`: `writeFileSync(file, body.trimEnd() + '\n\n' + entry)`, an unconditional append with no read-back of existing entries. |
| **Pattern** | Group 4 / keep-list item 11 — the "Give it a memory surface" addition |
| **Why obsolete** | This skill *is* the memory surface Fable 5.1 is documented to benefit from, and the guidance's format prescription has four parts, of which this skill implements one (a fixed entry format). The three missing ones are exactly the ones that matter as the file grows: "Don't save what the repo or chat history already records; update an existing note rather than creating a duplicate; delete notes that turn out to be wrong." Fable 5.1 is more proactive than the models this skill was written against, so it will invoke capture-lesson more often — an append-only log with no dedupe rule degrades into near-duplicate entries, and a lesson later proven wrong stays in the file forever, teaching future sessions the wrong thing. |
| **Confidence** | **Medium** |
| **Action** | `add` — see hunk M6 |

### M7 — content-adapter is asked to do exact arithmetic it has no tool for

| Field | Content |
|---|---|
| **Location** | `agents/content-adapter.md:23-24`, with `tools: Read` at `:4` |
| **Evidence** | `"3. **Count characters exactly** against the constraint row for every unit (each tweet, each slide). Report the counts."` and the return template `"Checks: <unit>: <N>/<limit> chars ..."` |
| **Pattern** | Group 1b — "Inline lookup tables, point systems, arithmetic rubrics the model must compute -> data in files or tool results; arithmetic in code. Leave the model the judgment layer." Group 4 — "an LLM executor for a deterministic plan... calls whose inputs fully determine outputs". |
| **Why obsolete** | Character counting is fully determined by its input, and the agent's frontmatter grants only `Read` — it cannot run a counter, so `<N>` is necessarily an estimate rendered in the syntax of a measurement, and the trailing check mark asserts a check that was never performed. Everything downstream (the controller's pass/fail on the platform constraint row) then trusts a fabricated number. The judgment layer this agent genuinely owns — restructuring for the platform's form, preserving the closed claim set — is unaffected. |
| **Confidence** | **Medium** |
| **Action** | `rewrite` — see hunk M7 |

### M8 — Superpowers fallbacks offered in four skill bodies

| Field | Content |
|---|---|
| **Location** | `skills/lean-plans/SKILL.md:90-91`; `skills/lean-plans/references/plan-template.md:3-4`; `skills/lean-brainstorming/SKILL.md:56-57` and `:85-86` |
| **Evidence** | `"execute with soltero-skills:lean-sdd (or superpowers:subagent-driven-development / executing-plans where the lean executor isn't available)"`; `"> **For executors:** execute with soltero-skills:lean-sdd (or > superpowers:subagent-driven-development)."`; `"invoke soltero-skills:lean-plans (or superpowers:writing-plans if the lean pipeline isn't wanted)"`; `"User explicitly wants deep one-question-at-a-time exploration -> superpowers:brainstorming (if that plugin is installed)."` |
| **Pattern** | Group 1d — fossils / migration-relative phrasing in bodies (per the brief, body phrasing is Group 1d; description phrasing is Low and is not flagged here); Group 2 — "menus of alternatives dilute; one default plus an escape hatch" |
| **Why obsolete** | Superpowers was disabled 2026-07-29; every one of these names a skill the model cannot invoke. Each is an alternative offered at a decision point, and Fable 5.1's strong instruction following means an offered alternative gets weighed — the model spends effort establishing that a plugin isn't installed before taking the only real path. `plan-template.md:3-4` is the worst placement: it is copied verbatim into every generated plan file, so the dead reference propagates into artifacts that outlive this repo. Note `lean-plans/SKILL.md:90-91` also names `executing-plans`, which has no lean equivalent at all — worth replacing with the honest instruction (execute the tasks serially yourself) rather than a dangling name. |
| **Confidence** | **Medium** |
| **Action** | `remove` / `rewrite` — see hunks M8a, M8b, M8c |

---

### Low-confidence / flag-only

### L1 — "no preamble" output suppressors in the three reviewer templates

| Field | Content |
|---|---|
| **Location** | `skills/lean-sdd/references/task-reviewer-prompt.md:61`, `re-review-prompt.md:27`, `final-review-prompt.md:52` |
| **Evidence** | `"## Output — your final message IS the report; no preamble"` (and two near-identical variants) |
| **Pattern** | Group 1d — update suppressors written for chatty models |
| **Why obsolete** | Idiom-dating only. "No preamble" is the register of a prompt written against models that opened every reply with a paragraph of throat-clearing; current models don't, and Fable 5.1 explicitly under-narrates. But these reviewers are dispatched on haiku/sonnet/opus (never Fable), their output is a structured report consumed by the controller, and the sentence carries a real contract clause alongside the suppressor ("your final message IS the report" — i.e. don't write it to a file). I cannot tie the suppressor half to documented target-model harm. |
| **Confidence** | **Low** |
| **Action** | `flag` — no edit proposed. If touched later, keep the contract clause and drop only the trailing "; no preamble". |

### L2 — Baseline archaeology in two attribution footers

| Field | Content |
|---|---|
| **Location** | `skills/lean-debugging/SKILL.md:71-73`, `skills/lean-tdd/SKILL.md:80-82` |
| **Evidence** | `"condensed; adds the no-patch-as-fallback clause observed in cheap-tier baselines and the revert-as-honest-exit rule."` / `"condensed; closes the stash/scratch-file loophole observed in cheap-tier baselines and integrates lean-plans behavior tables."` |
| **Pattern** | Group 2 — history narratives ("a rule's authority is the behavior it prescribes, not the incident that motivated it") |
| **Why obsolete** | The MIT attribution must stay. The trailing change-log clause is a diff against the upstream skill, addressed to a reader comparing versions rather than to the model applying the rule. Low harm — it is the last line of the file and the rules it describes are stated in full above it. |
| **Confidence** | **Low** |
| **Action** | `flag` |

### L3 — "The Failure This Prevents" narrative in lean-brainstorming

| Field | Content |
|---|---|
| **Location** | `skills/lean-brainstorming/SKILL.md:23-30` |
| **Evidence** | `"Baseline agents under 'just build it, I've got 15 minutes' reply 'On it — building now', list five design decisions as 'defaults I'm running with (all cheap to change)'..."` |
| **Pattern** | Group 2 — history narratives, past tense in an instruction file |
| **Why obsolete** | Idiom-dating only, and the gate it motivates is a firm keeper (3/3 RED failures; Fable 5.1's documented "unrequested-but-adjacent actions" makes it more relevant). The narrative also carries the *reason*, which keep-list item 1 protects, and its closing sentence ("Defaults-as-design is design skipped: if an answer would change what you build, it blocks") is the operative rule. Flagged only because the surrounding six lines are archaeology the rule does not need. |
| **Confidence** | **Low** |
| **Action** | `flag` |

### L4 — `main` hardcoded as the merge base

| Field | Content |
|---|---|
| **Location** | `skills/lean-sdd/SKILL.md:133-134`, `skills/lean-sdd/references/final-review-prompt.md:66` |
| **Evidence** | "(MERGE_BASE = `git merge-base main HEAD`)" |
| **Pattern** | Group 2 — volatile specifics / hardcoded values |
| **Why obsolete** | Not a model-dated pattern; a portability defect. In a `master`-based or trunk-named repo the command fails, and the failure lands at the final whole-branch review — the last gate before integration. `lean-finishing/SKILL.md:26-27` does this correctly ("Confirm the base branch (plan, conversation, or upstream); if unsure, ask"). Fix would be to defer to the detected base rather than the literal. |
| **Confidence** | **Low** |
| **Action** | `flag` |

### L5 — "fable is never dispatched" as an absolute cost policy

| Field | Content |
|---|---|
| **Location** | `skills/lean-sdd/SKILL.md:21-27` |
| **Evidence** | `"The controller session orchestrates on fable; fable is never dispatched... An omitted model silently inherits fable — the most expensive model — for work a cheaper tier owns."` |
| **Pattern** | Group 1c — strategy coaching; but stated with its reason, so keep-list item 1 mostly protects it |
| **Why obsolete** | Partially. The *mechanism* claim is correct and load-bearing (an omitted `model` does inherit, and that is a real cost bug worth stating). The *policy* rests on "fable = most expensive", which the Fable 5.1 guidance complicates: "At `low`, Claude Fable 5.1 is often competitive with Opus and Sonnet on cost per task while performing better — evaluate low Fable effort against below-frontier usage before reaching for a cheaper model." The Agent tool accepts `model: 'fable'`. Not proposing an edit: this is a cost policy the author owns, and the audit's job is to surface that its premise is now measurable rather than assumed. |
| **Confidence** | **Low** |
| **Action** | `flag` — re-baseline the tier table against low-effort Fable before changing anything |

### L6 — finding-skeptic vs memory-skeptic (inspected under Group 4, judged not redundant)

| Field | Content |
|---|---|
| **Location** | `agents/finding-skeptic.md`, `agents/memory-skeptic.md` |
| **Evidence** | Both: `tools: Read, Grep, Glob, Bash`, `model: sonnet`, "Rules — non-negotiable: READ-ONLY... DEFAULT TO REFUTED/REJECT... Verify against the actual repository/files, not plausibility/the proposer's quotes." |
| **Pattern** | Group 4 — redundant specialist sub-agents |
| **Why obsolete** | It isn't. I ran the check the group prescribes and it comes back negative: the two agents share a frame (adversarial, read-only, default-to-reject) but not a task. memory-skeptic carries 17 lines of per-edit-type rejection criteria (delete/merge/distill/prune/provenance) that have no analogue in finding-skeptic's lens-based verification, and folding them into a merged agent would push domain logic into the dispatch prompt where it is re-sent per call instead of living once in the definition. Recorded here so the check is visible rather than silently omitted. |
| **Confidence** | **Low** |
| **Action** | `flag` — no roster edit proposed |

### L7 — AGENTS.md names a subagent type that does not exist

| Field | Content |
|---|---|
| **Location** | `AGENTS.md:93-95` |
| **Evidence** | "**Named subagent types** (`Explore`, `general-purpose`, `code-reviewer`, etc.) referenced in `SKILL.md` prose -> there is no dispatchable subagent of that name outside Claude Code" |
| **Pattern** | Group 3 — "don't expose tools that are invalid in the current configuration"; Group 2 — volatile specifics |
| **Why obsolete** | `Explore` and `general-purpose` are real current subagent types; `code-reviewer` is not, and a repo-wide grep finds it only inside an MIT attribution line (`final-review-prompt.md:73`, referring to upstream's `code-reviewer.md` file). The sentence's *point* survives, but it teaches a non-Claude-Code agent a name it will then look for. Low impact — AGENTS.md is read once by agents that, by construction, cannot dispatch any of these. Everything else in AGENTS.md checks out: the "six skills bundle a `Workflow` script" claim (`:80-92`) is exactly right — `agent-playbook`, `audit-swarm`, `design-forge`, `plan-review`, `prd-review`, `transcript-reader`, verified by `find`. |
| **Confidence** | **Low** |
| **Action** | `flag` — drop `code-reviewer` from the list if the file is touched |

### L8 — "Rules — non-negotiable:" header across all four agent definitions

| Field | Content |
|---|---|
| **Location** | `agents/content-adapter.md:13`, `finding-skeptic.md:11`, `memory-skeptic.md:13`, `security-auditor.md:11` |
| **Evidence** | `"Rules — non-negotiable:"` |
| **Pattern** | Group 1a — pressure language / emphasis with no adjacent "because" |
| **Why obsolete** | Idiom-dating only, and weakly. Most rules underneath *do* carry their reason ("Bash is for inspection only", "your final message is consumed by a program, not a human"), which is the part that matters. All four agents pin `model: sonnet` in frontmatter, so I cannot tie the register to Fable 5.1 documented behavior, and the constraints themselves (read-only, default-to-reject, evidence-or-it-didn't-happen) are genuine policy constraints that keep-list item 5 protects. |
| **Confidence** | **Low** |
| **Action** | `flag` — no edit proposed |

---

## Step 6 — Proposed diff (High and Medium findings only)

Not applied. One finding per hunk.

### H1 — lean-sdd: autonomy guard for the orchestration loop

```diff
--- a/skills/lean-sdd/SKILL.md
+++ b/skills/lean-sdd/SKILL.md
@@ -27,6 +27,17 @@
 inherits fable — the most expensive model — for work a cheaper tier owns.
 
+**Operating mode — the run is unattended.** This pipeline is a long
+autonomous run: the human is not watching each dispatch and cannot answer
+mid-loop, so asking "shall I dispatch the next task?" blocks everything
+behind it. Dispatches that follow from the plan proceed without asking. Stop
+only for the escalations this skill names: a plan conflict, a BLOCKED task,
+an adjudication that needs the human's call. Before ending a turn, read your
+last paragraph: if it states an intention ("I'll dispatch Task 3's
+implementer next", "next I'll run the final review") rather than reporting a
+completed action, make that dispatch now instead of ending. A turn that ends
+on an intention leaves no ledger line, so the next session cannot tell it
+apart from a finished one.
+
 **The contract is not optional.** Baseline controllers make the right
 judgment calls but improvise artifacts — ad-hoc report paths, verdicts in
```

### H2 — hooks: remove the dead superpowers paragraph

```diff
--- a/hooks/session-context.md
+++ b/hooks/session-context.md
@@ -32,13 +32,6 @@
 - Branch complete, needs integrating → `soltero-skills:lean-finishing`
 - Authoring/editing skills in the soltero-skills repo → `soltero-skills:creating-a-skill`
 
-This lean suite fully replaces the superpowers plugin's pipeline (brainstorming,
-writing-plans, executing-plans, subagent-driven-development, systematic-debugging,
-test-driven-development, verification-before-completion, using-git-worktrees,
-finishing-a-development-branch, requesting-code-review's reviewer). If
-superpowers is still installed, prefer the lean skills wherever both claim a
-flow.
-
 ## Red Flags
```

### M1 — implementer-prompt: scope and test-coverage instruction

```diff
--- a/skills/lean-sdd/references/implementer-prompt.md
+++ b/skills/lean-sdd/references/implementer-prompt.md
@@ -40,10 +40,18 @@
 1. Write tests for the brief's behavior table (every row) and implement until
    they pass — test-first: watch each test fail before implementing; code
    written before its test gets deleted, not stashed. While iterating, run
    the focused test file; run the full suite once before committing.
+   Commit tests for the behavior rows the brief states, sized like the
+   neighboring test files — roughly one focused test per stated behavior.
+   Verify your work however else you like; scratch scripts and quick checks
+   live outside the repository (e.g. under /tmp) and are not committed as
+   permanent test files.
 2. Follow existing codebase patterns. If a file you're creating grows well
    beyond the brief's intent, report DONE_WITH_CONCERNS rather than
    restructuring on your own.
+   If you find a pre-existing bug, a performance concern, or behavior the
+   brief doesn't mention, don't fix, optimize, or extend it here unless the
+   brief's behavior cannot work without it — report it as a follow-up in your
+   report. This is about extras only: implement every row of the behavior
+   table, completely.
 3. Commit with the exact message the brief specifies.
```

### M2 — implementer-prompt: targeted edits

```diff
--- a/skills/lean-sdd/references/implementer-prompt.md
+++ b/skills/lean-sdd/references/implementer-prompt.md
@@ -44,6 +44,10 @@
 2. Follow existing codebase patterns. If a file you're creating grows well
    beyond the brief's intent, report DONE_WITH_CONCERNS rather than
    restructuring on your own.
+   When editing an existing file, edit it surgically rather than rewriting it
+   whole where that gives the same result — the reviewer's whole view of your
+   work is the diff, and a rewritten file buries the actual change in
+   unchanged lines.
 3. Commit with the exact message the brief specifies.
```

### M3 — implementer-prompt: drop the line cap

```diff
--- a/skills/lean-sdd/references/implementer-prompt.md
+++ b/skills/lean-sdd/references/implementer-prompt.md
@@ -67,11 +67,14 @@
-Then reply with ONLY (under 10 lines):
+Then reply with ONLY the following — the detail belongs in the report file,
+not here:
 - Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
 - Commits (short SHA + subject)
 - One-line test summary
 - Concerns, if any
 - The report file path
 
-If BLOCKED or NEEDS_CONTEXT, put the specifics in the reply itself.
+If BLOCKED or NEEDS_CONTEXT, put the full specifics in the reply itself — the
+controller acts on this reply alone, so give it everything it needs to unblock
+you.
```

### M4 — implementer-prompt: autonomy boundary alongside the escalation permission

```diff
--- a/skills/lean-sdd/references/implementer-prompt.md
+++ b/skills/lean-sdd/references/implementer-prompt.md
@@ -52,6 +52,15 @@
 It is always OK to stop and escalate: BLOCKED (cannot complete — say what you
 tried and what you need) or NEEDS_CONTEXT (missing information). Bad work is
 worse than no work; never silently produce work you're unsure about.
+
+Those two statuses are the only stops. You are operating autonomously: the
+user is not watching in real time and cannot answer questions mid-task, so
+asking "Want me to...?" or "Shall I...?" will block the work. For actions
+inside your allowed file list that follow from the brief, proceed without
+asking. Before ending your turn, check your last paragraph: if it is a plan,
+a question, or a promise about work you have not done ("I'll now run the
+suite"), do that work now with tool calls instead. End your turn only when
+the task is complete, or with a BLOCKED / NEEDS_CONTEXT status the controller
+can act on.
```

### M5 — lean-worktrees: current-harness native-tool detection

```diff
--- a/skills/lean-worktrees/SKILL.md
+++ b/skills/lean-worktrees/SKILL.md
@@ -32,6 +32,14 @@
 next to a native tool is the #1 mistake: phantom state the harness can't
 manage. The mechanism is your call, not a question for the user — consent to
 "a worktree" was already given.
 
+A native tool may be deferred rather than absent: on Claude Code,
+`EnterWorktree`/`ExitWorktree` are named in a system-reminder but carry no
+schema until `ToolSearch` loads them, so "not in my callable tool list" is not
+evidence there is no native tool — run `ToolSearch` for it before concluding
+the fallback applies. When the isolated work is a dispatched subtask rather
+than this session's own, `Agent(isolation: "worktree")` gives that subagent its
+own worktree and is the native mechanism for that case.
+
 **Git fallback (only when no native tool exists):**
```

### M6 — capture-lesson: dedupe, update, retract

```diff
--- a/skills/capture-lesson/SKILL.md
+++ b/skills/capture-lesson/SKILL.md
@@ -37,6 +37,13 @@
 If the lesson warrants a regression test, scaffold it now (don't defer) — see `reference.md`.
 
+This file is read by future sessions, so keep it worth reading. Before appending, skim the
+existing entries: if one already covers this root cause, edit that entry in place instead of
+adding a near-duplicate, and note the new occurrence there. Don't record what the repo or the
+commit history already states plainly — the entry earns its place by carrying the lesson, not
+the event. If an entry is later proven wrong, delete it rather than leaving it to teach the
+next session the wrong thing.
+
 ## Red Flags — STOP
```

### M7 — content-adapter: stop asserting counts it cannot compute

```diff
--- a/agents/content-adapter.md
+++ b/agents/content-adapter.md
@@ -21,8 +21,10 @@
 2. **Platform-native, not truncated.** Restructure for the platform's form
    (hook before the fold, thread numbering, carousel slides) per the
    constraint row — don't just cut the source at the limit.
-3. **Count characters exactly** against the constraint row for every unit
-   (each tweet, each slide). Report the counts.
+3. **Mark every unit boundary** the constraint row applies to (each tweet,
+   each slide) with an explicit delimiter, and write each one to sit inside
+   its limit. You have no tool that counts characters, so do not report counts
+   or check marks as if you had measured them — the controller measures.
 4. **Voice rules apply**; slop banlist applies.
 5. You never publish, schedule, or call external services.
@@ -31,7 +33,8 @@
 ADAPTATION (<platform>):
 <the artifact>
 
-Checks: <unit>: <N>/<limit> chars ✓ · CTA preserved: <yes/which>
+Units: <N> units, delimited as above · Limit assumed: <limit from the constraint
+row> · CTA preserved: <yes/which>   (the controller measures actual lengths)
 Claims used: <subset of source table> · Claims added: NONE (required)
 Concerns: <anything that didn't survive adaptation, or "none">
```

### M8a — lean-plans: replace the dead executor fallback

```diff
--- a/skills/lean-plans/SKILL.md
+++ b/skills/lean-plans/SKILL.md
@@ -88,5 +88,5 @@
 Save to `docs/plans/YYYY-MM-DD-<feature>.md` (user preferences override).
 Then offer, in order: gate the plan with soltero-skills:plan-review; execute
-with soltero-skills:lean-sdd (or superpowers:subagent-driven-development /
-executing-plans where the lean executor isn't available).
+with soltero-skills:lean-sdd. Where no skill dispatch is available, the plan
+still executes by hand: work the tasks in dependency order, one at a time.
```

### M8b — plan-template: the dead reference propagates into every generated plan

```diff
--- a/skills/lean-plans/references/plan-template.md
+++ b/skills/lean-plans/references/plan-template.md
@@ -1,8 +1,7 @@
 # [Feature Name] Implementation Plan
 
-> **For executors:** execute with soltero-skills:lean-sdd (or
-> superpowers:subagent-driven-development). The Task Dependency Table below is
-> the scheduling and review-depth contract.
+> **For executors:** execute with soltero-skills:lean-sdd. The Task Dependency
+> Table below is the scheduling and review-depth contract.
```

### M8c — lean-brainstorming: two dead handoff alternatives

```diff
--- a/skills/lean-brainstorming/SKILL.md
+++ b/skills/lean-brainstorming/SKILL.md
@@ -54,5 +54,4 @@
-5. **Hand off:** on approval, invoke soltero-skills:lean-plans (or
-   superpowers:writing-plans if the lean pipeline isn't wanted). Never jump
-   from approval straight into implementation code.
+5. **Hand off:** on approval, invoke soltero-skills:lean-plans. Never jump
+   from approval straight into implementation code.
@@ -84,3 +83,2 @@
-- User explicitly wants deep one-question-at-a-time exploration →
-  superpowers:brainstorming (if that plugin is installed).
+- User explicitly wants deep one-question-at-a-time exploration → ask one
+  question per message and skip the batching, keeping the approval gate.
```

---

## Step 7 note

Three of these are removals of live text (H2, M3, M8) and six are additions (H1, M1, M2, M4,
M5, M6). The additions can be probed with the existing scenario harness: `tests/scenarios/lean-sdd/`
has fixtures and a recorded baseline, and the guidance's own claim for the scope/test-coverage
prompt ("far fewer unrequested additions... no measurable change in task success") is the
metric to reproduce. H1 and M4 want a different probe than the A/B/C scenario format — a
long multi-task run instrumented for turns that end without a tool call. M5 is verifiable
mechanically today: dispatch an agent with `lean-worktrees` in a normal checkout and check
whether it calls `ToolSearch` for `EnterWorktree` before reaching for `git worktree add`.
