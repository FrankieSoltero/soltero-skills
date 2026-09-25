# Skill Spec — content-marketing

- **Problem:** Asked to write marketing content (launch posts, landing copy,
  blog posts, announcements), agents produce plausible AI-slop: invented
  statistics and superlatives ("10x faster", "trusted by thousands") with no
  source, product claims that don't trace to what the product actually does,
  generic LinkedIn-brochure voice, and no brief — audience, goal, and CTA are
  guessed. Persona-agent collections (agency-agents) wrap this in 236-line
  costumes with fantasy KPIs and no checks.
- **Trigger:** Use when writing or editing any outward-facing marketing/
  content artifact — launch post, blog post, landing page copy, announcement,
  social post, newsletter — or when asked to "market"/"promote"/"write copy
  for" something. Parent of soltero-skills:seo-aeo and
  soltero-skills:email-marketing; fan-out via the content-adapter agent.
- **Scope / non-goals:** A brief-first, claim-gated content process: (1) a
  20-second brief (audience, goal, single CTA, platform(s), voice source)
  before drafting — batched questions when unknowns block, defaults flagged
  when they don't; (2) claim tracing — every factual claim (number, feature,
  comparison, customer statement) traces to a named source (repo/docs/user
  input) or is cut/replaced with a placeholder the user must fill; NO invented
  stats, superlatives capped; (3) voice — derive from the repo's existing
  brand-voice file if present, else propose 3-5 voice rules and get approval;
  banned-phrase list (AI-slop tells); (4) platform constraint check against
  the bundled constraints table before delivery; (5) self-review gate (claims
  table, constraint pass, CTA present, voice rules) appended to delivery.
  Non-goals: SEO/AEO mechanics (child skill), email sequences (child skill),
  paid ads, actual publishing.
- **Success scenario:** "Write a launch post for our API tool, make it
  punchy" with rough notes containing no numbers → the agent asks 2-3 batched
  blocking questions (audience/CTA/platform), drafts with zero invented
  metrics (placeholders like "[X% — need real benchmark]" where a number
  would sell), traces the three feature claims to the README, and delivers
  with a claims table and constraint check — instead of "blazingly fast,
  10x cheaper, trusted by developers everywhere."
- **Bundled assets:** `references/voice-and-slop.md` (voice derivation +
  banned AI-slop phrases), `references/platform-constraints.md` (char/format
  limits table, sweep-maintained), `references/brief-template.md`. Raw
  material adapted from msitarzewski/agency-agents (MIT), rebuilt to house
  verification standards.
