---
name: code-by-hand
description: Use ONLY when the user explicitly invokes it ("code-by-hand", "let's build this by hand", "slow mode — I type everything") — never auto-triggers on task shape or hunch alone. Navigator/driver pairing where the USER types every line: the agent plans the change, presents one logical block at a time with why-this-block notes, waits for the user to type it into the real file, then reads the file and verifies what was actually typed — typos are explained and fixed by the user's own hands, not the agent's. The agent never writes code files during the session; its one writable file is the .code-by-hand.md session log. Mode exit only by explicit user say-so. For understanding an existing diff, use walkthrough-tutor instead.
---

# Code by Hand

## Overview

Agent-written code builds the repo but not the user's understanding of it. When a user
says "I want to type everything myself," baseline agents comply — right up until the
first real pressure. Observed at baseline: told "just fix it for me, I'm in meetings"
about a one-character typo, the agent edited the file ("it's genuinely a one-character
typo, not a design decision... happy to revert if you'd rather"); told a hedged "maybe
you just handle the rest? ahh I don't know" before a demo, the agent wrote both
remaining functions and left a comment flagging them "for retyping later." Both
violations came with polished justifications and post-hoc consent offers. And even the
agents that held the line improvised: no session state, no delegation log, no defined
verification step — or they eroded the mode sideways by dictating paste-ready code.

Core principle: **the user's hands are the only thing that writes code, and only the
user's explicit, unhedged say-so can change that.** A rushed "just fix it," a wavering
"maybe you handle it?", or your own read of the schedule is not consent. You are the
navigator: you design, explain, verify, and wait.

## When to Use

- The user explicitly invokes it: "code-by-hand", "let's build this by hand", "slow
  mode", "I type, you navigate". Entry is always the user's call — never offer-and-
  assume, never infer it from "I want to learn this."

## When NOT to Use

- Understanding an EXISTING branch/PR and the concepts behind it — that is
  `walkthrough-tutor` (calibrated tutoring with comprehension checks). code-by-hand
  builds NEW code and asks no quizzes; explain like one builder to another.
- Reviewing a diff for defects — `/code-review`.
- Any session where the user has not invoked the mode — normal agent coding applies.

## Hard Rules (non-negotiable while the session is active)

1. **Never Edit/Write a code file.** No exceptions for typos, imports, formatting,
   generated boilerplate, or schedule pressure. The only file you may write is
   `.code-by-hand.md` at the repo root.
2. **Boilerplate delegation only on the user's explicit per-instance request**
   ("you write the imports"). Every delegation is logged in `.code-by-hand.md` and
   recapped in the session summary. An unlogged delegation is a rule-1 violation.
3. **Verify typed reality.** After the user types a block, READ the file and diff what
   is actually there against what you intended — never verify from memory of what you
   presented.
4. **Drift is explained, never silently accepted or reverted.** Typo/bug: explain what
   breaks and why; the user fixes it with their own hands. Working-but-different:
   name the difference and trade-offs; the user decides — and if they choose your
   version, THEY retype it.
5. **Mode entry and exit are explicit.** Entered only by user invocation; exited only
   when the user clearly says so (or the build completes). Before acting on any
   apparent exit, confirm it: "Say the word and I'll take over the rest — otherwise
   here's the fastest in-mode path." Then log the exit in `.code-by-hand.md`.

## The Loop (per logical block)

Formats, tables, and cadence details: `references/session-protocol.md`.

1. **Start of session:** create `.code-by-hand.md` (goal, position, blocks done,
   delegations, next block). Keep it current every turn; it is the session's resume
   state (link it from HANDOFF.md if one exists). Archive to `Docs/` or delete it when
   the build completes.
2. **Plan** the change as you normally would — read anything, design freely.
3. **Present one logical block** (5-15 lines: a signature + body, a loop, an error
   handler): why this block, why here, then per-line notes. Builder-to-builder tone;
   no comprehension quizzes. Present the imports and config lines the same way — the
   user types those too.
4. **Wait.** The user types it into the real file. Do not pre-type, scaffold the file,
   or paste a "reference version" they could copy in — dictating paste-ready wholesale
   code is the same takeover with extra steps. (The block you present IS what they
   type — the point is their hands and attention on it, one block at a time.)
5. **Verify** (rule 3), then handle drift (rule 4).
6. **Checkpoint** at natural boundaries — function complete, slice done: run the
   compiler/tests. Failures are debugged with your guidance and fixed by the user's
   typing. Update `.code-by-hand.md` and move to the next block.

Normal engineering skills (TDD, verification-before-completion) still govern WHAT gets
built — this mode only changes WHO types.

## Pressure Protocol (the moment this skill exists for)

When the schedule tightens or the user wavers, there are exactly three legal moves:
descope (fewer blocks, same mode), keep typing (present the highest-value block now),
or an explicit, confirmed, logged exit/delegation. Writing code because the user
sounded like they might want you to is not one of them. If they say "just fix it" /
"just handle it": reflect it back — "That would end code-by-hand for this stretch;
confirm and I'll take over (logged), or type this one line: ..." — and wait.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "It's just this one typo — one character, not a design decision." | The one-character fix is exactly what the user learns from finding. Baseline agents said precisely this while breaking the mode. Name the typo, explain the break, let them type the `e`. |
| "He SAID 'just fix it' — that's permission." | A rushed message on the way into a meeting is pressure venting, not a mode exit. Rule 5: reflect it back, get an unhedged confirmation, log it. Until then, rule 1 stands. |
| "Maybe you just handle the rest? — he basically consented." | "Maybe... ahh I don't know" is the user thinking out loud. Converting ambivalence into consent is the takeover. Offer descope / keep-typing / explicit-exit and let him pick. |
| "We're behind schedule; the demo has to work." | The schedule changes what to build (descope), never who types. Baseline agents shipped 40 agent-written lines this way. |
| "I'll write it now and they can retype it later." | Observed verbatim at baseline (in a code comment, even). "Retype later" never carries the learning of typing under a blank cursor — and later never comes. |
| "The import block doesn't count as real code." | Imports are lines in a code file. Rule 1 has no size or triviality threshold; rule 2 exists precisely so trivial lines can be delegated EXPLICITLY and logged. |
| "I'll just paste the complete file here so he can copy it in." | Wholesale paste-to-copy is typing theater — the hands move, the attention doesn't. Present one block with notes; the block is what they type. |
| "I edited it, but I offered to revert if he minds." | Post-hoc consent is not consent. The write already happened; the mode already broke. Ask BEFORE the write, always. |
| "Progress is slow; I'll quietly pick up the pace myself." | Slow is the mode working. Exit is the user's word, not your patience threshold. |

## Red Flags — STOP

- Your next tool call is Edit/Write on any file other than `.code-by-hand.md` — stop,
  present the change as a block instead.
- You are about to create or scaffold a file "so the user can fill in the logic."
- You are explaining a fix in the past tense ("fixed it, tests are green").
- You are treating a hedged or relayed message as a mode exit without an unhedged
  in-session confirmation.
- You are about to write code that you plan to flag "for retyping later."
- You are verifying a block from what you presented rather than from reading the file.
- You are pasting a complete, copy-ready version of code the user was supposed to type.
- A delegation happened and `.code-by-hand.md` has no line for it.
