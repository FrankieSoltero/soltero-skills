#!/usr/bin/env node
// OPT-IN PreToolUse hook: when a Bash command matches a destructive shape, ask for
// confirmation and remind the session to run the destructive-op-gate skill first.
//
// This is NOT installed by the skill and NOT installed by the plugin. Nothing runs it
// unless a human adds it to their own settings.json — see ../reference.md.
//
// Honest caveats, in the same spirit as the skill itself:
//   - It reads shell text, not intent. It cannot see the resolved connection string, the
//     row count, or whether a rollback export exists, so it cannot decide anything; it can
//     only route a command into the gate. Expect false positives.
//   - It is a speed bump, not a security boundary: it only sees Bash tool calls, so a
//     destructive write issued through an MCP database tool, a Node script, or an ORM call
//     passes it untouched. Do not treat a quiet hook as evidence that a write is safe.
//   - On an internal error it stays silent and allows the call rather than wedging the
//     session. That is a deliberate trade, and another reason it is not a boundary.
//
// Config via env (set in the hook's settings entry):
//   DOG_GUARD_MODE   ask (default) | deny | off
import { matchDestructiveShapes } from '../scripts/destructive-shapes.mjs';
import { readFileSync } from 'node:fs';

function emit(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  }));
}

try {
  const mode = (process.env.DOG_GUARD_MODE || 'ask').toLowerCase();
  if (mode === 'off') process.exit(0);

  let input = {};
  try {
    input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    process.exit(0);
  }
  if (input.tool_name !== 'Bash') process.exit(0);

  const command = input.tool_input?.command ?? '';
  const hits = matchDestructiveShapes(command);
  if (hits.length === 0) process.exit(0);

  const findings = hits.map((h) => `  - ${h.id}: ${h.why}`).join('\n');
  const reason =
    `This command matches a destructive shape the destructive-op-gate skill exists for:\n${findings}\n\n` +
    `Before running it: resolve what the target actually is from the connection string or ` +
    `config file (not from what the conversation says it is), enumerate the affected rows ` +
    `by id, run the count-only dry run and confirm it matches, and put a rollback artifact ` +
    `on disk. If the resolved target is production, the operation also needs typed human ` +
    `approval and a record under Docs/destructive-ops/. If this hit is a false positive — ` +
    `the target is local, or nothing is actually destroyed — say so explicitly and proceed.`;

  emit(mode === 'deny' ? 'deny' : 'ask', reason);
  process.exit(0);
} catch {
  process.exit(0);
}
