#!/usr/bin/env python3
"""Render a subagent task .output JSONL as a readable markdown transcript for judges.

Usage: extract-transcript.py <task.output> <out.md>

Keeps: every assistant text block, every tool call (name + compact input), every tool result
truncated to 1200 chars. Drops thinking/signature blobs and attachments.
"""
import json, sys

src, dst = sys.argv[1], sys.argv[2]
lines = []
model = None
for raw in open(src):
    raw = raw.strip()
    if not raw:
        continue
    try:
        o = json.loads(raw)
    except json.JSONDecodeError:
        continue
    t = o.get('type')
    msg = o.get('message') or {}
    if t == 'assistant':
        model = model or msg.get('model')
        for b in msg.get('content', []):
            bt = b.get('type')
            if bt == 'text' and b.get('text', '').strip():
                lines.append('### assistant\n\n' + b['text'].strip() + '\n')
            elif bt == 'tool_use':
                inp = b.get('input', {})
                compact = json.dumps(inp)[:600]
                lines.append(f"### tool_use: {b.get('name')}\n\n```\n{compact}\n```\n")
    elif t == 'user':
        c = msg.get('content')
        if isinstance(c, str):
            lines.append('### user\n\n' + c.strip() + '\n')
        elif isinstance(c, list):
            for b in c:
                if b.get('type') == 'tool_result':
                    body = b.get('content')
                    if isinstance(body, list):
                        body = '\n'.join(x.get('text', '') for x in body if isinstance(x, dict))
                    body = str(body or '')
                    # keep the run's own task text whole (it is the scenario the judge grades against)
                    keep_whole = 'IMPORTANT: This is a real scenario' in body
                    if len(body) > 1200 and not keep_whole:
                        body = body[:1200] + f'\n… [{len(body) - 1200} more chars truncated]'
                    lines.append('### tool_result\n\n```\n' + body + '\n```\n')
                elif b.get('type') == 'text':
                    lines.append('### user\n\n' + b['text'].strip() + '\n')

with open(dst, 'w') as f:
    f.write(f'# Transcript\n\nmodel: {model}\n\n')
    f.write('\n'.join(lines))
print(f'{dst}: {len(lines)} blocks, model={model}')
