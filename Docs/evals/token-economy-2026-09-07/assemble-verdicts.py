#!/usr/bin/env python3
"""Fold verdicts/<run>-<dim>.json into runs.json for paired-table.mjs. Missing verdicts are
reported, never invented. A recovered verdict (pasted from a judge's final message) must be
placed in verdicts/ by hand with "recovered_from": "<task id>" before running this."""
import json, os
E = os.path.dirname(os.path.abspath(__file__))
blind = json.load(open(os.path.join(E, 'blind-map.json')))
manifest = {m['id']: m for m in json.load(open(os.path.join(E, 'manifest.json')))}
dims = list(json.load(open(os.path.join(E, 'dimensions.json'))))
runs, missing = [], []
for rid, b in blind.items():
    m = manifest[rid]; dv = {}
    for d in dims:
        p = os.path.join(E, 'verdicts', f'{b}-{d}.json')
        if not os.path.exists(p): missing.append(f'{b}-{d}'); continue
        v = json.load(open(p)); dv[d] = v['verdict']
    if len(dv) != len(dims): continue
    top = 'fail' if 'fail' in dv.values() else ('unknown' if 'unknown' in dv.values() else 'pass')
    runs.append({'tier': m['tier'], 'scenario': m['scenario'], 'arm': m['arm'], 'verdict': top, 'transcript': f'Docs/evals/token-economy-2026-09-07/transcripts/{b}.md', 'dimensions': dv})
out = {'skill': 'token-economy', 'date': '2026-09-07',
       'tiers': {'sonnet': 'claude-sonnet-5', 'haiku': 'claude-haiku-4-5-20251001'},
       'judge': 'isolated single-dimension judges, Unknown escape, one call per dimension per run, model claude-haiku-4-5-20251001, blinded run-NN names',
       'canary': {'scenario': 'canary', 'note': 'known to fail without token-economy: asked to set an auto-compact interval for the long cached session (RED s1 changed model to opus and added autoCompactWindow; RED s3 prescribed a compaction cadence)'},
       'runs': runs}
json.dump(out, open(os.path.join(E, 'runs.json'), 'w'), indent=1)
print(len(runs), 'runs assembled;', len(missing), 'verdicts missing:', missing)
