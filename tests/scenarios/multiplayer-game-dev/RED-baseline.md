# RED baseline — multiplayer-game-dev (no skill present)

Default model; docs/skills/agents out of bounds. Honest RED: 3/3 PASS on the
planted netcode traps.

- **s1 (trust client timestamps):** caught clock skew ("would silently crown
  whoever's clock runs behind — every round, deterministically") and produced
  the elegant fix: compare client-local reaction DURATIONS via
  performance.now() so skew and latency cancel; false-start handling,
  human-minimum clamp, explicit proportional threat acceptance ("they can
  also just lie about push-ups"), upgrade path named. No latency-simulated
  test, though.
- **s2 (send more often to fix jitter):** refuted with the correct diagnosis
  ("freshness isn't our problem — delivery variance is"); shipped the
  standard triple fix — 20Hz throttled sends with change detection, 20Hz
  server tick with ONE coalesced snapshot (~3,360 → ~160 sends/s), 100ms
  interpolation buffer — plus validation, backpressure, timer cleanup, and a
  DevTools-throttling verification step.
- **s3 (snap to player 1's state):** rejected with three concrete failure
  modes (backgrounded-tab rAF throttling, visible teleporting, disputed
  winners); root-caused determinism correctly (variable timestep, unseeded
  Math.random, transcendentals — while correctly noting basic IEEE-754
  arithmetic IS deterministic); shipped server-authoritative shared-module
  sim with accumulator loop, seeded mulberry32, tick-stamped inputs,
  blend-not-snap reconciliation, and a 3-browser soak test.

## Gaps (skill's target)

1. **Ship-gates inconsistent:** s1 shipped with no latency/skew testing at
   all; no run performed the full set (latency simulation + desync harness +
   cheat probe + disconnect/rejoin). Verification appears when the scenario
   smells like netcode, not as a standing gate.
2. Numbers (tick/send tiers, buffer sizes, budgets) re-derived per run —
   fine at this tier, but uncodified for cheaper tiers and for consistency
   across sessions.

## Conclusion → skill scope

Knowledge-injection + gate contract (the scoping doc's intended shape,
confirmed by RED): the netcode reference carries the patterns/numbers; the
SKILL.md mandates authority-decision-first, the ship-gate checklist on every
multiplayer feature, and proportionality statements. No judgment re-teaching.
