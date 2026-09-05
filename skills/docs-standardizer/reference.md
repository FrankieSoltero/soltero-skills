# Docs Standardizer — Reference

Lookup doc for `SKILL.md`: the standard's schema, the verifier's codes, the claim heuristics,
and the docs-root decision table.

## The standard — `~/.claude/docs-standard.json`

One file at user scope, bootstrapped by `scripts/docs-standard-init.mjs` from
`references/default-standard.json`. Fields:

| Field | Meaning |
|---|---|
| `docsRoot` | The one directory for depth docs (`Docs` by default; the bootstrap reads "docs folder" from the global CLAUDE.md when declared). |
| `entryDoc.file` | The agent entry doc (`CLAUDE.md`). |
| `entryDoc.mirror` | A second entry name (`AGENTS.md`) that must be identical or a pointer. |
| `entryDoc.maxLines` | Line budget for the entry doc. |
| `entryDoc.requiredSections` | Headings the entry doc must carry (substring, case-insensitive). |
| `required[]` | `{ file, sections?, purpose? }` — the doc set every repo carries. Paths follow `docsRoot`. |
| `commandSources` | Manifests read for command evidence (informational; the inventory reads `package.json`, `Makefile`/`GNUmakefile`, `justfile`). |
| `historical[]` | Globs for docs exempt from claim checks (changelog, ADRs, lessons, handoff). |
| `unverifiedMarker` | Text that exempts a line from claim checks because it could not be checked. |
| `absentMarker` | Text that exempts a line because it names something that does not exist on purpose. |
| `exclude[]` | Directories skipped by the walk and treated as runtime paths in claims (`node_modules`, `var`, `.env`, …). |

**Project override — `.docs-standard.json` in the repo root.** May set `docsRoot`, add to
`exclude`, set `entryDoc.file`, and add `required` entries. Everything else is ignored with a
warning the init and inventory scripts print. It can never remove a required doc, raise the
budget, or change the markers.

## Verifier codes — `scripts/docs-verify.mjs`

Exit 0 GREEN, 1 RED, 2 malformed standard or usage. Findings print as
`CODE file[:line] message`, sorted by severity then file.

| Code | Meaning | Fix |
|---|---|---|
| `DOCS_ROOT_CLASH` | More than one docs root directory (`Docs`, `docs`, `doc`, `documentation`). | `git mv` the extra root's files into the standard's root; fix links. |
| `DOCS_ROOT_CASE` | A root differs from `docsRoot` by case only. | Record `docsRoot` in `.docs-standard.json` with the reason, or (only if asked) rename via a temp name. |
| `REQUIRED_MISSING` | A required doc, or the entry doc, is absent. | Generate it from `references/templates.md`. |
| `ENTRY_OVER_BUDGET` | Entry doc longer than `maxLines`. | Move depth to the docs root; leave a Where-to-look pointer. |
| `ENTRY_SPLIT` | Entry doc and mirror differ and neither points at the other. | Make the mirror `@CLAUDE.md` / "Read `CLAUDE.md`", or identical. |
| `SECTION_MISSING` | A required heading is absent. | Add the section; an empty section with "none" beats a missing one. |
| `CMD_UNKNOWN` | A command claim matches no manifest script or Makefile/justfile target. | Replace with the real command, or phrase as absence on one line. |
| `PATH_MISSING` | A path claim does not resolve case-exactly (root or doc-relative; bare basenames anywhere). | Fix the path, or mark `(does not exist)` / `(unverified)`. |
| `UNREACHABLE` | A doc under the docs root is not linked from the entry doc within two hops. | Add it to `<docsRoot>/README.md` (which the entry doc links). |

## Claim heuristics — `scripts/docs-inventory.mjs`

- **Commands** come from inline code and from fenced blocks whose language is empty or
  shell-like (`sh`, `bash`, `shell`, `zsh`, `console`, `text`). Recognized: `npm|pnpm|yarn|bun
  [run] <script>`, `make <target>`, `just <recipe>`. Package-manager builtins (`install`, `ci`,
  `exec`, …) are always ok; `start`/`test` must exist as scripts.
- **Paths** come from inline code and relative markdown links. A token is a path when it has a
  `/`, is a dotfile (`.env.example`, not a bare extension like `.sql`), or has a known source/doc
  extension. Globs, placeholders, flags, URLs, `file:line` citations, and tokens with spaces are
  never paths. Paths whose first segment is in `exclude` or matches `.gitignore` are runtime
  paths and are skipped.
- **Absence lines.** A line containing the `absentMarker`, the `unverifiedMarker`, or a natural
  absence phrase ("there is no", "does not exist", "was removed", "**not**", "instead of", …)
  contributes no claims. The heuristic is line-level: a negation that wraps onto the next line
  does not cover the next line — put the marker there.
- **Historical docs** (`historical` globs, plus anything classified changelog/ADR/handoff)
  keep their claims in the inventory as information but never produce findings.

## Docs-root decision table

| Repo has | Standard says | Do |
|---|---|---|
| nothing | `Docs` | create `Docs/`. |
| `docs/` only | `Docs` | keep `docs/`; write `{ "docsRoot": "docs" }` to `.docs-standard.json` with a comment line in the commit message. |
| `docs/` + `doc/` | `Docs` | `git mv doc/* docs/`, fix links, then the row above. |
| `Docs/` + `documentation/` | `Docs` | `git mv documentation/* Docs/`, fix links. |
| `docs/`, and the user asked for `Docs` explicitly | `Docs` | two-step rename (`git mv docs docs_tmp && git mv docs_tmp Docs`) — the only time a case-only rename happens. |

## Commit messages, one per category

```
docs(reconcile): fix stale claims, merge doc/ into docs/, record docsRoot
docs(entry): CLAUDE.md to standard (N lines / budget M), AGENTS.md pointer
docs(required): architecture, conventions, decisions, lessons scaffold, open questions
docs(index): Docs/README.md index; every doc reachable from CLAUDE.md
```
