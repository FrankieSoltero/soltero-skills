# RED baseline — writing-prds (no skill)

Date: 2026-07-23. Fresh general-purpose subagents (model: sonnet), one per scenario,
skill absent. Scenarios are OPEN-ENDED realistic requests (not A/B/C) per the
walkthrough-tutor precedent: A/B/C options describing a dialogue-driven process would
telegraph the answer for a process skill; open-ended framing reveals the natural default.

## Headline — the default is FLAG-AND-PROCEED, one-shot PRDs, and gate violations

All three baselines failed. None asked a single clarifying question before producing a
full PRD (or code). The consistent pattern: invent the founder/PM-owned decisions, label
them "ASSUMPTION", ship the finished artifact anyway, and park the questions at the
bottom where they no longer block anything.

- **Scenario 1 (founder "just write it"):** one-shot full 10-section PRD, zero questions.
  Invented five product decisions (feedback destination, capture scope, who can submit,
  identity model, 180-day retention) as "my best default … flagged clearly", plus
  invented success metrics, rollout plan, and a DB schema. Explicit rationalizations,
  verbatim: "writing this now rather than waiting on you" and "cheaper than the team
  discovering it in review." No section-by-section validation, no review gate; closes
  with "this is ready for eng to size."
- **Scenario 2 (Atlas, 4 subsystems, board at 3pm):** one-shot mega-PRD covering all four
  subsystems, zero questions ("I wrote it fast, so I filled a handful of gaps with
  explicit ASSUMPTIONS rather than stopping to ask"). Invented goal targets presented in
  a table (40% multi-module adoption, "Net revenue retention 115%+", "DAU/MAU 35%+").
  CREDIT: it did propose phasing in §8 and said "all four, one launch date is a bigger
  commitment" — but only as an aside inside the delivered mega-doc; the PRD itself
  remains one doc, one launch, unquestioned.
- **Scenario 3 (build now, PRD later):** verbal pushback, behavioral violation. The agent
  argued (well!) against PRD-afterward — then scaffolded the Prisma models and CRUD
  routes anyway, before any requirements existed or anyone signed off, choosing its own
  defaults ("defaulting to 30 [day retention] if no one objects", structured-JSON
  filters, soft-delete semantics). Exactly the schema-baking it warned about, performed
  by itself. The "design note" it wrote is a proposal it did not wait on.

## Failure summary — what the skill must fix

1. **No dialogue:** requirements are invented via default-picking, never elicited. The
   skill must force one-question-at-a-time elicitation before any PRD content exists.
2. **Flag-and-proceed:** assumption labels are used as a license to ship. The skill must
   make decision-owning questions BLOCKING — the artifact stops until answered.
3. **No hard gate:** code/design work starts before requirements are approved
   (scenario 3). The skill needs a brainstorming-style HARD-GATE.
4. **No decomposition stop:** a 4-subsystem bundle is accepted as one PRD (scenario 2).
   Decomposition must be raised BEFORE drafting, not as an aside inside the mega-doc.
5. **No approval loop:** all three shipped finished docs with no section-by-section
   check-ins and no user review gate.
