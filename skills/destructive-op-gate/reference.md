# Destructive Op Gate — Reference

## The record: `Docs/destructive-ops/YYYY-MM-DD-<op>.md`

One file per operation, written whether the operation ran or was blocked. A blocked
operation's record is the more valuable of the two: it is what lets the human act in a
minute instead of re-running your whole investigation.

```markdown
# Destructive op — <op> (YYYY-MM-DD)

- Requested by: <who, and their exact words>
- Tier: 3 (live destructive)
- Status: BLOCKED — awaiting typed approval | APPLIED | ROLLED BACK

## Resolved target
    TARGET: PRODUCTION
      source   .env → DATABASE_URL
      host     ep-shrill-band-42891.us-east-2.aws.neon.tech
      database lastcall
      reason   hosted database provider … treated as production; corroborated by NODE_ENV=production

The request described this target as "the staging mirror". The config disagrees; the
config governs.

## Target set
- Enumerated ids: `Docs/destructive-ops/ids/YYYY-MM-DD-<op>.txt` (8 orgs, 83 employees)
- Dry run: `DRY RUN — would affect 83 row(s) in employees`
- Comparison: `compare-counts.mjs --expected-ids ids.txt --actual-file dryrun.txt --op
  delete_pilot_orgs --target <host/db>` → `COMPARE: MATCH  expected 83  actual 83`

## Rollback artifact
`Docs/destructive-ops/rollback/YYYY-MM-DD-<op>.json` — 83 rows, re-read from disk after
writing (row count verified against the enumeration).

## Idempotency key
`delete_pilot_orgs:9f3c1ab77d20e451`

## Approval
<the text the human typed, verbatim, with a timestamp — or "none yet">

## Post-write check
Re-query + `compare-counts.mjs`: <verdict>. On MISMATCH: what was restored, from which
artifact, and what remains open.
```

Keep credentials out of the record: the resolver already prints the URL with the password
replaced by `***`, so paste its output rather than the raw connection string.

## Rollback artifact contract

- Exact rows, not a schema dump or a "latest backup" that someone else's job produces.
- Written **before** the destructive statement, under
  `Docs/destructive-ops/rollback/YYYY-MM-DD-<op>.json`.
- Re-read after writing: the file exists and its row count equals the enumeration. An
  export you believe you took is not a rollback path — a baseline run reported taking one
  that was not on disk, and that is the ordinary case, not an unlucky one.
- A held-open transaction you can `ROLLBACK` counts, but only while the session that holds
  it is alive; if the write and the approval are separated by a human's response time,
  export instead. This is the difference between bounded scope and delayed commit: the
  transaction protects the statement, the export protects the decision.
- When rows genuinely cannot be exported (volume, PII handling, no read path), that is a
  finding to report at the approval step, not a step to skip.

## Idempotency keys

`compare-counts.mjs --op <name> --target <host/db> --expected-ids <file>` prints
`<op>:<16 hex>`, a digest over the target plus the sorted, de-duplicated id set. Before
the write there is no second id set to compare against, so that invocation reports
`KEY_ONLY` and mints the key on its own; add `--actual-file dryrun.txt` to get the step-4
comparison and the key in one call.

- Stable across retries of the *same* logical operation, which is the whole point: a run
  killed by a watchdog can be recognized on the second attempt.
- A key minted per attempt dedupes nothing. Neither does one minted from a row count —
  the script refuses that case rather than emitting a key that looks stable and isn't.
- Record the key with the operation. Where the target system supports it (a
  `processed_operations` row, a request header, a queue message id), send it; where it
  does not, the record is the ledger.

## Tier boundaries in full

| Signal | Tier |
|--------|------|
| `resolve-target.mjs` says `local` | 2 (or 1 if read-only) |
| says `staging` | 3 — shared with other people's work, and the resolver cannot tell a scrubbed mirror from a mislabelled prod host |
| says `production` | 3 |
| says `unknown` (exit 1) | 3 — unresolved is the condition the incidents happened under |
| No connection string involved: a feature exercised against a real customer/tenant record | 3, regardless of what the host resolves to |
| Multi-entity write inside an otherwise local dev loop | 2, but steps 3–5 still apply |

## Script options

`scripts/resolve-target.mjs`
- `--help` prints the usage line and exits 0 (both scripts).
- `--url <conn>` | `--dotenv <path>` `[--var NAME]` | `--env-var NAME` — pick the source.
  (The flag is `--dotenv`, not `--env-file`: Node consumes `--env-file` itself.)
- `--json` for machine-readable output; `--assert local|staging|production` to gate a
  script (exit 1 on mismatch).
- Exit 0 resolved, 1 `unknown` or failed assertion, 2 usage error.
- Never prints the password, in either output mode.

`scripts/compare-counts.mjs`
- `--expected N --actual N`, or `--expected-file/--actual-file` (extracts a count from
  dry-run output, psql command tags, `count(*)` results, or a `(N rows)` footer), or
  `--expected-ids` paired with `--actual-ids` (set comparison naming the extra and missing
  ids), with `--actual`/`--actual-file` (the pre-write shape: enumerated ids versus the
  dry run's count), or alone with `--op` (mint the key, `KEY_ONLY`, no comparison).
- `--op NAME [--target T]` mints the idempotency key; `--json` for structured output.
- ID files: one id per line, a psql single-column dump, a JSON array, or a comma list.
  Composite ids (`org:1`) are kept whole, `#` comment lines and a leading all-alphabetic
  header line are ignored. A file that yields no ids is INDETERMINATE, not empty-equals-
  empty.
- Exit 0 MATCH or KEY_ONLY, 1 MISMATCH or INDETERMINATE, 2 usage error. Ambiguous
  output — two different candidate counts — is INDETERMINATE by design; the script does
  not pick one.

`scripts/destructive-shapes.mjs`
- `destructive-shapes.mjs "<command>"` or `- ` to read stdin. Exit 1 if any shape matched.
- Shapes: `DROP`, `TRUNCATE`, `DELETE`/`UPDATE` with no `WHERE`, schema-resetting
  migration commands (`prisma migrate reset`, `prisma db push --accept-data-loss`,
  `dropdb`, …), and `rm -rf` outside `/tmp` or with an unresolvable target.

## The PreToolUse guard — opt-in, never auto-installed

`hooks/pretooluse-guard.mjs` turns those shapes into a confirmation prompt on Bash calls.
It ships with this skill and **nothing installs it**. Neither the skill nor the plugin
writes to anyone's settings; a human adds it deliberately or it never runs:

```jsonc
// ~/.claude/settings.json  (or a project's .claude/settings.json)
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "node /absolute/path/to/skills/destructive-op-gate/hooks/pretooluse-guard.mjs"
      }]
    }]
  }
}
```

`DOG_GUARD_MODE=ask` (default) prompts; `deny` refuses the call outright; `off` disables
it without editing settings.

What it is honestly worth: it reads shell text and nothing else. It cannot see the
resolved connection string, the row count, or whether a rollback export exists, so it
routes a command into the gate rather than deciding anything, and it will produce false
positives on safe commands. It sees only `Bash` tool calls, so a destructive write issued
through an MCP database tool, an ORM call, or a Node script slips past untouched — a quiet
hook is not evidence that a write is safe. On an internal error it stays silent and allows
the call rather than wedging the session. It is a speed bump, not a boundary; the judgment
in `SKILL.md` is what actually does the work.

## Portability outside Claude Code

- The two scripts and the matcher are plain Node with no dependencies (`node:` builtins
  only) and run under any agent that can execute a shell command. `${CLAUDE_SKILL_DIR}` is
  a Claude Code convenience — substitute the checkout path.
- `hooks/pretooluse-guard.mjs` speaks Claude Code's PreToolUse JSON contract
  (`permissionDecision`) and has no equivalent on other agents. Elsewhere, run
  `scripts/destructive-shapes.mjs` on the command yourself before executing it, or wire
  the matcher into whatever pre-execution hook your agent provides.
- Everything else in this skill is prose and file conventions, and carries over unchanged.

## Related skills

`prisma-safety-review` reviews schema, migration, and query *source* at code-review time —
it flags a transaction-less bulk write in a file; this gate stops the run. `evidence-gate`
gates lifecycle claims ("tests pass", "merge-ready") with hash-bound receipts and has
nothing to say about side effects on live data. `capture-lesson` is where a near miss goes
after the record is written.
