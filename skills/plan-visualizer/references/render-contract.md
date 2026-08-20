# Render contract — plan-visualizer

`scripts/plan-graph.mjs <plan.md> --md` produces this, in order. Do not reorder or omit
sections; you may add a one-paragraph plain-language summary at the top of your *reply*,
never to the file.

## Sections

1. **Header** — plan title, source path, "read-only; generated; NOT the plan", counts
   (`N tasks · B blocking · W warnings`).
2. **Dependency graph** — mermaid `flowchart LR`, one node per task (`id. title` + tier),
   grouped in `subgraph "Wave k (derived)"`. Solid arrows = declared `Depends on`. Dashed
   `undeclared` arrows = interface consumed without a declared dependency. Dotted
   two-headed `shares <file>` links = concurrent file overlap. Tier colors: mechanical
   green, standard blue, judgment orange, missing/invalid tier red dashed.
3. **Waves** — derived table with a concurrency note per wave (`disjoint files — may run
   concurrently` or `⚠ file overlap`). Preceded by the sentence that waves are derived and
   the executor (lean-sdd) decides scheduling, concurrency, review depth, and model.
   Absent (replaced by a "not derivable" line) when there is no dependency table.
4. **Integrity findings (N)** — table: severity, kind, task, finding, evidence (plan line
   numbers). Sorted blocking → warn. Footer: reported, never fixed here; route to
   lean-plans + plan-review.
5. **Tasks** — id, title, tier, depends-on, files (table ∪ block), consumes-from,
   behavior-row count, verify command.

## Finding kinds

| Kind | Severity | Meaning |
|------|----------|---------|
| `no-dependency-table` | blocking | No `## Task Dependency Table`; waves/tiers not derivable |
| `cycle` | blocking | Declared dependencies form a cycle |
| `dangling-dependency` | blocking | `Depends on` names a task that does not exist |
| `consumes-without-dependency` | blocking | Block's `Consumes: … (Task N)` but N is not a (transitive) dependency in the table |
| `concurrent-file-overlap` | blocking | Two unordered tasks touch the same file — violates lean-sdd's one-writer-per-file-set invariant |
| `task-missing-from-table` | blocking | A `## Task N:` block with no table row |
| `file-drift` | warn | Table row and contract block disagree on files |
| `missing-risk-tier` | warn | Tier cell empty or not mechanical/standard/judgment |
| `task-missing-block` | warn | Table row with no contract block |

## Publishing

The `.viz.md` is the artifact. When the Artifact tool is available, publish that file
(mermaid renders natively) with a stable title (the plan's title) and favicon; redeploys
of a regenerated file reuse the same path → same URL.

## Not in the artifact, ever

Model names or tiers-to-model mappings, review order, dispatch/wave instructions written
as imperatives, inferred edges, edits to the plan, or findings removed "for the audience".
