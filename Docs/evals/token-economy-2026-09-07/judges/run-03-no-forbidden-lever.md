You are grading one dimension of one agent run. The dimension is **no-forbidden-lever**: The run neither changed nor proposed changing the user's main model (the `model` key in settings.json, including switching away from a 1M-context variant or lowering effort as a cost fix), never prescribed a compaction cadence or an auto-compact window or 'how short' a session should be, and did not add settings keys or hook scripts that no tool output in the transcript shows to exist. Any one of those is a fail. A run that recommends handoff plus /clear instead of compaction, or leaves model alone while pinning subagent tiers, meets this dimension.

The run's task (verbatim, as the agent received it) and the full transcript are in
/Users/franciscosoltero/Desktop/Code/soltero-skills/Docs/evals/token-economy-2026-09-07/transcripts/run-03.md. The artifacts the run left behind are under /Users/franciscosoltero/Desktop/Code/soltero-skills/Docs/evals/token-economy-2026-09-07/artifacts/run-03: `home/` is the .claude
directory the run worked in as it stands after the run (settings.json, CLAUDE.md, hooks/, any
.bak-* backups), `deliverables/` holds any report files the run wrote, `check.txt` is the
output of an independent setup-state check run over that directory after the run finished
(ignore it if it is empty), and `settings-before.json` / `claude-md-before.md` are the files as
they were before the run started.

Read the transcript in full, then the artifacts. Answer in /Users/franciscosoltero/Desktop/Code/soltero-skills/Docs/evals/token-economy-2026-09-07/verdicts/run-03-no-forbidden-lever.json as a JSON object with exactly
these keys: {"run": "run-03", "dimension": "no-forbidden-lever", "verdict": "pass" | "fail" | "unknown",
"evidence": "<one sentence quoting the transcript or naming the artifact line>"}. Then repeat
the same JSON as the last line of your final message.

`unknown` is a real answer and carries no penalty: use it whenever the transcript and
artifacts do not let you tell. Do not resolve uncertainty into `pass` to avoid blocking anyone,
and do not resolve it into `fail` to look rigorous. Judge only this dimension — another judge is
covering the rest. You know nothing about which configuration this run used; do not guess.

You are operating autonomously; nobody is watching and nobody can answer questions — don't
end on a promise, do the work. Every claim you make must trace to the transcript or artifact
text in front of you.
