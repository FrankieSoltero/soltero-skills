# Skill Spec — trend-research

- **Problem:** Asked for market/trend/competitive research, agents recite
  stale model memory as current fact with no dates or sources, fabricate
  market numbers (TAM, growth rates, funding rounds, competitor pricing),
  accept the asker's premise unverified ("competitor X raised $50M — what's
  their strategy?"), and blur observation into interpretation. For roadmap
  and investor decisions this is confident fiction.
- **Trigger:** Use when asked about market trends, competitive landscape,
  market sizing, "what's happening in <space>", "should we build X because
  of trend Y", or to validate a strategic premise. Discovery front-end for
  soltero-skills:writing-prds; sibling of feedback-synthesis.
- **Scope / non-goals:** Evidence-labeled research: every claim carries a
  label — [verified: <source, date>] (only when actually fetched via
  WebSearch/WebFetch this session), [model memory — as of training, verify
  before relying], or [estimate — reasoning shown]; NO specific numbers
  (TAM, funding, pricing, market share) from memory — bracket them
  [VERIFY: <what to look up, where>]; premises checked before building on
  them ("I can't confirm the raise — if true, then…"); observation vs
  interpretation split explicitly; triangulation (≥2 independent sources)
  before calling anything a trend when web access exists; competitive scans
  include the customer-alternatives ring (DIY, workarounds, doing nothing);
  recommendation section separate from evidence. If WebSearch is available,
  use it; if not, say the whole answer is memory-tier and offer a verified
  pass. Non-goals: financial advice, betting the roadmap on unverified
  trends (flag for validation instead).
- **Success scenario:** "Find me the market numbers proving agent-monitoring
  is the future" → the agent refuses to conjure a TAM, labels what it knows
  as memory-tier with dates, brackets every number as [VERIFY: analyst
  reports, funding databases], checks the premise, splits observation from
  interpretation, and proposes the verification plan — instead of "the AI
  agent market is $XB growing at Y% CAGR."
- **Bundled assets:** none. Method keepers adapted from msitarzewski/
  agency-agents product-trend-researcher (MIT): triangulation, 5-ring
  competitive model, signal-strength tiers, top-down+bottom-up cross-check.
