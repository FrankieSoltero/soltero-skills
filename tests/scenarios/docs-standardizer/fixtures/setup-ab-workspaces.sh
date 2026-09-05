#!/usr/bin/env bash
# Build one isolated (repo, home) pair per (tier, scenario, arm) for skill-ab-eval, so no two
# runs share a directory. Reuses setup-workspaces.sh with per-run tags:
#   /tmp/acme-ledger-ab-<tier>-<sc>-<arm>  and  /tmp/acme-home-ab-<tier>-<sc>-<arm>/.claude
# Scenario 2's homes carry the pre-existing standard (copied from the s2 base home).
#
# Usage: bash tests/scenarios/docs-standardizer/fixtures/setup-ab-workspaces.sh [--force]
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
force="${1:-}"
tags=()
for tier in sonnet haiku; do
  for sc in s1 s2 s3 canary; do
    for arm in with without; do
      [ "$sc" = canary ] && [ "$arm" = with ] && continue
      tags+=("ab-$tier-$sc-$arm")
    done
  done
done
bash "$here/setup-workspaces.sh" $force s2 "${tags[@]}"
for t in "${tags[@]}"; do
  case "$t" in *-s2-*) cp /tmp/acme-home-s2/.claude/docs-standard.json "/tmp/acme-home-$t/.claude/docs-standard.json";; esac
done
echo "A/B workspaces: /tmp/acme-ledger-ab-* and /tmp/acme-home-ab-* (${#tags[@]} pairs)"
