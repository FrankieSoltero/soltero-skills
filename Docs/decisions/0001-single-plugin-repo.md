# ADR 0001: Single-plugin, self-hosted-marketplace repo

**Status:** Accepted (2026-06-13)

**Context:** We need a public, installable home for the skills library.

**Decision:** One GitHub repo IS the plugin: `.claude-plugin/{plugin,marketplace}.json` at the
root, skills auto-discovered from `skills/`. The repo ships its own `marketplace.json` so users
install via `/plugin marketplace add FrankieSoltero/soltero-skills`.

**Consequences:** Simple, matches the reference `superpowers` plugin and official docs. If we
later want category-scoped installs, we can split into multiple plugins under one marketplace.
