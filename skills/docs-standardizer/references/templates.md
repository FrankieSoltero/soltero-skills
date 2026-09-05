# Required-doc templates

Fill from the tree and the manifests only. Anything not checkable gets `(unverified)` on its
line; anything that names a missing thing on purpose gets `(does not exist)`.

## `CLAUDE.md` (entry doc — under `entryDoc.maxLines`)

```markdown
# <repo name>

## Purpose
<one or two sentences: what this is and who it serves>

## Commands
- `npm start` — <what it runs, from the manifest>
- `npm test` — <runner>
- `make dev` — <what the target does, from the Makefile>

## Layout
- `src/<entry file>` — entry point
- `src/<dir>/` — <responsibility>
- `test/` — <runner, pattern>

## Where to look
- <task an agent will be asked to do> → `<path>`
- <the non-obvious mechanism> → `<path>` (explained in `Docs/architecture.md`)

## Conventions
- <one line per DECLARED convention, with its source: eslint rule, CI step, ADR>
- Full list, with observed patterns labeled as such: `Docs/conventions.md`

## Docs
- Index: `Docs/README.md`
- Lessons: `Docs/mistakes-and-fixes.md` · Open questions: `Docs/open-questions.md`
```

`AGENTS.md` mirror: `@CLAUDE.md` on its own line, or "Read `CLAUDE.md`." — nothing else.

## `Docs/README.md` (index)

```markdown
# Docs

- [architecture.md](architecture.md) — entry points, module map, data flow, mechanisms
- [conventions.md](conventions.md) — declared rules and observed patterns
- [decisions.md](decisions.md) — decision index (ADRs under `adr/`)
- [mistakes-and-fixes.md](mistakes-and-fixes.md) — lesson log
- [open-questions.md](open-questions.md) — what only a human can answer
- [<existing doc>](<existing doc>) — <one line>
```

## `Docs/architecture.md`

```markdown
# Architecture

## Entry points
<process entry, CLI entry, job entry — file and what starts it>

## Module map
| Path | Responsibility | Key exports |

## Data flow
<request/job path through the modules, in order; a fenced text diagram is fine>

## Non-obvious mechanisms
<anything loaded by filename, string key, reflection, env var, or convention — the things an
agent cannot infer from imports>

## External dependencies
<services, databases, env vars actually read (grep them); env vars declared but unread go to
open-questions>
```

## `Docs/conventions.md`

```markdown
# Conventions

## Declared
<rules with a source in the repo: lint/format configs, CI steps, CLAUDE.md/AGENTS.md rules,
ADRs, "the only allowed" comments — cite the source per line>

## Observed
<patterns seen in code with no declaring source — "observed, not a rule" — one line each>
```

## `Docs/decisions.md`

```markdown
# Decisions

| Date | Decision | Status | Record |
| <from the ADR> | <title> | <status> | [adr/0001-….md](adr/0001-….md) |

<no ADRs found → say so in one line; do not write any>
```

## `Docs/mistakes-and-fixes.md` (scaffold only)

```markdown
# Mistakes and Fixes

A running log of bugs, root causes, fixes, and lessons. Append with `capture-lesson`.
```

## `Docs/open-questions.md`

```markdown
# Open questions

Things this pass could not settle from the tree or the manifests. Each is a question for a
human, not a guess.

- <question> — <what was checked, and why it is not decidable here>
```
