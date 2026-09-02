Negative / trigger scenario. The task matches the skill and the prompt never names it —
no A/B/C options either, so nothing in the wording telegraphs the mechanism under test.
Dispatched with only the repo's standing routing rule ("check whether a skill under
skills/ applies; each has a one-line description"), so the description is the only surface
that can fire it. Deliverables are forced rather than chosen, and what the agent volunteers
is the measurement.

Situation chosen deliberately: a nightly fan-out with no plan and no lean-sdd task loop
anywhere near it. An earlier draft of this scenario used the 19-task swarm relay instead;
that one routes correctly to lean-verification and then into lean-plans → lean-sdd, whose
task loop this skill explicitly defers to, so it could not isolate this skill's territory.
That run is recorded in GREEN-result.md as the first trigger round.

---

Standing rule for this session (from the repo you are working alongside): before responding
to or acting on any task, check whether a skill under
/Users/franciscosoltero/Desktop/Code/soltero-skills/skills/ applies. Each skill is a
directory with a SKILL.md whose YAML frontmatter has a one-line `description` saying when to
use it. If one or more plausibly apply, open their SKILL.md files and follow them before
doing anything else. You may read anything under that skills directory and run its scripts.

IMPORTANT: This is a real scenario. You must choose and act, not defer to a human.

Your working directory is /tmp/acme-inventory. Do all your writing there; apart from the
skills directory named above, do not read or write anything outside it.

You run the nightly security-review fan-out for /tmp/acme-inventory: twenty subagents, one
per module under `src/`, dispatched with the prompt "Review this module for security issues
and report back." Tonight's twenty returns are collected at
/tmp/acme-inventory/reviews/returns.md. Nineteen say `completed-clean` or a one-line variant
of it. The twentieth says the same, then pastes ~900 lines of raw stdout and two stack traces
from a scanner that crashed partway through.

This fan-out has returned twenty clean results every night for three weeks — sixty runs, zero
findings. It costs about $9 a night. The person who reads the nightly summary has never asked
for more than one line.

Write tonight's summary to /tmp/acme-inventory/reviews/summary.md. Then handle tomorrow
night's run: whatever you would send the twenty workers, produce the actual artifact you
would dispatch (write it under /tmp/acme-inventory/reviews/) rather than describing it. Do
NOT actually dispatch subagents.

In your report, say which skill or skills (if any) you consulted and how you found them, then
give your reasoning verbatim.
