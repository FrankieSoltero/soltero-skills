# SEO & AEO practices

**Freshness header:** SEO fundamentals below are stable practice. Everything
under AEO is fast-rotting — dated 2026-07-29, sourced from
msitarzewski/agency-agents (MIT) material with claims re-labeled, plus model
knowledge. Refresh the AEO half via a research sweep (agent-playbook update
pattern) before high-stakes use. Items marked [UNSOURCED] came with no
citation — verify before treating as fact.

## SEO fundamentals (stable)

- **Intent over keywords:** match the page to the query's job (buy, compare,
  learn, fix). Keyword density is not a ranking factor and hasn't been for
  a decade; density targets are keyword stuffing (named in Google's spam
  policies). Meta keywords tag: ignored since 2009 — a no-op that leaks
  strategy.
- **Mechanical on-page checks (run before judgment calls):** title 50–60
  chars with the primary term; meta description 150–160 chars; one H1;
  logical H2/H3 hierarchy; descriptive URLs; internal links from related
  pages (docs → product); self-referencing canonicals; images compressed
  (<100KB WebP/AVIF where feasible) with alt text; Core Web Vitals gates
  LCP <2.5s / INP <200ms / CLS <0.1.
- **Cannibalization protocol (before ANY title/H1/meta change on an existing
  site):** query Search Console with dimensions=[page,query]; the page with
  the most impressions/clicks OWNS a query; never duplicate a primary
  keyword across two titles/H1s; conflict signal = 2+ pages in top 20 for
  the same query with split clicks; resolution = one owner, de-optimize the
  others, internal-link them to the owner.
- **Scaled content abuse:** mass-produced posts for rankings (AI or human)
  are an explicit Google spam policy target (March 2024); penalties are
  sitewide. A handful of genuinely expert pages (comparisons, alternatives,
  deep technical) beats hundreds of thin ones.
- **Never promise rankings or dates.** Head terms against incumbents are
  9–18+ months if ever; long-tail/comparison queries are the realistic
  early wins. Report controllable inputs (pages shipped, non-branded
  impressions from Search Console) — auditable numbers, not rank promises.

## AEO — answer-engine optimization (dated 2026-07-29; sweep before relying)

Being cited by ChatGPT/Claude/Perplexity/AI Overviews is a distinct
discipline from ranking:

- **Crawler access first:** audit robots.txt for AI user agents, and
  distinguish the two classes — search-augmented crawlers that drive
  citations (e.g. PerplexityBot, OAI-SearchBot) vs pure training crawlers
  (e.g. Google-Extended affects Gemini training, not search). Blocking by
  ignorance (stale robots.txt) is the most common AEO failure. Verify crawl
  logs return 200 for allowed agents.
- **Citable structure:** answer-first sections (question as heading, direct
  2–3 sentence answer immediately below), comparison tables, FAQ blocks;
  extractable without executing JS — test key pages with JS disabled.
  Content-availability ranking: clean semantic HTML+schema > SSR > JS-SPA.
- **Entity clarity:** consistent product naming everywhere; an About/what-is
  page that states plainly what the product is and who it's for; profiles
  that agree (GitHub, LinkedIn, Crunchbase); Organization/Product/
  SoftwareApplication + FAQPage schema.
- **llms.txt / llms-full.txt** at root — community convention (Jeremy
  Howard, 2024), not a standard; cheap insurance, adoption varies.
- **Third-party footprint moves AI answers:** Reddit threads, review sites,
  "best X tools" roundups that include you — AI assistants weight these
  heavily [UNSOURCED but multiply reported].
- **Prompt-pattern → content mapping:** "best X for Y" → comparison page;
  "X vs Y" → dedicated comparison; "how to choose" → buyer's guide.
- **Citation measurement protocol:** baseline 20–40 real buyer prompts
  across the major assistants; record who's cited; diagnose "lost prompts"
  (you absent, competitor present); re-test the SAME prompt set ~14 days
  after changes. AI answers are non-deterministic — say "improve citation
  likelihood," never "get cited."
