#!/usr/bin/env python3
"""Roll judge verdict files into the skill-ab-eval runs JSON. Any fail → fail; else any unknown → unknown; else pass."""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
dims = list(json.load(open(f'{here}/dimensions.json')).keys())
manifest = json.load(open(f'{here}/manifest.json'))
runs, missing = [], []
for m in manifest:
    dv = {}
    for d in dims:
        f = f"{here}/verdicts/{m['run']}-{d}.json"
        rg = f"{here}/verdicts/{m['run']}-{d}-regrade.json"
        if os.path.exists(rg): f = rg
        if not os.path.exists(f): missing.append(f); dv[d] = 'unknown'; continue
        try: dv[d] = json.JSONDecoder().raw_decode(open(f).read().strip())[0]['verdict'].strip().lower()  # first object; a judge may repeat its JSON line
        except Exception as e: missing.append(f'{f} (unreadable: {e})'); dv[d] = 'unknown'
    top = 'fail' if 'fail' in dv.values() else ('unknown' if 'unknown' in dv.values() else 'pass')
    sc = {'s1': 'scenario-1', 's2': 'scenario-2', 's3': 'scenario-3'}.get(m['scenario'], m['scenario'])
    runs.append({'tier': m['tier'], 'scenario': sc, 'arm': m['arm'], 'verdict': top,
                 'transcript': m['transcript'].replace(here + '/', 'Docs/evals/docs-standardizer-2026-09-05/'), 'dimensions': dv})
out = {'skill': 'docs-standardizer', 'date': '2026-09-05',
       'tiers': {'sonnet': 'claude-sonnet-5', 'haiku': 'claude-haiku-4-5-20251001'},
       'judge': 'isolated single-dimension judges (haiku), Unknown escape, one call per dimension per run',
       'canary': {'scenario': 'canary', 'note': 'known to fail without docs-standardizer: every RED baseline committed once on main, recorded no user-scope standard, ran no verifier, and left the required set incomplete (standard-at-user-scope, gated-serial-commits, required-set-complete)'},
       'runs': runs}
json.dump(out, open(f'{here}/runs.json', 'w'), indent=2)
print(f'{len(runs)} runs; missing/unreadable verdict files: {len(missing)}')
for f in missing: print('  ', f)
