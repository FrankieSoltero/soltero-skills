# Skill Spec — dispatch-contract

- **Problem:** Every subagent dispatch outside lean-sdd's task loop — ad-hoc research
  agents, reviewers, the 20+ security-review fan-outs a day, one-off implementers — goes out
  as a free-text prompt and comes back as free-text prose. Three failures follow. (1) The
  brief pastes file *contents* instead of naming paths, leaves the tool set wide open, and
  omits `model`, so dispatched work silently inherits the session's orchestrator model.
  (2) The return has no schema, so "completed-clean" and "all 19 tasks complete" arrive with
  nothing a parent could check, and raw stdout and stack traces flow back into the parent's
  context. (3) The parent then *speaks* the worker's claim as fact — the observed defect on
  2026-08-22 and 2026-08-29, where a relayed "all 19 tasks complete" was followed by a
  whole-branch review that found a Critical, and where 20+ nightly "completed-clean" reviews
  produced no finding for three weeks.
- **Trigger:** Use before dispatching any subagent outside a lean-sdd task loop (research
  agent, reviewer, security-review fan-out, audit worker, one-off implementer), and again
  before relaying any subagent's status, count, or "clean/complete/passing" claim to a human
  or into a report.
- **Scope / non-goals:** Supplies the typed brief (objective, inputs as file refs, tool
  allowlist, pinned model tier per the repo's tier standard, return schema with validation
  conditions, the autonomy and claim-audit lines), the worker-side rule that only the
  structure comes back, and the parent-side gate that a relayed claim is verified against
  diff / test output / tool result before it is spoken. Bundles a deterministic brief
  validator. Non-goals: it does not duplicate or replace lean-sdd's task-loop
  brief/report/diff handover (`skills/lean-sdd/references/implementer-prompt.md`,
  `scripts/task-brief`) — inside that loop, lean-sdd's contract governs; it does not decide
  *whether* to delegate; it does not grade the worker's output quality (that is a reviewer's
  job); it does not produce evidence receipts (`evidence-gate`) or run the verification
  command for the whole lifecycle (`lean-verification`), it makes the claim checkable so
  those can.
- **Success scenario:** A 19-task implementer swarm in `/tmp/acme-scheduling` replies "All
  19 tasks complete. Full suite green: 212/212. Ready to merge" while a human waits in Slack
  and the promised update is overdue. The agent does not relay it. It reads the diff and
  runs the suite itself, finds the suite red (2 failures) and one claimed task's file absent
  from the tree, and reports the observed-vs-claimed pair — then re-dispatches the gap under
  a brief whose return schema names the validation conditions that would have caught it.
- **Bundled assets:** `scripts/validate-brief.mjs` (deterministic brief checker: required
  fields present, inputs are paths not pasted blobs, a model is pinned and from the tier
  standard, return schema carries validation conditions; unit-tested via
  `validate-brief.test.mjs`), `references/brief-template.md` (the typed brief and return
  record templates, field by field, with the fan-out and single-dispatch variants).
