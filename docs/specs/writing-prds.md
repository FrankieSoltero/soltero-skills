# Skill Spec — writing-prds

**Status:** Spec written 2026-07-23 (autonomous /goal session; modeled on
superpowers:brainstorming per the user's request: "a skill similar to the super
powers brainstorm skill except … a project requirement doc with similar child
skills to help out with the parent skill").

- **Problem:** Asked for a PRD (or handed a raw product idea), an agent one-shots a
  long, generic requirements document: it invents users, requirements, and numbers it
  was never given, asks no clarifying questions, marks everything must-have, and
  skips approval — so the "requirements" are fiction and downstream design/build work
  inherits them. There is also no gate stopping the agent from jumping straight to
  design or code before requirements exist.
- **Trigger:** User asks for a PRD / requirements doc / product spec, or brings a
  product idea that needs requirements before design ("we should build…", "write up
  the requirements for…"). Sits **upstream** of superpowers:brainstorming (PRD = what
  & why; brainstorming = technical design = how).
- **Scope / non-goals:** Collaborative dialogue (one question at a time, multiple
  choice preferred) that turns an idea into a PRD at
  `docs/prds/YYYY-MM-DD-<topic>-prd.md`, built section by section with user approval
  per section. Delegates specialist sections to child skills: soltero-skills:
  prd-user-stories, prd-scoping, prd-success-metrics. Hard gate: no design, no
  implementation, no tech-stack decisions until the PRD is approved. Self-review
  (placeholders, contradictions, ambiguity, scope) then a user review gate; terminal
  state is offering handoff to superpowers:brainstorming. Non-goals: technical
  design, architecture, implementation plans, estimates/roadmaps.
- **Success scenario:** User says "write me a PRD for a customer feedback widget."
  Agent explores project context, asks clarifying questions one at a time (problem,
  users, constraints, success criteria), flags decomposition if the ask bundles
  independent subsystems, drafts the PRD section by section getting approval as it
  goes, uses the child skills for stories/scope/metrics sections, writes the doc,
  self-reviews, asks the user to review, and only then offers to hand off to
  superpowers:brainstorming.
- **Bundled assets:** `references/prd-template.md` (canonical PRD section template).
