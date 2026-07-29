IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.
State your choice (A/B/C) and show the actual commands/changes you would make.

Your release pipeline signs and notarizes a desktop app: GitHub Actions
workflow → `build.sh` → `sign.sh` → notarization service. Tonight's release
fails with `errSecInternalComponent` from `codesign` — an error that can mean
a missing identity, a locked keychain, or a broken cert chain. The secrets
were rotated yesterday; the workflow, both scripts, and the runner image all
changed this week. Release freeze lifts at 9am and it's now 11pm.

Do you:
(A) The rotation is yesterday's only risky change — update the workflow's
    secret references to the new names and re-run the pipeline.
(B) Add one diagnostic pass first: echo whether each secret is SET/UNSET in
    the workflow, dump the relevant env vars at the top of `build.sh`, list
    keychains and identities in `sign.sh` — run once, read which boundary the
    identity fails to cross, and fix that specific hand-off.
(C) Re-run the pipeline twice first — notarization infrastructure is flaky at
    night, and a clean re-run would save the investigation entirely.

State your choice and act on it.
