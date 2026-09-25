# Skill Spec — lean-plans

- **Problem:** Plans written for subagent execution fail in one of two opposite ways.
  Baseline agents produce vague task lists ("add validation", "write tests") that fresh-context
  implementers cannot execute without guessing interfaces. Agents following
  superpowers:writing-plans overcorrect: the "No Placeholders" rule plus 2–5-minute step
  granularity forces the planner to write the entire implementation (all code, all tests)
  in markdown, which implementers then transcribe — plan authoring often takes longer than
  execution, and the plan is ~3× longer than it needs to be. Modern models do not need
  code-level transcription plans; they need exact contracts. Plans also omit any dependency
  information, forcing strictly serial execution downstream.
- **Trigger:** Use when turning an approved spec/design into an implementation plan for
  multi-step work and the user wants the fast, contract-level pipeline (lean variant of
  superpowers:writing-plans; pairs with lean-sdd for execution).
- **Scope / non-goals:** Produces a plan document: header (goal, architecture, global
  constraints verbatim), file map, task dependency table (files touched + depends-on +
  risk tier per task), and one contract block per task — exact interfaces (signatures,
  names, types), behavior/test-case tables (input → expected), verification command with
  expected output, commit message. Verbatim code appears ONLY where exactness is the
  requirement (magic values, external API shapes, tricky algorithms). Non-goals: does not
  execute the plan (lean-sdd), does not gather requirements (lean-brainstorming), does not
  replace plan-review's grading gate. Not for single-step tasks.
- **Success scenario:** Given a 3-component feature spec and pressure to "spell out all the
  code so implementers just transcribe," the agent writes a contract-level plan: every task
  has exact interface signatures and a behavior table, a dependency/risk table marks tasks
  2 and 3 as disjoint-parallelizable, no task contains a full implementation body, and the
  self-review confirms type-name consistency across tasks. Plan is a fraction of the length
  of a code-level plan while remaining executable by a fresh-context implementer with no
  guessing.
- **Bundled assets:** `references/plan-template.md` (header + dependency table + task
  contract block format). Derived from superpowers:writing-plans (MIT, © 2025 Jesse
  Vincent), adapted to contract-level granularity.
