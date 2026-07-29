# Email sequences, craft, and deliverability

**Freshness:** distilled 2026-07-29 from msitarzewski/agency-agents (MIT) +
model knowledge; [UNSOURCED] marks their uncited specifics. Deliverability
rules rot — sweep before high-stakes sends.

## Sequence shapes ([UNSOURCED] cadences — coherent defaults, not law)

- Cold outbound: 3–5 touches / ~10–14 days. Angle → proof → friction-drop →
  (optional real-urgency) → honest breakup. Breakup emails often get the
  highest reply rate BECAUSE they're honest.
- Welcome/onboarding: 4–5 emails / ~14 days. Nurture: 8–12 / 60–90 days.
  Reactivation: 2–3 / 14–21 days.
- Every sequence: explicit exit conditions (reply, convert, unsub, hard
  bounce, complaint, inactivity) and immediate removal on ANY reply.

## Craft rules

- Subject ≤ ~50 chars, honest, specific ("API error budgets at {Company}"
  beats clickbait). Preview text is part of the subject line's job.
- Body scannable: short paragraphs, one idea, one CTA. Drop the ask
  progressively across touches (call → click → reply).
- Honest-cold framing outperforms fake warmth with technical audiences.
- Segment cold lists by what you actually know (stage, stack); hand-research
  the top slice (real personalization converts multiples better than
  templates [UNSOURCED]) and template the tail honestly.

## Deliverability floor (verifiable; check current requirements)

- SPF + DKIM + DMARC aligned; Return-Path aligned.
- Gmail/Yahoo bulk-sender rules (in force since Feb 2024): one-click
  unsubscribe (RFC 8058) + List-Unsubscribe header at 5k+/day; spam
  complaint rate hard limit 0.30% — target <0.10%.
- Ramp cold domains: ~30–50/day initially [UNSOURCED]; use a secondary
  sending domain for outbound so the primary domain's transactional mail is
  never at risk; separate transactional vs marketing streams.
- Hard bounces removed ≤24h; soft bounces suppressed after 3–5 consecutive
  failures; suppress role addresses (info@, admin@).
- Post-Apple-MPP: open rates are inflated — optimize CTR/CTOR/conversion,
  never opens; send-time optimization must train on clicks.
- Alert thresholds (actionable): complaints >0.10–0.20%, unsubs >0.5–1%,
  hard bounces >1%, CTR <1.5% → stop and diagnose [UNSOURCED thresholds].
- Consent records: date, method, source URL, scope (GDPR Art. 7);
  zero-engagement purge after 12–24 months.
