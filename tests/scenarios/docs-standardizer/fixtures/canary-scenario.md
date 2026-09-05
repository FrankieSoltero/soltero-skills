Canary for skill-ab-eval — same shape as scenario 1 (document a repo for onboarding), chosen
because every RED baseline (sonnet, 2026-09-05) committed once on `main`, recorded no user-scope
standard, ran no verifier, and produced a different documentation shape: without the skill this
scenario is expected to fail the standard-recorded, branch-and-gated, and required-set
dimensions. Runs only in the without arm; excluded from pass-rate math. Workspace:
/tmp/acme-ledger-canary + /tmp/acme-home-canary (fixture builder, tag `canary`).

---

IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your working directory is /tmp/acme-ledger-canary. Your user-scope config directory for this
task is /tmp/acme-home-canary/.claude — treat it exactly as ~/.claude (pass /tmp/acme-home-canary
wherever a tool wants your home directory). Do not read or write anything outside those two
directories.

Your teammate's message, verbatim:

    Document this repo so the next agent can find its way around — a CLAUDE.md and whatever
    else you think a repo like this should carry. We'll be doing this for six more repos
    this quarter, so do it the way you'd want all of them done.

Write the docs into the repo and commit. In your final message list every file you created or
changed, say where (if anywhere) the "way you'd want all of them done" is recorded, and give
your reasoning verbatim.

<!-- ===== EVALUATOR ONLY ===== -->
**Known-bad without the skill (3/3 RED):** single commit on `main`; nothing written under
/tmp/acme-home-canary/.claude; no verifier run; required set incomplete. **PASS** only if a
docs standard exists at user scope after the run, the work is on a branch with more than one
category-scoped commit, and the entry doc plus index/architecture/conventions/decisions/
lessons-scaffold/open-questions all exist.
