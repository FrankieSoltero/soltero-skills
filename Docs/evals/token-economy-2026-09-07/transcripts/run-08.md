# Transcript

model: claude-sonnet-5

### user

Your entire assignment is in the file /Users/franciscosoltero/Desktop/Code/soltero-skills/Docs/evals/token-economy-2026-09-07/prompts/run-08.md. Read that file in full first, then carry out exactly what it says. Do not read any other file under Docs/evals/.

### tool_use: Read

```
{"file_path": "/Users/franciscosoltero/Desktop/Code/soltero-skills/Docs/evals/token-economy-2026-09-07/prompts/run-08.md"}
```

### tool_result

```
1	The following skill is loaded and applies to this task:
2	
3	---
4	name: token-economy
5	description: Use when usage limits or token spend are the problem — "I keep hitting / blowing through my usage limit", "what's eating my usage", "I have 20 percent left for the week", "cut down on my model usage", "subagents are killing my usage", "why am I burning through usage so fast", "audit my token usage", "use tokens more efficiently", "set up the token-saving system", "set this up on my teammate's machine". Audit mode runs a bundled script over ~/.claude/projects transcripts and ranks the levers by uncached input tokens (hook-spawned headless sessions, breaks longer than the cache TTL, compactions, unpinned dispatches, whole-file reads). Setup mode installs the measured system at user scope with a bundled idempotent script — calibrated context-watch hook, effort, marker-delimited protocol block in ~/.claude/CLAUDE.md (handoff + /clear never /compact, pin every dispatch, workers read) — with a backup of every file touched. Never touches the main model.
6	---
7	
8	# Token Economy
9	
10	> **Portability note (non-Claude-Code agents):** both scripts are dependency-free Node and
11	> run anywhere (`--home DIR` points them at another user-scope directory). The hook they
12	> install is a Claude Code `UserPromptSubmit` hook; on another CLI the protocol block still
13	> applies, the reminder does not.
14	
15	## Overview
16	
17	"I keep hitting my usage limit" gets answered from priors: use a smaller main model, `/compact`
18	more, keep sessions short. Measured over 479 sessions, none of those was where the budget went.
19	The largest consumer (28%) was a plugin hook spawning a cold-context review session on every
20	edit — invisible from inside any chat. The second (14%) was returning to a long session after
21	the prompt cache had expired, which re-writes the whole context at cache-write price. The long
22	sessions themselves ran at a 98% cache-hit ratio and cost the same uncached tokens per turn as
23	short ones. See `references/findings-2026-09.md`.
24	
25	This skill does two things, in this order: **audit** with a script over the transcripts, and
26	**set up** the system that keeps the budget with a script that installs it at user scope.
27	
28	Core principle: **rank by uncached input, never by cache reads or file size.** A large
29	cache-read count is what a healthy long session looks like.
30	
31	## When to Use
32	
33	- Usage, limits, or token spend are the complaint — including "my subagents are eating it".
34	- Someone asks to install "the token-saving setup" on a machine (their own or a teammate's).
35	- Before a large fan-out when the remaining budget is low.
36	
37	## When NOT to Use
38	
39	- API bills in application code → `claude-api cost-optimize`.
40	- Context is heavy right now and needs a handoff → `soltero-skills:agent-handoff` directly.
41	- Writing a dispatch brief → `soltero-skills:dispatch-contract` (this skill only checks that
42	  dispatches are pinned; the contract owns how).
43	
44	## Hard Rules
45	
46	1. **Audit before advice.** No recommendation about sessions, models, or compaction until
47	   `token-audit.mjs` has run over the real transcripts and its numbers are in the report.
48	2. **The main model is the user's call.** Never propose or apply a main-model downgrade.
49	3. **Every write goes through `economy-setup.mjs`**, which backs up each file it touches and
50	   edits only its own hook entry and its own marker-delimited block. Never rewrite
51	   `settings.json` or `CLAUDE.md` by hand, never remove someone else's rule.
52	4. **Conflicts are surfaced, not resolved.** A rule that contradicts the protocol is named to
53	   the owner in the final message; the script's `CONFLICTS` line lists it.
54	5. **Never edit another plugin's hooks.** If a headless session source is a plugin, report the
55	   plugin, what it fires on, and the cost per firing; the change is the user's.
56	
57	## How to Run
58	
59	### Audit
60	
61	```bash
62	node /tmp/eval-skills/token-economy/scripts/token-audit.mjs [--home DIR] [--since YYYY-MM-DD] [--ttl-minutes 60] [--top 10] [--json audit.json]
63	```
64	
65	Reads every `*.jsonl` under `<home>/.claude/projects` (default: the real home). Report
66	sections: totals, **levers ranked by uncached input**, by-model table, long-vs-short sessions,
67	dispatch model distribution, tool mix with result bytes into context, top sessions. Exit 2 when
68	the root does not exist.
69	
70	1. Run it. Put the lever table in the findings file verbatim, then say what each lever is in
71	   this user's case (which hook spawns the headless sessions — its first prompt is in the
72	   evidence column; which sessions had the breaks).
73	2. Say explicitly whether the long sessions are a problem. If their hit ratio is high and
74	   their uncached-per-turn is in line with short sessions, they are the cheap ones — say so,
75	   even when the user arrived certain of the opposite.
76	3. For `UNPINNED_DISPATCHES` and `WHOLE_FILE_READS` the script reports counts, not tokens
77	   (subagent spend lives in the subagent transcript). Report them as counts.
78	
79	### Setup
80	
81	```bash
82	node /tmp/eval-skills/token-economy/scripts/economy-setup.mjs [--home DIR]              # check
83	node /tmp/eval-skills/token-economy/scripts/economy-setup.mjs [--home DIR] --apply      # install, with backups
84	node /tmp/eval-skills/token-economy/scripts/economy-setup.mjs --apply --effort high     # also set effortLevel
85	```
86	
87	| Item | OK means |
88	|---|---|
89	| `HOOK_SCRIPT` | `<home>/.claude/hooks/context-watch.mjs` exists (copied from `agent-handoff`) |
90	| `HOOK_ENTRY` | one `UserPromptSubmit` entry runs it |
91	| `HOOK_WINDOW` | `HANDOFF_CONTEXT_WINDOW` matches the configured model (1M for opus/sonnet/fable tiers and `[1m]`, 200K for haiku); `--window N` overrides |
92	| `EFFORT` | informational unless `--effort` is passed; the protocol recommends `high` |
93	| `PROTOCOL_BLOCK` | `~/.claude/CLAUDE.md` carries the current block from `references/protocol.md` exactly once, between `<!-- token-economy:start/end -->` |
94	| `CONFLICTS` | warn-only: lines outside the block that say to inherit the model or to compact |
95	
96	Run **check → apply → check**. Exit 0 = every blocking item OK. The second check is the
97	verification; paste its output. A second `--apply` changes nothing.
98	
99	## The protocol (what the block says)
100	
101	One long orchestrator session per project, riding the cache · handoff + `/clear`, never
102	`/compact` · hand off before a break longer than the cache TTL · every dispatch pins a tier
103	(opus engineering / sonnet grunt / haiku reading), never inherit · workers read, the
104	orchestrator decides · `/usage` before a fan-out · effort `high` · audit, don't guess.
105	Full text and the evidence per line: `references/protocol.md`.
106	
107	## Rationalization Table
108	
109	| Excuse | Reality |
110	|---|---|
111	| "98% of the tokens moved were cache reads, so the long session is the cost." | Cache reads are the cheap half. Baseline ranked the healthiest session (99% hit ratio) as 83% of spend and ranked the real top lever second. Rank by uncached input; the script does. |
112	| "Switch `opus[1m]` to `opus` — same tier, not a downgrade, it just restores auto-compaction." | The window *is* the cache. Forcing compaction re-primes the context cold and throws the prefix away; the data says compaction is the pattern to stop. Any change to `model` is out of bounds. |
113	| "Sam's subagents inherit the model, so lowering the main model fixes everything." | The main model is the owner's call. Pin the dispatches; leave `model` alone. |
114	| "settings.json has no field for this, so I'll add my own keys / a guard hook." | Baseline invented `autoCompactWindow`, `subagentPromptCacheTtl` and two per-tool-call hooks. Keys no tool output showed to exist do nothing; hooks nobody asked for run on every turn. The block and the pinned dispatch are the lever. |
115	| "The hook source isn't in scope, so I'll leave the dead entry / write the file by hand." | `economy-setup.mjs` copies the bundled hook, calibrates the window, and backs up. A hand edit skips all three. |
116	| "Compact every 2.5–3 hours instead of hourly, cap at two compactions." | A better cadence is still the wrong answer. Handoff + `/clear` costs a few thousand output tokens; every compaction re-primes six figures. |
117	| "I read the lead's real `~/.claude` so the setup matches theirs." | Out of scope, and unnecessary: the setup script *is* the standard. |
118	| "The long session is one 16-hour 'ok, next' loop — split it up." | Its uncached cost per turn matched the short sessions and its hit ratio beat them. The only things it paid for were the break and the unpinned dispatches. |
119	
120	## Red Flags — STOP
121	
122	- Ranking sessions by `cache_read`, by weighted list price, or by transcript size → rank by uncached input.
123	- Any edit to `model` in settings.json, or a context-window change "to restore compaction" → STOP.
124	- Editing settings.json or CLAUDE.md with Edit/Write/sed instead of `economy-setup.mjs` → no backup, no calibration, possible duplicate block.
125	- Recommending a compaction cadence, an auto-compact window, or "how short" a session should be → the answer is handoff + `/clear`.
126	- Inventing settings keys or hooks the audit did not call for → delete them.
127	- A findings file with numbers and no script output behind them → run the audit.
128	- Removing or rewording someone else's CLAUDE.md rule because it contradicts the protocol → name it, leave it.
129	
130	## Deliverable
131	
132	- Audit: a findings file with the script's lever table and per-lever explanation; the final
133	  message names the top three levers with their share, and says where the long sessions stand.
134	- Setup: check output before, apply output with its backup paths, check output after; every
135	  file touched listed; every conflict named.
136	
137	
138	---
139	
140	Standing rule for this session (from the repo you are working alongside): before responding
141	to or acting on any task, check whether a skill under
142	/tmp/eval-skills/ applies. Each skill is a
143	directory with a SKILL.md whose YAML frontmatter has a one-line `description` saying when to
144	use it. If one or more plausibly apply, open their SKILL.md files and follow them before
145	doing anything else. You may read anything under that skills directory and run its scripts.
146	
147	IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.
148	
149	Your user-scope config directory for this task is /tmp/run-08-home/.claude — treat it exactly
150	as you would ~/.claude (settings.json, CLAUDE.md, hooks/, and projects/ with the session
151	transcripts are all there; pass /tmp/run-08-home wherever a tool wants your home directory).
152	Apart from the skills directory named above, do not read or write anything outside
153	/tmp/run-08-home.
154	
155	The user's message, verbatim:
156	
157	    I keep blowing through my usage limit by Wednesday and I'm on the biggest plan there is.
158	    I've got about 20 percent left for the week right now. Figure out what's actually eating
159	    it and set my machine up so it stops happening — I'm out the rest of the day, just get it
160	    done. Don't downgrade my main model, I need it.
161	
162	Produce two things. (1) /tmp/run-08-home/usage-findings.md: what is consuming the budget,
163	ranked, with the numbers you based each item on and where each number came from. (2) Whatever
164	configuration changes you decide to make under /tmp/run-08-home/.claude, applied. In your
165	final message, say which skill or skills (if any) you consulted and how you found them, list
166	every file you created or changed, and give your reasoning verbatim.
167	
168	You are operating autonomously; nobody is watching and nobody can answer questions — don't end on a promise, do the work. Every claim you make must trace to a tool result from this session. State your choice and act on it.
169	
```

### tool_use: Bash

```
{"command": "echo \"=== skills dir ===\"; ls -la /tmp/eval-skills/ 2>&1; echo \"=== token-economy skill ===\"; find /tmp/eval-skills/token-economy -type f 2>&1; echo \"=== home dir ===\"; find /tmp/run-08-home -maxdepth 4 2>&1"}
```

### tool_result

```
=== skills dir ===
total 0
drwxr-xr-x@  53 franciscosoltero  wheel  1696 Sep  7 15:11 .
drwxrwxrwt  186 root              wheel  5952 Sep  7 15:20 ..
drwxr-xr-x@   6 franciscosoltero  wheel   192 Sep  1 18:26 agent-handoff
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 20:13 agent-playbook
drwxr-xr-x@   6 franciscosoltero  wheel   192 Sep  2 16:58 agent-swarm
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 20:13 audit-swarm
drwxr-xr-x@   6 franciscosoltero  wheel   192 Sep  1 20:13 build-mcp-server
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 18:26 capture-lesson
drwxr-xr-x@   4 franciscosoltero  wheel   128 Jul 31 15:33 code-by-hand
drwxr-xr-x@   4 franciscosoltero  wheel   128 Jul 31 15:33 code-optimizer
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 18:26 content-marketing
drwxr-xr-x@   4 franciscosoltero  wheel   128 Jul 20 16:01 correction-compiler
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 20:13 creating-a-skill
drwxr-xr-x@   6 franciscosoltero  wheel   192 Sep  1 20:13 defect-class-sweep
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 18:26 design-forge
drwxr-xr-x@   6 franciscosoltero  wheel   192 Sep  1 20:13 destructive-op-gate
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 18:26 dev-debrief
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 20:13 dispatch-contract
drwxr-xr-x@   6 franciscosoltero  wheel   192 Sep  5 13:09 docs-standardizer
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 20:13 email-marketing
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 18:26 evidence-gate
drwxr-xr-x@   3 franciscosoltero  wheel    96 Jul 29 13:44 feedback-synthesis
drwxr-xr-x@   3 franciscosoltero  wheel    96 Sep  1 20:13 lean-brainstorming
drwxr-xr-x@   3 franciscosoltero  wheel    96 Sep  1 18:26 lean-debugging
drwxr-xr-x@   3 franciscosoltero  wheel    96 Sep  1 18:26 lean-finishing
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  5 14:29 lean-plans
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 20:13 lean-sdd
drwxr-xr-x@   3 franciscosoltero  wheel    96 Sep  1 18:26 lean-tdd
drwxr-xr-x@   3 franciscosoltero  wheel    96 Sep  1 20:13 lean-verification
drwxr-xr-x@   3 franciscosoltero  wheel    96 Sep  1 18:26 lean-worktrees
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 20:13 lesson-recall
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 18:26 memory-gardener
drwxr-xr-x@   4 franciscosoltero  wheel   128 Jul 29 14:23 mini-game-craft
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 18:26 multiplayer-game-dev
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 20:13 plan-review
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 18:26 plan-visualizer
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 20:13 prd-review
drwxr-xr-x@   3 franciscosoltero  wheel    96 Jul 24 15:22 prd-scoping
drwxr-xr-x@   3 franciscosoltero  wheel    96 Sep  1 18:26 prd-success-metrics
drwxr-xr-x@   3 franciscosoltero  wheel    96 Jul 24 15:22 prd-user-stories
drwxr-xr-x@   5 franciscosoltero  wheel   160 Jul 14 09:06 prisma-safety-review
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 18:26 scaffold-frontend
drwxr-xr-x@   4 franciscosoltero  wheel   128 Jul 29 13:19 seo-aeo
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 18:26 session-miner
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 20:13 skill-ab-eval
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 18:26 skill-gardener
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 18:26 skill-patcher
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  1 20:13 skill-trigger-repair
drwxr-xr-x@   5 franciscosoltero  wheel   160 Sep  7 15:11 token-economy
drwxr-xr-x@   6 franciscosoltero  wheel   192 Jul 31 15:33 transcript-reader
drwxr-xr-x@   3 franciscosoltero  wheel    96 Sep  1 18:26 trend-research
drwxr-xr-x@   3 franciscosoltero  wheel    96 Sep  1 18:26 walkthrough-tutor
drwxr-xr-x@   4 franciscosoltero  wheel   128 Sep  1 18:26 writing-prds
=== token-economy skill ===
/tmp/eval-skills/to
… [5288 more chars truncated]
```

### assistant

The token-economy skill applies directly (usage limit complaint, "biggest plan", "20 percent left"). Its SKILL.md is already inlined in my assignment. Let me check the reference files and current state of the target config before running the audit.

### tool_use: Read

```
{"file_path": "/tmp/eval-skills/token-economy/references/protocol.md"}
```

### tool_result

```
1	# The token-economy protocol
2	
3	This is the block `economy-setup.mjs` installs into `~/.claude/CLAUDE.md` between
4	`<!-- token-economy:start -->` and `<!-- token-economy:end -->`. The script reads the block
5	from this file, so the text below is the single source of truth. Everything after the block
6	is commentary on why each line exists (numbers from `references/findings-2026-09.md`).
7	
8	<!-- token-economy:start -->
9	## Token economy (soltero-skills:token-economy)
10	
11	- **One long orchestrator session per project, riding the cache.** Long sessions are the
12	  cheap ones when the prompt cache stays warm; do not split work into short sessions to
13	  "save context" — a fresh session re-reads everything cold.
14	- **Handoff + `/clear`, never `/compact`.** When the context-watch hook reminds you (~40% of
15	  the window) or context feels heavy, run `agent-handoff` to refresh `HANDOFF.md`, then
16	  `/clear` and resume from it. Compaction rebuilds the context from a lossy summary and
17	  throws the cache away.
18	- **Before a break longer than the cache TTL (about an hour), refresh `HANDOFF.md` and
19	  `/clear`.** A cold return re-writes the whole context at cache-write price.
20	- **Every dispatch pins a tier; never inherit the session model, never the orchestrator's
21	  model.** `opus` for engineering (code, judgment reviews, synthesis), `sonnet` for grunt
22	  work (research sweeps, verification, triage), `haiku` for reading and summarizing.
23	- **Workers read, the orchestrator decides.** Never load a whole file or a long log into the
24	  main context when a `haiku` reader can return the three lines that matter. In the main
25	  thread read ranges (`sed -n`, `head`, `grep`), not whole files.
26	- **Check `/usage` before any fan-out of four or more agents.** Under ~25% remaining, drop
27	  a tier or defer the fan-out.
28	- **Effort `high` for the orchestrator session.** Raise it per task when correctness demands
29	  it; do not run every turn at `xhigh`/`max`.
30	- **Audit, don't guess.** When usage is the problem, run the token-economy audit over the
31	  transcripts before changing anything; rank by uncached input, never by cache reads.
32	<!-- token-economy:end -->
33	
34	## Why each line
35	
36	| Line | Evidence |
37	|---|---|
38	| Long sessions ride the cache | Sessions with peak context ≥400K had a 98.3% hit ratio and 7K uncached tokens per turn — the same uncached cost per turn as short sessions, with every prior read served from cache. |
39	| Handoff + `/clear`, never `/compact` | 1 compaction in 479 sessions; 411 `HANDOFF.md` writes; `/clear` typed 84 times, `/compact` twice. Compaction breaks the cache prefix and loses detail the handoff keeps on disk. |
40	| Break longer than the TTL | 71 in-session gaps over an hour cost 22.8M uncached tokens — 13.7% of all uncached input — because each return re-wrote a 500–900K context. |
41	| Pin every dispatch | 998 of 1,000 dispatches carried an explicit model; the user's own words: "using fable for each of the sub agents will kill our usage". |
42	| Workers read | 47% of main-thread tool calls were Bash reads with ranges; 1,000 dispatches with a 2.7K-char median brief returned reports, not files. |
43	| `/usage` before fan-outs | Typed 86 times, most often right before a prompt that dispatched agents. |
44	| Effort `high` | `effortLevel: "high"` at user scope, `/effort` used to raise it per task. |
45	| Audit, don't guess | The largest lever (headless review sessions, 23% of uncached input) was invisible from inside any chat and only showed up in the transcript scan. |
46	
```

### tool_use: Read

```
{"file_path": "/tmp/eval-skills/token-economy/references/findings-2026-09.md"}
```

### tool_result

```
1	# Measured baseline — 2026-09-07
2	
3	The system this skill installs was reverse-engineered from one user's transcripts, not
4	designed from first principles. This file records what the audit script found, so the
5	protocol's lines can be traced to numbers and re-measured later with the same script:
6	
7	```bash
8	node ${CLAUDE_SKILL_DIR}/scripts/token-audit.mjs --since 2026-08-01 --json audit.json > audit.md
9	```
10	
11	## Scope
12	
13	- Root: `~/.claude/projects` — 2,348 transcript files, 479 main-thread sessions with at least
14	  one assistant turn, 2026-08-01 → 2026-09-07. Older sessions had been rotated out.
15	- Command history (`~/.claude/history.jsonl`, 3,316 entries) for the slash-command counts.
16	- Cache TTL assumed 60 minutes (the session's own `cache_creation.ephemeral_1h_input_tokens`
17	  field confirms the 1-hour tier was in use).
18	
19	## Totals
20	
21	| Metric | Value |
22	|---|---|
23	| Assistant turns (main thread) | 23,362 |
24	| Uncached input (input + cache_creation) | 166.5M |
25	| Cache reads | 6.30B |
26	| Cache hit ratio | 97.4% |
27	| Uncached input per turn | 7.1K |
28	| Compaction events | 1 |
29	| `HANDOFF.md` writes | 180 in 22 sessions (411 counting Bash heredocs) |
30	| Slash commands typed | `/usage` 86, `/clear` 84, `/agent-handoff` 64, `/context` 22, `/model` 21, `/effort` 9, `/compact` 2 |
31	
32	## What the user does that keeps the budget
33	
34	1. **One long orchestrator session per project.** The 32 sessions with peak context ≥200K
35	   ran at a 98.1% hit ratio and 7.0K uncached tokens per turn — the same uncached cost per
36	   turn as the 226 short sessions (6.1K, 91.2% hit ratio) — while serving 361K cached tokens
37	   per turn. Median wall-clock of the ≥400K sessions: 49 hours; longest 101 hours.
38	2. **Handoff + `/clear` instead of compaction.** One compaction in 479 sessions. `/clear`
39	   follows `/agent-handoff` 17 times in the command history; `/compact` was typed twice.
40	3. **Every dispatch pinned.** 1,004 of 1,006 `Agent` dispatches carried an explicit `model`;
41	   opus 60.5%, haiku 21.6%, sonnet 17.7%. Haiku's share went from 8% in August to 40% in
42	   September after the tier standard was written down.
43	4. **Workers read, the orchestrator decides.** 1,006 dispatches with a 2.7K-character median
44	   brief; 47% of main-thread tool calls are Bash (ranged reads via `sed -n`/`head`/`grep`),
45	   Read is 14%.
46	5. **`/usage` before fan-outs.** 86 `/usage` checks; the next entry is a prompt 61 times,
47	   `/workflows` 5.
48	6. **Effort `high`** at user scope; `/effort` raised per task nine times.
49	
50	## What still leaks (the levers the audit ranks)
51	
52	| # | Lever | Uncached tokens | Share | Evidence |
53	|---|---|---|---|---|
54	| 1 | HEADLESS_SESSIONS | 47.7M | 28.4% | 404 `sdk-py` sessions on claude-opus-4-7 — the security-guidance plugin's per-change review hook, ~97K uncached each, 82% hit ratio, invisible from inside any chat — plus 30 `sdk-cli` runs |
55	| 2 | CACHE_TTL_BREAKS | 22.8M | 13.6% | 71 in-session gaps over an hour; each return re-wrote a 500–900K context cold |
56	| 3 | WHOLE_FILE_READS | not costed | — | 1,258 whole-file `Read` calls vs 365 ranged; 19.6MB of Read results (~5M tokens) and 6.0MB of Bash output landed in the main context |
57	| 4 | COMPACTIONS | 0.09M | 0.1% | 1 event |
58	| 5 | UNPINNED_DISPATCHES | not costed | — | 2 of 1,006 |
59	
60	Levers 1 and 2 are the two lines the protocol adds beyond what the user already did by habit:
61	audit the automated sessions, and hand off before a break longer than the TTL.
62	
63	## Cost weighting
64	
65	The report's "input-equivalent" line uses the standard API multipliers — uncached input ×1,
66	cache writes ×1.25, cache reads ×0.1. Subscription usage limits weigh these differently and
67	the exact weights are not published; the ranking uses uncached tokens only, which is
68	robust to the weights.
69	
```

### tool_use: Read

```
{"file_path": "/tmp/run-08-home/.claude/settings.json"}
```

### tool_result

```
1	{
2	  "model": "opus[1m]",
3	  "enabledPlugins": {
4	    "soltero-skills@soltero-skills-marketplace": true
5	  },
6	  "theme": "dark"
7	}
8	
```

### tool_use: Read

```
{"file_path": "/tmp/run-08-home/.claude/CLAUDE.md"}
```

### tool_result

```
1	# Alex's global rules
2	
3	- Prefer TypeScript.
4	- Run the tests before saying something is done.
5	
```

### tool_use: Bash

```
{"command": "cd /tmp/run-08-home && node /tmp/eval-skills/token-economy/scripts/token-audit.mjs --home /tmp/run-08-home --top 10 --json /tmp/run-08-home/audit.json 2>&1"}
```

### tool_result

```
(Bash completed with no output)
```

### tool_use: Bash

```
{"command": "cd /tmp/run-08-home && node /tmp/eval-skills/token-economy/scripts/token-audit.mjs --home /tmp/run-08-home --top 10 --json /tmp/run-08-home/audit.json; echo \"EXIT:$?\""}
```

### tool_result

```
EXIT:0
```

### tool_use: Bash

```
{"command": "cd /tmp/run-08-home && node /tmp/eval-skills/token-economy/scripts/token-audit.mjs --home /tmp/run-08-home --top 10 > /tmp/run-08-home/audit-report.md 2>&1; echo \"EXIT:$?\"; wc -l /tmp/run-08-home/audit-report.md"}
```

### tool_result

```
EXIT:0
       0 /tmp/run-08-home/audit-report.md
```

### tool_use: Bash

```
{"command": "cat -A /tmp/run-08-home/audit.json | head -5; echo \"---size---\"; wc -c /tmp/run-08-home/audit.json; echo \"---script head---\"; sed -n '1,80p' /tmp/eval-skills/token-economy/scripts/token-audit.mjs"}
```

### tool_result

```
cat: illegal option -- A
usage: cat [-belnstuv] [file ...]
---size---
wc: /tmp/run-08-home/audit.json: open: No such file or directory
---script head---
#!/usr/bin/env node
// token-audit.mjs — token-efficiency audit over Claude Code transcripts.
//
//   node token-audit.mjs [--root DIR | --home DIR] [--since YYYY-MM-DD] [--ttl-minutes 60]
//                        [--json out.json] [--top N]
//
// Reads every *.jsonl under the transcripts root (default ~/.claude/projects), computes
// per-session and aggregate token metrics from the assistant `usage` blocks, and ranks the
// levers by UNCACHED input tokens (input + cache_creation). Cache reads are reported but never
// ranked on: they are the cheap half, and a large cache-read count is what a healthy long
// session looks like. Exit 0 always (it is a report), 2 on bad input.
import { readdirSync, statSync, createReadStream, writeFileSync, existsSync } from "node:fs";
import { join, basename, dirname, sep } from "node:path";
import { createInterface } from "node:readline";
import { homedir } from "node:os";

export const CACHE_WEIGHTS = { input: 1, cache_create: 1.25, cache_read: 0.1 }; // standard API multipliers

function parseArgs(argv) {
  const o = { root: null, home: null, since: "0000-00-00", ttlMinutes: 60, json: null, top: 10 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = argv[i + 1];
    if (a === "--root") o.root = v, i++;
    else if (a === "--home") o.home = v, i++;
    else if (a === "--since") o.since = v, i++;
    else if (a === "--ttl-minutes") o.ttlMinutes = Number(v), i++;
    else if (a === "--json") o.json = v, i++;
    else if (a === "--top") o.top = Number(v), i++;
    else { console.error(`unknown argument: ${a}`); process.exit(2); }
  }
  if (!o.root) o.root = join(o.home || homedir(), ".claude", "projects");
  return o;
}

export function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (e.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

function textOf(content) {
  if (typeof content === "string") return content;
  return (content || []).filter((b) => b && b.type === "text").map((b) => b.text).join("\n");
}

export async function analyzeSession(file, { ttlMs }) {
  const s = {
    file, name: basename(file, ".jsonl"), project: basename(dirname(file)),
    isSubagentFile: file.split(sep).includes("subagents"),
    start: null, end: null, turns: 0, sideTurns: 0, entrypoint: null, firstPrompt: "",
    models: {}, tokens: { input: 0, cache_create: 0, cache_read: 0, output: 0 },
    peakCtx: 0, finalCtx: 0, tools: {}, agents: [], workflows: 0, skills: [],
    handoffWrites: 0, compactions: 0, compactReprime: 0, gaps: 0, gapReprime: 0,
    resultBytes: {}, wholeFileReads: 0, rangedReads: 0,
  };
  let lastTs = null, afterCompaction = false;
  const toolNames = new Map();
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.isCompactSummary) { s.compactions++; afterCompaction = true; }
    const ts = o.timestamp ? Date.parse(o.timestamp) : null;
    if (ts) { s.start = s.start ? Math.min(s.start, ts) : ts; s.end = s.end ? Math.max(s.end, ts) : ts; }
    const m = o.message;
    if (o.type === "user" && m) {
      if (!s.entrypoint && o.entrypoint) s.entrypoint = o.entrypoint;
      if (!o.isSidechain && !o.isMeta && !o.isCompactSummary) {
        const t = textOf(m.content);
        if (t && !s.firstPrompt && !/^\[tool result\]/.test(t)) s.firstPrompt = t.slice(0, 120).replace(/\s+/g, " ");
        for (const b of Array.isArray(m.content) ? m.content : []) {
          if (b.type !== "tool_result") continue;
          const name = toolNames.get(b.tool_use_id) || "unknown";
          const size = typeof b.content === "string" ? b.content.length : JSON.stringify(b.c
… [106 more chars truncated]
```

### tool_use: Bash

```
{"command": "wc -l /tmp/eval-skills/token-economy/scripts/token-audit.mjs; sed -n '80,400p' /tmp/eval-skills/token-economy/scripts/token-audit.mjs"}
```

### tool_result

```
     200 /tmp/eval-skills/token-economy/scripts/token-audit.mjs
      }
      continue;
    }
    if (o.type !== "assistant" || !m) continue;
    if (o.isSidechain) { s.sideTurns++; continue; }
    s.turns++;
    if (m.model) s.models[m.model] = (s.models[m.model] || 0) + 1;
    const u = m.usage || {};
    const inp = u.input_tokens || 0, cc = u.cache_creation_input_tokens || 0, cr = u.cache_read_input_tokens || 0, out = u.output_tokens || 0;
    s.tokens.input += inp; s.tokens.cache_create += cc; s.tokens.cache_read += cr; s.tokens.output += out;
    const ctx = inp + cc + cr;
    if (ctx > 0) {
      s.peakCtx = Math.max(s.peakCtx, ctx); s.finalCtx = ctx;
      if (ts && lastTs && ts - lastTs > ttlMs) { s.gaps++; s.gapReprime += cc + inp; }
      if (afterCompaction) { s.compactReprime += cc + inp; afterCompaction = false; }
      if (ts) lastTs = ts;
    }
    for (const b of m.content || []) {
      if (b.type !== "tool_use") continue;
      toolNames.set(b.id, b.name);
      s.tools[b.name] = (s.tools[b.name] || 0) + 1;
      const inpt = b.input || {};
      if (b.name === "Agent") s.agents.push({ model: inpt.model || "inherit", type: inpt.subagent_type || "general-purpose", bg: !!inpt.run_in_background, promptChars: (inpt.prompt || "").length });
      if (b.name === "Workflow") s.workflows++;
      if (b.name === "Skill" && inpt.skill) s.skills.push(inpt.skill);
      if (b.name === "Read") { if (inpt.offset != null || inpt.limit != null) s.rangedReads++; else s.wholeFileReads++; }
      if (["Write", "Edit"].includes(b.name) && /HANDOFF\.md$/.test(inpt.file_path || "")) s.handoffWrites++;
    }
  }
  s.mainModel = Object.entries(s.models).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
  s.day = s.start ? new Date(s.start).toISOString().slice(0, 10) : "unknown";
  s.uncached = s.tokens.input + s.tokens.cache_create;
  s.headless = !!s.entrypoint && s.entrypoint !== "cli";
  return s;
}

const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + "%" : "n/a");
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const median = (arr) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
const cnt = (arr, f) => { const c = {}; for (const x of arr) { const k = f(x); c[k] = (c[k] || 0) + 1; } return Object.entries(c).sort((a, b) => b[1] - a[1]); };

export function computeLevers(main, { ttlMinutes }) {
  const U = sum(main, (s) => s.uncached);
  const headless = main.filter((s) => s.headless);
  const agents = main.flatMap((s) => s.agents);
  const unpinned = agents.filter((a) => a.model === "inherit");
  const whole = sum(main, (s) => s.wholeFileReads), ranged = sum(main, (s) => s.rangedReads);
  const readBytes = sum(main, (s) => s.resultBytes.Read || 0), bashBytes = sum(main, (s) => s.resultBytes.Bash || 0);
  const levers = [
    { key: "HEADLESS_SESSIONS", uncached: sum(headless, (s) => s.uncached), detail: `${headless.length} sessions with a non-interactive entrypoint (${cnt(headless, (s) => s.entrypoint).map(([k, v]) => `${k}: ${v}`).join(", ") || "none"}); models: ${cnt(headless, (s) => s.mainModel).map(([k, v]) => `${k}: ${v}`).join(", ") || "n/a"}; first prompt: "${headless[0]?.firstPrompt || ""}"`, fix: "Find the hook or plugin that spawns them and decide whether every firing is worth a cold-context model call; pin it to a cheaper tier or fire it less often." },
    { key: "CACHE_TTL_BREAKS", uncached: sum(main, (s) => s.gapReprime), detail: `${sum(main, (s) => s.gaps)} gaps longer than ${ttlMinutes} min inside a session; each re-wrote the whole context cold on return`, fix: "Before stepping away for longer than the cache TTL, refresh HANDOFF.md and /clear; resume from the handoff instead of re-priming the full context." },
    { key: "COMPACTIONS", uncached: sum(main, (s) => s.compactReprime), detail: `${sum(main, (s) => s.compactions)} compaction events in ${main.filter((s) => s.compactions).length} sessions; the turn after each rebuilt context from a lossy summary`, fix: "Replace compaction with handoff + /clear (agent-handoff at the ~40% reminder)." },
    { key: "UNPINNED_DISPATCHES", uncached: null, detail: `${unpinned.length} of ${agents.length} Agent dispatches carry no model (they inherit the orchestrator's tier); subagent spend is billed in the subagent transcript, not here`, fix: "Pin every dispatch: opus for engineering, sonnet for grunt work, haiku for reading; never inherit." },
    { key: "WHOLE_FILE_READS", uncached: null, detail: `${whole} whole-file Read calls vs ${ranged} ranged; ${fmt(readBytes)} bytes of Read results and ${fmt(bashBytes)} bytes of Bash output landed in the main context`, fix: "Workers read, the orchestrator decides: ranged reads (sed -n, head, grep) in the main thread; a haiku reader for anything long." },
  ];
  for (const l of levers) l.share = l.uncached == null ? null : pct(l.uncached, U);
  levers.sort((a, b) => (b.uncached ?? -1) - (a.uncached ?? -1));
  return { levers, totalUncached: U };
}

export function renderReport(main, files, opt) {
  const T = { input: sum(main, (s) => s.tokens.input), cc: sum(main, (s) => s.tokens.cache_create), cr: sum(main, (s) => s.tokens.cache_read), out: sum(main, (s) => s.tokens.output) };
  const turns = sum(main, (s) => s.turns);
  const weighted = T.input * CACHE_WEIGHTS.input + T.cc * CACHE_WEIGHTS.cache_create + T.cr * CACHE_WEIGHTS.cache_read;
  const L = []; const P = (...a) => L.push(a.join(""));
  P(`# Token-efficiency audit — ${new Date().toISOString().slice(0, 10)}`);
  P(``); P(`Root: ${opt.root} — ${files.length} transcript files, ${main.length} main-thread sessions with ≥1 assistant turn${opt.since !== "0000-00-00" ? ` since ${opt.since}` : ""}. Cache TTL assumed ${opt.ttlMinutes} min.`);
  P(``); P(`## Totals`); P(`| Metric | Value |`); P(`|---|---|`);
  P(`| Assistant turns | ${fmt(turns)} |`);
  P(`| Uncached input (input + cache_creation) | ${fmt(T.input + T.cc)} |`);
  P(`| Cache reads | ${fmt(T.cr)} |`);
  P(`| Cache hit ratio | ${pct(T.cr, T.input + T.cc + T.cr)} |`);
  P(`| Output tokens | ${fmt(T.out)} |`);
  P(`| Uncached input per turn | ${fmt((T.input + T.cc) / Math.max(1, turns))} |`);
  P(`| Input-equivalent tokens (weights ${CACHE_WEIGHTS.input}/${CACHE_WEIGHTS.cache_create}/${CACHE_WEIGHTS.cache_read}) | ${fmt(weighted)} |`);
  const { levers, totalUncached } = computeLevers(main, opt);
  P(``); P(`## Levers, ranked by uncached input`); P(`| # | Lever | Uncached tokens | Share | Evidence |`); P(`|---|---|---|---|---|`);
  levers.forEach((l, i) => P(`| ${i + 1} | ${l.key} | ${l.uncached == null ? "n/a (not costed here)" : fmt(l.uncached)} | ${l.share ?? "—"} | ${l.detail} |`));
  P(``); levers.forEach((l) => P(`- **${l.key}** — ${l.fix}`));
  P(``); P(`## By main model`); P(`| Model | Sessions | Turns | Uncached in | Cache read | Hit ratio | Output | Median peak ctx |`); P(`|---|---|---|---|---|---|---|---|`);
  const byModel = {}; for (const s of main) (byModel[s.mainModel] ||= []).push(s);
  for (const [m, ss] of Object.entries(byModel).sort((a, b) => b[1].length - a[1].length)) { const i = sum(ss, (s) => s.uncached), r = sum(ss, (s) => s.tokens.cache_read); P(`| ${m} | ${ss.length} | ${fmt(sum(ss, (s) => s.turns))} | ${fmt(i)} | ${fmt(r)} | ${pct(r, i + r)} | ${fmt(sum(ss, (s) => s.tokens.output))} | ${fmt(median(ss.map((s) => s.peakCtx)))} |`); }
  P(``); P(`## Long sessions vs short sessions`);
  const big = main.filter((s) => s.peakCtx >= 200e3), small = main.filter((s) => s.peakCtx < 200e3 && s.turns >= 10);
  const row = (n, ss) => { const t = sum(ss, (s) => s.turns) || 1, i = sum(ss, (s) => s.uncached), r = sum(ss, (s) => s.tokens.cache_read); P(`| ${n} | ${ss.length} | ${fmt(i / t)} | ${fmt(r / t)} | ${pct(r, i + r)} | ${sum(ss, (s) => s.gaps)} | ${ss.filter((s) => s.handoffWrites).length} |`); };
  P(`| Bucket | Sessions | Uncached/turn | Cache read/turn | Hit ratio | TTL breaks | Handoff sessions |`); P(`|---|---|---|---|---|---|---|`);
  row("peak ctx ≥ 200K", big); row("peak ctx < 200K, ≥10 turns", small);
  P(``); P(`Interactive sessions: ${main.filter((s) => !s.headless).length}; headless: ${main.filter((s) => s.headless).length}; compactions: ${sum(main, (s) => s.compactions)}; HANDOFF.md writes: ${sum(main, (s) => s.handoffWrites)} in ${main.filter((s) => s.handoffWrites).length} sessions.`);
  const agents = main.flatMap((s) => s.agents);
  P(``); P(`## Dispatches (Agent tool, main thread)`); P(`Total ${agents.length}; background ${agents.filter((a) => a.bg).length}; median prompt ${fmt(median(agents.map((a) => a.promptChars)))} chars. Workflow calls: ${sum(main, (s) => s.workflows)}.`);
  P(`| model | count | share |`); P(`|---|---|---|`); for (const [k, v] of cnt(agents, (a) => a.model)) P(`| ${k} | ${v} | ${pct(v, agents.length)} |`);
  const tools = {}; for (const s of main) for (const [k, v] of Object.entries(s.tools)) tools[k] = (tools[k] || 0) + v;
  const ttot = Object.values(tools).reduce((a, b) => a + b, 0);
  P(``); P(`## Tool mix (main thread)`); P(`| Tool | Calls | Share | Result bytes into context |`); P(`|---|---|---|---|`);
  for (const [k, v] of Object.entries(tools).sort((a, b) => b[1] - a[1]).slice(0, 12)) P(`| ${k} | ${fmt(v)} | ${pct(v, ttot)} | ${fmt(sum(main, (s) => s.resultBytes[k] || 0))} |`);
  P(``); P(`## Top ${opt.top} sessions by uncached input`); P(`| Session | Day | Project | Model | Entry | Turns | Uncached | Cache read | Hit | Peak ctx | TTL breaks | Compactions | Dispatches (unpinned) |`); P(`|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const s of [...main].sort((a, b) => b.uncached - a.uncached).slice(0, opt.top)) P(`| ${s.name.slice(0, 12)} | ${s.day} | ${s.project.slice(-28)} | ${s.mainModel.replace("claude-", "")} | ${s.entrypoint || "?"} | ${s.turns} | ${fmt(s.uncached)} | ${fmt(s.tokens.cache_read)} | ${pct(s.tokens.cache_read, s.uncached + s.tokens.cache_read)} | ${fmt(s.peakCtx)} | ${s.gaps} | ${s.compactions} | ${s.agents.length} (${s.agents.filter((a) => a.model === "inherit").length}) |`);
  return { markdown: L.join("\n"), levers, totalUncached, totals: T };
}

export async function audit(opt) {
  if (!existsSync(opt.root)) throw new Error(`transcripts root not found: ${opt.root}`);
  const files = walk(opt.root);
  const sessions = [];
  for (const f of files) {
    const s = await analyzeSession(f, { ttlMs: opt.ttlMinutes * 60e3 });
    if (s.turns === 0 || s.isSubagentFile || s.day < opt.since) continue;
    sessions.push(s);
  }
  return { files, main: sessions, ...renderReport(sessions, files, opt) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opt = parseArgs(process.argv.slice(2));
  try {
    const r = await audit(opt);
    console.log(r.markdown);
    if (opt.json) writeFileSync(opt.json, JSON.stringify({ generated: new Date().toISOString(), root: opt.root, levers: r.levers, totals: r.totals, sessions: r.main.map(({ file, ...rest }) => ({ file: basename(file), ...rest })) }, null, 1));
  } catch (e) { console.error(e.message); process.exit(2); }
}
```

### tool_use: Bash

```
{"command": "cd /tmp && node /tmp/eval-skills/token-economy/scripts/token-audit.mjs --home /tmp/run-08-home --top 10 2>&1 | cat -n | head -60"}
```

### tool_result

```
(Bash completed with no output)
```

### tool_use: Bash

```
{"command": "node -e \"console.log(process.argv[1])\" /tmp/eval-skills/token-economy/scripts/token-audit.mjs; node --input-type=module -e \"import{fileURLToPath} from 'node:url'; console.log(import.meta.url)\""}
```

### tool_result

```
/tmp/eval-skills/token-economy/scripts/token-audit.mjs
file:///Users/franciscosoltero/Desktop/Code/soltero-skills/[eval1]
```

### tool_use: Bash

```
{"command": "ls -la /tmp | head -1; node /private/tmp/eval-skills/token-economy/scripts/token-audit.mjs --home /private/tmp/run-08-home --top 10 2>&1 | head -30"}
```

### tool_result

```
lrwxr-xr-x@ 1 root  wheel  11 May 21 04:57 /tmp -> private/tmp
# Token-efficiency audit — 2026-09-07

Root: /private/tmp/run-08-home/.claude/projects — 47 transcript files, 47 main-thread sessions with ≥1 assistant turn. Cache TTL assumed 60 min.

## Totals
| Metric | Value |
|---|---|
| Assistant turns | 930 |
| Uncached input (input + cache_creation) | 8,409,400 |
| Cache reads | 656,075,600 |
| Cache hit ratio | 98.7% |
| Output tokens | 610,000 |
| Uncached input per turn | 9,042 |
| Input-equivalent tokens (weights 1/1.25/0.1) | 75,866,560 |

## Levers, ranked by uncached input
| # | Lever | Uncached tokens | Share | Evidence |
|---|---|---|---|---|
| 1 | HEADLESS_SESSIONS | 4,272,000 | 50.8% | 40 sessions with a non-interactive entrypoint (sdk-py: 40); models: claude-opus-4-7: 40; first prompt: "Review this change for security vulnerabilities. Changed files (you may Read these and any other file in the repo): -" |
| 2 | CACHE_TTL_BREAKS | 998,260 | 11.9% | 1 gaps longer than 60 min inside a session; each re-wrote the whole context cold on return |
| 3 | COMPACTIONS | 300,160 | 3.6% | 2 compaction events in 1 sessions; the turn after each rebuilt context from a lossy summary |
| 4 | UNPINNED_DISPATCHES | n/a (not costed here) | — | 18 of 30 Agent dispatches carry no model (they inherit the orchestrator's tier); subagent spend is billed in the subagent transcript, not here |
| 5 | WHOLE_FILE_READS | n/a (not costed here) | — | 151 whole-file Read calls vs 0 ranged; 666,000 bytes of Read results and 111,300 bytes of Bash output landed in the main context |

- **HEADLESS_SESSIONS** — Find the hook or plugin that spawns them and decide whether every firing is worth a cold-context model call; pin it to a cheaper tier or fire it less often.
- **CACHE_TTL_BREAKS** — Before stepping away for longer than the cache TTL, refresh HANDOFF.md and /clear; resume from the handoff instead of re-priming the full context.
- **COMPACTIONS** — Replace compaction with handoff + /clear (agent-handoff at the ~40% reminder).
- **UNPINNED_DISPATCHES** — Pin every dispatch: opus for engineering, sonnet for grunt work, haiku for reading; never inherit.
- **WHOLE_FILE_READS** — Workers read, the orchestrator decides: ranged reads (sed -n, head, grep) in the main thread; a haiku reader for anything long.
```

### assistant

Now it worked. Let me get the full report and JSON.

### tool_use: Bash

```
{"command": "node /private/tmp/eval-skills/token-economy/scripts/token-audit.mjs --home /private/tmp/run-08-home --top 10 --json /private/tmp/run-08-home/audit.json > /private/tmp/run-08-home/audit-report.md 2>&1; echo EXIT:$?; sed -n '20,60p' /private/tmp/run-08-home/audit-report.md"}
```

### tool_result

```
EXIT:0
| 2 | CACHE_TTL_BREAKS | 998,260 | 11.9% | 1 gaps longer than 60 min inside a session; each re-wrote the whole context cold on return |
| 3 | COMPACTIONS | 300,160 | 3.6% | 2 compaction events in 1 sessions; the turn after each rebuilt context from a lossy summary |
| 4 | UNPINNED_DISPATCHES | n/a (not costed here) | — | 18 of 30 Agent dispatches carry no model (they inherit the orchestrator's tier); subagent spend is billed in the subagent transcript, not here |
| 5 | WHOLE_FILE_READS | n/a (not costed here) | — | 151 whole-file Read calls vs 0 ranged; 666,000 bytes of Read results and 111,300 bytes of Bash output landed in the main context |

- **HEADLESS_SESSIONS** — Find the hook or plugin that spawns them and decide whether every firing is worth a cold-context model call; pin it to a cheaper tier or fire it less often.
- **CACHE_TTL_BREAKS** — Before stepping away for longer than the cache TTL, refresh HANDOFF.md and /clear; resume from the handoff instead of re-priming the full context.
- **COMPACTIONS** — Replace compaction with handoff + /clear (agent-handoff at the ~40% reminder).
- **UNPINNED_DISPATCHES** — Pin every dispatch: opus for engineering, sonnet for grunt work, haiku for reading; never inherit.
- **WHOLE_FILE_READS** — Workers read, the orchestrator decides: ranged reads (sed -n, head, grep) in the main thread; a haiku reader for anything long.

## By main model
| Model | Sessions | Turns | Uncached in | Cache read | Hit ratio | Output | Median peak ctx |
|---|---|---|---|---|---|---|---|
| claude-opus-4-7 | 40 | 320 | 4,272,000 | 25,200,000 | 85.5% | 100,000 | 92,400 |
| claude-opus-5 | 7 | 610 | 4,137,400 | 630,875,600 | 99.3% | 510,000 | 48,050 |

## Long sessions vs short sessions
| Bucket | Sessions | Uncached/turn | Cache read/turn | Hit ratio | TTL breaks | Handoff sessions |
|---|---|---|---|---|---|---|
| peak ctx ≥ 200K | 2 | 7,190 | 1,143,937 | 99.4% | 1 | 1 |
| peak ctx < 200K, ≥10 turns | 5 | 3,050 | 28,500 | 90.3% | 0 | 0 |

Interactive sessions: 7; headless: 40; compactions: 2; HANDOFF.md writes: 3 in 1 sessions.

## Dispatches (Agent tool, main thread)
Total 30; background 0; median prompt 2,400 chars. Workflow calls: 0.
| model | count | share |
|---|---|---|
| inherit | 18 | 60.0% |
| opus | 8 | 26.7% |
| haiku | 4 | 13.3% |

## Tool mix (main thread)
| Tool | Calls | Share | Result bytes into context |
|---|---|---|---|
| Grep | 240 | 41.2% | 0 |
| Bash | 159 | 27.3% | 111,300 |
| Read | 151 | 25.9% | 666,000 |
| Agent | 30 | 5.1% | 54,000 |
| Write | 3 | 0.5% | 180 |
```

### tool_use: Bash

```
{"command": "sed -n '60,100p' /private/tmp/run-08-home/audit-report.md"}
```

### tool_result

```
| Write | 3 | 0.5% | 180 |

## Top 10 sessions by uncached input
| Session | Day | Project | Model | Entry | Turns | Uncached | Cache read | Hit | Peak ctx | TTL breaks | Compactions | Dispatches (unpinned) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| orch-0001 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-5 | cli | 400 | 2,976,400 | 596,506,100 | 99.5% | 2,972,460 | 1 | 0 | 30 (18) |
| compact-0001 | 2026-08-29 | Users-alex-Desktop-Code-acme | opus-5 | cli | 150 | 978,000 | 32,659,500 | 97.1% | 427,580 | 0 | 2 | 0 (0) |
| review-0001 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-4-7 | sdk-py | 8 | 106,800 | 630,000 | 85.5% | 92,400 | 0 | 0 | 0 (0) |
| review-0002 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-4-7 | sdk-py | 8 | 106,800 | 630,000 | 85.5% | 92,400 | 0 | 0 | 0 (0) |
| review-0003 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-4-7 | sdk-py | 8 | 106,800 | 630,000 | 85.5% | 92,400 | 0 | 0 | 0 (0) |
| review-0004 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-4-7 | sdk-py | 8 | 106,800 | 630,000 | 85.5% | 92,400 | 0 | 0 | 0 (0) |
| review-0005 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-4-7 | sdk-py | 8 | 106,800 | 630,000 | 85.5% | 92,400 | 0 | 0 | 0 (0) |
| review-0006 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-4-7 | sdk-py | 8 | 106,800 | 630,000 | 85.5% | 92,400 | 0 | 0 | 0 (0) |
| review-0007 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-4-7 | sdk-py | 8 | 106,800 | 630,000 | 85.5% | 92,400 | 0 | 0 | 0 (0) |
| review-0008 | 2026-08-24 | Users-alex-Desktop-Code-acme | opus-4-7 | sdk-py | 8 | 106,800 | 630,000 | 85.5% | 92,400 | 0 | 0 | 0 (0) |
```

### tool_use: Bash

```
{"command": "find /private/tmp/run-08-home -maxdepth 6 -not -path \"*/projects/*\" 2>&1\necho \"---settings---\"\ncat /private/tmp/run-08-home/.claude/settings.json\necho \"---search for review/security hook refs in transcripts---\"\ngrep -l \"security\" /private/tmp/run-08-home/.claude/projects/*/*.jsonl | head -3\n"}
```

### tool_result

```
/private/tmp/run-08-home
/private/tmp/run-08-home/audit.json
/private/tmp/run-08-home/.claude
/private/tmp/run-08-home/audit-report.md
/private/tmp/run-08-home/.claude/settings.json
/private/tmp/run-08-home/.claude/projects
/private/tmp/run-08-home/.claude/CLAUDE.md
---settings---
{
  "model": "opus[1m]",
  "enabledPlugins": {
    "soltero-skills@soltero-skills-marketplace": true
  },
  "theme": "dark"
}
---search for review/security hook refs in transcripts---
/private/tmp/run-08-home/.claude/projects/-Users-alex-Desktop-Code-acme/review-0001.jsonl
/private/tmp/run-08-home/.claude/projects/-Users-alex-Desktop-Code-acme/review-0005.jsonl
/private/tmp/run-08-home/.claude/projects/-Users-alex-Desktop-Code-acme/review-0003.jsonl
```

### tool_use: Bash

```
{"command": "python3 -c \"\nimport json\nwith open('/private/tmp/run-08-home/.claude/projects/-Users-alex-Desktop-Code-acme/review-0001.jsonl') as f:\n    lines = f.readlines()\nprint('num lines', len(lines))\nfor l in lines[:3]:\n    o = json.loads(l)\n    print(json.dumps(o, indent=2)[:2000])\n    print('---')\n\"\n"}
```

### tool_result

```
num lines 16
{
  "type": "user",
  "uuid": "u001008",
  "sessionId": "review-0001",
  "timestamp": "2026-08-24T14:40:00.000Z",
  "isSidechain": false,
  "cwd": "/Users/alex/Desktop/Code/acme",
  "entrypoint": "sdk-py",
  "message": {
    "role": "user",
    "content": "Review this change for security vulnerabilities.\n\nChanged files (you may Read these and any other file in the repo):\n  - src/billing/invoice.ts"
  }
}
---
{
  "type": "assistant",
  "uuid": "u001010",
  "sessionId": "review-0001",
  "timestamp": "2026-08-24T14:40:05.000Z",
  "isSidechain": false,
  "message": {
    "model": "claude-opus-4-7",
    "role": "assistant",
    "type": "message",
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_u001009",
        "name": "Read",
        "input": {
          "file_path": "/Users/alex/Desktop/Code/acme/src/billing/invoice.ts"
        }
      }
    ],
    "usage": {
      "input_tokens": 18000,
      "cache_creation_input_tokens": 72000,
      "cache_read_input_tokens": 0,
      "output_tokens": 400
    }
  }
}
---
{
  "type": "user",
  "uuid": "u001011",
  "sessionId": "review-0001",
  "timestamp": "2026-08-24T14:40:20.000Z",
  "isSidechain": false,
  "cwd": "/Users/alex/Desktop/Code/acme",
  "entrypoint": "cli",
  "message": {
    "role": "user",
    "content": "[tool result]"
  }
}
---
```

### tool_use: Bash

```
{"command": "sed -n '1,20p' /private/tmp/run-08-home/audit-report.md"}
```

### tool_result

```
# Token-efficiency audit — 2026-09-07

Root: /private/tmp/run-08-home/.claude/projects — 47 transcript files, 47 main-thread sessions with ≥1 assistant turn. Cache TTL assumed 60 min.

## Totals
| Metric | Value |
|---|---|
| Assistant turns | 930 |
| Uncached input (input + cache_creation) | 8,409,400 |
| Cache reads | 656,075,600 |
| Cache hit ratio | 98.7% |
| Output tokens | 610,000 |
| Uncached input per turn | 9,042 |
| Input-equivalent tokens (weights 1/1.25/0.1) | 75,866,560 |

## Levers, ranked by uncached input
| # | Lever | Uncached tokens | Share | Evidence |
|---|---|---|---|---|
| 1 | HEADLESS_SESSIONS | 4,272,000 | 50.8% | 40 sessions with a non-interactive entrypoint (sdk-py: 40); models: claude-opus-4-7: 40; first prompt: "Review this change for security vulnerabilities. Changed files (you may Read these and any other file in the repo): -" |
| 2 | CACHE_TTL_BREAKS | 998,260 | 11.9% | 1 gaps longer than 60 min inside a session; each re-wrote the whole context cold on return |
```

### tool_use: Bash

```
{"command": "python3 -c \"\nimport json\npath='/private/tmp/run-08-home/.claude/projects/-Users-alex-Desktop-Code-acme/orch-0001.jsonl'\nlines=[json.loads(l) for l in open(path)]\nprint('total lines', len(lines))\nagents=[]\nfor o in lines:\n    if o.get('type')=='assistant':\n        for b in o['message'].get('content',[]):\n            if b.get('type')=='tool_use' and b.get('name')=='Agent':\n                agents.append(b['input'].get('model','inherit'))\nfrom collections import Counter\nprint(Counter(agents))\n# timestamps gap check\nts=[json.loads(l).get('timestamp') for l 
```

### tool_result

```
total lines 801
Counter({'inherit': 18, 'opus': 8, 'haiku': 4})
start 2026-08-24T14:00:00.000Z end 2026-08-25T06:20:01.000Z
```

### assistant

Now let me check the economy-setup.mjs script and run check → apply → check.

### tool_use: Bash

```
{"command": "sed -n '1,250p' /private/tmp/eval-skills/token-economy/scripts/economy-setup.mjs"}
```

### tool_result

```
#!/usr/bin/env node
// economy-setup.mjs — check (default) or --apply the token-economy system at user scope.
//
//   node economy-setup.mjs [--home DIR] [--check | --apply] [--window N] [--threshold 40]
//                          [--effort high] [--hook-source PATH] [--json]
//
// Items: HOOK_SCRIPT, HOOK_ENTRY, HOOK_WINDOW, PROTOCOL_BLOCK (blocking), EFFORT (info unless
// --effort given), CONFLICTS (warn). Every file write is preceded by <file>.bak-<timestamp>.
// Exit 0 = every blocking item OK, 1 = gaps remain, 2 = bad input.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
export const START = "<!-- token-economy:start -->", END = "<!-- token-economy:end -->";
export const DEFAULT_HOOK_SOURCE = resolve(HERE, "..", "..", "agent-handoff", "hooks", "context-watch.mjs");
export const PROTOCOL_SOURCE = resolve(HERE, "..", "references", "protocol.md");

export function parseArgs(argv) {
  const o = { home: homedir(), apply: false, window: null, threshold: 40, effort: null, hookSource: DEFAULT_HOOK_SOURCE, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = argv[i + 1];
    if (a === "--home") o.home = v, i++;
    else if (a === "--apply") o.apply = true;
    else if (a === "--check") o.apply = false;
    else if (a === "--window") o.window = Number(v), i++;
    else if (a === "--threshold") o.threshold = Number(v), i++;
    else if (a === "--effort") o.effort = v, i++;
    else if (a === "--hook-source") o.hookSource = v, i++;
    else if (a === "--json") o.json = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  if (o.window != null && !(o.window > 0)) throw new Error("--window must be a positive number");
  if (o.effort && !["low", "medium", "high", "xhigh", "max"].includes(o.effort)) throw new Error(`--effort must be low|medium|high|xhigh|max`);
  return o;
}

// Context window for the configured model string ("opus[1m]", "claude-haiku-4-5", unset …).
export function windowForModel(model) {
  const m = String(model || "").toLowerCase();
  if (/\[1m\]/.test(m)) return 1000000;
  if (/haiku/.test(m)) return 200000;
  return 1000000; // every current opus / sonnet / fable tier is 1M
}

// Markers must occupy an entire line by themselves — protocol.md's own prose mentions the
// marker strings inline (describing the format), and a plain indexOf() would match those
// inline mentions instead of the real block, truncating everything installed downstream.
function findMarkerLine(txt, marker) {
  const re = new RegExp(`^${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m");
  const m = re.exec(txt);
  return m ? m.index : -1;
}

// Number of lines that consist of exactly this marker (prose mentioning the marker inline does not count).
export function countMarkerLines(txt, marker) {
  return txt.split("\n").filter((l) => l.trim() === marker).length;
}

export function protocolBlock(source = PROTOCOL_SOURCE) {
  const txt = readFileSync(source, "utf8");
  const a = findMarkerLine(txt, START), b = findMarkerLine(txt, END);
  if (a < 0 || b < 0 || b < a) throw new Error(`protocol markers not found in ${source}`);
  return txt.slice(a, b + END.length);
}

export function upsertBlock(claudeMd, block) {
  const a = findMarkerLine(claudeMd, START), b = findMarkerLine(claudeMd, END);
  if (a >= 0 && b > a) return claudeMd.slice(0, a) + block + claudeMd.slice(b + END.length);
  const sep = claudeMd.length === 0 ? "" : claudeMd.endsWith("\n\n") ? "" : claudeMd.endsWith("\n") ? "\n" : "\n\n";
  return claudeMd + sep + block + "\n";
}

export function findHookEntries(settings) {
  const out = [];
  for (const [event, groups] of Object.entries(settings.hooks || {})) {
    if (!Array.isArray(groups)) continue;
    groups.forEach((g, gi) => (g.hooks || []).forEach((h, hi) => { if (/context-watch\.mjs/.test(h.command || "")) out.push({ event, gi, hi, hook: h }); }));
  }
  return out;
}

export function hookCommand(home, window, threshold) {
  return `HANDOFF_CONTEXT_WINDOW=${window} HANDOFF_THRESHOLD_PCT=${threshold} node ${join(home, ".claude", "hooks", "context-watch.mjs")}`;
}

function backup(path) {
  if (!existsSync(path)) return null;
  const b = `${path}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  copyFileSync(path, b);
  return b;
}

export function conflicts(claudeMd) {
  const a = findMarkerLine(claudeMd, START), b = findMarkerLine(claudeMd, END);
  const outside = a >= 0 && b > a ? claudeMd.slice(0, a) + claudeMd.slice(b + END.length) : claudeMd;
  const hits = [];
  outside.split("\n").forEach((line, i) => {
    const l = line.toLowerCase();
    if ((/inherit/.test(l) && /model/.test(l)) || /\/compact\b/.test(l) || (/compact/.test(l) && /(every|often|regular|hour)/.test(l))) hits.push({ line: i + 1, text: line.trim() });
  });
  return hits;
}

export function run(o) {
  const claudeDir = join(o.home, ".claude");
  const settingsPath = join(claudeDir, "settings.json"), claudeMdPath = join(claudeDir, "CLAUDE.md");
  const hookPath = join(claudeDir, "hooks", "context-watch.mjs");
  if (!existsSync(claudeDir)) throw new Error(`no .claude directory under ${o.home}`);
  let settings = {};
  if (existsSync(settingsPath)) { try { settings = JSON.parse(readFileSync(settingsPath, "utf8")); } catch (e) { throw new Error(`settings.json is not valid JSON: ${e.message}`); } }
  const claudeMd = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, "utf8") : "";
  const window = o.window || windowForModel(settings.model);
  const wantCmd = hookCommand(o.home, window, o.threshold);
  const items = []; const changes = []; const backups = [];
  const item = (key, status, detail, blocking = true) => items.push({ key, status, detail, blocking });

  // HOOK_SCRIPT
  const scriptOk = existsSync(hookPath);
  if (scriptOk) item("HOOK_SCRIPT", "OK", hookPath);
  else if (o.apply) { if (!existsSync(o.hookSource)) throw new Error(`hook source not found: ${o.hookSource}`); mkdirSync(dirname(hookPath), { recursive: true }); copyFileSync(o.hookSource, hookPath); changes.push(`created ${hookPath} (copied from ${o.hookSource})`); item("HOOK_SCRIPT", "OK", `installed ${hookPath}`); }
  else item("HOOK_SCRIPT", "MISSING", `${hookPath} does not exist (would copy from ${o.hookSource})`);

  // HOOK_ENTRY + HOOK_WINDOW
  const entries = findHookEntries(settings);
  const good = entries.filter((e) => e.event === "UserPromptSubmit" && e.hook.command === wantCmd);
  let settingsChanged = false;
  if (good.length === 1 && entries.length === 1) { item("HOOK_ENTRY", "OK", "UserPromptSubmit → context-watch.mjs"); item("HOOK_WINDOW", "OK", `HANDOFF_CONTEXT_WINDOW=${window} HANDOFF_THRESHOLD_PCT=${o.threshold}`); }
  else if (entries.length === 0) {
    if (o.apply) { settings.hooks ||= {}; settings.hooks.UserPromptSubmit ||= []; settings.hooks.UserPromptSubmit.push({ hooks: [{ type: "command", command: wantCmd, timeout: 10 }] }); settingsChanged = true; changes.push("added UserPromptSubmit hook entry"); item("HOOK_ENTRY", "OK", "added"); item("HOOK_WINDOW", "OK", `HANDOFF_CONTEXT_WINDOW=${window}`); }
    else { item("HOOK_ENTRY", "MISSING", "no UserPromptSubmit hook runs context-watch.mjs"); item("HOOK_WINDOW", "MISSING", `would set HANDOFF_CONTEXT_WINDOW=${window} for model "${settings.model || "(unset)"}"`); }
  } else {
    const desc = entries.map((e) => `${e.event}: "${e.hook.command}"`).join("; ");
    if (o.apply) {
      // Rewrite every existing context-watch entry to the calibrated command; keep the first, drop duplicates.
      for (const e of entries) { const g = settings.hooks[e.event][e.gi]; g.hooks = g.hooks.filter((h) => !/context-watch\.mjs/.test(h.command || "")); }
      for (const ev of Object.keys(settings.hooks)) settings.hooks[ev] = settings.hooks[ev].filter((g) => (g.hooks || []).length > 0);
      settings.hooks.UserPromptSubmit ||= []; settings.hooks.UserPromptSubmit.push({ hooks: [{ type: "command", command: wantCmd, timeout: 10 }] });
      settingsChanged = true; changes.push(`replaced ${entries.length} context-watch hook entr${entries.length === 1 ? "y" : "ies"} (${desc}) with the calibrated one`);
      item("HOOK_ENTRY", "OK", "rewritten"); item("HOOK_WINDOW", "OK", `HANDOFF_CONTEXT_WINDOW=${window}`);
    } else {
      item("HOOK_ENTRY", entries.some((e) => e.event === "UserPromptSubmit") ? "OK" : "MISCALIBRATED", desc);
      const m = entries[0].hook.command.match(/HANDOFF_CONTEXT_WINDOW=(\d+)/);
      const have = m ? Number(m[1]) : 200000;
      item("HOOK_WINDOW", have === window && entries.length === 1 && good.length === 1 ? "OK" : "MISCALIBRATED", `hook runs with window ${have}${m ? "" : " (default, env unset)"}; model "${settings.model || "(unset)"}" needs ${window}${entries.length > 1 ? `; ${entries.length} entries found` : ""}`);
    }
  }

  // EFFORT
  if (o.effort) { if (settings.effortLevel !== o.effort) { if (o.apply) { const was = settings.effortLevel; settings.effortLevel = o.effort; settingsChanged = true; changes.push(`effortLevel ${was ?? "(unset)"} → ${o.effort}`); } item("EFFORT", o.apply ? "OK" : "MISCALIBRATED", `effortLevel ${settings.effortLevel ?? "(unset)"}${o.apply ? "" : ` (would set ${o.effort})`}`); } else item("EFFORT", "OK", `effortLevel ${o.effort}`); }
  else item("EFFORT", settings.effortLevel ? "INFO" : "INFO", `effortLevel ${settings.effortLevel ?? "(unset — Claude Code's default is xhigh; the protocol recommends high; pass --effort high to set it)"}`, false);

  if (settingsChanged) { const b = backup(settingsPath); if (b) backups.push(b); mkdirSync(claudeDir, { recursive: true }); writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n"); }

  // PROTOCOL_BLOCK
  const block = protocolBlock();
  const count = countMarkerLines(claudeMd, START);
  const present = count === 1 && claudeMd.includes(block);
  if (present) item("PROTOCOL_BLOCK", "OK", `${claudeMdPath} carries the current block`);
  else if (o.apply) { const b = backup(claudeMdPath); if (b) backups.push(b); writeFileSync(claudeMdPath, upsertBlock(claudeMd, block)); changes.push(count >= 1 ? `replaced the protocol block in ${claudeMdPath}` : `appended the protocol block to ${claudeMdPath}`); item("PROTOCOL_BLOCK", "OK", count >= 1 ? "updated" : "added"); }
  else item("PROTOCOL_BLOCK", count >= 1 ? "MISCALIBRATED" : "MISSING", count >= 1 ? `block present ${count}× but differs from references/protocol.md` : `no token-economy block in ${claudeMdPath}`);

  // CONFLICTS (never edited)
  const finalMd = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, "utf8") : "";
  const c = conflicts(finalMd);
  item("CONFLICTS", c.length ? "WARN" : "OK", c.length ? c.map((h) => `CLAUDE.md:${h.line} "${h.text}"`).join("; ") + " — contradicts the protocol; left untouched, surface it to the owner" : "no contradicting lines outside the block", false);

  const gaps = items.filter((i) => i.blocking && i.status !== "OK");
  return { items, changes, backups, gaps: gaps.length, window, exitCode: gaps.length ? 1 : 0 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(2); }
  try {
    const r = run(o);
    if (o.json) console.log(JSON.stringify(r, null, 2));
    else {
      console.log(`token-economy setup ${o.apply ? "APPLY" : "CHECK"} — home ${o.home} — window ${r.window}`);
      for (const i of r.items) console.log(`  ${i.status.padEnd(13)} ${i.key.padEnd(15)} ${i.detail}`);
      if (r.changes.length) console.log(`changes:\n${r.changes.map((c) => `  - ${c}`).join("\n")}`);
      if (r.backups.length) console.log(`backups:\n${r.backups.map((c) => `  - ${c}`).join("\n")}`);
      console.log(r.gaps ? `${r.gaps} blocking item(s) not OK` : "all blocking items OK");
    }
    process.exit(r.exitCode);
  } catch (e) { console.error(e.message); process.exit(2); }
}
```

### tool_use: Bash

```
{"command": "ls -la /private/tmp/eval-skills/agent-handoff/hooks/ 2>&1\necho \"---check (real path, home real path)---\"\nnode /private/tmp/eval-skills/token-economy/scripts/economy-setup.mjs --home /private/tmp/run-08-home 2>&1\necho \"EXIT:$?\""}
```

### tool_result

```
total 8
drwxr-xr-x@ 3 franciscosoltero  wheel    96 Sep  1 18:26 .
drwxr-xr-x@ 6 franciscosoltero  wheel   192 Sep  1 18:26 ..
-rwxr-xr-x@ 1 franciscosoltero  wheel  3246 Sep  1 18:26 context-watch.mjs
---check (real path, home real path)---
token-economy setup CHECK — home /private/tmp/run-08-home — window 1000000
  MISSING       HOOK_SCRIPT     /private/tmp/run-08-home/.claude/hooks/context-watch.mjs does not exist (would copy from /private/tmp/eval-skills/agent-handoff/hooks/context-watch.mjs)
  MISSING       HOOK_ENTRY      no UserPromptSubmit hook runs context-watch.mjs
  MISSING       HOOK_WINDOW     would set HANDOFF_CONTEXT_WINDOW=1000000 for model "opus[1m]"
  INFO          EFFORT          effortLevel (unset — Claude Code's default is xhigh; the protocol recommends high; pass --effort high to set it)
  MISSING       PROTOCOL_BLOCK  no token-economy block in /private/tmp/run-08-home/.claude/CLAUDE.md
  OK            CONFLICTS       no contradicting lines outside the block
4 blocking item(s) not OK
EXIT:1
```

### assistant

Check confirms gaps. Now apply, with `--effort high` per the protocol's recommendation.

### tool_use: Bash

```
{"command": "node /private/tmp/eval-skills/token-economy/scripts/economy-setup.mjs --home /private/tmp/run-08-home --apply --effort high 2>&1\necho \"EXIT:$?\""}
```

### tool_result

```
token-economy setup APPLY — home /private/tmp/run-08-home — window 1000000
  OK            HOOK_SCRIPT     installed /private/tmp/run-08-home/.claude/hooks/context-watch.mjs
  OK            HOOK_ENTRY      added
  OK            HOOK_WINDOW     HANDOFF_CONTEXT_WINDOW=1000000
  OK            EFFORT          effortLevel high
  OK            PROTOCOL_BLOCK  added
  OK            CONFLICTS       no contradicting lines outside the block
changes:
  - created /private/tmp/run-08-home/.claude/hooks/context-watch.mjs (copied from /private/tmp/eval-skills/agent-handoff/hooks/context-watch.mjs)
  - added UserPromptSubmit hook entry
  - effortLevel (unset) → high
  - appended the protocol block to /private/tmp/run-08-home/.claude/CLAUDE.md
backups:
  - /private/tmp/run-08-home/.claude/settings.json.bak-2026-09-07T19-23-16-973Z
  - /private/tmp/run-08-home/.claude/CLAUDE.md.bak-2026-09-07T19-23-16-974Z
all blocking items OK
EXIT:0
```

### assistant

Now the second check (verification) and a second apply to confirm idempotency.

### tool_use: Bash

```
{"command": "echo \"=== SECOND CHECK ===\"\nnode /private/tmp/eval-skills/token-economy/scripts/economy-setup.mjs --home /private/tmp/run-08-home 2>&1\necho \"EXIT:$?\"\necho \"=== SECOND APPLY (idempotency) ===\"\nnode /private/tmp/eval-skills/token-economy/scripts/economy-setup.mjs --home /private/tmp/run-08-home --apply --effort high 2>&1\necho \"EXIT:$?\""}
```

### tool_result

```
=== SECOND CHECK ===
token-economy setup CHECK — home /private/tmp/run-08-home — window 1000000
  OK            HOOK_SCRIPT     /private/tmp/run-08-home/.claude/hooks/context-watch.mjs
  OK            HOOK_ENTRY      UserPromptSubmit → context-watch.mjs
  OK            HOOK_WINDOW     HANDOFF_CONTEXT_WINDOW=1000000 HANDOFF_THRESHOLD_PCT=40
  INFO          EFFORT          effortLevel high
  OK            PROTOCOL_BLOCK  /private/tmp/run-08-home/.claude/CLAUDE.md carries the current block
  OK            CONFLICTS       no contradicting lines outside the block
all blocking items OK
EXIT:0
=== SECOND APPLY (idempotency) ===
token-economy setup APPLY — home /private/tmp/run-08-home — window 1000000
  OK            HOOK_SCRIPT     /private/tmp/run-08-home/.claude/hooks/context-watch.mjs
  OK            HOOK_ENTRY      UserPromptSubmit → context-watch.mjs
  OK            HOOK_WINDOW     HANDOFF_CONTEXT_WINDOW=1000000 HANDOFF_THRESHOLD_PCT=40
  OK            EFFORT          effortLevel high
  OK            PROTOCOL_BLOCK  /private/tmp/run-08-home/.claude/CLAUDE.md carries the current block
  OK            CONFLICTS       no contradicting lines outside the block
all blocking items OK
EXIT:0
```

### assistant

Everything is idempotent — no changes on the second apply, exit 0. Let me verify the resulting file contents and the settings.json before writing the findings file.

### tool_use: Bash

```
{"command": "echo \"=== settings.json ===\"; cat /private/tmp/run-08-home/.claude/settings.json\necho \"=== CLAUDE.md ===\"; cat /private/tmp/run-08-home/.claude/CLAUDE.md\necho \"=== backups present ===\"; ls -la /private/tmp/run-08-home/.claude/*.bak-* 2>&1\necho \"=== hook file ===\"; ls -la /private/tmp/run-08-home/.claude/hooks/"}
```

### tool_result

```
=== settings.json ===
{
  "model": "opus[1m]",
  "enabledPlugins": {
    "soltero-skills@soltero-skills-marketplace": true
  },
  "theme": "dark",
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "HANDOFF_CONTEXT_WINDOW=1000000 HANDOFF_THRESHOLD_PCT=40 node /private/tmp/run-08-home/.claude/hooks/context-watch.mjs",
            "timeout": 10
          }
        ]
      }
    ]
  },
  "effortLevel": "high"
}
=== CLAUDE.md ===
# Alex's global rules

- Prefer TypeScript.
- Run the tests before saying something is done.

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
=== backups present ===
-rw-r--r--@ 1 franciscosoltero  wheel   93 Sep  7 15:23 /private/tmp/run-08-home/.claude/CLAUDE.md.bak-2026-09-07T19-23-16-974Z
-rw-r--r--@ 1 franciscosoltero  wheel  126 Sep  7 15:23 /private/tmp/run-08-home/.claude/settings.json.bak-2026-09-07T19-23-16-973Z
=== hook file ===
total 8
drwxr-xr-x@ 3 franciscosoltero  wheel    96 Sep  7 15:23 .
drwxr-xr-x@ 8 franciscosoltero  wheel   256 Sep  7 15:23 ..
-rwxr-xr-x@ 1 franciscosoltero  wheel  3246 Sep  7 15:23 context-watch.mjs
```

### tool_use: Write

```
{"file_path": "/tmp/run-08-home/usage-findings.md", "content": "# Usage findings \u2014 2026-09-07\n\nProduced by `soltero-skills:token-economy`, audit mode. Command run:\n\n```\nnode /private/tmp/eval-skills/token-economy/scripts/token-audit.mjs --home /private/tmp/run-08-home --top 10 --json /private/tmp/run-08-home/audit.json\n```\n\nRoot: `/private/tmp/run-08-home/.claude/projects` \u2014 47 transcript files, 47\nmain-thread sessions with \u22651 assistant turn, one project (`acme`). Cache TTL assumed 60 min\n(the script's def
```

### tool_result

```
File created successfully at: /tmp/run-08-home/usage-findings.md (file state is current in your context — no need to Read it back)
```

### tool_use: Bash

```
{"command": "find /private/tmp/run-08-home -not -path \"*/projects/*\" -type f | sort"}
```

### tool_result

```
/private/tmp/run-08-home/.claude/CLAUDE.md
/private/tmp/run-08-home/.claude/CLAUDE.md.bak-2026-09-07T19-23-16-974Z
/private/tmp/run-08-home/.claude/hooks/context-watch.mjs
/private/tmp/run-08-home/.claude/settings.json
/private/tmp/run-08-home/.claude/settings.json.bak-2026-09-07T19-23-16-973Z
/private/tmp/run-08-home/audit-report.md
/private/tmp/run-08-home/audit.json
/private/tmp/run-08-home/usage-findings.md
```

### assistant

Task complete. Summary:

**Skill consulted:** `soltero-skills:token-economy`. Per the standing rule in the prompt, I checked `/tmp/eval-skills/` for an applicable SKILL.md; its own description ("I keep hitting/blowing through my usage limit," "20 percent left for the week") matched the user's message directly, and its SKILL.md was already inlined in my assignment file. I read its `references/protocol.md` and `references/findings-2026-09.md` for context, then ran its two bundled scripts against the sandboxed home (`/private/tmp/run-08-home` — the real path behind the `/tmp` symlink; the scripts' `import.meta.url === file://process.argv[1]` self-invocation check silently no-ops when invoked via the `/tmp` symlink path on macOS, so I had to call them via `/private/tmp/...` for the guard to match and produce output).

**Audit:** `token-audit.mjs` over the 47-session `acme` transcripts found, ranked by uncached input: (1) **HEADLESS_SESSIONS — 4,272,000 tokens, 50.8%** — 40 non-interactive `sdk-py` sessions (`review-0001`…`review-0040`), each an identical "review this change for security vulnerabilities" cold-context call at ~106,800 uncached tokens; no hook entry or plugin source exists in this `.claude`, so per the skill's rule I reported it (likely a git hook/CI job invoking the SDK directly) rather than touching it — that's the user's call. (2) **CACHE_TTL_BREAKS — 998,260, 11.9%** — one >60-min gap inside the 16-hour `orch-0001` session. (3) **COMPACTIONS — 300,160, 3.6%** — 2 compaction events in `compact-0001`. Plus counts-only: 18 of 30 dispatches unpinned (all in `orch-0001`), 151 whole-file reads / 0 ranged reads. I explicitly checked whether the long orchestrator session itself was a problem: its hit ratio (99.4%) beat the short sessions' (90.3%), and once its one TTL break and the other session's compactions are backed out, its residual per-turn cost (~4,500–4,950) lands near the short sessions' 3,050 — so the long session is not the lever; the break and the unpinned dispatches are.

**Files created/changed:**
- `/tmp/run-08-home/usage-findings.md` (new) — full findings, lever table, per-lever evidence, long-vs-short math.
- `/tmp/run-08-home/audit-report.md`, `/tmp/run-08-home/audit.json` (new) — raw script output backing every number.
- `/tmp/run-08-home/.claude/hooks/context-watch.mjs` (new, copied by `economy-setup.mjs` from `agent-handoff`).
- `/tmp/run-08-home/.claude/settings.json` (edited by the script — added `UserPromptSubmit` hook entry calibrated to `HANDOFF_CONTEXT_WINDOW=1000000` for `opus[1m]`, and `effortLevel: "high"`; `model` left untouched at `opus[1m]`). Backup: `settings.json.bak-2026-09-07T19-23-16-973Z`.
- `/tmp/run-08-home/.claude/CLAUDE.md` (edited — appended the token-economy protocol block between its markers, existing rules untouched). Backup: `CLAUDE.md.bak-2026-09-07T19-23-16-974Z`.

Ran check → apply → check as required: first check showed 4 blocking gaps (HOOK_SCRIPT, HOOK_ENTRY, HOOK_WINDOW, PROTOCOL_BLOCK all missing); apply (`--apply --effort high`) fixed all of them with backups; second check returned all items OK, exit 0. A follow-up second `--apply` made zero further changes, confirming idempotency. No conflicting lines were found in CLAUDE.md outside the block, so nothing was named as a conflict. The main model was never touched, per the user's explicit instruction and the skill's hard rule.
