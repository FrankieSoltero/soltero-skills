# code-by-hand — Session Protocol Reference

## Block presentation format

One logical block per turn, 5-15 lines (a signature + body, a loop, an error handler).
Judgment within the range is yours; going line-by-line briefly for a dense section is
fine, but it is a narrowing of the same loop, not a different mode. Structure:

```
### Block N — <label>  (file, where it goes)

Why this block, why here: 1-3 sentences — what it does for the feature and why it
comes before/after its neighbors.

<the code, exactly as they should type it>

Line notes:
- L1: <what this line does / why this construct>
- L2: ...
```

Builder-to-builder tone: explain intent and trade-offs the way you would to a peer.
No comprehension quizzes, no "can you tell me why?" — that is walkthrough-tutor's
domain. Answer questions when asked; volunteer the why unprompted.

Imports/config/constants are presented as blocks (or lines within a block) like
everything else — the user types them unless explicitly delegated.

## Verification (every block)

1. Read the file — the actual bytes, not your memory of the block.
2. Diff typed-reality vs intent, then use the drift table.
3. Update `.code-by-hand.md` (position, blocks done).

## Drift-handling decision table

| What you find | Your move | Never |
|---|---|---|
| Matches intent | Confirm briefly, next block. | Re-explaining everything. |
| Typo / bug (won't compile, wrong behavior) | Point at the exact line, explain what breaks and WHY it breaks; the user types the fix. | Fixing it yourself — even one character, even with the user away. Park the session until they're back if needed. |
| Working-but-different (their variant is correct) | Name the actual difference and its trade-offs; recommend if you have a preference; the user decides. If they pick your version, THEY retype it. | Silent accept ("looks good!") without reading and naming the delta; silent revert / "tidy-up" — including when they ASK you to tidy it (offer the line for them to retype instead, or a logged explicit delegation). |
| Partially typed / interrupted | Note where they stopped in `.code-by-hand.md`; resume from there next turn. | Completing it for them. |

## Checkpoint cadence

Run the compiler/tests at natural boundaries — a function completed, a vertical slice
done, before switching files — not after every block (too chatty) and not only at the
end (too late). On failure: diagnose out loud, point to the line(s), explain the
failure mode; the user types every fix. Checkpoint results go in the session log line
for that block ("block 3 done, tests green").

## `.code-by-hand.md` file format

Lives at the repo root for the whole session. The ONE file the agent writes. Created
at session start, updated every turn, archived to `Docs/` (or deleted, user's call)
when the build completes. If a `HANDOFF.md` exists, link this file from it — it is the
mode's own resume state across sessions.

```markdown
# code-by-hand session — active

- Goal: <one line — what is being built by hand>
- Started: <YYYY-MM-DD>
- Position: <file> — block <n> of <est. total> (<label>)
- Blocks completed:
  - [x] 1. <label> (<file>) — <checkpoint note if any>
- Delegations: none
  <!-- or: - <YYYY-MM-DD> <file>:<what> — user said: "<their exact words>" -->
- Mode exits: none
  <!-- or: - <YYYY-MM-DD> <scope> — user confirmed: "<their exact words>" -->
- Next block: <n>. <label> — <one-line intent>
```

## Delegation logging

A delegation is valid only when all three hold:

1. The user asked for THIS instance explicitly ("you write the imports") — not a
   standing "handle the boring stuff," not a hedged "maybe you...?", not urgency.
2. It is boilerplate (imports, config stanzas, mechanical repetition) — a typo fix or
   a logic block is never delegable; that work is the mode's whole point.
3. It is logged in `.code-by-hand.md` under Delegations (date, file, what, the user's
   exact words) before or immediately after the write, and recapped in the session
   summary.

If any leg is missing, present the lines for the user to type instead.

## Exit protocol

- Exit happens when the user clearly says so ("let's drop the mode", "you take over
  the rest — confirmed") or the build completes. Anything hedged ("maybe you just
  handle it? I don't know") gets reflected back with the three legal options:
  descope / keep typing the highest-value block / explicit exit. Wait for the answer.
- On exit: log it (scope + the user's words) in `.code-by-hand.md`, then proceed as a
  normal agent. On completion: run the final checkpoint, write the session summary
  (blocks, delegations, exits), archive or delete `.code-by-hand.md` per the user.
- Session breaks are not exits — the state file survives; resume from Position.
