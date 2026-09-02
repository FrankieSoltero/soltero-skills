# Swarm spec format

One JSON file per swarm, saved in the run's workspace (`.soltero/swarm/<name>.json` is the
default home). The planner reads it; the runner executes it. A new purpose is a new spec —
never a new workflow script.

```jsonc
{
  "name": "pii-sweep",                 // slug; used in labels and {name}
  "shape": "find",                     // understand | find | research | transform | judge
  "goal": "Find every API response that returns customer PII without redact()",
  "ceiling": { "agents": 40, "units": 60 },   // agents REQUIRED (hard cap; the runner drops dispatches past it and says so);
                                       //   units optional: a second cap on relative cost (agents × tier weight)
  "weights": { "opus": 5, "sonnet": 1, "haiku": 0.3 },   // optional relative-cost weights for the planner's units line

  "scout": null,                       // or { "model": "haiku", "prompt": "...", "effort": "low" }
                                       //   — only when the work-list cannot be produced inline (grep/ls first!)

  "lanes": [                           // one entry per kind of worker; items fan out inside each lane
    {
      "key": "find-pii",
      "model": "sonnet",               // REQUIRED at every dispatch site: opus | sonnet | haiku. Never fable, never omitted.
      "effort": "low",                 // fan-out lanes are mechanical; high effort here is a cost smell
      "prompt": "Inspect {item} for response sites that return customer fields without redact().",
      "items": ["src/routes/route1.js", "..."],   // array | integer (planning only) | "scout" (+ expectedItems, maxItems)
      "schema": "findings",            // findings (ref/severity/title/evidence) | result (status/summary/artifacts/evidence)
      "writes": false,                 // true ⇒ must also set isolation: "worktree" OR serial: true; items never overlap
      "agentType": "security-auditor"  // optional named subagent type
    }
  ],

  "verify": {                          // REQUIRED when any lane has schema "findings"; omit for result lanes
    "model": "sonnet",
    "lenses": 1,                       // per finding, by default
    "escalate": { "severities": ["high", "critical"], "lenses": 3 },   // the expensive vote only where it changes the outcome
    "expectedFindings": 10,            // optional planner hint; default = one finding per finder item
    "expectedPatterns": 2,             // optional planner hint: distinct finding titles you expect (bounds escalations)
    "panelPerFinding": false,          // default false: the escalated panel runs ONCE per distinct title; repeats get `lenses`
    "lensInstructions": ["..."]        // optional override of the default reproduce / missing-context / impact lenses
  },

  "synth": {                           // REQUIRED. One agent, writes a file, returns path + summary
    "model": "opus",
    "outputPath": "Docs/swarm-{name}-{date}.md",
    "prompt": "Group findings by route; add a remediation column."   // optional extra instruction
  },

  "loop": { "maxRounds": 2 }           // optional; 1–5. Stops early on a dry round. Absent = single round.
}
```

Placeholders available in every prompt and in `synth.outputPath`: `{item}`, `{root}`,
`{date}`, `{goal}`, `{name}`, and in rounds after the first, `{seen}` (already-reported keys).

## Which model where

Same standard as `dispatch-contract`: **opus** for engineering (code-writing lanes, judgment
reviews, synthesis); **sonnet** for grunt (find/research sweeps, skeptic passes, triage);
**haiku** for reading and summarizing (scouts, file scans, extraction). The orchestrator tier
is never assigned to dispatched work — the planner refuses it.

## One spec per shape

**understand** — parallel readers over subsystems → one map.

```json
{ "name": "map-billing", "shape": "understand", "goal": "Map how money flows from invoice to ledger",
  "ceiling": { "agents": 8 }, "scout": null,
  "lanes": [{ "key": "read", "model": "haiku", "effort": "low", "schema": "result",
              "prompt": "Read {item} and return: what it owns, what it calls, what calls it, and any rounding or truncation you see.",
              "items": ["src/jobs/reconcile.js", "src/ledger/write.js", "src/lib/money.js", "bin/nightly.sh"] }],
  "synth": { "model": "opus", "outputPath": "Docs/swarm-{name}-{date}.md" } }
```

**find / review** — finders → dedupe → severity-scaled verify → report. (The full example at
the top of this file.)

**research** — multi-modal sweep: several lanes, each a different search angle over the same
question; sonnet lanes, one-lens verify, opus synthesis. Items are the angles, not files.

```json
{ "name": "rate-limit-options", "shape": "research", "goal": "How do comparable Node services rate-limit per tenant?",
  "ceiling": { "agents": 12 },
  "lanes": [
    { "key": "by-library", "model": "sonnet", "schema": "findings", "prompt": "Survey {item}: maturity, license, per-tenant support, quote the README lines that say so.",
      "items": ["express-rate-limit", "rate-limiter-flexible", "bottleneck"] },
    { "key": "by-pattern", "model": "sonnet", "schema": "findings", "prompt": "Describe the {item} pattern with one concrete reference implementation and its trade-offs.",
      "items": ["token bucket", "sliding window log", "fixed window"] } ],
  "verify": { "model": "haiku", "lenses": 1 },
  "synth": { "model": "opus", "outputPath": "Docs/swarm-{name}-{date}.md" } }
```

**transform / migrate** — writers over *write-scopes*, result schema, the item's own test run
as evidence; no findings lane, so no verify stage. **An item is a scope, not a file.** When
the inline scout shows the rewrite is one uniform rule (forty callers of the same four-line
template), the width is the number of scopes you want checked independently — a directory,
~10 files — not the number of files. Forty opus writers for a uniform rewrite is the
expensive mistake a GREEN run made; four is the shape. One writer per file only when each
file needs its own judgment (different call shapes, per-file behavior to preserve).

```json
{ "name": "legacyfetch-migration", "shape": "transform", "goal": "Move every legacyFetch caller to httpClient",
  "ceiling": { "agents": 8, "units": 30 },
  "lanes": [{ "key": "migrate", "model": "opus", "effort": "low", "schema": "result", "writes": true, "serial": true,
              "prompt": "In every file under {item} that calls legacyFetch(...), replace the call with the equivalent httpClient.get/post call (rule: `const r = await legacyFetch(url); return r.json();` → `return httpClient.get(url);`), keep behavior identical, then run `node --check` on each touched file and `npm test`, and return the observed result lines as evidence. Touch nothing outside {item}. Any caller that does not match the rule: leave it, return DONE_WITH_CONCERNS naming it.",
              "items": ["src/cart", "src/catalog", "src/checkout", "src/account"] }],
  "synth": { "model": "sonnet", "outputPath": "Docs/swarm-{name}-{date}.md",
             "prompt": "List every item whose status is not DONE first, with the concern; then the DONE scopes with their test evidence line." } }
```

`serial: true` runs the scopes one after another on the working tree — no worktree setup, no
merge — and is the default choice when wall-clock is not the constraint. Use
`isolation: "worktree"` only when the scopes must run concurrently; the merge is then the
caller's job.

**judge panel** — N independent attempts as items of one lane, then a `verify`-style scoring
pass and an opus synthesis that picks and grafts.

```json
{ "name": "cache-design", "shape": "judge", "goal": "Pick a caching design for the catalog service",
  "ceiling": { "agents": 10 },
  "lanes": [{ "key": "attempt", "model": "opus", "schema": "findings",
              "prompt": "Propose a caching design from the {item} angle: one finding per design decision, severity = how load-bearing it is, evidence = the code path it rests on.",
              "items": ["latency-first", "consistency-first", "operability-first"] }],
  "verify": { "model": "sonnet", "lenses": 1, "lensInstructions": ["Try to break this design decision with a concrete failure case from the actual code."] },
  "synth": { "model": "opus", "outputPath": "Docs/swarm-{name}-{date}.md", "prompt": "Pick the winning angle and graft the surviving decisions from the others." } }
```

## Verification is per pattern, not per finding

The runner escalates the wide panel **once per distinct finding title** and gives repeats of
that title the base panel. Eight routes leaking the same raw object are one judgment plus
eight reproductions, not eight three-lens votes. Write finder prompts so the same defect gets
the same title ("raw customer object returned without redact()"), set
`verify.expectedPatterns` when you know the shape, and use `panelPerFinding: true` only when
every instance genuinely needs its own judgment.

## Sizing rules of thumb

| The user said | Width | Verify |
|---|---|---|
| "quick look", "find any" | one lane, ≤ 8 items | 1 lens |
| unmarked | one or two lanes, items = the work-list from an inline grep | 1 lens, escalate high/critical to 3 |
| "thorough", "go wide", "be comprehensive" | every angle as a lane, `loop.maxRounds: 2` | 1 lens, escalate to 3, `expectedFindings` set |

"Go wide" changes lanes and rounds. It never removes the ceiling, the tier pins, or the
one-synthesis rule — those are what keep width affordable.
