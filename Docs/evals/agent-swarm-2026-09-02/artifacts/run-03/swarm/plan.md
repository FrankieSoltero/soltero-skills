# legacyFetch → httpClient migration — swarm plan

## What this reuses vs. what's fresh

Reused, unchanged: the agent-swarm universal runner
(`skills/agent-swarm/workflows/swarm.mjs`) and its planner
(`skills/agent-swarm/scripts/swarm-plan.mjs`). No new Workflow script was written — that is
the exact 200–300-line-script-per-purpose pattern the user is objecting to, and this skill
exists to replace it.

Fresh, and the only thing fresh: `.soltero/swarm/legacyfetch-migration.json`, a spec file. It
is adapted from the worked "transform" example already checked into
`skills/agent-swarm/references/spec-format.md` — that reference literally ships a
legacyFetch→httpClient spec as its shape-5 example. The only edits from that reference example
were: pointing `items` at this repo's real four subsystem directories, tightening the
migration rule to the exact call shape this codebase uses (below), and pointing
`synth.outputPath` at this task's `swarm/` directory instead of `Docs/`.

## Inline scout (no scout agent)

```
grep -rl "legacyFetch(" src | sort
```
40 caller files, evenly split across four subsystem directories (10 each):
`src/account` (account1.js–account10.js), `src/cart` (cart1.js–cart10.js),
`src/catalog` (catalog1.js–catalog10.js), `src/checkout` (checkout1.js–checkout10.js).
`src/lib/legacyFetch.js` itself also matches the grep (it defines the function) and is
excluded — it is not a caller.

Every one of the 40 callers uses the identical shape:
```js
import { legacyFetch } from '../lib/legacyFetch.js';
export async function load<name>(id) {
  const r = await legacyFetch('/api/<subsystem>/' + id);
  return r.json();
}
```
`httpClient.get(url)` (in `src/lib/httpClient.js`) already returns the parsed object directly
— no `.json()` step. So the migration rule is mechanical and uniform across all 40 sites:

```js
// before
import { legacyFetch } from '../lib/legacyFetch.js';
const r = await legacyFetch(url);
return r.json();

// after
import { httpClient } from '../lib/httpClient.js';
return httpClient.get(url);
```

Because the rule is uniform, this is a `shape: "transform"` swarm: writers over write-*scopes*,
not one writer per file. **4 writers, not 40.** A writer per file would be 40 opus dispatches
for one repeated four-line substitution — the exact expensive mistake the skill's
rationalization table calls out ("Forty files, forty writers... the rule is the work; a scope
of ~10 files is the item").

## Dispatch table

| Stage | Key | Model (tier) | Items | Count |
|---|---|---|---|---|
| lane `migrate` | migrate | **opus** (engineering — this is code-writing) | `src/account`, `src/cart`, `src/catalog`, `src/checkout` | 4 |
| synth | — | **sonnet** (status list, not a judgment call — the reference spec pins synth to sonnet for this shape, not opus) | all 4 writer results | 1 |
| scout | — | none — inline `grep -rl`, free | — | 0 |
| verify | — | none — `shape: transform` has no findings lane, so no verify stage; the item's own `node --check` + `npm test` run is the evidence | — | 0 |

**Total: 5 agents.** By tier: opus=4, sonnet=1, haiku=0.

## Gate result (already run, not simulated)

```
$ node skills/agent-swarm/scripts/swarm-plan.mjs .soltero/swarm/legacyfetch-migration.json
VERDICT: DISPATCHABLE (mode: workflow)
agents: 5 (ceiling 8)
by tier: opus=4 sonnet=1 haiku=0
by stage: scout=0 lanes=4 verify=0 synth=1
relative cost units: 21 (ceiling 30)
```

## Ceiling

`ceiling.agents: 8` (declared in the spec, enforced by the runner — not a number in this
document). The user marked this "unmarked" for width (annoyed about cost, no explicit number),
so per the skill's sizing table that's ≤25; 8 is set deliberately tighter than that because the
scout already shows the work is exactly 4 uniform scopes plus 1 synth — there is no scenario in
which this spec legitimately needs more than 5, so the ceiling is set just above committed
spend (5) rather than at the unmarked default (25), leaving headroom only for a retry, not for
scope creep. `ceiling.units: 30` is the second cap (opus is 5x weight); committed spend is 21.
If the runner ever tried to dispatch a 6th+ agent under this spec, it drops the dispatch and
names it in `dropped` rather than silently spending past 5.

## How the 4 writers avoid stepping on each other

- **Non-overlapping scopes by construction.** Each lane item is a distinct top-level directory
  under `src/` (`account`, `cart`, `catalog`, `checkout`). The migration rule for each writer is
  "touch nothing outside {item}" — no writer's file set intersects another's; there is no
  shared file (not even `src/lib/httpClient.js`, which is read-only to all four — none of them
  edit it, they only add an import of it).
- **`serial: true`, not `isolation: "worktree"`.** The spec sets `writes: true` +
  `serial: true`: the runner runs the four scopes one after another against the live working
  tree, not concurrently. Because the scopes don't overlap, concurrency would already be safe
  on file-content grounds — `serial` is chosen anyway because wall-clock is not the stated
  constraint here (cost is), and serial execution means no worktree-per-lane setup and no merge
  step afterward. If a future run of this same spec needed concurrency, the fix is
  `isolation: "worktree"` on the lane, not adding writers.
- **Each writer's own verification gate.** Every writer runs `node --check` on the files it
  touched and `npm test` from `{root}` before returning, and reports `DONE` vs.
  `DONE_WITH_CONCERNS` (naming any caller whose shape doesn't match the rule, which it leaves
  untouched rather than guessing). Because scopes run serially, a broken scope N still lets
  scopes N+1..4 proceed with a clean tree from scope N onward (or the operator can stop after
  reading scope N's report — this plan does not auto-abort on concern, it surfaces it in synth
  first).

## How "nothing's broken" gets checked

1. **Per-scope, inside each of the 4 writer dispatches:** `node --check <touched files>` (syntax)
   and `npm test` (the existing `node --test test/` suite, currently one smoke test —
   `test/smoke.test.js` exercises `loadcart1`, so at minimum the cart scope's migration is
   exercised end-to-end by the existing suite). Each writer returns the observed result lines
   as evidence in its `result.evidence` field — not a self-report of "looks fine."
2. **Across scopes, in the synth agent (sonnet):** reads all 4 result objects, lists any
   non-`DONE` scope first with its concern (so a partial/failed scope cannot get buried under
   three good ones), then the `DONE` scopes with their test-evidence line, and reports a count
   of legacyFetch call sites migrated vs. left untouched (should be 40 / 0 if every scope
   matched the uniform rule; anything else is visible in the output file, not silently absorbed).
3. **At relay time:** the run's return (`agentsSpent`, `byTier`, `dropped`, `outputPath`,
   `summary`) is what gets reported back — a `DONE_WITH_CONCERNS` or non-empty `dropped` is
   reported as partial, never rounded up to "done."

## What was reused vs. written fresh (explicit)

- Reused as-is: `workflows/swarm.mjs` (universal runner), `scripts/swarm-plan.mjs` (gate).
- Reused as a template: the `legacyfetch-migration` example in
  `skills/agent-swarm/references/spec-format.md` — same shape, same lane structure, same
  `serial: true` choice, same tier pins.
- Written fresh: the spec's `items` (this repo's real 4 directories, not placeholder paths),
  the migration rule text (matched to this repo's actual call shape, including the
  `httpClient.get` no-`.json()` detail, which the generic reference example didn't need to
  spell out), and `synth.outputPath` pointed at this task's `swarm/` directory.
- Not written: a scout agent (the file list came from one `grep -rl`), a verify stage
  (transform shape has none — the tests are the evidence), or a new Workflow script of any kind.
