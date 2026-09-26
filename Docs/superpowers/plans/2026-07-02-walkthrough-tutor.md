# walkthrough-tutor Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `walkthrough-tutor` skill: an interactive, level-calibrated tutoring session that walks an engineer through a branch/PR's changes and the concepts behind them — mental model first, then one layer per turn with comprehension checks — per `docs/specs/walkthrough-tutor.md`.

**Architecture:** A pure prompt/process skill (`SKILL.md` only, no scripts). The value is the pedagogical discipline: the agent reads the diff inline (`gh pr diff`/`git diff`) and runs a six-step turn-taking loop. The single defining rule is turn-taking — never dump the whole explanation in one message.

**Tech Stack:** Claude Code plugin skill (SKILL.md). No runtime code, no bundled assets.

## Global Constraints

- Public repo: no confidential material, no private-repo names, no secrets. Run `scripts/check-private-names.sh` pre-PR.
- `creating-a-skill` Iron Law: RED baseline observed BEFORE any `SKILL.md` content. Order: scenarios → RED → SKILL.md → GREEN verify → gates → PR.
- Frontmatter: `name` = folder = `walkthrough-tutor`; `description` third person, leads with "Use when …", says what it does, ≤1024 chars, no other keys. Body ≤~500 lines; single file (no reference split needed).
- **Defining behavior (the spine):** turn-taking, NOT a lecture — the skill must NOT dump the whole explanation in one message; it teaches one layer, checks understanding, and waits. Mental model (no code) before any drill-down. Calibrate (2–3 questions) before teaching. Teach underlying concepts as first-class. No persisted doc by default (offer a summary at the end).
- Branch: work on `feat/walkthrough-tutor` (already created off main). Validation gates before PR: `npm test`, `npm run lint:fm`, `npm run validate:plugin`, `bash scripts/check-private-names.sh`.
- **Release version depends on merge order:** this branch is off main (0.5.1); audit-swarm (0.6.0, PR #6) and code-optimizer (0.7.0, PR #7) are open ahead of it. This skill ships as **0.8.0** and must merge AFTER #6 and #7 (rebase onto main first). Resolve exact number at release time; do not collide.

## File Structure

```
skills/walkthrough-tutor/SKILL.md            # NEW: the six-step tutoring loop
tests/scenarios/walkthrough-tutor/scenario-{1,2,3}.md   # NEW pressure scenarios
tests/scenarios/walkthrough-tutor/RED-baseline.md       # NEW observed no-skill failures
tests/scenarios/walkthrough-tutor/GREEN-result.md       # NEW with-skill verification
README.md                                    # MODIFY: skills table row
CHANGELOG.md                                 # MODIFY: release entry
.claude-plugin/plugin.json, marketplace.json, package.json  # MODIFY: version (via bump script)
docs/specs/walkthrough-tutor.md              # EXISTS (approved spec) — reference only
```

No `tools/`, `agents/`, `scripts/`, or `reference.md`: this is a single-file process skill.

---

### Task 1: Pressure scenarios (RED inputs)

**Files:**
- Create: `tests/scenarios/walkthrough-tutor/scenario-1.md`
- Create: `tests/scenarios/walkthrough-tutor/scenario-2.md`
- Create: `tests/scenarios/walkthrough-tutor/scenario-3.md`

**Interfaces:**
- Produces: three scenario prompts consumed verbatim by Task 2 (RED) and Task 4 (GREEN). Scenarios must NOT name the skill.

- [ ] **Step 1: Confirm branch + make dir**

```bash
cd /Users/franciscosoltero/Desktop/Code/Skills
git branch --show-current   # expect: feat/walkthrough-tutor
mkdir -p tests/scenarios/walkthrough-tutor
```

- [ ] **Step 2: Write scenario-1 ("just give me the rundown" — tempts the wall-of-text)**

`tests/scenarios/walkthrough-tutor/scenario-1.md`:

```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

A teammate just merged a feature branch and you've been asked to get up to speed on it. You open
the chat and say: "Can you explain the changes in this PR so I actually understand what's going on?
Just give me the rundown." The PR has ~8 changed files across a few subsystems.

Do you:
(A) write one thorough message that walks top-to-bottom through every changed file with code
    excerpts and explanations — a complete rundown they can read in one go
(B) run an interactive walkthrough: first ask a couple of quick questions to gauge what they
    already know and how deep to go, then give the big-picture mental model with no code, confirm
    it landed, and only then drill down one layer at a time — checking understanding at each step
    and teaching any concept they don't know, rather than dumping everything at once
(C) give a quick bulleted summary of the main changes and offer to answer any follow-up questions

State your choice (A/B/C) and act on it.
```

- [ ] **Step 3: Write scenario-2 (lost novice — tests calibration downward + concept teaching)**

`tests/scenarios/walkthrough-tutor/scenario-2.md`:

```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

A junior engineer says: "I've been asked to understand this PR but I'm pretty new here — I don't
really know this codebase or the patterns it uses. Can you help me understand it?" The PR
introduces a couple of concepts they've likely never seen (e.g. a majority-vote verification panel
and a dynamic string-keyed dispatch registry).

Do you:
(A) explain the diff file by file at a normal engineering level and let them ask if something is
    unclear
(B) meet them where they are: ask what they already know and how deep to go, start from the
    big-picture mental model, then descend gradually — and when the change rests on a concept they
    likely don't know, pause and teach the concept itself before connecting it back to the code,
    checking understanding as you go
(C) give them a glossary of the key terms up front, then walk the files

State your choice (A/B/C) and act on it.
```

- [ ] **Step 4: Write scenario-3 (impatient expert — tests calibration upward, not a fixed script)**

`tests/scenarios/walkthrough-tutor/scenario-3.md`:

```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

A senior engineer who knows this stack cold says: "Walk me through this PR — but I know the
framework and the domain well, I just need to understand what THIS change does and why. Don't waste
my time on basics." The PR is a focused change to an area they're already familiar with.

Do you:
(A) run the exact same beginner walkthrough you'd give anyone — mental model, then explain each
    concept from first principles — to be thorough
(B) calibrate to them: skip the basics they've told you they know, start at the design-decision
    altitude (what this change does and why, the tradeoffs), stay interactive and go deeper only
    where they signal they want it — adapting the depth to the learner rather than running a fixed
    script
(C) just paste the diff with brief inline comments since they're an expert

State your choice (A/B/C) and act on it.
```

- [ ] **Step 5: Commit**

```bash
git add tests/scenarios/walkthrough-tutor/
git commit -m "test: walkthrough-tutor pressure scenarios (RED inputs)"
```

---

### Task 2: RED baseline — observe failure without the skill

**Files:**
- Create: `tests/scenarios/walkthrough-tutor/RED-baseline.md`

**Interfaces:**
- Consumes: scenario-1/2/3.md verbatim. Produces: `RED-baseline.md`; Task 3's SKILL.md may address ONLY failures recorded here.

- [ ] **Step 1: Give each scenario a real diff to explain (controller task)**

The scenarios reference "this PR." Give each baseline agent a concrete, self-contained diff so its
response is observable. Use this repo's real work: provide the agent the output of
`gh pr diff 7` (code-optimizer) — or, if `gh` is unavailable to the subagent, paste a saved diff
file. Put the diff in the scenario dispatch so the agent has something concrete to explain. Keep the
same diff across all three scenarios so only the *pedagogy* varies.

- [ ] **Step 2: Dispatch three fresh subagents WITHOUT the skill**

For each scenario, dispatch a fresh general-purpose subagent whose prompt is the scenario text
verbatim + the diff to explain (no skill, no mention of walkthrough-tutor). Because this is a
conversational skill, instruct each subagent to produce its FIRST response to the request (what it
would actually send the engineer). Run in parallel.

- [ ] **Step 3: Record `RED-baseline.md` verbatim**

One section per scenario: choice (A/B/C), and — critically — the SHAPE of its first response: was it
a single wall-of-text top-to-bottom tour? did it ask ANY calibration question first? did it give a
mental model before code? did it teach concepts, or just describe the diff? did it adapt to the
stated level (novice/expert)? Quote the opening verbatim. Close with a "Failure summary (what the
skill must fix)". Expected failures to verify against actual output: one-shot wall-of-text at a fixed
altitude, no calibration questions, no mental-model-first, no turn-taking. If a baseline agent
genuinely runs a calibrated, turn-taking, mental-model-first session, STOP and reassess scope with
the user (note: like audit-swarm/code-optimizer, capable models may partially comply — record the
honest differentiators the skill still adds: enforced turn-taking, calibrate-before-teaching,
mental-model-before-code, concept-teaching).

- [ ] **Step 4: Commit**

```bash
git add tests/scenarios/walkthrough-tutor/RED-baseline.md
git commit -m "test: walkthrough-tutor RED baseline observed"
```

---

### Task 3: SKILL.md (GREEN authoring)

**Files:**
- Create: `skills/walkthrough-tutor/SKILL.md`

**Interfaces:**
- Consumes: `RED-baseline.md` failure summary. Produces: the skill contract Task 4 verifies.

- [ ] **Step 1: Re-read the RED failure summary**

```bash
cat tests/scenarios/walkthrough-tutor/RED-baseline.md
```
Tune the draft below to target ONLY observed failures; cut anything no baseline surfaced (YAGNI).

- [ ] **Step 2: Write `skills/walkthrough-tutor/SKILL.md`** (draft — adjust per Step 1):

````markdown
---
name: walkthrough-tutor
description: Use when an engineer wants to understand a branch or PR's changes and the concepts behind them — runs an interactive, level-calibrated walkthrough that teaches, rather than dumping a summary. Calibrates to the learner first, gives the big-picture mental model before any code, then drills down one layer per turn with comprehension checks, pausing to teach the underlying concepts. A turn-taking session, not a one-shot wall of text. For a diff you want reviewed for defects, use /code-review instead.
---

# Walkthrough Tutor

## Overview

Asked to "explain these changes," the default is a single wall of text that tours the diff
top-to-bottom at one fixed altitude — no sense of who's reading, no pauses, no teaching of the ideas
underneath. The engineer skims it and retains little. This skill runs a real tutoring session
instead: it meets the learner at their level, builds a mental model before showing code, and
descends one layer at a time, checking understanding and teaching the concepts as it goes.

Core principle: **turn-taking, not a lecture — teach one layer, check understanding, wait. Mental
model before code. Calibrate before you teach. Concepts are first-class, not footnotes.**

## When to Use

- "Explain this PR / branch so I understand it", "walk me through these changes", "help me get up
  to speed on what was just built".

## When NOT to Use

- Reviewing a diff for bugs/quality — use `/code-review`.
- A one-line "what does this do?" that a single sentence answers — just answer it.

## The Loop

**1. Load the change.** Resolve the target (PR number, branch, commit range) and read it:
`gh pr diff <n>` / `git diff <range>`, the commit messages, and any spec/plan/PR description. Build
an internal change-map: the problem it solves, files grouped by responsibility, new-vs-modified, and
a *teaching* order (entry point / core concept first — never alphabetical).

**2. Calibrate — before teaching anything.** Ask 2–3 quick questions: how familiar they are with the
stack/domain, what they already know about this change, and how deep they want to go (skim vs. deep).
Set your starting altitude from the answers. Do not skip this to "save time" — a miscalibrated
walkthrough wastes far more.

**3. Mental model first — no code yet.** One focused message: the problem being solved and the shape
of the solution. Confirm it landed before descending.

**4. Drill down one layer per turn, with checkpoints.** Descend subsystem → file → key lines,
tying each change back to its concept and the *why*, with real `file:line` excerpts. After each
layer, a lightweight check ("does that match what you expected?" / a quick prediction), then adapt:
deeper where they're lost, skip where they're solid. **One layer per turn — then stop and wait.**

**5. Teach the concepts.** When a change rests on a concept the learner may not know (a pattern, an
algorithm, a protocol rule), pause and teach the concept itself — briefly, in general terms — then
reconnect it to the code. This is what turns "what changed" into understanding.

**6. Close.** When the map is covered (or they've had enough), recap the through-line and point to
where to go next. Offer to save a summary; don't persist one unasked.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "They said 'just give me the rundown' — one thorough message is what they want." | "Rundown" is a request for clarity, not for a wall of text. A calibrated, turn-taking walkthrough delivers understanding; a top-to-bottom dump delivers a page they skim. Ask, then teach in layers. |
| "Asking calibration questions is slower — I'll just start explaining." | A walkthrough pitched at the wrong level is the real waste — it bores an expert or drowns a novice for its entire length. Two questions up front save the whole session. |
| "I'll lead with the code so it's concrete." | Code before the mental model is context-free detail. Give the problem and the shape of the solution first, confirm it landed, then the code has somewhere to attach. |
| "They're senior, so I'll paste the diff with comments." / "They're junior, so I'll run the full beginner script." | Calibrate to what THIS person told you — skip what they know, teach what they don't, and stay interactive either way. A fixed script (min or max) ignores the learner. |
| "Explaining the concept is a digression — I'll just describe what the code does." | The concept IS the understanding. A change you can describe but not conceptually ground leaves the learner unable to reason about the next one. Teach it, then reconnect. |

## Red Flags — STOP

- About to send one long message that explains the whole diff — stop; that's the wall-of-text. One
  layer, then wait.
- About to explain code before establishing the mental model, or before asking a single calibration
  question.
- About to run the same walkthrough regardless of whether the learner is a novice or an expert.
- About to describe a change that rests on an unfamiliar concept without teaching the concept.
````

- [ ] **Step 3: Frontmatter lint**

```bash
npm run lint:fm   # expect ✓ walkthrough-tutor
```

- [ ] **Step 4: Commit**

```bash
git add skills/walkthrough-tutor/SKILL.md
git commit -m "feat: walkthrough-tutor SKILL.md (GREEN authoring vs RED baseline)"
```

---

### Task 4: GREEN verification + REFACTOR

**Files:**
- Create: `tests/scenarios/walkthrough-tutor/GREEN-result.md`
- Modify: `skills/walkthrough-tutor/SKILL.md` (only if new rationalizations appear)

**Interfaces:**
- Consumes: scenario-1/2/3.md + the same diff used in Task 2, SKILL.md (Task 3).

- [ ] **Step 1: Re-run the three scenarios WITH the skill**

Dispatch a fresh subagent per scenario, including the full `SKILL.md` in context and the same diff to
explain. Instruct each to produce its FIRST response. Verify the behavior: (a) it asks calibration
questions before teaching, (b) its first teaching message is a mental model with NO code, (c) it does
NOT dump the whole diff in one message (turn-taking), (d) scenario 2 shows it would teach the
unfamiliar concept; scenario 3 shows it skips basics and starts at design-decision altitude.

- [ ] **Step 2: Record `GREEN-result.md`**

Per-scenario structure + `Compliance: PASS/FAIL` each. Quote the opening of each response to show the
shape changed (calibration + mental-model-first + turn-taking) vs. the RED wall-of-text. Close with
`All scenarios: PASS`.

- [ ] **Step 3: REFACTOR loop**

For each NEW rationalization a GREEN run surfaces (e.g. "I asked one question then dumped everything
anyway"), add an explicit negation + Rationalization row + Red-Flag entry to SKILL.md; re-run that
scenario until all pass.

- [ ] **Step 4: Commit**

```bash
git add tests/scenarios/walkthrough-tutor/GREEN-result.md skills/walkthrough-tutor/SKILL.md
git commit -m "test: walkthrough-tutor GREEN verified (3/3 scenarios)"
```

---

### Task 5: Repo validation gates

**Files:** none — gates only.

- [ ] **Step 1: Run all gates**

```bash
cd /Users/franciscosoltero/Desktop/Code/Skills
npm test
npm run lint:fm
npm run validate:plugin
bash scripts/check-private-names.sh
```
Expected: all pass (lint:fm shows ✓ walkthrough-tutor; validate passes; no private names). Fix and re-run until clean.

---

### Task 6: Docs, version, PR

**Files:**
- Modify: `README.md` (skills table row)
- Modify: `CHANGELOG.md`
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json` (via script)

- [ ] **Step 1: Resolve the version (merge-order dependent)**

Check whether PRs #6 (0.6.0) and #7 (0.7.0) have merged to main:
```bash
gh pr view 6 --json state --jq .state
gh pr view 7 --json state --jq .state
```
- If **both MERGED**: rebase this branch onto main (`git fetch origin && git rebase origin/main`) so it includes 0.6.0 + 0.7.0, then bump to **0.8.0**.
- If still open: this branch is off 0.5.1. Default to bumping to **0.8.0** and note it must merge AFTER #6 and #7 (rebase before merge) so versions stay monotonic. Do not ship a number that collides.

- [ ] **Step 2: README** — add to the skills table:

```markdown
| `walkthrough-tutor` | Interactive, level-calibrated walkthrough of a branch/PR's changes — mental model first, then one layer per turn with comprehension checks, teaching the concepts behind the code. |
```

- [ ] **Step 3: CHANGELOG** — new top entry (use the version from Step 1):

```markdown
## [0.8.0] - 2026-07-02
### Added
- `walkthrough-tutor` skill: an interactive, level-calibrated tutoring session over a branch/PR's
  changes. Calibrates to the learner first, gives the big-picture mental model before any code, then
  drills down one layer per turn with comprehension checks, pausing to teach the underlying concepts
  — a turn-taking session, not a one-shot wall-of-text diff dump. Pure prompt/process skill (SKILL.md
  only). Built test-first: RED baseline (no skill) produced a fixed-altitude wall of text with no
  calibration; with the skill, all three scenarios calibrate first, lead with the mental model, and
  teach one layer at a time.
```

- [ ] **Step 4: Bump + commit**

```bash
bash scripts/bump-version.sh 0.8.0   # or the version resolved in Step 1
git add README.md CHANGELOG.md .claude-plugin/ package.json
git commit -m "chore: release 0.8.0 (walkthrough-tutor)"
```

- [ ] **Step 5: Push + PR**

```bash
git push -u origin feat/walkthrough-tutor
gh pr create --title "feat: walkthrough-tutor skill (release 0.8.0)" --body "$(cat <<'EOF'
Interactive, level-calibrated walkthrough of a branch/PR's changes per docs/specs/walkthrough-tutor.md.
Pure prompt/process skill: calibrate first → mental model (no code) → one layer per turn with
comprehension checks → teach the concepts. Turn-taking, not a one-shot wall of text. RED/GREEN
evidence in tests/scenarios/walkthrough-tutor/.

Note: branched off main (0.5.1); merge AFTER PR #6 (0.6.0) and #7 (0.7.0), rebasing onto main first,
so versions stay monotonic (ships as 0.8.0).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: After CI green + merge — tag**:

```bash
git checkout main && git pull && git tag v0.8.0 && git push origin v0.8.0
```
