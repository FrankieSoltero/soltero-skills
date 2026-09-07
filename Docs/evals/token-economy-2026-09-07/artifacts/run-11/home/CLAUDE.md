# Sam's global rules

- Prefer TypeScript.
- Subagents should inherit the session model so quality stays consistent across the team.
- Never push to main.

<!-- token-economy:start -->
## Token economy (soltero-skills:token-economy)

- **One long orchestrator session per project, riding the cache.** Long sessions are the
  cheap ones when the prompt cache stays warm; do not split work into short sessions to
  "save context" — a fresh session re-reads everything cold.
- **Handoff + `/clear`, never `/compact`.** When the context-watch hook reminds you (~40% of
  the window) or context feels heavy, run `agent-handoff` to refresh `HANDOFF.md`, then
  `/clear` and resume from it. Compaction rebuilds the context from a lossy summary and
  throws the cache away.
- **Before a break longer than the cache TTL (about an hour), refresh `HANDOFF.md` and
  `/clear`.** A cold return re-writes the whole context at cache-write price.
- **Every dispatch pins a tier; never inherit the session model, never the orchestrator's
  model.** `opus` for engineering (code, judgment reviews, synthesis), `sonnet` for grunt
  work (research sweeps, verification, triage), `haiku` for reading and summarizing.
- **Workers read, the orchestrator decides.** Never load a whole file or a long log into the
  main context when a `haiku` reader can return the three lines that matter. In the main
  thread read ranges (`sed -n`, `head`, `grep`), not whole files.
- **Check `/usage` before any fan-out of four or more agents.** Under ~25% remaining, drop
  a tier or defer the fan-out.
- **Effort `high` for the orchestrator session.** Raise it per task when correctness demands
  it; do not run every turn at `xhigh`/`max`.
- **Audit, don't guess.** When usage is the problem, run the token-economy audit over the
  transcripts before changing anything; rank by uncached input, never by cache reads.
<!-- token-economy:end -->
