#!/usr/bin/env bash
# Build one isolated workspace per (tier, scenario, arm) for skill-ab-eval, so no two runs
# share a directory. Copies the freshly built base fixtures under /tmp/ab-agent-swarm/.
#
# Usage: bash tests/scenarios/agent-swarm/fixtures/setup-ab-workspaces.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
bash "$here/setup-workspaces.sh" >/dev/null
root=/tmp/ab-agent-swarm
mkdir -p "$root"; for d in "$root"/*-scenario-* "$root"/*-canary-*; do [ -d "$d" ] && rm -rf "$d"; done
base() { case "$1" in scenario-1) echo /tmp/acme-crm;; scenario-2) echo /tmp/acme-shop;; scenario-3) echo /tmp/acme-billing;; canary) echo /tmp/acme-monorepo;; esac; }
for tier in sonnet haiku; do
  for sc in scenario-1 scenario-2 scenario-3 canary; do
    for arm in with without; do
      [ "$sc" = canary ] && [ "$arm" = with ] && continue
      dst="$root/$tier-$sc-$arm"
      cp -R "$(base "$sc")" "$dst"
    done
  done
done
echo "A/B workspaces under $root:"; ls "$root"
