# Report F — content/marketing/research skills · Fable 5.1 prompt audit

**Target model:** Claude Fable 5.1 (`claude-fable-5-1`).
**Scope audited (11 files, all read in full):**
`skills/content-marketing/{SKILL.md,references/brief-template.md,references/platform-constraints.md,references/voice-and-slop.md}`,
`skills/seo-aeo/{SKILL.md,references/practices.md,references/audit-checklist.md}`,
`skills/email-marketing/{SKILL.md,references/sequences-and-craft.md}`,
`skills/trend-research/SKILL.md`, `skills/feedback-synthesis/SKILL.md`, plus the
instruction-carrying portions of `README.md` and `CONTRIBUTING.md`.
**Provenance consulted:** `tests/scenarios/{content-marketing,seo-aeo,email-marketing,trend-research,feedback-synthesis}/RED-baseline.md` and `GREEN-result.md`; `docs/specs/content-marketing.md`; `git log` (all five skills landed 2026-07-29, commits `2082d34` / `4ad6cbc`).

## Summary

**Counts by group:** Group 1 — 1 finding (1d/1e adjacent, one rewrite). Group 2 — 3 findings (1 medium, 2 low). Group 3 — 0. Group 4 / keep-list #11 (re-baselining *adds* text) — 5 findings, and this is where the real damage is. Total: 6 actionable (3 High, 3 Medium) + 4 flag-only.

This group of skills is **unusually clean on the classic dated patterns**, and that is worth stating plainly rather than manufacturing findings around. Across all eleven files there are zero anti-formatting rules, zero update-suppressors ("don't narrate", "hold findings"), zero `think step by step` / scratchpad scaffolds, zero pinned model IDs or version strings, zero `tool_choice`/`thinking`/`temperature` request code, and a total of 13 caps-emphasis tokens across ~560 lines of body — a density far below the Group 1a threshold. The reference files are the best-dated prompt surface I have seen in this repo: `platform-constraints.md`, `practices.md` and `sequences-and-craft.md` each carry an explicit `last-verified 2026-07-29` header, a stable-vs-fast-rotting split, and per-claim `[UNSOURCED]` markers. Per the brief, the numeric limits in those tables (280 chars, 50–60 char titles, ~50 char subjects, 150–160 char meta) are platform format contracts and stay; I found **no numeric cap constraining the model's own prose without a platform reason** that rises above low confidence. The RED baselines also hold up against Fable 5.1: the failures these skills were built to close — inventing product specifics *while* correctly refusing the user's fabrications, skipping mechanical counting, omitting absence reporting — map directly onto Fable 5.1's documented tendencies to elaborate beyond the task and to take adjacent unrequested actions. **Every claim-trace gate and rationalization table in scope is a keeper.**

The three highest-impact findings are all **additions**, not deletions:

**1. `email-marketing/SKILL.md` states no boundary against actually sending.** The skill's four gates govern what the copy may *claim* and nothing governs what the agent may *do* with it. The Fable 5.1 guidance names this exact failure by example — "sometimes takes unrequested-but-adjacent actions (e.g. composing an email straight to drafts)" — and this harness has `mcp__claude_ai_Gmail__create_draft` and `send_message` available. A skill whose whole subject is outbound email, invoked in a session with a mail connector attached, with no stated stop-line, is the highest-consequence gap in scope: an email is not a reversible action.

**2. `trend-research/SKILL.md` protects the no-web path but not the low-effort-search path.** Its RED baseline is explicit that all three runs had WebSearch and used it, so rule 1 ("search first when you can") was written against a model that searched reliably; the gap the skill closes is the *absence* of web access. Fable 5.1 introduces the opposite failure: at `low` effort it calls search less and answers from memory more, "most visibly for named products, models, and tools it recognizes but has out-of-date knowledge of." Named vendors, competitors, funding rounds and pricing pages are literally this skill's entire input domain, and rule 4 ("no specific numbers from memory") is enforced by a model that has just decided it doesn't need to search. The name-verification line from the guidance belongs in rule 1.

**3. `content-marketing/SKILL.md` never routes to the fan-out agent that exists for it.** `agents/content-adapter.md` is a complete, well-specified per-platform adaptation worker, and `docs/specs/content-marketing.md:14` says the skill fans out through it — but the string `content-adapter` appears nowhere in the skill or its three reference files. Multi-platform adaptation from one approved claims table is the textbook parallel-delegable subtask, and Fable 5.1 is documented as delegating reliably with asynchronous sub-agents outperforming spawn-and-block. The worker also carries the only "never publishes" boundary in the whole content-marketing surface, so the missing reference loses a safety rule as well as the parallelism.

---

## Findings

### High confidence

| Field | Content |
|---|---|
| **ID** | F1 |
| **Location** | `skills/email-marketing/SKILL.md:20-37` (gate list; insertion point after line 37) |
| **Evidence** | The four gates are `1. Product-claim trace`, `2. Personalization trace`, `3. No fictional case studies`, `4. Compliance floor (state per artifact, flag — don't lawyer)`. No line in the file constrains what the agent may *do* with the drafted email. |
| **Pattern** | Group 4 / keep-list #11 — re-baselining adds text; Fable 5.1 "State boundaries explicitly." |
| **Why obsolete** | Fable 5.1 "sometimes takes unrequested-but-adjacent actions (e.g. composing an email straight to drafts, creating backup git branches)" and the guidance's remedy is to "define what it should *not* do." The skill was written for a model that reliably stopped at producing text. With a mail connector attached (this harness exposes `create_draft` and `send_message`), drafting-then-sending is the adjacent action, and it is irreversible — the one class the autonomy guidance says to stop for. The RED baseline for this skill measured only claim honesty, never tool behavior, so nothing in the provenance covers this. |
| **Confidence** | **High** |
| **Action** | `add` — new gate 5, text in the diff below. |

| Field | Content |
|---|---|
| **ID** | F2 |
| **Location** | `skills/trend-research/SKILL.md:17-19` |
| **Evidence** | `1. **Search first when you can.** If WebSearch/WebFetch are available, use them — verify premises, fetch numbers, triangulate (≥2 independent sources before calling anything a trend). List sources with dates.` |
| **Pattern** | Group 4 / keep-list #11 — Fable 5.1 "Search triggering at low effort." |
| **Why obsolete** | The rule assumes the only failure is *lacking* web access — which is exactly what `tests/scenarios/trend-research/RED-baseline.md` measured ("Every run had WebSearch... The no-web path is untested and unprotected"). Fable 5.1 adds a failure the baseline could not have seen: at `low` effort it "calls a search or retrieval tool less often than Claude Fable 5 and answers from memory more — most visibly for named products, models, and tools it recognizes but has out-of-date knowledge of." Competitors, vendors, funding rounds and pricing pages are this skill's whole input surface, and rule 4's "no specific numbers from memory" is toothless if the model never noticed it was recalling. The guidance's fix is a prompt line stating that recognizing a name is not knowing its current state. |
| **Confidence** | **High** |
| **Action** | `add` — two sentences to rule 1, text in the diff below. |

| Field | Content |
|---|---|
| **ID** | F3 |
| **Location** | `skills/content-marketing/SKILL.md:35-50` ("The Flow"; insertion point after line 49) |
| **Evidence** | Step 4 is `**Mechanical checks:** count characters against [references/platform-constraints.md] for every platform-bound artifact.` The string `content-adapter` does not appear in `skills/content-marketing/` at all (`grep -rn`), while `docs/specs/content-marketing.md:14` reads `Parent of soltero-skills:seo-aeo and soltero-skills:email-marketing; fan-out via the content-adapter agent.` |
| **Pattern** | Group 4 — "Let it delegate — asynchronously" (an unreferenced sub-agent is the roster-level version of suppressed delegation); also keep-list #11. |
| **Why obsolete** | On Fable 5.1 "parallel sub-agents are dependable — instead of suppressing delegation (a common prior-model guardrail), use sub-agents frequently and give explicit guidance on *when* delegation is desirable." Per-platform adaptation from one frozen claims table is the ideal shape for that: disjoint outputs, a closed input set, and a mechanical per-unit character count each worker owns. `agents/content-adapter.md` already implements it with a hard "Claims added: NONE (required)" contract and a `BLOCKED: source has no claims table` refusal, so the delegation is safe by construction — it is simply unreachable, because the only file the model reads on trigger never names it. The worker is also the only place in the content-marketing surface carrying `You never publish, schedule, or call external services.` |
| **Confidence** | **High** (the spec documents the intent; the skill omits it — this is a wiring defect, not a judgment call) |
| **Action** | `add` — new flow step 5, renumbering the delivery contract to 6; text in the diff below. |

### Medium confidence

| Field | Content |
|---|---|
| **ID** | F4 |
| **Location** | `skills/content-marketing/references/voice-and-slop.md:16-29` (the AI-slop banlist; insertion point after line 29) |
| **Evidence** | The banlist enumerates `"revolutionize / game-changer / cutting-edge / next-generation / seamless / supercharge / unleash / unlock the power of / take X to the next level"`, `"In today's fast-paced world…"`, `Triple-emoji seasoning and 🚀 as punctuation`, `Em-dash-chained triads`, `Rhetorical-question openers ("Tired of X?") more than ~never`. |
| **Pattern** | Group 4 / keep-list #11 — Fable 5.1 "Writing density"; the existing list is a 2024-era cliché catalogue. |
| **Why obsolete** | The banlist is a keeper — it is the author's quality bar for outward-facing copy and it names its reason ("mark copy as machine-generated filler"), so keep-list #1 applies and I am **not** proposing to cut a single entry. But it is a closed list of *specific strings* aimed at a model that produced boilerplate hype. Fable 5.1's documented prose failure is different and not covered by any entry: "prose can be denser than Claude Fable 5's — longer sentences, fewer paragraph breaks," with metaphor substituted for direct statement. Every phrase on the banlist could be absent and the copy could still fail this way, because the failure is a *mode* rather than a vocabulary. The guidance states the fix directly: "Defining 'mannered prose' as an anti-pattern has helped; style instructions placed in the first user turn of a session hold better than the same text in the system prompt" — and a reference file the skill reads on trigger is the in-session position, so this is the right home for it. |
| **Confidence** | **Medium** |
| **Action** | `add` — a "Mannered prose" subsection using the guidance's definition, text in the diff below. |

| Field | Content |
|---|---|
| **ID** | F5 |
| **Location** | `skills/content-marketing/SKILL.md:68-72` ("When NOT to Use") |
| **Evidence** | `Search-specific optimization → soltero-skills:seo-aeo. Email/sequences → soltero-skills:email-marketing. Internal docs, README prose → just write. Product claims verification for legal review → flag for counsel, don't rule.` — routing only; no action boundary. `docs/specs/content-marketing.md:26` lists `paid ads, actual publishing` as non-goals, but that non-goal never reached the skill. |
| **Pattern** | Group 4 / keep-list #11 — Fable 5.1 "State boundaries explicitly"; sibling of F1. |
| **Why obsolete** | Same mechanism as F1, one step lower in consequence. The skill's flow terminates at "Deliver with the contract," and on Fable 5.1 the documented risk is that a finished deliverable invites the adjacent action — posting it, scheduling it, publishing it as an Artifact — because "actions clearly beyond what the ask implies... still need the user's go-ahead" is a rule the model has to be given. The spec already decided this; the decision just never made it into the file the model reads. |
| **Confidence** | **Medium** |
| **Action** | `add` — one sentence to "When NOT to Use", text in the diff below. |

| Field | Content |
|---|---|
| **ID** | F6 |
| **Location** | `CONTRIBUTING.md:7-8` |
| **Evidence** | `2. RED → 3 pressure scenarios in \`tests/scenarios/<skill>/\`; run a fresh subagent without the skill and record the baseline failure.` |
| **Pattern** | Group 2 — history narratives / provenance that cannot be re-checked; Fable 5.1 checklist item "A/B with prior-model scaffolding removed." |
| **Why obsolete** | Every skill in this scope opens by asserting what the baseline model already does ("You already refuse the founder's invented statistics", "Baseline behavior already refuses the illegal asks", "Synthesis judgment is not the problem"), and every one of those assertions is a per-model fact. The authoring loop never requires recording *which* model produced the baseline or *when*, so as of the Fable 5.1 migration none of those scoping claims can be re-verified without re-running the scenarios blind — and the audit's own Step 2 question ("which failure, on which model, did this prevent") is unanswerable for this whole family. This is the root cause of finding F7 below, and it is cheap to fix going forward. |
| **Confidence** | **Medium** |
| **Action** | `add` — require the model identifier and date in the RED record; text in the diff below. |

### Low confidence — flag only, no diff

| Field | Content |
|---|---|
| **ID** | F7 |
| **Location** | `skills/content-marketing/SKILL.md:10`, `skills/seo-aeo/SKILL.md:10-11`, `skills/email-marketing/SKILL.md:10-11`, `skills/trend-research/SKILL.md:10-11`, `skills/feedback-synthesis/SKILL.md:10` |
| **Evidence** | `You already refuse the founder's invented statistics.` · `Baseline judgment on modern SEO is good — stale-tactic refusals and honest timelines come free.` · `Baseline behavior already refuses the illegal asks (purchased lists, missing unsubscribe, deceptive subjects, fake deadlines) — keep doing that.` · `With web access, honest sourced research happens naturally.` · `Synthesis judgment is not the problem — the contract is.` |
| **Pattern** | Group 1a `you (tend to\|often\|sometimes)` trait claims, and Group 2 history narratives. |
| **Why flag, not fix** | These are trait assertions about a July-2026 default model, restated to Fable 5.1 as facts about itself, and one of them ("keep doing that") instructs a trained default. That matches the pattern rows. But they are also the load-bearing *scoping* rationale — they tell the model which half of the problem the skill deliberately does not cover, which is exactly the context keep-list #1 protects, and cutting them would make five narrow skills read as if they cover everything. The claims also most likely remain true on Fable 5.1: honest refusal of fabricated statistics is not a capability that regressed, while the failures these skills close (self-invention during honest drafting, skipped mechanical counting, absent absence-reporting) line up with Fable 5.1's documented tendency to elaborate beyond the task. **Recommended action is a re-baseline, not an edit:** re-run the fifteen scenarios in `tests/scenarios/<skill>/scenario-{1,2,3}.md` against Fable 5.1 without the skills, and amend any Overview sentence the new baseline contradicts. F6 makes that record auditable next time. |
| **Confidence** | **Low** |
| **Action** | `flag` |

| Field | Content |
|---|---|
| **ID** | F8 |
| **Location** | `skills/feedback-synthesis/SKILL.md:23-25` |
| **Evidence** | `Absences: <expected topics with ZERO mentions — check at minimum: pricing, security/SSO, performance, onboarding, integrations, reliability — plus anything the asker's framing presumes>` |
| **Pattern** | Group 2 — the recency trap (one fixture's planted traps encoded as a permanent list). |
| **Why flag, not fix** | The six named topics are the B2B-SaaS topics planted in `tests/scenarios/feedback-synthesis/fixtures/relay-feedback.md` (pricing at zero mentions, SSO at n=1) — the absence requirement itself is RED-backed (`RED-baseline.md`: "Absence reporting: 0/3"), so the rule stays. What is over-fitted is `check at minimum`, which makes a SaaS-shaped checklist mandatory for feedback about a consumer app, a game, or an internal tool. The trailing clause "plus anything the asker's framing presumes" already generalizes correctly, and Fable 5.1 is strong at exactly that judgment. Softening `check at minimum` to `typically` and marking the six as illustrative would fit the model better, but no pattern row cleanly documents this, so it stays out of the diff. |
| **Confidence** | **Low** |
| **Action** | `flag` |

| Field | Content |
|---|---|
| **ID** | F9 |
| **Location** | `skills/seo-aeo/SKILL.md:18-24` (rule 1) |
| **Evidence** | `if the topic isn't covered or the date is old, say so and recommend a sweep rather than asserting from memory.` |
| **Pattern** | Group 2 — volatile specifics; adjacent to F2's Fable 5.1 search-triggering shift. |
| **Why flag, not fix** | The rule correctly forbids memory-assertion, which is the RED-identified gap ("Confident unsourced ranking-factor assertions delivered without basis labels"), and the reference it defends carries a real `2026-07-29` date. But its only escape hatch is to *recommend* a sweep to the user, which was the right terminal move for a skill assumed to have no retrieval. Fable 5.1 sessions routinely have WebSearch, and the same low-effort under-triggering as F2 applies to named crawlers and answer engines. Recommending a sweep the model could run itself is a small under-delegation. I am not proposing text because, unlike F2, the guidance does not document a specific failure here and the "recommend a sweep" phrasing is a deliberate product decision about scope. |
| **Confidence** | **Low** |
| **Action** | `flag` |

| Field | Content |
|---|---|
| **ID** | F10 |
| **Location** | `skills/content-marketing/references/platform-constraints.md:26,32` |
| **Evidence** | `Carousels: native PDF upload; ≤15 words/slide; slide 1 works standalone.` · `Draft 3 hook variants per post: curiosity gap / bold claim / specific story.` |
| **Pattern** | Group 1f — numeric output ceilings and fixed cadences. |
| **Why flag, not fix** | These are the only two numbers in scope that constrain the model's own prose without a platform-enforced basis, so per the brief they are the ones to examine. Both survive examination as craft-format contracts rather than verbosity clamps: `≤15 words/slide` is a legibility requirement of the slide medium (the deliverable is a rendered image, not a text field), and `3 hook variants` specifies a *quantity of alternatives to offer the user*, not a length ceiling on any one output. Neither starves reasoning the way Group 1f's target ("under 120 words") does. The file also labels its surrounding algorithm claims `[UNSOURCED]` honestly. Flagged for completeness; no edit proposed. |
| **Confidence** | **Low** |
| **Action** | `flag` |

### Files audited with no findings — clean

- `skills/content-marketing/references/brief-template.md` — **clean.** Six briefing fields plus an explicit blocking-vs-defaultable rule (`Blocking = the answer changes what gets written`) that anticipates Fable 5.1's "check in only when different readings would lead to materially different work."
- `skills/seo-aeo/references/audit-checklist.md` — **clean.** A mechanical checklist is the correct low-degrees-of-freedom shape (keep-list #3), and `validate, don't assume` / `verify, don't assume` are the skill-level form of Fable 5.1's progress-claim audit instruction. The guidance is explicit that verification instructions are **kept** when migrating to Fable 5.1.
- `skills/seo-aeo/references/practices.md` — **clean.** Exemplary dating: stable-vs-fast-rotting split, `dated 2026-07-29`, `[UNSOURCED]` per claim, and world-facts with real dates (meta keywords 2009, scaled-content-abuse March 2024) that are not model-era conditionals.
- `skills/email-marketing/references/sequences-and-craft.md` — **clean.** Cadences are labelled `[UNSOURCED] cadences — coherent defaults, not law`; the deliverability numbers (0.30% complaint limit, RFC 8058, 5k+/day) are external compliance thresholds, not output caps.
- `README.md` — **clean** within scope. Lines 93-97 are one-line skill descriptions in a routing table, not agent instructions; the install/MCP sections are user documentation. No stale tool references (`Skill`, MCP tool names all current).
- `CONTRIBUTING.md` apart from F6 — **clean.** `≤1024 chars` for `description` is the real Claude Code frontmatter limit; `under ~500 lines` for SKILL.md is the skill-size tax Group 2 itself endorses. Both stay.

---

## Step 6 — Proposed diff (High and Medium findings only)

One hunk per finding. Nothing has been applied to any repo file.

### F1 — email-marketing: state the send boundary

```diff
--- a/skills/email-marketing/SKILL.md
+++ b/skills/email-marketing/SKILL.md
@@ -32,6 +32,11 @@
 4. **Compliance floor (state per artifact, flag — don't lawyer):** working
    unsubscribe + physical address (CAN-SPAM), one-click unsubscribe/
    List-Unsubscribe for bulk (Gmail/Yahoo bulk-sender requirements, RFC
    8058), honest subject, consent basis named for the list used (opt-in vs
    legitimate-interest cold B2B; EU/UK recipients flagged), suppression on
    reply/unsub/bounce.
+5. **You write the email; you don't send it.** The deliverable is copy the
+   user reviews and sends themselves. Don't create drafts, schedule sends,
+   import or segment a real list, or call a mail or CRM tool — even when one
+   is connected and sending looks like the obvious next step. A sent email
+   is not reversible, and the compliance basis above is the user's to
+   confirm. Offer the send as a follow-up after delivering the copy.
 
 ## Craft (reference: [references/sequences-and-craft.md](references/sequences-and-craft.md))
```

### F2 — trend-research: verify the name, don't recognize it

```diff
--- a/skills/trend-research/SKILL.md
+++ b/skills/trend-research/SKILL.md
@@ -17,6 +17,10 @@
 1. **Search first when you can.** If WebSearch/WebFetch are available, use
    them — verify premises, fetch numbers, triangulate (≥2 independent
    sources before calling anything a trend). List sources with dates.
+   Recognizing a company, product, round, or price is not the same as
+   knowing its current state: search the name as the user wrote it in at
+   least one query, alongside any reformulation, even when you already have
+   background on it. Partial background is exactly what makes an
+   out-of-date answer sound authoritative — familiarity is not a reason to
+   skip the search.
 2. **Degrade honestly when you can't.** No web access → the ENTIRE answer is
```

### F3 — content-marketing: route multi-platform work to the fan-out agent

```diff
--- a/skills/content-marketing/SKILL.md
+++ b/skills/content-marketing/SKILL.md
@@ -46,7 +46,15 @@
 4. **Mechanical checks:** count characters against
    [references/platform-constraints.md](references/platform-constraints.md)
    for every platform-bound artifact. A "Twitter version" you never counted
    is not a Twitter version.
-5. **Deliver with the contract** (required, per artifact):
+5. **Fan out when there is more than one platform.** Once the source
+   artifact and its claims table exist, dispatch one
+   `soltero-skills:content-adapter` subagent per target platform and keep
+   working while they run. Each gets the approved artifact, its claims
+   table, that platform's constraint row, and the voice rules; each may drop
+   claims and may not add one. A single platform, or an artifact whose
+   claims table isn't settled yet, stays inline — the adapter blocks without
+   a claims table by design.
+6. **Deliver with the contract** (required, per artifact):
```

### F5 — content-marketing: this skill writes copy, it does not ship it

```diff
--- a/skills/content-marketing/SKILL.md
+++ b/skills/content-marketing/SKILL.md
@@ -68,6 +68,9 @@
 ## When NOT to Use
 
 Search-specific optimization → soltero-skills:seo-aeo. Email/sequences →
 soltero-skills:email-marketing. Internal docs, README prose → just write.
 Product claims verification for legal review → flag for counsel, don't rule.
+Publishing is out of scope: deliver the copy and let the user ship it — no
+posting, scheduling, or sending it anywhere, and no publishing it as a page
+or artifact unless the user asked for one.
```

### F4 — content-marketing: name mannered prose as an anti-pattern

```diff
--- a/skills/content-marketing/references/voice-and-slop.md
+++ b/skills/content-marketing/references/voice-and-slop.md
@@ -28,6 +28,17 @@
 - Fake urgency ("limited time", "don't miss out") without a real deadline
 - Rhetorical-question openers ("Tired of X?") more than ~never
 
+## Mannered prose (the failure the banlist above doesn't catch)
+
+Mannered prose substitutes metaphor and flourish for direct statement.
+Instead of "a parameter worth varying," the mannered writer produces "a dial
+worth turning." Instead of "this point still matters," they write "this
+point earns its keep." The phrases exist to display the writer, not to
+convey the idea, and readers can tell. That is why mannered prose irritates:
+it makes the reader work harder so the writer can perform. It is also
+imprecise — metaphors drag in connotations the writer did not choose and
+cannot control. The fix is to say what you mean; when a literal phrase is
+available, use it. Copy can contain none of the banned phrases above and
+still fail this way.
+
 ## Claim hygiene (the hard rule)
```

### F6 — CONTRIBUTING: record which model produced the baseline

```diff
--- a/CONTRIBUTING.md
+++ b/CONTRIBUTING.md
@@ -5,8 +5,10 @@
 ## The loop
 1. Spec → `docs/specs/<skill>.md`.
 2. RED → 3 pressure scenarios in `tests/scenarios/<skill>/`; run a fresh subagent without the
-   skill and record the baseline failure.
+   skill and record the baseline failure. Record the model identifier and the date at the top of
+   `RED-baseline.md` — a baseline is a per-model fact, and "the baseline already does X" claims in
+   a SKILL.md are only re-checkable if a later reader knows which model was measured, and when.
 3. GREEN → minimal `skills/<skill>/SKILL.md` (+ optional `reference.md`, `scripts/`).
```

### F5b (paired with F6, no separate finding) — content-marketing rationalization row

The rationalization table row at `skills/content-marketing/SKILL.md:65` cites `Six of nine baseline runs shipped one while writing honestly.` The committed baselines document self-invention in content-marketing s1/s2 and email-marketing s1/s2/s3 — five runs across three skills — so the figure is not reconstructable from the repo, and it describes a July-2026 default model rather than Fable 5.1. Per Group 2 ("a rule's authority is the behavior it prescribes, not the incident that motivated it"), the mechanism is what should carry the row:

```diff
--- a/skills/content-marketing/SKILL.md
+++ b/skills/content-marketing/SKILL.md
@@ -65 +65 @@
-| "I kept it honest — no need for the claims table" | The table is how invented specifics get CAUGHT. Six of nine baseline runs shipped one while writing honestly. |
+| "I kept it honest — no need for the claims table" | The table is how invented specifics get CAUGHT. Honest intent is exactly the state in which they ship unnoticed. |
```

The adjacent row's `The baseline's 'Twitter version' was 3× over the limit` is **kept** — it traces to `tests/scenarios/content-marketing/GREEN-result.md` ("RED's version was ~3× over") and pins a concrete, checkable failure rather than a frequency claim about a retired model.
