# RED baseline — docs-standardizer (no skill)

Date: 2026-09-05. Fresh `general-purpose` subagents, **model: sonnet** (pinned), scenario text
verbatim (evaluator blocks stripped), skill absent. Each ran in its own workspace from
`fixtures/setup-workspaces.sh` (`/tmp/acme-ledger-s{1,2,3}` + `/tmp/acme-home-s{1,2,3}/.claude`).
Scenario 1 was dispatched with only the standing routing rule (negative/trigger scenario).
Outputs were scored afterwards with the bundled verifier (`scripts/docs-verify.mjs`), written
after these runs from the failures they showed.

## Headline

Sonnet is a careful documentation writer. **All three runs caught the README's stale claims**
(`npm run dev`, `src/server.js`, port 3000, `config/`, `npm run test:unit`,
`docs/ARCHITECTURE.md`) by reading `package.json`/`Makefile` and running the commands; none
propagated them as truth. The "copies stale commands" hypothesis is NOT confirmed on this tier
and gets no skill content. The confirmed gap is the one the user named: **nothing standardizes
the result.** Three runs produced three different documentation shapes, none consulted or
recorded a user-scope standard, none worked on a branch, none verified its own output
mechanically, and the required-doc set was never produced.

## Per scenario

### Scenario 1 — negative / unnamed ("make this codebase easier to onboard to")

- **Trigger:** listed all 49 skills, read `agent-playbook` because its description "literally
  names writing CLAUDE.md/AGENTS.md", used its advisor tier for the 20–150-line guidance. No
  documentation-standardizing skill existed to fire; the closest description (agent-playbook)
  fired instead — a routing collision to check in GREEN.
- **Shape:** `AGENTS.md` (84 lines, good), `CLAUDE.md` = 7-line `@AGENTS.md` pointer,
  `docs/ARCHITECTURE.md` (new, thorough), `docs/mistakes-and-fixes.md` (used as an audit log of
  README defects, not lessons), edits to `README.md`, `docs/SETUP.md`, `.env.example`.
- **User scope:** explicitly declined — *"I also did not modify /tmp/acme-home-s1/.claude/
  CLAUDE.md … project-specific onboarding material belongs in the repo itself, not duplicated
  at user scope."* No standard recorded anywhere.
- **Docs root:** kept lowercase `docs/` — *"I deliberately did not create a separate
  capitalized Docs/ folder since the repo already has an established lowercase docs/
  convention"* — reasonable, but unrecorded, so the next repo decides differently.
- **Process:** one commit on `main`; no branch; no mechanical check. Verifier after the run:
  26 findings (6 required docs missing, `DOCS_ROOT_CASE`, `ENTRY_SPLIT` — CLAUDE.md and
  AGENTS.md differ with the pointer written as `@AGENTS.md`, which the verifier does not read
  as a link, 6 entry-doc sections missing, and 2 wrapped-line negations flagged as claims).

### Scenario 2 — standard exists; lead says "just fix the README, fast"

- **Choice: C** (scope collapse). Fixed README + 62-line CLAUDE.md + a root-level
  `DOCS-TODO.md` listing the standard's gaps. Verbatim: *"Overriding a specific, reasoned,
  in-scope instruction from the deliverable owner because a separate standing preference
  exists is overreach, not diligence — the standard doesn't get to unilaterally expand a
  stakeholder's explicit scope call."* It read `docs-standard.json`, enumerated every gap
  against it, and then deferred all of it.
- **Process:** one commit on `main`, no branch, no verifier. CLAUDE.md pointed at `docs/`
  and described a `Docs/` duplicate that did not exist (the fixture's original `Docs/` collided
  with `docs/` on this case-insensitive filesystem — fixed in the fixture, see below).
- Verifier: 22 findings (6 required missing, `DOCS_ROOT_CASE`, stray `DOCS-TODO.md` claims).

### Scenario 3 — "the README is accurate, just convert it"

- **Claims:** verified every command against `package.json`/`Makefile` and ran them; produced a
  table of the README's five wrong claims with evidence; fixed README in place. Best of the
  three on truth.
- **Shape:** 87-line CLAUDE.md (own headings: What this is / Running it / Testing / Linting /
  Layout / Gotchas), `docs/mistakes-and-fixes.md` (40 lines, logging the README discrepancy).
- **User scope:** read the global CLAUDE.md ("Docs folder" instruction) and put the file under
  lowercase `docs/` because *"this repo's filesystem is case-insensitive, so Docs/ and docs/
  are the same directory"*. Nothing recorded at user scope.
- **Process:** one commit on `main`; no branch; no verifier. 21 findings after (6 required
  missing, 5 entry sections missing under the standard's names, `docs/ARCHITECTURE.md` still
  referenced from README line 25 and CLAUDE.md line 77 as "does not exist" on a wrapped line).

## Failure summary — the differentiators the skill must provide

| Gap | s1 | s2 | s3 |
|---|---|---|---|
| Read/created the user-scope standard before writing | no (declined) | read, deferred | no |
| Same shape as the other runs | no | no | no |
| Branch, one commit per category | main, 1 commit | main, 1 commit | main, 1 commit |
| Verified its own output mechanically | no | no | no |
| Required doc set (index, architecture, conventions, decisions, lessons scaffold, open questions) | 1/6 | 0/6 | 0/6 (+lessons) |
| Docs root decision recorded | no | no | no |
| Full scope under "just the README" pressure | n/a | collapsed (C) | n/a |
| Stale claims caught | yes | yes | yes |
| Invented conventions | none seen | none seen | none seen |

## Fixture caveats (fixed before GREEN)

1. **Case-insensitive filesystem.** The seeded `Docs/` + `docs/` clash merged into one
   directory on macOS; s2 and s3 both noticed. The stray root is now `doc/` (distinct name),
   the lowercase `docs/` vs standard `Docs` case-only mismatch is a separate finding
   (`DOCS_ROOT_CASE`), and the verifier resolves paths case-exactly so a macOS run reports what
   a Linux checkout would see. Scenario 2's wording updated (`docs/` and `doc/`).
2. `.env` was not gitignored, so `.env` mentions read as missing-path claims; added to the
   fixture's `.gitignore` and to the default standard's `exclude`.
3. Wrapped-line negations ("previously described a nonexistent `src/server.js`, … and an
   `npm run dev` script" across two lines) are flagged by the line-level absence heuristic; the
   skill's contract is the explicit `(does not exist)` marker for those.

## Scope note (per creating-a-skill)

As with code-optimizer: the capable tier already does the right *content* work, so GREEN and
the A/B eval must measure the skill's mechanisms — standard read/bootstrapped at user scope,
branch + per-category commits, verifier green, required set complete, root decision recorded,
scope held under pressure — not "did it catch the stale README". The canary is seeded on the
mechanisms every baseline missed, not on stale-claim propagation, which sonnet does not exhibit.
