# Documentation Index

Welcome to acme-ledger. This guide helps you navigate the documentation and understand the codebase.

## Quick Navigation

### I'm new to this project

1. Start here: [`../CLAUDE.md`](../CLAUDE.md) – Project overview, quick start, critical knowledge.
2. Then read: [`SETUP.md`](SETUP.md) – Environment setup and development workflow.
3. Finally: [`../CONTRIBUTING.md`](../CONTRIBUTING.md) – How to make changes.

### I need to understand the architecture

Read: [`ARCHITECTURE.md`](ARCHITECTURE.md) – Detailed technical design, data flow, plugin system.

### I'm fixing a bug

1. Start with: [`../CLAUDE.md`](../CLAUDE.md) – Find the relevant section (e.g., "The Feb Drift Incident" for rounding bugs).
2. Check: [`../CONTRIBUTING.md`](../CONTRIBUTING.md) – "Bug Fix" workflow.
3. Reference: [`ARCHITECTURE.md`](ARCHITECTURE.md) – Technical details.

### I'm adding a new feature

1. Plan it: [`../CONTRIBUTING.md`](../CONTRIBUTING.md) – Choose your feature type (endpoint, plugin, schema change).
2. Implement it: Follow the workflow in that section.
3. Document it: Update [`../CLAUDE.md`](../CLAUDE.md) if needed.

### I need to understand a decision

Check: [`adr/`](adr/) – Architecture Decision Records.

Currently:
- `0001-use-sqlite.md` – Why we chose SQLite over Postgres.

### I need to know current gotchas or team awareness

Check: [`../doc/notes.md`](../doc/notes.md) – Short-lived notes and warnings.

## Documentation Structure

```
acme-ledger/
├── README.md                      # Project intro and quick start
├── CLAUDE.md                      # Developer guide (READ THIS FIRST)
├── CONTRIBUTING.md                # Contribution workflow and guidelines
├── docs/
│   ├── INDEX.md                   # This file
│   ├── SETUP.md                   # Environment setup and dev workflow
│   ├── ARCHITECTURE.md            # Technical design and deep dive
│   └── adr/                       # Architecture Decision Records
│       └── 0001-use-sqlite.md     # Why SQLite
├── doc/
│   └── notes.md                   # Short-lived team awareness and gotchas
├── src/                           # Source code
│   ├── app.js                     # Server startup
│   ├── db.js                      # Database access
│   ├── http/
│   │   └── router.js              # HTTP routing
│   ├── ledger/
│   │   ├── post.js                # Entry posting logic
│   │   ├── reconcile.js           # Reconciliation
│   │   └── rounding.js            # Rounding function (critical!)
│   └── plugins/                   # Extensible plugins
│       ├── registry.js            # Plugin discovery
│       ├── audit-log.js           # Audit trail plugin
│       └── fx-normalize.js        # Currency conversion plugin
├── test/                          # Tests
│   ├── post.test.js               # Posting logic tests
│   └── rounding.test.js           # Rounding tests
├── migrations/                    # Database schema migrations
│   └── 0001_entries.sql           # Initial schema
└── scripts/
    └── migrate.js                 # Migration runner
```

## Key Concepts

### Double-Entry Ledger

A financial record with "debit" and "credit" sides. Every transaction balances: what you take from one account, you put into another.

**In acme-ledger:** Entries are immutable records with `side` (debit/credit), `amount`, and `currency`.

### Rounding: The Non-Negotiable Rule

All currency amounts are stored as integer cents. Rounding must use `roundHalfEven()`, never `Math.round()`.

**Why?** Floating-point arithmetic breaks financial reconciliation. See CLAUDE.md: "The Feb Drift Incident".

### Plugins

Business logic is pluggable. Every `.js` file in `src/plugins/` is auto-loaded at startup. Plugins intercept entry posting via `beforePost` and `afterPost` hooks.

**Example:** The `audit-log` plugin marks every posted entry as audited.

### SQLite

The data store. Single-writer, file-based, no external dependencies. Scales to billions of entries. If a second writer is needed, we migrate to Postgres (see ADR 0001).

### Migrations

Database schema changes are SQL files in `migrations/`, numbered sequentially. Applied in order at startup via `scripts/migrate.js`.

## Common Tasks

| Task | Where to Start |
|------|-----------------|
| Set up my environment | `docs/SETUP.md` |
| Understand the code | `docs/ARCHITECTURE.md` + source code |
| Fix a bug | `CONTRIBUTING.md` → "Bug Fix" section |
| Add an endpoint | `CONTRIBUTING.md` → "New Feature: HTTP Endpoint" |
| Add a plugin | `CONTRIBUTING.md` → "New Feature: Plugin" |
| Add a database column | `CONTRIBUTING.md` → "Schema Change: Add a Column" |
| Understand a design decision | `docs/adr/` |
| Check gotchas or team notes | `doc/notes.md` |
| Learn the rounding rule | `CLAUDE.md` → "The Feb Drift Incident" |

## File Navigation Reference

| Goal | File |
|------|------|
| Server startup logic | `src/app.js` |
| HTTP routing | `src/http/router.js` |
| Entry posting logic | `src/ledger/post.js` |
| Rounding logic (critical) | `src/ledger/rounding.js` |
| Plugin discovery | `src/plugins/registry.js` |
| Plugin examples | `src/plugins/audit-log.js`, `src/plugins/fx-normalize.js` |
| Database access | `src/db.js` |
| Reconciliation | `src/ledger/reconcile.js` |
| Tests | `test/post.test.js`, `test/rounding.test.js` |
| Migrations | `migrations/0001_entries.sql`, etc. |
| Dev scripts | `scripts/migrate.js`, `Makefile` |

## Learning Paths

### For Agent Onboarding

1. [`../CLAUDE.md`](../CLAUDE.md) – 10 min overview
2. [`docs/SETUP.md`](SETUP.md) – 5 min setup
3. [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) – 20 min deep dive
4. Read `src/app.js`, `src/ledger/post.js`, `src/plugins/registry.js` – 10 min code review
5. Run `make dev` and test an endpoint – 5 min hands-on

**Total: 50 minutes to full familiarity.**

### For Rounding/Financial Bug Fixing

1. [`../CLAUDE.md`](../CLAUDE.md) – "The Feb Drift Incident" section
2. [`src/ledger/rounding.js`](../src/ledger/rounding.js) – Read the implementation
3. [`test/rounding.test.js`](../test/rounding.test.js) – Understand the tests
4. [`../CONTRIBUTING.md`](../CONTRIBUTING.md) – "Bug Fix: Rounding Issue" workflow

### For Adding a Feature

1. [`../CLAUDE.md`](../CLAUDE.md) – Quick overview
2. [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) – Understand the relevant subsystem
3. [`../CONTRIBUTING.md`](../CONTRIBUTING.md) – Pick your feature type and follow the workflow
4. Reference the relevant source files as you code

## Principles

- **Precision over convenience:** Use integer cents, never floats.
- **Simplicity over features:** Vanilla HTTP, no frameworks.
- **Discoverability over configuration:** Plugins auto-discover by filename.
- **Single writer:** One process, one ledger, SQLite is appropriate.
- **Immutability:** Entries are never updated, only inserted. Corrections are new entries.

---

## Getting Help

If you can't find what you're looking for:

1. Search this file for keywords.
2. Check [`../CLAUDE.md`](../CLAUDE.md) for project-level answers.
3. Check [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) for technical details.
4. Check [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for workflow questions.
5. Check source code comments and the tests.

---

**Last Updated:** 2026-09-05
