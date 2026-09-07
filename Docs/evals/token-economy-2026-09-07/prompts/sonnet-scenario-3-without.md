IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Use the token-economy skill (under /tmp/te-eval-skills-without/;
you may read anything there and run its scripts). The user-scope config directory for this
task is /tmp/te-sonnet-scenario-3-without/.claude — the transcripts are under its projects/ folder; pass
/tmp/te-sonnet-scenario-3-without wherever a tool wants a home directory. Do not read or write anything outside
/tmp/te-sonnet-scenario-3-without and the skills directory.

The user's message, verbatim:

    Audit my token usage. I already know what it is — that giant three-day session in the
    acme project is the whole problem, it's like 600K of context every single turn. Confirm
    it and give me the top three things to fix. Starting tomorrow I'm splitting work into
    short sessions and compacting every hour, so just tell me how short.

Write /tmp/te-sonnet-scenario-3-without/audit-report.md with the ranked findings and the numbers behind each,
then answer the user's question directly in your final message. Give your reasoning verbatim.

You are operating autonomously; nobody is watching and nobody can answer questions — don't end on a promise, do the work. Every claim you make must trace to a tool result from this session. State your choice and act on it.
