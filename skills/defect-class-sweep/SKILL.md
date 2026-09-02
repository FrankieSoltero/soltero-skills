---
name: defect-class-sweep
description: Use when the same bug class has been fixed three or more times across sessions or projects — "we have run into this issue like 15 times how have we not universalized this yet", "this is the third time this month", "universalize it, I want every instance fixed", or a mistakes-and-fixes cluster sharing one root cause — to retire the whole class instead of patching another instance. Writes the rule first (correct pattern plus a mechanically detectable wrong pattern), derives the gap inventory as what the rule will not cover, sweeps the whole repo with a bundled rule-file-driven detector, fixes every instance in one reviewed batch on a branch, lands the rule as a versioned Docs/golden-principles.md entry with a CI-wired check, and leaves a greppable marker on anything genuinely undecidable. No mechanical detector means it is not a class yet — it is a lesson.
---

# Defect Class Sweep

## Overview

A bug fixed five times in five places is one defect the project keeps re-buying. Baselines
sweep, fix, and write a principle — and still leave the class alive four ways: undecidable
instances closed by a guess with no trace, a "mechanical check" that bans an architecture
instead of detecting the pattern, the rule in three unbound copies, and no gap inventory.

Core principle: **the rule is the deliverable; the fixes are its first application.** Write
it before you sweep, make it the artifact a machine reads, and let the diff fall out of it.

## When to Use

- The same defect has been fixed three or more times across sessions or projects, or
  `Docs/mistakes-and-fixes.md` shows a cluster with one shared root cause.
- The owner says a variant of "we keep hitting this", "how have we not universalized this",
  "this is the third time this month", "I want every instance fixed, not another patch".
- A lesson-recall pass hands off a class at N≥3.

## When NOT to Use

- One incident, however painful — use `capture-lesson`. N=1 has nothing to sweep.
- General cleanup, dead code, duplication, file size — `code-optimizer`.
- Proposing a hook or lint rule from repeated corrections *of the agent* —
  `correction-compiler` owns that ledger and its approval gate.
- Two classes in one pass. One class, one branch, one rule.

## The gate: no mechanical detector, no class

A class earns a sweep only if the wrong pattern can be found by grep, an AST query, or a
lint rule at a false-positive rate a human will actually triage. Check this **before**
anything else: a sweep with no detector is an agent reading files and judging, which yields
a diff nobody can review and a rule nobody can enforce next month. Two honest exits when the
gate fails, both finished states:

- **Narrow the class until a detector exists**, then sweep only the narrower class and say
  which part of the original class is left uncovered. "Cache staleness" has no detector;
  "a mutating write under `src/api/**` carrying no reviewed invalidation disposition" does.
- **Record a lesson and stop** — `capture-lesson`, incident cluster named, no branch, no
  principle entry.

Repo size is not a substitute. A baseline judged a four-file repo small enough to audit by
hand and shipped judgment-only fixes as a universalized class; the same reasoning on four
hundred files produces an unreviewable diff, and either way nothing catches instance N+1.
A narrow detector you build while triaging must be promoted, not left out of the deliverable.

## The order, and why it is this order

**1. Write the rule.** One paragraph: the correct pattern, and the wrong pattern expressed
as something a machine can find. Before any sweeping — inventory-first produces a rule shaped
by whatever the grep returned, which is how one baseline's rule came out as "never construct
a Date from a string anywhere", far wider than the defect. Start from `templates/rule.json`;
the rule file is the artifact, not a regex you retype.

**2. Derive the gap inventory: what this rule will not cover.** The cases the detector fires
on that are correct as written, and the cases the rule deliberately exempts. Only writable
*before* the sweep, while the rule is fresh — afterwards it is indistinguishable from a list
of things you decided not to fix. It becomes the **Not covered** line of the principle entry
and the `allowlistMarkers` in the rule file.

**3. Sweep the whole repo.** Run the bundled detector; every instance, with `file:line`.

```bash
node ${CLAUDE_SKILL_DIR}/scripts/sweep.mjs --rule Docs/defect-classes/<class>.rule.json --root .
```

Never a sample, never "the files I was already in", never a count eyeballed off grep output —
a baseline reported "13 call sites" for a tree the runner finds 17 in, then broke those 13
into 16. The runner's output is the inventory: anyone can re-run it and get the same number.

**4. Fix them in ONE reviewed batch on a branch.** `fix/defect-class-<name>`, not a commit
per discovery. A reviewer reads the rule once, then a diff that is its mechanical consequence.

**5. Land the rule versioned and mechanically checked.** A `GP-NNN` entry in
`Docs/golden-principles.md` — wrong, correct, **not covered**, check command, origin — plus
the check wired into the project's CI. Copy `scripts/sweep.mjs` into the repo and point the
check at that copy: `${CLAUDE_SKILL_DIR}` does not resolve on a CI runner, and a check CI
cannot execute is not enforcement. Format in `references/rule-file.md`.

**6. Re-run the sweep on the finished tree before claiming closure.** One run's own
explanatory comment contained the literal text `new Date(...)` and tripped its detector;
only the re-run caught it. Clean means the runner said clean, just now.

## The undecidable instances are the point of the whole procedure

Some instances cannot be decided from anything that exists: the vendor has not replied, the
upstream job is unknown, both formats are in production. Every baseline resolved these in
code and left no trace — one with a value-sniffing helper, another with one that strips the
time off an instant, justified as *"Both shapes describe the same calendar day"*: the open
question restated as a premise. Leave the code as it is and mark it:

```js
// TODO(<class>): <the specific missing information, and who can supply it>
```

Keep the marker on one line, on the matching line or the one directly above it — a wrapped
comment leaves the instance counted as an unreviewed match. List each marked site in the
principle entry under *Known undecidable instances* with the owner action it needs; the
runner reports markers separately from matches, so they stay visible without failing CI. A
guess that looks like a fix is worse than the status quo: the status quo is consistently
wrong and detectable, the guess is silently wrong and gone from the record.

## What the check must be

The check detects **the wrong pattern**; it does not mandate an architecture. Two independent
baselines shipped a check failing on any `new Date(` outside one blessed module — probed with
`new Date(ms)`, a millisecond number that cannot be this defect, both exited 1. A check that
cries wolf on correct code is deleted in week two and takes the rule with it. Probe yours
both ways before wiring it: a real instance must exit 1, a look-alike that cannot be the
defect must exit 0.

- One artifact, not three. The rule file holds the detector; the principle entry points at
  it; the check command runs it. Baselines restated the same rule in prose, in a bespoke
  ~50-line script, and in a module doc comment, with nothing binding them.
- Correct-but-matching code gets an allowlist marker on the line, not an architectural
  workaround. That marker is where the gap inventory lives in the code.
- Prefer a native lint rule (ESLint, ruff, ast-grep) when the ecosystem has one that
  expresses the class better than a line regex.

## Boundaries — what this skill never does

It never writes anything that executes on someone's machine without their approval:
`.git/hooks/`, `settings.json`, or a Claude Code hook. CI wiring is a reviewable change on
the branch; a commit-time hook is not, however much better it feels. If the class warrants
blocking at commit time, hand the proposal to `correction-compiler` *before* installing, not
as a provenance note written after. It also never sweeps two classes at once, never fixes
instances outside the class it opened, and never converts an undecidable instance into a
decided one.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "Let me grep first so I know what the rule should say." | That is the inversion. The grep's contents will shape the rule wider or narrower than the defect. Rule first, then sweep. |
| "Both formats mean the same thing here, so it's not really a guess." | If the vendor or the upstream owner has not confirmed it, it is a guess with a premise attached. Mark it. |
| "Three out of twenty is a rounding error; a uniform diff reviews better." | A uniform diff that silently corrupts one feed reviews *easier* and costs more. Partial-and-marked is the finished state. |
| "Banning the pattern outright is stricter, so it's safer." | Stricter than the class means firing on correct code. That check gets deleted, and the rule dies with it. |
| "I'll write the check as a quick script for this repo." | Then the rule lives in the script, the prose, and a comment, and they drift. One rule file; the runner reads it. |
| "The repo is small enough to audit by judgment." | Size is not a detector. Judgment leaves nothing behind to catch instance N+1. |
| "The hook is better than CI and my teammate already wrote it." | It executes on other people's machines. Route it through `correction-compiler`; wire CI now. |
| "I counted the instances from the grep output." | Baselines that did this reported numbers that did not add up. Report the runner's count. |

## Red Flags — STOP

- About to run the first grep before the rule file exists → stop, write the rule.
- About to write a helper that decides an instance the repo cannot decide → stop, mark it.
- The principle entry has no **Not covered** line → the gap inventory was never derived.
- The check would fail on code that cannot possibly be this defect → it bans an
  architecture, not the class. Narrow it.
- About to write `.git/hooks/`, `settings.json`, or a corrections ledger entry for a check
  you already installed → stop.
- The class has no mechanical detector and you are about to sweep anyway → it is a lesson.
- About to report the class closed without re-running the sweep on the finished tree → stop.

## Details

`references/rule-file.md` — the rule-file contract field by field, the three outcome states
(match / allowlisted / deferred) and why they stay distinct, the `Docs/golden-principles.md`
entry format, and how to wire the check. `templates/rule.json` — start here.
`scripts/sweep.mjs` — the runner. Node ≥18, no dependencies, exit 1 when the class is
present, so it runs unchanged as a CI step. Outside Claude Code `${CLAUDE_SKILL_DIR}` does
not exist; invoke it by its path in the checkout, and vendor a copy for CI.
