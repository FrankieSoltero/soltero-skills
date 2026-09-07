#!/usr/bin/env bash
# Builds /tmp/te-home-s{1,2,3}/.claude for the token-economy scenarios. Pass --force to rebuild.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GEN="$HERE/../../../../skills/token-economy/scripts/test-fixture.mjs"
for v in s1 s2 s3; do
  node "$GEN" "/tmp/te-home-$v" --variant "$v" "$@"
done
