#!/usr/bin/env bash
# Usage: scripts/bump-version.sh 0.2.0  — updates version in both manifests and package.json
set -euo pipefail
V="${1:?usage: bump-version.sh <semver>}"
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json package.json; do
  node -e "const fs=require('fs');const o=JSON.parse(fs.readFileSync('$f'));
    if(o.version!==undefined)o.version='$V';
    if(o.plugins)o.plugins.forEach(p=>p.version='$V');
    fs.writeFileSync('$f',JSON.stringify(o,null,2)+'\n');"
  echo "bumped $f -> $V"
done
