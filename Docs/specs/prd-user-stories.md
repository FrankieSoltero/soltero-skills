# Skill Spec — prd-user-stories

**Status:** Spec written 2026-07-23. Child skill of [writing-prds](writing-prds.md).

- **Problem:** Asked for user stories or acceptance criteria, an agent produces
  role-play boilerplate: stories for personas nobody validated, "acceptance criteria"
  that are vague quality adjectives ("should be fast", "intuitive", "seamless"), no
  Given/When/Then structure, and no way for a reviewer or tester to say pass/fail.
  Stories also float free — not traceable to any stated requirement.
- **Trigger:** Writing or reviewing the user-stories / acceptance-criteria section of
  a PRD; or standalone asks like "write user stories for X", "add acceptance criteria
  to this feature". Invoked by soltero-skills:writing-prds for its Users & Stories
  section.
- **Scope / non-goals:** Turn stated requirements into user stories
  (`As a <persona>, I want <capability>, so that <outcome>`) where every persona
  comes from the PRD/user (never invented), every story traces to a requirement, and
  every story carries testable Given/When/Then acceptance criteria (concrete inputs,
  observable outcomes — no unmeasurable adjectives). Flags requirements with no
  story and stories with no requirement. Non-goals: prioritization (prd-scoping),
  metrics (prd-success-metrics), UI design, implementation detail.
- **Success scenario:** Given a PRD excerpt with two requirements and one named
  persona, agent writes stories only for that persona, asks (or flags) rather than
  inventing a second persona, and each story's criteria are Given/When/Then
  statements a tester could execute verbatim.
- **Bundled assets:** none.
