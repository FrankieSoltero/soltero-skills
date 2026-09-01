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

**Behavior:**

| Case | Input / state | Expected |
|------|---------------|----------|
| [name] | [concrete input] | [concrete result] |
| [edge] | [concrete input] | [concrete result] |

**Exact values:** [magic constants, header/error strings, golden vectors,
external API shapes — only what must not be derived. Omit the section if none.]

**Verify:** `[exact command]` → [expected outcome]
**Commit:** `[type(scope): message]`
