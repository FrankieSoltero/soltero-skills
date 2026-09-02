#!/bin/sh
# Materialize a defect-class-sweep scenario workspace.
#   usage: setup.sh <fixture-repo> <target-dir> [overlay-dir]
set -eu
src="$1"; dst="$2"; overlay="${3:-}"
rm -rf "$dst"
mkdir -p "$dst"
cp -R "$src"/. "$dst"/
[ -n "$overlay" ] && cp -R "$overlay"/. "$dst"/
cd "$dst"
git init -q .
git add -A
git -c user.email=fixtures@example.com -c user.name=Fixtures commit -qm "initial import"
echo "ready: $dst"
