# Onboarding Guide

New to `acme-ledger`? Start here. This guide walks you through setup and your first contribution.

## Prerequisites

- Node.js 18+ (check with `node --version`)
- npm (included with Node)
- A terminal and text editor

## Setup (5 minutes)

### 1. Clone and install
```bash
cd acme-ledger
npm install
```

### 2. Create your environment file
```bash
cp .env.example .env
```

This sets `PORT=8080`, `LEDGER_DB_PATH=./var/dev.sqlite`, and the reconcile schedule. Leave defaults as-is for development.

### 3. Apply database migrations
```bash
npm run migrate
```

This creates the SQLite schema. **Do this before starting the server for the first time.**

### 4. Start the dev server
```bash
make dev
```

You should see:
```
Server listening on port 8080
```

The server watches for file changes and auto-restarts. (Stop with Ctrl+C.)

## Verify everything works

In another terminal:
```bash
npm test
```

All tests should pass. ✓

## Project layout

```
acme-ledger/
├── src/
│   ├── app.js                 ← Entry point; starts HTTP server
│   ├── db.js                  ← Database interface
│   ├── http/
│   │   └── router.js          ← HTTP endpoints
│   ├── ledger/
│   │   ├── post.js            ← Posts entries (core business logic)
│   │   ├── rounding.js        ← Banker's rounding (CRITICAL; don't bypass)
│   │   └── reconcile.js       ← Nightly balance check
│   └── plugins/
│       ├── registry.js        ← Plugin loader
│       ├── audit-log.js       ← Example plugin
│       └── fx-normalize.js    ← Example plugin
├── test/
│   ├── post.test.js           ← Test posting logic
│   └── rounding.test.js       ← Test rounding
├── migrations/
│   └── 0001_entries.sql       ← Database schema
├── scripts/
│   └── migrate.js             ← Runs migrations
├── docs/
│   ├── ONBOARDING.md          ← This file
│   ├── ARCHITECTURE.md        ← Full design overview
│   ├── SETUP.md               ← Environment setup details
│   └── adr/                   ← Architecture decision records
├── doc/
│   └── notes.md               ← Critical gotchas and quick reference
├── Makefile                   ← Common commands
├── README.md                  ← Project overview
├── package.json               ← Dependencies and scripts
├── .env.example               ← Template environment vars
└── .env                       ← Your local environment (git-ignored)
```

## Common workflows

### I want to add a new field to entries

**Example:** Add a `description` field to ledger entries.

1. **Create a migration** (`migrations/0002_add_description.sql`):
   ```sql
   ALTER TABLE entries ADD COLUMN description TEXT;
   ```

2. **Apply it:**
   ```bash
   npm run migrate
   ```

3. **Update `src/ledger/post.js`** to accept and handle `description`.

4. **Write a test** in `test/post.test.js`.

5. **Run tests:**
   ```bash
   npm test
   ```

### I want to add a plugin

**Example:** Add a plugin that logs all entries to a file.

1. **Create `src/plugins/file-logger.js`:**
   ```javascript
   import fs from 'node:fs/promises';
   
   export default {
     name: 'file-logger',
     hooks: {
       afterPost(entry) {
         // Log to file (non-blocking)
         fs.appendFile('ledger.log', JSON.stringify(entry) + '\n').catch(console.error);
         return entry;
       }
     }
   };
   ```

2. **Restart the server** (it auto-loads). Test with an API call.

### I want to fix a bug

1. **Identify the failing test or write one:**
   ```bash
   npm test
   ```

2. **Find the code:**
   - Posting logic? → `src/ledger/post.js`
   - Rounding issue? → `src/ledger/rounding.js` (read `doc/notes.md` first)
   - Plugin issue? → `src/plugins/`

3. **Fix it and re-run tests:**
   ```bash
   npm test
   ```

4. **Verify the dev server:**
   ```bash
   make dev
   ```

## Critical gotchas

### ⚠️ Rounding

**Every amount is stored as integer cents.** When posting, ALWAYS use the `roundHalfEven()` function from `src/ledger/rounding.js`. Using `Math.round()` directly caused the Feb drift incident. See `doc/notes.md` for details.

### ⚠️ Plugin load order

Plugins run in **filename order** (alphabetical). If plugin A's output depends on plugin B's transformation, ensure B's filename comes first. There is no registration list — discovery is automatic.

### ⚠️ Migrations are immutable

Once a migration is applied in production, you **cannot change or delete it.** Create a new migration instead. See `migrations/` for examples.

### ⚠️ Database path

`LEDGER_DB_PATH` in `.env` points to the SQLite file. In dev, it's `./var/dev.sqlite`. Make sure `./var/` exists or the app will fail on first start.

## API quick reference

### POST `/entries`
Post a single entry:
```bash
curl -X POST http://localhost:8080/entries \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "side": "debit", "currency": "USD"}'
```

Returns the posted entry (see `src/http/router.js` for full response).

### GET `/entries`
List all entries:
```bash
curl http://localhost:8080/entries
```

## Getting help

- **Architecture & design:** Read `docs/ARCHITECTURE.md`
- **Quick gotchas:** Read `doc/notes.md`
- **Deep dive into a feature:** Check `docs/adr/` for decisions
- **Code exploration:** Start in `src/app.js` and follow imports

## Troubleshooting

### Server won't start
- Did you run `npm run migrate`? ✓
- Is port 8080 in use? Change `PORT` in `.env`.
- Check `.env` is in the repo root (next to `package.json`).

### Tests fail
- Delete `./var/dev.sqlite` and re-run `npm run migrate`, then `npm test`.
- Check Node version: `node --version` (need 18+)

### Plugin not loading
- Confirm the file is under `src/plugins/` and ends in `.js`.
- Confirm it exports a default object with `{ name, hooks }`.
- Restart the server.

## Next steps

1. ✓ Run `make dev` and keep it running.
2. ✓ Read `docs/ARCHITECTURE.md` to understand the codebase structure.
3. ✓ Make a small change (e.g., add a log statement in `src/ledger/post.js`).
4. ✓ Run `npm test` and verify it passes.
5. ✓ Ready to work on issues! 🚀

---

**Need help?** Check `doc/notes.md` for critical gotchas and the team Slack channel for ad-hoc questions.
