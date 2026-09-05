# Architecture

`README.md` promised this file; it did not exist until this pass. Everything below was
verified by reading the source and exercising it (`npm start`, `npm test`, `curl`), not
inferred from naming.

## Request flow

```
HTTP request
  │
  ▼
src/app.js            reads PORT (default 8080), calls loadPlugins(), starts http.createServer
  │
  ▼
src/http/router.js    only route: POST /entries (everything else → 404)
  │
  ▼
src/ledger/post.js    post(input, plugins):
  │                     1. round input.amount*100 with roundHalfEven → cents
  │                     2. run each plugin's hooks.beforePost, in plugin-load order
  │                     3. insertEntry(entry)
  │                     4. run each plugin's hooks.afterPost, in plugin-load order
  ▼
src/db.js              in-memory array (NOT SQLite in this snapshot — see Known gaps)
```

Verified example (`curl -X POST :8080/entries -d '{"amount":1.005,"side":"debit","currency":"USD"}'`):

```
{"amount":1.005,"side":"debit","currency":"USD","cents":100,"audited":true}
```

`cents:100` shows `roundHalfEven` applied to `100.5`; `audited:true` shows the `audit-log`
plugin's `afterPost` hook ran.

## Plugin system

`src/plugins/registry.js` discovers plugins by **filename**, not registration:

```js
const files = (await readdir(here)).filter((f) => f.endsWith('.js') && f !== 'registry.js');
```

Every other `.js` file in `src/plugins/` is imported and its `default` export is used as a
plugin: `{ name, hooks: { beforePost?, afterPost? } }`. Today there are two:

- `fx-normalize.js` — `beforePost`: forces `currency` to `USD` if it isn't already.
- `audit-log.js` — `afterPost`: stamps `audited: true`.

Order is `readdir` order (filesystem-dependent, effectively alphabetical on most systems —
`audit-log.js` before `fx-normalize.js`). There is no explicit ordering mechanism; if hook
order ever matters beyond what alphabetical-by-filename gives you, that's a gap to close
before relying on it.

## Rounding contract

`src/ledger/rounding.js` implements banker's rounding (round-half-to-even). Its own comment
and `doc/notes.md` both say this is the **only** rounding function allowed in the posting
path — a plain `Math.round` here previously caused a production balance-drift incident.
`test/rounding.test.js` pins the behavior (`2.5→2`, `3.5→4`, `2.4→2`); keep it green.

## Known gaps between the docs and the code

These are real, verified gaps — not style nits — because an agent or engineer will otherwise
build on assumptions the code doesn't back up yet:

- **Storage**: `docs/adr/0001-use-sqlite.md` records the decision to use SQLite via
  `src/db.js`, with migrations under `migrations/` applied by `scripts/migrate.js`. In this
  snapshot, `src/db.js` is an in-memory array (its own comment: "the real driver is loaded in
  production only") and `scripts/migrate.js` only lists filenames, it doesn't execute SQL.
  Nothing is persisted across a process restart yet.
- **Reconciliation**: `src/ledger/reconcile.js` computes a debit/credit balance but is never
  called from anywhere in the repo — no cron, no scheduler, no test. `RECONCILE_CRON` in
  `.env.example` documents an intent, not a running job.
- **Config loading**: there is no `dotenv` or `--env-file` wiring, so `.env` files have no
  effect. Real env vars (exported, or prefixed on the command line) are the only thing that
  works — see `AGENTS.md` Gotchas for a verified repro.
- **Lint**: `eslint` is invoked by `npm run lint` and by CI, but isn't a declared dependency,
  so it's missing after a normal `npm install`.

None of these are fixed as part of this documentation pass — they're recorded here so the
next person (or agent) doesn't waste a session rediscovering them, and so a decision to fix
one of them is made deliberately rather than by accident.

## Where to add things

- New route → `src/http/router.js`.
- New posting behavior that must run on every entry → a new file in `src/plugins/` (see
  Plugin system above); it will be picked up automatically, no registration step.
- New ledger math → `src/ledger/`, and add a `node --test` file under `test/` in the same
  change; `post.js` and `rounding.js` are both covered today and any sibling module should be
  too.
- New schema → a new numbered file under `migrations/` (once `scripts/migrate.js` actually
  executes SQL — today it's a no-op, see Known gaps).
