# Soltero Skills v0.1 (Walking Skeleton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an installable, validated public Claude Code plugin (`soltero-skills`) containing the `creating-a-skill` meta-skill and the `capture-lesson` exemplar, proving the entire author → validate → install pipeline end-to-end.

**Architecture:** One GitHub repo = one plugin. Manifests live in `.claude-plugin/`; skills live in `skills/<name>/SKILL.md`. A Node frontmatter linter + `claude plugin validate --strict` gate every change in CI. Skills are authored via TDD-for-documentation: write pressure scenarios → run a fresh subagent without the skill (RED) → author the minimal skill (GREEN) → re-run with the skill (verify) → close loopholes (REFACTOR).

**Tech Stack:** Markdown + JSON (skills/manifests), Node.js ≥18 ESM with the built-in `node:test` runner (tooling, zero runtime deps), GitHub Actions (CI), `gh` CLI (repo creation), `claude plugin validate` (structural validation).

**Confidentiality gate (from spec §2.1):** No private repo/company names, proprietary code/schemas, secrets, or internal identifiers in any committed file. Every skill is re-derived generically. A gitignored denylist + grep is the backstop (Task 7).

**Before pushing (Task 8):** STOP and confirm with the user: (a) GitHub owner/org handle, (b) real email vs. `noreply` for `plugin.json`. Defaults used until confirmed: name `soltero-skills`, marketplace `soltero-skills-marketplace`.

---

## File Structure

```
soltero-skills/                         # repo root = plugin root
├── .claude-plugin/
│   ├── plugin.json                     # Task 1
│   └── marketplace.json                # Task 1
├── skills/
│   ├── creating-a-skill/               # Task 4
│   │   ├── SKILL.md
│   │   ├── reference.md
│   │   └── templates/{spec.md,scenario.md,SKILL.md.tmpl}
│   └── capture-lesson/                 # Task 5
│       ├── SKILL.md
│       ├── reference.md
│       └── scripts/append-lesson.mjs
├── tools/
│   ├── lint-frontmatter.mjs            # Task 2
│   └── lint-frontmatter.test.mjs       # Task 2
├── tests/scenarios/
│   ├── creating-a-skill/scenario-1.md  # Task 4
│   └── capture-lesson/scenario-{1,2,3}.md  # Task 5
├── docs/
│   ├── specs/2026-06-13-soltero-skills-library-design.md   # exists
│   ├── plans/2026-06-13-soltero-skills-v0.1.md             # this file
│   └── decisions/0001-single-plugin-repo.md                # Task 7
├── .github/
│   ├── workflows/validate.yml          # Task 6
│   ├── ISSUE_TEMPLATE/skill-request.md # Task 6
│   └── PULL_REQUEST_TEMPLATE.md         # Task 6
├── scripts/{bump-version.sh,check-private-names.sh}  # Task 7
├── package.json                        # Task 3
├── README.md                           # Task 7
├── CONTRIBUTING.md                     # Task 7
├── CHANGELOG.md                        # Task 7
├── LICENSE                             # Task 0
└── .gitignore                          # Task 0
```

---

## Task 0: Initialize the repository

**Files:**
- Create: `.gitignore`, `LICENSE`
- Commit: existing `docs/specs/2026-06-13-soltero-skills-library-design.md`

- [ ] **Step 1: Initialize git on the `main` branch**

Run (from `/Users/franciscosoltero/Desktop/Code/Skills`):
```bash
git init -b main
```
Expected: `Initialized empty Git repository`. (If the installed git predates `-b`, run `git init && git symbolic-ref HEAD refs/heads/main`.)

- [ ] **Step 2: Create `.gitignore`**

Create `.gitignore`:
```gitignore
node_modules/
.DS_Store
*.log
# Private, non-public design notes and confidentiality denylist (spec §2.1)
private-notes/
.private-denylist.txt
```

- [ ] **Step 3: Create `LICENSE` (MIT)**

Create `LICENSE`:
```text
MIT License

Copyright (c) 2026 Francisco Soltero

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Commit the spec as the initial commit**

```bash
git add .gitignore LICENSE docs/specs/2026-06-13-soltero-skills-library-design.md
git commit -m "chore: initial commit — design spec, license, gitignore"
```
Expected: one commit created on `main`.

---

## Task 1: Plugin & marketplace manifests

**Files:**
- Create: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`

- [ ] **Step 1: Confirm validation fails on an empty plugin (RED)**

Run:
```bash
claude plugin validate ./ --strict
```
Expected: failure / error indicating no `plugin.json` found. (If the `claude` CLI is unavailable in this environment, note it and rely on the Task 2 linter + CI; do not block.)

- [ ] **Step 2: Create `.claude-plugin/plugin.json`**

Create `.claude-plugin/plugin.json`:
```json
{
  "$schema": "https://www.schemastore.org/claude-code-plugin-manifest.json",
  "name": "soltero-skills",
  "displayName": "Soltero Skills",
  "description": "Skills for scaffolding, security/compliance review, AI-agent engineering, and docs/knowledge capture",
  "version": "0.1.0",
  "author": { "name": "Francisco Soltero", "email": "frankiesoltero@gmail.com" },
  "homepage": "https://github.com/OWNER/soltero-skills",
  "repository": "https://github.com/OWNER/soltero-skills",
  "license": "MIT",
  "keywords": ["skills", "scaffolding", "security", "compliance", "mcp", "prisma", "docs"]
}
```
> `OWNER` and the email are placeholders replaced in Task 8 Step 2 after user confirmation.

- [ ] **Step 3: Create `.claude-plugin/marketplace.json`**

Create `.claude-plugin/marketplace.json`:
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

- [ ] **Step 4: Validate manifests (GREEN)**

Run:
```bash
claude plugin validate ./ --strict
```
Expected: PASS (manifests valid; skills optional at this point). If CLI unavailable, verify both files parse as JSON: `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json'));JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json'));console.log('json ok')"` → `json ok`.

- [ ] **Step 5: Commit**

```bash
git add .claude-plugin/
git commit -m "feat: add plugin and marketplace manifests"
```

---

## Task 2: Frontmatter linter (code TDD)

A zero-dependency Node validator that enforces the `SKILL.md` frontmatter rules from spec §3. Serves as the fast-fail CI gate and the fallback when `claude plugin validate` is unavailable.

**Files:**
- Create: `tools/lint-frontmatter.mjs`
- Test: `tools/lint-frontmatter.test.mjs`

- [ ] **Step 1: Write the failing tests**

Create `tools/lint-frontmatter.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFrontmatter, parseFrontmatter } from './lint-frontmatter.mjs';

test('valid frontmatter yields no errors', () => {
  const errors = validateFrontmatter(
    { name: 'capture-lesson', description: 'Use when ...' }, 'capture-lesson');
  assert.deepEqual(errors, []);
});

test('missing name is an error', () => {
  assert.ok(validateFrontmatter({ description: 'x' }, 'foo').some(e => e.includes('name')));
});

test('missing description is an error', () => {
  assert.ok(validateFrontmatter({ name: 'foo' }, 'foo').some(e => e.includes('description')));
});

test('name must match folder', () => {
  assert.ok(validateFrontmatter({ name: 'foo', description: 'x' }, 'bar').some(e => e.includes('folder')));
});

test('reserved name rejected', () => {
  assert.ok(validateFrontmatter({ name: 'claude', description: 'x' }, 'claude').some(e => e.includes('reserved')));
});

test('uppercase name rejected', () => {
  assert.ok(validateFrontmatter({ name: 'FooBar', description: 'x' }, 'FooBar').some(e => e.includes('lowercase')));
});

test('name over 64 chars rejected', () => {
  const n = 'a'.repeat(65);
  assert.ok(validateFrontmatter({ name: n, description: 'x' }, n).some(e => e.includes('64')));
});

test('description over 1024 chars rejected', () => {
  assert.ok(validateFrontmatter({ name: 'foo', description: 'x'.repeat(1025) }, 'foo').some(e => e.includes('1024')));
});

test('parseFrontmatter extracts quoted and unquoted fields', () => {
  const fm = parseFrontmatter('---\nname: foo\ndescription: "bar: baz"\n---\n# Title');
  assert.equal(fm.name, 'foo');
  assert.equal(fm.description, 'bar: baz');
});

test('parseFrontmatter returns null when no frontmatter', () => {
  assert.equal(parseFrontmatter('# Title only'), null);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
node --test tools/*.test.mjs
```
Expected: FAIL — `Cannot find module './lint-frontmatter.mjs'` (implementation not written yet).

- [ ] **Step 3: Write the minimal implementation**

Create `tools/lint-frontmatter.mjs`:
```js
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RESERVED = ['anthropic', 'claude'];
const NAME_RE = /^[a-z0-9-]+$/;

export function validateFrontmatter(fm, folderName) {
  const errors = [];
  const name = fm.name;
  if (!name) {
    errors.push('missing required field: name');
  } else {
    if (name.length > 64) errors.push(`name exceeds 64 chars: ${name}`);
    if (!NAME_RE.test(name)) errors.push(`name must be lowercase letters/numbers/hyphens: ${name}`);
    if (RESERVED.includes(name)) errors.push(`name uses reserved word: ${name}`);
    if (folderName && name !== folderName) errors.push(`name "${name}" != folder "${folderName}"`);
  }
  const desc = fm.description;
  if (!desc) errors.push('missing required field: description');
  else if (desc.length > 1024) errors.push(`description exceeds 1024 chars (${desc.length})`);
  return errors;
}

export function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return fm;
}

function main() {
  const skillsDir = 'skills';
  let failed = false;
  let dirs = [];
  try { dirs = readdirSync(skillsDir); }
  catch { console.error(`No ${skillsDir}/ directory found`); process.exit(1); }
  for (const d of dirs) {
    const skillPath = join(skillsDir, d);
    if (!statSync(skillPath).isDirectory()) continue;
    const skillMd = join(skillPath, 'SKILL.md');
    let content;
    try { content = readFileSync(skillMd, 'utf8'); }
    catch { console.error(`✗ ${d}: missing SKILL.md`); failed = true; continue; }
    const fm = parseFrontmatter(content);
    if (!fm) { console.error(`✗ ${d}: missing YAML frontmatter`); failed = true; continue; }
    const errors = validateFrontmatter(fm, d);
    if (errors.length) { for (const e of errors) console.error(`✗ ${d}: ${e}`); failed = true; }
    else console.log(`✓ ${d}`);
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
node --test tools/*.test.mjs
```
Expected: PASS — all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tools/
git commit -m "feat: add zero-dep SKILL.md frontmatter linter with tests"
```

---

## Task 3: package.json and npm scripts

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create `package.json`**

Create `package.json`:
```json
{
  "name": "soltero-skills",
  "version": "0.1.0",
  "description": "A public Claude Code skills library",
  "type": "module",
  "private": false,
  "license": "MIT",
  "scripts": {
    "test": "node --test tools/*.test.mjs",
    "lint:fm": "node tools/lint-frontmatter.mjs",
    "lint:md": "markdownlint-cli2 \"**/*.md\" \"#node_modules\"",
    "validate:plugin": "claude plugin validate ./ --strict",
    "check": "npm run test && npm run lint:fm && npm run lint:md"
  },
  "devDependencies": {
    "markdownlint-cli2": "^0.14.0"
  }
}
```
> `lint:md` is optional polish; if `markdownlint-cli2` can't be installed in an environment, CI (Task 6) tolerates its absence. `test` and `lint:fm` are the hard gates and need no network.

- [ ] **Step 2: Verify scripts resolve**

Run:
```bash
npm run test && npm run lint:fm
```
Expected: tests pass; `lint:fm` prints `No skills/ directory found` and exits non-zero (no skills yet) — that's expected at this point; it goes green in Task 5. Note the behavior, do not treat as a blocker.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add package.json with test/lint/validate scripts"
```

---

## Task 4: `creating-a-skill` meta-skill

The skill that encodes this repo's development process. Authored from the proven writing-skills methodology, then sanity-checked with one pressure scenario. (Its deeper validation is Task 5: building `capture-lesson` by following it.)

**Files:**
- Create: `skills/creating-a-skill/SKILL.md`
- Create: `skills/creating-a-skill/reference.md`
- Create: `skills/creating-a-skill/templates/spec.md`
- Create: `skills/creating-a-skill/templates/scenario.md`
- Create: `skills/creating-a-skill/templates/SKILL.md.tmpl`
- Create: `tests/scenarios/creating-a-skill/scenario-1.md`

- [ ] **Step 1: Write the pressure scenario (RED input)**

Create `tests/scenarios/creating-a-skill/scenario-1.md`:
```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

You are adding a new skill `summarize-pr` to this skills repo. You have written skills
before and you are confident you know exactly what its SKILL.md should say. It's 6pm,
you want this done, and writing test scenarios first feels like busywork for a skill
this obvious.

Do you:
(A) Write `skills/summarize-pr/SKILL.md` now, then validate and commit.
(B) First write 3 pressure scenarios and run a fresh subagent WITHOUT the skill to
    establish a baseline, then author the minimal skill, then re-test.
(C) Write the SKILL.md now and add scenarios later if there's time.

State your choice (A/B/C) and act on it.
```

- [ ] **Step 2: Establish the baseline (RED)**

Dispatch a fresh subagent (Task tool, general-purpose) with ONLY the contents of `scenario-1.md` and no access to this skill. Record its choice verbatim in your working notes.
Expected baseline: it picks (A) or (C) — authoring before testing. This is the failure the skill must prevent. (If it already picks B with sound reasoning, note it; the skill still documents the discipline.)

- [ ] **Step 3: Write `skills/creating-a-skill/SKILL.md` (GREEN)**

Create `skills/creating-a-skill/SKILL.md`:
```markdown
---
name: creating-a-skill
description: Use when creating a new skill or editing an existing one in this repo, before writing any SKILL.md content — enforces test-first, subagent-validated authoring and the plugin's quality gates.
---

# Creating a Skill

## Overview

Authoring a skill is test-driven development for documentation. The product is a `SKILL.md`;
the test is a pressure scenario run on a fresh subagent. **Iron Law: no skill (or skill edit)
ships without a failing scenario observed first.** If you wrote skill content before watching
an agent fail without it, delete the content and start from the scenario.

## When to Use

- Creating any new skill under `skills/`.
- Editing an existing skill's behavior.

## When NOT to Use

- Pure tooling/scripts with unit tests (use normal code TDD).
- Fixing a typo or reformatting (no behavior change).

## The Loop

1. **Spec** — write `docs/specs/<skill>.md` from `templates/spec.md`: problem, trigger,
   scope, one concrete success scenario.
2. **RED** — write 3 pressure scenarios in `tests/scenarios/<skill>/` from
   `templates/scenario.md`. Dispatch a fresh subagent on each WITHOUT the skill. Record its
   choices and rationalizations verbatim. You must see it fail.
3. **GREEN** — author the minimal `SKILL.md` (start from `templates/SKILL.md.tmpl`) that
   addresses only the observed failures. No content for hypothetical cases.
4. **Verify GREEN** — re-run the same scenarios with the skill present. Confirm compliance.
5. **REFACTOR** — for each new rationalization the agent invents, add an explicit negation,
   a Rationalization-table row, and a Red-Flag entry. Re-verify until bulletproof.
6. **Validate** — `node tools/lint-frontmatter.mjs` and `claude plugin validate ./ --strict`.
7. **Review** — spec-compliance pass (built exactly what the spec asked), then code-quality.
8. **PR + CI** — open a PR; CI re-runs the gates; merge to `main`.
9. **Release** — bump `version` in both manifests + `package.json`, tag, update `CHANGELOG.md`.

## Quick Reference

| Field | Rule |
|-------|------|
| folder | kebab-case; equals frontmatter `name` |
| `name` | lowercase letters/numbers/hyphens, ≤64 chars, not `anthropic`/`claude`; always set it |
| `description` | third person, leads with the trigger ("Use when …") AND says what it does, ≤1024 chars |
| body | ≤~500 lines; inline short content; split heavy reference (100+ lines) one level deep |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "This skill is obvious, I'll skip the baseline." | Obvious-to-you ≠ what an agent actually does. Run the baseline. |
| "I'll add scenarios later." | Later never comes and the skill is unvalidated. Scenario first. |
| "It's just a small edit." | Edits change behavior. Same Iron Law applies. |
| "The agent passed once, ship it." | Run all 3 scenarios; one pass can be luck. |

## Red Flags — STOP

- About to create `SKILL.md` before any scenario exists → STOP, write the scenario.
- Adding content for a case no baseline run surfaced → delete it (YAGNI).
- Committing a skill that hasn't passed `lint-frontmatter` + `claude plugin validate` → STOP.

## Details

See `reference.md` for the full subagent-testing protocol, meta-testing, and persuasion notes.
```

- [ ] **Step 4: Write `skills/creating-a-skill/reference.md`**

Create `skills/creating-a-skill/reference.md`:
```markdown
# Creating a Skill — Reference

## Subagent testing protocol

- Scenarios must feel like real work: preface with "This is a real scenario. You must choose
  and act," use concrete paths (`/tmp/acme-api`, not "a project"), and force an A/B/C choice
  with no "I'd ask the human" escape.
- Combine 3+ pressures: time, sunk cost, authority, exhaustion, social proof.
- RED: run the scenario on a fresh subagent WITHOUT the skill. Record verbatim.
- GREEN: run the same scenario WITH the skill. The agent should choose correctly AND cite the
  skill's sections.

## Meta-testing

If an agent reads the skill and still chooses wrong, ask: "You read the skill and chose X —
how should the skill have been written so the correct choice was the only acceptable one?"
- Clarity gap → add their suggestion verbatim.
- Organization gap → move the key point earlier/more prominent.
- Willpower gap → strengthen the foundational principle.

## Authoring principles

- Progressive disclosure: only `name`+`description` preload; keep `SKILL.md` tight (recurring
  token cost once loaded). Move 100+-line reference and reusable scripts to sibling files,
  one level deep, forward slashes, `${CLAUDE_SKILL_DIR}` for bundled scripts.
- Description = when to use (lead with trigger) AND what it does. Never paste the whole
  workflow into the description — it becomes a shortcut Claude follows instead of the body.
- One excellent example beats five mediocre ones. No narrative storytelling, no dated logs.
- Skills are for judgment. Anything a regex/validator can enforce becomes a bundled script
  or CI hook, not a skill.
```

- [ ] **Step 5: Write the three templates**

Create `skills/creating-a-skill/templates/spec.md`:
```markdown
# Skill Spec — <skill-name>

- **Problem:** <the recurring problem this skill removes>
- **Trigger:** <when Claude should reach for it>
- **Scope / non-goals:** <what it does and explicitly does not do>
- **Success scenario:** <one concrete situation and the correct behavior>
- **Bundled assets:** <scripts/reference files, or "none">
```

Create `skills/creating-a-skill/templates/scenario.md`:
```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

<situation with concrete paths and 3+ pressures>

Do you:
(A) <tempting wrong action>
(B) <correct action>
(C) <partial/compromise wrong action>

State your choice (A/B/C) and act on it.
```

Create `skills/creating-a-skill/templates/SKILL.md.tmpl`:
```markdown
---
name: <kebab-case = folder name>
description: Use when <trigger> — <what it does>. Third person, ≤1024 chars.
---

# <Title>

## Overview
<1–2 sentences: what it is + core principle>

## When to Use / When NOT to Use

## Quick Reference
<tables>

## Common Mistakes / Red Flags
```

- [ ] **Step 6: Verify GREEN**

Re-dispatch a fresh subagent on `tests/scenarios/creating-a-skill/scenario-1.md` WITH `skills/creating-a-skill/SKILL.md` provided as context.
Expected: it chooses (B), cites the Iron Law / Red Flags. If it doesn't, apply meta-testing (reference.md) and revise the SKILL.md, then re-run. Repeat until it complies.

- [ ] **Step 7: Validate**

Run:
```bash
node tools/lint-frontmatter.mjs
```
Expected: `✓ creating-a-skill` (exit 0). Then `claude plugin validate ./ --strict` → PASS (or skip if CLI unavailable).

- [ ] **Step 8: Commit**

```bash
git add skills/creating-a-skill/ tests/scenarios/creating-a-skill/
git commit -m "feat: add creating-a-skill meta-skill (dev process) + templates"
```

---

## Task 5: `capture-lesson` skill (built by following `creating-a-skill`)

This task is the real validation of `creating-a-skill`: we author `capture-lesson` by walking its loop. The bundled `append-lesson.mjs` enforces a consistent `Docs/mistakes-and-fixes.md` entry format.

**Files:**
- Create: `tests/scenarios/capture-lesson/scenario-{1,2,3}.md`
- Create: `skills/capture-lesson/scripts/append-lesson.mjs`
- Create: `skills/capture-lesson/SKILL.md`
- Create: `skills/capture-lesson/reference.md`
- Create: `docs/specs/capture-lesson.md`

- [ ] **Step 1: Write the per-skill spec**

Create `docs/specs/capture-lesson.md`:
```markdown
# Skill Spec — capture-lesson

- **Problem:** After fixing a bug or hitting a non-obvious gotcha, the lesson is lost — no
  consistent record, so the same mistake recurs.
- **Trigger:** Immediately after a bug fix, incident resolution, or discovery of a gotcha.
- **Scope:** Append a structured entry to `Docs/mistakes-and-fixes.md` (create if missing):
  date, symptom, root cause, fix, lesson, regression-test idea. Optionally scaffold the test.
  Non-goal: deciding code fixes; it only records them.
- **Success scenario:** Agent finishes a fix, recognizes it's worth capturing, runs the
  bundled script, and a correctly formatted entry appears.
- **Bundled assets:** `scripts/append-lesson.mjs`.
```

- [ ] **Step 2: Write three pressure scenarios (RED input)**

Create `tests/scenarios/capture-lesson/scenario-1.md`:
```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

You just fixed a bug in /tmp/acme-api: invoice totals were off by one cent because line
items were summed as floats before rounding. You changed the code to round each line item
before summing. Tests pass. The user has already asked you to start the next task. The repo
has a Docs/mistakes-and-fixes.md.

Do you:
(A) Move on to the next task — the fix is done and tests pass.
(B) Record the lesson in Docs/mistakes-and-fixes.md before moving on.
(C) Add a one-line `// fixed rounding` code comment and move on.

State your choice (A/B/C) and act on it.
```

Create `tests/scenarios/capture-lesson/scenario-2.md`:
```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

While wiring up /tmp/acme-web you discovered that a date-only string like "2026-06-13" was
being parsed as UTC midnight and displaying as the previous day in the user's timezone. You
worked around it by appending "T00:00:00". This took an hour to track down. There is no
Docs/ folder yet in this repo.

Do you:
(A) Just keep the workaround in code; it's obvious enough.
(B) Create Docs/mistakes-and-fixes.md and record the symptom, cause, fix, and lesson.
(C) Mention it in your chat reply to the user and move on.

State your choice (A/B/C) and act on it.
```

Create `tests/scenarios/capture-lesson/scenario-3.md`:
```markdown
IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

You spent the afternoon chasing a flaky failure in /tmp/acme-api caused by running database
writes with Promise.all outside a transaction, exhausting the connection pool. You fixed it by
wrapping the writes in a single transaction. You're tired and it's late.

Do you:
(A) Commit the fix and stop — you'll remember this one.
(B) Record it in Docs/mistakes-and-fixes.md with a regression-test idea, then stop.
(C) Leave a TODO to document it tomorrow.

State your choice (A/B/C) and act on it.
```

- [ ] **Step 3: Establish the baseline (RED)**

Dispatch a fresh subagent on each scenario WITHOUT the skill. Record choices verbatim.
Expected baseline: a mix of (A)/(C) — moving on, ad-hoc comments, or "I'll do it tomorrow," and where it does log, an inconsistent free-form note. This is what the skill must fix.

- [ ] **Step 4: Write the bundled script (GREEN, part 1)**

Create `skills/capture-lesson/scripts/append-lesson.mjs`:
```js
#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const file = arg('--file') ?? 'Docs/mistakes-and-fixes.md';
const symptom = arg('--symptom');
const cause = arg('--cause');
const fix = arg('--fix');
const lesson = arg('--lesson');
const testIdea = arg('--test') ?? '(none yet)';

if (!symptom || !cause || !fix || !lesson) {
  console.error('Usage: append-lesson.mjs --symptom S --cause C --fix F --lesson L [--test T] [--file PATH]');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const entry = [
  `## ${date} — ${symptom}`,
  ``,
  `- **Symptom:** ${symptom}`,
  `- **Root cause:** ${cause}`,
  `- **Fix:** ${fix}`,
  `- **Lesson:** ${lesson}`,
  `- **Regression test:** ${testIdea}`,
  ``,
].join('\n');

mkdirSync(dirname(file), { recursive: true });
const header = '# Mistakes and Fixes\n\nA running log of bugs, root causes, fixes, and lessons.\n';
const body = existsSync(file) ? readFileSync(file, 'utf8') : header;
writeFileSync(file, body.trimEnd() + '\n\n' + entry);
console.log(`Appended lesson to ${file}`);
```

- [ ] **Step 5: Verify the script works**

Run:
```bash
node skills/capture-lesson/scripts/append-lesson.mjs \
  --file /tmp/sk-test/mistakes-and-fixes.md \
  --symptom "Invoice totals off by a cent" \
  --cause "Floats summed before rounding" \
  --fix "Round each line item before summing" \
  --lesson "Round at the smallest unit, then aggregate" \
  --test "sum([0.1,0.2]) rounds to 0.30"
cat /tmp/sk-test/mistakes-and-fixes.md
```
Expected: file contains the `# Mistakes and Fixes` header plus a dated `##` entry with all five bullet fields. Then clean up: `rm -rf /tmp/sk-test`.

- [ ] **Step 6: Write `skills/capture-lesson/SKILL.md` (GREEN, part 2)**

Create `skills/capture-lesson/SKILL.md`:
```markdown
---
name: capture-lesson
description: Use when you just fixed a bug, resolved an incident, or discovered a non-obvious gotcha — records a structured lesson in Docs/mistakes-and-fixes.md so the same mistake doesn't recur.
---

# Capture Lesson

## Overview

A fix isn't done when the tests pass — it's done when the lesson is captured. Right after
fixing a bug or hitting a gotcha, append a structured entry to `Docs/mistakes-and-fixes.md`
using the bundled script, so the knowledge survives past this session.

## When to Use

- Immediately after a bug fix, incident resolution, or discovering a non-obvious gotcha.
- Even when you're moving straight to the next task, even for "small" fixes, even when tired.

## When NOT to Use

- Routine feature work with no surprising failure or lesson.

## How

Run the bundled script (it creates `Docs/mistakes-and-fixes.md` if missing and keeps every
entry in the same format):

```bash
node ${CLAUDE_SKILL_DIR}/scripts/append-lesson.mjs \
  --symptom "<one line: what went wrong>" \
  --cause "<root cause>" \
  --fix "<what fixed it>" \
  --lesson "<the generalizable takeaway>" \
  --test "<a regression test idea, or omit>"
```

If the lesson warrants a regression test, scaffold it now (don't defer) — see `reference.md`.

## Red Flags — STOP

| Thought | Reality |
|---------|---------|
| "Tests pass, I'm done." | The lesson is still uncaptured. Run the script first. |
| "It's a small fix, not worth logging." | Small recurring bugs cost the most. Log it. |
| "I'll document it tomorrow." | Tomorrow's context is gone. Capture it now. |
| "A code comment is enough." | Comments aren't searchable across the project's history. Log it. |
```

- [ ] **Step 7: Write `skills/capture-lesson/reference.md`**

Create `skills/capture-lesson/reference.md`:
```markdown
# Capture Lesson — Reference

## Entry format (enforced by append-lesson.mjs)

```
## YYYY-MM-DD — <symptom>

- **Symptom:** ...
- **Root cause:** ...
- **Fix:** ...
- **Lesson:** ...
- **Regression test:** ...
```

## Turning a lesson into a regression test

When the bug is reproducible in code, write the smallest test that would have caught it,
in the project's existing test framework, before moving on. Reference the test path in the
`--test` field so the log links to the guard.

## Optional: CHANGELOG line

For security/compliance/financial fixes, also add a one-line entry under "Fixed" in the
project's `CHANGELOG.md`, tagged with severity.
```

- [ ] **Step 8: Verify GREEN**

Re-dispatch a fresh subagent on each of the three scenarios WITH `skills/capture-lesson/SKILL.md` (and note the script path) provided.
Expected: each chooses (B) and produces a correctly formatted `Docs/mistakes-and-fixes.md` entry, including creating the file in scenario-2. If any picks A/C, apply meta-testing, revise SKILL.md (e.g. strengthen a Red Flag), and re-run that scenario.

- [ ] **Step 9: REFACTOR — close any gaps**

For each new rationalization observed in Step 8, add a Red-Flags row to `SKILL.md` verbatim and re-verify the failing scenario. Repeat until all three pass.

- [ ] **Step 10: Validate the whole plugin**

Run:
```bash
node tools/lint-frontmatter.mjs
```
Expected: `✓ capture-lesson` and `✓ creating-a-skill`, exit 0. Then `claude plugin validate ./ --strict` → PASS (or skip if CLI unavailable).

- [ ] **Step 11: Commit**

```bash
git add skills/capture-lesson/ tests/scenarios/capture-lesson/ docs/specs/capture-lesson.md
git commit -m "feat: add capture-lesson skill (built via creating-a-skill)"
```

---

## Task 6: CI workflow + GitHub templates

**Files:**
- Create: `.github/workflows/validate.yml`
- Create: `.github/ISSUE_TEMPLATE/skill-request.md`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Create the CI workflow**

Create `.github/workflows/validate.yml`:
```yaml
name: validate
on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Frontmatter lint (hard gate, no deps)
        run: node tools/lint-frontmatter.mjs
      - name: Unit tests (hard gate, no deps)
        run: node --test tools/*.test.mjs
      - name: Markdown lint (best-effort)
        run: npx --yes markdownlint-cli2 "**/*.md" "#node_modules" || echo "markdownlint unavailable — skipped"
      - name: Plugin validate (best-effort; CLI may be unavailable)
        run: |
          if command -v claude >/dev/null 2>&1; then
            claude plugin validate ./ --strict
          else
            echo "claude CLI unavailable in CI — frontmatter lint is the gate"
          fi
```

- [ ] **Step 2: Create the issue template**

Create `.github/ISSUE_TEMPLATE/skill-request.md`:
```markdown
---
name: Skill request
about: Propose a new skill or a change to an existing one
title: "[skill] "
labels: skill
---

**Problem the skill removes:**

**When Claude should reach for it (trigger):**

**Scope / non-goals:**

**One concrete success scenario:**
```

- [ ] **Step 3: Create the PR template**

Create `.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## What & why

## Checklist
- [ ] Followed `creating-a-skill` (spec → scenarios → RED → GREEN → REFACTOR)
- [ ] `node tools/lint-frontmatter.mjs` passes
- [ ] `node --test tools/*.test.mjs` passes
- [ ] `claude plugin validate ./ --strict` passes locally
- [ ] No confidential material (spec §2.1); `scripts/check-private-names.sh` clean
- [ ] `CHANGELOG.md` updated if user-facing
```

- [ ] **Step 4: Commit**

```bash
git add .github/
git commit -m "ci: add validate workflow + issue/PR templates"
```

---

## Task 7: README, CONTRIBUTING, CHANGELOG, ADR, confidentiality backstop

**Files:**
- Create: `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`
- Create: `docs/decisions/0001-single-plugin-repo.md`
- Create: `scripts/check-private-names.sh`, `scripts/bump-version.sh`

- [ ] **Step 1: Create `README.md`**

Create `README.md`:
```markdown
# Soltero Skills

A public [Claude Code](https://code.claude.com) skills library — reusable `SKILL.md` modules
for scaffolding, security/compliance review, AI-agent engineering, and docs/knowledge capture.

## Install

```
/plugin marketplace add OWNER/soltero-skills
/plugin install soltero-skills@soltero-skills-marketplace
```

Then invoke skills as `soltero-skills:<skill-name>`.

## Skills (v0.1)

| Skill | What it does |
|-------|--------------|
| `creating-a-skill` | The repo's own dev process: test-first, subagent-validated skill authoring. |
| `capture-lesson` | Records a structured lesson in `Docs/mistakes-and-fixes.md` after a fix. |

Roadmap (see `docs/specs/`): `prisma-safety-review`, `scaffold-ts-service`,
`security-compliance-review`, `claude-integration-patterns`, `build-mcp-server`,
`financial-correctness-review`, `author-claude-md`.

## Develop

Every skill is built with `creating-a-skill`. See `CONTRIBUTING.md`.

```
npm test            # tooling unit tests
npm run lint:fm     # SKILL.md frontmatter lint
npm run validate:plugin
```

## License

MIT — see `LICENSE`.
```
> Replace `OWNER` in Task 8 Step 2.

- [ ] **Step 2: Create `CONTRIBUTING.md`**

Create `CONTRIBUTING.md`:
```markdown
# Contributing

All skills are authored with the `creating-a-skill` skill — test-driven documentation.

## The loop
1. Spec → `docs/specs/<skill>.md`.
2. RED → 3 pressure scenarios in `tests/scenarios/<skill>/`; run a fresh subagent without the
   skill and record the baseline failure.
3. GREEN → minimal `skills/<skill>/SKILL.md` (+ optional `reference.md`, `scripts/`).
4. Verify → re-run scenarios with the skill; confirm compliance.
5. REFACTOR → close loopholes; re-verify.
6. Validate → `npm run lint:fm` and `claude plugin validate ./ --strict`.
7. PR → CI runs the gates.

## Confidentiality (required)
No private repo/company names, proprietary code/schemas, secrets, or internal identifiers in
any committed file. Re-derive private-inspired patterns generically. Run
`scripts/check-private-names.sh` before pushing.

## Conventions
- One kebab-case folder per skill; `name` in frontmatter equals the folder name.
- `description`: third person, lead with the trigger, ≤1024 chars.
- Keep `SKILL.md` under ~500 lines; split heavy reference one level deep.
```

- [ ] **Step 3: Create `CHANGELOG.md`**

Create `CHANGELOG.md`:
```markdown
# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog]; this
project adheres to Semantic Versioning.

## [0.1.0] - 2026-06-13
### Added
- `creating-a-skill` meta-skill encoding the test-driven authoring process.
- `capture-lesson` skill for structured `Docs/mistakes-and-fixes.md` entries.
- Plugin + marketplace manifests, frontmatter linter, CI validation.
```

- [ ] **Step 4: Create the ADR**

Create `docs/decisions/0001-single-plugin-repo.md`:
```markdown
# ADR 0001: Single-plugin, self-hosted-marketplace repo

**Status:** Accepted (2026-06-13)

**Context:** We need a public, installable home for the skills library.

**Decision:** One GitHub repo IS the plugin: `.claude-plugin/{plugin,marketplace}.json` at the
root, skills auto-discovered from `skills/`. The repo ships its own `marketplace.json` so users
install via `/plugin marketplace add OWNER/soltero-skills`.

**Consequences:** Simple, matches the reference `superpowers` plugin and official docs. If we
later want category-scoped installs, we can split into multiple plugins under one marketplace.
```

- [ ] **Step 5: Create the confidentiality backstop script**

Create `scripts/check-private-names.sh`:
```bash
#!/usr/bin/env bash
# Greps staged/tracked files against a PRIVATE denylist kept out of the repo.
# Create .private-denylist.txt locally (gitignored), one term per line.
set -euo pipefail
DENYLIST="${1:-.private-denylist.txt}"
if [[ ! -f "$DENYLIST" ]]; then
  echo "No denylist at $DENYLIST — skipping (create one locally, see spec §2.1)."
  exit 0
fi
# Build an alternation of non-empty, non-comment terms.
TERMS=$(grep -vE '^\s*(#|$)' "$DENYLIST" | paste -sd'|' -)
if [[ -z "$TERMS" ]]; then echo "Denylist empty — skipping."; exit 0; fi
if git grep -nIE "$TERMS" -- ':!.private-denylist.txt' ':!scripts/check-private-names.sh'; then
  echo "✗ Private names found above. Remove before publishing."
  exit 1
fi
echo "✓ No private names found."
```
Then: `chmod +x scripts/check-private-names.sh`.

- [ ] **Step 6: Create the version-bump helper**

Create `scripts/bump-version.sh`:
```bash
#!/usr/bin/env bash
# Usage: scripts/bump-version.sh 0.2.0  — updates version in both manifests and package.json
set -euo pipefail
V="${1:?usage: bump-version.sh <semver>}"
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json package.json; do
  node -e "const fs=require('fs');const o=JSON.parse(fs.readFileSync('$f'));
    if(o.version!==undefined)o.version='$V';
    if(o.plugins)o.plugins.forEach(p=>p.version='$V');
    fs.writeFileSync('$f',JSON.stringify(o,null,2)+'\n');"
  echo "bumped $f -> $V"
done
```
Then: `chmod +x scripts/bump-version.sh`.

- [ ] **Step 7: Commit**

```bash
git add README.md CONTRIBUTING.md CHANGELOG.md docs/decisions/ scripts/
git commit -m "docs: add README, CONTRIBUTING, CHANGELOG, ADR, and helper scripts"
```

---

## Task 8: Final validation, smoke test, and publish (gated)

**Files:**
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (replace `OWNER`/email)

- [ ] **Step 1: Run the full local gate**

Run:
```bash
node --test tools/*.test.mjs && node tools/lint-frontmatter.mjs
```
Expected: tests pass; `✓ creating-a-skill` and `✓ capture-lesson`, exit 0.
Then, if available: `claude plugin validate ./ --strict` → PASS. Optionally smoke-test the plugin locally without publishing: `claude --plugin-dir ./` and confirm `soltero-skills:creating-a-skill` and `soltero-skills:capture-lesson` are listed.

- [ ] **Step 2: STOP — confirm publish parameters with the user**

Do not proceed until the user confirms:
- **GitHub owner/org** → replaces `OWNER` in `plugin.json`, `marketplace.json`, `README.md`.
- **Email** → real (`frankiesoltero@gmail.com`) or a `noreply` for the public `plugin.json`/`marketplace.json`.

Apply the confirmed values:
```bash
# Example once confirmed (OWNER=<handle>):
sed -i '' "s|OWNER|<handle>|g" .claude-plugin/plugin.json .claude-plugin/marketplace.json README.md
```
Then re-run Step 1's gates and commit:
```bash
git add .claude-plugin/ README.md
git commit -m "chore: set repository owner and contact metadata"
```

- [ ] **Step 3: Create the GitHub repo and push (requires `gh` auth)**

Run (after confirming `gh auth status`):
```bash
gh repo create <handle>/soltero-skills --public --source=. --remote=origin --push
```
Expected: repo created, `main` pushed, CI `validate` workflow runs green.

- [ ] **Step 4: Verify the published install path**

In a Claude Code session:
```
/plugin marketplace add <handle>/soltero-skills
/plugin install soltero-skills@soltero-skills-marketplace
```
Then confirm both skills are invocable as `soltero-skills:creating-a-skill` and
`soltero-skills:capture-lesson`. This satisfies the spec §11 success criteria.

- [ ] **Step 5: Tag the release**

```bash
git tag v0.1.0 && git push origin v0.1.0
```

---

## Self-Review (completed by plan author)

**Spec coverage:** §3–4 architecture/manifests → Task 1; §5 dev process → Task 4
(`creating-a-skill`); §6 catalog #0 → Task 4, #7 `capture-lesson` → Task 5; §7 v0.1 scope →
Tasks 0–8; §9 CI/validation → Tasks 2, 6; §2.1 confidentiality → Task 7 backstop + PR
checklist; §10 naming → defaults + Task 8 gate; §11 success criteria → Task 8 Step 4. Roadmap
skills (§8) are intentionally out of v0.1 scope.

**Placeholder scan:** `OWNER`/`<handle>`/email are deliberate, user-confirmed parameters with
an explicit resolution step (Task 8 Step 2), not unspecified TODOs. No "add error handling"
style placeholders; all code blocks are complete.

**Type consistency:** `validateFrontmatter(fm, folderName)` and `parseFrontmatter(content)`
exports match between `lint-frontmatter.mjs` and its test. The append script's flags
(`--symptom/--cause/--fix/--lesson/--test/--file`) match the SKILL.md usage and the Step-5
verification. `${CLAUDE_SKILL_DIR}` is used for the bundled script path per spec §3.
```
