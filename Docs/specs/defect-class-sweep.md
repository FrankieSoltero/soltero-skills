# Skill Spec — defect-class-sweep

- **Problem:** The same bug keeps getting fixed one instance at a time. The owner's own
  words: *"we have run into this issue like 15 times how have we not universalized this
  yet"*. Each fix is locally correct and globally useless — the class survives, because
  nobody ever wrote down the rule, swept the repo for the other instances, or left behind
  anything mechanical that would stop the next one. `capture-lesson` records one incident.
  `correction-compiler` compiles a repeated correction into a *proposed* enforcement
  artifact and explicitly never touches code. `code-optimizer` enforces guidelines the
  project has *already declared*. The missing middle — derive the rule from the incident
  cluster, then retire every existing instance of it at once — is owned by nobody.
- **Trigger:** The same bug class has been fixed three or more times across sessions or
  projects (the recall/lesson layer hands off at N≥3), or `Docs/mistakes-and-fixes.md`
  shows a cluster with one common root cause, or the owner says some variant of "we keep
  hitting this / how have we not fixed this everywhere / this is the fifth time".
- **Scope / non-goals:** Takes ONE defect class per pass and runs it end to end: rule →
  gap inventory → repo-wide sweep → one reviewed batch fix on a branch → versioned rule
  in `Docs/golden-principles.md` with a mechanical check → greppable markers on what
  couldn't be resolved. Non-goals: installing anything that executes without human
  approval (a Claude Code hook or git hook proposal is routed to
  `correction-compiler`'s ledger, never wired up here); general cleanup, dead code,
  duplication, or file size (that's `code-optimizer`); recording a one-off incident
  (that's `capture-lesson`); performance work; sweeping two classes in one pass.
- **Success scenario:** A date renders one day early on the invoice page. It's the fifth
  such report. The agent does not fix the invoice page. It first writes the rule — correct
  pattern (`parseDateOnly(s)` splitting on `-` into local `Date` parts, or a date library's
  local-date parse) and mechanically detectable wrong pattern
  (`new Date(<date-only string>)`, which parses as UTC midnight and renders a day early
  west of Greenwich) — then derives the gap inventory as what that rule will not cover
  (full ISO timestamps with an offset, values already normalized upstream), then runs the
  bundled sweep runner over the whole repo and gets 23 `file:line` hits, fixes the 20
  unambiguous ones in a single reviewed batch on `fix/defect-class-utc-date-shift`, marks
  the 3 genuinely ambiguous ones `// TODO(date-class): <reason>` for centralized triage,
  lands the rule as a versioned entry in `Docs/golden-principles.md`, and wires the sweep
  runner into CI so the class cannot silently reappear.
- **Bundled assets:** `scripts/sweep.mjs` (rule-file-driven detector runner: reports every
  match as `file:line:col`, honors allowlist markers, exits non-zero on unallowlisted
  matches so it works as a CI check), `scripts/sweep.test.mjs`,
  `references/rule-file.md` (rule-file contract + `Docs/golden-principles.md` entry
  format), `templates/rule.json`.

## The ordering is the load-bearing part

The rule is written **before** the gap inventory, and the gap inventory is defined as
*what the rule's default will not cover* — not as a survey the rule is later derived from.
Playbook **Promising** (line 661, Anthropic large-scale-migrations): *"The rulebook must
come before the gap inventory."* Inventory-first produces a rule shaped by whatever the
sweep happened to find; rule-first produces an inventory that is explicitly the rule's
known blind spots, which is the thing a reviewer can actually check.

The correct order, and the reason each step exists:

1. **Rule** — one paragraph: the correct pattern, and the wrong pattern expressed as
   something a machine can find. Written from the incident cluster, before any sweeping.
2. **Gap inventory** — what the rule's default will not cover, enumerated as cases, so
   sweep hits in those cases are triaged rather than blindly rewritten.
3. **Sweep** — the bundled runner over the whole repo, every instance with `file:line`.
   Never a sample, never "the files I was already in".
4. **Batch fix** — ONE reviewed batch on a branch, not one commit per discovery. Playbook
   **Watch** (line 241): *"a recurring mistake means fix the upstream rule once and
   regenerate, not patch each instance."*
5. **Rule lands versioned + mechanically checked** — an entry in
   `Docs/golden-principles.md` plus the sweep runner wired into CI or a bundled script
   command. Playbook **Promising** (line 545, OpenAI Harness Engineering): golden
   principles are *"small, explicit, versioned … and mechanically enforceable, not prose
   style guides alone."*
6. **Markers on the unresolvable** — a machine-greppable `// TODO(<class>): <reason>`
   rather than a guess, so ambiguity is triaged centrally instead of silently and
   inconsistently patched per file. Playbook **Watch** (line 671).

## The gate

**No mechanical detector for the wrong pattern → it is not a class yet, it is a lesson.**

A defect class earns a sweep only if the wrong pattern can be found by grep, an AST query,
or a lint rule with a false-positive rate a human can triage. "Cache staleness after a
write", stated that broadly, has no detector — the sweep would be an LLM reading every
file and guessing, which produces an unreviewable diff and a rule nobody can enforce
tomorrow. Two legitimate exits when the gate fails: narrow the class until a detector
exists (`refetch()` missing after a `mutate()` in the same function IS greppable), or
record it with `capture-lesson` and stop. Writing a deliberately loose regex to get past
the gate is the failure mode, not the workaround.

## Boundaries with sibling skills

| Skill | Its job | Why it is not this |
|-------|---------|--------------------|
| `capture-lesson` | Record one incident | One incident is not a class; N=1 has no sweep |
| `correction-compiler` | Compile a repeated *correction of the agent* into a proposed hook/lint/CI artifact, ledgered, human-approved, **never touching code** | Produces a proposal, not a remediated repo |
| `code-optimizer` | Enforce *already-declared* guidelines repo-wide; dead code, dupes, file size | Does not discover a class from bug history or author the rule |
| `lean-debugging` | Root-cause ONE bug before fixing it | Upstream: it supplies the root cause this skill generalizes |

Handoff out: if the check warrants blocking at commit time rather than in CI, this skill
writes the check and hands the hook proposal to `correction-compiler` — it never installs
a hook, git hook, or settings.json entry itself.

## Rule file (contract)

The sweep runner is driven by a JSON rule file so the detector is a reviewable artifact
that outlives the session, not a regex retyped from memory each run.

| Field | Meaning |
|-------|---------|
| `name` | Class slug, e.g. `utc-date-shift`; used in markers and the principle id |
| `principle` | Pointer into `Docs/golden-principles.md` (e.g. `GP-004`) |
| `wrongPattern` / `correctPattern` | One line each, human-readable — the rule itself |
| `detectors[]` | `{id, regex, flags?}` — what the machine looks for |
| `allowlistMarkers[]` | Substrings that suppress a hit on the same or previous line |
| `markerPattern` | Regex identifying open triage markers, reported separately |
| `include[]` / `exclude[]` | Glob scope |

Full field-by-field contract and the golden-principles entry format:
`references/rule-file.md`.

## Evidence basis (playbook tiers)

- **Promising** — versioned, mechanically enforceable golden principles over prose style
  guides (line 545, OpenAI Harness Engineering).
- **Promising** — rulebook before gap inventory; gap inventory = what the rulebook's
  defaults won't cover (line 661, Anthropic large-scale code migrations).
- **Watch** — watch for recurring cross-file patterns and fix the upstream rule once
  rather than patching each instance (line 241, same source).
- **Watch** — emit a machine-greppable marker on unresolvable ambiguity instead of
  guessing, for centralized triage (line 671, same source).

Observed-gap evidence: `workflow-gap-evidence.md` line 11 (correction-compiler missed
2026-08-29 on exactly this) and line 17 (recurring gotcha clusters with no procedure:
UTC/local date-shift bugs — *startUp*, "15 times"; local-timezone `Date` parsing;
cache staleness; deploy-skew races).

## Portability

The skill body is plain markdown and portable to any agent that can read files. The
bundled `scripts/sweep.mjs` needs Node ≥18 and nothing else — no npm dependencies, no
Claude Code APIs — so it runs anywhere, including as a CI step. `${CLAUDE_SKILL_DIR}` is a
Claude Code convenience; outside it, invoke the script by its path in the checkout. No
`Workflow` tool, no named subagent types, no hooks are required.

## Testing

Repo `creating-a-skill` conventions: RED baseline then GREEN under
`tests/scenarios/defect-class-sweep/`, sonnet on both, model+date recorded. Scenarios
cover: (a) the one-off fix vs rule-first sweep under deadline pressure; (b) a class with
no mechanical detector (the gate must hold); (c) genuinely ambiguous instances plus
pressure to install enforcement directly. `scripts/sweep.test.mjs` runs against fixtures
containing the date-shift pattern. Gates: `node tools/lint-frontmatter.mjs`, `npm test`.
