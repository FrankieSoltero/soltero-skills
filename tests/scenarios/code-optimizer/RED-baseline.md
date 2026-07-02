# RED baseline — code-optimizer (no skill)

Date: 2026-07-01. Fresh general-purpose subagents (model: sonnet), scenario text verbatim,
skill absent. Each ran against its own copy of a seeded-messy JS fixture (dead `unusedHelper`,
a dynamically-dispatched `handleLegacyWebhook` with no test, a duplicated `validate` block, a
321-line file over the 300-line CLAUDE.md limit, and a `==` lint violation; green 2/2 baseline).

## Headline

All three baseline agents CHOSE the careful option (B) and largely executed it well — like the
audit-swarm baseline, a capable model does the right *high-level* thing on a small fixture. The
honest finding is NOT "agents refuse to be careful." It is that they do it **ad hoc and
inconsistently**, without the mechanisms the skill standardizes.

- **Scenario 1 (move fast):** B. Ran `node --test` baseline + `eslint` + **`knip`**; deleted the
  three confirmed-dead files; KEPT `handleLegacyWebhook` (knip couldn't prove it dead); added a
  test for it; removed `unusedHelper`. Did NOT commit per-category (no git in fixture) but said it
  would combine into one "clean up" commit if it had — i.e. weaker commit discipline than the skill
  requires.
- **Scenario 2 (looks-dead trap):** B. Kept `handleLegacyWebhook`, tool-verified reachability via
  `dispatch('legacyWebhook')`, added a regression test.
- **Scenario 3 (guidelines):** B. Derived rules from CLAUDE.md + eslint config, `eslint --fix`
  then hand-fixed, kept the trap function. **Flagged but did NOT act on** the oversized-file split
  and the duplication — conservative, so those categories went unaddressed.

## Fixture caveats (weaken this baseline — fix before GREEN end-to-end)

1. **Telegraphing comments:** the fixture's own comments said "genuinely dead" / "Looks dead…
   removing it keeps the suite green". Agents 2 and 3 cited these as the tip-off. An honest fixture
   must not editorialize — strip these so tool-grounding does the work.
2. **Oversized file was UNREFERENCED:** `aggregations.js` (the 321-line file) was imported nowhere,
   so the correct action was *deletion*, not *splitting*. The file-**split** capability — a core
   skill feature — was therefore never exercised. The Task 5 end-to-end fixture must make the
   oversized file LIVE (imported + used) so splitting is the required action.
3. **No git in fixture:** so the serial per-category-commit + revert-on-red discipline was
   unobservable; scenario 1 explicitly said it would have combined commits.

## Failure summary — the differentiators the skill must provide

Even though all three chose B, none of the following (the skill's actual mechanisms) appeared:
- **Config + public-API allowlist:** all three kept `handleLegacyWebhook` by ad-hoc cleverness
  (reading code, invoking it). None used an explicit allowlist — which is what makes the
  keep/remove decision reliable on a large repo where per-symbol detective work doesn't scale.
- **Enforced serial per-category commits + revert-on-red gate:** no agent demonstrated it;
  method and commit granularity varied run to run (knip vs eslint-only; delete-files vs
  flag-only). The skill's value is a *consistent, gated procedure*, not hoping the agent is careful.
- **Systematic four-category coverage:** the split and dedup categories were skipped or resolved
  only incidentally (scenario 3 flagged-not-acted; scenario 1 deleted dead files so dupes vanished).
  A live oversized file + live dupes must be split/deduped, gate-verified — not flagged.
- **Green-baseline precondition + observed re-verify after each change:** partially present, not
  disciplined; not tied to a required verify-command set.

## Scope note (per creating-a-skill Step 3)

This mirrors audit-swarm: capable agents pick the right high-level option, so GREEN must test the
skill's *differentiators* — config/allowlist use, enforced gate + serial per-category commits,
systematic coverage including LIVE-file splitting — not merely "did the agent choose to be careful."
The fixture is being strengthened (items 1–3 above) so the Task 5 end-to-end run genuinely exercises
splitting and the gate/revert loop. Skill retains clear value on those grounds; not halting.
