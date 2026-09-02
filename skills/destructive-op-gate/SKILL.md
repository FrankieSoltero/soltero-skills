---
name: destructive-op-gate
description: Use before running — or writing code that runs — an irreversible or multi-record write against a system that may be live or shared: "clear out the following bars and all of their employees", any wipe/purge/"remove all X" request, a destructive feature exercised on a real customer account ("I accidentally tested it on her prod account"), a bulk delete or cascade strip, a data-dropping migration, or any DELETE/UPDATE/TRUNCATE against a DATABASE_URL that is not provably localhost. Resolves the real target from the actual connection string instead of the conversation's description of it, enumerates the target set by id, requires a matching count-only dry run and a verified on-disk rollback artifact before the write, mints a stable idempotency key, fails closed on an unresolved environment or a count mismatch, takes typed human approval only at the top tier, and records the whole thing under Docs/destructive-ops/.
---

# Destructive Op Gate

## Overview

**The target is whatever the config resolves to, not what the conversation calls it.**
Every expensive version of this mistake starts with a sentence — "it's pointed at
staging", "she said it's fine", "re-running is a no-op" — that nobody checked against the
connection string. The gate replaces those sentences with two script outputs and one file
on disk, and it is FAIL-CLOSED: an unresolved environment, a count that doesn't match, or
a rollback artifact you haven't confirmed exists all block the write.

## When to Use

Before the *irrevocable* call, not the first call of a multi-step action: a delete,
update, truncate, cascade strip, or data-dropping migration against a target that is not
provably local; a destructive feature exercised against a real customer or tenant record;
a bulk write spanning more than one entity; any request phrased as clear out / wipe /
purge / remove all.

## When NOT to Use

Ordinary local development is out of scope entirely: reads, running the app, a migration
against a scratch database you can recreate from a seed. A destructive multi-record write
against a target the resolver calls `local` is tier 2 — steps 1–5 apply, the approval step
does not. Nothing here gates routine work, and that restraint is the point: a gate that
fires on everything is the approval fatigue that makes the tier-3 prompt meaningless when
it finally matters. This skill also does not review schema or query source for defects (that is
`prisma-safety-review`), gate lifecycle claims like "done" or "merge-ready" (that is
`evidence-gate`), or install anything.

## Tiers

| Tier | What it covers | Gate |
|------|----------------|------|
| 1 read-only | SELECT, dry runs, exports, reading config | none |
| 2 sandbox write | writes to a target `resolve-target.mjs` calls `local`, with a rollback path | steps 1–5, no approval |
| 3 live destructive | anything against `production`, `staging`, or `unknown`; any write to shared or customer data | all steps, typed approval |

`unknown` sits in tier 3 on purpose. "I could not tell what this points at" is the
condition under which the expensive mistakes happen, so it gets the expensive treatment.

## The Gate

1. **Resolve the target from the config, not the conversation.**
   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/resolve-target.mjs --dotenv .env
   node ${CLAUDE_SKILL_DIR}/scripts/resolve-target.mjs --env-var DATABASE_URL
   ```
   Read the printed reason and quote it. Exit 1 means `unknown` — stop there; do not
   substitute your own judgment about whether the host "looks like" a dev box. When the
   config and a human's description disagree, the config wins and you say so out loud.
2. **Classify the tier** from that classification, and state which tier you are in before
   going further.
3. **Enumerate the target set by id**, and write the ids to a file. A name, a filter, or
   a date predicate is not an identity — the whole failure mode of a bad predicate is
   that it looks correct and selects the wrong rows.
4. **Count-only dry run, compared mechanically** against that enumeration — the ids you
   listed are the expected side, the dry run's number is the actual side:
   ```bash
   node ${CLAUDE_SKILL_DIR}/scripts/compare-counts.mjs \
     --expected-ids ids.txt --actual-file dryrun.txt --op purge_shifts --target <host/db>
   ```
   MATCH or stop. MISMATCH and INDETERMINATE both exit 1, and INDETERMINATE — "I could
   not extract a number" — is a block, not a shrug.
5. **Produce the rollback artifact, then confirm it exists.** Export the exact rows to
   `Docs/destructive-ops/rollback/YYYY-MM-DD-<op>.json` and re-read the file: it is on
   disk and its row count equals the enumeration. A backup you believe you took is not a
   rollback path. If the rows genuinely cannot be exported, that is not a reason to skip
   the step — it is the finding, and it goes to the human.
6. **Mint the idempotency key** and record it. Step 4 prints it; `--expected-ids ids.txt
   --op <name> --target <host/db>` alone prints it with no comparison. It derives from the
   target plus the sorted id set, so the *same* logical operation retried after a timeout
   carries the *same* key and can be recognized as already applied. A key minted per
   attempt defeats its own purpose, and a row count cannot mint one at all.
7. **Typed approval — tier 3 only.** Show the resolved host and database, the counts, the
   ids (or their range and total), the rollback artifact path, and the key; then ask the
   human to type the operation. A standing "just run it", a prior month's identical
   cleanup, a client's "I trust you guys", or an owner who is unreachable are all the
   absence of approval, not a substitute for it.
8. **Write, then verify against the prediction.** Re-query and compare actual to
   predicted with the same script. A mismatch is an open finding: restore from the
   rollback artifact rather than reasoning about whether the extra rows mattered. If the
   repair has no audited write path — the tool can DELETE but not INSERT — that is a
   second finding for the record, never a licence to edit the data store by hand.
9. **Record it** in `Docs/destructive-ops/YYYY-MM-DD-<op>.md` — resolved target and the
   resolver's reason, tier, enumerated ids, dry-run and actual counts, rollback path,
   idempotency key, the approval text the human typed, and the post-write check. The
   record is the deliverable when you block: an owner who returns to a chat message has
   to redo your whole investigation, and an owner who returns to this file does not.

## Hard rules

1. Nothing in the conversation resolves an environment — not the user's, not a NOTES
   file's, not your own earlier message. Only the config the tool will actually read.
2. Never manufacture test data in a shared database to make an exercise possible. Seed a
   local target instead; if the data cannot be produced locally, that is what you report.
3. A retry after a timeout or a partial run is a *new* tier-3 operation: re-resolve,
   re-enumerate, re-compare. "Deleting rows that are already gone is a no-op" assumes the
   predicate was right, which is the thing in doubt.
4. Approval covers the enumerated ids you showed. Re-enumerate and re-ask if the set,
   the target, or the predicate changes.
5. Blocking is not the whole job. Leave the resolver output, the id list, and the
   proposed approval text on disk so the human's next move costs a minute, not an hour.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "They said DATABASE_URL points at staging." | Run the resolver. A sentence is not a connection string. |
| "The host name looks like a dev box." | Then the resolver says `local` and you have lost nothing by checking. If it says `unknown`, that is tier 3. |
| "The client gave written permission." | Permission to use their account is not permission to be the first real run of untested destructive code. |
| "It's only a few rows / only the barback role." | A small blast radius on an unverified predicate is a smaller sample of the same unknown. |
| "Re-running is idempotent." | Only if the predicate was right and the run issued nothing else. Neither is established. |
| "I took a backup." | Confirm the file exists and its row count matches. A claimed backup that isn't on disk is the classic version of this failure. |
| "The dry run and the total both looked plausible." | Plausible is not equal. Compare the enumeration to the dry run with the script. |
| "215 versus 131 is the same order of magnitude." | It is 84 rows somebody will look for. Restore from the artifact and report it. |
| "He asked me to do this exact cleanup last month." | Last month's approval covered last month's ids against last month's target. |
| "This is a repair, not a destructive op." | A write to live data is a write. Restoring rows by hand-editing the store is the same tier as the delete that lost them — re-resolve, re-enumerate, re-approve. |
| "The ids are in the record, I can clean up the scratch export." | The export is what makes the repair cheap. Keep it until the repair is verified. |
| "The demo is in 40 minutes." | Fail-closed means the demo moves, not the gate. |

## Red Flags — STOP

- About to run a destructive statement without having read a resolver line this session.
- Deciding an environment from row contents — names that "look real", plausible
  timestamps — instead of from the connection string.
- Writing to a shared database to create test data, or to "just check" a behavior.
- Reporting a backup, an export, or a snapshot you have not re-read from disk.
- Treating INDETERMINATE, `unknown`, or a killed run as "probably fine".
- Reaching for a smaller version of the same unverified operation as the compromise.
- Repairing a bad write by editing the data store directly, outside the audited write path.
- Tidying away an export, a staged row set, or a backup because "the write is finished".
- Blocking correctly and then leaving no artifact behind.

## Details

`reference.md` — the record and rollback formats, the tier boundaries in full, script
options, portability outside Claude Code, and the **opt-in** PreToolUse guard (never
installed by this skill).
