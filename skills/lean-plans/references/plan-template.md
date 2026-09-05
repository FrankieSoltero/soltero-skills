# [Feature Name] Implementation Plan

> **For executors:** execute with soltero-skills:lean-sdd. The Task Dependency
> Table below is the scheduling and review-depth contract.

**Goal:** [one sentence]

**Architecture:** [2–3 sentences]

**Tech stack / test runner:** [key technologies; exact test command shape,
e.g. `npx vitest run <file>`]

## Global Constraints

[The spec's project-wide exact values, verbatim, one line each. Every task
implicitly includes this section — do not re-paste into tasks.]

- **Size cap:** [the repo's declared max file lines and the file declaring it,
  e.g. `700` per `.code-optimizer.yml`; "none declared" if there is none]
- **Duplication:** [the repo's declared duplication tool and threshold, e.g.
  `jscpd --min-lines 8`; a copied block at or above it is a defect, not a
  pattern. "none declared" if there is none]

## Task Dependency Table

| Task | Files touched | Depends on | Risk tier |
|------|---------------|------------|-----------|
| 1. [name] | `path/a.ts`, `tests/a.test.ts` | — | standard |
| 2. [name] | `path/b.ts`, `tests/b.test.ts` | — | standard |
| 3. [name] | `path/c.ts`, `tests/c.test.ts` | 1, 2 | judgment |
| 4. [name] | `path/index.ts`, `README.md` | 1, 2, 3 | mechanical |

[Note any disjoint pairs explicitly, e.g. "Tasks 1 and 2 touch disjoint files
and may execute/review concurrently."]

---

## Task N: [Component Name]

**Files:**
- Create: `exact/path/file.ts`
- Modify: `exact/path/existing.ts`
- Test: `tests/exact/path/file.test.ts`

**Interfaces:**
- Consumes: [exact signatures from earlier tasks this task uses — verbatim]
- Produces: [exact function/class/type names with parameter and return types
  that later tasks rely on]

**Reuse / extract:** [for a screen/module added alongside an existing sibling:
the shared components, hooks, and styles it reuses, by exact path — plus the
extraction task it depends on where that code still sits inline in the sibling.
Never "mirror `<sibling>`". Omit only when nothing reusable exists, verified by
listing the directory, not by one grep.]

**Behavior:**

| Case | Input / state | Expected |
|------|---------------|----------|
| [name] | [concrete input] | [concrete result] |
| [edge] | [concrete input] | [concrete result] |

**Exact values:** [magic constants, header/error strings, golden vectors,
external API shapes — only what must not be derived. Omit the section if none.]

**Verify:** `[exact command]` → [expected outcome]
**Commit:** `[type(scope): message]`
