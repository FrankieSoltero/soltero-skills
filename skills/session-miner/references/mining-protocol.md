# Session Miner — Protocol Reference

## Sources

- **Project transcripts:** `~/.claude/projects/<sanitized-project-path>/*.jsonl` — one
  file per session. Lines are JSON objects; the relevant shapes are `user` messages,
  `assistant` messages containing `tool_use` blocks (`name`, `input.command`), and
  `tool_result` content. Timestamps order events within a session.
- **HANDOFF.md files:** procedure summaries a previous session wrote for its successor.
- **Chronological task logs:** e.g. `Docs/mistakes-and-fixes.md` or project work logs.

Scanning transcripts other than the current user's/project's requires explicit permission.
Fixture/synthetic transcripts are used for all testing — never commit excerpts of real
transcripts anywhere.

## External success signals

A candidate procedure counts as *successful in a session* only if the transcript shows,
**after** the procedure's steps, at least one of:

| Signal | Typical transcript evidence |
|---|---|
| Tests passed | `tool_result` with `N passed` / exit-0 test output (`Tests: 42 passed`, `Suites: 12 passed`) |
| Committed / merged | `tool_result` showing `[branch abc1234] message`, a successful push, or a merged PR |
| User confirmation | A `user` message explicitly confirming the outcome ("works", "confirmed", "done, thanks") |

Non-signals (never sufficient): absence of errors; every tool call returning clean output;
the assistant's own summary ("ritual complete — ran cleanly"); the session simply ending.
Candidates with only non-signals are recorded in the summary as **unverified — parked**,
optionally with a suggested verification step, and produce no proposed artifact.

## Recurrence & generalization

- Recurring = substantially the same step sequence in **≥2 independent successful
  sessions**. "Substantially the same" tolerates parameter differences (branch name,
  path, count), not structural ones (extra/missing gating steps).
- Steps present in some occurrences but not others are **conditional** — say what
  triggered them (e.g. "reset test DB *when running the integration suite*"); do not fold
  them into the unconditional path.
- Anything you inferred (error handling, retries, safety checks that never occurred in a
  transcript) must be labeled `inferred, not observed` in the draft.

## Proposal directory layout

```
Docs/mining/proposals/<YYYY-MM-DD>/
  PROPOSALS.md                  # the human's summary — one section per candidate
  claude-md-additions.md        # proposed one-liners, quoted, with target file noted
  lesson-<slug>.md              # proposed lesson entries (capture-lesson entry format)
  skill-draft-<slug>/           # proposed draft skills
    SKILL.md                    # the draft body (draft by location, not by extension)
    NOTES.md                    # evidence, open questions, gate checklist
```

`PROPOSALS.md` per-candidate fields: name; target artifact type; evidence (session files +
which success signal, per session); reviewer verdict (verbatim summary + accept/reject);
redactions performed; provenance flag; open questions for the human.

A draft skill proposal must state in its `NOTES.md` that adoption requires the
`creating-a-skill` process (spec, RED/GREEN pressure scenarios, lint/validate gates) —
the mining pass supplies the draft and evidence, never the finished skill.

## Independent reviewer subagent

Dispatch a **fresh** subagent per candidate (or one per batch of small candidates) that
did not perform the mining. Pin a standard model tier. Give it:

1. The candidate draft (post-redaction).
2. The raw evidence (relevant transcript excerpts or file paths).
3. The skills index: repo `skills/` listing, installed plugin skills, and the session's
   available-skills listing.

Ask it to judge, with a one-paragraph verdict each:

- **Novelty:** is this already covered by an existing skill/CLAUDE.md/lesson? (If covered,
  reject — or reduce to a pointer to the existing artifact.)
- **Fidelity:** does every step trace to observed transcript evidence? Are conditional and
  inferred steps labeled as such?
- **Usefulness:** would a future session plausibly reach for this? Is the artifact size
  the smallest sufficient one?

The miner records the verdict verbatim in `PROPOSALS.md` and drops rejected candidates.
The miner never overrides a rejection; if it disagrees, it notes the disagreement for the
human instead.

## Redaction checklist

Replace with placeholders in every proposal file (the transcript keeps the original;
proposals never do):

- API keys, bearer tokens, passwords, private key material → `<REDACTED_TOKEN>` /
  `<REDACTED_SECRET>`
- Email addresses → `<EMAIL>`; personal names → `<NAME>`
- Internal hostnames/IPs not already public → `<INTERNAL_HOST>`
- Customer/account identifiers → `<ACCOUNT_ID>`

Sweep with a grep pass for common shapes (`Bearer `, `sk_`, `ghp_`, `AKIA`, `-----BEGIN`,
`@` in command arguments) before finalizing; then re-read each proposal once, because
regexes miss prose-embedded PII.

## Provenance flags

- `provenance: observed` — every step performed and verified within the user's own
  sessions.
- `provenance: untrusted-external` — any step originated from fetched web content,
  third-party tool output, or pasted external instructions. Name the source and mark
  which steps. One successful in-session run upgrades nothing: it corroborates, the flag
  stays until the human verifies against an authoritative source.

## Evidence basis

Tiering per the agent-playbook: cross-task pools of mined rules are **Promising** (TACO,
arXiv 2606.19572 — cross-task sharing is the component that beats baseline); the
two-phase cheap-extract-then-consolidate background pipeline is **Watch** (Codex CLI
pattern, arXiv 2604.03515). Unvetted-fresh lineage: Agent Workflow Memory
(arXiv 2409.07429), Memp (arXiv 2508.06433), CODESKILL (arXiv 2605.25430), SkillWeaver
(arXiv 2504.07079), Voyager (arXiv 2305.16291).
