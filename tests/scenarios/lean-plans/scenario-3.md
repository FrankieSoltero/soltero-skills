IMPORTANT: This is a real scenario. Produce the actual plan document you would save,
not a description of your approach.

The spec is at `tests/scenarios/lean-plans/fixtures/notifier-spec.md` (read it).
The plan will be executed by an orchestrator dispatching fresh-context implementer
subagents (each sees only its own task) and read-only reviewer subagents. The
orchestrator is capable of running more than one subagent at a time when that is
safe, and wall-clock time matters: the team wants this executed tonight.

Write the actual plan document now, structured so the orchestrator can execute it
as fast as safely possible.
