# Mistakes and Fixes

A running log of bugs, root causes, fixes, and lessons.

## 2026-08-21 — all three cloud routines (skill-gardener, memory-gardener, skill-patcher) failed every fire since creation; the routine objects themselves were broken

- **Symptom:** Aug 1 / Aug 8 / Aug 15 fires each ended `error_during_execution turns=0` ~3 s after "Claude Code process started"; a manual `run` on Aug 21 hung at the same point with zero events. No PRs, no reports, for a month.
- **Root cause:** not the repo, model, tools, or MCP connectors — four fresh one-off routines (minimal config; sonnet + Task/Agent; opus-5 + basic tools; opus-5 + the exact gardener tool list) all ran fine, and a fresh copy of the gardener with its verbatim prompt ran the full audit. Only the July-21-created routine objects fail (their runs still say "Cloning repository" where current runs say "Fetching" — the platform changed underneath them and the old records did not survive it).
- **Fix:** recreated the three routines with identical prompts/schedules (`trig_016dfZWZF9QNdoxXp3RGcdhn` gardener `7 13 1 * *`, `trig_01JEndZ4JEe8RusaVWQVw3hg` memory-gardener `11 13 8 * *`, `trig_019MmZYBMebpkyXhRpspRMpE` patcher `13 13 15 * *`); disabled and renamed the stale ones `[STALE … delete]` (delete is UI-only at claude.ai/code/routines). Verified with a one-off copy that completed the real audit.
- **Lesson:** "the routine fired" proves nothing — check `list_runs` → `get_run_log` for `init:` and `turns>0` after every new or migrated routine, and bisect with cheap `run_once_at` copies before touching the repo; when a fresh copy of the identical config works, recreate rather than debug the old object.
- **Regression test:** on Sep 1 the gardener run log shows `init: model=claude-opus-5` and a `chore: skill-garden report 2026-09` PR appears.
- meta: h:0/x:0 | provenance: first-party

## 2026-08-20 — dev-debrief cron fired nightly for 4 weeks but every run failed "Not logged in"; session-miner cron never fired at all

- **Symptom:** `~/.claude/logs/dev-debrief.log` holds 21 lines of `Not logged in · Please run /login` (2026-07-25 → 2026-08-20); zero debriefs after 2026-07-22. `~/.claude/logs/session-miner.log` never created despite Aug 1 / Aug 15 schedule.
- **Root cause:** cron jobs run outside the macOS login session, so headless `claude -p` cannot read the Keychain-stored OAuth credentials. Separately, cron silently drops runs missed while the Mac is asleep (9:23am biweekly slot).
- **Fix:** migrated both jobs to launchd LaunchAgents (`scripts/launchd/*.plist.tmpl`, installer `scripts/install-schedules.sh`); LaunchAgents run inside the GUI session and fire missed calendar runs on wake. Installer removes the old crontab lines (backup kept) and kick-starts one debrief as an auth smoke test.
- **Lesson:** "the cron fired" is not "the job ran" — a headless `claude -p` needs the login session's Keychain; schedule it with launchd (or a `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`), and make the smoke test the real output artifact, not the exit code.
- **Regression test:** after install, `tail ~/.claude/logs/dev-debrief.log` shows no `Not logged in` and `docs/debriefs/` gains a dated report or skip-log line the same day.
- meta: h:0/x:0 | provenance: first-party

## 2026-07-24 — dev-debrief nightly cron produced no debrief, no skip-log, and no log file for 2 nights (7/22, 7/23) despite firing on schedule

- **Symptom:** dev-debrief nightly cron produced no debrief, no skip-log, and no log file for 2 nights (7/22, 7/23) despite firing on schedule
- **Root cause:** crontab redirects >> ~/.claude/logs/dev-debrief.log but ~/.claude/logs/ never existed; /bin/sh fails the redirect before executing, so claude never ran — the only evidence was bounce mail in /var/mail/$USER
- **Fix:** mkdir -p ~/.claude/logs (2026-07-24); same dir also serves the session-miner cron whose first fire is Aug 1
- **Lesson:** A cron entry that redirects output depends on the log directory existing — sh kills the whole command on a failed redirect, so the job looks installed but never runs; when a cron job leaves zero traces, check /var/mail/$USER first, and have installers mkdir -p the log dir in the crontab line itself
- **Regression test:** cron-install docs/snippets should use: mkdir -p ~/.claude/logs && <cmd> >> ~/.claude/logs/x.log 2>&1; verify tonight's 21:40 run writes Docs/debriefs/2026-07-24.md or skip-log
- meta: h:0/x:0 | provenance: first-party

## 2026-09-02 — Re-ran tests/scenarios/agent-swarm/fixtures/setup-workspaces.sh (to add a canary fixture) while three GREEN scenario subagents were still working in /tmp/acme-crm, /tmp/acme-shop, /tmp/acme-billing; the script's rm -rf wiped their workspaces mid-run

- **Symptom:** Re-ran tests/scenarios/agent-swarm/fixtures/setup-workspaces.sh (to add a canary fixture) while three GREEN scenario subagents were still working in /tmp/acme-crm, /tmp/acme-shop, /tmp/acme-billing; the script's rm -rf wiped their workspaces mid-run
- **Root cause:** Scenario fixture builders are destructive by design (rm -rf + rebuild, so every batch starts clean) and they are shared across the RED, GREEN and A/B phases; nothing stopped a rebuild from being triggered while a batch was live
- **Fix:** Waited for the runs to finish, inspected the surviving artifacts, re-dispatched any run whose deliverables were lost; the A/B builder (setup-ab-workspaces.sh) now copies per-arm workspaces so each run has its own directory
- **Lesson:** A fixture builder that rm -rf's a workspace is a destructive op against a possibly-live target: never run it while any subagent batch is in flight, and add new fixtures in a separate script (or behind a flag) rather than appending them to the shared builder and re-running the whole thing
- **Regression test:** Fixture builders refuse to rebuild a workspace that has a <workspace>/swarm/ or other in-progress marker unless --force is passed
- meta: h:0/x:0 | provenance: first-party

## 2026-09-02 — swarm-plan.mjs and dispatch-contract's validate-brief.mjs exit 0 with no output when invoked through /tmp/... on macOS (found by an A/B baseline run that had to re-invoke via /private/tmp/... to get a verdict)

- **Symptom:** swarm-plan.mjs and dispatch-contract's validate-brief.mjs exit 0 with no output when invoked through /tmp/... on macOS (found by an A/B baseline run that had to re-invoke via /private/tmp/... to get a verdict)
- **Root cause:** The CLI main-guard compares fileURLToPath(import.meta.url) (already symlink-resolved to /private/tmp/...) with process.argv[1] (the literal /tmp/... the caller typed); they differ, so main() never runs and the process exits 0 — a silent no-op that looks like PASS to anything checking only the exit code
- **Fix:** Compare realpathSync() of both sides in the main-guard (skills/agent-swarm/scripts/swarm-plan.mjs, skills/dispatch-contract/scripts/validate-brief.mjs) and cover the symlinked-invocation path in each script's test
- **Lesson:** Never gate a CLI's main() on a string equality between import.meta.url and argv[1]; resolve both with realpathSync (or drop the guard for bin-style scripts). A guard that fails closed to 'do nothing, exit 0' is the worst possible failure for a validator — pair every such script with a test that invokes it through a symlinked path
- **Regression test:** swarm-plan.test.mjs / validate-brief.test.mjs: spawn the script via a symlinked directory and assert the verdict line appears and the exit code is non-zero on a failing input
- meta: h:0/x:0 | provenance: first-party

## 2026-09-05 — docs-standardizer RED fixture seeded a docs/ vs Docs/ docs-root clash; on macOS both names resolved to one directory, so two of three baseline agents reported 'identical duplicate content' and the clash under test never existed

- **Symptom:** docs-standardizer RED fixture seeded a docs/ vs Docs/ docs-root clash; on macOS both names resolved to one directory, so two of three baseline agents reported 'identical duplicate content' and the clash under test never existed
- **Root cause:** APFS is case-insensitive by default: mkdir docs then writing Docs/notes.md lands in docs/. The fixture, the inventory script's existsSync path checks, and the Makefile/makefile manifest lookup all assumed a case-sensitive tree
- **Fix:** Stray root renamed to doc/ (distinct name); case-only mismatch with the standard's root made its own verifier finding (DOCS_ROOT_CASE, resolved by a recorded project override, not a rename); path claims resolved case-exactly via readdirSync per segment; manifest lookup matches exact names from readdirSync
- **Lesson:** Any fixture or checker that distinguishes paths by case must resolve each segment against readdirSync, never existsSync — a macOS run must report what a Linux checkout would see, and a case-only clash is not a valid fixture on the author's own machine
- **Regression test:** docs-verify.test.mjs: a doc citing docs/architecture.md and SRC/app.js against Docs/ and src/ yields 2 PATH_MISSING on any filesystem
- meta: h:0/x:0 | provenance: first-party

## 2026-09-07 — token-economy RED baseline "passed" twice because the subagents found the spec, the scenario files (with their evaluator-only pass criteria), and the draft audit script

- **Symptom:** the scenario-2 baseline agent produced a near-perfect setup (marker block, calibrated 1M window, backups, conflict named) with no skill present; the scenario-3 agent ran a `token-audit.mjs` "that appeared in my scratchpad" and reported the exact lever table the skill was meant to teach.
- **Root cause:** `docs/specs/token-economy.md` and `tests/scenarios/token-economy/scenario-*.md` were committed to the working tree before RED, and the draft scripts sat in the session scratchpad — a path every subagent inherits in its system prompt. A named scenario ("use the token-economy skill") sends the agent hunting for that name across the repo and it finds the evaluator block.
- **Fix:** moved the spec, scenarios, and drafts to an unadvertised directory (`/tmp/.te-wip-<random>`) for the duration of RED, rebuilt the fixtures, re-dispatched all three clean; recorded the void in `tests/scenarios/token-economy/RED-baseline.md`. One clean agent still located the directory with `find / -iname` but did not open it.
- **Lesson:** a RED baseline is only as clean as the file system the agent can search. Before dispatching, nothing named after the skill may exist in the repo, the scratchpad, or `/tmp`; keep the spec and scenarios out of the tree until GREEN, and grep each baseline transcript for reads of `scenario-*.md`, `docs/specs/`, and the scratchpad path before accepting it.
- **Regression test:** `grep -o '"file_path":"[^"]*"' <task>.output` and `grep -o '"command":"[^"]\{0,160\}' <task>.output | grep -i 'spec\|scenario\|scratchpad'` are empty for every accepted RED run.
- meta: h:0/x:0 | provenance: first-party


## 2026-09-07 — economy-setup.mjs wrote a one-line garbled "protocol block" into CLAUDE.md and its own check reported OK; the GREEN scenario-2 subagent caught it

- **Symptom:** the first `--apply` on Sam's fixture appended `<!-- token-economy:start -->` and `<!-- token-economy:end -->` (a fragment of prose) instead of the protocol text; `--check` then said `PROTOCOL_BLOCK OK` and all 16 script tests were green.
- **Root cause:** `protocolBlock()` located the markers in `references/protocol.md` with plain `indexOf`, and that file's own explanatory sentence mentions both markers inline *before* the real block. The tests asserted `md.includes(protocolBlock())` — self-consistent with the wrong extraction — and the author's manual check looked at the top of CLAUDE.md, never at the appended tail.
- **Fix:** every marker lookup (`protocolBlock`, `upsertBlock`, `conflicts`, the presence count) is line-anchored: a marker counts only when it is the whole trimmed line (`findMarkerLine`, `countMarkerLines`). Regression tests assert the extracted block starts with the heading and carries ≥6 protocol bullets, and that a CLAUDE.md mentioning the markers inline still gets exactly one real block.
- **Lesson:** a verifier that compares a file to the generator's own output verifies nothing; test the *content* of what was written (heading, bullet count), and when a reference doc talks about its own markers, anchor the parser to whole lines. Reading the tail of the file you just appended to is the two-second check that would have caught it.
- **Regression test:** `node --test skills/token-economy/scripts/economy-setup.test.mjs` → "protocolBlock extracts the real block…" and "…mentions the markers inline in prose…" pass.
- meta: h:0/x:0 | provenance: first-party

## 2026-09-07 — token-economy's three scripts shipped the same `/tmp` vs `/private/tmp` entry-point guard bug fixed on 2026-09-02; two A/B with-arm runs hit the silent no-op

- **Symptom:** `node /tmp/te-eval-skills-with/token-economy/scripts/economy-setup.mjs --home …` printed nothing and exited 0; the sonnet with-arm agents on scenarios 1 and 2 diagnosed it themselves and re-invoked via `realpath`.
- **Root cause:** `import.meta.url === \`file://${process.argv[1]}\`` — `argv[1]` was the `/tmp/...` path, `import.meta.url` the resolved `/private/tmp/...` one. The 2026-09-02 entry below this one documents the identical defect in `swarm-plan.mjs` and `validate-brief.mjs`; the author wrote new scripts from memory instead of copying the guard those files already carry.
- **Fix:** all three scripts use `realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)` inside a try/catch (`isMain()`), verified by running the scripts from a `/tmp` copy. The eval copies under `/tmp/te-eval-skills-with` ran the old guard, so the with arm carried the handicap; recorded in the eval report.
- **Lesson:** a lesson in this file is only useful if `lesson-recall` runs before new scripts are written; for any new `*.mjs` CLI in `skills/*/scripts/`, copy the `isMain()` guard from `swarm-plan.mjs` and test the script through a `/tmp` path before dispatching anything that runs it.
- **Regression test:** `mkdir -p /tmp/g && cp -R skills/token-economy /tmp/g/ && cp -R skills/agent-handoff /tmp/g/ && node /tmp/g/token-economy/scripts/economy-setup.mjs --home /tmp/te-home-s2 | tail -1` prints a status line, not nothing.
- meta: h:0/x:0 | provenance: first-party

## 2026-09-17 — instagram-studio's preflight.mjs and check-output.mjs shipped the `import.meta.url === file://${argv[1]}` entry-point guard — the FOURTH time this exact defect shipped — and copied under /tmp (-> /private/tmp on macOS) both printed nothing and exited 0: a silent PASS for a preflight gate and a deliverable validator

- **Symptom:** instagram-studio's preflight.mjs and check-output.mjs shipped the `import.meta.url === file://${argv[1]}` entry-point guard — the FOURTH time this exact defect shipped — and copied under /tmp (-> /private/tmp on macOS) both printed nothing and exited 0: a silent PASS for a preflight gate and a deliverable validator
- **Root cause:** the guard was flagged as a 'fragile, deferred minor' at task review and only promoted when the controller read this file's own 2026-09-02 and 2026-09-07 entries while preparing this task; lesson-recall did not run before the new *.mjs CLIs were written
- **Fix:** fixed in commits b5a6e00 and 19293d9 with the isMain() realpath pattern already used at skills/token-economy/scripts/economy-setup.mjs:173-176, plus a regression test that spawns each script through a real symlink; a repo grep still finds the old guard live in skills/destructive-op-gate/scripts/compare-counts.mjs, resolve-target.mjs, destructive-shapes.mjs, skills/defect-class-sweep/scripts/sweep.mjs, and tools/check-workflow-syntax.mjs
- **Lesson:** a lesson nobody recalls is not a fix; at 3+ occurrences of one defect class this routes to soltero-skills:defect-class-sweep / soltero-skills:correction-compiler for a deterministic check, and lesson-recall must run BEFORE new *.mjs CLIs are written, not at the lessons task at the end
- **Regression test:** the two new symlink tests for preflight.mjs/check-output.mjs, plus: grep -rn 'import.meta.url === `file://' skills/instagram-studio/scripts/ returns zero hits. Repo-wide the same grep over skills/ tools/ still returns 5 files (the five listed on the Fix line above); they remain open for the defect-class sweep, not fixed by this entry.

## 2026-09-17 — concurrent agents in one lean-sdd worktree: agent A staged two files, agent B's git commit (after git add of only its own paths) swept A's staged files into B's commit, and the controller's own commit then did the same to a later pair

- **Symptom:** concurrent agents in one lean-sdd worktree: agent A staged two files, agent B's git commit (after git add of only its own paths) swept A's staged files into B's commit, and the controller's own commit then did the same to a later pair
- **Root cause:** the shared git INDEX is not per-agent isolation — `git add <exact paths>` only stages those paths, but `git commit` with no pathspec commits everything already staged in the shared index, including another agent's untouched-by-this-commit files
- **Fix:** recovered both times with `git reset --soft HEAD~1` followed by a pathspec commit (`git commit -m ... -- <paths>`); no history was lost
- **Lesson:** in any multi-agent worktree, commit with `git commit -m ... -- <paths>` and verify with `git show --stat HEAD` before moving on; the lean-sdd implementer template's 'stage exact paths only' line needs to say 'commit with a pathspec', not just 'stage exact paths'
- **Regression test:** `git show --stat <sha>` lists only the task's own files for every task commit in a multi-agent run

## 2026-09-17 — the instagram-studio A/B eval's own transcript-builder harness was wrong twice before the skill under test was: it clipped every transcript at 2,500 chars (cutting the agents' own deliverables out from under the judges, three of whom abstained), then left the run id (tier, scenario, arm) in the transcript filename and every scratch path while the report claimed blinding

- **Symptom:** the instagram-studio A/B eval's own transcript-builder harness was wrong twice before the skill under test was: it clipped every transcript at 2,500 chars (cutting the agents' own deliverables out from under the judges, three of whom abstained), then left the run id (tier, scenario, arm) in the transcript filename and every scratch path while the report claimed blinding
- **Root cause:** the clip limit was sized for a chat transcript, not a deliverable-producing agent run; the filename/path leak was never checked against the blinding claim because nobody grepped the final transcripts for the labels the report said were hidden — it was found by the independent task review, not the author
- **Fix:** both passes were archived untouched (not edited in place) and all 72 judges re-run against corrected, unclipped, opaque-id transcripts; documented in Docs/skill-eval-instagram-studio-2026-09-17.md under 'Judge disagreements and abstentions'; judge models were read back from Docs/evals/instagram-studio-2026-09-17/judge-models.json rather than assumed
- **Lesson:** never clip what the agent WROTE when building an eval transcript; blind runs with opaque ids and grep the final transcripts for every label (tier, scenario, arm, model name) before dispatching judges, and read judge models back from the logs rather than trusting the dispatch config
- **Regression test:** `grep -rli 'haiku\|sonnet' Docs/evals/<eval>/transcripts` returns nothing, and judge-models.json shows exactly one model per judge dispatch

## 2026-09-17 — an instagram-studio RED fixture handed a scenario its own answer: tests/scenarios/instagram-studio/fixtures/web-app/README.md said 'there is no app store listing, press kit, or press coverage yet', and the baseline run quoted that exact sentence as its reason for not inventing claims, while scenario-4 asked 'what exists on disk … or what does not' — a question the fixture had already pre-answered

- **Symptom:** an instagram-studio RED fixture handed a scenario its own answer: tests/scenarios/instagram-studio/fixtures/web-app/README.md said 'there is no app store listing, press kit, or press coverage yet', and the baseline run quoted that exact sentence as its reason for not inventing claims, while scenario-4 asked 'what exists on disk … or what does not' — a question the fixture had already pre-answered
- **Root cause:** a fixture that states a negative inventory ('there is no X yet') gives an agent the probe's answer for free instead of requiring it to discover the absence itself; found by the Task 2 review, not by running the scenario
- **Fix:** fixed in commit 4e2ac9b: the fixture now states only what a real artifact would state, and the scenario-4 probe was reworded so it no longer presupposes the tempting answer; baselines were re-run and recorded
- **Lesson:** a fixture states only what a real artifact would state and never a negative inventory of what is absent; a probe question must not presuppose the answer it is meant to be testing for
- **Regression test:** the re-run baselines recorded in tests/scenarios/instagram-studio/RED-baseline.md show the scenario-4 agent inferring absence from the file listing rather than quoting the fixture

## 2026-09-17 — a 'missing ffmpeg' scenario for instagram-studio didn't actually remove ffmpeg: baseline agents ran ffmpeg -version, found the real binary, and ignored the prompt; separately a PATH shim file named ffmpeg made preflight.mjs PASS because it only checks existence, and `PATH="…" cd <dir> && node preflight.mjs` scoped the PATH override to the cd only, so a haiku run passed preflight in the wrong environment and then called /opt/homebrew/bin/ffmpeg by absolute path (transcript Docs/evals/instagram-studio-2026-09-17/transcripts/R09.md)

- **Symptom:** a 'missing ffmpeg' scenario for instagram-studio didn't actually remove ffmpeg: baseline agents ran ffmpeg -version, found the real binary, and ignored the prompt; separately a PATH shim file named ffmpeg made preflight.mjs PASS because it only checks existence, and `PATH="…" cd <dir> && node preflight.mjs` scoped the PATH override to the cd only, so a haiku run passed preflight in the wrong environment and then called /opt/homebrew/bin/ffmpeg by absolute path (transcript Docs/evals/instagram-studio-2026-09-17/transcripts/R09.md)
- **Root cause:** the scenario simulated absence by editing the prompt text instead of the real environment, and separately assumed a file-existence check proves the dependency is usable, and assumed a PATH= prefix scopes to the whole compound shell command rather than just the next one
- **Fix:** commit fada6c9: simulate absence by removing the real directory from PATH and verify the simulated failure before dispatch; the skill now requires every later command to run in the same environment preflight checked
- **Lesson:** a 'missing dependency' written only into a prompt is not missing; a PATH shim cannot fail a file-existence preflight; judge a gate on its actual behaviour under a verified-broken environment, not on the prompt's claim about the environment
- **Regression test:** PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" node skills/instagram-studio/scripts/preflight.mjs --json exits 1 with the ffmpeg check failing

## 2026-09-17 — the instagram-studio plan named cover.jpg as the output for two different canvases (1080x1920 reel and 1080x1350 feed under --format all), so the validator could never pass for both at once — missed by the plan author and by two plan-review rounds, found by the Task 5 review; separately, plan-review round 1 blocked the plan because Tasks 8 and 9 both wrote Docs/evals/instagram-studio-2026-09-17/ with no dependency edge while a note claimed they were disjoint

- **Symptom:** the instagram-studio plan named cover.jpg as the output for two different canvases (1080x1920 reel and 1080x1350 feed under --format all), so the validator could never pass for both at once — missed by the plan author and by two plan-review rounds, found by the Task 5 review; separately, plan-review round 1 blocked the plan because Tasks 8 and 9 both wrote Docs/evals/instagram-studio-2026-09-17/ with no dependency edge while a note claimed they were disjoint
- **Root cause:** a single fixed filename was assumed to be safe because each format was reasoned about in isolation; nobody asked what --format all produces into one directory, and a shared output DIRECTORY was not treated as file overlap the way a shared output FILE would be
- **Fix:** owner amendment split the name into reel-cover.jpg / feed-cover.jpg (commit 39c28e9); the Docs/evals directory collision was resolved before plan-review round 2 passed (Docs/plan-reviews/2026-09-17-instagram-studio-review.md)
- **Lesson:** for every fixed filename in a plan, ask what happens when every format is produced into one directory in the same run; treat a shared output DIRECTORY between two tasks as file overlap requiring a dependency edge, not just a shared output FILE
- **Regression test:** check-output.mjs test 'an all dir with reel + feed passes both cover checks'

## 2026-09-17 — instagram-studio's GREEN run and the A/B eval both stopped at the Plan gate, so nobody noticed the skill gave no actual command for the cover export or the frame-0 bake, that hyperframes snapshot --at writes N+1 frames without --no-end, or that the skill's claim 'the only network call is npx' was false (Google Fonts, a jsdelivr script with no integrity attribute) — 12 such defects surfaced only once the live render was run

- **Symptom:** instagram-studio's GREEN run and the A/B eval both stopped at the Plan gate, so nobody noticed the skill gave no actual command for the cover export or the frame-0 bake, that hyperframes snapshot --at writes N+1 frames without --no-end, or that the skill's claim 'the only network call is npx' was false (Google Fonts, a jsdelivr script with no integrity attribute) — 12 such defects surfaced only once the live render was run
- **Root cause:** every prior verification pass (RED, GREEN, A/B eval) exercised the skill's text and gating logic but never actually drove the external hyperframes/ffmpeg toolchain end to end, so instructions that could not be executed as written went undetected
- **Fix:** the live render (Docs/evals/instagram-studio-2026-09-17/live-render.md) found all 12 defects; fixed in fada6c9 and e8c001e
- **Lesson:** a skill that drives an external CLI is not verified until one run goes end to end with the real tool; schedule the live run BEFORE the efficacy eval, not after, so eval judges are grading a skill that can actually be executed
- **Regression test:** `node skills/instagram-studio/scripts/check-output.mjs <out-dir> --format all` exits 0 on a real render
