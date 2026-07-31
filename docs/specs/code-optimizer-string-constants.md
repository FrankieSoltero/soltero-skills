# Skill Spec — code-optimizer (edit: magic strings → enums / named constants)

Edit to the existing `skills/code-optimizer` skill. Adds a fifth cleanup category. Does not
change categories 1–4, the gate contract, or the branch/commit discipline.

- **Problem:** The skill's four categories (dead code → redundancy → file splitting → declared-
  guideline fixes) have no home for the single most common form of repeated-value rot: the same
  magic string literal typed out at 5, 8, 20 call sites — `"pending"`, `"admin"`, `"user.created"`
  — where a typo is a silent runtime bug and a rename is a repo-wide grep. Duplication tooling
  misses it by design (jscpd's defaults need ~5 lines / 50 tokens; a one-token literal never
  clears the bar), and dead-code tooling has nothing to say about it. So a pass ends "clean"
  with the literals untouched and unmentioned. The two available failure modes are both bad:
  ignore string duplication entirely because no category covers it, or freelance a sweep of
  every string in the repo — which is exactly the "general convention I happen to know from
  memory" that category 4 forbids, and which quietly rewrites wire formats and user-facing copy.
- **Trigger:** Any normal code-optimizer pass — this is category 5 of the standard run, not a
  separate invocation. Also reached directly when the user asks to "get rid of the magic
  strings", "use enums/constants instead of string literals", or "centralize these status
  values".
- **Scope / non-goals:** Detect repeated string literals with a real counted tool pass (ripgrep/
  ESLint rule/AST grep) producing an occurrence count and `file:line` evidence per site; then, when
  and only when the project has **declared** the rule, replace qualifying literals with members of
  a shared constants/enum module in one gate-verified commit, behavior-preserving and byte-
  identical. Non-goals: inventing the rule where the project never declared it (undeclared →
  report + propose config, do not edit); numeric magic numbers (separate concern, not this edit);
  i18n/user-facing copy (belongs in a message catalog, and changing it is a UX change);
  normalizing near-matching literals into one value (that is a behavior change wearing a cleanup
  costume); creating a second constants home when one already exists.

## Declaration gate (why this category is not "vibes")

Category 4's prohibition — never apply general language conventions you happen to know from
memory — governs this category too. Extraction **applies** only if at least one of these exists:

1. a `stringConstants:` block in `.code-optimizer.yml`; or
2. an explicit rule in `CLAUDE.md` / `AGENTS.md` (e.g. "repeated string literals must be enum
   members"); or
3. a lint rule the repo has enabled to that effect.

With no declaration, the category is still **run**, but its completion state is a reported
candidate table (literal, count, sites) plus a drafted `stringConstants:` block shown to the user
for review — the same "write it and stop for review" contract the config bootstrap already uses in
`reference.md`. This is the one category where "reported, not applied" is a finished result, and
only because the authority to edit is missing; silence about the candidates is still a failure.

## Config knob (`.code-optimizer.yml`)

```yaml
stringConstants:
  minRepeats: 3               # literal must appear in >= N distinct sites (default 3)
  minLength: 4                # ignore trivially short literals (default 4 chars)
  destination: src/constants.ts   # the ONE centralization home; required to apply
  style: enum                 # 'enum' | 'const' — how the project declared it; no default guess
  exclude:                    # globs never scanned by this category
    - "**/*.test.*"
    - "**/__fixtures__/**"
    - "**/*.generated.*"
  literalAllowlist:           # values that must stay literal wherever they appear
    - "application/json"
    - "user.created"
```

`exclude` and `literalAllowlist` are the category's two escape hatches, and they are the record of
a decision — the same role `publicApiAllowlist` plays for dead code. A literal left alone is
logged with its reason, never silently dropped.

## What counts as a candidate

A literal is a candidate when **all** hold:

- byte-identical value (quote style normalized) at **>= `minRepeats` distinct sites**, each with
  `file:line` from the counted pass — not eyeballed, and not estimated;
- length >= `minLength`;
- occurrences span >= 2 files, or the literal is a semantic key (status, role, event name,
  feature-flag key) even within one file — repeats inside a single function body are a local
  variable, not a constants module;
- the replacement is byte-for-byte value-preserving.

## What is NOT a candidate

- **One-off literals** — a single site, however ugly.
- **Already centralized** — the value has a constant in `destination` already. Replacing the
  remaining stragglers with that *existing* constant is in scope; minting a second home is not.
- **Wire-protocol / persisted / contract values** — HTTP header names, MIME types, raw-SQL table
  and column names, JSON keys in serialized payloads, env-var names, URL paths, message-bus event
  names, enum values written to a database. These may be extracted only if the constant's value is
  identical to the current literal; the value itself is never "improved", renamed, shortened, or
  case-normalized. Default posture: leave literal and list in `literalAllowlist`.
- **User-facing copy / i18n strings** — never converted as part of a cleanup pass; they belong in
  a message catalog and any edit to them is a product decision.
- **Test fixtures and assertion literals** — a test asserting `"pending"` is *deliberately*
  restating the value so a wrong constant fails the test. Excluded by default via `exclude`;
  pointing tests at the same constant they are meant to guard defeats them.
- **Near matches** — literals differing by case, whitespace, punctuation, or pluralization are
  separate values. Merging them is a behavior change and is out of scope, full stop.
- Anything under the top-level `exclude` or in generated/vendored output.

## Where it runs

Category **5**, after declared-guideline fixes, its own commit
(`chore(code-optimizer): centralize repeated string literals`), the project's verify commands run
and OBSERVED after it, revert-on-red with `git restore .` and log-as-skipped, exactly like
categories 1–4. Never batched into another category's commit.

- **Success scenario:** A TS service declares in `CLAUDE.md`: "repeated string literals (3+ uses)
  belong in `src/constants.ts`." A pass runs a counted ripgrep sweep and reports `"pending"` ×7 in
  4 files, `"approved"` ×5, `"rejected"` ×5, `"application/json"` ×6 (a MIME type, in
  `literalAllowlist`), `"Payment failed — check your card"` ×3 (user-facing copy), and
  `"user.created"` ×4 (published to a message bus). Category 5 extracts the three status values
  into `OrderStatus` in `src/constants.ts` with byte-identical values, leaves the MIME type and the
  copy string alone with logged reasons, extracts `"user.created"` only as a constant whose value
  is unchanged, does not touch the tests that assert `"pending"` literally, runs the verify
  commands, observes green, and commits — one commit, category 5 only. The deliverable's table
  lists every candidate with its count, sites, and action-or-reason. A no-edit baseline either
  never mentions the literals at all or sweeps all six into an enum, renaming the bus event and
  collapsing two near-identical copy strings into one.
- **Bundled assets:** none new. `SKILL.md` gains category 5 (Phase 1 detect line, Phase 2 apply
  step, two rationalization rows, two red flags); `reference.md` gains a section-5 tool row
  (counted-literal pass per ecosystem + degrade path) and the `stringConstants` schema key.

## Testing

Repo `creating-a-skill` conventions. Three PRESSURE scenarios in
`tests/scenarios/code-optimizer/` (`scenario-4.md`, `scenario-5.md`, `scenario-6.md`) targeting
three distinct failure modes: silence under time pressure (no declaration), skipping a declared
rule because no tool flagged it, and over-applying into wire format and user-facing copy. RED
baseline is run against the CURRENT skill (four categories) before any SKILL.md edit is written —
the Iron Law: no skill content before an observed baseline failure.
