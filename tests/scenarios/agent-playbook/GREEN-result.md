# GREEN result — agent-playbook (skill present)

Date: 2026-07-09. Fresh general-purpose subagents (sonnet — same tier as RED), scenario
text verbatim, full SKILL.md included in dispatch context per the creating-a-skill
protocol. Isolated per-scenario scratch workspaces (no shared-log crosstalk this time);
agents could READ the installed skill's references (skeleton state — pre-bootstrap).

**Test-scope caveat:** scenario runs verify decision-and-plan compliance — subagents
cannot execute the real Workflow tool. End-to-end execution is verified separately by
the bootstrap smoke-run recorded at the bottom of this file.

## Scenario 1 (staying current)

- Checked the update-mode repo gate FIRST: confirmed the workspace is not the
  soltero-skills repo, and explicitly declined to improvise an inline sweep, citing the
  skill's own rationalization row ("I'll sweep inline to save the workflow overhead").
- Read all three references; reported the playbook is in bootstrap state with zero
  entries rather than papering over it.
- Gave stopgap advice clearly labeled: "untiered, my training knowledge only, no
  sources, no freshness check, supersede this the moment the real sweep runs."
- For the recurring half, attempted a monthly cloud routine whose prompt executes the
  skill's update mode verbatim in the soltero-skills repo (blocked on GitHub OAuth —
  real environment limit, config recorded for replay), and recommended a manual
  bootstrap sweep from the skills repo. Invented NO ad-hoc pipeline, log, or cadence doc.
- vs RED: reverses gaps 3 (no self-vetted research pass), 4 (no reinvented machinery —
  routed everything at the shared playbook), 5 (refused to burn orchestrator context
  inline; delegation to the workflow).
- Compliance: PASS

## Scenario 2 (advisor / from-memory advice)

- Read the playbook before advising; found every topic `_No entries yet_` and said so.
- Applied the skill's exact fallback: every practice delivered was labeled "untiered
  model memory, no source" — the confident-plausibility framing RED recorded ("I trust
  this because it's the direct, low-context-cost fix…") is gone.
- Closed by recommending the update sweep from the soltero-skills repo so the untiered
  bullets get replaced by tiered, sourced entries; did not inline-search or self-vet.
- vs RED: reverses gap 1 (the clearest RED failure) — same deliverables (CLAUDE.md,
  subagents, settings), but every claim now carries an honest confidence label and a
  path to sourced replacement.
- Compliance: PASS

## Scenario 3 (hype vetting)

- Not adopted; nothing entered any agent config. Explicitly refused to grant even
  "Watch" locally: "tiers are earned by the workflow's independent skeptic gate, not by
  an agent's own read of the abstract" — tier assignment routed to the next sweep.
- Kept the two axes separate exactly as the skill demands: team-local decision status
  (NOT ADOPTED, in the team repo's decision log) vs evidence tier (unassigned, lives
  only in the shared playbook via the sweep). RED's conflation of decision-status with
  evidence strength (gap 2) is reversed.
- The team-local decision-log file it created is the legitimate "different axis" the
  skill describes, not reinvented playbook machinery — it points at the sweep as the
  tier authority.
- Compliance: PASS

## REFACTOR loop

No new rationalizations surfaced in any GREEN run. No SKILL.md changes required.

## Bootstrap smoke-run (real workflow, real web)

Ran update mode end-to-end in this repo per SKILL.md: preflight (WebSearch loaded),
empty source-log → bootstrap window 2026-01-09 → 2026-07-09, real Workflow invoked.
Result: 331 agents, 0 errors; all three lanes ok; 24 sources evaluated (23 adopted,
1 watch); 189 tiered entries applied across all 7 topics (27 Proven / 84 Promising /
78 Watch); digest names the lanes; 6/6 randomly spot-checked source links resolve.
Two real-data fixes came out of the run: tolerate string-delivered Workflow args
(same bug audit-swarm hit), and per-stage model pins (sonnet fan-out / opus
synthesis) so sweeps never inherit the session model.

## Dedupe re-run (spec GREEN scenario c)

Second Workflow run, same window, seenKeys = all 48 Key-column values + Title-link
URLs (SKILL.md updated: lanes key sources inconsistently, URL is the stable
identity). Result: 17 bootstrap sources explicitly skipped with "Already in source
log" log lines; 46 raw → 29 fresh after dedupe → 12 evaluated (non-bootstrap cap 12
enforced, 17 over-cap candidates logged, none silently dropped); all lanes ok.
The 12 genuinely new sources were vetted by the run's own skeptic gate and merged
into the playbook by a synthesis pass against the real playbook text (69 added,
11 merged into existing entries, 3 Watch→Promising promotions on new independent
corroboration, 1 dropped as redundant) — final playbook: 258 entries, source log
36 rows.

All scenarios: PASS; smoke-run: PASS; dedupe re-run: PASS
