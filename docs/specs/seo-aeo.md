# Skill Spec — seo-aeo

- **Problem:** Asked to "SEO this" or "help us rank / get cited by AI search",
  agents apply 2019-era tactics from memory (keyword stuffing, meta-keyword
  tags, word-count padding), invent ranking-factor claims with no source, and
  don't know AEO (answer-engine optimization — being cited by ChatGPT/
  Perplexity/AI Overviews) exists as a distinct discipline with different
  mechanics (citable structure, entity clarity, llms.txt, schema).
- **Trigger:** Use when optimizing content or a site for search discovery —
  "SEO", "rank for", "organic traffic", "get cited by AI/ChatGPT/Perplexity",
  "AI Overviews", "answer engine", "llms.txt", schema markup, meta
  descriptions — or when content-marketing hands off a draft for search
  optimization. Child of soltero-skills:content-marketing.
- **Scope / non-goals:** (1) A current-practice reference split into SEO
  fundamentals (stable: intent matching, titles, internal linking, schema)
  and AEO practices (fast-rotting: explicitly dated, sweep-maintained,
  refreshed via the agent-playbook update pattern); (2) discipline rules: no
  ranking-factor claims without a source label, no keyword stuffing (density
  targets are the tell), optimize for the query's intent not the keyword
  string; (3) an audit output contract: prioritized findings each with
  what/why/fix, mechanical checks first (title/meta lengths, heading
  structure, schema validity, link targets) before judgment calls; (4) AEO
  checklist: extractable answers, entity/source clarity, freshness signals.
  Non-goals: paid search, off-page/link-building outreach, analytics setup.
- **Success scenario:** "Optimize our docs landing page to get cited by AI
  search" → the agent runs the mechanical checks (title/meta/headings/schema),
  applies the dated AEO checklist (answer-first sections, entity-clear
  phrasing), labels each recommendation's basis ("stable practice" vs "AEO,
  as of <date>, refresh via sweep"), and does NOT stuff keywords or promise
  rankings — instead of confidently reciting stale tactics as timeless truth.
- **Bundled assets:** `references/practices.md` (SEO stable + AEO dated
  sections, sweep-maintained header), `references/audit-checklist.md`. Raw
  material adapted from msitarzewski/agency-agents seo/aeo/agentic-search/
  ai-citation agents (MIT), claims re-labeled by evidence.
