#!/usr/bin/env python3
"""Build the 14 run prompts + 14 fixture homes for the token-economy A/B eval.

Arms are byte-identical apart from (a) the prepended skill block in the with arm and (b) the
skills directory each arm is pointed at: the with arm sees a full copy of skills/, the without
arm a copy with token-economy removed, so a named scenario cannot find the skill it names.
"""
import json, os, re, shutil, subprocess, sys
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
E = os.path.dirname(os.path.abspath(__file__))
SK = os.path.join(REPO, 'skills')
SKILL_MD = open(os.path.join(SK, 'token-economy', 'SKILL.md')).read()
STANDING = ("\n\nYou are operating autonomously; nobody is watching and nobody can answer questions — "
            "don't end on a promise, do the work. Every claim you make must trace to a tool result "
            "from this session. State your choice and act on it.\n")
def scenario_text(n):
    s = open(os.path.join(REPO, 'tests', 'scenarios', 'token-economy', f'scenario-{n}.md')).read()
    body = s.split('\n---\n', 1)[1].split('<!-- ===== EVALUATOR ONLY', 1)[0].strip('\n')
    body = body.replace('/Users/franciscosoltero/Desktop/Code/soltero-skills/skills/', '<SKILLS_DIR>/')
    body = body.replace(f'/tmp/te-home-s{n}', '<HOME>')
    return body
SCEN = {f'scenario-{n}': (scenario_text(n), f's{n}') for n in (1, 2, 3)}
SCEN['canary'] = (open(os.path.join(E, 'prompts', 'canary.md')).read().strip('\n'), 's3')
# skills dirs
for arm in ('with', 'without'):
    d = f'/tmp/te-eval-skills-{arm}'
    if os.path.exists(d): shutil.rmtree(d)
    shutil.copytree(SK, d, ignore=shutil.ignore_patterns('node_modules'))
    if arm == 'without': shutil.rmtree(os.path.join(d, 'token-economy'))
manifest = []
for tier in ('sonnet', 'haiku'):
    for name, (text, variant) in SCEN.items():
        for arm in (('without',) if name == 'canary' else ('with', 'without')):
            rid = f'{tier}-{name}-{arm}'
            home = f'/tmp/te-{rid}'
            subprocess.run(['node', os.path.join(SK, 'token-economy', 'scripts', 'test-fixture.mjs'), home, '--variant', variant, '--force'], check=True, capture_output=True)
            body = text.replace('<HOME>', home).replace('<SKILLS_DIR>', f'/tmp/te-eval-skills-{arm}')
            if arm == 'with':
                body = ("The following skill is loaded and applies to this task:\n\n" + SKILL_MD.replace('${CLAUDE_SKILL_DIR}', f'/tmp/te-eval-skills-with/token-economy') + "\n\n---\n\n" + body)
            body += STANDING
            open(os.path.join(E, 'prompts', f'{rid}.md'), 'w').write(body)
            manifest.append({'id': rid, 'tier': tier, 'scenario': name, 'arm': arm, 'home': home, 'prompt': f'prompts/{rid}.md', 'variant': variant})
json.dump(manifest, open(os.path.join(E, 'manifest.json'), 'w'), indent=1)
print(len(manifest), 'prompts written')
