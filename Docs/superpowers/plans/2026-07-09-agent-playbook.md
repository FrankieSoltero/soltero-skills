# agent-playbook Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `agent-playbook` skill: a living, tiered best-practices playbook for coding agents, refreshed by a bundled research-sweep Workflow (3-lane sweep → dedupe vs source log → deep-read → skeptic tiering → synthesis diffs), per `docs/specs/agent-playbook.md`.

**Architecture:** Two modes in one SKILL.md. Advisor (default) reads bundled `references/playbook.md` and applies tier-labeled guidance during agent-engineering work. Update mode — allowed only inside this Skills repo — parses `references/source-log.md` for the watermark and seen keys, invokes `workflows/update.mjs` via the Workflow tool, applies the returned markdown diffs to the three reference files, and commits. The orchestrating model never does the research itself.

**Tech Stack:** Claude Code plugin (SKILL.md + bundled references), Workflow tool script (plain JS, `.mjs`, workflow dialect), repo test conventions from `creating-a-skill`.

## Global Constraints

- Public repo: no confidential material, no private-repo names, no secrets — run `scripts/check-private-names.sh` before PR.
- Skill frontmatter: `name` = folder name = `agent-playbook`; `description` third person, leads with trigger, ≤1024 chars; body ≤~500 lines.
- Iron Law (creating-a-skill): RED baseline observed BEFORE `SKILL.md` content is authored. Scenarios → RED → assets → SKILL.md → GREEN.
- Scenarios are OPEN-ENDED — no A/B/C options and no skill names. Lesson from walkthrough-tutor (commit 9b46284): multiple-choice options telegraph the method and produce false GREENs.
- Workflow scripts cannot call `Date.now()`/`new Date()`/`Math.random()` — dates come via `args.sinceDate`/`args.today`.
- Workflow syntax gate is `node tools/check-workflow-syntax.mjs <file>` (workflow dialect: top-level `await`/`return`), NOT plain `node --check`.
- Update mode runs only in this repo (SKILL.md guard); advisor mode is read-only and works anywhere the plugin is installed.
- Nothing enters the playbook without a fetchable source link; the skeptic defaults to demotion (Watch, not Promising) when uncertain; every deep-read candidate gets a source-log disposition (adopted / rejected + why / watch); candidates dropped by the cap are logged via `log()` but NOT written to the source log (they may resurface next sweep).
- Release: bump `0.8.0` → `0.9.0` in both manifests + `package.json` via `scripts/bump-version.sh 0.9.0`; update `CHANGELOG.md`.
- Validation gates before PR: `npm run check` (test + lint:fm + lint:md + check:workflows), `npm run validate:plugin`, `bash scripts/check-private-names.sh`.

## File Structure

```
skills/agent-playbook/SKILL.md                     # NEW skill entry point (two modes)
skills/agent-playbook/workflows/update.mjs         # NEW bundled Workflow script
skills/agent-playbook/references/playbook.md       # NEW living tiered playbook (skeleton → bootstrap-populated)
skills/agent-playbook/references/source-log.md     # NEW watermark + evaluated-source dispositions
skills/agent-playbook/references/changelog.md      # NEW per-sweep digest history
tests/scenarios/agent-playbook/scenario-{1,2,3}.md # NEW open-ended pressure scenarios
tests/scenarios/agent-playbook/RED-baseline.md     # NEW observed no-skill failures
tests/scenarios/agent-playbook/GREEN-result.md     # NEW with-skill verification + smoke-run evidence
package.json                                       # MODIFY: check:workflows gains update.mjs
README.md                                          # MODIFY: skills table row
CHANGELOG.md                                       # MODIFY: 0.9.0 entry
.claude-plugin/plugin.json, marketplace.json, package.json  # MODIFY: version (via script)
```

---

### Task 1: Pressure scenarios (RED inputs)

**Files:**
- Create: `tests/scenarios/agent-playbook/scenario-1.md`
- Create: `tests/scenarios/agent-playbook/scenario-2.md`
- Create: `tests/scenarios/agent-playbook/scenario-3.md`

**Interfaces:**
- Produces: three OPEN-ENDED scenario prompts consumed verbatim by Task 2 (RED) and Task 6 (GREEN). Scenarios must NOT name the skill, must NOT offer multiple-choice options, and must demand action, not advice about action.

- [ ] **Step 1: Confirm branch and create directory**

```bash
cd /Users/franciscosoltero/Desktop/Code/Skills
git checkout feat/agent-playbook
mkdir -p tests/scenarios/agent-playbook
```

- [ ] **Step 2: Write scenario-1 (staying current — the update/persistence failure)**

`tests/scenarios/agent-playbook/scenario-1.md`:

```markdown
IMPORTANT: This is a real scenario. You must decide and act, not defer to a human.

Your team lead says: "Our coding-agent setups feel stale — research on agents and
agentic loops moves fast and we're not tracking it. Get us current on the latest
best practices for building and driving coding agents. And set it up so this
doesn't go stale again — we'll want the same thing next month, without paying to
re-learn what we already reviewed."

Act on this now. Describe exactly what you do, in order, and what artifacts exist
when you're done.
```

- [ ] **Step 3: Write scenario-2 (advisor — the from-memory-advice failure)**

`tests/scenarios/agent-playbook/scenario-2.md`:

```markdown
IMPORTANT: This is a real scenario. You must decide and act, not defer to a human.

You're setting up a new TypeScript monorepo that several engineers will drive with
coding agents daily. Your job right now: write the CLAUDE.md and design the subagent
configuration, applying current best practices for getting good results out of
coding agents. It is mid-2026; assume the state of the art has moved since your
training data.

Act on this now. State each practice you apply and why you trust it.
```

- [ ] **Step 4: Write scenario-3 (hype vetting — the credulity failure)**

`tests/scenarios/agent-playbook/scenario-3.md`:

```markdown
IMPORTANT: This is a real scenario. You must decide and act, not defer to a human.

A teammate links an arXiv preprint from last week: "Reflexive Tree-of-Patches:
self-mutating agent loops double SWE-bench scores." No independent replication yet;
the authors' own benchmark is the only evidence. Your teammate says: "This looks
huge — roll it into all our agent configs today?"

Decide what happens to this technique and act on your decision. Be explicit about
what status the technique ends up with and where that status is recorded.
```

- [ ] **Step 5: Commit**

```bash
git add tests/scenarios/agent-playbook/
git commit -m "test: agent-playbook pressure scenarios (open-ended RED inputs)"
```

---

### Task 2: RED baseline — observe failure without the skill

**Files:**
- Create: `tests/scenarios/agent-playbook/RED-baseline.md`

**Interfaces:**
- Consumes: scenario-1/2/3.md from Task 1 (verbatim).
- Produces: `RED-baseline.md` — verbatim observed behavior; Task 5's SKILL.md content may address ONLY failures recorded here.

- [ ] **Step 1: Dispatch three fresh subagents WITHOUT the skill**

For each scenario file, dispatch a fresh general-purpose subagent whose prompt is exactly the scenario file's content (no mention of agent-playbook, no skill loaded). Run the three dispatches in parallel.

- [ ] **Step 2: Record results verbatim**

`tests/scenarios/agent-playbook/RED-baseline.md` — one section per scenario:

```markdown
# RED baseline — agent-playbook (no skill)

Date: 2026-07-09. Fresh general-purpose subagents, scenario text verbatim, skill absent.

## Scenario 1 (staying current)
- What it actually did: <searches run, sources cited or not, any persistence mechanism created>
- Freshness mechanism: <none / what it proposed>
- Dedup/no-relearn mechanism: <none / what>
- Vetting of claims: <none / how>
- Rationalizations (verbatim quotes): "<...>"

## Scenario 2 (advisor / from-memory advice)
- Practices recommended and their stated basis: <from memory vs sourced>
- Any tiering or confidence labels: <none / what>
- Rationalizations (verbatim quotes): "<...>"

## Scenario 3 (hype vetting)
- Decision on the technique: <adopted/rejected/deferred>
- Vetting performed: <none / what>
- Status recorded anywhere durable: <none / where>
- Rationalizations (verbatim quotes): "<...>"

## Failure summary (what the skill must fix)
- <observed gap 1, e.g. one-shot search dump with no persistence or watermark>
- <observed gap 2, e.g. best practices asserted from training-data memory, unlabeled>
- <observed gap 3, e.g. single-source hype adopted or hand-waved without a tier/disposition>
```

Expected failures (verify against actual output — record what really happened, not this prediction): one-shot web-search dump with no persistent artifact, no seen-log, no tiers; CLAUDE.md advice given from model memory without sources or confidence labels; the hyped technique adopted or rejected by vibes with no durable disposition.

- [ ] **Step 3: Confirm failure observed**

At least one material gap per scenario must be recorded. If a baseline agent genuinely builds a persistent, tiered, deduplicating research pipeline unprompted (unlikely), STOP and reassess skill scope with the user before authoring SKILL.md.

- [ ] **Step 4: Commit**

```bash
git add tests/scenarios/agent-playbook/RED-baseline.md
git commit -m "test: agent-playbook RED baseline observed"
```

---

### Task 3: Reference skeletons (playbook, source-log, changelog)

**Files:**
- Create: `skills/agent-playbook/references/playbook.md`
- Create: `skills/agent-playbook/references/source-log.md`
- Create: `skills/agent-playbook/references/changelog.md`

**Interfaces:**
- Produces: the three files `update.mjs` output is applied to (Task 4 return contract) and advisor mode reads (Task 5). Topic headings in `playbook.md` must exactly match the `TOPICS` list in `update.mjs`: `Context management`, `Agentic loop design`, `Spec & prompting`, `Tool design`, `Verification & self-repair`, `Multi-agent orchestration`, `Memory`.

- [ ] **Step 1: Write `skills/agent-playbook/references/playbook.md`**

```markdown
# Coding-Agent Playbook

Living, tiered best practices for building and driving coding agents. Maintained by
the `agent-playbook` skill's update sweeps in the soltero-skills repo — entries change
via a sweep (or an explicit correction commit), not ad-hoc edits.

**Tiers:** **Proven** — multiple independent sources or benchmarked results ·
**Promising** — single credible source · **Watch** — interesting, unverified.

Entry format (every entry follows it):

> ### <Tactic as one actionable sentence>
> - **Tier:** Proven | Promising | Watch (added YYYY-MM-DD; updated YYYY-MM-DD)
> - **Sources:** [Title](https://...)
> - **Detail:** agent-agnostic statement of the tactic and when it applies.
>   *Tool notes:* Claude Code / Cursor / generic specifics, if any.

## Context management

_No entries yet — populated by sweeps._

## Agentic loop design

_No entries yet — populated by sweeps._

## Spec & prompting

_No entries yet — populated by sweeps._

## Tool design

_No entries yet — populated by sweeps._

## Verification & self-repair

_No entries yet — populated by sweeps._

## Multi-agent orchestration

_No entries yet — populated by sweeps._

## Memory

_No entries yet — populated by sweeps._
```

- [ ] **Step 2: Write `skills/agent-playbook/references/source-log.md`**

```markdown
# Source Log

Every source a sweep deep-read, with its disposition — so rejected sources are never
re-litigated. Keys are arXiv IDs or canonical URLs; the sweep dedupes against this
whole table.

**Last sweep:** none — the next run is the bootstrap (~6-month window).

| Key | Title | Evaluated | Disposition | Reason |
|-----|-------|-----------|-------------|--------|
```

- [ ] **Step 3: Write `skills/agent-playbook/references/changelog.md`**

```markdown
# Playbook Changelog

One digest per sweep, newest first. Each digest states which lanes ran.
```

- [ ] **Step 4: Commit**

```bash
git add skills/agent-playbook/references/
git commit -m "feat: agent-playbook reference skeletons (playbook, source-log, changelog)"
```

---

### Task 4: Workflow script `update.mjs`

**Files:**
- Create: `skills/agent-playbook/workflows/update.mjs`
- Modify: `package.json` (extend `check:workflows`)

**Interfaces:**
- Consumes: `args = {sinceDate: "YYYY-MM-DD", today: "YYYY-MM-DD", seenKeys: string[], playbook: string, bootstrap: boolean}` supplied by SKILL.md (Task 5). `seenKeys` is every value in the source-log Key column.
- Produces: return value `{edits, digest, logEntries, lanes, evaluatedCount, adoptedCount}` where `edits` is `[{topic, action: "add"|"replace", replacesHeading, entryMarkdown}]` (entryMarkdown in the exact playbook entry format), `digest` is a ready-to-append changelog block, and `logEntries` is `[{key, title, url, disposition, reason}]`. SKILL.md tells the orchestrator how to apply each.

- [ ] **Step 1: Write the script**

`skills/agent-playbook/workflows/update.mjs` — complete content:

```js
export const meta = {
  name: 'agent-playbook-update',
  description: 'Coding-agent research sweep: 3-lane search, dedupe vs source log, deep-read, skeptic tiering, playbook diffs',
  phases: [
    { title: 'Sweep', detail: 'arXiv, lab engineering blogs, OSS agent frameworks — parallel lanes' },
    { title: 'Read', detail: 'fetch and read each fresh candidate, extract concrete tactics' },
    { title: 'Verify', detail: 'one skeptic per tactic: refute or assign tier (default demote)' },
    { title: 'Synthesize', detail: 'merge survivors into playbook diffs, digest, log entries' },
  ],
}

const sinceDate = args.sinceDate
const today = args.today
const playbook = args.playbook
const bootstrap = !!args.bootstrap
const seen = new Set((args.seenKeys || []).map(k => String(k).toLowerCase().trim()))
if (!sinceDate || !today || typeof playbook !== 'string') {
  throw new Error('args.sinceDate, args.today, and args.playbook (string) are required')
}
const CAP = bootstrap ? 24 : 12

const TOPICS = [
  'Context management',
  'Agentic loop design',
  'Spec & prompting',
  'Tool design',
  'Verification & self-repair',
  'Multi-agent orchestration',
  'Memory',
]

const CANDIDATES_SCHEMA = {
  type: 'object',
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          title: { type: 'string' },
          url: { type: 'string' },
          source: { type: 'string' },
          published: { type: 'string' },
          claimedTactic: { type: 'string' },
          relevance: { type: 'string' },
          relevanceScore: { type: 'integer', minimum: 1, maximum: 10 },
        },
        required: ['key', 'title', 'url', 'claimedTactic', 'relevance', 'relevanceScore'],
      },
    },
  },
  required: ['candidates'],
}

const TACTICS_SCHEMA = {
  type: 'object',
  properties: {
    readable: { type: 'boolean' },
    whyUnreadable: { type: 'string' },
    sourceSummary: { type: 'string' },
    tactics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          statement: { type: 'string' },
          topic: { type: 'string', enum: TOPICS },
          evidence: { type: 'string' },
          proposedTier: { type: 'string', enum: ['Proven', 'Promising', 'Watch'] },
          toolNotes: { type: 'string' },
        },
        required: ['statement', 'topic', 'evidence', 'proposedTier'],
      },
    },
  },
  required: ['readable', 'tactics'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    survives: { type: 'boolean' },
    tier: { type: 'string', enum: ['Proven', 'Promising', 'Watch'] },
    reasoning: { type: 'string' },
  },
  required: ['survives', 'reasoning'],
}

const SYNTH_SCHEMA = {
  type: 'object',
  properties: {
    edits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string', enum: TOPICS },
          action: { type: 'string', enum: ['add', 'replace'] },
          replacesHeading: { type: 'string' },
          entryMarkdown: { type: 'string' },
        },
        required: ['topic', 'action', 'entryMarkdown'],
      },
    },
    digest: { type: 'string' },
  },
  required: ['edits', 'digest'],
}

const TOOL_HINT =
  'You have WebSearch and WebFetch available — load them via ToolSearch ' +
  '(query "select:WebSearch,WebFetch") before searching. Never fabricate a source: every ' +
  'candidate must come from a page or listing you actually retrieved. '

phase('Sweep')
const LANES = [
  {
    key: 'arxiv',
    prompt:
      `Search arXiv (cs.SE, cs.AI, cs.CL) for papers published between ${sinceDate} and ${today} ` +
      `about coding agents and agentic loops: agent scaffolds, SWE-bench approaches, context ` +
      `management, tool use/design, self-repair and verification loops, multi-agent coding ` +
      `orchestration, agent memory. Prefer papers with concrete, transferable tactics over pure ` +
      `benchmark announcements. Use arXiv IDs (e.g. "2506.01234") as keys.`,
  },
  {
    key: 'lab-blogs',
    prompt:
      `Search engineering blogs of AI labs and agent-tool companies (Anthropic, OpenAI, Google ` +
      `DeepMind, Cursor, Cognition, Factory, and peers) for posts published between ${sinceDate} ` +
      `and ${today} about coding-agent practice: harness design, prompting/spec technique, context ` +
      `management, evaluation, agentic loop tactics. Battle-tested practice beats speculation. ` +
      `Use the canonical post URL as the key.`,
  },
  {
    key: 'oss',
    prompt:
      `Search release notes, changelogs, and design docs of open-source coding agents ` +
      `(OpenHands, Aider, SWE-agent, Claude Code, and peers) for changes landed between ` +
      `${sinceDate} and ${today} that encode agent-practice lessons: loop/scaffold changes, ` +
      `context strategies, verification steps, tool-design decisions. The tactic is what the ` +
      `change teaches, not the feature itself. Use the canonical URL as the key.`,
  },
]

const laneResults = await parallel(LANES.map(l => () =>
  agent(
    TOOL_HINT +
    `You are one search lane in a research sweep for a coding-agent best-practices playbook. ` +
    l.prompt +
    ` Return up to 15 candidates via structured output; relevanceScore 1-10 reflects how ` +
    `actionable the claimed tactic is for someone driving a coding agent.`,
    { label: `sweep:${l.key}`, phase: 'Sweep', schema: CANDIDATES_SCHEMA }
  )
))
const lanes = LANES.map((l, i) => ({ lane: l.key, ok: !!laneResults[i] }))
for (const s of lanes.filter(x => !x.ok)) log(`LANE FAILED: ${s.lane} — digest must disclose this`)

const raw = laneResults.filter(Boolean).flatMap(r => r.candidates)
const fresh = []
const inRun = new Set()
for (const c of raw) {
  const k = String(c.key).toLowerCase().trim()
  const u = String(c.url).toLowerCase().trim()
  if (seen.has(k) || seen.has(u)) { log(`Already in source log, skipping: ${c.title}`); continue }
  if (inRun.has(k) || inRun.has(u)) continue
  inRun.add(k)
  inRun.add(u)
  fresh.push(c)
}
fresh.sort((a, b) => b.relevanceScore - a.relevanceScore)
const picked = fresh.slice(0, CAP)
for (const d of fresh.slice(CAP)) log(`Over cap (${CAP}), not evaluated this sweep: ${d.title} (${d.key})`)
log(`Sweep: ${raw.length} raw candidates, ${fresh.length} fresh after dedupe, evaluating ${picked.length}`)

const evaluated = await pipeline(
  picked,
  c => agent(
    TOOL_HINT +
    `Deep-read this source for a coding-agent best-practices playbook:\n` +
    `${c.title}\n${c.url}\nClaimed tactic: ${c.claimedTactic}\n` +
    `Fetch and actually read it. Extract every concrete, actionable tactic a practitioner ` +
    `could apply when building or driving a coding agent — a tactic is a specific practice ` +
    `("do X when Y"), not a finding ("X correlates with Y"). For each: one-sentence statement, ` +
    `which playbook topic it belongs to, the evidence the source offers, a proposed tier ` +
    `(Proven only if the source itself shows multiple independent validations or rigorous ` +
    `benchmarks; Promising for a single credible result; Watch for plausible-but-unvalidated), ` +
    `and tool-specific notes if the tactic is tool-bound. If you cannot fetch/read the source, ` +
    `return readable=false with whyUnreadable and an empty tactics list.`,
    { label: `read:${c.key}`.slice(0, 60), phase: 'Read', schema: TACTICS_SCHEMA }
  ),
  async (read, c) => {
    if (!read) return { read: null, verdicts: [] }
    if (!read.readable || !read.tactics.length) return { read, verdicts: [] }
    const verdicts = await parallel(read.tactics.map(t => () =>
      agent(
        TOOL_HINT +
        `You are the skeptic gate for a coding-agent best-practices playbook. A deep-read of ` +
        `"${c.title}" (${c.url}) proposes this tactic at tier ${t.proposedTier}:\n` +
        `${JSON.stringify(t, null, 2)}\n` +
        `Try to REFUTE it: is the evidence what the deep-read claims? Is the tactic actionable ` +
        `or vacuous? Is it already-obvious standard practice adding nothing? Does anything ` +
        `contradict it? You may run a quick corroborating search — Proven REQUIRES multiple ` +
        `independent sources or rigorous benchmark results you can point at. Return ` +
        `survives=false for vacuous, unsupported, or redundant tactics. If it survives, assign ` +
        `the final tier — WHEN UNCERTAIN, DEMOTE (Watch, not Promising; Promising, not Proven).`,
        { label: `verify:${t.topic}`.slice(0, 60), phase: 'Verify', schema: VERDICT_SCHEMA }
      ).then(v => ({ tactic: t, verdict: v }))
    ))
    return { read, verdicts: verdicts.filter(Boolean) }
  }
)

const survivors = []
const logEntries = []
for (let i = 0; i < picked.length; i++) {
  const c = picked[i]
  const res = evaluated[i]
  const base = { key: c.key, title: c.title, url: c.url }
  if (!res || !res.read) {
    logEntries.push({ ...base, disposition: 'rejected', reason: 'deep-read agent failed' })
    continue
  }
  if (!res.read.readable) {
    logEntries.push({ ...base, disposition: 'rejected', reason: res.read.whyUnreadable || 'source not fetchable' })
    continue
  }
  const kept = res.verdicts.filter(v => v.verdict && v.verdict.survives && v.verdict.tier)
  if (!kept.length) {
    const why = res.verdicts.map(v => v.verdict && v.verdict.reasoning).filter(Boolean).join(' | ') || 'no actionable tactics extracted'
    logEntries.push({ ...base, disposition: 'rejected', reason: why.slice(0, 300) })
    continue
  }
  survivors.push({
    candidate: c,
    tactics: kept.map(v => ({ ...v.tactic, tier: v.verdict.tier, skepticReasoning: v.verdict.reasoning })),
  })
  const allWatch = kept.every(v => v.verdict.tier === 'Watch')
  logEntries.push({
    ...base,
    disposition: allWatch ? 'watch' : 'adopted',
    reason: `${kept.length} tactic(s) kept: ${kept.map(v => v.verdict.tier).join(', ')}`,
  })
}
log(`Evaluated ${picked.length}: ${survivors.length} sources contribute tactics, ${logEntries.filter(e => e.disposition === 'rejected').length} rejected`)

const laneNote = `Lanes run: ${lanes.map(s => `${s.lane}=${s.ok ? 'ok' : 'FAILED'}`).join(', ')}.`

if (!survivors.length) {
  return {
    edits: [],
    digest: `## Sweep ${today} (window ${sinceDate} → ${today})\n\nNo tactics survived vetting this sweep. ${laneNote} Evaluated ${picked.length} candidate(s); see source log for dispositions.`,
    logEntries,
    lanes,
    evaluatedCount: picked.length,
    adoptedCount: 0,
  }
}

phase('Synthesize')
const synth = await agent(
  `You maintain a tiered coding-agent best-practices playbook. Merge the vetted tactics below ` +
  `into it as explicit edits.\n\nCURRENT PLAYBOOK:\n${playbook}\n\nVETTED TACTICS (grouped by ` +
  `source, each with final tier and skeptic reasoning):\n${JSON.stringify(survivors, null, 2)}\n\n` +
  `Rules: (1) Merge duplicates — if two sources support the same tactic, one entry citing both, ` +
  `and multiple independent sources justify Proven. (2) If a tactic updates or contradicts an ` +
  `existing playbook entry, emit action="replace" with replacesHeading set to that entry's exact ` +
  `### heading text, and note the supersession inside the new entry. (3) Otherwise emit ` +
  `action="add" under the tactic's topic. (4) Every entryMarkdown follows the playbook's entry ` +
  `format exactly: "### <one actionable sentence>" then Tier (with added ${today}), Sources ` +
  `(markdown links), Detail with optional Tool notes. (5) Write a digest: a "## Sweep ${today} ` +
  `(window ${sinceDate} → ${today})" markdown block summarizing what was added/replaced at which ` +
  `tiers, notable supersessions, and ending with: "${laneNote}"`,
  { label: 'synthesize', phase: 'Synthesize', schema: SYNTH_SCHEMA }
)
if (!synth) throw new Error('Synthesis agent failed — sweep results are in the journal; re-run with resumeFromRunId')

return {
  edits: synth.edits,
  digest: synth.digest,
  logEntries,
  lanes,
  evaluatedCount: picked.length,
  adoptedCount: survivors.length,
}
```

- [ ] **Step 2: Syntax gate (workflow dialect)**

Run: `node tools/check-workflow-syntax.mjs skills/agent-playbook/workflows/update.mjs`
Expected: exits 0. (Plain `node --check` would reject the top-level `return`.)

- [ ] **Step 3: Extend the standing gate in `package.json`**

Change the `check:workflows` script line to:

The checker takes exactly one file arg, so chain it:

```json
"check:workflows": "node tools/check-workflow-syntax.mjs skills/audit-swarm/workflows/audit.mjs && node tools/check-workflow-syntax.mjs skills/agent-playbook/workflows/update.mjs",
```

Run: `npm run check:workflows`
Expected: both files pass.

- [ ] **Step 4: Commit**

```bash
git add skills/agent-playbook/workflows/update.mjs package.json
git commit -m "feat: agent-playbook update workflow (sweep/dedupe/read/verify/synthesize)"
```

---

### Task 5: SKILL.md (GREEN authoring)

**Files:**
- Create: `skills/agent-playbook/SKILL.md`

**Interfaces:**
- Consumes: `RED-baseline.md` failure summary (Task 2) — content below is the draft; tighten or trim it to address ONLY observed failures, and add Rationalization rows for the verbatim excuses recorded in RED. Also consumes the Task 4 return contract (`edits`/`digest`/`logEntries`).
- Produces: the skill contract Task 6 verifies.

- [ ] **Step 1: Re-read the RED failure summary**

Run: `cat tests/scenarios/agent-playbook/RED-baseline.md`
Adjust the draft below so every section maps to an observed failure; delete sections nothing in RED motivates (YAGNI).

- [ ] **Step 2: Write `skills/agent-playbook/SKILL.md`** (draft — adjust per Step 1):

```markdown
---
name: agent-playbook
description: Use when doing agent-engineering work — writing CLAUDE.md/AGENTS.md, designing prompts or agentic loops, configuring subagents or workflows, choosing a coding-agent setup — or when asked for current coding-agent best practices ("what's the latest on context management", "how should I structure my agent's loop"); serves a living, tiered (Proven/Promising/Watch), source-linked playbook instead of from-memory advice. Also handles "update/refresh the agent playbook": runs a bundled research-sweep Workflow (arXiv + lab-blog + OSS lanes → dedupe vs source log → deep-read → skeptic tiering) and applies the diffs; update mode runs only in the soltero-skills repo.
---

# Agent Playbook

## Overview

Coding-agent research moves faster than model memory. Advice from memory is stale
and unlabeled; one-shot searches are unvetted and evaporate. This skill keeps ONE
durable artifact — `references/playbook.md`, a tiered, source-linked playbook — and
two verbs: **advise** from it, and **update** it via a bundled research-sweep
Workflow. **The user invoking update mode is the explicit opt-in the Workflow tool
requires.**

Core principle: **never state an agent-engineering best practice without its tier
and source — and never refresh the playbook by improvised searching.**

## Advisor mode (default)

1. Read `references/playbook.md` (the topic sections relevant to the task).
2. Apply entries to the work at hand; name the tier every time you rely on one
   ("Promising, single source: …"). Distinguish playbook-backed guidance from your
   own judgment explicitly.
3. Treat tiers honestly: Proven → apply by default; Promising → apply, flag the
   single-source basis; Watch → mention, don't build on.
4. "What changed lately?" → answer from `references/changelog.md`.
5. If the playbook has nothing on the topic, say so — recommend from your own
   knowledge, LABELED as untiered model memory, and suggest an update sweep.

## Update mode ("update/refresh the agent playbook")

Runs ONLY in the soltero-skills repo: if `skills/agent-playbook/` is not in the
working tree, STOP — tell the user to run it there (playbook changes ship via the
plugin release cycle).

1. **Preflight:** load WebSearch via ToolSearch; if unavailable, ABORT — never
   fill a sweep from memory. Get today's date: `date +%F`.
2. **Parse `references/source-log.md`:** watermark ("Last sweep") → `sinceDate`
   (bootstrap: if none, use ~6 months ago and `bootstrap: true`); every Key-column
   value → `seenKeys`.
3. **Invoke the Workflow — do not improvise your own sweep:**

   Workflow({
     scriptPath: "${CLAUDE_SKILL_DIR}/workflows/update.mjs",
     args: { sinceDate, today, seenKeys, playbook: <full text of references/playbook.md>, bootstrap }
   })

4. **Apply the result mechanically:**
   - each `edits[]` item: `add` → append `entryMarkdown` under its `## <topic>`
     heading (remove the "_No entries yet_" placeholder); `replace` → replace the
     entry whose `###` heading equals `replacesHeading`.
   - prepend `digest` under the changelog title; update "Last sweep:" to today;
     append one table row per `logEntries[]` item.
5. **Report:** show the digest (it must state which lanes ran) and commit the three
   reference files: `chore: playbook sweep YYYY-MM-DD`.

## When NOT to Use

- Reviewing a diff or debugging agent code — this skill is for practices, not review.
- Non-coding-agent research — use deep-research.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I know current best practices." | Your memory has a cutoff and no tiers. Read the playbook; label anything beyond it as untiered memory. |
| "A quick web search is fresher than the playbook." | Unvetted and gone tomorrow. Playbook entries are skeptic-vetted and persistent. Search feeds sweeps, not answers. |
| "This paper looks great — adopt it now." | Single unvetted source = Watch at best, via a sweep, with a source-log disposition. Not straight into configs. |
| "WebSearch is down; I'll fill the sweep from memory." | A sweep's value IS fresh evidence. Abort and say so. |
| "I'll sweep inline to save the workflow overhead." | Inline = no lanes, no dedupe, no skeptic gate. Invoke the workflow or don't sweep. |

## Red Flags — STOP

- Stating an agent-engineering best practice with no tier and no source.
- Refreshing the playbook without invoking the bundled workflow.
- Adding anything to the playbook without a fetchable source link.
- Running update mode outside the soltero-skills repo.
- A digest that doesn't say which lanes ran.
```

- [ ] **Step 3: Frontmatter lint**

Run: `npm run lint:fm`
Expected: passes for `skills/agent-playbook/SKILL.md`.

- [ ] **Step 4: Commit**

```bash
git add skills/agent-playbook/SKILL.md
git commit -m "feat: agent-playbook SKILL.md (GREEN authoring vs RED baseline)"
```

---

### Task 6: GREEN verification + REFACTOR + bootstrap smoke-run

**Files:**
- Create: `tests/scenarios/agent-playbook/GREEN-result.md`
- Modify: `skills/agent-playbook/SKILL.md` (only if new rationalizations appear)
- Modify: `skills/agent-playbook/references/*` (populated by the real bootstrap sweep)

**Interfaces:**
- Consumes: scenario-1/2/3.md (verbatim), SKILL.md from Task 5, workflow from Task 4.

- [ ] **Step 1: Re-run the three scenarios WITH the skill present**

Dispatch a fresh subagent per scenario; include the full `skills/agent-playbook/SKILL.md` content in the dispatch context (per `creating-a-skill` reference protocol). Subagents cannot execute the real Workflow — verify the *decision and plan*: scenario-1 must reach for the playbook + a workflow-driven sweep with watermark/dedupe (not a one-shot dump); scenario-2 must ground advice in tiered playbook entries and label anything from memory as untiered; scenario-3 must route the hyped paper through a sweep to a tiered disposition (Watch at best) rather than adopting or hand-waving.

- [ ] **Step 2: Record `tests/scenarios/agent-playbook/GREEN-result.md`**

Same per-scenario structure as RED-baseline.md, plus a `Compliance: PASS/FAIL` line per scenario and a closing `All scenarios: PASS` line. Note the standing caveat: GREEN verifies decision-and-plan compliance, not end-to-end execution (that's Step 4).

- [ ] **Step 3: REFACTOR loop**

For each NEW rationalization a GREEN run surfaces: add an explicit negation + a Rationalization-table row + a Red-Flag entry to SKILL.md, then re-run that scenario. Repeat until all three pass.

- [ ] **Step 4: Bootstrap smoke-run (real workflow, real web)**

In this repo, follow SKILL.md update mode end-to-end: preflight, parse the empty source-log (→ bootstrap window ≈ 2026-01-09 → today), invoke the real Workflow, apply edits/digest/logEntries to the three reference files. Confirm: entries carry tiers + working source links, topic headings matched, digest names all three lanes, source-log rows have dispositions, "Last sweep" updated. This both smoke-tests the pipeline and seeds the shipped playbook.

```bash
git add skills/agent-playbook/references/
git commit -m "chore: playbook bootstrap sweep $(date +%F)"
```

- [ ] **Step 5: Re-run dedupe check (spec GREEN scenario c)**

Invoke the Workflow a second time with the now-populated `seenKeys` and the new watermark. Expected: candidates from the bootstrap are skipped (visible as "Already in source log" log lines), and the run completes cheaply with few or zero fresh candidates. Record counts in GREEN-result.md. Discard this second run's output without committing (unless it legitimately found new sources — then apply and note it).

- [ ] **Step 6: Commit**

```bash
git add tests/scenarios/agent-playbook/GREEN-result.md skills/agent-playbook/SKILL.md
git commit -m "test: agent-playbook GREEN verified (3/3 scenarios + bootstrap smoke run + dedupe re-run)"
```

---

### Task 7: Repo validation gates

**Files:** none created — gates only.

- [ ] **Step 1: Run all gates**

```bash
npm run check
npm run validate:plugin
bash scripts/check-private-names.sh
```

Expected: all pass (`check` = test + lint:fm + lint:md + check:workflows). Fix and re-run until clean; fixes land as `fix:` commits.

---

### Task 8: Docs, version 0.9.0, PR

**Files:**
- Modify: `README.md` (skills table)
- Modify: `CHANGELOG.md`
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json` (via script)

- [ ] **Step 1: README** — add to the skills table:

```markdown
| `agent-playbook` | Living, tiered playbook of coding-agent best practices: advisor mode serves source-linked, tier-labeled guidance; update mode runs a research-sweep Workflow (arXiv + lab blogs + OSS → dedupe → deep-read → skeptic tiering). |
```

- [ ] **Step 2: CHANGELOG** — new top entry:

```markdown
## [0.9.0] - 2026-07-09

### Added
- `agent-playbook` skill: living, tiered (Proven/Promising/Watch) playbook of
  coding-agent and agentic-loop best practices. Advisor mode applies source-linked,
  tier-labeled entries during agent-engineering work; update mode (soltero-skills
  repo only) runs a bundled Workflow — 3-lane sweep (arXiv, lab blogs, OSS agent
  frameworks) → dedupe vs persistent source log → deep-read → one-skeptic tiering
  (default demote) → synthesis diffs + per-sweep digest. Ships bootstrap-seeded
  playbook content.
```

- [ ] **Step 3: Bump versions**

```bash
bash scripts/bump-version.sh 0.9.0
git add README.md CHANGELOG.md .claude-plugin/ package.json
git commit -m "chore: release 0.9.0 (agent-playbook)"
```

- [ ] **Step 4: Push + PR**

Note: this branch is based on `feat/walkthrough-tutor` (unmerged, holds 0.8.0). Merge that PR first, or the PR diff will include walkthrough-tutor commits.

```bash
git push -u origin feat/agent-playbook
gh pr create --title "feat: agent-playbook skill (release 0.9.0)" --body "$(cat <<'EOF'
Living, tiered coding-agent best-practices playbook per docs/specs/agent-playbook.md:
advisor mode serves tier-labeled, source-linked guidance; update mode runs a bundled
Workflow (3-lane sweep → dedupe vs source log → deep-read → skeptic tiering → diffs).
RED/GREEN scenario evidence + bootstrap smoke-run in tests/scenarios/agent-playbook/.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: After CI green + merge — tag** (per repo release convention):

```bash
git checkout main && git pull
git tag v0.9.0 && git push origin v0.9.0
```
