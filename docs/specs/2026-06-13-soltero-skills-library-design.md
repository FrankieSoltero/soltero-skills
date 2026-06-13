# Design Spec — `soltero-skills`: A Public Claude Code Skills Library

- **Date:** 2026-06-13
- **Status:** Draft — awaiting user review
- **Author:** Francisco "Frankie" Soltero (with Claude Code)
- **Spec location:** `docs/specs/` (this repo's convention)

---

## 1. Overview

A public, open-source **Claude Code skills library** distributed as a single installable
plugin. Skills are reusable `SKILL.md` modules that teach Claude Code *how* to perform the
recurring, high-friction workflows that span the author's real projects (web apps, Python
data/ML, and AI/agent integrations).

A single skill can bundle reference docs, runnable scripts, and templates, so this one repo
unifies what would otherwise be three separate libraries (reusable code, prompt templates,
AI workflows) under one format and one distribution mechanism.

### Goals

- Ship an **installable, proven** plugin (`/plugin install …`) from day one — public-ready.
- Encode a **rigorous, subagent-tested development process** so every skill is validated
  before it ships.
- Build a **curated catalog** of skills with genuine, evidence-based workflow impact.
- Make the repo **self-documenting and contributable** (README, CONTRIBUTING, CI, ADRs).

### Non-goals (YAGNI)

- No multi-plugin split in v1 (revisit if users want category-scoped installs).
- No skill for anything a regex/validator can enforce on its own — those ship as **bundled
  scripts or CI hooks**, not skills.
- No app features (e.g., dashboards/UI) — those are product code, not skills.

---

## 2. Audience & distribution

- **Audience:** public open-source from day one.
- **License:** MIT.
- **Distribution:** a GitHub repo whose root *is* the plugin, shipping its own
  `.claude-plugin/marketplace.json` so it is self-installable.
- **Install flow (for end users):**
  ```
  /plugin marketplace add soltero/soltero-skills
  /plugin install soltero-skills@soltero-skills-marketplace
  ```
  Skills are then invoked as `soltero-skills:<skill-name>`.

### 2.1 Confidentiality & provenance

Skills are informed by experience with private repositories but must contain **no
confidential material**. The public repo (skills, specs, examples, tests) must never include:

- Private repo, company, product, client, or domain names / internal codenames.
- Proprietary code, GraphQL/Prisma schemas, business logic, role/permission tables, or data.
- Secrets, credentials, connection strings, internal env-var names, or internal endpoints.
- Internal identifiers (tool names, user IDs, ticket IDs) copied verbatim from private code.

Where a skill is inspired by a private pattern, it is **re-derived generically** from public
standards and rewritten with neutral example domains. `build-mcp-server` in particular is
built from the open Model Context Protocol standard, not from any private MCP implementation.
Detailed grounding evidence (which repo, which incident motivated a skill) lives only in a
separate, non-public design note — never in this repo. As a backstop, a local pre-publish
step greps staged changes against a **privately-maintained denylist** of repo/company/
identifier names (the denylist itself is kept out of the public repo).

---

## 3. Architecture

**One GitHub repo = one plugin.** This is confirmed against both the real installed
`superpowers` plugin and current official docs (see References).

- Manifests live **inside** `.claude-plugin/`: `plugin.json` (required) and
  `marketplace.json` (makes the repo self-installable).
- `skills/` sits at the **repo root** (a sibling of `.claude-plugin/`, never inside it).
- **One kebab-case folder per skill**, flat namespace, no nesting. Each contains a required
  `SKILL.md`; supporting `reference.md` / `examples.md` / `scripts/` are optional and live
  inside the skill folder.
- Skills are **auto-discovered** from `skills/` — `plugin.json` does **not** enumerate them.

### `plugin.json` (`.claude-plugin/plugin.json`)

```json
{
  "$schema": "https://www.schemastore.org/claude-code-plugin-manifest.json",
  "name": "soltero-skills",
  "displayName": "Soltero Skills",
  "description": "Skills for scaffolding, security/compliance review, AI-agent engineering, and docs/knowledge capture",
  "version": "0.1.0",
  "author": { "name": "Francisco Soltero", "email": "frankiesoltero@gmail.com" },
  "homepage": "https://github.com/soltero/soltero-skills",
  "repository": "https://github.com/soltero/soltero-skills",
  "license": "MIT",
  "keywords": ["skills", "scaffolding", "security", "compliance", "mcp", "prisma", "docs"]
}
```

### `marketplace.json` (`.claude-plugin/marketplace.json`)

```json
{
  "$schema": "https://www.schemastore.org/claude-code-marketplace.json",
  "name": "soltero-skills-marketplace",
  "description": "Marketplace for the Soltero Skills plugin",
  "owner": { "name": "Francisco Soltero", "email": "frankiesoltero@gmail.com" },
  "plugins": [
    {
      "name": "soltero-skills",
      "source": "./",
      "description": "Skills for scaffolding, security/compliance review, AI-agent engineering, and docs/knowledge capture",
      "version": "0.1.0",
      "author": { "name": "Francisco Soltero", "email": "frankiesoltero@gmail.com" },
      "category": "development",
      "keywords": ["skills", "scaffolding", "security", "compliance"]
    }
  ]
}
```

> Notes from the research: `source: "./"` works because users add the marketplace via the
> GitHub `owner/repo` Git flow (whole-repo clone). The marketplace `name` must be kebab-case,
> unique, **not** a reserved name (`claude-plugins-official`, `claude-plugins-community`,
> `agent-skills`, …), and **different** from the plugin `name`. The old
> `anthropic.com/claude-code/marketplace.schema.json` URL 404s; use the SchemaStore URLs (or
> omit `$schema`).

### `SKILL.md` format

```markdown
---
name: <kebab-case, = folder name, lowercase, max 64 chars, no 'anthropic'/'claude'>
description: Use when <concrete trigger/symptom> — <what the skill does>. Third person, leads with the trigger, ≤~1024 chars.
---

# Title

## Overview
<1–2 sentence what-it-is + core principle>

## When to Use / When NOT to Use
## Core Pattern / Quick Reference (tables)
## Implementation (inline if <50 lines; else link a sibling file, 1 level deep)
## Common Mistakes / Red Flags
```

- Always set `name` explicitly (the directory-name default is a version string for installs).
- Body under ~500 lines; progressive disclosure — inline short content, split heavy
  reference (100+ lines) or reusable scripts into sibling files referenced one level deep
  with forward slashes. Use `${CLAUDE_SKILL_DIR}/scripts/x` for bundled scripts.

---

## 4. Repo structure

```
soltero-skills/                       # repo root = plugin root
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── skills/
│   ├── creating-a-skill/             # the meta dev-process skill (#0)
│   │   ├── SKILL.md
│   │   ├── reference.md              # the full lifecycle detail
│   │   └── templates/               # spec, scenario, SKILL.md starters
│   └── capture-lesson/               # the v0.1 exemplar (#7)
│       ├── SKILL.md
│       ├── reference.md
│       └── scripts/                  # append/format helper
├── docs/
│   ├── specs/                        # one brainstorm spec per skill (this file lives here)
│   └── decisions/                    # ADRs
├── tests/
│   └── scenarios/<skill>/            # subagent pressure-test scenarios per skill
├── .github/
│   ├── workflows/validate.yml        # CI: validate + lint on every PR
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── scripts/
│   └── bump-version.sh
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE                           # MIT
└── .gitignore
```

---

## 5. Development process (codified as the `creating-a-skill` skill)

The process *is* test-driven development applied to documentation. Every skill — including
the catalog skills — goes through this exact lifecycle. The Iron Law: **no skill (or skill
edit) without a failing test first.**

1. **Spec** → `docs/specs/<skill>.md`: problem, trigger, scope, one concrete success scenario.
2. **RED** → write 3 pressure scenarios in `tests/scenarios/<skill>/`; run a *fresh subagent
   without the skill*; record the baseline failures and rationalizations verbatim.
3. **GREEN** → author the **minimal** `SKILL.md` (+ scripts/refs) that addresses only the
   observed failures — no content for hypothetical cases.
4. **Verify GREEN** → re-run the same scenarios *with* the skill; confirm the subagent now
   complies.
5. **REFACTOR** → close loopholes; for discipline skills add a rationalization table
   (Excuse | Reality) and a Red Flags – STOP list. Re-verify until bulletproof.
6. **Validate** → `claude plugin validate --strict` (frontmatter, structure, marketplace).
7. **Review** → spec-compliance pass first (built exactly what the spec asked, nothing
   more/less), then code-quality pass. Reviewers verify independently, not from a report.
8. **PR + CI** → open a GitHub PR; CI re-runs validate + markdown lint; merge to `main`.
9. **Release** → bump semver in both manifests, tag, update `CHANGELOG.md`.

### Process design rules

- A skill earns its place only if it captures a **judgment call**. Pure validation is
  automated as a bundled script or CI hook.
- Descriptions state **when to use** (lead with the trigger) **and** briefly what the skill
  does; third person; specific trigger terms so Claude selects the right skill.
- Keep `SKILL.md` tight — once loaded it stays in context across turns (recurring token cost).

---

## 6. Skill catalog

Curated from ~25 scout-discovered candidates down to **8 catalog skills + 1 meta-skill**,
consolidating overlaps and dropping pure-automation items. Each targets a recurring,
real-world workflow. Specific grounding evidence (which private repo, which incident
motivated a skill) is deliberately kept out of this public spec — see §2.1.

| # | Skill | Area | Purpose / pain it removes | Consolidates |
|---|-------|------|---------------------------|--------------|
| 0 | `creating-a-skill` | meta | The dev process above, made executable. RED→GREEN→REFACTOR + validate + PR. | — |
| 1 | `scaffold-ts-service` | scaffolding | Bootstrap a Next.js/Express TS app wired to the author's standards: strict tsconfig + `verbatimModuleSyntax`, eslint/biome, Zod `env.ts`, pre-commit hooks, vitest, CI, security headers, `Docs/` + `CLAUDE.md`. | ts-project-init, env-validation-scaffold, ts-strictness, test-scaffolder, security-headers, docs-folder |
| 2 | `security-compliance-review` | security | Judgment audit of a diff against OWASP + the author's corporate `CLAUDE.md`: secrets, input validation, parameterized queries, XSS, authz/least-privilege, audit logging, rate limiting, PII, TLS. Bundles secret-scan + rate-limit-coverage scripts. | compliance-audit-runner, secret-scanner, audit-trail-validator, rate-limiter-consistency, rbac-validator |
| 3 | `prisma-safety-review` | security | Review Prisma schema/migrations/queries: RLS, FK indexes, N+1, **pool exhaustion (`Promise.all` outside `$transaction`)**, `migrate dev` vs `db push` drift, `prisma`/`@prisma/client` version match, pagination tiebreakers. **Among the highest-impact reviews for Prisma-heavy codebases.** | prisma-schema-audit, prisma-migrations-validator, data-migration-safety, connection-pooling-validator |
| 4 | `financial-correctness-review` | security | Money code: rounding consistency (round2/round4), float accumulation, null-vs-zero semantics, payment idempotency. | financial-correctness-checker, payment-idempotency-enforcer |
| 5 | `build-mcp-server` | ai-agent | Scaffold an API-backed MCP server (REST/GraphQL) with dev-auth, tool definitions, type-gen, and build/dev scripts, using a **neutral example domain** (e.g. a generic issue/ticket tracker). Built from the open MCP standard — no proprietary code. | graphql-mcp-server-boilerplate |
| 6 | `claude-integration-patterns` | ai-agent | Battle-tested Claude API patterns: timezone/date-context injection (a rolling date-reference table that prevents day-of-week errors), SSE streaming parse, structured JSON output, scope guardrails, current model IDs. Leans on the existing `claude-api` skill. | claude-system-prompt-optimizer, prompt-template-library |
| 7 | `capture-lesson` | docs | Append a structured entry to `Docs/mistakes-and-fixes.md` (symptom→root cause→fix→lesson→regression-test idea); optionally scaffold the regression test + a CHANGELOG line. Serves the author's global Docs-folder mandate. | docs-folder-enforcer, tests-from-mistakes, changelog-from-mistakes |
| 8 | `author-claude-md` | docs | Generate/refresh a project `CLAUDE.md` from the codebase (overview, commands, architecture, critical rules, gotchas, docs location). | docs-claude-md-validator |

**Dropped as "script/hook, not skill":** audit-log-viewer-dashboard (app code), standalone
secret-scanner / env-type-safety / ts-strictness (become templates/CI inside #1 and #2),
monorepo-coherence-checker (a script — revisit later).

---

## 7. v0.1 scope (the walking skeleton)

Ship an installable, validated plugin proving the entire pipeline end-to-end:

- Repo + `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`.
- `.github/workflows/validate.yml` CI + issue/PR templates.
- README, CONTRIBUTING, CHANGELOG, LICENSE (MIT), `.gitignore`, `scripts/bump-version.sh`.
- **Skill #0 `creating-a-skill`** — the dev process, fully authored and subagent-tested,
  with bundled templates (spec, scenario, `SKILL.md` starter).
- **Skill #7 `capture-lesson`** — the exemplar catalog skill, taken through the full
  RED→GREEN→REFACTOR loop, with its bundled append/format script.
- Verify install works: `/plugin marketplace add … && /plugin install …`, then invoke both
  skills.

### `capture-lesson` definition

- **Trigger:** after fixing a bug, resolving an incident, or discovering a non-obvious gotcha.
- **Behavior:** create/append to `Docs/mistakes-and-fixes.md` with a consistent entry —
  Date, Symptom, Root cause, Fix, Lesson, Regression-test idea. Optionally scaffold the
  regression test and a `CHANGELOG.md` line. Judgment about *what is worth capturing* +
  a consistent template enforced by a bundled script.

---

## 8. Roadmap (post-v0.1 sequencing)

Each subsequent skill is built through `creating-a-skill`, one at a time, one PR each:

1. `prisma-safety-review` (#3) — highest concrete pain.
2. `scaffold-ts-service` (#1) — highest leverage on new work.
3. `security-compliance-review` (#2).
4. `claude-integration-patterns` (#6).
5. `build-mcp-server` (#5).
6. `financial-correctness-review` (#4).
7. `author-claude-md` (#8).

Order is a recommendation, revisited as real usage reveals priorities.

---

## 9. CI / validation

`.github/workflows/validate.yml` runs on every PR and on push to `main`:

- `claude plugin validate --strict` (frontmatter, structure, marketplace schema, duplicate
  names, source-path traversal, version mismatches). Treated as the gate.
- Markdown lint on all `SKILL.md` and docs.
- A lightweight frontmatter check (name kebab-case ≤64 chars; description present ≤1024
  chars) as a fast fail and a fallback if the `claude` CLI is unavailable in CI.

---

## 10. Naming

- Plugin & repo: **`soltero-skills`** (changeable now).
- Marketplace: **`soltero-skills-marketplace`** (must differ from plugin name; not reserved).
- GitHub owner placeholder `soltero/…` to be confirmed against the actual GitHub account.

---

## 11. Success criteria

- A fresh machine can run the two install commands and invoke
  `soltero-skills:creating-a-skill` and `soltero-skills:capture-lesson`.
- `claude plugin validate --strict` passes in CI on a clean checkout.
- `capture-lesson` passes its subagent verification: a fresh agent, post-bugfix, reliably
  produces a correct `Docs/mistakes-and-fixes.md` entry without prompting.
- `creating-a-skill` is bulletproof: a fresh agent under pressure does not author a skill
  without first writing and running a failing scenario.
- README documents install + the catalog + the contribution/dev process.

---

## 12. Open decisions

- **Plugin/repo name** — defaulting to `soltero-skills`; confirm or override.
- **GitHub owner/account** — confirm the handle for the `homepage`/`repository` URLs and the
  marketplace `add` shorthand.
- **CI claude-CLI availability** — confirm whether `claude plugin validate` can run in GitHub
  Actions; if not, the lightweight linter is the gate and validate runs locally pre-push.

---

## 13. References

- Claude Code Skills — https://code.claude.com/docs/en/skills
- Agent Skills best practices — https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Plugins reference — https://code.claude.com/docs/en/plugins-reference
- Plugin marketplaces — https://code.claude.com/docs/en/plugin-marketplaces
- Discover plugins — https://code.claude.com/docs/en/discover-plugins
- SchemaStore manifests — https://www.schemastore.org/claude-code-plugin-manifest.json ,
  https://www.schemastore.org/claude-code-marketplace.json
- Real reference plugin: `superpowers` (`obra/superpowers`), inspected locally.
