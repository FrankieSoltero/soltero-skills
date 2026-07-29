---
name: multiplayer-game-dev
description: Use when building or reviewing real-time multiplayer game features on a web stack — mini-games in shared sessions, avatar/cursor sync, movement, physics races, netcode, desync bugs, game loops, lag/jitter complaints, WebSocket game rooms (TypeScript/Node + browser; not engine-specific). Carries the netcode reference (authority, tick/snapshot/interpolation numbers, prediction, determinism) and enforces the ship-gates: authority decided first, and every feature tested under simulated latency with a desync harness and cheat probe before "done".
---

# Multiplayer Game Dev (web stack)

## Overview

Netcode judgment is strong when the problem is in view; what slips is the
STANDING discipline — s1-style features ship with zero latency testing when
nothing in the ask smells broken. This skill injects the patterns with
numbers ([references/netcode.md](references/netcode.md) — read it before
designing) and makes the gates unconditional.

## The Rules

1. **Authority first, stated in the design.** Server owns outcomes (results,
   scores, timers, positions); clients send inputs/intents. Client
   `Date.now()` never crosses machines for fairness (skew + forgeable);
   client-local DURATIONS (performance.now deltas) are the honest cheap
   alternative when server measurement is overkill. Write down which threats
   you're accepting and why (proportionality is fine; silence is not).
2. **Simulation discipline:** fixed timestep + accumulator (never raw
   rAF/setInterval deltas into physics); send rate ≠ tick rate; snapshots
   batched per tick; interpolation buffer (~100ms) for remote entities;
   prediction + reconciliation for own entity. Numbers and tiers in the
   reference.
3. **Determinism honestly:** cross-client float sim from shared inputs
   drifts (variable dt, unseeded RNG, transcendentals, iteration order).
   Fix = authoritative sim (default) or true lockstep (seeded PRNG, fixed
   dt, ordered inputs) — plus state-hash desync DETECTION either way.
   Snapping to a peer elects a hidden laggy authority; not a fix.
4. **Validate every game-affecting client message:** identity, plausibility
   ranges, rate limits, duplicate/replay rejection; backpressure
   (`bufferedAmount`) so one slow client can't balloon memory; timers
   cleaned up on room teardown.

## Ship-Gates (run before calling ANY multiplayer feature done — no
"it's a party game" exemption; scale the anti-cheat, never the gates)

```
[ ] Latency: exercised under simulated 100–200ms asymmetric latency + jitter
    (DevTools throttling / socket delay wrapper) — localhost is not a test
[ ] Desync: two clients, same inputs, state compared (hash or visual soak
    3+ min) — for any feature with client-side simulation
[ ] Cheat probe: forged/malformed/impossible messages rejected server-side
    (wrong sender, out-of-range, inhuman rates, duplicate submissions)
[ ] Lifecycle: disconnect + rejoin mid-game; empty-room timer cleanup
Report the gates run and their results with the delivery.
```

| Excuse | Reality |
|--------|---------|
| "It's teammates for bragging rights" | Scale anti-cheat down, never the gates — skew and disconnects hit friendly games too. |
| "Works on localhost" | Localhost has 0ms symmetric latency. The bugs live at 150ms asymmetric. |
| "Send more often to fix jitter" | Jitter is delivery variance. Buffer + interpolate; throttle sends. |
| "Snap everyone to player 1" | A backgrounded tab as authority. Server sim or lockstep + desync detection. |

---

*Engine-agnostic keepers adapted from msitarzewski/agency-agents multiplayer
engineers (MIT); Unity/Godot/Unreal specifics discarded. Scoped to the
multiplayer_ai project's browser/WebSocket stack.*
