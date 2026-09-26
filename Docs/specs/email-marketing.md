# Skill Spec — email-marketing

- **Problem:** Asked to write customer-acquisition email (cold outreach,
  onboarding sequences, newsletters), agents produce spam-pattern copy
  (clickbait subjects, wall-of-text pitches, fake urgency, "quick question"
  clichés), invent personalization ("loved your recent post" with no post
  named), make product claims that don't trace to the product, and ignore
  deliverability/compliance basics (CAN-SPAM/GDPR unsubscribe, list-consent).
  For a startup actively acquiring customers this is outward-facing risk.
- **Trigger:** Use when writing or planning any email that will reach
  customers or prospects — cold/outbound outreach, drip/onboarding sequences,
  newsletters, product announcements — or when asked about subject lines,
  open rates, deliverability, or email cadence. Child of
  soltero-skills:content-marketing; sales-outreach shape for the startup use
  case until a dedicated sales suite exists.
- **Scope / non-goals:** (1) Hard gates: every personalization traces to a
  named real fact about the recipient (provided research, their public work)
  or is cut — no invented familiarity; every product claim traces to
  repo/docs/user input (content-marketing's claim rule inherited); compliance
  floor (working unsubscribe, honest subject, sender identity, consent basis)
  stated per artifact; (2) craft: one email = one job (single CTA), subject
  under ~50 chars and honest, body scannable, sequence structure (N touches,
  spacing, distinct value per touch — never "just bumping this up" x3);
  (3) delivery contract: each email/sequence ships with a claims+
  personalization trace table and a compliance line. Non-goals: ESP setup,
  list management tooling, legal advice (flag, don't rule).
- **Success scenario:** "Write a 3-email cold sequence for CTOs about our
  monitoring tool" with a feature list but no prospect research → the agent
  asks for/derives real personalization sources or writes an explicitly
  research-shaped template with placeholders ("[specific incident their team
  had — from their eng blog]"), keeps subjects honest and short, distinct
  value per touch, claims traced to the feature list, unsubscribe noted —
  instead of "Quick question {firstName} — loved what you're building! Our
  AI-powered platform 10x's your uptime."
- **Bundled assets:** `references/sequences-and-craft.md` (sequence
  frameworks, subject/body rules, deliverability basics — dated where
  fast-rotting), compliance floor inline. Raw material adapted from
  msitarzewski/agency-agents email-strategist (MIT), rebuilt with trace
  gates.
