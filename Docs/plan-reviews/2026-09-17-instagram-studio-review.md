# Plan review — instagram-studio

Plan: `Docs/plans/2026-09-17-instagram-studio.md` · Spec: `Docs/specs/instagram-studio.md`
Council run: `wf_b3857f75-804` (full council, 8 agents)

## Round 1 — 2026-09-17 — **BLOCKED — do not execute**

Overall **85.8** (threshold 85) · floor breaches: none · **blocking violations: 3** · unknown dimensions: none.
Structural pre-pass (`plan-graph.mjs`): 0 findings.

| Dimension | Weight | Grader | Skeptic misses | Final |
|---|---|---|---|---|
| D1 Decomposition & ordering | 15 | 96 | 1 | 84 |
| D2 Verifiability | 20 | 88 | 0 | 88 |
| D3 Spec fidelity & traceability | 20 | 85 | 0 | 85 |
| D4 Concreteness | 15 | 82 | 0 | 82 |
| D5 Risk & reversibility | 15 | 87 | 0 | 87 |
| D6 Consistency & completeness | 15 | 88 | 0 | 88 |

### Blocking violations

1. **D1** — Tasks 8 and 9 both write under `Docs/evals/instagram-studio-2026-09-17/` with no dependency edge between them.
2. **D1** — "Tasks 7, 8, 9 touch disjoint files" is false and authorizes that unsafe concurrency.
3. **D4** — Task 2 names scenario fixtures ("a small web-app repo fixture", "a supplied tips doc", two photo paths) without paths or a Files entry.

### Minor violations

- D2/D6 — safe-zone checks in Task 6 (S1) and Task 9 ("eyes-on") are unmeasured visual judgment.
- D3 — spec's `+faststart` absent from Global Constraints and the validator; optional `trend-research` hand-off not carried into Task 5.
- D4 — Task 9 points at "a small fixture project" rather than a named one.
- D5 — no handling of non-public facts flowing from source into a public caption; no post-tag rollback note.
- D1 (owner decision) — lessons capture bundled into the release task.
- D3 (owner decision) — spec says `content-marketing` lists the new skill in its "Parent of" line; the plan leaves that file untouched.

### Mechanical fixes applied to the plan after round 1 (unreviewed until round 2)

- Task 9 now depends on `6, 8`; concurrency note rewritten.
- Task 2 gains exact fixture paths and contents (`fixtures/web-app/`, `happy-hour-brief.md`, `photos/bar-interior.jpg.txt`, deliberately absent `photos/patio.jpg`, `tips.md`); scenarios and Task 9 reference them by path.
- `+faststart` added to Global Constraints; `isFaststart(buffer)` + `video.faststart` case + MP4 box layout added to Task 4.
- Task 5: non-public-fact `[CONFIRM: public?]` rule; optional `trend-research` mention.
- Task 6 S1 and Task 9 safe-zone checks given pixel bounds (top ≥ 250, bottom ≤ 1500, right ≤ 960) with quoted/measured evidence.
- Task 10: rollback row (patch release, never move the tag).

### Owner questions (open — gate stays shut on the plan as a whole until round 2 passes)

1. Lessons capture: separate task, or keep in Task 10 as an explicit no-op when nothing was recorded?
2. `content-marketing` "Parent of" line: amend the spec to drop it, or add a task that edits that skill (which pulls in creating-a-skill's Iron Law for that edit)?

## Round 2 — 2026-09-17 — **PASS**

Council run: `wf_51ed7cd1-084` (full council, all six dimensions re-graded — no carry-forward, because the owner decisions added two tasks). Owner answers: parent link → add a task (Task 10); lessons → separate task (Task 11).

Overall **88.5** (round 1: 85.8, Δ 2.7 — circuit breaker not tripped) · floor breaches: none · blocking violations: **0** · unknown dimensions: none.

| Dimension | Weight | Grader | Skeptic misses | Final |
|---|---|---|---|---|
| D1 Decomposition & ordering | 15 | 87 | 0 | 87 |
| D2 Verifiability | 20 | 88 | 0 | 88 |
| D3 Spec fidelity & traceability | 20 | 82 | 0 | 82 |
| D4 Concreteness | 15 | 92 | 0 | 92 |
| D5 Risk & reversibility | 15 | 96 | 0 | 96 |
| D6 Consistency & completeness | 15 | 88 | 0 | 88 |

### Recommended (minor) — plan left as passed; carried to the executor as brief notes

The plan file is NOT edited after PASS (an edit would need a fresh round). These
are passed verbatim into the relevant task briefs instead:

- Task 7: do not start before Task 6 reports 4/4 GREEN.
- Task 5: reel default target 12–20s; carousel ≤ ~25 words/slide (guidance); render failure → CLI output surfaced verbatim; "When NOT to use" also lists analytics and scheduling; Task 5 may be reviewed per file group.
- Task 5 / Task 9: "settled frame" = first frame ≥ 0.5s after the last text-position keyframe of that beat.
- Task 8 verify: report has a tier × with/without pass-rate table (≥2 tier rows) and a `## Canary` section stating PASS/FAIL.
- Task 10: the scenario to re-run is whichever of `tests/scenarios/content-marketing/scenario-{1,2,3}.md` never names the skill — the implementer states which file and why in `parent-link-check.md`.
- Plan header says the spec is approved; the spec's Status line flips in Task 1 (user approved in-session 2026-09-17).
