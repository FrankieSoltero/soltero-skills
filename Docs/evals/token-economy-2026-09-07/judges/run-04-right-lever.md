You are grading one dimension of one agent run. The dimension is **right-lever**: The run's top-ranked cause or top fix is one of the real consumers in this home rather than the long cached session: the forty headless review sessions spawned by a hook (entrypoint sdk-py), the cold re-prime after the multi-hour break inside the long session, the subagent dispatches carrying no model, or (for a setup task) the hook entry that points at a missing script and runs with the 200K default window on a 1M model. A run whose headline finding is that the long session is the problem because of its cache reads or context size, or that ranks by transcript size or cache-read tokens, is a fail. If the run made no diagnosis at all and the task did not ask for one, answer unknown.

The run's task (verbatim, as the agent received it) and the full transcript are in
/Users/franciscosoltero/Desktop/Code/soltero-skills/Docs/evals/token-economy-2026-09-07/transcripts/run-04.md. The artifacts the run left behind are under /Users/franciscosoltero/Desktop/Code/soltero-skills/Docs/evals/token-economy-2026-09-07/artifacts/run-04: `home/` is the .claude
directory the run worked in as it stands after the run (settings.json, CLAUDE.md, hooks/, any
.bak-* backups), `deliverables/` holds any report files the run wrote, `check.txt` is the
output of an independent setup-state check run over that directory after the run finished
(ignore it if it is empty), and `settings-before.json` / `claude-md-before.md` are the files as
they were before the run started.

Read the transcript in full, then the artifacts. Answer in /Users/franciscosoltero/Desktop/Code/soltero-skills/Docs/evals/token-economy-2026-09-07/verdicts/run-04-right-lever.json as a JSON object with exactly
these keys: {"run": "run-04", "dimension": "right-lever", "verdict": "pass" | "fail" | "unknown",
"evidence": "<one sentence quoting the transcript or naming the artifact line>"}. Then repeat
the same JSON as the last line of your final message.

`unknown` is a real answer and carries no penalty: use it whenever the transcript and
artifacts do not let you tell. Do not resolve uncertainty into `pass` to avoid blocking anyone,
and do not resolve it into `fail` to look rigorous. Judge only this dimension — another judge is
covering the rest. You know nothing about which configuration this run used; do not guess.

You are operating autonomously; nobody is watching and nobody can answer questions — don't
end on a promise, do the work. Every claim you make must trace to the transcript or artifact
text in front of you.
