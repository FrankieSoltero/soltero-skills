# Skill Spec — correction-compiler

- **Problem:** User corrections land as soft memory — a CLAUDE.md line, a lesson entry in
  `Docs/mistakes-and-fixes.md` — that the model may ignore under context pressure, so the
  user ends up correcting the same class of mistake again and again. Hooks, lint rules, and
  CI checks are deterministic; memory is hope. Nothing today notices "this is the Nth time"
  and escalates the correction from prose to enforcement.
- **Trigger:** The user corrects the agent (or the lessons log / session history shows prior
  corrections) for the **same class of mistake ≥2 times**. Evidence sources: entries in
  `Docs/mistakes-and-fixes.md` and/or the current session history.
- **Scope:**
  - Detect the repeat (≥2 corrections for the same class), then **propose** — never
    auto-install — a deterministic enforcement artifact: a Claude Code hook
    (PreToolUse/PostToolUse in settings.json), a lint rule, or a CI check.
  - Record every compiled rule in `Docs/corrections-ledger.md` (shared contract; other
    skills consume this format — see `references/ledger-format.md` for the exact fields:
    Rule ID `CC-NNN`, Category, Trigger Origin, Scope, Constraint, Rationale, Added,
    Traced-To, Enforcement, Status `proposed|approved|installed|retired`).
  - **Approval gate (hard rule):** the proposing agent never approves its own artifact.
    Anything that executes (hooks run arbitrary shell) requires explicit human approval
    before install; the ledger entry records who/what approved. Until then Status stays
    `proposed`.
  - **Rule hygiene:** when a new correction shows an existing rule is too broad or too
    narrow, refine that rule **in place** (same Rule ID, sharpen the Constraint, extend
    Traced-To) rather than adding an overlapping rule; more-specific rules subsume
    more-general ones.
  - Hook installation mechanics are delegated to the harness's `update-config` skill
    (settings.json write mechanics); this skill decides WHAT to propose and keeps the
    audit trail.
- **Non-goals:** capturing first-time lessons (that is `capture-lesson`); writing
  settings.json itself (that is `update-config`); auto-installing or self-approving any
  enforcement artifact; speculative rules for mistakes that have not actually recurred.
- **Success scenario:** The user corrects the agent for committing `console.log` debug
  statements; `Docs/mistakes-and-fixes.md` already holds a lesson from a prior identical
  correction. The agent recognizes the repeat, drafts a PreToolUse hook (or lint rule)
  blocking the pattern, appends a `proposed` entry to `Docs/corrections-ledger.md` with
  Traced-To pointing at both corrections, presents the artifact to the human for approval,
  and does not touch settings.json until the human approves (approval then recorded in the
  ledger, install delegated to `update-config`).
- **Bundled assets:** `references/ledger-format.md` (the exact shared ledger contract),
  `references/enforcement-artifacts.md` (choosing hook vs lint vs CI; hook proposal
  patterns; composing with `update-config`).

## Evidence basis (agent-playbook tiers)

- **Promising** — distinguish read-only config from agent-written memory: enforcement
  belongs in config the agent cannot silently drift past (Inside the Scaffold,
  arXiv 2604.03515).
- **Watch** — add rules reactively after observed mistakes, not speculatively (Cursor
  best practices).
- **Watch** — structured rule schema with Traced-To provenance and refine-in-place
  (Self-Improving Behavioral Rules, arXiv 2607.13091).
- **unvetted-fresh** — Compiling User Corrections into Runtime Enforcement
  (arXiv 2606.13174).
