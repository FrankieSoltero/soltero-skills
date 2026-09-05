Negative / trigger scenario. The task matches the skill and the prompt never names it — no
A/B/C options either, so nothing in the wording telegraphs the mechanism under test.
Dispatched with only the repo's standing routing rule, so the description is the only surface
that can fire it. Deliverables are forced rather than chosen; what the agent volunteers is the
measurement.

---

Standing rule for this session (from the repo you are working alongside): before responding
to or acting on any task, check whether a skill under
/Users/franciscosoltero/Desktop/Code/soltero-skills/skills/ applies. Each skill is a
directory with a SKILL.md whose YAML frontmatter has a one-line `description` saying when to
use it. If one or more plausibly apply, open their SKILL.md files and follow them before
doing anything else. You may read anything under that skills directory and run its scripts.

IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your working directory is /tmp/acme-ledger-s1. Your user-scope config directory for this task
is /tmp/acme-home-s1/.claude — treat it exactly as you would ~/.claude (read it, write there
if something belongs at user scope, and pass /tmp/acme-home-s1 wherever a tool wants your home
directory). Apart from the skills directory named above, do not
read or write anything outside /tmp/acme-ledger-s1 and /tmp/acme-home-s1.

/tmp/acme-ledger-s1 is a Node ledger service. A new engineer starts Monday, and the agent the
team uses keeps getting lost in the repo — it starts the server the wrong way, edits the wrong
file, and asks the same questions every session. The lead's message, verbatim:

    Make this codebase easier to onboard to. Document it so a person and an agent can both
    get going without asking me anything. I'm in meetings all afternoon, just get it done —
    there's some docs in there already, use what's useful.

Produce the actual documentation, not a description of it: write it into the repo. Commit as
you see fit. In your final message, say which skill or skills (if any) you consulted and how you
found them, list every file you created or changed, and give your reasoning verbatim.

<!-- ===== EVALUATOR ONLY — cut everything below this line before dispatching ===== -->

**Failure modes under test:** (1) copies stale claims from README.md (`npm run dev`,
`src/server.js`, port 3000, `config/`, `npm run test:unit`, `docs/ARCHITECTURE.md`) into new
docs without checking package.json / the tree; (2) leaves README.md and docs/SETUP.md
contradicting each other, or leaves the stray `doc/` next to `docs/`; (3) writes one long
narrative entry doc instead of a short index with depth in a docs root; (4) states conventions
the repo never declared (commit style, branching) as rules; (5) records no user-scope standard
in /tmp/acme-home-s1/.claude, so the next repo gets a different shape; (6) never mentions the
dynamic plugin discovery in src/plugins/registry.js, the one mechanism an agent cannot infer.

**PASS:** an entry doc whose every command exists in package.json/Makefile and every path
resolves; docs/SETUP.md's true content wins over README's stale content and the contradiction
is gone; one docs root; the plugin mechanism and the rounding rule surface; a standard file
exists at user scope (or the skill's bootstrap ran and paused for review); conventions labeled
declared vs observed.
