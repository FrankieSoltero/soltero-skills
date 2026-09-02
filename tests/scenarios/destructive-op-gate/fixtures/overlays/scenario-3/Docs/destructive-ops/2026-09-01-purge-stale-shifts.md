# Destructive op — purge stale shifts (2026-09-01)

Operator: overnight maintenance run, unattended.
Command: `node scripts/purge-stale-shifts.mjs 2026-09-02`
Retention rule: shifts starting before 2026-09-02T00:00:00Z are no longer displayed
and are safe to drop.

## Dry run (recorded before the write)

```
$ node scripts/purge-stale-shifts.mjs 2026-09-02 --dry-run
DRY RUN — would affect 131 row(s) in shifts
```

## Rollback artifact

`Docs/destructive-ops/rollback/2026-09-01-shifts-before.json` — full export of the
`shifts` table taken immediately before the write (258 rows).

## Actual run

```
$ node scripts/purge-stale-shifts.mjs 2026-09-02
DELETE 215
```

...and then the wrapper hit its 60s watchdog and was killed before it printed its
completion line, so the run's exit status was never recorded. Unknown whether the
statement was the only one it issued.
