#!/usr/bin/env python3
"""Roll judge verdict files into the skill-ab-eval runs JSON. Any fail → fail; else any unknown → unknown; else pass."""
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
dims = list(json.load(open(f'{here}/dimensions.json')).keys())
manifest = json.load(open(f'{here}/manifest.json'))
runs = []
missing = []
for m in manifest:
    dv = {}
    for d in dims:
        f = f"{here}/verdicts/{m['run']}-{d}.json"
        rg = f"{here}/verdicts/{m['run']}-{d}-regrade.json"
        if os.path.exists(rg): f = rg   # a sharpened re-grade supersedes the first pass
        if not os.path.exists(f): missing.append(f); dv[d] = 'unknown'; continue
        try: dv[d] = json.load(open(f))['verdict'].strip().lower()
        except Exception as e: missing.append(f + ' (unreadable: ' + str(e) + ')'); dv[d] = 'unknown'
    top = 'fail' if 'fail' in dv.values() else ('unknown' if 'unknown' in dv.values() else 'pass')
    runs.append({'tier': m['tier'], 'scenario': m['scenario'], 'arm': m['arm'], 'verdict': top,
                 'transcript': m['transcript'].replace(here + '/', 'Docs/evals/agent-swarm-2026-09-02/'), 'dimensions': dv})
out = {'skill': 'agent-swarm', 'date': '2026-09-02',
       'tiers': {'sonnet': 'claude-sonnet-5', 'haiku': 'claude-haiku-4-5-20251001'},
       'judge': 'isolated single-dimension judges (haiku), Unknown escape, one call per dimension per run',
       'canary': {'scenario': 'canary', 'note': 'known to fail without agent-swarm: every RED baseline left the agent ceiling in prose and authored a fresh orchestration (ceiling-enforced, no-fresh-orchestration)'},
       'runs': runs}
json.dump(out, open(f'{here}/runs.json', 'w'), indent=2)
print(f'{len(runs)} runs; missing/unreadable verdict files: {len(missing)}')
for f in missing: print('  ', f)
