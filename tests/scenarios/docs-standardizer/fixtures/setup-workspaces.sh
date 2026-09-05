#!/usr/bin/env bash
# Build the scenario workspaces used by tests/scenarios/docs-standardizer.
#
# For each TAG given (default: s1 s2 s3) this creates
#   /tmp/acme-ledger-<TAG>        the seeded repo (git-initialized, clean on main)
#   /tmp/acme-home-<TAG>/.claude  the stand-in for ~/.claude
# The s2 home also carries a pre-existing docs-standard.json (scenario 2 tests applying an
# existing standard; s1/s3 test the bootstrap path).
#
# Deterministic and synthetic. It REFUSES to rebuild a workspace that is dirty or off `main`
# (a subagent may be working in it — lesson 2026-09-02) unless --force is passed.
#
# Usage: bash tests/scenarios/docs-standardizer/fixtures/setup-workspaces.sh [--force] [TAG...]
set -euo pipefail

FORCE=0
TAGS=()
for a in "$@"; do
  case "$a" in
    --force) FORCE=1 ;;
    *) TAGS+=("$a") ;;
  esac
done
[ ${#TAGS[@]} -eq 0 ] && TAGS=(s1 s2 s3)

refuse_if_live() {
  local ws="$1"
  [ -d "$ws" ] || return 0
  if [ "$FORCE" = 1 ]; then return 0; fi
  if [ -d "$ws/.git" ]; then
    local branch dirty
    branch=$(git -C "$ws" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)
    dirty=$(git -C "$ws" status --porcelain 2>/dev/null || true)
    if [ "$branch" != "main" ] || [ -n "$dirty" ]; then
      echo "REFUSING to rebuild $ws: branch=$branch dirty=$([ -n "$dirty" ] && echo yes || echo no). A run may be live. Pass --force to override." >&2
      exit 3
    fi
  fi
}

build_repo() {
  local ws="$1"
  refuse_if_live "$ws"
  rm -rf "$ws"
  mkdir -p "$ws"/{src/ledger,src/plugins,src/http,scripts,migrations,test,docs/adr,doc,.github/workflows}
  cd "$ws"

  cat > package.json <<'EOF'
{
  "name": "acme-ledger",
  "version": "2.3.1",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "test": "node --test test/*.test.js",
    "lint": "eslint .",
    "migrate": "node scripts/migrate.js"
  }
}
EOF

  cat > Makefile <<'EOF'
.PHONY: dev test migrate
dev:
	LEDGER_DB_PATH=./var/dev.sqlite node --watch src/app.js
test:
	npm test
migrate:
	node scripts/migrate.js
EOF

  cat > .env.example <<'EOF'
PORT=8080
LEDGER_DB_PATH=./var/ledger.sqlite
RECONCILE_CRON=15 2 * * *
EOF

  cat > eslint.config.js <<'EOF'
export default [{ rules: { eqeqeq: 'error', 'no-var': 'error' } }];
EOF

  cat > .gitignore <<'EOF'
node_modules/
var/
.env
EOF

  cat > .github/workflows/ci.yml <<'EOF'
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
      - run: npm run lint
EOF

  # --- stale README: wrong command, wrong entry file, wrong port, dead paths -----------------
  cat > README.md <<'EOF'
# acme-ledger

Double-entry ledger service for Acme's billing team.

## Getting started

```
npm install
npm run dev
```

The server starts on port 3000 from `src/server.js`. Configuration lives under `config/`
(see `config/default.json`).

## Testing

```
npm run test:unit
```

## More

See `docs/SETUP.md` for environment setup and `docs/ARCHITECTURE.md` for the design.
EOF

  # --- old setup doc: contradicts the README and is the one that is right ------------------
  # (docs/ is lowercase on purpose: the standard says Docs/, a case-only mismatch; doc/ is a
  #  second, distinct root — case-insensitive filesystems would merge Docs/ and docs/.)
  cat > docs/SETUP.md <<'EOF'
# Environment setup

Copy `.env.example` to `.env`. The server reads `PORT` (default 8080) and `LEDGER_DB_PATH`.

Run the dev loop with `make dev` (it points the DB at `./var/dev.sqlite` and uses
`node --watch`). Apply schema changes with `npm run migrate` before the first start.

Tests: `npm test`.
EOF

  cat > docs/adr/0001-use-sqlite.md <<'EOF'
# ADR 0001 — Use SQLite for the ledger store

Status: accepted (2025-11-03)

Context: single-writer ledger, one process, nightly reconcile. Postgres was the default
choice; the ops cost was not justified for one writer.

Decision: SQLite via `src/db.js`, migrations as numbered SQL files under `migrations/`,
applied by `scripts/migrate.js`. Revisit if a second writer ever appears.
EOF

  cat > doc/notes.md <<'EOF'
# Notes

- Rounding: every amount is stored in integer cents. `roundHalfEven` in
  `src/ledger/rounding.js` is the ONLY rounding function allowed in posting code; a naive
  `Math.round` caused the Feb drift incident.
- Plugins under `src/plugins/` are picked up by filename at boot; there is no registration list.
EOF

  # --- code ----------------------------------------------------------------------------------
  cat > src/app.js <<'EOF'
import http from 'node:http';
import { loadPlugins } from './plugins/registry.js';
import { router } from './http/router.js';

const port = Number(process.env.PORT ?? 8080);

export async function start() {
  const plugins = await loadPlugins();
  const server = http.createServer(router(plugins));
  server.listen(port);
  return server;
}

if (process.argv[1] && process.argv[1].endsWith('app.js')) start();
EOF

  cat > src/plugins/registry.js <<'EOF'
import { readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// Every *.js file in this directory except registry.js is a plugin. A plugin default-exports
// { name, hooks: { beforePost?, afterPost? } }. Discovery is by filename; nothing registers.
export async function loadPlugins() {
  const files = (await readdir(here)).filter((f) => f.endsWith('.js') && f !== 'registry.js');
  const plugins = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(here, f)).href);
    plugins.push(mod.default);
  }
  return plugins;
}
EOF

  cat > src/plugins/audit-log.js <<'EOF'
export default {
  name: 'audit-log',
  hooks: {
    afterPost(entry) { return { ...entry, audited: true }; },
  },
};
EOF

  cat > src/plugins/fx-normalize.js <<'EOF'
export default {
  name: 'fx-normalize',
  hooks: {
    beforePost(entry) { return entry.currency === 'USD' ? entry : { ...entry, currency: 'USD' }; },
  },
};
EOF

  cat > src/http/router.js <<'EOF'
import { post } from '../ledger/post.js';

export function router(plugins) {
  return (req, res) => {
    if (req.method === 'POST' && req.url === '/entries') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const entry = post(JSON.parse(body), plugins);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(entry));
      });
      return;
    }
    res.statusCode = 404;
    res.end();
  };
}
EOF

  cat > src/ledger/post.js <<'EOF'
import { roundHalfEven } from './rounding.js';
import { insertEntry } from '../db.js';

export function post(input, plugins = []) {
  let entry = { ...input, cents: roundHalfEven(input.amount * 100) };
  for (const p of plugins) if (p.hooks.beforePost) entry = p.hooks.beforePost(entry);
  insertEntry(entry);
  for (const p of plugins) if (p.hooks.afterPost) entry = p.hooks.afterPost(entry);
  return entry;
}
EOF

  cat > src/ledger/rounding.js <<'EOF'
// Banker's rounding. The only rounding allowed in posting code (see Docs/notes.md).
export function roundHalfEven(x) {
  const f = Math.floor(x);
  const diff = x - f;
  if (diff > 0.5) return f + 1;
  if (diff < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}
EOF

  cat > src/ledger/reconcile.js <<'EOF'
import { allEntries } from '../db.js';

// Nightly: sums debits and credits; a non-zero balance is drift and is reported, not fixed.
export function reconcile() {
  const entries = allEntries();
  const balance = entries.reduce((s, e) => s + (e.side === 'debit' ? e.cents : -e.cents), 0);
  return { count: entries.length, balance };
}
EOF

  cat > src/db.js <<'EOF'
// In-memory stand-in for the SQLite store (the real driver is loaded in production only).
const rows = [];
export function insertEntry(e) { rows.push(e); return e; }
export function allEntries() { return rows.slice(); }
export function reset() { rows.length = 0; }
EOF

  cat > scripts/migrate.js <<'EOF'
import { readdir } from 'node:fs/promises';
const files = (await readdir(new URL('../migrations/', import.meta.url))).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) console.log(`applied ${f}`);
EOF

  cat > migrations/0001_entries.sql <<'EOF'
CREATE TABLE entries (id INTEGER PRIMARY KEY, side TEXT NOT NULL, cents INTEGER NOT NULL, currency TEXT NOT NULL);
EOF

  cat > test/rounding.test.js <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundHalfEven } from '../src/ledger/rounding.js';

test('rounds half to even', () => {
  assert.equal(roundHalfEven(2.5), 2);
  assert.equal(roundHalfEven(3.5), 4);
  assert.equal(roundHalfEven(2.4), 2);
});
EOF

  cat > test/post.test.js <<'EOF'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { post } from '../src/ledger/post.js';
import { reset } from '../src/db.js';

test('post applies plugin hooks in order', () => {
  reset();
  const plugins = [{ hooks: { beforePost: (e) => ({ ...e, tagged: true }) } }];
  const out = post({ amount: 1.005, side: 'debit', currency: 'USD' }, plugins);
  assert.equal(out.cents, 100);
  assert.equal(out.tagged, true);
});
EOF

  git init -q -b main
  git -c user.email=fixture@example.com -c user.name=fixture add -A
  git -c user.email=fixture@example.com -c user.name=fixture commit -q -m "seed acme-ledger fixture"
  cd - >/dev/null
}

build_home() {
  local home="$1" with_standard="$2"
  rm -rf "$home"
  mkdir -p "$home/.claude"
  cat > "$home/.claude/CLAUDE.md" <<'EOF'
# Development Standards

- Follow language-specific best practices and idiomatic patterns.
- Never hardcode secrets; use environment variables.
- Create a Docs folder for every project where you document mistakes and fixes made
  throughout the project, and use it to keep learning across projects.
EOF
  if [ "$with_standard" = 1 ]; then
    cat > "$home/.claude/docs-standard.json" <<'EOF'
{
  "version": 1,
  "docsRoot": "Docs",
  "entryDoc": {
    "file": "CLAUDE.md",
    "mirror": "AGENTS.md",
    "maxLines": 120,
    "requiredSections": ["Purpose", "Commands", "Layout", "Where to look", "Conventions", "Docs"]
  },
  "required": [
    { "file": "README.md", "sections": ["Getting started"] },
    { "file": "Docs/README.md", "purpose": "index: one line per doc under the docs root" },
    { "file": "Docs/architecture.md", "sections": ["Entry points", "Module map", "Data flow", "Non-obvious mechanisms"] },
    { "file": "Docs/conventions.md", "sections": ["Declared", "Observed"] },
    { "file": "Docs/decisions.md", "purpose": "index of decisions/ADRs; never invented" },
    { "file": "Docs/mistakes-and-fixes.md", "purpose": "lesson log; scaffold only" },
    { "file": "Docs/open-questions.md", "purpose": "what only a human can answer" }
  ],
  "commandSources": ["package.json", "Makefile", "justfile", "pyproject.toml"],
  "unverifiedMarker": "(unverified)",
  "exclude": ["node_modules", "dist", "build", "coverage", ".git", "var"]
}
EOF
  fi
}

for tag in "${TAGS[@]}"; do
  build_repo "/tmp/acme-ledger-$tag"
  if [ "$tag" = "s2" ]; then build_home "/tmp/acme-home-$tag" 1; else build_home "/tmp/acme-home-$tag" 0; fi
  echo "built /tmp/acme-ledger-$tag and /tmp/acme-home-$tag"
done
