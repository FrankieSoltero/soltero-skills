# RED baseline — walkthrough-tutor (no skill)

Date: 2026-07-02. Fresh general-purpose subagents (model: sonnet). Each was given the same real diff
to explain (`gh pr diff 6`, the audit-swarm PR, ~2900 lines, read from a file) and asked to produce
its actual FIRST reply to the engineer. Skill absent.

## Method note — why these scenarios are OPEN-ENDED (not A/B/C)

The `creating-a-skill` template uses A/B/C pressure scenarios. That format does not work for a
*pedagogy* skill: an A/B/C option that describes the interactive method (calibrate → mental model →
one layer per turn) hands the answer to the agent. First-pass A/B/C scenarios here did exactly that —
all three baselines "chose B" and complied, masking the failure. So the scenarios were rewritten as
**open-ended realistic requests** ("just give me the rundown", no options) — the only framing that
reveals the natural default. Documented deviation from the template, evidence-backed below.

## Headline — the default is a one-shot WALL OF TEXT

Given a realistic open-ended request, every baseline dumped the entire explanation in a single
message. None calibrated before teaching; none gave a mental model and then stopped; none taught one
layer and waited. Concept-teaching, where present, was buried inside the dump rather than paused on.

- **Scenario 1 (rundown):** opened literally with "Here's the rundown," then ~700 words of
  top-to-bottom sectioned explanation (feature, test evidence, infra, unrelated docs, mechanical
  bits) in ONE message. Zero calibration questions. No mental-model-then-check. No turn-taking.
- **Scenario 2 (junior):** a full multi-section explanation — mental model AND all the code details
  (with `file:line` refs) AND a suggested reading order — in one message, only offering "want to go
  deeper?" AFTER dumping everything. It never asked what the junior already knew, never stopped at
  the mental model, and folded the unfamiliar concepts into the wall rather than pausing to teach
  each one and check. (Opened with "good instinct to ask" but asked nothing itself first.)
- **Scenario 3 (expert):** the clearest failure — a single-shot, deep expert-level analysis
  (design, the quorum/dedup/masking implementation details, disclosed gaps, cost) with NO calibration
  question and not even a closing question. Comprehensive and correct, but a lecture, not a session.

## Confirming evidence — open-ended probe

Before rewriting the scenarios, an open-ended probe ("Hey, can you explain the changes in this PR so
I actually understand what's going on? Just give me the rundown.") produced the same result: a
~700-word one-shot rundown, no calibration, no turn-taking. This is what motivated the open-ended
scenarios. (For contrast, the discarded A/B/C runs all "chose B" and calibrated — because option B
spelled the method out. That is the telegraphing the rewrite removed.)

## Failure summary — what the skill must fix

1. **No turn-taking:** the whole explanation ships in one message. The skill must enforce teaching
   one layer, then STOP and wait.
2. **No calibrate-before-teaching:** none asked the learner's level/depth first. The skill must ask
   2–3 calibration questions before any explanation.
3. **No mental-model-first-then-check:** the big picture was mixed into the same message as the code.
   The skill must give the mental model with NO code, and confirm it landed before descending.
4. **Concepts not taught as first-class:** unfamiliar concepts (majority-vote panel, string-keyed
   dispatch) were described in passing, not paused on and taught then reconnected.

## Scope note (per creating-a-skill Step 3)

Unlike the A/B/C framing (which the baseline passes trivially), the open-ended framing shows a clear,
consistent failure the skill fixes. The skill's value is real: it makes the calibrated, turn-taking,
mental-model-first walkthrough the DEFAULT for a plain "explain this PR" request, where the unaided
default is a wall of text. GREEN re-runs the same open-ended scenarios with the skill loaded.
