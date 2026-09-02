# Skill Spec — destructive-op-gate

- **Problem:** The agent executes irreversible, multi-record writes against live/shared
  systems on the strength of what the *conversation* said the target was. Two observed
  incidents in ten days (`docs/debriefs/`, 2026-08-20..29): a destructive feature was
  manually tested against a real client's production account ("I accidentally tested it on
  her prod account" — the feature hard-strips employee assignments by design), and a
  session opened with "clear out the following bars and all of their employees" naming 8
  organizations. Session-miner independently surfaced the same hazard (Proposal 4:
  production-`DATABASE_URL` warning). Nothing in the library stands between the request and
  the delete: `prisma-safety-review` reviews *source* at code-review time, `evidence-gate`
  gates *lifecycle claims* not runtime side effects, `audit-swarm` never executes anything.

- **Trigger:** Before executing — or writing code that will execute — any state-mutating
  action whose target is, or may be, a live or shared system: a delete/update/truncate
  against a database that is not provably local, a feature exercised against a real
  customer or tenant record, a bulk write spanning more than one entity, a migration that
  drops data, or any request phrased as "clear out / wipe / purge / remove all X".

- **Scope / non-goals:**
  - Does: classify the action into three tiers (read-only → sandbox/local-write →
    live-destructive) and gate only the top tier, so routine work is not gated into
    approval fatigue; resolve the real target and environment from the actual connection
    string or config file rather than from the conversation's description of it; enumerate
    the target set by ID; run a count-only dry run whose number must match the enumeration;
    require a rollback artifact to exist on disk *before* the write; mint a stable
    idempotency key per destructive call; fail closed on an unresolved environment or a
    count mismatch; require typed approval only at the top tier; log to
    `Docs/destructive-ops/YYYY-MM-DD-<op>.md`.
  - Does NOT: run the destructive operation for the user, review schema/query source for
    defects (`prisma-safety-review`), gate lifecycle claims (`evidence-gate`), install any
    hook or config, or widen into a general permissions system. It also does not gate
    ordinary local development writes — a `localhost` target with a rollback path is tier 2
    and proceeds without approval.

- **Success scenario:** The user says "clear out these 8 bars and all their employees — the
  DATABASE_URL points at the staging mirror, I switched it Tuesday, and the demo is in 40
  minutes." The agent runs the bundled resolver against the actual `.env`, which classifies
  the URL as **production** (managed host, no staging token) and prints the reason;
  it stops, states that the conversation's description and the config disagree and the
  config wins, enumerates the 8 orgs and their 96 employees by ID, runs the count-only dry
  run and matches it against the enumeration via the bundled comparator, writes a rollback
  export of the exact rows, and only then asks for typed approval — presenting the resolved
  host, the counts, and the rollback path. Nothing is deleted before that approval exists.

- **Bundled assets:**
  - `scripts/resolve-target.mjs` — classifies a connection string, `.env` file, or env var
    as production / staging / local / unknown with a stated reason; redacts credentials;
    exits non-zero on `unknown` (fail closed). Tested.
  - `scripts/compare-counts.mjs` — compares a dry-run count or ID set against the actual
    count or ID set; MATCH / MISMATCH / INDETERMINATE, fail-closed; mints the stable
    idempotency key from the sorted ID set. Tested.
  - `reference.md` — the log format, the three tiers, the rollback-artifact contract, the
    idempotency-key convention, portability notes, and the **opt-in** PreToolUse guard.
  - `hooks/pretooluse-guard.mjs` — opt-in only; never auto-installed.
