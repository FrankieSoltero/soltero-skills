# Voice derivation & the AI-slop banlist

## Deriving voice

1. If the repo/user has a brand-voice file (`docs/brand-voice.md`,
   `marketing/voice.md`, or named in CLAUDE.md), it governs. Read it first.
2. If none exists: propose 3–5 voice rules AS PAIRED EXAMPLES (on-voice vs
   off-voice sentence for each rule — the paired format is the load-bearing
   part) and get approval before drafting at scale. Offer to save the
   approved rules as `docs/brand-voice.md` so future sessions inherit them.
3. Early-stage honesty IS a voice asset: "launched two weeks ago" reads
   better to developers than faked scale. Never write copy that implies
   maturity, customer counts, or traction the product doesn't have.

## The AI-slop banlist

Phrases and patterns that mark copy as machine-generated filler. Do not ship:

- "revolutionize / game-changer / cutting-edge / next-generation / seamless /
  supercharge / unleash / unlock the power of / take X to the next level"
- "In today's fast-paced world…", "Look no further", "…has never been easier"
- "Join the [X] revolution", "Start your journey"
- Unearned superlatives: "world's most advanced", "industry-leading",
  "best-in-class" — allowed ONLY with a cited basis
- Triple-emoji seasoning and 🚀 as punctuation
- Em-dash-chained triads ("fast, reliable, and secure — built for you")
  as a reflex; use only when the three items are real and distinct
- Fake urgency ("limited time", "don't miss out") without a real deadline
- Rhetorical-question openers ("Tired of X?") more than ~never

## Mannered prose (the failure the banlist above doesn't catch)

Mannered prose substitutes metaphor and flourish for direct statement.
Instead of "a parameter worth varying," the mannered writer produces "a dial
worth turning." Instead of "this point still matters," they write "this
point earns its keep." The phrases exist to display the writer, not to
convey the idea, and readers can tell. That is why mannered prose irritates:
it makes the reader work harder so the writer can perform. It is also
imprecise — metaphors drag in connotations the writer did not choose and
cannot control. The fix is to say what you mean; when a literal phrase is
available, use it. Copy can contain none of the banned phrases above and
still fail this way.

## Claim hygiene (the hard rule)

Every number, comparison, customer statement, or capability claim traces to a
named source: the repo/docs, user-provided input, or a real external citation.
No source → cut it, or ship a visible placeholder `[NEED: real benchmark]`
for the user to fill. "Up to X%" with no measurement behind it is an invented
statistic wearing a hedge.
