#!/usr/bin/env bash
# Greps staged/tracked files against a PRIVATE denylist kept out of the repo.
# Create .private-denylist.txt locally (gitignored), one term per line.
set -euo pipefail
DENYLIST="${1:-.private-denylist.txt}"
if [[ ! -f "$DENYLIST" ]]; then
  echo "No denylist at $DENYLIST — skipping (create one locally, see spec §2.1)."
  exit 0
fi
# Build an alternation of non-empty, non-comment terms.
TERMS=$(grep -vE '^\s*(#|$)' "$DENYLIST" | paste -sd'|' -)
if [[ -z "$TERMS" ]]; then echo "Denylist empty — skipping."; exit 0; fi
if git grep -nIE "$TERMS" -- ':!.private-denylist.txt' ':!scripts/check-private-names.sh'; then
  echo "✗ Private names found above. Remove before publishing."
  exit 1
fi
echo "✓ No private names found."
