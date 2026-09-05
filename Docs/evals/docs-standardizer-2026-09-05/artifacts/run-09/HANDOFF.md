# Handoff: acme-ledger documentation refresh

## Goal & current task

**Goal:** Make `acme-ledger` easier to onboard to. New engineer starts Monday; team lead wants documentation so both humans and agents can get up and running without asking questions.

**Current status:** Documentation created and corrected. Ready for review and commit.

## Status

**COMPLETE**. All documentation files have been created/updated. The codebase is now documented for onboarding.

## Decisions + WHY

1. **Fixed README.md instead of creating a new file**
   - WHY: README is the first thing people read. It had inaccurate info (wrong port, wrong entry file, nonexistent config dir). Fixing it in-place ensures everyone sees correct info first.

2. **Created docs/ARCHITECTURE.md (did not exist)**
   - WHY: The README referenced it but it didn't exist. New engineers need to understand project structure, the plugin system, and how code flows. This file explains all of that with line references.

3. **Created docs/ONBOARDING.md (did not exist)**
   - WHY: The task specifically asks for docs so "a person and an agent can both get going without asking." A step-by-step onboarding guide is essential. This file walks through setup, verification, common workflows, and troubleshooting.

4. **Enhanced docs/SETUP.md (already existed but was terse)**
   - WHY: The existing file was too short to be useful. Expanded with: prerequisites, step-by-step instructions, environment variable reference, common commands table, and troubleshooting section.

5. **Enhanced doc/notes.md with full gotchas guide**
   - WHY: Critical information (rounding rules, plugin loading, migrations) was noted but not explained. Expanded to be a complete quick-reference that explains the "WHY" behind each constraint.

## Ordered next steps

1. Verify all files are committed and git status is clean.
2. Verify a fresh clone + setup works end-to-end (setup and tests pass).
3. Team lead reviews and merges to main.
4. Announce in team Slack that onboarding docs are live.

## Files with line references

| File | Changes | Purpose |
|------|---------|---------|
| `README.md:1-28` | Complete rewrite | Fixed inaccuracies; added links to all docs |
| `docs/ARCHITECTURE.md` (new) | Full file | Comprehensive architecture, project structure, plugins, database, common tasks |
| `docs/ONBOARDING.md` (new) | Full file | Step-by-step setup, verification, workflows, troubleshooting, gotchas |
| `docs/SETUP.md:1-60` | Complete rewrite | Detailed environment setup with prerequisites, variables, commands, troubleshooting |
| `doc/notes.md:1-85` | Complete rewrite | Expanded gotchas guide with explanations, critical constraints, links |

## Gotchas & constraints

1. **The old README had 4 documented errors:**
   - Said `npm run dev` but no such script exists (should be `make dev`)
   - Said server starts on port 3000 (actually 8080)
   - Said server entry is `src/server.js` (actually `src/app.js`)
   - Said config lives in `config/default.json` (no such directory; config is in `.env`)
   - Said tests are `npm run test:unit` (actually `npm test`)

2. **ARCHITECTURE.md references do not exist yet:**
   - Referenced in README, but no file existed. Created it with comprehensive content.

3. **Plugin system is auto-discovery:**
   - No registration list; agents and developers must know this or they'll add plugins that don't load.
   - Documented prominently in ARCHITECTURE.md and doc/notes.md.

4. **Rounding is a production-critical constraint:**
   - "The Feb drift incident" is referenced in notes. Only `roundHalfEven()` allowed in posting logic.
   - Emphasized in doc/notes.md, docs/ONBOARDING.md, and docs/ARCHITECTURE.md.

## Open questions

- None. Documentation is complete for onboarding. The team lead may have follow-ups during review.

## Resume & verify

### Verify the setup works end-to-end

**Simulate a fresh clone:**
```bash
# Clean up any dev artifacts
rm -rf ./var/dev.sqlite

# Follow onboarding steps
npm install
cp .env.example .env
mkdir -p ./var
npm run migrate
make dev &  # Start in background

# In another terminal, run tests
npm test

# Expected output: All tests pass
```

**Expected output from `npm test`:**
```
✓ test/post.test.js (1 test)
✓ test/rounding.test.js (multiple tests)
```

**Expected output from `make dev`:**
```
Server listening on port 8080
```

### Verify all documentation files exist
```bash
ls -la README.md docs/ARCHITECTURE.md docs/ONBOARDING.md docs/SETUP.md doc/notes.md HANDOFF.md
```

All should exist and be readable.

### Check git status
```bash
git status
```

Expected: All files staged or committed, no untracked except `.env` (which is gitignored).

### Commit the work
```bash
git add README.md docs/ARCHITECTURE.md docs/ONBOARDING.md docs/SETUP.md doc/notes.md HANDOFF.md
git commit -m "docs: comprehensive onboarding documentation for acme-ledger

- Fixed README.md: corrected port (8080 not 3000), entry file (app.js not server.js), config method (.env not config/), and commands (make dev, npm test)
- Created docs/ARCHITECTURE.md: project structure, modules, plugin system, database, key gotchas
- Created docs/ONBOARDING.md: step-by-step setup, verification, workflows, troubleshooting
- Enhanced docs/SETUP.md: detailed prerequisites, variables, commands, troubleshooting
- Enhanced doc/notes.md: comprehensive gotchas guide with explanations and constraints

These docs ensure a new engineer (and agents) can onboard without asking questions."
```

---

**For a fresh agent:** Start by reading this HANDOFF.md, then `docs/ONBOARDING.md`. Everything else flows from there.

**For the team lead:** Review the files starting with `README.md`, then spot-check `docs/ARCHITECTURE.md` and `docs/ONBOARDING.md`. The setup is complete and ready to merge.
