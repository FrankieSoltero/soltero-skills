# Mechanical audit checklist (run first, report each ✓/✗)

Page-level:
- [ ] Title tag 50–60 chars, primary term present, unique across site
- [ ] Meta description 150–160 chars, states what the page/product IS
- [ ] Exactly one H1; H2/H3 hierarchy logical; headings phrased as the
      questions users ask where natural
- [ ] Answer-first: a direct 2–3 sentence answer under the main heading
- [ ] Schema present + valid (SoftwareApplication/Product/Organization;
      FAQPage where an FAQ exists) — validate, don't assume
- [ ] Canonical self-referencing; descriptive URL
- [ ] Internal links: docs ↔ product ↔ comparison pages
- [ ] Images compressed, alt text present
- [ ] Core Web Vitals: LCP <2.5s / INP <200ms / CLS <0.1

Site/crawler-level:
- [ ] robots.txt audited for AI agents — search-augmented crawlers allowed
      (citation-driving) vs training-only crawlers per policy; CDN/WAF
      bot-blocking checked (some block AI bots by default)
- [ ] Crawl logs return 200 for allowed agents (verify, don't assume)
- [ ] Key pages extractable with JS disabled
- [ ] Sitemap submitted to Google Search Console AND Bing Webmaster Tools
      (Bing's index feeds several assistants)
- [ ] llms.txt present (community convention — cheap insurance)
- [ ] Entity consistency: product named identically across site/GitHub/
      LinkedIn/Crunchbase; a plain "what is X" statement exists

Before any title/H1/meta change on an existing site:
- [ ] Cannibalization protocol run (GSC page+query ownership — see
      practices.md); one owner per primary query
