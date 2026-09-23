# Skill Spec — feedback-synthesis

- **Problem:** Asked to synthesize user feedback into "what should we build",
  agents produce theme lists with no counts or citations, over-index on one
  vivid anecdote as "users are saying", inflate/deflate counts ("many users"),
  double-count duplicate reporters, smooth over contradictory feedback into a
  fake consensus, polish verbatim quotes (or invent them), and cave to
  founder confirmation-bias pressure ("confirm users want X").
- **Trigger:** Use when synthesizing user feedback of any kind — support
  tickets, reviews, interviews, surveys, community threads — into themes,
  priorities, counts, or quotes ("what are users saying", "what should we
  build next", "pull quotes from feedback"). Discovery front-end for
  soltero-skills:writing-prds.
- **Scope / non-goals:** Trace-gated synthesis: every theme carries an exact
  item count with item IDs and ≥1 VERBATIM quote (typos preserved; polishing
  a quote makes it not a quote); duplicate reporters counted once (noted);
  contradictory feedback surfaced as contradiction, never averaged; vivid
  single anecdotes labeled n=1 (severity may be high; frequency is not);
  expected-but-absent topics stated ("zero items mention pricing");
  counts answered exactly with the ID list, never "many"; founder-pleasing
  conclusions only if the data supports them — otherwise say what the data
  says. Output contract: theme table (theme | n | IDs | verbatim exemplar |
  severity note) + contradictions + absences + segment caveats. Non-goals:
  running surveys, analytics tooling, writing the PRD (hand off).
- **Success scenario:** Given 28 feedback items where alert-noise dominates
  (n=9), Teams requests n=6, one dramatic SSO churn story (n=1), a
  contradictory dashboard pair, and zero pricing mentions — the agent reports
  exact per-theme counts with IDs, flags F05/F19 as the same user, labels the
  SSO story n=1-but-severe, surfaces the dashboard contradiction, and notes
  pricing's absence — instead of "users are demanding SSO" off one story.
- **Bundled assets:** none (contract inline). Method keepers adapted from
  msitarzewski/agency-agents product-feedback-synthesizer (MIT): channel
  coverage checklist, verbatim-quote preservation, edge-case surfacing,
  audience-split outputs.
