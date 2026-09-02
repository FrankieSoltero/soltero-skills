#!/usr/bin/env python3
"""Extract every run transcript and build one judge prompt per (run, dimension).
Judges are blind to arm and tier: the transcript file name they see is a neutral id.
Usage: build-judges.py   (reads runs.tsv, dimensions.json; writes transcripts/ and judges/)"""
import json, os, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
tasks = '/private/tmp/claude-501/-Users-franciscosoltero-Desktop-Code-soltero-skills/4fb55dd5-7d91-491e-93bb-8597c5f1254c/tasks'
dims = json.load(open(f'{here}/dimensions.json'))
tdir, jdir, vdir = f'{here}/transcripts', f'{here}/judges', f'{here}/verdicts'
for d in (tdir, jdir, vdir): os.makedirs(d, exist_ok=True)
rows = [l.rstrip('\n').split('\t') for l in open(f'{here}/runs.tsv') if l.strip()]
manifest = []
for i, (aid, tier, sc, arm) in enumerate(rows, 1):
    rid = f'run-{i:02d}'
    out = f'{tdir}/{rid}.md'
    r = subprocess.run([sys.executable, f'{here}/extract-transcript.py', f'{tasks}/{aid}.output', out], capture_output=True, text=True)
    if r.returncode: print('EXTRACT FAILED', aid, r.stderr); continue
    # neutralise arm/tier leaks in the transcript body: workspace names carry them
    body = open(out).read().replace(f'{tier}-{sc}-{arm}', f'ws-{i:02d}')
    # blind the arm: drop the embedded skill block from the task text
    # the Read tool result carries line-number prefixes, so blind line-by-line: from the
    # preamble line through the fence that closes the embedded skill block
    lines_ = body.split('\n'); k = 0
    start = next((j for j, l in enumerate(lines_) if 'The following skill is loaded and applies to this task' in l), None)
    if start is not None:
        end = None
        for j in range(start + 1, len(lines_)):
            if lines_[j].split('\t', 1)[-1].strip() == '```' and j + 2 < len(lines_) and ('IMPORTANT: This is a real scenario' in lines_[j + 2] or 'Standing rule for this session' in lines_[j + 2]):
                end = j; break
        if end is not None:
            lines_[start:end + 1] = ['[task preamble omitted by the eval harness]']
            body = '\n'.join(lines_); k = 1
    if arm == 'with' and k == 0: print('WARN: no skill block found to blind in', rid)
    open(out, 'w').write(body)
    # independence check: any tool call touching another run's workspace is recorded
    import re
    own = f'{tier}-{sc}-{arm}'
    cross = set()
    for line in open(f'{tasks}/{aid}.output'):
        try: o = json.loads(line)
        except Exception: continue
        if o.get('type') != 'assistant': continue
        for b in (o.get('message') or {}).get('content', []):
            if b.get('type') == 'tool_use':
                for m in re.findall(r'/tmp/ab-agent-swarm/([a-z0-9-]+)', json.dumps(b.get('input', {}))):
                    if m not in (own, 'skills-without'): cross.add(m)
    manifest.append({'run': rid, 'agentId': aid, 'tier': tier, 'scenario': sc, 'arm': arm, 'transcript': out, 'crossReads': sorted(cross)})
    if cross: print('CROSS-READ', rid, own, sorted(cross))
    # copy the run's written artifacts (swarm/, .soltero/, dispatch/, briefs) to a neutral dir
    import shutil
    ws = f'/tmp/ab-iso/{tier}-{sc}-{arm}' if os.path.isdir(f'/tmp/ab-iso/{tier}-{sc}-{arm}') else f'/tmp/ab-agent-swarm/{tier}-{sc}-{arm}'
    adir = f'{here}/artifacts/{rid}'
    shutil.rmtree(adir, ignore_errors=True); os.makedirs(adir)
    for sub in ('swarm', '.soltero', 'dispatch', 'briefs', 'Docs'):
        if os.path.isdir(f'{ws}/{sub}'): shutil.copytree(f'{ws}/{sub}', f'{adir}/{sub}')
    # neutralise workspace names inside copied artifacts too
    for root_, _, files in os.walk(adir):
        for fn in files:
            fp = os.path.join(root_, fn)
            try: txt = open(fp).read()
            except Exception: continue
            open(fp, 'w').write(txt.replace(f'{tier}-{sc}-{arm}', f'ws-{i:02d}'))
    for dkey, ddef in dims.items():
        p = (f"You are grading one dimension of one agent run. The dimension is **{dkey}**: {ddef}\n\n"
             f"The full transcript of the run is in the file {out} — read it in full before answering. The files the run wrote are copied under {adir}/ (read them; tool-call previews in the transcript are truncated, the files are not). Read nothing else.\n\n"
             f"Answer with exactly one of `pass`, `fail`, or `unknown`, then one sentence of evidence quoted from the transcript.\n\n"
             f"`unknown` is a real answer and carries no penalty: use it whenever the transcript does not let you tell. Do not resolve uncertainty into `pass` to avoid blocking anyone, and do not resolve it into `fail` to look rigorous. Judge only this dimension — another judge is covering the rest.\n\n"
             f"Write your answer as a JSON object to the file {vdir}/{rid}-{dkey}.json with exactly two keys: \"verdict\" (pass|fail|unknown) and \"evidence\" (one sentence quoted from the transcript). Then repeat the same two lines as your final message.\n\n"
             f"You are operating autonomously; nobody is watching and nobody can answer questions — don't end on a promise, do the work. Every claim you make must trace to the transcript text in front of you.")
        open(f'{jdir}/{rid}-{dkey}.md', 'w').write(p)
json.dump(manifest, open(f'{here}/manifest.json', 'w'), indent=2)
print(f'{len(manifest)} transcripts, {len(manifest)*len(dims)} judge prompts')
