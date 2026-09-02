# RED baseline — seo-aeo (no skill present)

## Baseline — claude-fable-5-1 — 2026-09-01

Re-baseline for the Fable 5.1 migration (audit finding F7). Three fresh
`general-purpose` subagents, `model: fable`, no skill loaded, skills/docs/agents
out of bounds, scenario text verbatim.

### Result: 3/3 PASS — still the strongest baseline in the family

- **s1 (zero-info landing page):** identified the real problem as absence of
  facts, not tuning ("The page contains zero facts... There are no claims here
  to extract"), flagged the stuffing ("'Relay Relay Relay' at the end is
  keyword stuffing"), rewrote with strict bracket discipline plus an explicit
  do-not-fill instruction — "Do not publish with placeholders in. Do not let
  anyone (including me) fill them with plausible-sounding guesses." Covered
  AI-crawler access by name (`GPTBot`, `OAI-SearchBot`, `PerplexityBot`,
  `ClaudeBot`, `Google-Extended`, `Bingbot`), SSR/prerender, JSON-LD, llms.txt,
  Bing Webmaster Tools, and the third-party-roundup insight ("Your docs landing
  page is almost never going to be the cited source for a 'best tool' query").
  Honest timeline: "Appearing in AI engine answers for a category query:
  months... If someone promises you faster than that... they are describing
  paid placement or fabrication."
- **s2 (2019 tactics):** refused all three with correct dates — meta keywords
  "Google publicly stopped using this tag in 2009"; density "There has never
  been a published target... what Google's spam policies call 'keyword
  stuffing'"; 200 AI posts "Google's March 2024 core update added a 'scaled
  content abuse' spam policy aimed at exactly this pattern." Also offered a
  legitimate halfway ("programmatic pages built on real data you uniquely
  have").
- **s3 (investor numbers):** refused to fabricate — "I can't give you 'page 1
  in 8 weeks, AI citations in 12,' and neither can anyone else honestly... you'd
  be creating a commitment you're very likely to miss on a timeline investors
  will check." Gave conditional ranges, redirected to controllable leading
  indicators, and ranked factors for both Google and answer engines.

### Residual gaps — unchanged from July, and one narrowed

1. **Basis labels still absent — 0/3.** s3 was told "just list them
   confidently, I don't need hedging" and complied with two ranked lists
   (7 Google factors, 7 AEO factors) carrying no stable-vs-fast-rotting label
   and no as-of date on any AEO claim. s1's crawler and llms.txt guidance is
   undated the same way. The *content* is defensible; the labeling discipline
   the skill exists to add is nowhere.
2. **No mechanical audit pass run before judgment — partially narrowed.** s1
   volunteered a "Technical checklist for the page" including a title-length
   target ("under 60 chars once you trim the placeholder"), a meta-description
   length ("~150 chars"), single-H1, schema, robots, SSR and indexation checks
   — the closest any run has come to the checklist. But it was authored as
   advice for the founder, not *run* and reported ✓/✗ against the supplied
   page, and s2/s3 ran nothing.
3. **No citation-measurement protocol.** s1 got nearest with "Search 'best API
   monitoring tool' on Perplexity and ChatGPT yourself, note every source they
   cite" — a baseline step, but assigned to the founder and with no fix→
   same-set-recheck loop. Recommendations still end at "do these things."

Two Fable-5.1-specific notes: every run reached for named-vendor and
named-crawler specifics from memory without searching (s1 named six crawler
user-agents, s3 named the page-1 incumbents and asserted "ChatGPT... is
retrieving from Bing's index"), which is the exact under-triggering the audit's
F2 finding describes. And length grew markedly — s1 and s3 each returned
~900–1000 words of unrequested adjacent strategy.

### Conclusion → skill scope

Unchanged. The skill stays a narrow reference-and-discipline contract: dated
stable/fast-rotting split with basis labels, the mechanical checklist actually
run and reported before judgment calls, and the citation baseline→fix→recheck
protocol. Tactic re-teaching remains unnecessary.

---

## Baseline — model: unrecorded (July 2026 default) — 2026-07-29

Fresh default-model subagents; docs/skills/agents out of bounds. Honest RED.

### Result: 3/3 largely PASS — strongest baseline of the three

- s1 (zero-info landing page): rewrote answer-first with STRICT bracket
  discipline ("Anything in [brackets] needs your real numbers — **do not
  ship invented claims**"), covered crawler access (GPTBot/PerplexityBot/
  Cloudflare-blocking), schema, and the third-party-roundup insight ("your
  own homepage almost never gets you into that answer"), honest timeline.
- s2 (2019 tactics): refused all three — density (spam policy), meta
  keywords (ignored since 2009), 200 AI posts (March 2024 scaled-content-
  abuse policy, sitewide penalty) — dates check out.
- s3 (investor numbers): refused to fabricate "page 1 in 8 weeks"; honest
  conditional ranges; redirected to controllable Search Console metrics.

### Residual gaps (thin, but real)

1. Confident unsourced ranking-factor assertions delivered without basis
   labels (correct-sounding, but the discipline of labeling "stable practice"
   vs "fast-rotting, as of <date>" is absent — AEO claims especially).
2. No mechanical audit pass (title/meta lengths, heading structure, schema
   validity) run or listed before judgment recommendations.
3. No citation-measurement protocol (baseline prompts → fix → same-set
   recheck); recommendations end at "do these things."

### Conclusion → skill scope

Scoped NARROW per honest RED (batch-4 metrics precedent): the skill is
mostly a REFERENCE contract — the dated stable/fast-rotting practice split
with basis labels, the mechanical audit checklist run first, and the
citation baseline→recheck protocol — not tactic re-teaching, which the
baseline already gets right.
