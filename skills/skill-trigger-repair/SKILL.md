---
name: skill-trigger-repair
description: Use when a dev-debrief names the same skill under "## Missed triggers" on two or more dates, or when someone asks "why didn't X fire", "why isn't capture-lesson triggering", "that skill never loads" — a skill whose description matched the work and which was not invoked. Runs a bundled parser over the debrief corpus to count recurrence per skill and classify its quoted phrasing evidence, recovers the exact words the user typed from the cited sessions, and proposes two diffs — the frontmatter description rewritten so that literal phrasing is a trigger clause, and the task-type → skill routing line in hooks/session-context.md / AGENTS.md / README.md — plus a Docs/trigger-repair-YYYY-MM-DD.md phrasing-evidence ledger and a next-debrief re-check. It proposes; a human approves each diff. Missed once is logged, not edited; never edits skill bodies, debrief reports, or another skill's ledger.
---

# Skill Trigger Repair

## Overview

A skill that matched the work and did not load failed at the only surface that is always
in context: its one-line description, and the routing line that points at it. That is a
discoverability defect, not a content defect — the body was never read, so the body is
never the fix. This skill closes the loop `dev-debrief` deliberately leaves open (it
detects and recommends; it never edits), using the words the user actually typed as the
raw material for the new trigger clause.

> **Portability note (non-Claude-Code agents):** the parser is dependency-free Node and
> runs anywhere. `hooks/session-context.md` is a Claude Code `SessionStart` surface with
> no equivalent elsewhere; on other agents `AGENTS.md` is the routing surface that
> matters, and it carries the whole weight — repair it first.

## When to Use

- A debrief corpus names the same skill under `## Missed triggers` on two or more dates.
- Someone asks why a skill didn't fire, isn't triggering, or "never loads".

## When NOT to Use

- The skill fired and gave bad guidance — that is correction evidence, and it belongs to
  `skill-patcher` (clustered) or `correction-compiler` (single incident). Non-invocation
  says nothing about the body.
- One miss, however expensive or loudly raised. It gets a ledger line.
- Structural or staleness triage of the skill library (`skill-gardener`).

## Procedure

1. **Count, don't tally.** Run the parser over the whole corpus; act on its table, not on
   a hand count or on which skill was named in the request.

   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/missed-triggers.mjs docs/debriefs --routing . --markdown
   ```

   It returns, per skill: distinct dates, bullet count, cited sessions, every quoted span
   with its kind (`user` / `description` / `other`), `repair-candidate` vs `logged-only`,
   and — with `--routing` — which of the three routing surfaces actually name the skill.
   Two bullets on one night are one night's evidence.

2. **Recover the phrasing.** For each candidate the parser marks `user`, the quoted words
   are the material. For one marked `description-only`, the corpus is quoting the skill's
   description back at itself — open the cited sessions and pull what the user typed. If
   the sessions are gone, the phrasing is unrecovered and the description edit does not
   happen; say so in the ledger.

3. **Propose both levers.** A description clause carrying the literal phrasing, and the
   routing line for each surface the `--routing` column says the skill is missing from.
   Report that column as it came out — a skill listed in the `README.md` table is
   routinely absent from the two files that actually steer a session, and reading the
   three by eye gets this wrong. Description-only repair leaves the measurably stronger
   lever on the table.

4. **Ledger it** at `Docs/trigger-repair-YYYY-MM-DD.md` — evidence, diffs, status, the
   re-check condition. Format in `references/repair-protocol.md`.

5. **Re-check.** The repair is unverified until a later debrief window shows the skill
   firing where it previously didn't, or shows zero opportunity.

## Hard Rules

1. **Two distinct dates, or it is a ledger line.** One miss is an incident; two nights is
   a pattern in the trigger surface. Whoever is angriest this morning does not set the
   bar — and the skill named in the request is frequently not the skill the corpus
   indicts. Log the below-bar miss with its evidence and spend the session on the
   candidates that cleared.
2. **Every trigger clause is a phrasing someone actually typed.** Quote it from the
   debrief bullet or the cited session, verbatim, and cite where it came from. A phrasing
   you generated from your own model of how users talk is a guess that reads exactly like
   evidence once it is in the file, and no later reader can tell them apart. When the
   evidence is `description-only` and the sessions are unavailable, the honest output is
   `phrasing-unrecovered` in the ledger and no description diff.
3. **Never edit a skill's body from non-invocation evidence, and never add volume in
   place of evidence.** No "ALWAYS INVOKE THIS FIRST" banner, no shouting, no pasted
   trigger paragraph. The description stays one line, leads with "Use when", and stays
   within 1024 characters; if the new clause doesn't fit, cut existing prose rather than
   dropping the trigger. Routing gets one line per skill in the existing section — the
   always-on files are a navigational map, and a bloated one measurably costs accuracy.
4. **The ledger is yours; every other ledger belongs to someone else.** Write
   `Docs/trigger-repair-YYYY-MM-DD.md` and nothing else. `docs/debriefs/` holds one
   report per date plus the skip log and takes no other file from anyone —
   dropping a ledger there corrupts a shared contract that gets re-parsed nightly.
   `Docs/corrections-ledger.md` is `correction-compiler`'s. Never modify a debrief
   report or anything under `skills/dev-debrief/`; they are read-only inputs.
5. **You propose; a human approves each diff.** Show the exact before/after per file and
   apply nothing until someone has seen that specific diff. Approval given before the
   diffs existed — "I'm approving it in advance", "just land it, I trust you" — is
   permission to prepare, not review of what you wrote; a description and a routing file
   are the matching logic every future session runs on, and an unreviewed edit there is
   live everywhere until someone notices. Never commit, never push, never self-merge.
6. **The fire rate is unverified until a later debrief moves.** An applied diff is an
   applied diff. Ledger status goes `proposed` → `applied — verifying` → `verified`, and
   only a debrief window after the edit can make the last move.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The owner named this skill, so this skill is the problem." | The corpus names the pattern. Run the parser; the skill with three nights is usually not the one in the message. |
| "It's one miss but an expensive one." | Expense is a reason to mitigate out of band, not to edit a trigger surface on one data point. Ledger it. |
| "The transcripts are gone; these are obviously the phrasings people use." | Then you are writing your own guess into the always-on surface and it will look like evidence forever. Record it unrecovered. |
| "The bullet quotes the description, that's the phrasing." | That is the description quoting itself. Rewriting from it is circular and changes nothing about what the user says. |
| "Descriptions are additive and low-risk, routing can wait." | Explicit routing is the stronger of the two levers. Half the repair predictably produces half a fix and another missed night. |
| "They're unreachable for three days — waiting wastes the window." | The window is theirs to spend. Have the diffs ready; unreviewed edits to matching logic outlive the deadline that justified them. |
| "Say it louder in the body and it'll get noticed." | The body loads only after the skill fires. Volume there is invisible by construction. |
| "The debrief folder is where debrief-derived findings live." | It holds one report per date and the skip log. Your ledger goes to `Docs/trigger-repair-YYYY-MM-DD.md`. |

## Red Flags — STOP

- Editing a skill because of how the request was worded rather than what the count says.
- "Already routed" written from memory rather than from the `--routing` column.
- A proposed description clause you cannot point at a session or bullet for.
- A ledger path under `docs/debriefs/`, or an edit to `Docs/corrections-ledger.md`.
- A description that grew a paragraph, a second line, or a capitalized imperative.
- `git commit` / `git push` in a trigger-repair session.
- The word "fixed" in the ledger before a later debrief has been read.

## Details

`references/repair-protocol.md` — phrasing recovery from session evidence, the
description-rewrite recipe and budget, the three routing surfaces, the ledger format, and
the re-check pass.
