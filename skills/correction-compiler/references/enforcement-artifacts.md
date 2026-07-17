# Choosing and Drafting the Enforcement Artifact

Deterministic enforcement lives in read-only-to-the-agent config, not in agent-written
memory. Pick the narrowest mechanism that makes the mistake *impossible*, not merely
discouraged.

## Which artifact

| Mistake class | Artifact |
|---------------|----------|
| A command the agent must never run (e.g. `prisma db push`, forced `git clean`) | **hook** — PreToolUse Bash matcher in `.claude/settings.json` |
| A required follow-up after a tool action (e.g. format after write) | **hook** — PostToolUse |
| A code pattern that must not land (e.g. `console.log`, `any`, secret literals) | **lint** — rule in the project's linter config, wired into pre-commit/CI |
| A repo-level invariant lint can't see (e.g. migration accompanies schema change, file-size budget) | **ci** — a check in the CI workflow |

Prefer lint/CI over hooks when both work: they are versioned with the repo, reviewed in
PRs, and protect every contributor, not just this agent. Use a hook when the mistake
happens *before* anything is committed (dangerous shell commands) or must stop the agent
mid-session.

## Drafting a hook proposal

Draft the exact JSON for the ledger entry / approval message, e.g.:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | grep -qE '<pattern>' && { echo 'Blocked: CC-NNN <title>' >&2; exit 2; } || exit 0"
          }
        ]
      }
    ]
  }
}
```

- Have the block message name the Rule ID so a blocked run is traceable to the ledger.
- Enumerate command variants in the pattern (package-runner prefixes, flag orderings)
  and list, in the approval message, what the pattern does NOT catch plus any
  false-positive risk — the human approves with eyes open.
- One hook command per rule. Never fold multiple rules into one matcher command:
  refining one rule must not touch another rule's enforcement.

## Install (after human approval only)

- Hooks: delegate the `.claude/settings.json` write to the harness's `update-config`
  skill — this skill never edits settings files itself.
- Lint/CI: apply the config diff exactly as approved, in its own change set.
- Then update the ledger entry: Status → `installed (approved by <who>, <date>)`,
  Enforcement → where it now lives.

## Refining an installed artifact

The previously approved version keeps running until the refinement is approved. Draft
the replacement hook/pattern in the ledger entry (or a file nothing executes); do not
edit the live hook script, settings.json, lint config, or CI workflow until approval.
