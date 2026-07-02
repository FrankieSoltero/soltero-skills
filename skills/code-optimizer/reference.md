# Code Optimizer — Reference

Lookup doc for `SKILL.md`: the per-category/per-ecosystem static-analysis tool matrix and the
`.code-optimizer.yml` config schema. Read this during Phase 1 (Detect) and when bootstrapping a
missing config.

## Static-analysis tool matrix

Run the real tool for the detected stack. A candidate is **tool-flagged**, never eyeballed —
"no static caller" from a tool's output is a candidate, not a verdict; still check dynamic/
string-based references and the `publicApiAllowlist` before removing anything.

### 1. Dead / unused code

| Ecosystem | Tool | Invocation | Reading the output |
|---|---|---|---|
| JS/TS | knip | `npx knip` | Reports unused files, exports, and dependencies under `Unused files` / `Unused exports` / `Unused dependencies` headings. Each listed export/file is a candidate. Does not auto-fix — remove by hand. |
| JS/TS | ts-prune (prefer knip) | `npx ts-prune` | Emits one line per unused export: `path/to/file.ts:12 - exportName`. Lines marked `(used in module)` are used only within their own file — usually still safe candidates unless re-exported as public API. No auto-fix. Note: ts-prune is effectively superseded by knip; prefer knip and use ts-prune only as a fallback. |
| JS/TS | ESLint (`no-unused-vars`) | `npx eslint . --rule '{"no-unused-vars":"error"}'` (or already in the repo's `.eslintrc`) | Each finding names the unused var/import and line. **Not autofixable** — `--fix` will not remove unused vars/imports; delete manually after confirming with knip/ts-prune. |
| Python | ruff (F401/F811) | `ruff check --select F401,F811 .` | F401 = unused import, F811 = redefinition of unused name. Output line format `path:line:col F401 'module' imported but unused`. `ruff check --select F401,F811 --fix .` DOES auto-remove unused imports safely — run `--fix` for this rule set, but still gate-verify after. |
| Python | vulture | `vulture .` | Lines like `path:line: unused function 'foo' (60% confidence)`. Confidence < 100% (attributes, class members) needs manual confirmation before treating as dead — vulture flags by heuristic, not certainty. No auto-fix. |

**Degrade path:** if no dead-code tool is available/installed for the detected ecosystem, treat
**nothing** as dead. Do not fall back to manual/eyeballed dead-code judgment — instead, report the
gap and any manually-noticed candidates for the user's own review, and skip automated removal for
that category this pass.

### 2. Duplication

| Ecosystem | Tool | Invocation | Reading the output |
|---|---|---|---|
| Any (language-agnostic) | jscpd | `npx jscpd <path>` (e.g. `npx jscpd src/`) | Prints a clone table: file pairs, matched line ranges, and a duplication % summary. Each clone pair is a candidate for extraction/dedupe. Add `--min-lines 5 --min-tokens 50` to tune sensitivity on noisy repos. No auto-fix — dedupe is a manual, behavior-preserving edit. |

### 3. Oversized files

No external tool — compare against config.

```bash
# POSIX line count per file, sorted descending, excluding config excludes
find . -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.py' \) \
  -not -path '*/node_modules/*' -not -path '*/dist/*' \
  -exec wc -l {} + | sort -rn
```

Any file whose line count exceeds `maxFileLines` (default **300**, from `.code-optimizer.yml`) is
a split candidate — regardless of whether it's dead or live. A live, still-imported oversized file
is still split (Phase 2, category 3); this is a candidate list, not a dead-code list.

### 4. Guideline violations

| Ecosystem | Tool | Invocation | Auto-fix? |
|---|---|---|---|
| JS/TS | ESLint (repo's own `.eslintrc*`) | `npx eslint . --fix` | Fixes style/formatting rules. Logic rules like `eqeqeq`, `no-unused-vars`, `no-var` are **not autofixable** by ESLint — they're reported only; apply by hand. |
| JS/TS | Prettier (repo's own `.prettierrc*`) | `npx prettier --write .` | Fully auto-fixes formatting. |
| Python | ruff (repo's own `ruff.toml`/`pyproject.toml [tool.ruff]`) | `ruff check --fix .` then `ruff format .` | `check --fix` auto-fixes autofixable lint rules (marked `[*]` in ruff's rule docs); `format` auto-fixes formatting. Rules without `[*]` are report-only. |
| Any | `.editorconfig` | No single CLI; most formatters (Prettier, ruff format) already respect it. Verify manually if a formatter isn't present for the ecosystem. | N/A |

Only apply guideline fixes the project has **declared** (its own lint/format config, or explicit
rules in CLAUDE.md/AGENTS.md) — never a generic style preference from memory. Prefer each tool's
`--fix`/`--write` mode where the table above marks it safe; hand-fix only what the tool reports but
can't apply itself, then gate-verify same as any other change.

## `.code-optimizer.yml` schema

Lives at the repo root. All keys optional — omitted keys are auto-detected/defaulted as noted.

```yaml
verify:            # commands that MUST pass; the test gate. Auto-detected if omitted
  - npm test
  - npm run typecheck
  - npm run lint
maxFileLines: 300  # files longer than this are split candidates (default: 300)
tools:             # which detectors to run (auto-selected by stack if omitted)
  dead: [knip]
  duplication: [jscpd]
exclude:           # globs never touched by any category
  - "**/*.generated.*"
  - "dist/**"
publicApiAllowlist: # symbols/paths never treated as dead even if callerless
  - "src/index.ts"
  - "handleLegacyWebhook"
```

Key reference:

- **`verify`** — list of shell commands that define the gate. Run and observed to pass *before*
  starting (green baseline) and after *every* category commit. If omitted, auto-detect from
  `package.json` scripts (`test`, `typecheck`/`tsc`, `lint`) or the Python equivalent
  (`pytest`, `mypy`, `ruff check`).
- **`maxFileLines`** — integer threshold for the oversized-files category. Default `300` if the
  key or the whole file is absent.
- **`tools`** — per-category list of detectors to run, keyed by category (`dead`, `duplication`;
  `oversized` and `guidelines` don't need a tool selection since they use file-size checks and the
  repo's own linter/formatter respectively). If omitted, auto-select by detected stack using the
  matrix above (e.g. JS/TS repo → `knip` for dead, `jscpd` for duplication).
- **`exclude`** — glob list. Paths matching any entry are skipped entirely by every category
  (detection and apply). Always include generated/vendored/build output.
- **`publicApiAllowlist`** — list of symbol names and/or file paths that must **never** be treated
  as dead, no matter what a tool reports. This is the mechanism that replaces one-off "let me check
  if this is really used" detective work — anything matching an allowlist entry (by path or symbol
  name) is skipped in the dead-code category and left untouched.

## Config bootstrap procedure (when `.code-optimizer.yml` is absent)

1. **Read declared standards.** Look for `CLAUDE.md` and/or `AGENTS.md` at the repo root (and any
   nested ones) for explicitly stated conventions — file-size limits, testing commands, style
   rules, things the project calls out as "always"/"never".
2. **Read existing tool configs.** Check for `.eslintrc*`, `.prettierrc*`, `pyproject.toml`
   (`[tool.ruff]`), `ruff.toml`, `.editorconfig`, `tsconfig.json`. Their presence indicates which
   guideline tools/rules are already declared by the project — reuse them, don't invent new rules.
3. **Detect verify commands.** Read `package.json` `scripts` (`test`, `typecheck`, `lint`, `build`)
   or Python equivalents (`pytest`, `mypy`/`pyright`, `ruff check`) and use the ones that exist.
4. **Observe file-size norms.** Run the line-count command from the oversized-files section above
   across the repo (excluding generated/vendor paths) to see the actual distribution, and use it to
   sanity-check the default `maxFileLines: 300` — raise it only if the observed norm makes 300
   clearly wrong for this codebase (e.g. a repo full of generated schema files), and say so.
5. **Draft `exclude` and `publicApiAllowlist`.** Seed `exclude` with generated/build/vendor globs
   found in `.gitignore` or build config. Seed `publicApiAllowlist` conservatively — entry points
   (`main`, `index`), anything exported from a package's public surface (`package.json` `main`/
   `exports`), and anything CLAUDE.md/AGENTS.md calls out as intentionally-unreferenced (webhooks,
   dynamic dispatch targets, plugin entry points).
6. **Write the file and stop for review.** Write the drafted `.code-optimizer.yml` to the repo
   root, then show its full contents to the user and ask them to review/edit it **before** any
   Phase 1 detection or Phase 2 apply step runs against it. Never proceed on a bootstrapped config
   without that explicit human review — an unreviewed allowlist is exactly the class of unverified
   assumption this skill exists to avoid.
