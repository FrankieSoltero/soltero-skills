# Rule file + golden-principles entry — the two artifacts a sweep leaves behind

The rule is written before anything is swept and before anything is fixed. It exists in
two forms: a machine-readable rule file that drives `scripts/sweep.mjs`, and a
human-readable versioned entry in `Docs/golden-principles.md`. The first is what CI runs;
the second is what a person reads in six months. Neither substitutes for the other.

## 1. The rule file

Start from `templates/rule.json`. Conventional location: `Docs/defect-classes/<class>.rule.json`.

| Field | Required | Meaning |
|-------|----------|---------|
| `name` | yes | Class slug, kebab-case (`utc-date-shift`). Used in markers and reports. |
| `version` | no | Bump when a detector changes; keeps `Docs/golden-principles.md` and the file in step. |
| `principle` | no | The `GP-NNN` id this rule enforces. Printed in the report so a hit points at its rule. |
| `wrongPattern` | no | One line, in words: what is wrong and what it costs. Printed in the report header. |
| `correctPattern` | no | One line: what to write instead. Printed in the report header. |
| `detectors[]` | **yes** | `{ id, regex, flags?, unless? }`. At least one — this is the gate, enforced by the script: a rule with zero detectors is rejected, because a class with no mechanical detector is a lesson, not a class. |
| `detectors[].regex` | yes | A JS regex, JSON-escaped, matched per line. Every match is a hit with `file:line:column`. |
| `detectors[].unless` | no | A JS regex; a line matching it is skipped for that detector. Line-level, not file-level. |
| `allowlistMarkers[]` | no | Literal substrings. A hit whose own line or immediately preceding line contains one is **allowlisted**: reviewed, correct as written, does not fail the check. |
| `markerPattern` | no | A JS regex identifying triage markers (`TODO\\(utc-date-shift\\)`). A hit on or under one is **deferred**: reviewed, undecidable, does not fail the check but stays in the inventory. |
| `skipFileWhen` | no | A JS regex tested against the first 4 KB of each file; a match drops the whole file (generated code, vendored bundles). |
| `include[]` | no | Repo-relative globs (`**`, `*`, `?`, `{a,b}`). Empty means every file not excluded. |
| `exclude[]` | no | Extra globs on top of the built-in excludes (`node_modules`, `.git`, `dist`, `build`, `coverage`, `.next`, `vendor`). |

### The three outcome states, and why they are distinct

A hit is exactly one of:

- **match** — unreviewed. Fails the check (exit 1). This is the work.
- **allowlisted** — a human looked and it is correct as written (the gap-inventory case:
  the detector fires on a shape the rule does not govern, e.g. `new Date(isoInstant)`).
  The marker on the line records that judgment where the next reader will see it.
- **deferred** — a human looked and could not decide without information that does not
  exist yet. Carries a `TODO(<class>): <reason>` marker naming the missing information.

Collapsing these loses the thing that makes the class stay fixed. An allowlist marker on an
undecidable line is a lie that closes the question; a deferred marker on a correct line
keeps a permanent false open item. Use each for what it is.

### Running it

```bash
node ${CLAUDE_SKILL_DIR}/scripts/sweep.mjs --rule Docs/defect-classes/<class>.rule.json --root .
node ${CLAUDE_SKILL_DIR}/scripts/sweep.mjs --rule <rule> --root . --format json   # inventory
```

Exit 0 = clean, 1 = the class is present, 2 = usage or rule error. Outside Claude Code
there is no `${CLAUDE_SKILL_DIR}`; use the script's path in the checkout. Node ≥18, no
dependencies, so it runs unchanged as a CI step.

## 2. The golden-principles entry

`Docs/golden-principles.md` is a versioned list of small, mechanically enforceable rules —
not a style guide. Every entry carries a check command, because an entry nothing runs is
the prose that already failed. Append; never rewrite history. Bump the version and add a
line when a detector changes.

```markdown
## GP-003 (v1, 2026-09-01) — Calendar-day strings parse as local, never as UTC
- **Wrong:** `new Date('2026-03-14')` / `Date.parse('2026-03-14')` — parsed as UTC
  midnight, renders a day early in every timezone west of Greenwich.
- **Correct:** `const [y, m, d] = s.split('-').map(Number); new Date(y, m - 1, d)`
- **Not covered:** full ISO-8601 instants with an offset (`clockedInAt`, `runAt`) — those
  are correctly passed straight to `new Date`. Annotate them `// date-class:instant`.
- **Check:** `npm run check:dates` → `node .../sweep.mjs --rule Docs/defect-classes/utc-date-shift.rule.json --root .`
- **Origin:** five isolated fixes, 2026-03-02 → 2026-08-21 (`Docs/mistakes-and-fixes.md`);
  swept 2026-09-01, 17 instances, 14 fixed, 3 deferred.
```

The **Not covered** line is the gap inventory, written before the sweep and kept with the
rule. It is what tells the next reader why an allowlisted hit is allowlisted.

## 3. Wiring the check

Preferred, in order:

1. **A repo script + CI step** — `"check:dates": "node scripts/sweep.mjs --rule ... --root ."`
   added to `package.json` and to the existing CI job. Visible in review, runs for
   everyone, executes nothing on anyone's machine without them opting in.
   **Copy `scripts/sweep.mjs` into the repo first** and point the check at that copy:
   `${CLAUDE_SKILL_DIR}` does not resolve on a CI runner, and a check CI cannot execute is
   not enforcement. The runner is dependency-free and single-file precisely so vendoring it
   is a one-file diff.
2. **A native lint rule**, when the ecosystem has one that expresses the class better than
   a regex (an ESLint rule, a `ruff` rule, an ast-grep rule). Prefer it when it exists —
   fewer false positives than a line regex.
3. **A commit-time hook** — only via `correction-compiler`'s ledger and explicit human
   approval. This skill never writes `.git/hooks/`, `settings.json`, or any other file
   that executes on someone's machine.

## 4. When a detector cannot be written

Two honest exits, both of which are finished states:

- **Narrow the class** until something is greppable. "Cache staleness" has no detector;
  "a `cache.put` for a key whose prefix no `cache.invalidate` in the repo ever clears" does.
  Sweep the narrower class, and say in the report which part of the original class is left.
- **Record a lesson and stop** — `capture-lesson`, with the incident cluster named. No
  sweep, no golden-principles entry, no branch. N incidents without a detector is still a
  lesson, not a class, however many N is.

Writing a deliberately loose regex to get past the gate is neither of these. It produces a
diff nobody can review and a CI check that will be deleted the first week it cries wolf.
