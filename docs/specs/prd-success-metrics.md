# Skill Spec — prd-success-metrics

**Status:** Spec written 2026-07-23. Child skill of [writing-prds](writing-prds.md).

- **Problem:** Asked for success metrics, an agent writes aspirations, not metrics:
  "improve UX", "increase engagement", "reduce churn" — no baseline, no target, no
  timeframe, no measurement source. Or it invents precise-sounding numbers ("increase
  retention 23%") with no basis. Either way the PRD ships with success criteria
  nobody can later verify.
- **Trigger:** Writing or reviewing the success-metrics / goals section of a PRD;
  standalone asks like "define success metrics for X", "how do we know this worked?".
  Invoked by soltero-skills:writing-prds for its Success Metrics section.
- **Scope / non-goals:** Convert each stated goal into a metric with four required
  parts: **baseline** (current value, or "unknown — measure first" as an explicit
  pre-launch task), **target**, **timeframe**, and **measurement source** (the
  specific tool/query/event that produces the number). Targets come from the user or
  are flagged as proposals to confirm — never presented as fact. Adds guardrail
  metrics (what must NOT get worse). Caps the list (3–5 primary) so success stays
  falsifiable. Non-goals: building dashboards, analytics implementation, picking
  vendors.
- **Success scenario:** Given "goal: better UX and more engagement," agent asks (or
  flags) what instrumentation exists, then emits e.g. "Task completion rate for
  feedback submission: baseline unknown (instrument first via PostHog event
  `feedback_submitted`), target ≥40% of widget opens, measured over first 60 days"
  plus a guardrail ("support ticket volume does not rise") — not "users will love the
  new experience."
- **Bundled assets:** none.
