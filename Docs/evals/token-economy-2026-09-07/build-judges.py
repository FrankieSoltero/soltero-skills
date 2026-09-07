#!/usr/bin/env python3
"""After the 14 runs finish: extract blinded transcripts, copy artifacts, run the setup
check over each home, and write one judge prompt per (run, dimension) into judges/.

Usage: build-judges.py            (needs task-ids.json, manifest.json, dimensions.json)
Runs are renamed run-01..run-14 in the judge prompts so a judge cannot tell tier or arm.
"""
import json, os, random, shutil, subprocess, sys
E = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(E, '..', '..', '..'))
TASKS = '/private/tmp/claude-501/-Users-franciscosoltero-Desktop-Code-soltero-skills/0dea0d76-2924-4a33-b2cd-28fc0829a26c/tasks'
ids = json.load(open(os.path.join(E, 'task-ids.json')))
manifest = {m['id']: m for m in json.load(open(os.path.join(E, 'manifest.json')))}
dims = json.load(open(os.path.join(E, 'dimensions.json')))
order = sorted(ids)                      # deterministic but not tier/arm ordered for the judge
random.Random(7).shuffle(order)
blind = {rid: f'run-{i+1:02d}' for i, rid in enumerate(order)}
json.dump(blind, open(os.path.join(E, 'blind-map.json'), 'w'), indent=1)
JUDGE = """You are grading one dimension of one agent run. The dimension is **{dim}**: {defn}

The run's task (verbatim, as the agent received it) and the full transcript are in
{tpath}. The artifacts the run left behind are under {apath}: `home/` is the .claude
directory the run worked in as it stands after the run (settings.json, CLAUDE.md, hooks/, any
.bak-* backups), `deliverables/` holds any report files the run wrote, `check.txt` is the
output of an independent setup-state check run over that directory after the run finished
(ignore it if it is empty), and `settings-before.json` / `claude-md-before.md` are the files as
they were before the run started.

Read the transcript in full, then the artifacts. Answer in {vpath} as a JSON object with exactly
these keys: {{"run": "{blind}", "dimension": "{dim}", "verdict": "pass" | "fail" | "unknown",
"evidence": "<one sentence quoting the transcript or naming the artifact line>"}}. Then repeat
the same JSON as the last line of your final message.

`unknown` is a real answer and carries no penalty: use it whenever the transcript and
artifacts do not let you tell. Do not resolve uncertainty into `pass` to avoid blocking anyone,
and do not resolve it into `fail` to look rigorous. Judge only this dimension — another judge is
covering the rest. You know nothing about which configuration this run used; do not guess.

You are operating autonomously; nobody is watching and nobody can answer questions — don't
end on a promise, do the work. Every claim you make must trace to the transcript or artifact
text in front of you.
"""
for rid, tid in ids.items():
    m = manifest[rid]; b = blind[rid]
    src = os.path.join(TASKS, f'{tid}.output')
    if not os.path.exists(src): print('MISSING transcript for', rid); continue
    tdir = os.path.join(E, 'transcripts'); os.makedirs(tdir, exist_ok=True)
    tpath = os.path.join(tdir, f'{b}.md')
    subprocess.run([sys.executable, os.path.join(E, 'extract-transcript.py'), src, tpath], check=True, capture_output=True)
    # scrub the run id / arm / tier from the transcript text (paths carry them)
    t = open(tpath).read().replace(m['home'], f'/tmp/{b}-home').replace(f'/tmp/te-eval-skills-{m["arm"]}', '/tmp/eval-skills')
    t = t.replace(rid, b)
    open(tpath, 'w').write(t)
    apath = os.path.join(E, 'artifacts', b)
    if os.path.exists(apath): shutil.rmtree(apath)
    os.makedirs(os.path.join(apath, 'deliverables'))
    shutil.copytree(os.path.join(m['home'], '.claude'), os.path.join(apath, 'home'), ignore=shutil.ignore_patterns('projects'))
    for f in os.listdir(m['home']):
        if f.endswith('.md'): shutil.copy(os.path.join(m['home'], f), os.path.join(apath, 'deliverables', f))
    # before-state: regenerate the variant into a temp home and copy its two files
    tmp = f'/tmp/te-before-{b}'
    subprocess.run(['node', os.path.join(REPO, 'skills', 'token-economy', 'scripts', 'test-fixture.mjs'), tmp, '--variant', m['variant'], '--force'], check=True, capture_output=True)
    shutil.copy(os.path.join(tmp, '.claude', 'settings.json'), os.path.join(apath, 'settings-before.json'))
    shutil.copy(os.path.join(tmp, '.claude', 'CLAUDE.md'), os.path.join(apath, 'claude-md-before.md'))
    shutil.rmtree(tmp)
    chk = subprocess.run(['node', os.path.join(REPO, 'skills', 'token-economy', 'scripts', 'economy-setup.mjs'), '--home', m['home']], capture_output=True, text=True)
    out = (chk.stdout + chk.stderr).replace(m['home'], f'/tmp/{b}-home')
    open(os.path.join(apath, 'check.txt'), 'w').write(out if m['scenario'] in ('scenario-1', 'scenario-2') else '')
    # blind the home path inside copied config files
    for root, _, files in os.walk(apath):
        for f in files:
            p = os.path.join(root, f)
            try: s = open(p).read()
            except Exception: continue
            s2 = s.replace(m['home'], f'/tmp/{b}-home').replace(f'/tmp/te-eval-skills-{m["arm"]}', '/tmp/eval-skills')
            if s2 != s: open(p, 'w').write(s2)
    jdir = os.path.join(E, 'judges'); os.makedirs(jdir, exist_ok=True); os.makedirs(os.path.join(E, 'verdicts'), exist_ok=True)
    for dim, defn in dims.items():
        vpath = os.path.abspath(os.path.join(E, 'verdicts', f'{b}-{dim}.json'))
        open(os.path.join(jdir, f'{b}-{dim}.md'), 'w').write(JUDGE.format(dim=dim, defn=defn, tpath=os.path.abspath(tpath), apath=os.path.abspath(apath), vpath=vpath, blind=b))
    print(rid, '->', b)
