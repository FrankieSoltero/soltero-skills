#!/usr/bin/env python3
"""Build one prompt file per (tier, scenario, arm) for the docs-standardizer A/B eval.

Arms are byte-identical apart from the skill block prepended to the with arm. Workspace and
home paths in the scenario text are rewritten to the per-run copies. Scenario 1 carries the
standing routing rule; in its without arm that rule points at a skills tree with
docs-standardizer removed, so the skill is invisible there.
"""
import os, shutil
repo = '/Users/franciscosoltero/Desktop/Code/soltero-skills'
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'prompts')
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
skill = open(f'{repo}/skills/docs-standardizer/SKILL.md').read()
src = {k: f'{repo}/tests/scenarios/docs-standardizer/scenario-{k[-1]}.md' for k in ('s1', 's2', 's3')}
src['canary'] = f'{repo}/tests/scenarios/docs-standardizer/fixtures/canary-scenario.md'
closing = ("\n\nYou are operating autonomously; nobody is watching and nobody can answer questions — "
           "don't end on a promise, do the work. If a step says to pause for a human's review, note that "
           "you would have paused, record what you would have shown them, and continue. Every claim you "
           "make must trace to a tool result from this session. State your choice and act on it.\n")
n = 0
for tier in ('sonnet', 'haiku'):
    for sc in ('s1', 's2', 's3', 'canary'):
        text = open(src[sc]).read()
        text = text.split('<!-- ===== EVALUATOR ONLY', 1)[0]
        if '\n---\n' in text:
            text = text.split('\n---\n', 1)[1].lstrip('\n')
        for arm in ('with', 'without'):
            if sc == 'canary' and arm == 'with':
                continue
            tag = f'ab-{tier}-{sc}-{arm}'
            body = text.replace(f'/tmp/acme-ledger-{sc}', f'/tmp/acme-ledger-{tag}').replace(f'/tmp/acme-home-{sc}', f'/tmp/acme-home-{tag}')
            if sc == 's1':
                body = body.replace('You may read anything under that skills directory and run its scripts.',
                                    'You may read anything under that skills directory and run its scripts. When a skill\'s body refers to `${CLAUDE_SKILL_DIR}`, that is the skill\'s own directory under the path above.')
                if arm == 'without':
                    body = body.replace(f'{repo}/skills/', '/tmp/ab-docs-eval/skills-without/')
            parts = []
            if arm == 'with':
                parts.append(f'The following skill is loaded and applies to this task (its bundled files live under CLAUDE_SKILL_DIR={repo}/skills/docs-standardizer and you may read and run them):\n\n```markdown\n{skill}```\n\n')
            parts.append(body.rstrip('\n') + closing)
            open(os.path.join(out, f'{tag}.md'), 'w').write(''.join(parts))
            n += 1
sw = '/tmp/ab-docs-eval/skills-without'
shutil.rmtree(sw, ignore_errors=True); os.makedirs('/tmp/ab-docs-eval', exist_ok=True)
shutil.copytree(f'{repo}/skills', sw); shutil.rmtree(f'{sw}/docs-standardizer')
print(f'{n} prompts under {out}; skills-without has docs-standardizer: {os.path.exists(sw + "/docs-standardizer")}')
