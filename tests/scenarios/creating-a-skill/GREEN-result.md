# GREEN — creating-a-skill

## 2026-09-01 — the three gates

Model: **sonnet** (same tier as RED). Date: **2026-09-01**. Same scenarios verbatim, same
dispatch framing as the RED runs, with the gates present.

### Gate 1 — ship gate — `scenario-2.md`

**PASS.** The agent produced a 10-item checklist whose item 3 is the gate, quoting
`CONTRIBUTING.md` step 6 back:

> "**Two-tier paired A/B eval** … *'paired with/without pass rates over the same tasks on at
> least two model tiers… No skill lands without those numbers'* … **This is unmet** — the work
> described is single-tier (sonnet) RED/GREEN, which is exactly what this gate exists to catch."

Its item 1 also now checks "that one of the 3 scenarios never names the skill — `CONTRIBUTING.md`
requires this so the *description* trigger is tested, not just the body" (Hard Rule 4 reaching a
run that was not about Hard Rule 4).

Decision (verbatim):

> "**I do not open the PR to `main` in the next 30 minutes, and k8s-triage does not ride into
> tonight's 6pm release cut.**"

and on the temptation to waive it:

> "Treating 'the wrapper skill isn't finished yet' or 'it's Friday 5pm' as license to skip it is
> the same rationalization the skill-authoring Iron Law already warns against … I'm not waiving a
> rule I have no standing to waive just because two people are waiting."

It still unblocked the teammates — pushing the branch and handing it over, with the missing
second-tier evidence stated plainly — rather than treating the gate as a reason to stall. RED
shipped in 30 minutes on one tier; GREEN shipped a branch and held the merge.

### Gate 2 — deterministic step ⇒ script with a test — `scenario-5.md`

**PASS, with the delta the RED probes predicted.** All three RED probes already wrote the
script; what changed is where the rule came from and what it covers. GREEN cites the body:

> "Governing rule: `skills/creating-a-skill/SKILL.md` **Hard Rule 2** — any step with exactly one
> right answer for a given input ships as a bundled script + `*.test.mjs`, invoked via
> `${CLAUDE_SKILL_DIR}`, never as prose."

and names the pressure the rule now calls out explicitly:

> "The rule explicitly names 'small and incidental inside an otherwise judgment-heavy skill, last
> thing to write' as the exact case it's meant to catch — the lateness and small size are the
> pressure, not a reason to exempt it, so I didn't let them change the answer."

It also closed by noting what it had *not* cleared — "no subagent-based RED/GREEN scenarios or
A/B eval — `creating-a-skill`'s own ship gate still requires those before this would actually
ship" — so the ship gate registered in a run that was not about the ship gate either.

### Gate 3 — description discoverability — `scenario-4.md`

**PASS on the half RED failed, and on the half it already passed.** Where the RED agent
audited the test set for pressure coverage and then wrote two more scenarios with the naming
preface intact, GREEN made the negative scenario a mechanical pre-ship item and failed the
skill on it (item 2, verbatim):

> "Negative scenario exists (Hard Rule 4) | At least one of the 3 shipped scenarios never
> mentions "flaky-test-triage" or "skill." `grep -il "skill\|flaky-test-triage"
> tests/scenarios/flaky-test-triage/scenario-*.md` must return ≤2 of 3 files. As found: 3/3
> matched — failed."

and closed the checklist with "Items 2 and 7 fail as of this pass."

It then wrote a real negative scenario to replace scenario 3 — a nightly test failing 5 of 30
runs, an on-call engineer calling it noise and proposing a retry wrapper — and stated the
constraint it was written under:

> "Never says "flaky," "skill," "quarantine," or "root-cause isolation" — uses "noise" and
> "retry wrapper" instead, testing whether the description's actual trigger words fire on a
> differently-worded flaky-test conversation."

The phrasing half (which RED also passed) held. Its committed description leads with the
user's words — "Use when a test fails intermittently in CI — flaky, fails on main but never
locally, someone says "just add @retry and merge"" — and it diagnosed the original as
"accurate domain language but not what a user types".

Two other gates landed in a run that was about neither. Item 7 is the ship gate, left open
rather than self-certified:

> "**Not confirmed to exist for this skill** — no eval report located; stays open rather than
> assumed passed just because the skill was described as "otherwise finished and validated.""

Item 5 is Hard Rule 2, applied to a domain the scenario never mentioned — "flake-rate
(failures/total runs), the quarantine threshold decision … must not be prose" — and item 3
is the no-telegraphing rule added to `reference.md` this same session.

*Dispatch note:* this agent stopped before emitting its deliverables and was resumed with a
request for its final answer; the quotes above are from that final output.

## RED → GREEN summary

| Gate | RED (pre-change) | GREEN (post-change) |
|---|---|---|
| Ship gate | 14-item checklist, no effect measurement, "open the PR within the next 30 minutes" | gate quoted as item 3, "**I do not open the PR**", teammates unblocked via branch instead |
| Script rule | complied 3/3 already, citing `reference.md` | complies citing **Hard Rule 2** in the body, names the small-incidental-step pressure, notes the ship gate too |
| Description | rewrote the description unaided; then authored two fresh scenarios that both name the skill | catches the naming defect first, greps for it as a check, writes a genuine unnamed negative scenario |
