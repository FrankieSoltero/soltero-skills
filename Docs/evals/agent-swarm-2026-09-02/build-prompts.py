#!/usr/bin/env python3
"""Build one prompt file per (tier, scenario, arm) for the agent-swarm A/B eval.

Arms are byte-identical apart from the skill block prepended to the with arm. Workspace
paths in the scenario text are rewritten to the per-arm copy. Scenario 3 carries the
standing routing rule; in its without arm that rule points at a skills tree with agent-swarm
removed, so the skill is invisible there.
"""
import os, shutil, sys
repo = '/Users/franciscosoltero/Desktop/Code/soltero-skills'
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'prompts')
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
skill = open(f'{repo}/skills/agent-swarm/SKILL.md').read()
base = {'scenario-1': '/tmp/acme-crm', 'scenario-2': '/tmp/acme-shop', 'scenario-3': '/tmp/acme-billing', 'canary': '/tmp/acme-monorepo'}
src = {k: f'{repo}/tests/scenarios/agent-swarm/{k}.md' for k in ('scenario-1', 'scenario-2', 'scenario-3')}
src['canary'] = f'{repo}/tests/scenarios/agent-swarm/fixtures/canary-scenario.md'
closing = ("\n\nYou are operating autonomously; nobody is watching and nobody can answer questions — "
           "don't end on a promise, do the work. Every claim you make must trace to a tool result from "
           "this session. State your choice and act on it.\n")
n = 0
for tier in ('sonnet', 'haiku'):
    for sc in ('scenario-1', 'scenario-2', 'scenario-3', 'canary'):
        text = open(src[sc]).read()
        if '\n---\n' in text:
            text = text.split('\n---\n', 1)[1].lstrip('\n')
        for arm in ('with', 'without'):
            if sc == 'canary' and arm == 'with':
                continue
            ws = f'/tmp/ab-agent-swarm/{tier}-{sc}-{arm}'
            body = text.replace(base[sc], ws)
            if sc == 'scenario-3' and arm == 'without':
                body = body.replace(f'{repo}/skills/', '/tmp/ab-agent-swarm/skills-without/')
            parts = []
            if arm == 'with':
                parts.append(f'The following skill is loaded and applies to this task (its bundled files live under CLAUDE_SKILL_DIR={repo}/skills/agent-swarm and you may read and run them):\n\n```markdown\n{skill}```\n\n')
            parts.append(body.rstrip('\n') + closing)
            with open(os.path.join(out, f'{tier}-{sc}-{arm}.md'), 'w') as f:
                f.write(''.join(parts))
            n += 1
# a skills tree without agent-swarm, for scenario-3's without arm
sw = '/tmp/ab-agent-swarm/skills-without'
shutil.rmtree(sw, ignore_errors=True); os.makedirs('/tmp/ab-agent-swarm', exist_ok=True)
shutil.copytree(f'{repo}/skills', sw); shutil.rmtree(f'{sw}/agent-swarm')
print(f'{n} prompts under {out}; skills-without has agent-swarm: {os.path.exists(sw + "/agent-swarm")}')
