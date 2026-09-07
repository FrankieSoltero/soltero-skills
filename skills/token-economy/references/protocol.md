# The token-economy protocol

This is the block `economy-setup.mjs` installs into `~/.claude/CLAUDE.md` between
`<!-- token-economy:start -->` and `<!-- token-economy:end -->`. The script reads the block
from this file, so the text below is the single source of truth. Everything after the block
is commentary on why each line exists (numbers from `references/findings-2026-09.md`).

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

## Why each line

| Line | Evidence |
|---|---|
| Long sessions ride the cache | Sessions with peak context ≥400K had a 98.3% hit ratio and 7K uncached tokens per turn — the same uncached cost per turn as short sessions, with every prior read served from cache. |
| Handoff + `/clear`, never `/compact` | 1 compaction in 479 sessions; 411 `HANDOFF.md` writes; `/clear` typed 84 times, `/compact` twice. Compaction breaks the cache prefix and loses detail the handoff keeps on disk. |
| Break longer than the TTL | 71 in-session gaps over an hour cost 22.8M uncached tokens — 13.7% of all uncached input — because each return re-wrote a 500–900K context. |
| Pin every dispatch | 998 of 1,000 dispatches carried an explicit model; the user's own words: "using fable for each of the sub agents will kill our usage". |
| Workers read | 47% of main-thread tool calls were Bash reads with ranges; 1,000 dispatches with a 2.7K-char median brief returned reports, not files. |
| `/usage` before fan-outs | Typed 86 times, most often right before a prompt that dispatched agents. |
| Effort `high` | `effortLevel: "high"` at user scope, `/effort` used to raise it per task. |
| Audit, don't guess | The largest lever (headless review sessions, 23% of uncached input) was invisible from inside any chat and only showed up in the transcript scan. |
