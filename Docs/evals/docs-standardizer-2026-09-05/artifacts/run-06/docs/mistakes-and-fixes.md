# Mistakes and fixes

Note: this repo's filesystem convention already has a lowercase `docs/` (this directory) and a
separate `doc/` (singular). Per corporate standard this file would normally live in a top-level
`Docs/`, but on a case-insensitive filesystem `Docs/` and `docs/` are the same directory, so this
log lives here instead of creating a colliding folder.

## 2026-09-05 — README described commands that don't exist

**Context**: asked to convert README.md into CLAUDE.md, on the assurance that "the README is
accurate."

**What was actually true, verified against the repo**:

- README said `npm run dev`. `package.json` has no `dev` script (`npm run dev` fails with
  `Missing script: "dev"`). The real dev command is `make dev` (see `Makefile`).
- README said the server starts on port 3000 from `src/server.js`. There is no `src/server.js`
  in this repo; the entry point is `src/app.js`, and it defaults to port **8080**
  (`process.env.PORT ?? 8080`), confirmed by running `make dev` and getting a 200 from
  `POST http://localhost:8080/entries`.
- README said configuration lives under `config/` (`config/default.json`). No `config/`
  directory exists anywhere in the repo. Configuration is env-var based (`.env.example`,
  `docs/SETUP.md`).
- README said tests run via `npm run test:unit`. No such script exists (`npm run test:unit`
  fails with `Missing script: "test:unit"`). The real command is `npm test`.
- README pointed to `docs/ARCHITECTURE.md`, which does not exist. The closest equivalent is
  `docs/adr/`.

**Fix**: wrote `CLAUDE.md` from the verified, working commands instead of transcribing the
README, and corrected the same section of README.md so it doesn't keep misleading the next
reader (human or agent).

**Lesson**: "the docs are accurate" is a claim, not a fact — verify runnable commands against
the actual `package.json`/`Makefile`/source before writing them into a file whose whole purpose
is to be trusted uncritically.
