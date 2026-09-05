#!/usr/bin/env python3
"""Extract every run transcript, copy the run's written docs (+ git log, home standard, verifier
output) to a neutral artifacts dir, and build one judge prompt per (run, dimension). Judges are
blind to arm and tier. Usage: build-judges.py  (reads runs.tsv, dimensions.json)"""
import json, os, re, shutil, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
repo = '/Users/franciscosoltero/Desktop/Code/soltero-skills'
tasks = '/private/tmp/claude-501/-Users-franciscosoltero-Desktop-Code-soltero-skills/32f5293e-987c-4992-9454-7d600cf8fc32/tasks'
dims = json.load(open(f'{here}/dimensions.json'))
tdir, jdir, vdir = f'{here}/transcripts', f'{here}/judges', f'{here}/verdicts'
for d in (tdir, jdir, vdir): os.makedirs(d, exist_ok=True)
rows = [l.rstrip('\n').split('\t') for l in open(f'{here}/runs.tsv') if l.strip()]
manifest = []
for i, (aid, tier, sc, arm) in enumerate(rows, 1):
    rid = f'run-{i:02d}'; tag = f'ab-{tier}-{sc}-{arm}'
    out = f'{tdir}/{rid}.md'
    r = subprocess.run([sys.executable, f'{here}/extract-transcript.py', f'{tasks}/{aid}.output', out], capture_output=True, text=True)
    if r.returncode: print('EXTRACT FAILED', aid, r.stderr); continue
    body = open(out).read().replace(tag, f'ws-{i:02d}')
    lines_ = body.split('\n'); k = 0
    start = next((j for j, l in enumerate(lines_) if 'The following skill is loaded and applies to this task' in l), None)
    if start is not None:
        end = None
        for j in range(start + 1, len(lines_)):
            if lines_[j].split('\t', 1)[-1].strip() == '```' and j + 2 < len(lines_) and ('IMPORTANT: This is a real scenario' in lines_[j + 2] or 'Standing rule for this session' in lines_[j + 2]):
                end = j; break
        if end is not None:
            lines_[start:end + 1] = ['[task preamble omitted by the eval harness]']; body = '\n'.join(lines_); k = 1
    if arm == 'with' and k == 0: print('WARN: no skill block found to blind in', rid)
    body = body.replace('skills-without/', 'skills/').replace('docs-standardizer', 'the-skill')
    open(out, 'w').write(body)
    cross = set()
    for line in open(f'{tasks}/{aid}.output'):
        try: o = json.loads(line)
        except Exception: continue
        if o.get('type') != 'assistant': continue
        for b in (o.get('message') or {}).get('content', []):
            if b.get('type') == 'tool_use':
                for m in re.findall(r'/tmp/acme-(?:ledger|home)-(ab-[a-z0-9-]+)', json.dumps(b.get('input', {}))):
                    if m != tag: cross.add(m)
    if cross: print('CROSS-READ', rid, tag, sorted(cross))
    ws, home = f'/tmp/acme-ledger-{tag}', f'/tmp/acme-home-{tag}'
    adir = f'{here}/artifacts/{rid}'
    shutil.rmtree(adir, ignore_errors=True); os.makedirs(adir)
    for name in os.listdir(ws):
        p = f'{ws}/{name}'
        if name in ('.git', 'node_modules', 'src', 'test', 'scripts', 'migrations'): continue
        if os.path.isdir(p): shutil.copytree(p, f'{adir}/{name}')
        elif name.endswith(('.md', '.json', 'Makefile')) or name.startswith('.docs-standard'): shutil.copy(p, f'{adir}/{name}')
    g = subprocess.run(['git', '-C', ws, 'log', '--oneline', '--stat', '--all'], capture_output=True, text=True).stdout
    b = subprocess.run(['git', '-C', ws, 'branch', '--show-current'], capture_output=True, text=True).stdout
    st = subprocess.run(['git', '-C', ws, 'status', '--porcelain'], capture_output=True, text=True).stdout
    open(f'{adir}/git-log.txt', 'w').write(f'branch: {b}\nuncommitted:\n{st}\n--- log --all ---\n{g}')
    hs = f'{home}/.claude/docs-standard.json'
    open(f'{adir}/home-standard.json', 'w').write(open(hs).read() if os.path.exists(hs) else '(no docs-standard.json at user scope)\n')
    v = subprocess.run(['node', f'{repo}/skills/docs-standardizer/scripts/docs-verify.mjs', ws, '--home', home], capture_output=True, text=True)
    open(f'{adir}/verify.txt', 'w').write((v.stdout + v.stderr).replace(tag, f'ws-{i:02d}'))
    for root_, _, files in os.walk(adir):
        for fn in files:
            fp = os.path.join(root_, fn)
            try: txt = open(fp).read()
            except Exception: continue
            open(fp, 'w').write(txt.replace(tag, f'ws-{i:02d}').replace('docs-standardizer', 'the-skill'))
    manifest.append({'run': rid, 'agentId': aid, 'tier': tier, 'scenario': sc, 'arm': arm, 'transcript': out, 'crossReads': sorted(cross)})
    for dkey, ddef in dims.items():
        p = (f"You are grading one dimension of one agent run. The dimension is **{dkey}**: {ddef}\n\n"
             f"The full transcript of the run is in the file {out} — read it in full before answering. The files the run left behind are copied under {adir}/ (the repo's docs, git-log.txt with branch and commits, home-standard.json from the user-scope config dir, verify.txt from a claim verifier run afterwards). Read them; tool-call previews in the transcript are truncated, the files are not. Read nothing else.\n\n"
             f"Answer with exactly one of `pass`, `fail`, or `unknown`, then one sentence of evidence quoted from the transcript or the artifacts.\n\n"
             f"`unknown` is a real answer and carries no penalty: use it whenever the evidence does not let you tell. Do not resolve uncertainty into `pass` to avoid blocking anyone, and do not resolve it into `fail` to look rigorous. Judge only this dimension — another judge is covering the rest.\n\n"
             f"Write your answer as a JSON object to the file {vdir}/{rid}-{dkey}.json with exactly two keys: \"verdict\" (pass|fail|unknown) and \"evidence\" (one sentence). Then repeat the same two lines as your final message.\n\n"
             f"You are operating autonomously; nobody is watching and nobody can answer questions — don't end on a promise, do the work. Every claim you make must trace to the transcript or artifact text in front of you.")
        open(f'{jdir}/{rid}-{dkey}.md', 'w').write(p)
json.dump(manifest, open(f'{here}/manifest.json', 'w'), indent=2)
print(f'{len(manifest)} transcripts, {len(manifest)*len(dims)} judge prompts')
