<!-- markdownlint-disable MD013 -->
# Golden principles

Small, versioned, mechanically enforced rules — not a style guide. Every entry carries a
check command that CI runs; an entry nothing runs is the prose that already failed.
Append; never rewrite history. Bump the version and add a line when a detector changes.
Rule files live in `Docs/defect-classes/`; the runner is
`skills/defect-class-sweep/scripts/sweep.mjs`.

## GP-001 (v1, 2026-09-17) — An ESM CLI resolves `argv[1]` before asking "am I the entry point?"

- **Wrong:** ``if (import.meta.url === `file://${process.argv[1]}`) main()`` (or
  `pathToFileURL(process.argv[1]).href === import.meta.url`). Node resolves symlinks for
  `import.meta.url` but not for `process.argv[1]`, so when the script is reached through
  any symlinked path — macOS `/tmp` → `/private/tmp`, a linked skills directory, a bin
  shim — the guard is false, `main()` never runs, and the process prints nothing and
  **exits 0**. For a preflight, a validator or a destructive-operation gate, a silent
  exit 0 reads as PASS.
- **Correct:**

  ```js
  import { realpathSync } from 'node:fs';
  import { fileURLToPath } from 'node:url';
  function isMain() {
    try { return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; }
  }
  if (isMain()) process.exit(main(process.argv.slice(2)));
  ```

  …and a regression test that spawns the script **through a real symlink**
  (`fs.symlinkSync`) and asserts that `main()` ran (non-empty output, the expected exit
  code). A test that only imports the module cannot see this defect.
- **Not covered** (gap inventory, written before the sweep):
  - CommonJS `require.main === module` — unaffected; Node compares resolved modules.
  - Scripts with no guard at all, which always run `main()` on import — a different
    trade-off (import side effects), not a silent no-op.
  - A guard that reaches `argv[1]` through an intermediate variable
    (``const self = process.argv[1]; … `file://${self}` ``) — the line detector does not
    follow data flow. None exists in the repo today; if one appears, extend the detector.
  - Code that must quote the wrong pattern on purpose (a test fixture, a lint message,
    this rule's own tests): mark the line `// esm-entry-guard:allow`.
  - Markdown and other prose — the rule scans `**/*.{mjs,js,cjs,ts,mts}` only; lessons and
    eval transcripts that quote the pattern are history, not code.
- **Check:** `npm run check:entry-guard` →
  `node skills/defect-class-sweep/scripts/sweep.mjs --rule Docs/defect-classes/esm-entry-guard.rule.json --root .`
  (exit 1 when the class is present; a hard gate in `.github/workflows/validate.yml`).
- **Origin:** repeated isolated occurrences — 2026-09-02 (`agent-swarm`'s `swarm-plan.mjs`
  and `dispatch-contract`'s `validate-brief.mjs`), 2026-09-07 (`token-economy`, three
  scripts), 2026-09-17 (`instagram-studio`, two scripts, on branch `feat/instagram-studio`,
  caught only when the lessons file was re-read) — each recorded in
  `docs/mistakes-and-fixes.md` and each fixed by hand. Swept 2026-09-17: 117 files scanned, 5 instances
  (`destructive-op-gate` ×3, `defect-class-sweep/scripts/sweep.mjs`,
  `tools/check-workflow-syntax.mjs`), 5 fixed, 0 deferred. After `instagram-studio` (1.0.27)
  merged: 121 files, 1 allowlisted — a test comment in
  `skills/instagram-studio/scripts/check-output.test.mjs` that quotes the wrong pattern on
  purpose.
- **Known undecidable instances:** none.
