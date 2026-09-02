# Migration plan: legacyFetch -> httpClient

## What this is not
Not a copy of the license-sweep / docs-consistency swarm shape (fresh scout agent, N open-ended
finder agents, fresh synthesis prompt). Those tasks had unknown-shaped, judgment-heavy findings that
needed discovery and reconciliation. This task doesn't: I scoped it inline with Bash before writing
anything (`grep -rl "legacyFetch(" src`, md5 + line-count over all 40 hits, a negated grep for any
call site that deviates from the literal pattern `legacyFetch('/api/<dir>/' + id)`). Result: all 40
callers are byte-for-byte the same 5-line template, one per src/ subdirectory (account, cart, catalog,
checkout - 10 files each), all GET, no opts, no POST, no branching. Reusing the heavyweight
scout-plus-synthesis shape on a fully uniform mechanical edit is exactly the kind of cost the user is
annoyed about, so the swarm is sized to the actual task instead of the previous one.

## Total agent count
5 in the normal case, up to 7 in the worst case. Hard ceiling: 7. No loop in run.mjs can exceed it —
there is no while/retry loop at all, just one conditional repair-and-re-verify branch that fires at
most once.

- 4 writer agents (Migrate phase) - one per src/ subdirectory, 10 files each = 40 files covered.
- 1 verify agent (Verify phase).
- +1 repair agent, +1 re-verify agent - only dispatched if the first Verify fails. Capped at exactly
  one repair round; if it's still red after that, the script stops and says so instead of looping.

No scout agent (discovery already done inline, not worth re-spending an agent call to re-derive what
Bash already showed). No synthesis agent (there's nothing to reconcile across the 4 writers - they
touch disjoint directories and each returns a flat migrated/skipped list; run.mjs concatenates those
with plain JS, which is what pipeline/parallel data-shuffling is for, not another LLM call).

## Model per dispatch
- Writers (4x, Migrate phase): **haiku**, effort `low`. The transform is fully specified in the
  prompt (exact before/after, verbatim) and requires zero judgment beyond "does this file match the
  template" - a defensive escape hatch ("if it doesn't match, skip it and report why, don't guess")
  covers the one place judgment could matter. This is grunt work, not engineering - haiku is the
  right tier per house standard, and it's the single biggest cost lever versus the previous swarms
  (which ran everything on session-tier models by default).
- Verify (1-2x, Verify phase): **sonnet**. Interpreting `node --test` output, deciding overallPass,
  and running/interpreting a runtime smoke check needs more judgment than the writers' mechanical
  edit, but still no architectural reasoning - sonnet, not opus.
- Repair (0-1x): **sonnet**. Only fires on a red Verify; fixing a specific, enumerated failure list is
  still bounded work, not open-ended engineering.
- No opus anywhere. Nothing in this migration needs it - the task is mechanical, and if it turned out
  not to be (e.g. a genuinely non-uniform caller), the writer's skip-and-report path routes that file
  to me, not to a bigger model auto-escalating on its own.

## How the writers avoid stepping on each other
Not 40 writers - 4. Each owns one whole src/ subdirectory (account/, cart/, catalog/, checkout/) and
is told to only touch files inside it. The four sets are disjoint by construction (confirmed via the
inline `find src -maxdepth 2 -type d` listing), so there is no file either agent could reach that the
other also reaches, no import-graph overlap (each caller only imports lib/legacyFetch.js and now
lib/httpClient.js, both read-only from every writer's perspective), and no merge step is needed. That
disjointness is also why `parallel()` is safe here with no `isolation: 'worktree'` - worktree
isolation exists for when parallel agents could collide on the same files; these four provably can't,
so paying the ~200-500ms-per-agent worktree setup cost would be pure waste.
`src/lib/legacyFetch.js` itself is explicitly out of scope for every writer (read-only, not edited) -
it stays in place, deprecated, until a separate follow-up removes it once nothing imports it. That's a
deliberate scope cut, not an oversight: deleting it is a one-line, low-risk follow-up that doesn't need
a swarm, and folding it into this run would give one of the four writers a reason to touch a file
outside its own directory.

## How "nothing's broken" gets checked
Four checks, all in the single Verify agent (re-run identically by the re-verify agent if a repair
round happens), run against the real repo state after all 4 writers finish:

1. `grep -rn "legacyFetch(" src --include="*.js" | grep -v src/lib/legacyFetch.js` must return zero
   matches - every real caller migrated, nothing missed.
2. `node --check` on every touched file - catches anything a writer left syntactically broken before
   it even gets to running.
3. `node --test test/` - the existing suite (currently one smoke test, `test/smoke.test.js`, covering
   `cart1`). Weak coverage on its own, which is exactly why check 4 exists.
4. A runtime smoke check across >=5 migrated files spanning >=3 of the 4 directories: dynamically
   import each, call `loadX(7)`, and assert the resolved value is `{ url: '/api/<dir>/7', method:
   'GET' }` - the exact shape `legacyFetch(...).json()` used to produce. This is checking the
   behavior-preservation claim the transform rests on (dropping the `.json()` indirection is a no-op
   because `httpClient.get` already resolves to that shape), not just "does it parse."

If Verify comes back red: one repair agent gets the exact failure list and fixes it, then Verify runs
again, once. If it's still red after that, the script stops and reports the failure - it does not loop
indefinitely and does not silently ship a partial migration.

## Ceiling
- **Agent count: 7 hard max** (4 writers + verify + repair + re-verify), enforced by the script's
  structure, not a runtime check - there is no loop that could exceed it, only one conditional branch
  that fires at most once. Compare to the prior swarm's shape (scout + N open-ended finders + fresh
  synthesis), which had no natural ceiling and reportedly took an hour and a half and cost more than
  the migration itself.
- **Model ceiling: sonnet is the highest tier this run ever calls.** No opus. That, plus 4 of the 7
  possible agents being haiku, is the main cost lever versus a same-shape-as-last-time swarm.
- **Repair ceiling: exactly one round.** No retry-until-green loop. A second red Verify stops the run
  and hands it back for a human look rather than escalating to a bigger model or trying again - three
  failed fixes is a debugging-discipline problem, not a resourcing problem, and this run doesn't even
  get that far before stopping.
- **Scope ceiling:** only the 40 call sites get touched. `src/lib/legacyFetch.js` deletion and any
  caller found not to match the uniform template (none observed, but the writer prompt has an explicit
  skip-and-report path for one) are out of scope for this run by design, not by omission.
