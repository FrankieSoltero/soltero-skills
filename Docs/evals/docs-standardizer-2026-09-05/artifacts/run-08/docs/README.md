# Documentation index

This directory contains all documentation for acme-ledger. Start with the entry doc at `../CLAUDE.md`.

## Quick reference

| Doc | Purpose |
|---|---|
| `SETUP.md` | Environment setup, dev workflow, running tests |
| `architecture.md` | Entry points, module map, data flow, non-obvious mechanisms |
| `conventions.md` | Code style (ESLint), testing, database schema, observed patterns |
| `decisions.md` | Index of architectural decisions (ADRs) |
| `notes.md` | Non-obvious facts (rounding, plugin discovery) |
| `mistakes-and-fixes.md` | Lesson log from debugging and fixes |
| `open-questions.md` | Questions for the team (incomplete features, plugin behavior) |
| `adr/` | Archived decision records (historical, exempt from claim checks) |

## How to find what you need

- **Starting work?** Read `../CLAUDE.md`, then `SETUP.md`.
- **Understanding the code?** Read `architecture.md`, then look at `src/ledger/post.js` and `src/plugins/registry.js`.
- **Debugging rounding issues?** See `notes.md` and `src/ledger/rounding.js`.
- **Adding features?** Check `conventions.md` for code style and `decisions.md` for past decisions.
- **Stuck on something?** Check `open-questions.md` or `mistakes-and-fixes.md`.
