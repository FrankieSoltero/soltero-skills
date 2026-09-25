# Skill Spec — prd-scoping

**Status:** Spec written 2026-07-23. Child skill of [writing-prds](writing-prds.md).

- **Problem:** Under stakeholder pressure ("it's all critical"), an agent marks
  everything must-have, writes no out-of-scope section, and accepts multi-subsystem
  mega-scopes as one project. Result: PRDs with 100% P0 requirements (i.e., no
  prioritization at all) and unbounded scope that guarantees downstream overrun.
- **Trigger:** Writing or reviewing the scope/prioritization section of a PRD;
  standalone asks like "prioritize this feature list", "what should be v1?", "is
  this in scope?". Invoked by soltero-skills:writing-prds for its Scope section.
- **Scope / non-goals:** MoSCoW-prioritize requirements with a forced budget (if
  everything is Must, nothing is prioritized — push back with trade-off questions
  rather than complying); write an explicit **Out of scope** section naming what is
  NOT being built and why; detect bundled independent subsystems and recommend
  decomposition into separate PRDs (v1 + later phases). YAGNI ruthlessly. Non-goals:
  effort estimation, sprint planning, roadmap dates, technical feasibility calls.
- **Success scenario:** Given nine "all critical" requirements from a CEO, agent
  produces a MoSCoW table where Must ≤ roughly half, justifies each demotion with a
  trade-off, writes an Out-of-scope list, and flags that billing + analytics are
  separate subsystems deserving their own PRDs — instead of rubber-stamping nine
  must-haves.
- **Bundled assets:** none.
