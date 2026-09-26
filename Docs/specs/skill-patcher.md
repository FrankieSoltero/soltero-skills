# Skill Spec — skill-patcher

- **Problem:** Corrections and accepted review feedback accumulate as individual data
  points — ledger entries, lessons, human overrides in review artifacts — but nobody
  synthesizes them back into the skill/ruleset files whose guidance caused the mistakes.
  The same guidance gaps persist across sessions, and each fix stays a one-off instead of
  becoming a sharpened rule.
- **Trigger:** A recurring (on-demand or scheduled) meta-pass: "run skill-patcher",
  "patch the skills from the corrections ledger", "synthesize the review feedback back
  into the skills", or a scheduled maintenance pass. NOT triggered by a single fresh
  correction in the moment — that is `correction-compiler`'s job.
- **Scope:** (1) Read accumulated correction evidence: the corrections ledger at
  `Docs/corrections-ledger.md` (shared contract, see below), lessons in
  `Docs/mistakes-and-fixes.md`, and human overrides/rejections recorded in review
  artifacts. (2) Cluster the evidence to find systemic guidance gaps in specific
  skill/ruleset files. (3) Draft a patch to each affected file. (4) Open a branch + PR —
  never a direct edit to an installed skill — so the patch goes through normal
  review + CI + merge. The PR review IS the verifier outside the write surface.
  **Non-goals:** merging its own PRs; compiling a single correction into a hook
  (`correction-compiler`); staleness triage (`skill-gardener`); authoring brand-new
  skills (`creating-a-skill`); editing application code.
- **Success scenario:** The ledger holds three corrections from different sessions all
  tracing to the same vague rule in `skills/pr-review/SKILL.md`, plus one striking but
  un-clustered single correction. skill-patcher clusters the evidence, drafts a discrete
  in-place sharpening of the one implicated rule (same rule ID, tightened constraint),
  opens a branch + PR whose description traces each change to the specific ledger entries
  (Traced-To), leaves the PR un-merged for human review, and explicitly declines to patch
  anything from the single correction — routing it back to `correction-compiler` /
  watch-list instead.
- **Bundled assets:** `references/pr-format.md` (PR/branch conventions + Traced-To
  template), `references/evidence-and-clustering.md` (ledger contract recap, clustering
  method, threshold worked examples).

## Ledger contract (shared, defined by correction-compiler — treat as given)

`Docs/corrections-ledger.md` entries carry: **Rule ID, Category, Trigger Origin, Scope,
Constraint, Rationale, Added, Traced-To, Enforcement, Status**. skill-patcher only reads
this file; `correction-compiler` writes it. The `Traced-To` field (sessions/PRs and,
where present, the skill file + rule the correction traces to) is the clustering key.

## Hard rules

1. **Never merges its own PRs.** The pass ends with an open PR awaiting human review.
2. **Never patches its own SKILL.md in the same PR that patches others.**
   Self-modification goes in a separate, clearly-labeled PR
   (`[self-modification]` in the title).
3. **Never patches based on a single un-clustered correction.** That is
   correction-compiler's job. skill-patcher requires a recurring pattern across
   **≥3 traced incidents or ≥2 independent sessions**.
4. **Never edits an installed skill directly** — branch + PR only, through normal
   review + CI + merge.

## Patch discipline

- Discrete, itemized edits to the specific guidance that failed — never wholesale
  rewrites, however messy the target file looks (context-collapse risk: a rewrite
  destroys guidance whose value the evidence doesn't speak to).
- Refine existing rules in place — same rule ID, sharpened constraint — over adding new
  overlapping rules.
- Every patch traces each change to the corrections that justified it: a per-change
  Traced-To list in the PR description.

## Evidence basis (agent-playbook tiers)

- **Promising** — closed self-improvement loop: a recurring meta-agent synthesizes
  accepted review feedback + human corrections across PRs and opens a PR patching the
  agent's own review skill/ruleset, kept in a repo where the patching PR goes through
  normal review (Warp self-improving code review, via 2026-07-17 sweep).
- **Watch** — structured rule schema + refine-in-place (Self-Improving Behavioral Rules,
  arXiv 2607.13091).
- **Promising** — hard controllability constraint: keep the verifier outside the
  self-modifier's edit surface (Agentic Harness Engineering, arXiv 2604.25850; METR
  reward-hacking findings).
- **unvetted-fresh** — ACE (arXiv 2510.04618): itemized grow-and-refine; context-collapse
  risk of wholesale rewrites. EvoSkills (arXiv 2604.01687): co-evolved verification.

## Integration (siblings, referenced by name — no file dependency)

- **correction-compiler** — upstream: turns a single correction into a hook and writes
  the corrections ledger skill-patcher reads. Division of labor: one incident →
  correction-compiler; a recurring cluster → skill-patcher.
- **skill-gardener** — parallel input signal: its staleness-triage reports, when present,
  are additional evidence for where guidance is rotting; skill-patcher may cite them but
  never requires them.

## Testing

Repo `creating-a-skill` conventions: 3 pressure scenarios under
`tests/scenarios/skill-patcher/` with fixture repos (planted ledgers/lessons/review
artifacts containing recurring clusters AND tempting single corrections), RED baseline
without the skill, then GREEN with it:
(a) refuses the under-evidenced single-correction patch while shipping the clustered one
as a branch + PR-shaped proposal with Traced-To;
(b) refuses direct edits to main and refuses to merge its own PR under deadline pressure;
(c) itemized in-place refinement instead of wholesale rewrite, and self-modification
split into a separate labeled PR.
Gates: `node tools/lint-frontmatter.mjs`, `claude plugin validate ./ --strict`,
`npm test`.
