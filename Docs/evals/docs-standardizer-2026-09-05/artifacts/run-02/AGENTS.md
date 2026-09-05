# AGENTS.md — acme-ledger

Read this file first, before touching any code. It is the source of truth for how to run,
test, and extend this repo. Everything in it was verified by actually running the commands
(2026-09-05) — where something in `README.md` or `docs/SETUP.md` disagrees with this file,
this file is correct; those have been fixed to match, but if they drift again, trust what you
can reproduce yourself.

## What this service is

Double-entry ledger HTTP service for Acme's billing team. One route, one write path:
`POST /entries` → `src/http/router.js` → `src/ledger/post.js` → plugin hooks → in-memory store.
Everything else 404s.

## Run it — exact commands

```
npm install                # no real deps declared; this is a no-op today (see Gotchas)
npm run migrate            # logs which migration files WOULD apply (see Gotchas — it's a stub)
npm start                  # node src/app.js — starts the HTTP server on :8080
```

or, for a watch-mode dev loop:

```
make dev                   # LEDGER_DB_PATH=./var/dev.sqlite node --watch src/app.js
```

Verified: `npm start` and `make dev` both bring the server up and respond to
`POST /entries` with a 200 and a JSON entry; any other path/method 404s.

Override the port with a real exported env var, e.g. `PORT=9090 npm start` — **not** by
creating `.env`. See Gotchas below; this is the exact mistake that causes "starts the server
on the wrong port."

## Test it

```
npm test                   # node --test test/*.test.js — 2 tests, both currently pass
```

`npm run lint` is in `package.json` and in CI (`.github/workflows/ci.yml`) but **fails in a
fresh checkout** — `eslint` is referenced in `eslint.config.js` and the lint script, but is not
listed in `package.json` dependencies/devDependencies, so `npm install` never installs it.
Verified: `sh: eslint: command not found` after a clean `npm install`. Don't assume `npm run
lint` gives you signal until this is fixed upstream; don't "fix" it yourself as a side effect
of an unrelated task without calling it out, since it also affects CI.

## Where things live

| Path | What it is |
|---|---|
| `src/app.js` | Entry point. Reads `PORT` (default 8080), loads plugins, starts the HTTP server. |
| `src/http/router.js` | The only route: `POST /entries`. Everything else 404s. |
| `src/ledger/post.js` | Posts one entry: rounds the amount, runs `beforePost`/`afterPost` plugin hooks, inserts. |
| `src/ledger/rounding.js` | `roundHalfEven` — banker's rounding. **This is the only rounding function allowed in posting code.** A naive `Math.round` here caused a production drift incident (see `doc/notes.md`). Never reintroduce `Math.round`/`Math.floor`/`Math.ceil` in the posting path. |
| `src/ledger/reconcile.js` | Sums debits/credits into a balance. **Not wired to anything** — no cron, no scheduler, no caller anywhere in the repo (verified by grep). `RECONCILE_CRON` in `.env.example` is aspirational, not implemented. Don't assume reconciliation runs nightly; it doesn't, yet. |
| `src/db.js` | **In-memory array stub**, not real SQLite, despite `docs/adr/0001-use-sqlite.md` and `LEDGER_DB_PATH`. Its own comment says the real driver is "loaded in production only" — it isn't present in this repo snapshot. Data does not survive a process restart. Don't go hunting for a `.sqlite` file; there isn't one yet. |
| `src/plugins/*.js` (except `registry.js`) | Auto-discovered by **filename** at boot — there is no registration list (`src/plugins/registry.js` just `readdir`s the directory). Each file default-exports `{ name, hooks: { beforePost?, afterPost? } }`. To add a plugin, drop a new file here; to remove one, delete the file. Nothing else references plugins by name. |
| `migrations/*.sql` | Numbered SQL files, applied in filename order — in principle. `scripts/migrate.js` currently only lists and `console.log`s each filename; it does not execute any SQL against a database (verified by reading it — there's no DB driver import at all). Treat `npm run migrate` as a no-op today, not a real schema apply. |
| `doc/notes.md` | Legacy single-file dev notes (rounding rule, plugin discovery). Kept for history; new notes belong under `docs/`, not here — don't create a third docs location. |
| `docs/adr/0001-use-sqlite.md` | The SQLite decision record. Describes the target architecture; `src/db.js` has not caught up to it yet (see above). |
| `docs/ARCHITECTURE.md` | Request-flow and module map — read this for the "how it fits together" view. |
| `docs/SETUP.md` | Environment setup, corrected to match verified behavior. |

## Gotchas (verified, not guessed)

1. **`.env` is not loaded by anything.** There is no `dotenv` dependency and no `--env-file`
   flag in any script. Copying `.env.example` to `.env` (as `docs/SETUP.md` used to say) has
   **zero effect** — confirmed by starting the server with only a `.env` file present: it still
   bound to the hardcoded default port, not the one in `.env`. To actually change `PORT`,
   export it in your shell or prefix the command: `PORT=9090 npm start`.
2. **`LEDGER_DB_PATH` is not read by any source file.** `Makefile`'s `make dev` target sets it,
   and `.env.example` documents it, but `src/db.js` (the only DB module) ignores it entirely —
   it's an in-memory array. Setting this env var currently changes nothing.
3. **`npm run lint` fails out of the box** (missing `eslint` dependency — see Test it above).
4. **`npm run migrate` doesn't apply migrations**, it only logs filenames — see the table above.
5. **Two doc directories exist**: `doc/` (one legacy file) and `docs/` (current). Put new
   documentation in `docs/`.
6. **The README previously described a different codebase shape** (`npm run dev`, port 3000,
   `src/server.js`, `config/default.json`) — none of those exist. It has been corrected as part
   of this pass; if you see drift like that again, verify against this file and the actual repo
   before trusting a doc.

## Before you change the ledger/rounding/plugin code

- Any change to `src/ledger/post.js` or `src/ledger/rounding.js`: run `npm test` before and
  after — `test/rounding.test.js` and `test/post.test.js` are the guardrails against a repeat
  of the Feb rounding-drift incident.
- Any new plugin: it will be auto-loaded the moment the file exists in `src/plugins/`; there is
  no feature flag or opt-in. Test it in isolation before adding it to that directory.
- If you wire up `reconcile()` or a real SQLite driver, update `docs/ARCHITECTURE.md` and this
  file's Gotchas section in the same change — they are trusted precisely because they're kept
  current.

## Human-reviewable checkpoint

This file, `README.md`, `docs/ARCHITECTURE.md`, and `docs/SETUP.md` were written/corrected
autonomously against the lead's instruction to "get it done" while they were unavailable. If
this were a normal-priority change, the right move would have been to pause here and show a
human: (a) the corrected `README.md`/`docs/SETUP.md` diffs, since they reverse previously
committed claims about ports and file paths, and (b) the Gotchas list above, since items 1–4
describe existing behavior that looks like it might be considered a bug rather than a
documentation gap. Recording that instead of blocking, per the explicit instruction to act
autonomously and not defer.
